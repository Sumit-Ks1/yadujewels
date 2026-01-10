/**
 * Razorpay Webhook Handler
 * 
 * This route handles webhook events from Razorpay for payment status updates.
 * Webhooks are the source of truth for payment status - they fire even if
 * the user closes the browser or loses connection.
 * 
 * SECURITY:
 * - Webhook signature MUST be verified using HMAC SHA256
 * - Use a separate webhook secret from dashboard
 * - Implement idempotency - same event may be sent multiple times
 * 
 * IMPORTANT STATE TRANSITIONS:
 * - pending -> paid (allowed)
 * - pending -> failed (allowed)
 * - paid -> paid (ignore, idempotent)
 * - paid -> failed (NOT allowed - never downgrade paid status)
 * - paid -> refunded (allowed, but handle separately)
 * 
 * Events handled:
 * - payment.captured: Payment successful
 * - payment.failed: Payment failed
 * - order.paid: Order marked as paid (alternative to payment.captured)
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { decrementStock } from "@/lib/stockManagement";

// IMPORTANT: Use Node.js runtime for crypto operations
export const runtime = "nodejs";

// Create Supabase client with service role key for webhook processing
// Webhooks don't have user context, so we need elevated permissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        card_id?: string;
        error_code?: string;
        error_description?: string;
        error_reason?: string;
        captured: boolean;
        contact: string;
        email: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        status: string;
      };
    };
  };
  created_at: number;
}

/**
 * Verify Razorpay webhook signature
 * Uses HMAC SHA256 with the webhook secret
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as string for signature verification
    const rawBody = await request.text();

    // Get the signature from headers
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.error("[Razorpay Webhook] Missing signature header");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // CRITICAL: Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("[Razorpay Webhook] Webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValidSignature) {
      console.error("[Razorpay Webhook] Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse the webhook payload
    const payload: RazorpayWebhookPayload = JSON.parse(rawBody);
    const event = payload.event;

    console.log("[Razorpay Webhook] Received event:", event);

    switch (event) {
      case "payment.captured":
      case "order.paid":
        await handlePaymentCaptured(payload);
        break;

      case "payment.failed":
        await handlePaymentFailed(payload);
        break;

      default:
        console.log("[Razorpay Webhook] Unhandled event:", event);
    }

    // Always return 200 to acknowledge receipt
    // Razorpay will retry if we don't return 2xx
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    // Return 200 to prevent retries for parsing errors
    // Log the error for investigation
    return NextResponse.json({ received: true, error: "Processing error" });
  }
}

/**
 * Handle successful payment capture
 * Updates order status to 'paid' and stores payment metadata
 */
async function handlePaymentCaptured(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment?.entity;

  if (!payment) {
    console.error("[Razorpay Webhook] No payment entity in payload");
    return;
  }

  const razorpay_order_id = payment.order_id;
  const razorpay_payment_id = payment.id;

  console.log("[Razorpay Webhook] Processing payment.captured:", {
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
  });

  // Find the order by razorpay_order_id
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (fetchError || !order) {
    console.error("[Razorpay Webhook] Order not found:", razorpay_order_id);
    return;
  }

  // IDEMPOTENCY CHECK: Don't process if already paid
  // This prevents issues from duplicate webhook deliveries
  if (order.payment_status === "paid") {
    console.log("[Razorpay Webhook] Order already paid, skipping:", order.id);
    return;
  }

  // STATE TRANSITION: pending -> paid
  // Also update order status to 'processing'
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      razorpay_payment_id: razorpay_payment_id,
      payment_status: "paid",
      status: "processing",
      payment_method: payment.method || "razorpay",
      payment_metadata: {
        captured_via: "webhook",
        captured_at: new Date().toISOString(),
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        bank: payment.bank,
        wallet: payment.wallet,
        vpa: payment.vpa,
        contact: payment.contact,
        email: payment.email,
      },
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("[Razorpay Webhook] Failed to update order:", updateError);
    return;
  }

  // Fetch order items to decrement stock (only if not already done via verify-payment)
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", order.id);

  if (itemsError) {
    console.warn("[Razorpay Webhook] Failed to fetch order items for stock update:", itemsError);
  } else if (orderItems && orderItems.length > 0) {
    // Decrement stock for all ordered items
    const stockResult = await decrementStock(
      supabase,
      (orderItems as { product_id: string; quantity: number }[]).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }))
    );

    if (!stockResult.success) {
      console.warn("[Razorpay Webhook] Some stock updates failed:", stockResult.errors);
    } else {
      console.log("[Razorpay Webhook] Stock updated for products:", stockResult.updatedProducts);
    }
  }

  console.log("[Razorpay Webhook] Order updated to paid:", order.id);
}

/**
 * Handle failed payment
 * Updates order status to 'failed' with error details
 * 
 * IMPORTANT: Never overwrite a 'paid' status with 'failed'
 */
async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = payload.payload.payment?.entity;

  if (!payment) {
    console.error("[Razorpay Webhook] No payment entity in payload");
    return;
  }

  const razorpay_order_id = payment.order_id;

  console.log("[Razorpay Webhook] Processing payment.failed:", {
    order_id: razorpay_order_id,
    error: payment.error_description,
  });

  // Find the order by razorpay_order_id
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (fetchError || !order) {
    console.error("[Razorpay Webhook] Order not found:", razorpay_order_id);
    return;
  }

  // CRITICAL: Never downgrade a 'paid' order to 'failed'
  // This prevents race conditions where webhook arrives out of order
  if (order.payment_status === "paid") {
    console.log("[Razorpay Webhook] Order already paid, ignoring failure:", order.id);
    return;
  }

  // STATE TRANSITION: pending -> failed
  const { error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      payment_metadata: {
        failed_via: "webhook",
        failed_at: new Date().toISOString(),
        error_code: payment.error_code,
        error_description: payment.error_description,
        error_reason: payment.error_reason,
      },
    })
    .eq("id", order.id);

  if (updateError) {
    console.error("[Razorpay Webhook] Failed to update order:", updateError);
    return;
  }

  console.log("[Razorpay Webhook] Order marked as failed:", order.id);
}
