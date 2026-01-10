"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useWishlist, type WishlistItem } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();

  const handleMoveToCart = (item: WishlistItem) => {
    addToCart(item.product);
    removeItem(item.product.id);
  };

  return (
    <Layout>
      <div className="pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <h1 className="font-heading text-3xl font-semibold mb-8">
            My Wishlist
          </h1>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="font-heading text-2xl font-medium mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Start adding pieces you love to your wishlist
              </p>
              <Button variant="gold" asChild>
                <Link href="/shop">Explore Shop</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {items.map((item, index) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                    <Image
                      src={item.product.images?.[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />

                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <Link href={`/product/${item.product.id}`} className="block">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-semibold">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.original_price && item.product.original_price > item.product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(item.product.original_price)}
                        </span>
                      )}
                    </div>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => handleMoveToCart(item)}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Move to Cart
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
