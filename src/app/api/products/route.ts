import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { validateProductForm, calculateTotalStock } from '@/lib/validations/product';
import { ProductCategoryType, ProductFilter } from '@/types';
import { isProductVisibleInShop } from '@/lib/utils/catalogUtils';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import {
  resolveApiLanguage,
  buildApiErrorResponse,
  getApiLocalizedMessage,
} from '@/app/api/_utils/api-i18n';

const CATEGORY_SLUG_MAP: Record<ProductCategoryType, string> = {
  clothing: 'vetements',
  shoes: 'chaussures',
  accessories: 'accessoires',
};

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function isInvalidNumericInput(val: unknown, options: { allowNull?: boolean } = {}): boolean {
  if (val === undefined) return false;
  if (val === null) return !options.allowNull;
  if (typeof val === 'boolean' || Array.isArray(val)) return true;
  if (typeof val === 'string' && !val.trim()) return true;
  return false;
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

export async function GET(req: NextRequest) {
  const lang = resolveApiLanguage(req);

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') as ProductCategoryType | null;
    const categorySlug = searchParams.get('categorySlug');
    const subcategory = searchParams.get('subcategory');
    const inStockParam = searchParams.get('inStock');
    const statusParam = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const featuredParam = searchParams.get('featured');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const filter: ProductFilter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (categorySlug) filter.categorySlug = categorySlug;
    if (subcategory) filter.subcategory = subcategory;
    if (inStockParam !== null) filter.inStock = inStockParam === 'true';
    if (statusParam) filter.status = statusParam as any;
    if (featuredParam !== null) filter.featured = featuredParam === 'true';
    if (search) filter.search = search;
    if (sortBy) filter.sortBy = sortBy as any;
    if (limitParam) filter.limit = parseInt(limitParam, 10);
    if (offsetParam) filter.offset = parseInt(offsetParam, 10);

    const store = getDataStore();
    let products = await store.getProducts(filter);

    // If caller didn't explicitly request inactive/draft products or a specific inStock/status filter,
    // ensure public storefront queries only return active/visible products.
    if (!includeInactive && inStockParam === null && !statusParam) {
      products = products.filter(isProductVisibleInShop);
    }

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (error: any) {
    console.error('[API Products GET Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la récupération des produits.',
    });
  }
}

export async function POST(req: NextRequest) {
  const lang = resolveApiLanguage(req);

  try {
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

    // Reject malformed nested arrays/objects before normalization
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

    if (
      isInvalidNumericInput(body.stockQuantity) ||
      (body.sizeInventory === undefined &&
        body.stockQuantity !== undefined &&
        (body.stockQuantity === null ||
          (typeof body.stockQuantity === 'string' && body.stockQuantity.trim() === '')))
    ) {
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

    // Map categorySlug if not provided
    if (body.categoryId && !body.categorySlug) {
      body.categorySlug = CATEGORY_SLUG_MAP[body.categoryId as ProductCategoryType] || 'vetements';
    }

    // Auto-compute stock from sizeInventory if available
    if (body.sizeInventory && isPlainObject(body.sizeInventory)) {
      const computedStock = calculateTotalStock(body.sizeInventory as Record<string, number>);
      body.stockQuantity = computedStock;
      body.inStock = computedStock > 0;

      // Extract sizes with stock > 0
      const activeSizes = Object.entries(body.sizeInventory)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([size]) => size);

      if (activeSizes.length > 0) {
        body.sizes = activeSizes;
      }
    }

    // Ensure images have normalized URLs
    if (Array.isArray(body.images)) {
      const validImages = body.images;
      body.images = validImages.map((img: any, idx: number) => ({
        ...img,
        url:
          typeof img.url === 'string' && img.url.trim()
            ? normalizeImageUrl(img.url, { fallbackCategory: body.categoryId, language: lang })
            : img.url,
        isPrimary: Boolean(img.isPrimary) || (idx === 0 && !validImages.some((i: any) => i.isPrimary)),
      }));
      body.primaryImage = body.images.find((img: any) => img.isPrimary)?.url || body.images[0]?.url;
    }

    // Normalize color imageUrls so they stay consistent with gallery image URLs
    if (Array.isArray(body.colors)) {
      body.colors = body.colors.map((col: any) => ({
        ...col,
        imageUrl:
          typeof col.imageUrl === 'string' && col.imageUrl.trim()
            ? normalizeImageUrl(col.imageUrl, { fallbackCategory: body.categoryId, language: lang })
            : col.imageUrl,
      }));
    }

    const validation = validateProductForm(body, lang);
    if (!validation.valid || !validation.data) {
      const firstField = Object.keys(validation.errorKeys || {})[0];
      const topErrorCode =
        (firstField && validation.errorCodes?.[firstField]) || 'INVALID_PRODUCT_DATA';
      const topErrorKey =
        (firstField && validation.errorKeys?.[firstField]) || 'api.error.invalid_product_data';
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: topErrorCode,
        errorKey: topErrorKey,
        extra: {
          errors: validation.errors,
          errorKeys: validation.errorKeys,
          errorCodes: validation.errorCodes,
        },
      });
    }

    const store = getDataStore();
    const newProduct = await store.createProduct(validation.data as any);

    return NextResponse.json(
      {
        success: true,
        product: newProduct,
        message: getApiLocalizedMessage(lang, {
          fr: 'Produit créé avec succès dans le catalogue VIP TADJ.',
          en: 'Product created successfully in the VIP TADJ catalog.',
          ar: 'تمت إضافة المنتج إلى كتالوج VIP TADJ بنجاح.',
        }),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Products POST Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la création du produit.',
    });
  }
}
