"use client";

import { motion } from "framer-motion";
import { Leaf, Recycle, Heart, Shield } from "lucide-react";

const features = [
  {
    icon: Leaf,
    title: "Ethically Sourced",
    description:
      "All our materials are responsibly sourced from certified suppliers who prioritize ethical practices.",
  },
  {
    icon: Recycle,
    title: "Sustainable Craft",
    description:
      "We use recycled precious metals and eco-friendly processes to minimize our environmental footprint.",
  },
  {
    icon: Heart,
    title: "Artisan Made",
    description:
      "Each piece is handcrafted by skilled artisans, preserving traditional techniques and supporting local communities.",
  },
  {
    icon: Shield,
    title: "Lifetime Quality",
    description:
      "Our jewelry is built to last. We offer lifetime maintenance and repair services for all our pieces.",
  },
];

export function SustainabilitySection() {
  return (
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
            Our Commitment
          </span>
          <h2 className="font-heading text-4xl font-semibold mt-2">
            Sustainable Luxury
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            We believe that true luxury should never come at the cost of our
            planet or its people
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-xl font-medium mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
