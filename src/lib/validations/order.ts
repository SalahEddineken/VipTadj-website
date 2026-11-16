/**
 * VIP TADJ — Order Validation Schemas (F-ORD-03)
 * Zod validation for administrative status transitions, notes, and cancellation reasons.
 */

import { z } from 'zod';
import { VALID_ORDER_STATUSES } from '@/lib/utils/orderStateMachine';

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
