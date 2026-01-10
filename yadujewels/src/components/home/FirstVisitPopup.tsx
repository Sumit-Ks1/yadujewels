"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPUP_STORAGE_KEY = "yadujewels-first-visit-popup-shown";

export function FirstVisitPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if popup has been shown before
    const hasBeenShown = localStorage.getItem(POPUP_STORAGE_KEY);
    
    if (!hasBeenShown) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Mark as shown so it doesn't appear again
    localStorage.setItem(POPUP_STORAGE_KEY, "true");
  };

  // Don't render on server
  if (!isMounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[60] md:hidden"
            onClick={handleDismiss}
          />

          {/* Popup pointing to cart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
            }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            className="fixed z-[70] top-20 right-4 md:right-16 lg:right-28 xl:right-32"
          >
            {/* Bouncing animation wrapper */}
            <motion.div
              animate={{ 
                y: [0, -8, 0],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            >
              {/* Arrow pointing up to cart icon */}
              <div className="flex flex-col items-end">
                <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-primary mr-6" />
                
                {/* Main popup content */}
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl shadow-2xl p-4 max-w-[280px] md:max-w-xs relative">
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="flex items-start gap-3 pr-6">
                    <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-relaxed">
                        Go over here to purchase your added jewels! 
                        <span className="inline-block ml-1">
                          <Sparkles className="h-4 w-4 inline animate-pulse" />
                        </span>
                      </p>
                      <p className="text-xs text-primary-foreground/80 mt-1">
                        Browse our collection and add items to cart
                      </p>
                    </div>
                  </div>

                  {/* Decorative sparkles */}
                  <motion.div
                    className="absolute -top-1 -left-1"
                    animate={{ 
                      rotate: [0, 15, -15, 0],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity 
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-300" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
