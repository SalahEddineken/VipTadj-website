'use client';

import { useEffect } from 'react';

interface OrderConfirmationCartCleanerProps {
  isDirectOrder: boolean;
}

/**
 * Client component to handle post-order storage cleanup:
 * - If standard order: clears 'vip_cart' in localStorage and triggers 'vip-cart-updated'
 * - If express direct order ('?direct=1'): strictly preserves 'vip_cart' in localStorage
 *   and purges temporary 'vip_express_checkout' in sessionStorage.
 */
export function OrderConfirmationCartCleaner({
  isDirectOrder,
}: OrderConfirmationCartCleanerProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDirectOrder) {
      try {
        sessionStorage.removeItem('vip_express_checkout');
      } catch {
        // Ignore sessionStorage restrictions
      }
    } else {
      try {
        localStorage.removeItem('vip_cart');
        localStorage.removeItem('vip_tadj_cart');
        window.dispatchEvent(new CustomEvent('vip-cart-updated'));
      } catch (err) {
        console.warn('[CartCleaner] Failed to clean localStorage cart:', err);
      }
    }
  }, [isDirectOrder]);

  return null;
}
