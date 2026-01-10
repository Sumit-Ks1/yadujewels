"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useCollections } from "@/hooks/useCollections";

export default function CollectionsPage() {
  const { data: collections, isLoading } = useCollections();

  return (
    <Layout>
      <div className="pt-20">
        {/* Hero */}
        <div className="relative h-64 bg-card overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />
          <div className="container mx-auto px-4 lg:px-8 h-full flex items-center relative">
            <div>
              <h1 className="font-heading text-4xl lg:text-5xl font-semibold">
                Our Collections
              </h1>
              <p className="text-muted-foreground mt-2 max-w-lg">
                Explore our carefully curated collections, each telling a unique
                story of craftsmanship and elegance
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-16">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-muted rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections?.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link
                    href={`/shop?collection=${collection.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={collection.image || "/placeholder.svg"}
                        alt={collection.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h2 className="font-heading text-2xl font-semibold text-white mb-2">
                          {collection.name}
                        </h2>
                        {collection.description && (
                          <p className="text-white/80 text-sm line-clamp-2 mb-4">
                            {collection.description}
                          </p>
                        )}
                        <span className="inline-flex items-center text-primary text-sm font-medium">
                          Shop Collection
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
