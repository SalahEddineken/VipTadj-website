import { z } from 'zod';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/locales';

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
    titleAr: z.string().optional(),
    titleEn: z.string().optional(),
    slug: z
      .string()
      .min(3, 'Le slug est obligatoire (au moins 3 caractères).')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Format de slug invalide (ex: costume-laine-italienne).'),
    subtitle: z.string().optional(),
    subtitleAr: z.string().optional(),
    subtitleEn: z.string().optional(),
    description: z.string().optional().default(''),
    descriptionAr: z.string().optional(),
    descriptionEn: z.string().optional(),
    shortDescription: z.string().optional(),
    shortDescriptionAr: z.string().optional(),
    shortDescriptionEn: z.string().optional(),
    price: z.coerce.number().positive('Le prix en Dinar (DZD) doit être supérieur à 0.').int('Le prix doit être un entier en DA.'),
    compareAtPrice: z.coerce.number().positive('Le prix barré doit être supérieur à 0.').int().optional().nullable(),
    costPrice: z.coerce.number().positive('Le coût de revient doit être supérieur à 0.').int('Le coût de revient doit être un entier en DA.').optional().nullable(),
    categoryId: z.enum(['clothing', 'shoes', 'accessories'] as const, {
      required_error: 'La catégorie est obligatoire.',
    }),
    categorySlug: z.string(),
    subcategory: z.string().optional().default(''),
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
    materialsAr: z.string().optional(),
    materialsEn: z.string().optional(),
    careInstructions: z.string().optional(),
    careInstructionsAr: z.string().optional(),
    careInstructionsEn: z.string().optional(),
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

export function getProductValidationError(
  issue: z.ZodIssue,
  language: SupportedLanguage = 'fr'
): { errorCode: string; errorKey: string; message: string } {
  const field = issue.path[0] ? String(issue.path[0]) : 'general';
  const subField = issue.path[2] ? String(issue.path[2]) : '';

  let errorCode = 'PRODUCT_INVALID_DATA';
  let errorKey = 'api.error.invalid_product_data';

  switch (field) {
    case 'title':
      errorCode = 'PRODUCT_TITLE_MIN';
      errorKey = 'validation.product.title_min';
      break;
    case 'slug':
      if (issue.code === 'too_small') {
        errorCode = 'PRODUCT_SLUG_MIN';
        errorKey = 'validation.product.slug_min';
      } else {
        errorCode = 'PRODUCT_SLUG_FORMAT';
        errorKey = 'validation.product.slug_format';
      }
      break;
    case 'description':
      errorCode = 'PRODUCT_DESCRIPTION_MIN';
      errorKey = 'validation.product.description_min';
      break;
    case 'price':
      if (issue.code === 'not_multiple_of' || issue.message.includes('entier')) {
        errorCode = 'PRODUCT_PRICE_INT';
        errorKey = 'validation.product.price_int';
      } else {
        errorCode = 'PRODUCT_PRICE_POSITIVE';
        errorKey = 'validation.product.price_positive';
      }
      break;
    case 'compareAtPrice':
      if (issue.code === 'custom') {
        errorCode = 'PRODUCT_COMPARE_PRICE_HIGHER';
        errorKey = 'validation.product.compare_price_higher';
      } else {
        errorCode = 'PRODUCT_COMPARE_PRICE_POSITIVE';
        errorKey = 'validation.product.compare_price_positive';
      }
      break;
    case 'costPrice':
      if (issue.code === 'not_multiple_of' || issue.message.includes('entier')) {
        errorCode = 'PRODUCT_COST_PRICE_INT';
        errorKey = 'validation.product.cost_price_int';
      } else {
        errorCode = 'PRODUCT_COST_PRICE_POSITIVE';
        errorKey = 'validation.product.cost_price_positive';
      }
      break;
    case 'categoryId':
      errorCode = 'PRODUCT_CATEGORY_REQUIRED';
      errorKey = 'validation.product.category_required';
      break;
    case 'subcategory':
      errorCode = 'PRODUCT_SUBCATEGORY_REQUIRED';
      errorKey = 'validation.product.subcategory_required';
      break;
    case 'images':
      if (subField === 'url') {
        errorCode = 'PRODUCT_IMAGE_URL_REQUIRED';
        errorKey = 'validation.product.image_url_required';
      } else if (subField === 'alt') {
        errorCode = 'PRODUCT_IMAGE_ALT_REQUIRED';
        errorKey = 'validation.product.image_alt_required';
      } else {
        errorCode = 'PRODUCT_IMAGES_MIN';
        errorKey = 'validation.product.images_min';
      }
      break;
    case 'colors':
      if (subField === 'hex') {
        errorCode = 'PRODUCT_COLOR_HEX_REQUIRED';
        errorKey = 'validation.product.color_hex_required';
      } else {
        errorCode = 'PRODUCT_COLOR_NAME_REQUIRED';
        errorKey = 'validation.product.color_name_required';
      }
      break;
    case 'stockQuantity':
      errorCode = 'PRODUCT_STOCK_MIN';
      errorKey = 'validation.product.stock_min';
      break;
  }

  return {
    errorCode,
    errorKey,
    message: getTranslation(language, errorKey, issue.message),
  };
}

export function validateProductForm(
  data: any,
  language?: SupportedLanguage
): {
  valid: boolean;
  errors: Record<string, string>;
  errorKeys?: Record<string, string>;
  errorCodes?: Record<string, string>;
  data?: ProductFormValues;
} {
  const result = productSchema.safeParse(data);
  if (!result.success) {
    const errors: Record<string, string> = {};
    const errorKeys: Record<string, string> = {};
    const errorCodes: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] ? String(issue.path[0]) : 'general';
      const mapped = getProductValidationError(issue, language || 'fr');
      if (!errors[field]) {
        errors[field] = language ? mapped.message : issue.message;
        errorKeys[field] = mapped.errorKey;
        errorCodes[field] = mapped.errorCode;
      }
    }
    return { valid: false, errors, errorKeys, errorCodes };
  }
  return { valid: true, errors: {}, data: result.data };
}
