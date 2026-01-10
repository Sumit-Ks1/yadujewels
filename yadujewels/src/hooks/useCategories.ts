"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithCount extends Category {
  product_count: number;
}

export function useCategories() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (catError) throw catError;

      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("category_id");

      if (prodError) throw prodError;

      const countMap = new Map<string, number>();
      (products as { category_id: string | null }[] || []).forEach((p) => {
        if (p.category_id) {
          countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
        }
      });

      return (categories || []).map((cat) => ({
        ...(cat as Category),
        product_count: countMap.get((cat as Category).id) || 0,
      }));
    },
  });
}

export function useCategoriesWithProductCount() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["categories-with-count"],
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const { data: categories, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (catError) throw catError;

      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("category_id");

      if (prodError) throw prodError;

      const countMap = new Map<string, number>();
      (products as { category_id: string | null }[] || []).forEach((p) => {
        if (p.category_id) {
          countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
        }
      });

      return (categories || []).map((cat) => ({
        ...(cat as Category),
        product_count: countMap.get((cat as Category).id) || 0,
      }));
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (data: TablesInsert<"categories">) => {
      const { data: result, error } = await supabase
        .from("categories")
        .insert(data as never)
        .select()
        .single();

      if (error) throw error;
      return result as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-count"] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string } & TablesUpdate<"categories">) => {
      const { data: result, error } = await supabase
        .from("categories")
        .update(data as never)
        .eq("id", id as never)
        .select()
        .single();

      if (error) throw error;
      return result as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-count"] });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories-with-count"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
