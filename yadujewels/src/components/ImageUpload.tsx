"use client";

import { useState, useCallback, useRef, memo } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImagePlus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  uploadImage,
  deleteImage,
  validateFile,
  getPathFromUrl,
  isSupabaseStorageUrl,
} from "@/lib/storage";
import { toast } from "sonner";

/**
 * ImageUpload Component
 * Handles multiple image uploads with drag-and-drop support
 * Follows Interface Segregation Principle - focused on image upload only
 */

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  folder?: string;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

function ImageUploadComponent({
  images,
  onChange,
  maxImages = 10,
  folder = "products",
  disabled = false,
  className,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxImages - images.length;

      if (fileArray.length > remainingSlots) {
        toast.error(`You can only upload ${remainingSlots} more image(s)`);
        return;
      }

      // Validate all files first
      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`);
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      // Create uploading state with previews
      const newUploading: UploadingFile[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }));

      setUploading((prev) => [...prev, ...newUploading]);

      // Upload all files
      const uploadedUrls: string[] = [];

      for (const uploadingFile of newUploading) {
        try {
          // Update progress
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadingFile.id ? { ...u, progress: 50 } : u
            )
          );

          const result = await uploadImage(uploadingFile.file, folder);

          if (result.success && result.url) {
            uploadedUrls.push(result.url);
            // Complete progress
            setUploading((prev) =>
              prev.map((u) =>
                u.id === uploadingFile.id ? { ...u, progress: 100 } : u
              )
            );
          } else {
            setUploading((prev) =>
              prev.map((u) =>
                u.id === uploadingFile.id
                  ? { ...u, error: result.error || "Upload failed" }
                  : u
              )
            );
            toast.error(`Failed to upload ${uploadingFile.file.name}`);
          }
        } catch (error) {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === uploadingFile.id ? { ...u, error: "Upload failed" } : u
            )
          );
        }
      }

      // Remove successful uploads from uploading state and add to images
      setTimeout(() => {
        setUploading((prev) =>
          prev.filter((u) => u.error || u.progress < 100)
        );
        if (uploadedUrls.length > 0) {
          onChange([...images, ...uploadedUrls]);
          toast.success(`${uploadedUrls.length} image(s) uploaded successfully`);
        }
      }, 500);

      // Cleanup previews
      newUploading.forEach((u) => URL.revokeObjectURL(u.preview));
    },
    [images, maxImages, folder, onChange]
  );

  // Handle image removal
  const handleRemove = useCallback(
    async (index: number) => {
      const url = images[index];
      const newImages = images.filter((_, i) => i !== index);

      // If it's a Supabase storage URL, delete from storage
      if (isSupabaseStorageUrl(url)) {
        const path = getPathFromUrl(url);
        if (path) {
          await deleteImage(path);
        }
      }

      onChange(newImages);
      toast.success("Image removed");
    },
    [images, onChange]
  );

  // Cancel uploading file
  const handleCancelUpload = useCallback((id: string) => {
    setUploading((prev) => {
      const toRemove = prev.find((u) => u.id === id);
      if (toRemove) {
        URL.revokeObjectURL(toRemove.preview);
      }
      return prev.filter((u) => u.id !== id);
    });
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        // Reset input
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const canUploadMore = images.length + uploading.length < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Image Grid */}
      {(images.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Existing Images */}
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
            >
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded">
                  Main
                </span>
              )}
            </div>
          ))}

          {/* Uploading Images */}
          {uploading.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <Image
                src={item.preview}
                alt="Uploading"
                fill
                className="object-cover opacity-50"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {item.error ? (
                  <div className="text-center p-2">
                    <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-1" />
                    <p className="text-xs text-destructive">{item.error}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelUpload(item.id)}
                      className="mt-1"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.progress}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      {canUploadMore && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={handleInputChange}
            disabled={disabled}
          />
          <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">
            {isDragging ? "Drop images here" : "Click or drag images to upload"}
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP or AVIF (max 5MB each)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {images.length} of {maxImages} images uploaded
          </p>
        </div>
      )}
    </div>
  );
}

// Export memoized component
export const ImageUpload = memo(ImageUploadComponent);
