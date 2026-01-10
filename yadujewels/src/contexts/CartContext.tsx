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

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  syncCart: () => Promise<void>;
  mergeLocalCartToDb: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "yadujewels-cart";
const DEBOUNCE_MS = 500; // Debounce database writes to reduce operations

// Helper to get localStorage cart
const getLocalCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Error loading cart from storage:", error);
  }
  return [];
};

// Helper to save localStorage cart
const saveLocalCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving cart to storage:", error);
  }
};

// Helper to clear localStorage cart
const clearLocalCart = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing cart from storage:", error);
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const supabase = createClient();

  // Ref for debouncing database writes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDbOpsRef = useRef<
    Map<string, { action: "upsert" | "delete"; quantity?: number }>
  >(new Map());

  // Fetch cart from database for signed-in users
  const fetchCartFromDb = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          product_id,
          quantity,
          products (*)
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;

      type CartItemWithProduct = {
        id: string;
        product_id: string;
        quantity: number;
        products: Product | null;
      };

      return ((data as CartItemWithProduct[]) || [])
        .filter((item) => item.products)
        .map((item) => ({
          product: item.products as Product,
          quantity: item.quantity,
        }));
    } catch (error) {
      console.error("Error fetching cart from database:", error);
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
    const upserts: { user_id: string; product_id: string; quantity: number }[] =
      [];

    Array.from(operations.entries()).forEach(([productId, op]) => {
      if (op.action === "delete") {
        deletions.push(productId);
      } else if (op.action === "upsert" && op.quantity !== undefined) {
        upserts.push({
          user_id: user.id,
          product_id: productId,
          quantity: op.quantity,
        });
      }
    });

    try {
      // Batch delete
      if (deletions.length > 0) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id)
          .in("product_id", deletions);
      }

      // Batch upsert
      if (upserts.length > 0) {
        const upsertData = upserts.map((item) => ({
          ...item,
          updated_at: new Date().toISOString(),
        }));
        await supabase
          .from("cart_items")
          .upsert(upsertData as never, { onConflict: "user_id,product_id" });
      }
    } catch (error) {
      console.error("Error syncing cart to database:", error);
    }
  }, [user, supabase]);

  // Schedule debounced database write
  const scheduleDbSync = useCallback(
    (productId: string, action: "upsert" | "delete", quantity?: number) => {
      if (!user) return;

      pendingDbOpsRef.current.set(productId, { action, quantity });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        flushDbOperations();
      }, DEBOUNCE_MS);
    },
    [user, flushDbOperations]
  );

  // Initialize cart: Load from localStorage first, then sync with DB if signed in
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true);

      // Always load localStorage first for instant UI
      const localItems = getLocalCart();
      setItems(localItems);
      setIsHydrated(true);

      if (user) {
        // Signed in: fetch from database
        const dbItems = await fetchCartFromDb();

        if (dbItems.length > 0) {
          // User has items in DB, use those
          setItems(dbItems);
          // Clear local storage since we're now using DB
          clearLocalCart();
        }
        // If no DB items but local items exist, keep them (merge will happen via mergeLocalCartToDb)
      }

      setIsLoading(false);
    };

    initializeCart();
  }, [user, fetchCartFromDb]);

  // Save to localStorage for guests only
  useEffect(() => {
    if (isHydrated && !user) {
      saveLocalCart(items);
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

  // Merge localStorage cart to database (called after login)
  const mergeLocalCartToDb = useCallback(async () => {
    if (!user) return;

    const localItems = getLocalCart();
    if (localItems.length === 0) return;

    try {
      // Fetch current DB items
      const dbItems = await fetchCartFromDb();

      // Prepare items to upsert (merge quantities for duplicates)
      const itemsToUpsert: {
        user_id: string;
        product_id: string;
        quantity: number;
      }[] = [];

      for (const localItem of localItems) {
        const existingDbItem = dbItems.find(
          (dbItem) => dbItem.product.id === localItem.product.id
        );

        if (existingDbItem) {
          // Item exists in both - add quantities
          itemsToUpsert.push({
            user_id: user.id,
            product_id: localItem.product.id,
            quantity: existingDbItem.quantity + localItem.quantity,
          });
        } else {
          // New item from local
          itemsToUpsert.push({
            user_id: user.id,
            product_id: localItem.product.id,
            quantity: localItem.quantity,
          });
        }
      }

      // Batch upsert
      if (itemsToUpsert.length > 0) {
        const upsertData = itemsToUpsert.map((item) => ({
          ...item,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await supabase
          .from("cart_items")
          .upsert(upsertData as never, { onConflict: "user_id,product_id" });

        if (error) throw error;
      }

      // Clear localStorage after successful merge
      clearLocalCart();

      // Refresh cart from DB
      const mergedItems = await fetchCartFromDb();
      setItems(mergedItems);
    } catch (error) {
      console.error("Error merging cart to database:", error);
    }
  }, [user, supabase, fetchCartFromDb]);

  // Sync cart from database (for cross-device sync / manual refresh)
  const syncCart = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    const dbItems = await fetchCartFromDb();
    setItems(dbItems);
    setIsLoading(false);
  }, [user, fetchCartFromDb]);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      setItems((prev) => {
        const existingItem = prev.find(
          (item) => item.product.id === product.id
        );
        let newQuantity: number;

        if (existingItem) {
          newQuantity = existingItem.quantity + quantity;
          const newItems = prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          );

          // Schedule DB sync for signed-in users (optimistic update)
          if (user) {
            scheduleDbSync(product.id, "upsert", newQuantity);
          }

          return newItems;
        }

        newQuantity = quantity;
        // Schedule DB sync for signed-in users
        if (user) {
          scheduleDbSync(product.id, "upsert", newQuantity);
        }

        return [...prev, { product, quantity }];
      });
      setIsOpen(true);
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

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter((item) => item.product.id !== productId)
        );
        if (user) {
          scheduleDbSync(productId, "delete");
        }
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );

      if (user) {
        scheduleDbSync(productId, "upsert", quantity);
      }
    },
    [user, scheduleDbSync]
  );

  const clearCart = useCallback(async () => {
    setItems([]);

    if (user) {
      // Clear all cart items from database
      try {
        await supabase.from("cart_items").delete().eq("user_id", user.id);
      } catch (error) {
        console.error("Error clearing cart from database:", error);
      }
    } else {
      clearLocalCart();
    }
  }, [user, supabase]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
        isOpen,
        openCart,
        closeCart,
        syncCart,
        mergeLocalCartToDb,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
