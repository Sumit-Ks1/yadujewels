import { z } from "zod";

/**
 * Validation Schemas using Zod
 * Provides type-safe input validation for XSS and injection prevention
 * Follows Open/Closed Principle - extend without modifying
 */

// ==================== Common Validators ====================

/** Sanitized string - removes potentially dangerous characters */
const sanitizedString = z
  .string()
  .transform((val) => val.trim())
  .refine(
    (val) => !/<script|javascript:|on\w+=/i.test(val),
    "Invalid characters detected"
  );

/** Email validator with proper format checking */
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .max(255, "Email is too long")
  .toLowerCase()
  .trim();

/** Phone number validator - international format */
const phoneSchema = z
  .string()
  .regex(
    /^\+?[\d\s\-()]{10,20}$/,
    "Please enter a valid phone number"
  )
  .transform((val) => val.replace(/[\s\-()]/g, ""));

/** Password with strength requirements */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/** Simple password for login (no strength check) */
const loginPasswordSchema = z
  .string()
  .min(1, "Password is required")
  .max(72, "Password is too long");

// ==================== Auth Schemas ====================

export const signInSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

// ==================== Contact Form Schema ====================

export const contactSchema = z.object({
  name: sanitizedString
    .pipe(z.string().min(2, "Name must be at least 2 characters"))
    .pipe(z.string().max(100, "Name is too long")),
  email: emailSchema,
  subject: sanitizedString
    .pipe(z.string().min(5, "Subject must be at least 5 characters"))
    .pipe(z.string().max(200, "Subject is too long")),
  message: sanitizedString
    .pipe(z.string().min(10, "Message must be at least 10 characters"))
    .pipe(z.string().max(2000, "Message is too long")),
});

export type ContactInput = z.infer<typeof contactSchema>;

// ==================== Checkout Schema ====================

export const checkoutSchema = z.object({
  fullName: sanitizedString
    .pipe(z.string().min(2, "Full name is required"))
    .pipe(z.string().max(100, "Name is too long")),
  email: emailSchema,
  phone: phoneSchema,
  address: sanitizedString
    .pipe(z.string().min(10, "Please enter your complete address"))
    .pipe(z.string().max(500, "Address is too long")),
  city: sanitizedString
    .pipe(z.string().min(2, "City is required"))
    .pipe(z.string().max(100, "City name is too long")),
  state: sanitizedString
    .pipe(z.string().min(2, "State is required"))
    .pipe(z.string().max(100, "State name is too long")),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit pincode"),
  notes: sanitizedString
    .pipe(z.string().max(500, "Notes are too long"))
    .optional()
    .default(""),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ==================== Product Admin Schema ====================

export const productSchema = z.object({
  name: sanitizedString
    .pipe(z.string().min(3, "Product name must be at least 3 characters"))
    .pipe(z.string().max(200, "Product name is too long")),
  description: sanitizedString
    .pipe(z.string().min(10, "Description must be at least 10 characters"))
    .pipe(z.string().max(5000, "Description is too long"))
    .optional(),
  price: z
    .number()
    .positive("Price must be positive")
    .max(100000000, "Price is too high"),
  original_price: z
    .number()
    .positive("Original price must be positive")
    .max(100000000, "Price is too high")
    .optional()
    .nullable(),
  stock_quantity: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(1000000, "Stock is too high"),
  category_id: z.string().uuid("Invalid category"),
  collection_id: z.string().uuid("Invalid collection").optional().nullable(),
  material: sanitizedString.pipe(z.string().max(100)).optional(),
  weight: sanitizedString.pipe(z.string().max(50)).optional(),
  dimensions: sanitizedString.pipe(z.string().max(100)).optional(),
  gender: z.enum(["men", "women", "unisex"]).optional(),
  is_best_seller: z.boolean().default(false),
  is_new: z.boolean().default(true),
  in_stock: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

// ==================== Category/Collection Schema ====================

export const categorySchema = z.object({
  name: sanitizedString
    .pipe(z.string().min(2, "Category name must be at least 2 characters"))
    .pipe(z.string().max(100, "Category name is too long")),
  description: sanitizedString
    .pipe(z.string().max(500, "Description is too long"))
    .optional()
    .nullable(),
  image_url: z.string().url("Invalid image URL").optional().nullable(),
});

export const collectionSchema = z.object({
  name: sanitizedString
    .pipe(z.string().min(2, "Collection name must be at least 2 characters"))
    .pipe(z.string().max(100, "Collection name is too long")),
  description: sanitizedString
    .pipe(z.string().max(500, "Description is too long"))
    .optional()
    .nullable(),
  image_url: z.string().url("Invalid image URL").optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;

// ==================== Search Schema ====================

export const searchSchema = z.object({
  query: sanitizedString
    .pipe(z.string().max(200, "Search query is too long"))
    .optional()
    .default(""),
  category: z.string().uuid().optional(),
  collection: z.string().uuid().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z
    .enum(["newest", "price-asc", "price-desc", "best-sellers"])
    .optional()
    .default("newest"),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(12),
});

export type SearchInput = z.infer<typeof searchSchema>;

// ==================== Utility Functions ====================

/**
 * Safely validate input with error handling
 * @returns Validated data or null with error messages
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}

/**
 * Sanitize string input to prevent XSS
 * Use this for user-generated content before display
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\//g, "&#x2F;");
}
