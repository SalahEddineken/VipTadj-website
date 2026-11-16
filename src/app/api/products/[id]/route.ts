import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { calculateTotalStock } from '@/lib/validations/product';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getDataStore();
    const product = await store.getProductById(params.id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produit introuvable.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error: any) {
    console.error('[API Product GET [id] Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la récupération du produit.' },
      { status: 500 }
    );
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
  try {
    const store = getDataStore();
    const existing = await store.getProductById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produit introuvable.' },
        { status: 404 }
      );
    }

    const body = await req.json();

    // If sizeInventory updated, recalculate stockQuantity and inStock
    if (body.sizeInventory && typeof body.sizeInventory === 'object') {
      const computedStock = calculateTotalStock(body.sizeInventory);
      body.stockQuantity = computedStock;
      body.inStock = computedStock > 0;

      const activeSizes = Object.entries(body.sizeInventory)
        .filter(([_, qty]) => Number(qty) > 0)
        .map(([size]) => size);
      body.sizes = activeSizes;
    } else if (body.stockQuantity !== undefined) {
      // Direct stockQuantity update
      const sq = Number(body.stockQuantity);
      body.stockQuantity = sq;
      if (body.inStock === undefined) {
        body.inStock = sq > 0;
      }
    } else if (body.inStock !== undefined && body.stockQuantity === undefined) {
      // If toggled inactive, or active
      if (!body.inStock) {
        body.stockQuantity = 0;
      } else if (existing.stockQuantity <= 0) {
        body.stockQuantity = 10; // default restock quantity when activating from 0
      }
    }

    // Normalize images if provided
    if (Array.isArray(body.images)) {
      body.images = body.images.map((img: any, idx: number) => ({
        ...img,
        url: normalizeImageUrl(img.url),
        isPrimary: Boolean(img.isPrimary) || (idx === 0 && !body.images.some((i: any) => i.isPrimary)),
      }));
      body.primaryImage = body.images.find((img: any) => img.isPrimary)?.url || body.images[0]?.url;
    }

    // Validate compareAtPrice invariant if both price and compareAtPrice are present
    const finalPrice = body.price !== undefined ? Number(body.price) : existing.price;
    const finalCompare = body.compareAtPrice !== undefined ? Number(body.compareAtPrice) : existing.compareAtPrice;

    if (finalCompare !== undefined && finalCompare !== null && !isNaN(finalCompare)) {
      if (finalCompare <= finalPrice) {
        return NextResponse.json(
          {
            success: false,
            error: 'Le prix barré doit être strictement supérieur au prix de vente.',
          },
          { status: 400 }
        );
      }
    }

    const updated = await store.updateProduct(id, body);

    return NextResponse.json({
      success: true,
      product: updated,
      message: 'Produit mis à jour avec succès.',
    });
  } catch (error: any) {
    console.error('[API Product UPDATE Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la mise à jour du produit.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const store = getDataStore();
    const existing = await store.getProductById(params.id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Produit introuvable ou déjà supprimé.' },
        { status: 404 }
      );
    }

    const success = await store.deleteProduct(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Échec de la suppression du produit.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Produit supprimé du catalogue avec succès.',
    });
  } catch (error: any) {
    console.error('[API Product DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la suppression du produit.' },
      { status: 500 }
    );
  }
}
