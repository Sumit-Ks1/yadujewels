"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Heart, Shield, Award } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Leaf,
    title: "Sustainability",
    description:
      "We use recycled precious metals and ethically sourced gemstones, minimizing our environmental impact while creating beautiful pieces.",
  },
  {
    icon: Heart,
    title: "Craftsmanship",
    description:
      "Each piece is handcrafted by skilled artisans who bring decades of experience and passion to their work.",
  },
  {
    icon: Shield,
    title: "Quality",
    description:
      "We use only the finest materials and rigorous quality controls to ensure every piece meets our exacting standards.",
  },
  {
    icon: Award,
    title: "Heritage",
    description:
      "Drawing from centuries of Indian jewelry-making traditions, we blend timeless techniques with contemporary design.",
  },
];

const milestones = [
  {
    year: "1985",
    title: "Founded in Mumbai",
    description: "Started as a small family workshop",
  },
  {
    year: "1995",
    title: "First Flagship Store",
    description: "Opened our signature boutique",
  },
  {
    year: "2010",
    title: "Going Digital",
    description: "Launched online presence",
  },
  {
    year: "2020",
    title: "Sustainability Pledge",
    description: "100% recycled gold commitment",
  },
  {
    year: "2024",
    title: "New Era",
    description: "Expanding nationwide with modern e-commerce",
  },
];

export default function AboutPage() {
  return (
    <Layout>
      <div className="pt-20">
        {/* Hero */}
        <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1920&q=80"
            alt="Jewelry craftsmanship"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="container mx-auto px-4 lg:px-8 h-full flex items-center relative">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl"
            >
              <span className="text-primary text-sm tracking-widest uppercase">
                Our Story
              </span>
              <h1 className="font-heading text-4xl lg:text-6xl font-semibold text-white mt-2 mb-6">
                Crafting Elegance
              </h1>
              <p className="text-lg text-white/80 mb-8">
                At YaduJewels, jewelry isn't about occasions—it's about
                self-expression, confidence, and showing up as yourself, every
                day.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-6">
                  Modern Jewelry, Made for Everyday You
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    YaduJewels is a new-age online jewelry store built for
                    people who love fine design without the old-school price
                    tags or formality. We started with one simple idea: great
                    jewelry should fit your lifestyle, not sit in a locker.
                  </p>
                  <p>
                    Designed for college students, young professionals, and
                    everyday moments, our collections blend minimal elegance
                    with modern trends—pieces you can wear to class, work,
                    dates, or celebrations without overthinking it.
                  </p>
                  <p>
                    We focus on clean designs, durable quality, and ethically
                    sourced materials, ensuring every piece looks good, feels
                    good, and lasts longer than fast fashion alternatives. By
                    operating online-first, we cut out unnecessary middlemen and
                    pass the value directly to you.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=800&q=80"
                    alt="Artisan at work"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-48 h-48 border-2 border-primary rounded-lg -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="text-primary text-sm tracking-widest uppercase">
                What Drives Us
              </span>
              <h2 className="font-heading text-3xl lg:text-4xl font-semibold mt-2">
                Our Values
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-medium mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        {/* <section className="py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="text-primary text-sm tracking-widest uppercase">
                Our Journey
              </span>
              <h2 className="font-heading text-3xl lg:text-4xl font-semibold mt-2">
                Milestones
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex gap-6 mb-8 last:mb-0"
                >
                  <div className="w-20 flex-shrink-0 text-right">
                    <span className="font-heading text-2xl text-primary font-semibold">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="relative flex-1 pb-8 pl-6 border-l border-border">
                    <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary" />
                    <h3 className="font-medium text-lg">{milestone.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {milestone.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section> */}

        {/* CTA */}
        <section className="py-20 bg-card">
          <div className="container mx-auto px-4 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading text-3xl font-semibold mb-4">
                Discover Our Collections
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Explore our carefully curated pieces and find the perfect
                expression of your unique style.
              </p>
              <Button variant="gold" size="lg" asChild>
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
