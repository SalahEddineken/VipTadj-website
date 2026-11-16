import { getWilayaFee } from '@/lib/data/wilayas';

export const DEFAULT_FREE_SHIPPING_THRESHOLD = 15000; // 15,000 DA

/**
 * Calculates delivery fee based on cart subtotal, destination wilaya, and delivery type.
 * Automatically waives fee (returns 0 DA) if subtotal meets or exceeds the free shipping threshold.
 */
export function calculateDeliveryFee(
  subtotal: number,
  wilayaCode: number | null | undefined,
  freeShippingThreshold: number = DEFAULT_FREE_SHIPPING_THRESHOLD,
  deliveryType: 'home' | 'desk' = 'home',
  customFees?: Record<number, { homeFee: number; deskFee: number; active: boolean }>
): number {
  if (subtotal >= freeShippingThreshold) {
    return 0; // Free shipping qualification
  }
  if (!wilayaCode || wilayaCode < 1 || wilayaCode > 58) {
    return 600; // Default fallback
  }
  if (customFees && customFees[wilayaCode]) {
    const cfg = customFees[wilayaCode];
    if (cfg.active === false) return 0;
    return deliveryType === 'desk' ? (cfg.deskFee ?? 350) : (cfg.homeFee ?? 600);
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
