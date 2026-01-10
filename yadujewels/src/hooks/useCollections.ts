"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/lib/supabase/types";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithCount extends Collection {
  product_count: number;
}

export function useCollections() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["collections"],
    queryFn: async (): Promise<Collection[]> => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("name");

      if (error) throw error;
      return (data || []) as Collection[];
    },
  });
}

export function useCollectionsWithProductCount() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["collections-with-count"],
    queryFn: async (): Promise<CollectionWithCount[]> => {
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .order("name");

      if (collectionsError) throw collectionsError;

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("collection_id");

      if (productsError) throw productsError;

      const countMap: Record<string, number> = {};
      (products as { collection_id: string | null }[] || []).forEach((p) => {
        if (p.collection_id) {
          countMap[p.collection_id] = (countMap[p.collection_id] || 0) + 1;
        }
      });

      return (collections || []).map((col) => ({
        ...(col as Collection),
        product_count: countMap[(col as Collection).id] || 0,
      }));
    },
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (collection: TablesInsert<"collections">) => {
      const { data, error } = await supabase
        .from("collections")
        .insert(collection as never)
        .select()
        .single();

      if (error) throw error;
      return data as Collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-count"] });
      toast.success("Collection created successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to create collection: " + error.message);
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & TablesUpdate<"collections">) => {
      const { data, error } = await supabase
        .from("collections")
        .update(updates as never)
        .eq("id", id as never)
        .select()
        .single();

      if (error) throw error;
      return data as Collection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-count"] });
      toast.success("Collection updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update collection: " + error.message);
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("id", id as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-count"] });
      toast.success("Collection deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete collection: " + error.message);
    },
  });
}
