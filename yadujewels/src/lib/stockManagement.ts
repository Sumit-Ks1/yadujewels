/**
 * Stock Management Utility
 * 
 * Handles stock decrement when orders are placed.
 * Uses direct database updates with proper error handling.
 */

interface OrderItem {
  product_id: string;
  quantity: number;
}

interface StockUpdateResult {
  success: boolean;
  errors: string[];
  updatedProducts: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientType = any;

/**
 * Decrements stock for multiple products in an order.
 * Also updates in_stock status based on remaining quantity.
 * 
 * @param supabase - Supabase client instance
 * @param items - Array of order items with product_id and quantity
 * @returns Result object with success status and any errors
 */
export async function decrementStock(
  supabase: SupabaseClientType,
  items: OrderItem[]
): Promise<StockUpdateResult> {
  const errors: string[] = [];
  const updatedProducts: string[] = [];

  for (const item of items) {
    try {
      // First, get current stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("id, name, stock_quantity, in_stock")
        .eq("id", item.product_id)
        .single();

      if (fetchError || !product) {
        errors.push(`Product ${item.product_id} not found`);
        continue;
      }

      const currentStock = product.stock_quantity || 0;
      const newStock = Math.max(0, currentStock - item.quantity);
      const isInStock = newStock > 0;

      // Update stock
      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
          in_stock: isInStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.product_id);

      if (updateError) {
        errors.push(`Failed to update stock for ${product.name}: ${updateError.message}`);
        continue;
      }

      console.log(
        `[Stock] Updated ${product.name}: ${currentStock} -> ${newStock} (ordered: ${item.quantity})`
      );
      updatedProducts.push(item.product_id);
    } catch (error) {
      errors.push(`Error processing product ${item.product_id}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    updatedProducts,
  };
}

/**
 * Restores stock for cancelled/refunded orders.
 * 
 * @param supabase - Supabase client instance
 * @param items - Array of order items with product_id and quantity
 * @returns Result object with success status and any errors
 */
export async function restoreStock(
  supabase: SupabaseClientType,
  items: OrderItem[]
): Promise<StockUpdateResult> {
  const errors: string[] = [];
  const updatedProducts: string[] = [];

  for (const item of items) {
    try {
      // First, get current stock
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .eq("id", item.product_id)
        .single();

      if (fetchError || !product) {
        errors.push(`Product ${item.product_id} not found`);
        continue;
      }

      const currentStock = product.stock_quantity || 0;
      const newStock = currentStock + item.quantity;

      // Update stock
      const { error: updateError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
          in_stock: true, // If we're restoring stock, product is now in stock
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.product_id);

      if (updateError) {
        errors.push(`Failed to restore stock for ${product.name}: ${updateError.message}`);
        continue;
      }

      console.log(
        `[Stock] Restored ${product.name}: ${currentStock} -> ${newStock} (restored: ${item.quantity})`
      );
      updatedProducts.push(item.product_id);
    } catch (error) {
      errors.push(`Error processing product ${item.product_id}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    updatedProducts,
  };
}
