"use client";

import { motion } from "framer-motion";
import { Truck, Shield, RotateCcw, Headphones } from "lucide-react";

const highlights = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On every order",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% secure checkout",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "5-day return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated customer care",
  },
];

export function TrustHighlights() {
  return (
    <section className="py-12 bg-primary/5 border-y border-border">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
