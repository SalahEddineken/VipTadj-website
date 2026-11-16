import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { productSchema, calculateTotalStock } from '@/lib/validations/product';
import { ProductCategoryType, ProductFilter } from '@/types';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';

const CATEGORY_SLUG_MAP: Record<ProductCategoryType, string> = {
  clothing: 'vetements',
  shoes: 'chaussures',
  accessories: 'accessoires',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId') as ProductCategoryType | null;
    const categorySlug = searchParams.get('categorySlug');
    const subcategory = searchParams.get('subcategory');
    const inStockParam = searchParams.get('inStock');
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
    if (featuredParam !== null) filter.featured = featuredParam === 'true';
    if (search) filter.search = search;
    if (sortBy) filter.sortBy = sortBy as any;
    if (limitParam) filter.limit = parseInt(limitParam, 10);
    if (offsetParam) filter.offset = parseInt(offsetParam, 10);

    const store = getDataStore();
    const products = await store.getProducts(filter);

    return NextResponse.json({
      success: true,
      products,
      total: products.length,
    });
  } catch (error: any) {
    console.error('[API Products GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la récupération des produits.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Map categorySlug if not provided
    if (body.categoryId && !body.categorySlug) {
      body.categorySlug = CATEGORY_SLUG_MAP[body.categoryId as ProductCategoryType] || 'vetements';
    }

    // Auto-compute stock from sizeInventory if available
    if (body.sizeInventory && typeof body.sizeInventory === 'object') {
      const computedStock = calculateTotalStock(body.sizeInventory);
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
      body.images = body.images.map((img: any, idx: number) => ({
        ...img,
        url: normalizeImageUrl(img.url),
        isPrimary: Boolean(img.isPrimary) || (idx === 0 && !body.images.some((i: any) => i.isPrimary)),
      }));
      body.primaryImage = body.images.find((img: any) => img.isPrimary)?.url || body.images[0]?.url;
    }

    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] ? String(issue.path[0]) : 'general';
        errors[field] = issue.message;
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Données de produit non valides.',
          errors,
        },
        { status: 400 }
      );
    }

    const store = getDataStore();
    const newProduct = await store.createProduct(validation.data as any);

    return NextResponse.json(
      {
        success: true,
        product: newProduct,
        message: 'Produit créé avec succès dans le catalogue VIP TADJ.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API Products POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la création du produit.' },
      { status: 500 }
    );
  }
}
