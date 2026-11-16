/**
 * VIP TADJ — Single Order API Route (F-ORD-02 & F-ORD-03)
 * GET /api/orders/[id] — Retrieve customer dossier and line items
 * PATCH /api/orders/[id] — Update order lifecycle status and tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { PATCH as handleStatusPatch } from './status/route';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Identifiant de commande manquant dans l'URL." },
        { status: 400 }
      );
    }

    const store = getDataStore();
    const order = await store.getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Commande introuvable pour la référence "${orderId}".` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id] GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la récupération de la commande.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return handleStatusPatch(req, context);
}
