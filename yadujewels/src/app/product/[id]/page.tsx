import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "./ProductDetailClient";
import type { Tables } from "@/lib/supabase/types";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

type Product = Tables<"products">;

// Generate metadata for SEO
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("products")
    .select("name, description, images")
    .eq("id", id)
    .single();

  const product = data as Pick<Product, "name" | "description" | "images"> | null;

  if (!product) {
    return {
      title: "Product Not Found | YaduJewels",
    };
  }

  return {
    title: `${product.name} | YaduJewels`,
    description: product.description?.slice(0, 160) || `Shop ${product.name} at YaduJewels`,
    openGraph: {
      title: product.name,
      description: product.description || "",
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch product data on server
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      categories(id, name, slug),
      collections(id, name, slug)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const product = data as Product & {
    categories: { id: string; name: string; slug: string } | null;
    collections: { id: string; name: string; slug: string } | null;
  };

  // Fetch related products
  let relatedProducts: Product[] = [];
  if (product.category_id) {
    const { data: relatedData } = await supabase
      .from("products")
      .select("*")
      .neq("id", id)
      .eq("category_id", product.category_id)
      .limit(4);

    relatedProducts = (relatedData || []) as Product[];
  }

  return (
    <ProductDetailClient
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
