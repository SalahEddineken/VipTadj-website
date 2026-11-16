import { z } from 'zod';

/**
 * Normalizes French titles into URL-safe slugs.
 * E.g. 'Costume Deux Pièces en Laine Super 130s' -> 'costume-deux-pieces-en-laine-super-130s'
 */
export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (é, è, ê, à, etc.)
    .replace(/[^a-z0-9]+/g, '-')     // replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '');        // remove leading/trailing hyphens
}

/**
 * Computes aggregate stock quantity from size matrix map.
 */
export function calculateTotalStock(sizeMatrix: Record<string, number> = {}): number {
  if (!sizeMatrix || typeof sizeMatrix !== 'object') return 0;
  return Object.values(sizeMatrix).reduce((sum, qty) => sum + Math.max(0, Number(qty) || 0), 0);
}

export const productColorSchema = z.object({
  name: z.string().min(1, 'Le nom de la couleur est obligatoire.'),
  hex: z.string().min(1, 'Le code hexadécimal est obligatoire.'),
  inStock: z.boolean().default(true),
  imageUrl: z.string().optional(),
});

export const productImageSchema = z.object({
  id: z.string().default(() => `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
  url: z.string().min(1, 'L\'URL de l\'image est requise.'),
  alt: z.string().min(1, 'La description alternative (alt) est requise.'),
  isPrimary: z.boolean().default(false),
  color: z.string().optional(),
  publicId: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const productSchema = z
  .object({
    title: z.string().min(5, 'Le titre du produit est obligatoire (au moins 5 caractères).'),
    slug: z
      .string()
      .min(3, 'Le slug est obligatoire (au moins 3 caractères).')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide (ex: costume-laine-italienne).'),
    subtitle: z.string().optional(),
    description: z.string().min(10, 'La description doit contenir au moins 10 caractères.'),
    shortDescription: z.string().optional(),
    price: z.coerce.number().positive('Le prix en Dinar (DZD) doit être supérieur à 0.').int('Le prix doit être un entier en DA.'),
    compareAtPrice: z.coerce.number().positive('Le prix barré doit être supérieur à 0.').int().optional().nullable(),
    costPrice: z.coerce.number().positive().int().optional().nullable(),
    categoryId: z.enum(['clothing', 'shoes', 'accessories'] as const, {
      required_error: 'La catégorie est obligatoire.',
    }),
    categorySlug: z.string(),
    subcategory: z.string().min(1, 'La sous-catégorie est obligatoire.'),
    images: z.array(productImageSchema).min(1, 'Au moins une image est requise.'),
    sizes: z.array(z.string()).default([]),
    sizeInventory: z.record(z.string(), z.coerce.number().int().min(0)).default({}),
    colors: z.array(productColorSchema).optional(),
    stockQuantity: z.coerce.number().int().min(0, 'Le stock ne peut pas être négatif.'),
    inStock: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isNewArrival: z.boolean().default(true),
    isBestSeller: z.boolean().default(false),
    sku: z.string().optional(),
    materials: z.string().optional(),
    careInstructions: z.string().optional(),
    fit: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice !== undefined && data.compareAtPrice !== null && !isNaN(data.compareAtPrice)) {
        return data.compareAtPrice > data.price;
      }
      return true;
    },
    {
      message: 'Le prix barré doit être strictement supérieur au prix de vente.',
      path: ['compareAtPrice'],
    }
  );

export type ProductFormValues = z.infer<typeof productSchema>;

export function validateProductForm(data: any): {
  valid: boolean;
  errors: Record<string, string>;
  data?: ProductFormValues;
} {
  const result = productSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : 'general';
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
    return { valid: false, errors };
  }
  return { valid: true, errors: {}, data: result.data };
}
