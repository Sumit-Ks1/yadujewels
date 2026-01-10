-- Add unique constraint for cart_items (user_id, product_id) to enable upsert
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id);

-- Add unique constraint for wishlists (user_id, product_id) to prevent duplicates
ALTER TABLE wishlists
ADD CONSTRAINT wishlists_user_product_unique UNIQUE (user_id, product_id);

-- Add index for faster cart lookups
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- Add index for faster wishlist lookups
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
