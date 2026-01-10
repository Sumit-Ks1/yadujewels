"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/lib/supabase/types";

export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  customer_name?: string;
}

export function useOrders() {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<OrderWithItems[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const orders = (data || []) as (Order & { order_items: OrderItem[] })[];

      // Fetch profile names for user_ids
      const userIds = Array.from(
        new Set(orders.map((o) => o.user_id).filter((id): id is string => !!id))
      );
      let profileMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds as never);

        (profiles as { id: string; full_name: string | null }[] || []).forEach((p) => {
          profileMap[p.id] = p.full_name || "Unknown";
        });
      }

      return orders.map((order) => ({
        ...order,
        // All orders require authentication, so user_id is always present
        customer_name: order.user_id ? profileMap[order.user_id] || "Unknown" : "Unknown",
      }));
    },
  });
}

export function useOrder(id: string) {
  const supabase = getSupabaseBrowserClient();

  return useQuery({
    queryKey: ["order", id],
    queryFn: async (): Promise<OrderWithItems> => {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .eq("id", id as never)
        .single();

      if (error) throw error;

      const order = data as Order & { order_items: OrderItem[] };

      let customerName = "Unknown";
      if (order.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", order.user_id as never)
          .single();
        customerName = (profile as { full_name: string | null } | null)?.full_name || "Unknown";
      }

      return { ...order, customer_name: customerName };
    },
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      previousStatus,
    }: {
      id: string;
      status: string;
      previousStatus?: string;
    }) => {
      // Use API route to handle stock restoration on cancellation
      const response = await fetch("/api/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: id,
          newStatus: status,
          previousStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      const data = await response.json();
      return data.order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      payment_status,
    }: {
      id: string;
      payment_status: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ payment_status } as never)
        .eq("id", id as never)
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Payment status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTrackingNumber() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async ({
      id,
      tracking_number,
    }: {
      id: string;
      tracking_number: string;
    }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ tracking_number } as never)
        .eq("id", id as never)
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Tracking number updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

interface CreateOrderInput {
  user_id: string;
  items: {
    product_id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  shipping_address: Record<string, unknown>;
  notes?: string;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const supabase = getSupabaseBrowserClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      // Create the order first
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: input.user_id,
          total_amount: input.total_amount,
          shipping_address: input.shipping_address,
          notes: input.notes,
          status: "pending",
          payment_status: "pending",
        } as never)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = input.items.map((item) => ({
        order_id: (order as Order).id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_image: item.product_image,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems as never);

      if (itemsError) throw itemsError;

      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
