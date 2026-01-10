"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Delhi",
    rating: 5,
    text: "The engagement ring exceeded all my expectations. The craftsmanship is impeccable, and the customer service was exceptional throughout the entire process.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    id: 2,
    name: "Anjali Patel",
    location: "Mumbai",
    rating: 5,
    text: "I purchased a necklace for my mother's birthday, and she was absolutely thrilled. The quality is outstanding, and it arrived beautifully packaged.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  },
  {
    id: 3,
    name: "Meera Krishnan",
    location: "Bangalore",
    rating: 5,
    text: "As someone who appreciates fine jewelry, I can say that YaduJewels truly delivers on their promise of excellence. The attention to detail is remarkable.",
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&q=80",
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);

  const next = () => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

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
            Testimonials
          </span>
          <h2 className="font-heading text-4xl font-semibold mt-2">
            What Our Customers Say
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-2xl p-8 lg:p-12 text-center"
            >
              <Quote className="h-12 w-12 text-primary/30 mx-auto mb-6" />

              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[current].rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-primary fill-primary" />
                ))}
              </div>

              <p className="text-lg lg:text-xl text-foreground/90 mb-8 italic">
                "{testimonials[current].text}"
              </p>

              <div className="flex items-center justify-center gap-4">
                {/* <div className="relative h-14 w-14 rounded-full overflow-hidden">
                  <Image
                    src={testimonials[current].image}
                    alt={testimonials[current].name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div> */}
                <div className="text-left">
                  <h4 className="font-medium">{testimonials[current].name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[current].location}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prev}
                className="h-12 w-12 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="h-12 w-12 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
