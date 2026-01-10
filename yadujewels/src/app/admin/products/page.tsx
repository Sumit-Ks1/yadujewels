"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useCollections } from "@/hooks/useCollections";
import { formatPrice } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

type Product = Tables<"products">;

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  images: string[];
  category_id?: string;
  collection_id?: string;
  material?: string;
  weight?: string;
  gender?: string;
  is_best_seller: boolean;
  is_new: boolean;
  specifications?: Record<string, string>;
  care_instructions?: string[];
}

const initialFormData: ProductFormData = {
  name: "",
  description: "",
  price: 0,
  stock_quantity: 0,
  images: [],
  is_best_seller: false,
  is_new: false,
  specifications: {},
  care_instructions: [],
};

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  // Separate state for specifications text to allow proper editing
  const [specificationsText, setSpecificationsText] = useState("{}");
  const [specificationsError, setSpecificationsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);

  const { data: products, isLoading } = useProducts({ search });
  const { data: categories } = useCategories();
  const { data: collections } = useCollections();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const specs = (product.specifications as Record<string, string>) || {};
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        original_price: product.original_price || undefined,
        stock_quantity: product.stock_quantity || 0,
        images: product.images || [],
        category_id: product.category_id || undefined,
        collection_id: product.collection_id || undefined,
        material: product.material || undefined,
        weight: product.weight || undefined,
        gender: product.gender || undefined,
        is_best_seller: product.is_best_seller || false,
        is_new: product.is_new || false,
        specifications: specs,
        care_instructions: product.care_instructions || [],
      });
      setSpecificationsText(JSON.stringify(specs, null, 2));
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
      setSpecificationsText("{}");
    }
    setSpecificationsError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert undefined to null for database compatibility
    const dbData = {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      original_price: formData.original_price ?? null,
      stock_quantity: formData.stock_quantity,
      images: formData.images,
      category_id: formData.category_id || null,
      collection_id: formData.collection_id || null,
      material: formData.material || null,
      weight: formData.weight || null,
      gender: formData.gender || null,
      is_best_seller: formData.is_best_seller,
      is_new: formData.is_new,
      specifications: formData.specifications ?? null,
      care_instructions: formData.care_instructions ?? null,
    };

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...dbData,
        });
        toast.success("Product updated successfully");
      } else {
        await createProduct.mutateAsync(dbData);
        toast.success("Product created successfully");
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      console.error("Product save error:", error);
      const message = error instanceof Error ? error.message : "Failed to save product";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Products</h1>
          <p className="text-muted-foreground">
            Manage your jewelry products
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price === 0 ? "" : formData.price}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        price: e.target.value === "" ? 0 : Number(e.target.value) 
                      })
                    }
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="original_price">Original Price (₹)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    value={formData.original_price || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        original_price: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="stock_quantity">Stock *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity === 0 ? "" : formData.stock_quantity}
                    onChange={(e) =>
                      setFormData({ 
                        ...formData, 
                        stock_quantity: e.target.value === "" ? 0 : Number(e.target.value) 
                      })
                    }
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.category_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category_id: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Select category</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="collection">Collection</Label>
                  <select
                    id="collection"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.collection_id || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collection_id: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Select collection</option>
                    {collections?.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    value={formData.material || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    value={formData.weight || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        weight: e.target.value || undefined,
                      })
                    }
                    placeholder="e.g., 5g, 10.5g"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={formData.gender || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="women">Women</option>
                    <option value="men">Men</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Product Images</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload up to 10 images. First image will be the main product image.
                </p>
                <ImageUpload
                  images={formData.images}
                  onChange={(images) => setFormData({ ...formData, images })}
                  maxImages={10}
                  folder="products"
                  disabled={createProduct.isPending || updateProduct.isPending}
                />
              </div>

              {/* Specifications - JSONB field */}
              <div>
                <Label htmlFor="specifications">Specifications (JSON format)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Enter as key-value pairs, e.g., {`{"Purity": "22K", "Finish": "Polished"}`}
                </p>
                <Textarea
                  id="specifications"
                  value={specificationsText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSpecificationsText(text);
                    try {
                      const parsed = JSON.parse(text);
                      setFormData({ ...formData, specifications: parsed });
                      setSpecificationsError(null);
                    } catch {
                      // Allow invalid JSON while typing, show error
                      setSpecificationsError("Invalid JSON format");
                    }
                  }}
                  rows={4}
                  placeholder='{"Purity": "22K", "Finish": "Polished", "Hallmark": "BIS Certified"}'
                  className={`font-mono text-sm ${specificationsError ? "border-destructive" : ""}`}
                />
                {specificationsError && (
                  <p className="text-xs text-destructive mt-1">{specificationsError}</p>
                )}
              </div>

              {/* Care Instructions - text[] field */}
              <div>
                <Label htmlFor="care_instructions">Care Instructions (one per line)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Enter each care instruction on a new line
                </p>
                <Textarea
                  id="care_instructions"
                  value={(formData.care_instructions || []).join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      care_instructions: e.target.value.split("\n").filter(Boolean),
                    })
                  }
                  rows={4}
                  placeholder="Store in a dry place&#10;Avoid contact with perfumes&#10;Clean with soft cloth"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_best_seller}
                    onChange={(e) =>
                      setFormData({ ...formData, is_best_seller: e.target.checked })
                    }
                  />
                  Best Seller
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={(e) =>
                      setFormData({ ...formData, is_new: e.target.checked })
                    }
                  />
                  New Arrival
                </label>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={createProduct.isPending || updateProduct.isPending}
                >
                  {editingProduct ? "Update" : "Create"} Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-lg border border-border overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading products...
          </div>
        ) : products && products.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded bg-muted overflow-hidden">
                        <Image
                          src={product.images?.[0] || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.material}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-primary">
                        {formatPrice(product.price)}
                      </p>
                      {product.original_price && product.original_price > product.price && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.original_price)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        (product.stock_quantity || 0) === 0
                          ? "text-destructive"
                          : (product.stock_quantity || 0) < 10
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {product.stock_quantity || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.material || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{product.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No products found
          </div>
        )}
      </motion.div>
    </div>
  );
}
