/**
 * VIP TADJ — Order Status Transition API Route (F-ORD-03)
 * PATCH /api/orders/[id]/status
 * Validates transition rules, terminal states, audit note requirements,
 * and updates order lifecycle in the active data provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { updateOrderStatusSchema } from '@/lib/validations/order';
import {
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
  normalizeCancellationReason,
} from '@/lib/utils/orderStateMachine';
import { OrderStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function PATCH(
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

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format JSON invalide dans le corps de la requête.' },
        { status: 400 }
      );
    }

    const validation = updateOrderStatusSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Données de mise à jour invalides.';
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          issues: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { status, note, updatedBy, reason, cancellationReason } = validation.data;
    const targetStatus = status as OrderStatus;

    const dataStore = getDataStore();
    const existingOrder = await dataStore.getOrderById(orderId);

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: `Commande introuvable pour la référence "${orderId}".` },
        { status: 404 }
      );
    }

    const currentStatus = existingOrder.status;

    // 1. Terminal State Check
    if (isTerminalStatus(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          code: 'TERMINAL_STATE',
          error: `Impossible de modifier une commande clôturée. Le statut "${currentStatus}" est un état terminal définitif.`,
          currentStatus,
          targetStatus,
          allowedTransitions: [],
        },
        { status: 422 }
      );
    }

    // 2. State Machine Legal Transition Check
    if (!canTransition(currentStatus, targetStatus)) {
      const allowed = getAllowedTransitions(currentStatus);
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_STATE_TRANSITION',
          error: `Transition de statut interdite : impossible de passer de "${currentStatus}" à "${targetStatus}".`,
          currentStatus,
          targetStatus,
          allowedTransitions: allowed,
        },
        { status: 422 }
      );
    }

    // 3. Assemble Audit History Note & Reason
    const normalizedReason = normalizeCancellationReason(cancellationReason || reason);
    const finalNote = note || (normalizedReason ? `Motif : ${normalizedReason}` : `Statut changé vers ${targetStatus}`);

    // 4. Update Order in Data Store
    const updatedOrder = await dataStore.updateOrderStatus(
      existingOrder.id,
      targetStatus,
      finalNote,
      updatedBy,
      normalizedReason
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Statut de la commande mis à jour vers "${targetStatus}" avec succès.`,
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id]/status PATCH Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne lors de la mise à jour du statut.' },
      { status: 500 }
    );
  }
}
