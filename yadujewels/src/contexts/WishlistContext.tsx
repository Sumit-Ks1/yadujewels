"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Product } from "@/hooks/useProducts";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

export interface WishlistItem {
  product: Product;
  addedAt: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
  syncWishlist: () => Promise<void>;
  mergeLocalWishlistToDb: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

const WISHLIST_STORAGE_KEY = "yadujewels-wishlist";
const DEBOUNCE_MS = 500; // Debounce database writes

// Helper to get localStorage wishlist
const getLocalWishlist = (): WishlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Error loading wishlist from storage:", error);
  }
  return [];
};

// Helper to save localStorage wishlist
const saveLocalWishlist = (items: WishlistItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving wishlist to storage:", error);
  }
};

// Helper to clear localStorage wishlist
const clearLocalWishlist = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing wishlist from storage:", error);
  }
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const supabase = createClient();

  // Ref for debouncing database writes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDbOpsRef = useRef<Map<string, "insert" | "delete">>(new Map());

  // Fetch wishlist from database for signed-in users
  const fetchWishlistFromDb = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .select(
          `
          id,
          product_id,
          created_at,
          products (*)
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;

      type WishlistItemWithProduct = {
        id: string;
        product_id: string;
        created_at: string;
        products: Product | null;
      };

      return ((data as WishlistItemWithProduct[]) || [])
        .filter((item) => item.products)
        .map((item) => ({
          product: item.products as Product,
          addedAt: item.created_at,
        }));
    } catch (error) {
      console.error("Error fetching wishlist from database:", error);
      return [];
    }
  }, [user, supabase]);

  // Flush pending database operations (debounced batch write)
  const flushDbOperations = useCallback(async () => {
    if (!user || pendingDbOpsRef.current.size === 0) return;

    const operations = new Map(pendingDbOpsRef.current);
    pendingDbOpsRef.current.clear();

    // Batch operations by type
    const deletions: string[] = [];
    const insertions: { user_id: string; product_id: string }[] = [];

    Array.from(operations.entries()).forEach(([productId, action]) => {
      if (action === "delete") {
        deletions.push(productId);
      } else if (action === "insert") {
        insertions.push({
          user_id: user.id,
          product_id: productId,
        });
      }
    });

    try {
      // Batch delete
      if (deletions.length > 0) {
        await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .in("product_id", deletions);
      }

      // Batch insert (use upsert to avoid duplicates)
      if (insertions.length > 0) {
        await supabase
          .from("wishlists")
          .upsert(insertions as never, {
            onConflict: "user_id,product_id",
            ignoreDuplicates: true,
          });
      }
    } catch (error) {
      console.error("Error syncing wishlist to database:", error);
    }
  }, [user, supabase]);

  // Schedule debounced database write
  const scheduleDbSync = useCallback(
    (productId: string, action: "insert" | "delete") => {
      if (!user) return;

      pendingDbOpsRef.current.set(productId, action);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        flushDbOperations();
      }, DEBOUNCE_MS);
    },
    [user, flushDbOperations]
  );

  // Initialize wishlist: Load from localStorage first, then sync with DB if signed in
  useEffect(() => {
    const initializeWishlist = async () => {
      setIsLoading(true);

      // Always load localStorage first for instant UI
      const localItems = getLocalWishlist();
      setItems(localItems);
      setIsHydrated(true);

      if (user) {
        // Signed in: fetch from database
        const dbItems = await fetchWishlistFromDb();

        if (dbItems.length > 0) {
          // User has items in DB, use those
          setItems(dbItems);
          // Clear local storage since we're now using DB
          clearLocalWishlist();
        }
        // If no DB items but local items exist, keep them (merge will happen via mergeLocalWishlistToDb)
      }

      setIsLoading(false);
    };

    initializeWishlist();
  }, [user, fetchWishlistFromDb]);

  // Save to localStorage for guests only
  useEffect(() => {
    if (isHydrated && !user) {
      saveLocalWishlist(items);
    }
  }, [items, isHydrated, user]);

  // Cleanup debounce timer on unmount and flush pending operations
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        flushDbOperations();
      }
    };
  }, [flushDbOperations]);

  // Merge localStorage wishlist to database (called after login)
  const mergeLocalWishlistToDb = useCallback(async () => {
    if (!user) return;

    const localItems = getLocalWishlist();
    if (localItems.length === 0) return;

    try {
      // Fetch current DB items
      const dbItems = await fetchWishlistFromDb();
      const dbProductIds = new Set(dbItems.map((item) => item.product.id));

      // Prepare items to insert (skip duplicates)
      const itemsToInsert = localItems
        .filter((localItem) => !dbProductIds.has(localItem.product.id))
        .map((item) => ({
          user_id: user.id,
          product_id: item.product.id,
        }));

      // Batch insert
      if (itemsToInsert.length > 0) {
        const { error } = await supabase
          .from("wishlists")
          .insert(itemsToInsert as never);
        if (error) throw error;
      }

      // Clear localStorage after successful merge
      clearLocalWishlist();

      // Refresh wishlist from DB
      const mergedItems = await fetchWishlistFromDb();
      setItems(mergedItems);
    } catch (error) {
      console.error("Error merging wishlist to database:", error);
    }
  }, [user, supabase, fetchWishlistFromDb]);

  // Sync wishlist from database (for cross-device sync / manual refresh)
  const syncWishlist = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const dbItems = await fetchWishlistFromDb();
    setItems(dbItems);
    setIsLoading(false);
  }, [user, fetchWishlistFromDb]);

  const addItem = useCallback(
    (product: Product) => {
      setItems((prev) => {
        const exists = prev.find((item) => item.product.id === product.id);
        if (exists) return prev;

        // Schedule DB sync for signed-in users (optimistic update)
        if (user) {
          scheduleDbSync(product.id, "insert");
        }

        return [...prev, { product, addedAt: new Date().toISOString() }];
      });
    },
    [user, scheduleDbSync]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));

      // Schedule DB sync for signed-in users
      if (user) {
        scheduleDbSync(productId, "delete");
      }
    },
    [user, scheduleDbSync]
  );

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.product.id === productId);
    },
    [items]
  );

  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        isInWishlist,
        totalItems,
        syncWishlist,
        mergeLocalWishlistToDb,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
