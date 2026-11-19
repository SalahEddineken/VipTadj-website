/**
 * VIP TADJ — Single Order API Route (F-ORD-02 & F-ORD-03)
 * GET /api/orders/[id] — Retrieve customer dossier and line items
 * PATCH /api/orders/[id] — Update order lifecycle status and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { PATCH as handleStatusPatch } from './status/route';
import { resolveApiLanguage, buildApiErrorResponse } from '@/app/api/_utils/api-i18n';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = resolveApiLanguage(req);

  try {
    const orderId = params.id;
    if (!orderId) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: "Identifiant de commande manquant dans l'URL.",
      });
    }

    const store = getDataStore();
    const order = await store.getOrderById(orderId);

    if (!order) {
      return buildApiErrorResponse(lang, {
        status: 404,
        errorCode: 'ORDER_NOT_FOUND',
        errorKey: 'api.error.order_not_found',
        frFallback: `Commande introuvable pour la référence "${orderId}".`,
      });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id] GET Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la récupération de la commande.',
    });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const lang = resolveApiLanguage(req);

  try {
    const orderId = context.params.id;
    if (!orderId) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: "Identifiant de commande manquant dans l'URL.",
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

    // If request is purely a status transition without items, delegate to handleStatusPatch
    if (body.status && !body.items && body.deliveryFee === undefined) {
      const clonedReq = new NextRequest(req.url, {
        method: req.method,
        headers: req.headers,
        body: JSON.stringify(body),
      });
      return handleStatusPatch(clonedReq, context);
    }

    // Validate items if provided
    if (body.items !== undefined) {
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return buildApiErrorResponse(lang, {
          status: 400,
          errorCode: 'ORDER_ITEMS_REQUIRED',
          errorKey: 'api.error.order_items_required',
          frFallback: 'Une commande doit contenir au moins un article.',
        });
      }

      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item.productId || !item.title || typeof item.price !== 'number' || item.price <= 0 || !item.selectedSize) {
          return buildApiErrorResponse(lang, {
            status: 400,
            errorCode: 'ORDER_INVALID_PAYLOAD',
            errorKey: 'api.error.order_invalid_payload',
            frFallback: `Article invalide à la ligne ${i + 1}.`,
          });
        }
      }
    }

    const store = getDataStore();
    const updatedOrder = await store.updateOrder(orderId, {
      items: body.items,
      customer: body.customer,
      deliveryFee: body.deliveryFee,
      discount: body.discount,
      adminNotes: body.adminNotes,
      note: body.note,
      updatedBy: body.updatedBy || 'Admin',
    });

    return NextResponse.json({
      success: true,
      message: 'Commande mise à jour avec succès.',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id] PATCH Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la mise à jour de la commande.',
    });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return PATCH(req, context);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const lang = resolveApiLanguage(req);

  try {
    const orderId = params.id;
    if (!orderId) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'ORDER_INVALID_PAYLOAD',
        errorKey: 'api.error.order_invalid_payload',
        frFallback: "Identifiant de commande manquant dans l'URL.",
      });
    }

    const store = getDataStore();
    const deleted = await store.deleteOrder(orderId);

    if (!deleted) {
      return buildApiErrorResponse(lang, {
        status: 404,
        errorCode: 'ORDER_NOT_FOUND',
        errorKey: 'api.error.order_not_found',
        frFallback: `Commande introuvable pour la référence "${orderId}".`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Commande supprimée avec succès.',
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id] DELETE Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur lors de la suppression de la commande.',
    });
  }
}
