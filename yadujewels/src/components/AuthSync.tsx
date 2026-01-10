"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

/**
 * AuthSync Component
 * 
 * Handles synchronization of cart and wishlist data when user authentication state changes.
 * - Merges localStorage data to database on login
 * - Cross-device sync: fetches from DB if user logs in on new device
 * 
 * This component must be rendered inside CartProvider and WishlistProvider.
 */
export function AuthSync() {
  const { user, loading: authLoading } = useAuth();
  const { mergeLocalCartToDb, syncCart, isLoading: cartLoading } = useCart();
  const { mergeLocalWishlistToDb, syncWishlist, isLoading: wishlistLoading } = useWishlist();

  // Track previous user to detect login/logout
  const prevUserRef = useRef<string | null>(null);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserRef.current;

    // Detect login (no previous user, now have user)
    if (currentUserId && !prevUserId && !hasSyncedRef.current) {
      hasSyncedRef.current = true;

      // Merge localStorage data to database
      const performMerge = async () => {
        try {
          await Promise.all([
            mergeLocalCartToDb(),
            mergeLocalWishlistToDb(),
          ]);
          console.log("Cart and wishlist merged to database");
        } catch (error) {
          console.error("Error merging data on login:", error);
        }
      };

      performMerge();
    }

    // Detect logout
    if (!currentUserId && prevUserId) {
      hasSyncedRef.current = false;
    }

    prevUserRef.current = currentUserId;
  }, [user, authLoading, mergeLocalCartToDb, mergeLocalWishlistToDb]);

  // This is a utility component, no UI needed
  return null;
}
