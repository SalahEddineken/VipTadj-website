/**
 * VIP TADJ — Order Validation Schemas (F-ORD-03)
 * Zod validation for administrative status transitions, notes, and cancellation reasons.
 */

import { z } from 'zod';
import { VALID_ORDER_STATUSES } from '@/lib/utils/orderStateMachine';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation, formatTranslation } from '@/lib/i18n/locales';

export interface StructuredValidationError {
  errorCode: string;
  errorKey: string;
  errorParams?: Record<string, string | number>;
  message: string;
}

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(VALID_ORDER_STATUSES as [string, ...string[]], {
      required_error: 'Le statut de commande est obligatoire.',
      invalid_type_error: 'Statut de commande invalide.',
    }),
    note: z
      .string()
      .trim()
      .max(1000, 'La note explicative ne peut pas dépasser 1000 caractères.')
      .optional(),
    updatedBy: z
      .string()
      .trim()
      .max(150, "L'auteur de la mise à jour ne peut pas dépasser 150 caractères.")
      .optional()
      .default('Admin'),
    reason: z.string().trim().max(100).optional(),
    cancellationReason: z.string().trim().max(100).optional(),
    courier: z.string().trim().max(100).optional(),
    trackingCode: z.string().trim().max(100).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'cancelled') {
      const hasReason = Boolean(data.reason?.trim() || data.cancellationReason?.trim());
      const hasNote = Boolean(data.note && data.note.trim().length > 0);
      if (!hasReason && !hasNote) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['note'],
          message:
            "Une note explicative ou un motif d'annulation est obligatoire lors de l'annulation de la commande.",
        });
      }
    }
  });

export type UpdateOrderStatusPayload = z.infer<typeof updateOrderStatusSchema>;

export function getOrderStatusValidationError(
  issue: z.ZodIssue,
  language: SupportedLanguage = 'fr'
): StructuredValidationError {
  const field = issue.path[0] ? String(issue.path[0]) : '';

  if (field === 'status') {
    const isMissing =
      issue.code === 'invalid_type' && (issue as { received?: string }).received === 'undefined';
    const errorCode = isMissing ? 'ORDER_STATUS_REQUIRED' : 'ORDER_STATUS_INVALID';
    const errorKey = isMissing
      ? 'validation.order.status_required'
      : 'validation.order.status_invalid';
    return {
      errorCode,
      errorKey,
      message: getTranslation(language, errorKey, issue.message),
    };
  }

  if (field === 'note') {
    if (issue.code === 'too_big') {
      const errorParams = { max: 1000 };
      const errorKey = 'validation.order.note_max';
      return {
        errorCode: 'ORDER_NOTE_TOO_LONG',
        errorKey,
        errorParams,
        message: formatTranslation(getTranslation(language, errorKey, issue.message), errorParams),
      };
    }
    const errorKey = 'validation.order.cancel_note_required';
    return {
      errorCode: 'ORDER_CANCEL_NOTE_REQUIRED',
      errorKey,
      message: getTranslation(language, errorKey, issue.message),
    };
  }

  if (field === 'updatedBy') {
    const errorParams = { max: 150 };
    const errorKey = 'validation.order.updated_by_max';
    return {
      errorCode: 'ORDER_UPDATED_BY_TOO_LONG',
      errorKey,
      errorParams,
      message: formatTranslation(getTranslation(language, errorKey, issue.message), errorParams),
    };
  }

  const errorKey = 'validation.order.status_invalid';
  return {
    errorCode: 'ORDER_STATUS_INVALID',
    errorKey,
    message: getTranslation(language, errorKey, issue.message),
  };
}

export function validateOrderStatusPayload(
  data: unknown,
  language: SupportedLanguage = 'fr'
): {
  valid: boolean;
  error?: string;
  errorCode?: string;
  errorKey?: string;
  errorParams?: Record<string, string | number>;
  issues?: z.ZodIssue[];
  data?: UpdateOrderStatusPayload;
} {
  const result = updateOrderStatusSchema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const mapped = getOrderStatusValidationError(firstIssue, language);
    return {
      valid: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
      errorKey: mapped.errorKey,
      errorParams: mapped.errorParams,
      issues: result.error.issues,
    };
  }
  return { valid: true, data: result.data };
}
