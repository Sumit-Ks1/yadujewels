"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/lib/supabase/types";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];

export interface AddressFormData {
  fullName: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

/**
 * Hook to manage user addresses with optimized caching
 * - Fetches default address for auto-fill
 * - Saves/updates addresses on checkout
 * - Uses staleTime for performance optimization
 */
export function useAddresses() {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch user's default address (or most recent one)
  const {
    data: defaultAddress,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ["user-address", user?.id],
    queryFn: async (): Promise<Address | null> => {
      if (!user) return null;

      // First try to get the default address
      const { data: defaultAddr, error: defaultError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id as never)
        .eq("is_default", true as never)
        .single();

      if (defaultAddr && !defaultError) {
        return defaultAddr as Address;
      }

      // If no default, get the most recently updated address
      const { data: recentAddr, error: recentError } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id as never)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (recentAddr && !recentError) {
        return recentAddr as Address;
      }

      return null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - address rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  });

  // Save or update address mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: AddressFormData) => {
      if (!user) throw new Error("User not authenticated");

      // Check if user already has an address
      const { data: existingData } = await supabase
        .from("addresses")
        .select("id")
        .eq("user_id", user.id as never)
        .limit(1)
        .single();

      const existing = existingData as { id: string } | null;

      const addressPayload: AddressInsert = {
        user_id: user.id,
        full_name: addressData.fullName,
        phone: addressData.phone,
        address_line1: addressData.address,
        address_line2: null,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        country: "India",
        is_default: true,
      };

      if (existing) {
        // Update existing address
        const { data, error } = await supabase
          .from("addresses")
          .update({
            ...addressPayload,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", existing.id as never)
          .select()
          .single();

        if (error) throw error;
        return data as Address;
      } else {
        // Insert new address
        const { data, error } = await supabase
          .from("addresses")
          .insert(addressPayload as never)
          .select()
          .single();

        if (error) throw error;
        return data as Address;
      }
    },
    onSuccess: (data) => {
      // Update cache immediately for instant feedback
      queryClient.setQueryData(["user-address", user?.id], data);
    },
  });

  // Convert database address to form data format
  const getFormDataFromAddress = (address: Address | null): AddressFormData | null => {
    if (!address) return null;
    return {
      fullName: address.full_name,
      phone: address.phone,
      address: address.address_line1,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    };
  };

  return {
    defaultAddress,
    formData: getFormDataFromAddress(defaultAddress ?? null),
    isLoading,
    isFetched,
    saveAddress: saveAddressMutation.mutateAsync,
    isSaving: saveAddressMutation.isPending,
  };
}
