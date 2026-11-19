/**
 * VIP TADJ — Order State Machine & Audit History Engine (F-ORD-03)
 * Enforces strict order lifecycle transitions, terminal states,
 * cancellation reasons dictionary, and luxury badge tokens.
 */

import { OrderStatus, CancellationReason } from '@/types';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation, formatTranslation } from '@/lib/i18n/locales';

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
  labelEn?: string;
  labelAr?: string;
  legacyCode: CancellationReason;
}

export const CANCELLATION_REASONS: readonly CancellationReasonConfig[] = [
  {
    code: 'customer_cancelled',
    labelFr: 'Annulé à la demande du client',
    labelEn: 'Cancelled at customer request',
    labelAr: 'تم الإلغاء بناءً على طلب الزبون',
    legacyCode: 'CUSTOMER_CANCELLED',
  },
  {
    code: 'customer_unreachable',
    labelFr: 'Client injoignable après 3 tentatives d’appel',
    labelEn: 'Customer unreachable after 3 call attempts',
    labelAr: 'تعذر الاتصال بالزبون بعد 3 محاولات',
    legacyCode: 'UNREACHABLE_AFTER_CALLS',
  },
  {
    code: 'invalid_phone',
    labelFr: 'Numéro de téléphone erroné ou faux numéro',
    labelEn: 'Invalid or fake phone number',
    labelAr: 'رقم هاتف خاطئ أو وهمي',
    legacyCode: 'FAKE_ORDER',
  },
  {
    code: 'out_of_stock',
    labelFr: 'Rupture de stock sur un ou plusieurs articles',
    labelEn: 'Out of stock on one or more items',
    labelAr: 'نفاد المخزون لأحد المنتجات أو أكثر',
    legacyCode: 'OUT_OF_STOCK',
  },
  {
    code: 'refused_delivery',
    labelFr: 'Colis refusé par le client à la livraison',
    labelEn: 'Parcel refused by customer on delivery',
    labelAr: 'رفض استلام الطرد عند التسليم',
    legacyCode: 'DELIVERY_REFUSED',
  },
  {
    code: 'duplicate_order',
    labelFr: 'Commande passée en double exemplaire',
    labelEn: 'Duplicate order',
    labelAr: 'طلبية مكررة',
    legacyCode: 'DUPLICATE_ORDER',
  },
  {
    code: 'other',
    labelFr: 'Autre motif administratif',
    labelEn: 'Other administrative reason',
    labelAr: 'سبب إداري آخر',
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
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    iconName: 'Clock',
    description: 'En attente de validation téléphonique avec le client',
  },
  confirmed: {
    label: 'Confirmée',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
    iconName: 'CheckCircle',
    description: 'Commande validée par téléphone, en cours de préparation',
  },
  shipped: {
    label: 'Expédiée',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    dotClass: 'bg-purple-500',
    iconName: 'Truck',
    description: 'Colis confié au transporteur (Yalidine/ZR Express)',
  },
  delivered: {
    label: 'Livrée',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    iconName: 'PackageCheck',
    description: 'Colis livré et montant COD encaissé en espèces',
  },
  cancelled: {
    label: 'Annulée',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
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

export const getValidNextStatuses = getAllowedTransitions;

export function isTerminalStatus(status: OrderStatus): boolean {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export class OrderTransitionError extends Error {
  readonly code: 'TERMINAL_STATE' | 'INVALID_STATE_TRANSITION';
  readonly errorKey: string;
  readonly errorParams: Record<string, string>;
  readonly currentStatus: OrderStatus;
  readonly targetStatus: OrderStatus;
  readonly allowedTransitions: OrderStatus[];

  constructor(params: {
    message: string;
    code: 'TERMINAL_STATE' | 'INVALID_STATE_TRANSITION';
    errorKey: string;
    errorParams: Record<string, string>;
    currentStatus: OrderStatus;
    targetStatus: OrderStatus;
    allowedTransitions: OrderStatus[];
  }) {
    super(params.message);
    this.name = 'OrderTransitionError';
    this.code = params.code;
    this.errorKey = params.errorKey;
    this.errorParams = params.errorParams;
    this.currentStatus = params.currentStatus;
    this.targetStatus = params.targetStatus;
    this.allowedTransitions = params.allowedTransitions;
  }
}

export function assertValidTransition(current: OrderStatus, target: OrderStatus): void {
  if (isTerminalStatus(current)) {
    throw new OrderTransitionError({
      message: `Impossible de modifier une commande clôturée. Le statut "${current}" est un état terminal définitif.`,
      code: 'TERMINAL_STATE',
      errorKey: 'api.error.terminal_state',
      errorParams: { current, target },
      currentStatus: current,
      targetStatus: target,
      allowedTransitions: [],
    });
  }
  if (!isValidTransition(current, target)) {
    const allowed = getAllowedTransitions(current);
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : 'aucun';
    throw new OrderTransitionError({
      message: `Transition de statut invalide : passage de "${current}" vers "${target}" interdit. Statuts autorisés : [${allowedStr}].`,
      code: 'INVALID_STATE_TRANSITION',
      errorKey: 'api.error.invalid_transition',
      errorParams: { current, target, allowed: allowedStr },
      currentStatus: current,
      targetStatus: target,
      allowedTransitions: allowed,
    });
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

export function getStatusLabel(
  status: OrderStatus,
  language: SupportedLanguage = 'fr'
): string {
  return getTranslation(language, `status.${status}`, STATUS_LABELS_FR[status] || status);
}

export function getStatusDescription(
  status: OrderStatus,
  language: SupportedLanguage = 'fr'
): string {
  return getTranslation(
    language,
    `status.desc.${status}`,
    STATUS_CONFIG[status]?.description || ''
  );
}

export function getCancellationReasonLabel(
  codeOrLegacy?: string,
  language: SupportedLanguage = 'fr'
): string {
  if (!codeOrLegacy || typeof codeOrLegacy !== 'string') return '';
  const normalized = normalizeCancellationReason(codeOrLegacy);
  const matched = CANCELLATION_REASONS.find(
    (r) => r.code === normalized || r.legacyCode === codeOrLegacy
  );
  if (matched) {
    const fallback =
      language === 'ar'
        ? matched.labelAr || matched.labelFr
        : language === 'en'
        ? matched.labelEn || matched.labelFr
        : matched.labelFr;
    return getTranslation(language, `admin.orders.cancel_reason.${matched.code}`, fallback);
  }
  return codeOrLegacy;
}

const COURIER_CANONICAL_MAP: Record<string, string> = {
  'yalidine express': 'Yalidine Express',
  'ياليدين إكسبريس': 'Yalidine Express',
  'yalidine': 'Yalidine',
  'ياليدين': 'Yalidine',
  'zr express': 'ZR Express',
  'zr إكسبريس': 'ZR Express',
  'procolis': 'Procolis',
  'بروكوليس': 'Procolis',
  'livraison interne vip tadj': 'Livraison Interne VIP TADJ',
  'vip tadj internal delivery': 'Livraison Interne VIP TADJ',
  'توصيل داخلي vip tadj': 'Livraison Interne VIP TADJ',
  'internal': 'Livraison Interne VIP TADJ',
  'autre': 'Autre',
  'autre transporteur': 'Autre',
  'other': 'Autre',
  'other carrier': 'Autre',
  'شركة توصيل أخرى': 'Autre',
};

export function getLocalizedCourierName(
  courier: string,
  language: SupportedLanguage = 'fr'
): string {
  if (!courier || typeof courier !== 'string') return '';
  const trimmed = courier.trim();
  if (!trimmed) return '';
  const canonical = COURIER_CANONICAL_MAP[trimmed.toLowerCase()] || trimmed;

  if (canonical === 'Livraison Interne VIP TADJ') {
    return getTranslation(language, 'admin.orders.internal_delivery', 'Livraison Interne VIP TADJ');
  }
  if (canonical === 'Autre') {
    return getTranslation(language, 'admin.orders.other_carrier', 'Autre transporteur');
  }
  if (language === 'ar') {
    if (canonical === 'Yalidine Express') return 'ياليدين إكسبريس';
    if (canonical === 'Yalidine') return 'ياليدين';
    if (canonical === 'ZR Express') return 'ZR إكسبريس';
    if (canonical === 'Procolis') return 'بروكوليس';
  }
  return canonical;
}

const SYSTEM_NOTE_KEY_MAP: Record<string, string> = {
  'commande reçue via le storefront': 'admin.orders.system_note.storefront_received',
  'commande créée par le client': 'admin.orders.system_note.customer_created',
  'commande passée depuis le storefront': 'admin.orders.system_note.storefront_placed',
  'commande validée par téléphone': 'admin.orders.system_note.phone_validated',
  'colis livré et montant cod encaissé': 'admin.orders.system_note.delivered_cod',
  'commande annulée': 'admin.orders.modal_note_default_cancelled',
};

function resolveStatusFromToken(raw: string): OrderStatus | undefined {
  const lower = raw.trim().toLowerCase();
  if ((VALID_ORDER_STATUSES as readonly string[]).includes(lower)) {
    return lower as OrderStatus;
  }
  for (const s of VALID_ORDER_STATUSES) {
    if (
      getStatusLabel(s, 'fr').toLowerCase() === lower ||
      getStatusLabel(s, 'en').toLowerCase() === lower ||
      getStatusLabel(s, 'ar').toLowerCase() === lower
    ) {
      return s;
    }
  }
  return undefined;
}

export function getLocalizedOrderNote(
  note?: string,
  language: SupportedLanguage = 'fr'
): string {
  if (!note || typeof note !== 'string') return '';
  const trimmed = note.trim();
  const key = SYSTEM_NOTE_KEY_MAP[trimmed.toLowerCase()];
  if (key) {
    return getTranslation(language, key, trimmed);
  }

  const shippedMatch =
    trimmed.match(/^Colis remis à\s+(.+)$/i) ||
    trimmed.match(/^Parcel handed to\s+(.+)$/i) ||
    trimmed.match(/^تم تسليم الطرد إلى\s+(.+)$/u);
  if (shippedMatch) {
    const rest = shippedMatch[1].trim();
    const trackingMatch = rest.match(/^(.*?)\s*\(([^()]+)\)$/);
    const rawCourier = trackingMatch ? trackingMatch[1].trim() : rest;
    const trailingTracking = trackingMatch ? ` (${trackingMatch[2].trim()})` : '';
    const courierDisplay = getLocalizedCourierName(rawCourier, language);
    return (
      formatTranslation(
        getTranslation(language, 'admin.orders.modal_note_default_shipped', 'Colis remis à {courier}'),
        { courier: courierDisplay }
      ) + trailingTracking
    );
  }

  const statusChangedMatch =
    trimmed.match(/^Statut changé vers\s+(.+)$/i) ||
    trimmed.match(/^Status changed to\s+(.+)$/i) ||
    trimmed.match(/^تم تغيير الحالة إلى\s+(.+)$/u);
  if (statusChangedMatch) {
    const rawTarget = statusChangedMatch[1].trim();
    const matchedStatus = resolveStatusFromToken(rawTarget);
    const statusLabel = matchedStatus ? getStatusLabel(matchedStatus, language) : rawTarget;
    return formatTranslation(
      getTranslation(language, 'admin.orders.system_note.status_changed', 'Statut changé vers {status}'),
      { status: statusLabel }
    );
  }

  const reasonMatch =
    trimmed.match(/^Motif\s*:\s*(.+)$/i) ||
    trimmed.match(/^Reason\s*:\s*(.+)$/i) ||
    trimmed.match(/^السبب(?:\s+الرسمي)?\s*:\s*(.+)$/u);
  if (reasonMatch) {
    const rawReason = reasonMatch[1].trim();
    const reasonLabel = getCancellationReasonLabel(rawReason, language);
    return formatTranslation(
      getTranslation(language, 'admin.orders.system_note.reason_prefix', 'Motif : {reason}'),
      { reason: reasonLabel }
    );
  }

  return note;
}
