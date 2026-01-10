export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string;
          address_line2: string | null;
          city: string;
          country: string;
          created_at: string;
          full_name: string;
          id: string;
          is_default: boolean | null;
          phone: string;
          pincode: string;
          state: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address_line1: string;
          address_line2?: string | null;
          city: string;
          country?: string;
          created_at?: string;
          full_name: string;
          id?: string;
          is_default?: boolean | null;
          phone: string;
          pincode: string;
          state: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          country?: string;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_default?: boolean | null;
          phone?: string;
          pincode?: string;
          state?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          image: string | null;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          image?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          order_id: string;
          price: number;
          product_id: string | null;
          product_image: string | null;
          product_name: string;
          quantity: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          order_id: string;
          price: number;
          product_id?: string | null;
          product_image?: string | null;
          product_name: string;
          quantity: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          order_id?: string;
          price?: number;
          product_id?: string | null;
          product_image?: string | null;
          product_name?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          payment_method: string | null;
          payment_status: string | null;
          payment_metadata: Json | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          shipping_address: Json;
          status: string | null;
          total_amount: number;
          tracking_number: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          payment_metadata?: Json | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          shipping_address: Json;
          status?: string | null;
          total_amount: number;
          tracking_number?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          payment_metadata?: Json | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          shipping_address?: Json;
          status?: string | null;
          total_amount?: number;
          tracking_number?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          care_instructions: string[] | null;
          category_id: string | null;
          collection_id: string | null;
          created_at: string;
          description: string | null;
          gender: string | null;
          id: string;
          images: string[] | null;
          in_stock: boolean | null;
          is_best_seller: boolean | null;
          is_new: boolean | null;
          material: string | null;
          name: string;
          original_price: number | null;
          price: number;
          rating: number | null;
          review_count: number | null;
          specifications: Json | null;
          stock_quantity: number | null;
          updated_at: string;
          weight: string | null;
        };
        Insert: {
          care_instructions?: string[] | null;
          category_id?: string | null;
          collection_id?: string | null;
          created_at?: string;
          description?: string | null;
          gender?: string | null;
          id?: string;
          images?: string[] | null;
          in_stock?: boolean | null;
          is_best_seller?: boolean | null;
          is_new?: boolean | null;
          material?: string | null;
          name: string;
          original_price?: number | null;
          price: number;
          rating?: number | null;
          review_count?: number | null;
          specifications?: Json | null;
          stock_quantity?: number | null;
          updated_at?: string;
          weight?: string | null;
        };
        Update: {
          care_instructions?: string[] | null;
          category_id?: string | null;
          collection_id?: string | null;
          created_at?: string;
          description?: string | null;
          gender?: string | null;
          id?: string;
          images?: string[] | null;
          in_stock?: boolean | null;
          is_best_seller?: boolean | null;
          is_new?: boolean | null;
          material?: string | null;
          name?: string;
          original_price?: number | null;
          price?: number;
          rating?: number | null;
          review_count?: number | null;
          specifications?: Json | null;
          stock_quantity?: number | null;
          updated_at?: string;
          weight?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          product_id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          product_id: string;
          rating: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          product_id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: "admin" | "user";
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: "admin" | "user";
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: "admin" | "user";
          user_id?: string;
        };
        Relationships: [];
      };
      wishlists: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decrement_stock: {
        Args: {
          p_product_id: string;
          p_quantity: number;
        };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _user_id: string;
          _role: "admin" | "user";
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier table access
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
