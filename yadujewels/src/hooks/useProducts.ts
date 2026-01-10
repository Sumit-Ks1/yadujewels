"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export interface ProductFilters {
  category_id?: string;
  category?: string; // category slug
  collection_id?: string;
  in_stock?: boolean;
  is_best_seller?: boolean;
  is_new?: boolean;
  search?: string;
  gender?: string;
  material?: string;
  priceMin?: number;
  priceMax?: number;
  minPrice?: number; // alias for priceMin
  maxPrice?: number; // alias for priceMax
  sortBy?: "newest" | "price-asc" | "price-desc" | "best-sellers";
}

export function useProducts(filters?: ProductFilters) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["products", filters],
    queryFn: async (): Promise<Product[]> => {
      // Abort controller for request cancellation
      const controller = new AbortController();
      
      // Use left join (default) so products without categories are still returned
      // Only use inner join when filtering by category
      const selectClause = filters?.category 
        ? "*, categories!inner(name, slug)"
        : "*, categories(name, slug)";
      
      let query = supabase
        .from("products")
        .select(selectClause)
        .order("created_at", { ascending: false });

      if (filters?.category_id) {
        query = query.eq("category_id", filters.category_id);
      }
      // Filter by category slug
      if (filters?.category) {
        query = query.eq("categories.slug", filters.category);
      }
      if (filters?.collection_id) {
        query = query.eq("collection_id", filters.collection_id);
      }
      if (filters?.in_stock !== undefined) {
        query = query.eq("in_stock", filters.in_stock);
      }
      if (filters?.is_best_seller) {
        query = query.eq("is_best_seller", true);
      }
      if (filters?.is_new) {
        query = query.eq("is_new", true);
      }
      // Gender filter - case-insensitive match
      if (filters?.gender && filters.gender !== "all" && filters.gender !== "") {
        query = query.ilike("gender", filters.gender);
      }
      if (filters?.material) {
        query = query.ilike("material", `%${filters.material}%`);
      }
      // Support both priceMin/priceMax and minPrice/maxPrice
      const minPrice = filters?.priceMin ?? filters?.minPrice;
      const maxPrice = filters?.priceMax ?? filters?.maxPrice;
      if (minPrice !== undefined) {
        query = query.gte("price", minPrice);
      }
      if (maxPrice !== undefined) {
        query = query.lte("price", maxPrice);
      }
      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
    // Cache for 5 minutes, consider stale after 1 minute
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes (garbage collection)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useProduct(id: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (data: ProductInsert) => {
      const { data: result, error } = await supabase
        .from("products")
        .insert(data as never)
        .select()
        .single();

      if (error) throw error;
      return result as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: ProductUpdate & { id: string }) => {
      console.log("Updating product:", id, data);
      const { data: result, error } = await supabase
        .from("products")
        .update(data as never)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }
      console.log("Update result:", result);
      return result as Product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast.error(error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
