/**
 * Razorpay Create Order API Route
 * 
 * This route creates a Razorpay order and stores the order in our database.
 * The Razorpay order ID is used on the frontend to open the checkout modal.
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Validate cart items and calculate total
 * 3. Create Razorpay order (amount in paise)
 * 4. Create order in our database with razorpay_order_id
 * 5. Return order details to frontend
 */

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// IMPORTANT: Use Node.js runtime for Razorpay SDK and crypto operations
export const runtime = "nodejs";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CartItem {
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
}

interface CreateOrderRequest {
  items: CartItem[];
  total_amount: number; // Total in INR (including shipping, tax)
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
    const body: CreateOrderRequest = await request.json();
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

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(total_amount * 100);

    // Create Razorpay order
    // receipt: unique identifier for this order in our system (will be replaced with actual order ID)
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `temp_${Date.now()}`, // Temporary receipt, will update after DB insert
      notes: {
        user_id: user.id,
        user_email: user.email || "",
        customer_name: shipping_address.fullName,
        customer_phone: shipping_address.phone,
      },
    });

    console.log("[Razorpay] Order created:", razorpayOrder.id);

    // Create order in our database
    // payment_status = 'pending' until payment is verified
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: total_amount,
        shipping_address: shipping_address,
        notes: notes || null,
        status: "pending",
        payment_status: "pending",
        payment_method: "razorpay",
        razorpay_order_id: razorpayOrder.id,
      } as never)
      .select()
      .single();

    if (orderError || !order) {
      console.error("[Razorpay] Failed to create order in database:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Insert order items
    const orderItems = items.map((item) => ({
      order_id: (order as { id: string }).id,
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
      console.error("[Razorpay] Failed to insert order items:", itemsError);
      // Don't fail the whole order, items can be reconciled later
    }

    // Return order details for frontend checkout
    return NextResponse.json({
      success: true,
      order_id: (order as { id: string }).id,
      razorpay_order_id: razorpayOrder.id,
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      prefill: {
        name: shipping_address.fullName,
        email: user.email,
        contact: shipping_address.phone,
      },
    });
  } catch (error) {
    console.error("[Razorpay] Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
