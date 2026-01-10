"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthSync } from "@/components/AuthSync";
import { useState, useCallback } from "react";

/**
 * Application Providers Component
 * Wraps the app with necessary context providers
 * Follows Dependency Inversion Principle - high-level modules depend on abstractions
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient with optimized defaults
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 1 minute
            staleTime: 60 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Disable automatic refetching to reduce API calls
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // Retry failed requests with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  // Error handler for global error boundary
  const handleError = useCallback((error: Error) => {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Application error:", error);
    }
    // In production, you could send to error tracking service
  }, []);

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                {/* AuthSync handles cart/wishlist merge on login */}
                <AuthSync />
                {children}
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
