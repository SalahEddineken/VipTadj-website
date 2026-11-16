import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { CreateOrderInput, OrderItem } from '@/types';
import { isValidAlgerianPhone } from '@/lib/utils/contactUtils';

export const dynamic = 'force-dynamic';

/**
 * Validates the raw request body against the VIP TADJ checkout contract.
 */
function validateOrderPayload(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Données de commande invalides ou corps de requête manquant.' };
  }

  // 1. Items array validation
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return { valid: false, error: 'Une commande doit contenir au moins un article.' };
  }

  for (let i = 0; i < data.items.length; i++) {
    const item: OrderItem = data.items[i];
    if (!item.productId || typeof item.productId !== 'string') {
      return { valid: false, error: `Identifiant produit manquant pour la ligne ${i + 1}.` };
    }
    if (!item.title || typeof item.title !== 'string') {
      return { valid: false, error: `Titre du produit manquant pour la ligne ${i + 1}.` };
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      return { valid: false, error: `Prix invalide pour l'article "${item.title}".` };
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return { valid: false, error: `Quantité invalide pour l'article "${item.title}".` };
    }
    if (!item.selectedSize || typeof item.selectedSize !== 'string') {
      return { valid: false, error: `Taille obligatoire non spécifiée pour l'article "${item.title}".` };
    }
  }

  // 2. Customer shipping dossier validation
  const customer = data.customer;
  if (!customer || typeof customer !== 'object') {
    return { valid: false, error: 'Dossier client et informations de livraison obligatoires.' };
  }

  if (!customer.fullName || typeof customer.fullName !== 'string' || customer.fullName.trim().length < 3) {
    return { valid: false, error: 'Le nom complet est obligatoire (min 3 caractères).' };
  }

  if (!customer.phone || typeof customer.phone !== 'string' || !isValidAlgerianPhone(customer.phone)) {
    return { valid: false, error: 'Numéro de téléphone algérien invalide.' };
  }

  const wilayaCode = Number(customer.wilayaCode);
  if (!wilayaCode || isNaN(wilayaCode) || wilayaCode < 1 || wilayaCode > 58) {
    return { valid: false, error: 'Veuillez sélectionner une wilaya parmi les 58 wilayas.' };
  }

  if (!customer.wilaya || typeof customer.wilaya !== 'string' || !customer.wilaya.trim()) {
    return { valid: false, error: 'Veuillez sélectionner une wilaya valide.' };
  }

  if (!customer.commune || typeof customer.commune !== 'string' || !customer.commune.trim()) {
    return { valid: false, error: 'La commune de livraison est obligatoire.' };
  }

  if (!customer.address || typeof customer.address !== 'string' || customer.address.trim().length < 5) {
    return { valid: false, error: "L'adresse de livraison détaillée est obligatoire." };
  }

  return { valid: true };
}

/**
 * POST /api/orders
 * Places a new Cash on Delivery (COD) order.
 */
export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format JSON invalide dans le corps de la requête.' },
        { status: 400 }
      );
    }

    // 1. Structural and field validation
    const validation = validateOrderPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const dataStore = getDataStore();

    // 2. Real-time Inventory Verification (rejects out-of-stock items)
    for (const item of body.items) {
      const product = await dataStore.getProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Le produit "${item.title}" n'est plus référencé dans notre catalogue.` },
          { status: 404 }
        );
      }

      if (!product.inStock || product.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            code: 'OUT_OF_STOCK',
            error: `Stock insuffisant pour "${item.title}". Exemplaires restants: ${product.stockQuantity}.`,
            availableStock: product.stockQuantity,
          },
          { status: 409 }
        );
      }
    }

    // 3. Financial Recalculation & Integrity Checks
    const calculatedSubtotal = body.items.reduce(
      (sum: number, it: OrderItem) => sum + it.price * it.quantity,
      0
    );

    const storeSettings = await dataStore.getSettings();
    const freeShippingThreshold = storeSettings?.freeShippingThreshold ?? 15000;

    let deliveryFee = typeof body.deliveryFee === 'number' ? Math.max(0, body.deliveryFee) : 600;
    if (typeof body.deliveryFee !== 'number' && storeSettings?.wilayaShippingFees && storeSettings.wilayaShippingFees[Number(body.customer?.wilayaCode)]) {
      const cfg = storeSettings.wilayaShippingFees[Number(body.customer.wilayaCode)];
      deliveryFee = body.customer?.deliveryType === 'desk' ? (cfg.deskFee ?? 350) : (cfg.homeFee ?? 600);
    }
    if (calculatedSubtotal >= freeShippingThreshold) {
      deliveryFee = 0; // Qualified for free shipping across all 58 wilayas
    }

    const discount = typeof body.discount === 'number' ? Math.max(0, body.discount) : 0;
    const finalTotal = Math.max(0, calculatedSubtotal + deliveryFee - discount);

    // 4. Assemble clean CreateOrderInput
    const orderPayload: CreateOrderInput = {
      customer: {
        fullName: body.customer.fullName.trim(),
        phone: body.customer.phone.trim(),
        secondaryPhone: body.customer.secondaryPhone?.trim() || undefined,
        wilaya: body.customer.wilaya.trim(),
        wilayaCode: Number(body.customer.wilayaCode),
        commune: body.customer.commune.trim(),
        address: body.customer.address.trim(),
        notes: body.customer.notes?.trim() || undefined,
        deliveryType: body.customer.deliveryType === 'desk' ? 'desk' : 'home',
      },
      items: body.items.map((it: OrderItem) => ({
        productId: it.productId,
        title: it.title,
        slug: it.slug || '',
        price: it.price,
        quantity: it.quantity,
        selectedSize: it.selectedSize,
        selectedColor: it.selectedColor || undefined,
        image: it.image,
      })),
      deliveryFee,
      discount,
      notes: body.notes?.trim() || body.customer.notes?.trim() || undefined,
    };

    // 5. Atomic Order Creation and Stock Decrement in Data Store
    const createdOrder = await dataStore.createOrder(orderPayload);

    // 6. Return standard 201 Created response
    return NextResponse.json(
      {
        success: true,
        order: createdOrder,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        message: 'Commande enregistrée avec succès. Notre service client vous appellera sous 2h.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/orders POST Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Une erreur interne est survenue lors de l\'enregistrement de votre commande.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders
 * Retrieves orders by filter or resolves single order by ID / orderNumber.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('orderNumber');
    const dataStore = getDataStore();

    if (id) {
      const order = await dataStore.getOrderById(id);
      if (!order) {
        return NextResponse.json(
          { success: false, error: `Commande introuvable pour la référence "${id}".` },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, order });
    }

    const status = searchParams.get('status') as any;
    const search = searchParams.get('search') || undefined;
    const wilayaCode = searchParams.get('wilayaCode') ? Number(searchParams.get('wilayaCode')) : undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined;

    const orders = await dataStore.getOrders({
      status,
      search,
      wilayaCode,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (error: any) {
    console.error('[API /api/orders GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la récupération des commandes.' },
      { status: 500 }
    );
  }
}
