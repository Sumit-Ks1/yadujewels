"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BrandStory() {
  return (
    <section className="py-20 bg-background overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80"
                alt="Artisan crafting jewelry"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute -bottom-8 -right-8 w-48 h-48 border-2 border-primary rounded-lg hidden lg:block" />
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary/10 rounded-lg hidden lg:block" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-primary text-sm tracking-widest uppercase">
              Our Story
            </span>
            <h2 className="font-heading text-4xl lg:text-5xl font-semibold mt-2 mb-6">
              Crafting Elegance 
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Designed for college students, young professionals, and everyday
              moments, our collections blend minimal elegance with modern
              trends—pieces you can wear to class, work, dates, or celebrations
              without overthinking it.
            </p>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              YaduJewels is a new-age online jewelry store built for people who
              love fine design without the old-school price tags or formality.
              We started with one simple idea: great jewelry should fit your
              lifestyle, not sit in a locker.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="gold" size="lg" asChild>
                <Link href="/about">
                  Discover Our Heritage
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 pt-12 border-t border-border">
              {/* <div>
                <span className="font-heading text-3xl lg:text-4xl text-primary font-semibold">
                  38+
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  Years of Excellence
                </p>
              </div> */}
              <div>
                <span className="font-heading text-3xl lg:text-4xl text-primary font-semibold">
                  10K+
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  Happy Customers
                </p>
              </div>
              <div>
                <span className="font-heading text-3xl lg:text-4xl text-primary font-semibold">
                  Every week
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  Unique Designs
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
