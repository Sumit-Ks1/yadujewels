"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, cn } from "@/lib/utils";

export function BestSellers() {
  const { data: products, isLoading } = useProducts({ is_best_seller: true });
  const { addItem } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();

  const bestSellers = products?.slice(0, 4) || [];

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary text-sm tracking-widest uppercase">
              Customer Favorites
            </span>
            <h2 className="font-heading text-4xl font-semibold mt-2">
              Best Sellers
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary text-sm tracking-widest uppercase">
            Customer Favorites
          </span>
          <h2 className="font-heading text-4xl font-semibold mt-2">
            Best Sellers
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Our most loved pieces, chosen by customers who appreciate timeless
            elegance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {bestSellers.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                <Image
                  src={product.images?.[0] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <Button
                    variant="icon"
                    size="icon-sm"
                    className="bg-white text-black hover:bg-primary hover:text-white"
                    onClick={() => addItem(product)}
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="icon"
                    size="icon-sm"
                    className={cn(
                      "bg-white text-black hover:bg-primary hover:text-white",
                      isInWishlist(product.id) && "bg-primary text-white"
                    )}
                    onClick={() => addToWishlist(product)}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="icon"
                    size="icon-sm"
                    className="bg-white text-black hover:bg-primary hover:text-white"
                    asChild
                  >
                    <Link href={`/product/${product.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.is_new && (
                    <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded">
                      New
                    </span>
                  )}
                  {product.original_price && product.original_price > product.price && (
                    <span className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded">
                      Sale
                    </span>
                  )}
                </div>
              </div>

              <Link href={`/product/${product.id}`} className="block">
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary font-medium">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="gold-outline" size="lg" asChild>
            <Link href="/shop">View All Products</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
