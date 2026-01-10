"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SlidersHorizontal, X, ChevronDown, Grid, List } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

const materials = ["Stainless Steel", "Silver", "Platinum", "Rose Gold", "White Gold"];
const genders = [
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
  { value: "unisex", label: "Unisex" },
];
const priceRanges = [
  { label: "Under ₹299", min: 0, max: 299 },
  { label: "₹299 - ₹499", min: 299, max: 499 },
  { label: "₹500 - ₹799", min: 500, max: 799 },
  { label: "₹800 - ₹999", min: 800, max: 999 },
  { label: "Above ₹1,000", min: 1000, max: 10000000 },
];

export default function ShopPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    material: searchParams.get("material") || "",
    gender: searchParams.get("gender") || "",
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    search: searchParams.get("search") || "",
  });

  const { data: products, isLoading } = useProducts(filters);
  const { data: categories } = useCategories();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.material) params.set("material", filters.material);
    if (filters.gender) params.set("gender", filters.gender);
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (filters.search) params.set("search", filters.search);

    router.replace(`/shop?${params.toString()}`, { scroll: false });
  }, [filters, router]);

  const clearFilters = () => {
    setFilters({
      category: "",
      material: "",
      gender: "",
      minPrice: undefined,
      maxPrice: undefined,
      search: "",
    });
  };

  const activeFiltersCount = [
    filters.category,
    filters.material,
    filters.gender,
    filters.minPrice,
    filters.search,
  ].filter(Boolean).length;

  return (
    <Layout>
      <div className="pt-20">
        {/* Hero */}
        <div className="bg-card py-12 border-b border-border">
          <div className="container mx-auto px-4 lg:px-8">
            <h1 className="font-heading text-4xl font-semibold text-center">
              Shop All Jewelry
            </h1>
            <p className="text-muted-foreground text-center mt-2">
              Discover our complete collection of handcrafted pieces
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-medium">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Search */}
                <div>
                  <Input
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                  />
                </div>

                {/* Categories */}
                <div>
                  <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                    Categories
                  </h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFilters({ ...filters, category: "" })}
                      className={cn(
                        "block text-sm transition-colors",
                        !filters.category
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      All Categories
                    </button>
                    {categories?.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setFilters({ ...filters, category: cat.slug })
                        }
                        className={cn(
                          "block text-sm transition-colors",
                          filters.category === cat.slug
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {cat.name} ({cat.product_count || 0})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                    Material
                  </h4>
                  <div className="space-y-2">
                    {materials.map((material) => (
                      <button
                        key={material}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            material:
                              filters.material === material ? "" : material,
                          })
                        }
                        className={cn(
                          "block text-sm transition-colors",
                          filters.material === material
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                    Price Range
                  </h4>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <button
                        key={range.label}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            minPrice:
                              filters.minPrice === range.min
                                ? undefined
                                : range.min,
                            maxPrice:
                              filters.maxPrice === range.max
                                ? undefined
                                : range.max,
                          })
                        }
                        className={cn(
                          "block text-sm transition-colors",
                          filters.minPrice === range.min
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                    For
                  </h4>
                  <div className="space-y-2">
                    {genders.map((gender) => (
                      <button
                        key={gender.value}
                        onClick={() =>
                          setFilters({
                            ...filters,
                            gender: filters.gender === gender.value ? "" : gender.value,
                          })
                        }
                        className={cn(
                          "block text-sm transition-colors",
                          filters.gender === gender.value
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {gender.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {products?.length || 0} products
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {filters.category && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {filters.category}
                      <button
                        onClick={() => setFilters({ ...filters, category: "" })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.material && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {filters.material}
                      <button
                        onClick={() => setFilters({ ...filters, material: "" })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.gender && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {filters.gender}
                      <button
                        onClick={() => setFilters({ ...filters, gender: "" })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.minPrice && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {priceRanges.find((r) => r.min === filters.minPrice)?.label}
                      <button
                        onClick={() =>
                          setFilters({
                            ...filters,
                            minPrice: undefined,
                            maxPrice: undefined,
                          })
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      "{filters.search}"
                      <button
                        onClick={() => setFilters({ ...filters, search: "" })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-muted rounded-lg mb-4" />
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products?.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="font-heading text-xl font-medium mb-2">
                    No products found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your filters or search term
                  </p>
                  <Button variant="gold-outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "grid gap-8",
                    viewMode === "grid"
                      ? "sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {products?.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsFilterOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="absolute left-0 top-0 h-full w-80 bg-background p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-medium">Filters</h3>
              <Button
                variant="icon"
                size="icon-sm"
                onClick={() => setIsFilterOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Same filter content as desktop */}
            <div className="space-y-6">
              <Input
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />

              <div>
                <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                  Categories
                </h4>
                <div className="space-y-2">
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setFilters({ ...filters, category: cat.slug })
                      }
                      className={cn(
                        "block text-sm transition-colors",
                        filters.category === cat.slug
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                  Material
                </h4>
                <div className="space-y-2">
                  {materials.map((material) => (
                    <button
                      key={material}
                      onClick={() =>
                        setFilters({
                          ...filters,
                          material:
                            filters.material === material ? "" : material,
                        })
                      }
                      className={cn(
                        "block text-sm transition-colors",
                        filters.material === material
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {material}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
