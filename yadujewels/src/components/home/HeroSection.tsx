"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    title: "Timeless Elegance",
    subtitle: "New Collection 2024",
    description:
      "Discover exquisite handcrafted jewelry that tells your unique story",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1920&q=80",
    cta: { text: "Shop Collection", href: "/collections" },
  },
  {
    id: 2,
    title: "Bridal Collection",
    subtitle: "For Your Special Day",
    description: "Stunning pieces crafted for life's most precious moments",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1920&q=80",
    cta: { text: "Explore Bridal", href: "/shop?collection=bridal" },
  },
  {
    id: 3,
    title: "Heritage Craft",
    subtitle: "Artisan Excellence",
    description:
      "Centuries of tradition meet contemporary design in every piece",
    image:
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1920&q=80",
    cta: { text: "Our Story", href: "/about" },
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative h-full container mx-auto px-4 lg:px-8 flex items-center pt-16 md:pt-0">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="inline-block text-primary font-body text-sm tracking-widest uppercase mb-3 md:mb-4">
                {slides[currentSlide].subtitle}
              </span>
              <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-semibold text-white mb-4 md:mb-6 leading-tight">
                {slides[currentSlide].title}
              </h1>
              <p className="text-base md:text-lg text-white/80 mb-6 md:mb-8 max-w-lg">
                {slides[currentSlide].description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button variant="hero" size="lg" className="w-full sm:w-auto" asChild>
                  <Link href={slides[currentSlide].cta.href}>
                    {slides[currentSlide].cta.text}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="gold-outline"
                  size="lg"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/shop">View All</Link>
                </Button>
              </div>

              {/* Arrow Navigation */}
              <div className="flex items-center gap-4 mt-6 md:mt-8">
                <button
                  onClick={prevSlide}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </button>
                <button
                  onClick={nextSlide}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "w-8 bg-primary"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
