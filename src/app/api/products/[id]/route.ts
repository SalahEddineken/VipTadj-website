import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDataStore } from '@/lib/data-provider';
import {
  calculateTotalStock,
  productColorSchema,
  productImageSchema,
  getProductValidationError,
} from '@/lib/validations/product';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { deleteProductMediaAssets } from '@/lib/media/cloudinary-server';
import {
  resolveApiLanguage,
  buildApiErrorResponse,
  getApiLocalizedMessage,
} from '@/app/api/_utils/api-i18n';

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function isValidSizeInventory(val: unknown): val is Record<string, number> {
  if (!isPlainObject(val)) return false;
  for (const [sizeKey, qty] of Object.entries(val)) {
    if (!sizeKey || !sizeKey.trim()) return false;
    if (typeof qty !== 'number' || !Number.isFinite(qty) || !Number.isInteger(qty) || qty < 0) {
      return false;
    }
  }
  return true;
}

function isInvalidNumericInput(val: unknown, options: { allowNull?: boolean } = {}): boolean {
  if (val === undefined) return false;
  if (val === null) return !options.allowNull;
  if (typeof val === 'boolean' || Array.isArray(val)) return true;
  if (typeof val === 'string' && !val.trim()) return true;
  return false;
}

const partialProductSchema = z
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
    price: z.coerce
      .number()
      .positive('Le prix en Dinar (DZD) doit être supérieur à 0.')
      .int('Le prix doit être un entier en DA.'),
    compareAtPrice: z.coerce
      .number()
      .positive('Le prix barré doit être supérieur à 0.')
      .int()
      .optional()
      .nullable(),
    costPrice: z.coerce
      .number()
      .positive('Le coût de revient doit être supérieur à 0.')
      .int('Le coût de revient doit être un entier en DA.')
      .optional()
      .nullable(),
    categoryId: z.enum(['clothing', 'shoes', 'accessories'] as const, {
      required_error: 'La catégorie est obligatoire.',
    }),
    categorySlug: z.string().min(1),
    subcategory: z.string().optional().default(''),
    images: z.array(productImageSchema).min(1, 'Au moins une image est requise.'),
    sizes: z.array(z.string()),
    sizeInventory: z.record(z.string(), z.coerce.number().int().min(0)),
    colors: z.array(productColorSchema),
    stockQuantity: z.coerce.number().int().min(0, 'Le stock ne peut pas être négatif.'),
    inStock: z.boolean(),
    isFeatured: z.boolean(),
    isNewArrival: z.boolean(),
    isBestSeller: z.boolean(),
    sku: z.string().optional(),
    materials: z.string().optional(),
    materialsAr: z.string().optional(),
    materialsEn: z.string().optional(),
    careInstructions: z.string().optional(),
    careInstructionsAr: z.string().optional(),
    careInstructionsEn: z.string().optional(),
    fit: z.string().optional(),
    tags: z.array(z.string()).optional(),
    primaryImage: z.string().optional(),
  })
  .partial();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = resolveApiLanguage(req);

  try {
    const store = getDataStore();
    const product = await store.getProductById(params.id);

    if (!product) {
      return buildApiErrorResponse(lang, {
        status: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        errorKey: 'api.error.product_not_found',
      });
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('[API Product GET [id] Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la récupération du produit.',
    });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params.id);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params.id);
}

