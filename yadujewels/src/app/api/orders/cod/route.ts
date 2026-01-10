/**
 * COD (Cash on Delivery) Order API Route
 * 
 * This route creates an order with COD payment method.
 * No payment is required upfront - customer pays on delivery.
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Validate cart items and shipping address
 * 3. Create order in database with payment_method = 'cod', payment_status = 'pending'
 * 4. Return order details to frontend
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { decrementStock } from "@/lib/stockManagement";

export const runtime = "nodejs";

// Admin client for stock updates (bypasses RLS)
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CartItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

interface CreateCODOrderRequest {
  items: CartItem[];
  total_amount: number;
  shipping_address: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    // Parse request body
    const body: CreateCODOrderRequest = await request.json();
    const { items, total_amount, shipping_address, notes } = body;

    // Validate request
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!total_amount || total_amount <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    if (!shipping_address || !shipping_address.fullName || !shipping_address.phone) {
      return NextResponse.json(
        { error: "Shipping address is required" },
        { status: 400 }
      );
    }

    // Optional: Add COD limit (e.g., max ₹50,000 for COD orders)
    const COD_LIMIT = 50000;
    if (total_amount > COD_LIMIT) {
      return NextResponse.json(
        { error: `Cash on Delivery is available only for orders up to ₹${COD_LIMIT.toLocaleString()}` },
        { status: 400 }
      );
    }

    console.log("[COD] Creating order for user:", user.id);

    // Create order in database
    // For COD: payment_status = 'pending' (will be marked 'paid' when delivered)
    // status = 'pending' initially (admin will update to processing)
    const orderData = {
      user_id: user.id,
      total_amount: total_amount,
      shipping_address: shipping_address,
      notes: notes || null,
      status: "pending",
      payment_status: "pending", // Will be collected on delivery
      payment_method: "cod",
    };

    console.log("[COD] Order data:", JSON.stringify(orderData));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData as never)
      .select()
      .single();

    if (orderError || !order) {
      console.error("[COD] Failed to create order:", orderError?.message, orderError?.details, orderError?.hint);
      return NextResponse.json(
        { error: `Failed to create order: ${orderError?.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    const orderId = (order as { id: string }).id;
    console.log("[COD] Order created:", orderId);

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: orderId,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems as never);

    if (itemsError) {
      console.error("[COD] Failed to insert order items:", itemsError);
      // Don't fail the whole order, items can be reconciled later
    }

    // Decrement stock for all ordered items using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    const stockResult = await decrementStock(
      adminClient,
      items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }))
    );

    if (!stockResult.success) {
      console.warn("[COD] Some stock updates failed:", stockResult.errors);
      // Don't fail the order - stock can be reconciled manually
    } else {
      console.log("[COD] Stock updated for products:", stockResult.updatedProducts);
    }

    console.log("[COD] Order completed successfully:", orderId);

    return NextResponse.json({
      success: true,
      order_id: orderId,
      payment_method: "cod",
      message: "Order placed successfully! Pay on delivery.",
    });

  } catch (error) {
    console.error("[COD] Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
