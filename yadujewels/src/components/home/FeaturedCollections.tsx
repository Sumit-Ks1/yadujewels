"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";

export function FeaturedCollections() {
  const { data: collections, isLoading } = useCollections();

  const featuredCollections = collections?.slice(0, 3) || [];

  if (isLoading) {
    return (
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary text-sm tracking-widest uppercase">
              Curated For You
            </span>
            <h2 className="font-heading text-4xl font-semibold mt-2">
              Our Collections
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary text-sm tracking-widest uppercase">
            Curated For You
          </span>
          <h2 className="font-heading text-4xl font-semibold mt-2">
            Our Collections
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Explore our carefully curated collections, each telling a unique
            story of craftsmanship and elegance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredCollections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Link href={`/collections/${collection.slug}`} className="group block">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                  <Image
                    src={collection.image || "/placeholder.svg"}
                    alt={collection.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-heading text-2xl font-semibold text-white mb-2">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-white/80 text-sm line-clamp-2 mb-4">
                        {collection.description}
                      </p>
                    )}
                    <span className="inline-flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                      Explore Collection
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/collections"
            className="inline-flex items-center text-primary font-medium hover:gap-2 transition-all underline-gold"
          >
            View All Collections
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
