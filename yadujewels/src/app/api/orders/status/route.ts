import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { restoreStock } from "@/lib/stockManagement";

export const runtime = "nodejs";

// Create a server-side Supabase client with service role key for admin operations
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus, previousStatus } = await request.json();

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: "Order ID and new status are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // If order is being cancelled, restore stock
    if (newStatus === "cancelled" && previousStatus !== "cancelled") {
      // Get order items to restore stock
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId);

      if (itemsError) {
        console.error("Failed to fetch order items:", itemsError);
        return NextResponse.json(
          { error: "Failed to fetch order items" },
          { status: 500 }
        );
      }

      if (orderItems && orderItems.length > 0) {
        const items = orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }));

        const stockResult = await restoreStock(supabase, items);

        if (!stockResult.success) {
          console.error("Stock restoration errors:", stockResult.errors);
          // Still update the status but log the error
        }

        console.log(
          `[Order ${orderId}] Stock restored for ${stockResult.updatedProducts.length} products`
        );
      }
    }

    // Update the order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update order status:", updateError);
      return NextResponse.json(
        { error: "Failed to update order status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message:
        newStatus === "cancelled"
          ? "Order cancelled and stock restored"
          : "Order status updated",
    });
  } catch (error) {
    console.error("Order status update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
