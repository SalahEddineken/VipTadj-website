/**
 * VIP TADJ — Order Status Transition API Route (F-ORD-03)
 * PATCH /api/orders/[id]/status
 * Validates transition rules, terminal states, audit note requirements,
 * and updates order lifecycle in the active data provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { validateOrderStatusPayload } from '@/lib/validations/order';
import {
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
  normalizeCancellationReason,
  getStatusLabel,
  getCancellationReasonLabel,
} from '@/lib/utils/orderStateMachine';
import { getTranslation, formatTranslation } from '@/lib/i18n/locales';
import { OrderStatus } from '@/types';
import {
  resolveApiLanguage,
  buildApiErrorResponse,
  getApiLocalizedMessage,
} from '@/app/api/_utils/api-i18n';

export const dynamic = 'force-dynamic';

export async function PATCH(
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
        errorCode: 'ORDER_STATUS_INVALID',
        errorKey: 'validation.order.status_invalid',
      });
    }

    const validation = validateOrderStatusPayload(body, lang);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Données de mise à jour invalides.',
          errorCode: validation.errorCode || 'ORDER_STATUS_INVALID',
          errorKey: validation.errorKey || 'validation.order.status_invalid',
          ...(validation.errorParams ? { errorParams: validation.errorParams } : {}),
          issues: validation.issues,
        },
        { status: 400 }
      );
    }

    const { status, note, updatedBy, reason, cancellationReason, courier, trackingCode } = validation.data;
    const targetStatus = status as OrderStatus;

    const dataStore = getDataStore();
    const existingOrder = await dataStore.getOrderById(orderId);

    if (!existingOrder) {
      return buildApiErrorResponse(lang, {
        status: 404,
        errorCode: 'ORDER_NOT_FOUND',
        errorKey: 'api.error.order_not_found',
        frFallback: `Commande introuvable pour la référence "${orderId}".`,
      });
    }

    const currentStatus = existingOrder.status;

    // 1. Terminal State Check
    if (isTerminalStatus(currentStatus)) {
      return buildApiErrorResponse(lang, {
        status: 422,
        code: 'TERMINAL_STATE',
        errorCode: 'TERMINAL_STATE',
        errorKey: 'api.error.terminal_state',
        errorParams: { current: currentStatus, target: targetStatus },
        frFallback: `Impossible de modifier une commande clôturée. Le statut "${currentStatus}" est un état terminal définitif.`,
        extra: {
          currentStatus,
          targetStatus,
          allowedTransitions: [],
        },
      });
    }

    // 2. State Machine Legal Transition Check
    if (!canTransition(currentStatus, targetStatus)) {
      const allowed = getAllowedTransitions(currentStatus);
      return buildApiErrorResponse(lang, {
        status: 422,
        code: 'INVALID_STATE_TRANSITION',
        errorCode: 'INVALID_STATE_TRANSITION',
        errorKey: 'api.error.invalid_transition',
        errorParams: {
          current: currentStatus,
          target: targetStatus,
          allowed: allowed.join(', '),
        },
        frFallback: `Transition de statut interdite : impossible de passer de "${currentStatus}" à "${targetStatus}".`,
        extra: {
          currentStatus,
          targetStatus,
          allowedTransitions: allowed,
        },
      });
    }

    // 3. Assemble Audit History Note & Reason
    const normalizedReason = normalizeCancellationReason(cancellationReason || reason);
    const statusDisplay = getStatusLabel(targetStatus, lang);
    const defaultNote = normalizedReason
      ? formatTranslation(
          getTranslation(lang, 'admin.orders.system_note.reason_prefix', 'Motif : {reason}'),
          { reason: getCancellationReasonLabel(normalizedReason, lang) }
        )
      : formatTranslation(
          getTranslation(lang, 'admin.orders.system_note.status_changed', 'Statut changé vers {status}'),
          { status: statusDisplay }
        );
    const finalNote = note || defaultNote;

    // 4. Update Order in Data Store
    const updatedOrder = await dataStore.updateOrderStatus(
      existingOrder.id,
      targetStatus,
      finalNote,
      updatedBy,
      normalizedReason,
      courier || trackingCode ? { courier, trackingCode } : undefined
    );

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: getApiLocalizedMessage(lang, {
        fr: `Statut de la commande mis à jour vers "${targetStatus}" avec succès.`,
        en: `Order status updated to "${statusDisplay}" successfully.`,
        ar: `تم تحديث حالة الطلبية إلى "${statusDisplay}" بنجاح.`,
      }),
    });
  } catch (error: any) {
    console.error('[API /api/orders/[id]/status PATCH Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'INTERNAL_ERROR',
      errorKey: 'api.error.internal',
      frFallback: error?.message || 'Erreur interne lors de la mise à jour du statut.',
    });
  }
}
