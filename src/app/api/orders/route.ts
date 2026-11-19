import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { CreateOrderInput, OrderItem, CustomerShippingInfo } from '@/types';
import { isValidAlgerianPhone } from '@/lib/utils/contactUtils';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getLocalizedProduct, getLocalizedSize } from '@/lib/i18n/catalog-translations';
import {
  resolveApiLanguage,
  buildApiErrorResponse,
  getApiLocalizedMessage,
} from '@/app/api/_utils/api-i18n';

export const dynamic = 'force-dynamic';

interface OrderPayloadValidationResult {
  valid: boolean;
  errorCode?: string;
  errorKey?: string;
  frFallback?: string;
}

/**
 * Validates the raw request body against the VIP TADJ checkout contract.
 */
function validateOrderPayload(data: any): OrderPayloadValidationResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errorCode: 'ORDER_INVALID_PAYLOAD',
      errorKey: 'api.error.order_invalid_payload',
      frFallback: 'Données de commande invalides ou corps de requête manquant.',
    };
  }

  // 1. Items array validation
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return {
      valid: false,
      errorCode: 'ORDER_ITEMS_REQUIRED',
      errorKey: 'api.error.order_items_required',
      frFallback: 'Une commande doit contenir au moins un article.',
    };
  }

  for (let i = 0; i < data.items.length; i++) {
    const item: OrderItem = data.items[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return {
        valid: false,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: `Article invalide à la ligne ${i + 1}.`,
      };
    }
    if (!item.productId || typeof item.productId !== 'string') {
      return {
        valid: false,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: `Identifiant produit manquant pour la ligne ${i + 1}.`,
      };
    }
    if (!item.title || typeof item.title !== 'string') {
      return {
        valid: false,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: `Titre du produit manquant pour la ligne ${i + 1}.`,
      };
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      return {
        valid: false,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: `Prix invalide pour l'article "${item.title}".`,
      };
    }
    if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      return {
        valid: false,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: `Quantité invalide pour l'article "${item.title}".`,
      };
    }
    if (!item.selectedSize || typeof item.selectedSize !== 'string') {
      return {
        valid: false,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: `Taille obligatoire non spécifiée pour l'article "${item.title}".`,
      };
    }
  }

  // 2. Customer shipping dossier validation
  const customer = data.customer;
  if (!customer || typeof customer !== 'object') {
    return {
      valid: false,
      errorCode: 'ORDER_INVALID_PAYLOAD',
      errorKey: 'api.error.order_invalid_payload',
      frFallback: 'Dossier client et informations de livraison obligatoires.',
    };
  }

  if (!customer.fullName || typeof customer.fullName !== 'string' || customer.fullName.trim().length < 3) {
    return {
      valid: false,
      errorCode: 'CHECKOUT_NAME_REQUIRED',
      errorKey: 'checkout.validation.name_required',
      frFallback: 'Le nom complet est obligatoire (min 3 caractères).',
    };
  }

  if (!customer.phone || typeof customer.phone !== 'string' || !isValidAlgerianPhone(customer.phone)) {
    return {
      valid: false,
      errorCode: 'CHECKOUT_PHONE_INVALID',
      errorKey: 'checkout.validation.phone_invalid',
      frFallback: 'Numéro de téléphone algérien invalide.',
    };
  }

  const rawWilayaCode = customer.wilayaCode;
  const wilayaCode =
    typeof rawWilayaCode === 'boolean' ||
    Array.isArray(rawWilayaCode) ||
    (typeof rawWilayaCode === 'string' && !rawWilayaCode.trim())
      ? NaN
      : Number(rawWilayaCode);
  if (
    !Number.isFinite(wilayaCode) ||
    !Number.isInteger(wilayaCode) ||
    wilayaCode < 1 ||
    wilayaCode > 68
  ) {
    return {
      valid: false,
      errorCode: 'CHECKOUT_WILAYA_REQUIRED',
      errorKey: 'checkout.validation.wilaya_required',
      frFallback: 'Veuillez sélectionner une wilaya parmi les 68 wilayas.',
    };
  }

  if (!customer.wilaya || typeof customer.wilaya !== 'string' || !customer.wilaya.trim()) {
    return {
      valid: false,
      errorCode: 'CHECKOUT_WILAYA_REQUIRED',
      errorKey: 'checkout.validation.wilaya_required',
      frFallback: 'Veuillez sélectionner une wilaya valide.',
    };
  }

  if (!customer.commune || typeof customer.commune !== 'string' || !customer.commune.trim()) {
    return {
      valid: false,
      errorCode: 'CHECKOUT_COMMUNE_REQUIRED',
      errorKey: 'checkout.validation.commune_required',
      frFallback: 'La commune de livraison est obligatoire.',
    };
  }

  return { valid: true };
}

/**
 * POST /api/orders
 * Places a new Cash on Delivery (COD) order.
 */
