"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ChevronRight,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Star,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatPrice, cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

interface ProductDetailClientProps {
  product: Product & {
    categories?: { id: string; name: string; slug: string } | null;
    collections?: { id: string; name: string; slug: string } | null;
  };
  relatedProducts: Product[];
}

export function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { addItem: addToWishlist, isInWishlist, removeItem: removeFromWishlist } = useWishlist();

  const inWishlist = isInWishlist(product.id);
  const images = product.images || [];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  const handleWishlistClick = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <Layout>
      <div className="pt-20">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/shop" className="hover:text-foreground">
              Shop
            </Link>
            {product.categories && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link
                  href={`/shop?category=${product.categories.slug}`}
                  className="hover:text-foreground"
                >
                  {product.categories.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                <Image
                  src={images[selectedImage] || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                {product.original_price && product.original_price > product.price && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-destructive text-destructive-foreground text-sm rounded">
                    {Math.round(
                      ((product.original_price - product.price) / product.original_price) * 100
                    )}
                    % OFF
                  </span>
                )}
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden bg-muted",
                        selectedImage === index && "ring-2 ring-primary"
                      )}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {product.collections && (
                <Link
                  href={`/collections/${product.collections.slug}`}
                  className="text-primary text-sm tracking-widest uppercase hover:underline"
                >
                  {product.collections.name}
                </Link>
              )}

              <h1 className="font-heading text-3xl lg:text-4xl font-semibold mt-2 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < 4 ? "text-primary fill-primary" : "text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  (24 reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="font-heading text-3xl text-primary font-semibold">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {product.description}
              </p>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-card rounded-lg">
                {product.material && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Material
                    </span>
                    <p className="font-medium">{product.material}</p>
                  </div>
                )}
                {product.weight && (
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Weight
                    </span>
                    <p className="font-medium">{product.weight}</p>
                  </div>
                )}
                {product.gender && (
                  <div>
                    <span className="text-sm text-muted-foreground">For</span>
                    <p className="font-medium">{product.gender}</p>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {(product.stock_quantity || 0) > 0 ? (
                  <span className="text-sm text-green-500">
                    ✓ In Stock ({product.stock_quantity} available)
                  </span>
                ) : (
                  <span className="text-sm text-destructive">Out of Stock</span>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12 flex items-center justify-center hover:bg-muted"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock_quantity || 0, quantity + 1))
                    }
                    className="h-12 w-12 flex items-center justify-center hover:bg-muted"
                    disabled={quantity >= (product.stock_quantity || 0)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={(product.stock_quantity || 0) === 0}
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleWishlistClick}
                  className={cn(inWishlist && "border-primary text-primary")}
                >
                  <Heart
                    className={cn("h-5 w-5", inWishlist && "fill-primary")}
                  />
                </Button>
              </div>

              {/* Share */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                <span className="text-sm text-muted-foreground">Share:</span>
                <button className="hover:text-primary">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">Free Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">Certified</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <span className="text-muted-foreground">30-Day Returns</span>
                </div>
              </div>

              {/* Specifications & Care Instructions Accordion */}
              <Accordion type="multiple" className="mt-8" defaultValue={["specifications"]}>
                {/* Specifications */}
                {product.specifications && Object.keys(product.specifications as Record<string, string>).length > 0 && (
                  <AccordionItem value="specifications" className="border-b border-border">
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="font-medium">Specifications</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {Object.entries(product.specifications as Record<string, string>).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between border-b border-border/50 pb-2">
                              <span className="text-muted-foreground">{key}</span>
                              <span className="font-medium text-foreground">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Care Instructions */}
                {product.care_instructions && product.care_instructions.length > 0 && (
                  <AccordionItem value="care" className="border-b border-border">
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        <span className="font-medium">Care Instructions</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ul className="space-y-2">
                        {product.care_instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </motion.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="font-heading text-2xl font-semibold mb-8">
                You May Also Like
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((item, index) => (
                  <ProductCard key={item.id} product={item} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