async function handleUpdate(req: NextRequest, id: string) {
  const lang = resolveApiLanguage(req);

  try {
    const store = getDataStore();
    const existing = await store.getProductById(id);

    if (!existing) {
      return buildApiErrorResponse(lang, {
        status: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        errorKey: 'api.error.product_not_found',
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_JSON',
        errorKey: 'api.error.invalid_json',
      });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_PRODUCT_DATA',
        errorKey: 'api.error.invalid_product_data',
      });
    }

    // Reject malformed nested arrays/objects before normalization or validation
    if (
      body.images !== undefined &&
      (!Array.isArray(body.images) || body.images.some((img: unknown) => !isPlainObject(img)))
    ) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_PRODUCT_DATA',
        errorKey: 'api.error.invalid_product_data',
      });
    }

    if (
      body.colors !== undefined &&
      (!Array.isArray(body.colors) || body.colors.some((col: unknown) => !isPlainObject(col)))
    ) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_PRODUCT_DATA',
        errorKey: 'api.error.invalid_product_data',
      });
    }

    if (body.sizeInventory !== undefined && !isValidSizeInventory(body.sizeInventory)) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'INVALID_PRODUCT_DATA',
        errorKey: 'api.error.invalid_product_data',
      });
    }

    if (body.compareAtPrice === 0 || body.compareAtPrice === '0' || body.compareAtPrice === '') {
      body.compareAtPrice = null;
    }

    if (isInvalidNumericInput(body.price)) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'PRODUCT_PRICE_POSITIVE',
        errorKey: 'validation.product.price_positive',
        extra: {
          errorKeys: { price: 'validation.product.price_positive' },
          errorCodes: { price: 'PRODUCT_PRICE_POSITIVE' },
        },
      });
    }
    if (isInvalidNumericInput(body.compareAtPrice, { allowNull: true })) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'PRODUCT_COMPARE_PRICE_POSITIVE',
        errorKey: 'validation.product.compare_price_positive',
        extra: {
          errorKeys: { compareAtPrice: 'validation.product.compare_price_positive' },
          errorCodes: { compareAtPrice: 'PRODUCT_COMPARE_PRICE_POSITIVE' },
        },
      });
    }
    if (isInvalidNumericInput(body.costPrice)) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'PRODUCT_COST_PRICE_POSITIVE',
        errorKey: 'validation.product.cost_price_positive',
        extra: {
          errorKeys: { costPrice: 'validation.product.cost_price_positive' },
          errorCodes: { costPrice: 'PRODUCT_COST_PRICE_POSITIVE' },
        },
      });
    }
    if (isInvalidNumericInput(body.stockQuantity)) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'PRODUCT_STOCK_MIN',
        errorKey: 'validation.product.stock_min',
        extra: {
          errorKeys: { stockQuantity: 'validation.product.stock_min' },
          errorCodes: { stockQuantity: 'PRODUCT_STOCK_MIN' },
        },
      });
    }

    const parsed = partialProductSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const mapped = firstIssue
        ? getProductValidationError(firstIssue, lang)
        : {
            errorCode: 'INVALID_PRODUCT_DATA',
            errorKey: 'api.error.invalid_product_data',
            message: '',
          };
      const errors: Record<string, string> = {};
      const errorKeys: Record<string, string> = {};
      const errorCodes: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] ? String(issue.path[0]) : 'general';
        const m = getProductValidationError(issue, lang);
        if (!errors[field]) {
          errors[field] = m.message;
          errorKeys[field] = m.errorKey;
          errorCodes[field] = m.errorCode;
        }
      }
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: mapped.errorCode,
        errorKey: mapped.errorKey,
        extra: { errors, errorKeys, errorCodes },
      });
    }

    const updateData: Record<string, any> = { ...parsed.data };

    // Validate compareAtPrice invariant if either price or compareAtPrice is present
    const finalPrice =
      updateData.price !== undefined ? updateData.price : existing.price;
    const finalCompare =
      updateData.compareAtPrice !== undefined
        ? updateData.compareAtPrice
        : existing.compareAtPrice;

    if (finalCompare !== undefined && finalCompare !== null && !isNaN(finalCompare)) {
      if (finalCompare <= finalPrice) {
        return buildApiErrorResponse(lang, {
          status: 400,
          errorCode: 'PRODUCT_COMPARE_PRICE_HIGHER',
          errorKey: 'validation.product.compare_price_higher',
        });
      }
    }

    // If sizeInventory updated, recalculate stockQuantity and inStock
    if (updateData.sizeInventory) {
      const computedStock = calculateTotalStock(updateData.sizeInventory);
      updateData.stockQuantity = computedStock;
      updateData.inStock = computedStock > 0;

      const activeSizes = Object.entries(updateData.sizeInventory)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([size]) => size);
      updateData.sizes = activeSizes;
    } else if (updateData.stockQuantity !== undefined) {
      // Direct stockQuantity update
      const sq = updateData.stockQuantity;
      if (updateData.inStock === undefined) {
        updateData.inStock = sq > 0;
      }
    } else if (updateData.inStock !== undefined && updateData.stockQuantity === undefined) {
      // If toggled inactive, or active
      if (!updateData.inStock) {
        updateData.stockQuantity = 0;
      } else if (existing.stockQuantity <= 0) {
        updateData.stockQuantity = 10; // default restock quantity when activating from 0
      }
    }

    // Keep status and isActive synchronized with inStock publication state
    if (updateData.inStock !== undefined) {
      updateData.status = updateData.inStock ? 'active' : 'draft';
      updateData.isActive = updateData.inStock;
    } else if (updateData.status !== undefined) {
      updateData.isActive = updateData.status === 'active';
      if (updateData.status === 'draft') {
        updateData.inStock = false;
        updateData.stockQuantity = 0;
      }
    }

    // Normalize images if provided
    if (Array.isArray(updateData.images)) {
      const catFallback = updateData.categoryId || existing.categoryId;
      updateData.images = updateData.images.map((img: any, idx: number) => ({
        ...img,
        url:
          typeof img.url === 'string' && img.url.trim()
            ? normalizeImageUrl(img.url, { fallbackCategory: catFallback, language: lang })
            : img.url,
        isPrimary:
          Boolean(img.isPrimary) ||
          (idx === 0 && !updateData.images.some((i: any) => i.isPrimary)),
      }));
      updateData.primaryImage =
        updateData.images.find((img: any) => img.isPrimary)?.url || updateData.images[0]?.url;
    }

    // Normalize color imageUrls so they stay consistent with gallery image URLs
    if (Array.isArray(updateData.colors)) {
      const catFallback = updateData.categoryId || existing.categoryId;
      updateData.colors = updateData.colors.map((col: any) => ({
        ...col,
        imageUrl:
          typeof col.imageUrl === 'string' && col.imageUrl.trim()
            ? normalizeImageUrl(col.imageUrl, { fallbackCategory: catFallback, language: lang })
            : col.imageUrl,
      }));
    }

    const updated = await store.updateProduct(id, updateData);

    return NextResponse.json({
      success: true,
      product: updated,
      message: getApiLocalizedMessage(lang, {
        fr: 'Produit mis à jour avec succès.',
        en: 'Product updated successfully.',
        ar: 'تم تحديث المنتج بنجاح.',
      }),
    });
  } catch (error: any) {
    console.error('[API Product UPDATE Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la mise à jour du produit.',
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = resolveApiLanguage(req);

  try {
    const store = getDataStore();
    const existing = await store.getProductById(params.id);

    if (!existing) {
      return buildApiErrorResponse(lang, {
        status: 404,
        errorCode: 'PRODUCT_NOT_FOUND',
        errorKey: 'api.error.product_not_found',
        frFallback: 'Produit introuvable ou déjà supprimé.',
      });
    }

    const success = await store.deleteProduct(params.id);

    if (!success) {
      return buildApiErrorResponse(lang, {
        status: 500,
        errorCode: 'INTERNAL_ERROR',
        errorKey: 'api.error.internal',
        frFallback: 'Échec de la suppression du produit.',
      });
    }

    // Free up storage on Cloudinary (and disk) by deleting assets exclusive to this product
    let mediaCleanup;
    try {
      const allProducts = await store.getProducts().catch(() => []);
      mediaCleanup = await deleteProductMediaAssets(existing, { allProducts });
    } catch (cleanupErr) {
      console.warn('[Product Delete Media Cleanup Warning]:', cleanupErr);
    }

    return NextResponse.json({
      success: true,
      message: getApiLocalizedMessage(lang, {
        fr: 'Produit et ses médias Cloudinary retirés du catalogue avec succès.',
        en: 'Product and its Cloudinary media removed from catalog successfully.',
        ar: 'تم حذف المنتج وصوره من Cloudinary بنجاح.',
      }),
      mediaCleanup,
    });
  } catch (error: any) {
    console.error('[API Product DELETE Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la suppression du produit.',
    });
  }
}
