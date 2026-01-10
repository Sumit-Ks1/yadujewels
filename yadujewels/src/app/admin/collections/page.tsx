"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
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
import {
  useCollectionsWithProductCount,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
  CollectionWithCount,
} from "@/hooks/useCollections";
import Image from "next/image";

type Collection = CollectionWithCount;

interface CollectionFormData {
  name: string;
  slug: string;
  description: string;
  image: string;
}

const initialFormData: CollectionFormData = {
  name: "",
  slug: "",
  description: "",
  image: "",
};

export default function AdminCollections() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [formData, setFormData] = useState<CollectionFormData>(initialFormData);

  const { data: collections, isLoading } = useCollectionsWithProductCount();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const handleOpenDialog = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection);
      setFormData({
        name: collection.name,
        slug: collection.slug,
        description: collection.description || "",
        image: collection.image || "",
      });
    } else {
      setEditingCollection(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData({ ...formData, name, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCollection) {
        await updateCollection.mutateAsync({
          id: editingCollection.id,
          ...formData,
        });
      } else {
        await createCollection.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      setFormData(initialFormData);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCollection.mutateAsync(id);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Collections</h1>
          <p className="text-muted-foreground">Manage product collections</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? "Edit Collection" : "Add New Collection"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                />
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

              <div>
                <Label>Collection Image</Label>
                <ImageUpload
                  images={formData.image ? [formData.image] : []}
                  onChange={(images) =>
                    setFormData({ ...formData, image: images[0] || "" })
                  }
                  maxImages={1}
                  folder="collections"
                />
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
                  disabled={
                    createCollection.isPending || updateCollection.isPending
                  }
                >
                  {createCollection.isPending || updateCollection.isPending
                    ? "Saving..."
                    : editingCollection
                    ? "Update Collection"
                    : "Create Collection"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : collections?.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-lg font-medium mb-2">
            No collections yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first collection to organize products
          </p>
          <Button variant="gold" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Collection
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections?.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    {collection.image ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                        <Image
                          src={collection.image}
                          alt={collection.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {collection.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {collection.slug}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                      {collection.product_count} products
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDialog(collection)}
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
                            <AlertDialogTitle>
                              Delete Collection
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{collection.name}
                              "? This action cannot be undone.
                              {collection.product_count > 0 && (
                                <span className="block mt-2 text-destructive">
                                  Warning: This collection has{" "}
                                  {collection.product_count} product(s)
                                  associated with it.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(collection.id)}
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
        </div>
      )}
    </div>
  );
}
