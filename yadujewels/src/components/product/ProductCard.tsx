"use client";

import { memo, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

interface ProductCardProps {
  product: Product;
  index?: number;
}

/**
 * Optimized ProductCard component
 * Uses React.memo for shallow comparison to prevent unnecessary re-renders
 * Follows Single Responsibility Principle - only handles product display
 */
function ProductCardComponent({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlist();

  const inWishlist = isInWishlist(product.id);

  // Memoize handlers to prevent child re-renders
  const handleWishlistClick = useCallback(() => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }, [inWishlist, product, addToWishlist, removeFromWishlist]);

  const handleAddToCart = useCallback(() => {
    addItem(product);
  }, [addItem, product]);

  // Memoize computed values
  const discountPercentage = useMemo(() => {
    if (product.original_price && product.original_price > product.price) {
      return Math.round(((product.original_price - product.price) / product.original_price) * 100);
    }
    return 0;
  }, [product.original_price, product.price]);

  const isOutOfStock = product.stock_quantity === 0 || product.stock_quantity === null;
  const imageUrl = product.images?.[0] || "/placeholder.svg";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group"
    >
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          loading="lazy"
        />

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Button
            variant="icon"
            size="icon-sm"
            className="bg-white text-black hover:bg-primary hover:text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingBag className="h-4 w-4" />
          </Button>
          <Button
            variant="icon"
            size="icon-sm"
            className={cn(
              "transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75",
              inWishlist
                ? "bg-primary text-white"
                : "bg-white text-black hover:bg-primary hover:text-white"
            )}
            onClick={handleWishlistClick}
          >
            <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
          </Button>
          <Button
            variant="icon"
            size="icon-sm"
            className="bg-white text-black hover:bg-primary hover:text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-150"
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
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
              New
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded">
              {discountPercentage}% OFF
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick wishlist button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors lg:hidden"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              inWishlist ? "text-primary fill-primary" : "text-foreground"
            )}
          />
        </button>
      </div>

      <Link href={`/product/${product.id}`} className="block">
        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
          {product.material && <span>{product.material}</span>}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-primary font-semibold">
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
  );
}

// Export memoized component - only re-renders when product or index changes
export const ProductCard = memo(ProductCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock_quantity === nextProps.product.stock_quantity &&
    prevProps.index === nextProps.index
  );
});
