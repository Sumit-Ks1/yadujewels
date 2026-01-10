import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Supabase Storage Utility
 * Handles image upload, deletion, and URL generation
 * Follows Single Responsibility Principle - only handles storage operations
 */

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Generate a unique file name to prevent collisions
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.map((t) => t.split("/")[1]).join(", ")}`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Upload a single image to Supabase Storage
 */
export async function uploadImage(
  file: File,
  folder: string = "products"
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const supabase = getSupabaseBrowserClient();
  const fileName = generateFileName(file.name);
  const filePath = `${folder}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload multiple images
 */
export async function uploadMultipleImages(
  files: File[],
  folder: string = "products"
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadImage(file, folder))
  );
  return results;
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Delete multiple images
 */
export async function deleteMultipleImages(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true;

  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(paths);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    return false;
  }
}

/**
 * Extract storage path from public URL
 */
export function getPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(
      /\/storage\/v1\/object\/public\/product-images\/(.+)/
    );
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Check if URL is from Supabase storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes(".supabase.co/storage/v1/object/public/");
}
