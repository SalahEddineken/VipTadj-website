/**
 * VIP TADJ — Order State Machine & Audit History Engine (F-ORD-03)
 * Enforces strict order lifecycle transitions, terminal states,
 * cancellation reasons dictionary, and luxury badge tokens.
 */

import { OrderStatus, CancellationReason } from '@/types';

export const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'delivered',
  'cancelled',
] as const;

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
} as const;

export const ORDER_STATUS_TRANSITIONS = ALLOWED_STATUS_TRANSITIONS;

export interface CancellationReasonConfig {
  code: string;
  labelFr: string;
  legacyCode: CancellationReason;
}

export const CANCELLATION_REASONS: readonly CancellationReasonConfig[] = [
  {
    code: 'customer_cancelled',
    labelFr: 'Annulé à la demande du client',
    legacyCode: 'CUSTOMER_CANCELLED',
  },
  {
    code: 'customer_unreachable',
    labelFr: 'Client injoignable après 3 tentatives d’appel',
    legacyCode: 'UNREACHABLE_AFTER_CALLS',
  },
  {
    code: 'invalid_phone',
    labelFr: 'Numéro de téléphone erroné ou faux numéro',
    legacyCode: 'FAKE_ORDER',
  },
  {
    code: 'out_of_stock',
    labelFr: 'Rupture de stock sur un ou plusieurs articles',
    legacyCode: 'OUT_OF_STOCK',
  },
  {
    code: 'refused_delivery',
    labelFr: 'Colis refusé par le client à la livraison',
    legacyCode: 'DELIVERY_REFUSED',
  },
  {
    code: 'duplicate_order',
    labelFr: 'Commande passée en double exemplaire',
    legacyCode: 'DUPLICATE_ORDER',
  },
  {
    code: 'other',
    labelFr: 'Autre motif administratif',
    legacyCode: 'OTHER',
  },
] as const;

export const STATUS_LABELS_FR: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
  iconName: 'Clock' | 'CheckCircle' | 'Truck' | 'PackageCheck' | 'XCircle';
  description: string;
}

export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'En attente',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-400',
    iconName: 'Clock',
    description: 'En attente de validation téléphonique avec le client',
  },
  confirmed: {
    label: 'Confirmée',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-400',
    iconName: 'CheckCircle',
    description: 'Commande validée par téléphone, en cours de préparation',
  },
  shipped: {
    label: 'Expédiée',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dotClass: 'bg-purple-400',
    iconName: 'Truck',
    description: 'Colis confié au transporteur (Yalidine/ZR Express)',
  },
  delivered: {
    label: 'Livrée',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-400',
    iconName: 'PackageCheck',
    description: 'Colis livré et montant COD encaissé en espèces',
  },
  cancelled: {
    label: 'Annulée',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-400',
    iconName: 'XCircle',
    description: 'Commande annulée (stocks réintégrés au catalogue)',
  },
};

export const STATUS_BADGE_CLASSES: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  pending: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
  },
  confirmed: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30',
  },
  shipped: {
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  delivered: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
  },
  cancelled: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
  },
};

export function isValidTransition(current: OrderStatus, target: OrderStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[current]?.includes(target) ?? false;
}

export const canTransition = isValidTransition;

export function getAllowedTransitions(current: OrderStatus): OrderStatus[] {
  return [...(ALLOWED_STATUS_TRANSITIONS[current] || [])];
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function assertValidTransition(current: OrderStatus, target: OrderStatus): void {
  if (isTerminalStatus(current)) {
    throw new Error(
      `Impossible de modifier une commande clôturée. Le statut "${current}" est un état terminal définitif.`
    );
  }
  if (!isValidTransition(current, target)) {
    const allowed = getAllowedTransitions(current);
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'aucun';
    throw new Error(
      `Transition de statut invalide : passage de "${current}" vers "${target}" interdit. Statuts autorisés : [${allowedStr}].`
    );
  }
}

export function normalizeCancellationReason(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const matched = CANCELLATION_REASONS.find(
    (r) => r.code === cleaned || r.legacyCode.toLowerCase() === cleaned
  );
  return matched ? matched.code : raw.trim();
}
