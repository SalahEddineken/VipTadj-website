import { getWilayaFee } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';
import { CommuneShippingFeeOverride } from '@/types';

export { formatEstimatedDays } from '@/lib/data/wilayas';

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 15000; // 15,000 DA

/**
 * Looks up a custom shipping fee override for a specific baladiya (commune) in a wilaya.
 */
export function getCommuneOverride(
  wilayaCode: number,
  communeName: string | null | undefined,
  communeFees?: Record<string, CommuneShippingFeeOverride>
): CommuneShippingFeeOverride | undefined {
  if (!communeName || !communeFees) return undefined;
  const trimmed = communeName.trim();
  if (!trimmed) return undefined;
  const matched = findCommune(wilayaCode, trimmed);
  const canonicalKey = matched ? `${wilayaCode}:${matched.name}` : `${wilayaCode}:${trimmed}`;
  return communeFees[canonicalKey] ?? communeFees[`${wilayaCode}:${trimmed}`];
}

/**
 * Calculates delivery fee based on cart subtotal, destination wilaya/commune, and delivery type.
 * Automatically waives fee (returns 0 DA) if subtotal meets or exceeds the free shipping threshold.
 */
export function calculateDeliveryFee(
  subtotal: number,
  wilayaCode: number | null | undefined,
  freeShippingThreshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
  deliveryType: 'home' | 'desk' = 'home',
  customFees?: Record<number, { homeFee: number; deskFee: number; active: boolean }>,
  communeName?: string | null,
  communeFees?: Record<string, CommuneShippingFeeOverride>
): number {
  if (subtotal >= freeShippingThreshold) {
    return 0; // Free shipping qualification
  }
  if (!wilayaCode || wilayaCode < 1 || wilayaCode > 68) {
    return 800; // Default fallback (Zone 2 standard)
  }

  const communeOverride = getCommuneOverride(wilayaCode, communeName, communeFees);
  if (communeOverride && communeOverride.active !== false) {
    if (deliveryType === 'desk' && communeOverride.deskFee !== undefined) {
      return communeOverride.deskFee;
    }
    if (deliveryType === 'home' && communeOverride.homeFee !== undefined) {
      return communeOverride.homeFee;
    }
  }

  if (customFees && customFees[wilayaCode]) {
    const cfg = customFees[wilayaCode];
    if (cfg.active === false) return 0;
    return deliveryType === 'desk' ? (cfg.deskFee ?? 650) : (cfg.homeFee ?? 800);
  }
  return getWilayaFee(wilayaCode, deliveryType);
}

/**
 * Calculates total for an array of items.
 */
export function calculateSubtotal(items: { price: number; quantity: number }[]): number {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + Math.max(0, item.price) * Math.max(0, item.quantity), 0);
}

/**
 * Calculates final total payable upon Cash on Delivery.
 */
export function calculateTotal(subtotal: number, deliveryFee: number, discount: number = 0): number {
  return Math.max(0, subtotal + Math.max(0, deliveryFee) - Math.max(0, discount));
}
