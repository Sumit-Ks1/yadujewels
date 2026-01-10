/**
 * Razorpay Verify Payment API Route
 * 
 * This route verifies the payment signature after Razorpay checkout completes.
 * The frontend calls this with the payment response from Razorpay.
 * 
 * SECURITY: 
 * - Signature verification is MANDATORY to confirm payment authenticity
 * - Uses HMAC SHA256 with the Razorpay secret key
 * - Never trust frontend payment status - always verify server-side
 * 
 * Flow:
 * 1. Receive razorpay_order_id, razorpay_payment_id, razorpay_signature
 * 2. Verify signature using HMAC SHA256
 * 3. Update order with payment details
 * 4. Update payment_status to 'paid'
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decrementStock } from "@/lib/stockManagement";

// IMPORTANT: Use Node.js runtime for crypto operations
export const runtime = "nodejs";

// Admin client for stock updates (bypasses RLS)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string; // Our internal order ID
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    const body: VerifyPaymentRequest = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;


    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return NextResponse.json(
        { error: "Missing required payment details" },
        { status: 400 }
      );
    }


    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !orderData) {
      console.error("[Razorpay] Order not found:", order_id);
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Type assertion for order
    const order = orderData as {
      id: string;
      user_id: string | null;
      razorpay_order_id: string | null;
      payment_status: string | null;
    };

    // Verify the order belongs to this user
    if (order.user_id !== user.id) {
      console.error("[Razorpay] User mismatch:", { order_user: order.user_id, current_user: user.id });
      return NextResponse.json(
        { error: "Unauthorized access to order" },
        { status: 403 }
      );
    }

    // Verify the razorpay_order_id matches
    if (order.razorpay_order_id !== razorpay_order_id) {
      console.error("[Razorpay] Order ID mismatch:", { 
        stored: order.razorpay_order_id, 
        received: razorpay_order_id 
      });
      return NextResponse.json(
        { error: "Order ID mismatch" },
        { status: 400 }
      );
    }

    // Check if payment is already marked as paid (idempotency)
    if (order.payment_status === "paid") {
      console.log("[Razorpay] Payment already verified for order:", order_id);
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
        order_id: order_id,
      });
    }

    // CRITICAL: Verify payment signature using HMAC SHA256
    // Signature = HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, secret)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValidSignature = expectedSignature === razorpay_signature;

    if (!isValidSignature) {
      console.error("[Razorpay] Invalid payment signature for order:", order_id);
      
      // Update order with failed status
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          payment_metadata: {
            verification_failed: true,
            razorpay_payment_id,
            error: "Signature verification failed",
            timestamp: new Date().toISOString(),
          },
        } as never)
        .eq("id", order_id);

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    console.log("[Razorpay] Signature verified for order:", order_id);

    // Update order with successful payment details
    // State transition: pending -> paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        payment_status: "paid",
        status: "processing", // Move order to processing after payment
        payment_metadata: {
          verified_at: new Date().toISOString(),
          verification_method: "signature",
        },
      } as never)
      .eq("id", order_id);

    if (updateError) {
      console.error("[Razorpay] Failed to update order:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    // Fetch order items to decrement stock
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", order_id);

    if (itemsError) {
      console.warn("[Razorpay] Failed to fetch order items for stock update:", itemsError);
    } else if (orderItems && orderItems.length > 0) {
      // Decrement stock for all ordered items using admin client (bypasses RLS)
      const adminClient = createAdminClient();
      const stockResult = await decrementStock(
        adminClient,
        (orderItems as { product_id: string; quantity: number }[]).map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      );

      if (!stockResult.success) {
        console.warn("[Razorpay] Some stock updates failed:", stockResult.errors);
        // Don't fail the payment verification - stock can be reconciled manually
      } else {
        console.log("[Razorpay] Stock updated for products:", stockResult.updatedProducts);
      }
    }

    console.log("[Razorpay] Payment verified successfully for order:", order_id);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      order_id: order_id,
    });
  } catch (error) {
    console.error("[Razorpay] Verify payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