export async function POST(req: NextRequest) {
  const lang: SupportedLanguage = resolveApiLanguage(req);

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

    // 1. Structural and field validation
    const validation = validateOrderPayload(body);
    if (!validation.valid) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: validation.errorCode || 'ORDER_INVALID_PAYLOAD',
        errorKey: validation.errorKey || 'api.error.order_invalid_payload',
        frFallback: validation.frFallback,
      });
    }

    const dataStore = getDataStore();

    // 2. Real-time Inventory Verification (rejects out-of-stock items & size shortages)
    for (const item of body.items) {
      const product = await dataStore.getProductById(item.productId);
      if (!product) {
        return buildApiErrorResponse(lang, {
          status: 404,
          errorCode: 'PRODUCT_NOT_FOUND',
          errorKey: 'api.error.product_not_found',
          frFallback: `Le produit "${item.title}" n'est plus référencé dans notre catalogue.`,
        });
      }

      const localizedTitle = getLocalizedProduct(
        { id: product.id, title: product.title || item.title, titleAr: product.titleAr, titleEn: product.titleEn, description: '' },
        lang
      ).title;

      if (!product.inStock || product.stockQuantity < item.quantity) {
        return buildApiErrorResponse(lang, {
          status: 409,
          code: 'OUT_OF_STOCK',
          errorCode: 'OUT_OF_STOCK',
          errorKey: 'api.error.out_of_stock_product',
          errorParams: { title: localizedTitle, available: product.stockQuantity },
          frFallback: `Stock insuffisant pour "${item.title}". Exemplaires restants: ${product.stockQuantity}.`,
          extra: { availableStock: product.stockQuantity },
        });
      }

      // Check specific size inventory if available
      if (product.sizeInventory && item.selectedSize && product.sizeInventory[item.selectedSize] !== undefined) {
        const sizeStock = Number(product.sizeInventory[item.selectedSize] || 0);
        if (sizeStock < item.quantity) {
          const localizedSize = getLocalizedSize(item.selectedSize, lang);
          return buildApiErrorResponse(lang, {
            status: 409,
            code: 'OUT_OF_STOCK',
            errorCode: 'OUT_OF_STOCK',
            errorKey: 'api.error.out_of_stock_size',
            errorParams: {
              title: localizedTitle,
              size: localizedSize,
              available: sizeStock,
            },
            frFallback: `Stock insuffisant pour "${item.title}" en taille ${item.selectedSize}. Exemplaires restants: ${sizeStock}.`,
            extra: { availableStock: sizeStock },
          });
        }
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
    if (typeof body.deliveryFee !== 'number') {
      const wCode = Number(body.customer?.wilayaCode);
      const dType = body.customer?.deliveryType === 'desk' ? 'desk' : 'home';
      const cName = body.customer?.commune ? String(body.customer.commune).trim() : null;

      const { calculateDeliveryFee } = await import('@/lib/utils/deliveryUtils');
      deliveryFee = calculateDeliveryFee(
        calculatedSubtotal,
        wCode,
        freeShippingThreshold,
        dType,
        storeSettings?.wilayaShippingFees,
        cName,
        storeSettings?.communeShippingFees
      );
    }
    if (calculatedSubtotal >= freeShippingThreshold) {
      deliveryFee = 0; // Qualified for free shipping across all 68 wilayas
    }

    const discount = typeof body.discount === 'number' ? Math.max(0, body.discount) : 0;
    const finalTotal = Math.max(0, calculatedSubtotal + deliveryFee - discount);

    // 4. Assemble clean CreateOrderInput
    const cleanCustomer: CustomerShippingInfo = {
      fullName: body.customer.fullName.trim(),
      phone: body.customer.phone.trim(),
      wilaya: body.customer.wilaya.trim(),
      wilayaCode: Number(body.customer.wilayaCode),
      commune: body.customer.commune.trim(),
      address: typeof body.customer.address === 'string' ? body.customer.address.trim() : '',
      deliveryType: body.customer.deliveryType === 'desk' ? 'desk' : 'home',
    };

    if (body.customer.secondaryPhone && body.customer.secondaryPhone.trim()) {
      cleanCustomer.secondaryPhone = body.customer.secondaryPhone.trim();
    }
    if (body.customer.notes && body.customer.notes.trim()) {
      cleanCustomer.notes = body.customer.notes.trim();
    }

    const cleanItems = body.items.map((it: OrderItem) => {
      const item: OrderItem = {
        productId: it.productId,
        title: it.title,
        slug: it.slug || '',
        price: it.price,
        quantity: it.quantity,
        selectedSize: it.selectedSize,
        image: it.image,
      };
      if (it.selectedColor && it.selectedColor.trim()) {
        item.selectedColor = it.selectedColor.trim();
      }
      return item;
    });

    const orderPayload: CreateOrderInput = {
      customer: cleanCustomer,
      items: cleanItems,
      deliveryFee,
      discount,
    };

    const generalNotes = body.notes?.trim() || body.customer.notes?.trim();
    if (generalNotes) {
      orderPayload.notes = generalNotes;
    }

    // 5. Atomic Order Creation and Stock Decrement in Data Store
    const createdOrder = await dataStore.createOrder(orderPayload);

    // 6. Return standard 201 Created response
    return NextResponse.json(
      {
        success: true,
        order: createdOrder,
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        message: getApiLocalizedMessage(lang, {
          fr: 'Commande enregistrée avec succès. Notre service client vous appellera sous 2h.',
          en: 'Order placed successfully. Our customer service will call you within 2 hours.',
          ar: 'تم تسجيل طلبيتك بنجاح. سيتصل بك فريق خدمة الزبائن خلال ساعتين لتأكيدها.',
        }),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/orders POST Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || "Une erreur interne est survenue lors de l'enregistrement de votre commande.",
    });
  }
}

/**
 * GET /api/orders
 * Retrieves orders by filter or resolves single order by ID / orderNumber.
 */
export async function GET(req: NextRequest) {
  const lang: SupportedLanguage = resolveApiLanguage(req);

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('orderNumber');
    const dataStore = getDataStore();

    if (id) {
      const order = await dataStore.getOrderById(id);
      if (!order) {
        return buildApiErrorResponse(lang, {
          status: 404,
          errorCode: 'ORDER_NOT_FOUND',
          errorKey: 'api.error.order_not_found',
          frFallback: `Commande introuvable pour la référence "${id}".`,
        });
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
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la récupération des commandes.',
    });
  }
}
