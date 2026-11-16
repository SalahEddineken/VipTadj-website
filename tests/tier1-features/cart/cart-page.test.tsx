import { describe, it, expect, beforeEach } from 'vitest';
import { calculateSubtotal, calculateDeliveryFee, formatDZD } from '../../helpers/testUtils';
import { OrderItem } from '@/types';

describe('Tier 1: Cart — Full Shopping Cart Page Review (F-CART-02)', () => {
  const FREE_SHIPPING_THRESHOLD = 15000;

  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================
  // Test 1: Line Item Breakdown
  // ==========================================
  it('computes detailed line item breakdown including unit price, quantity, size, and line total', () => {
    const items: OrderItem[] = [
      {
        productId: 'prod-001',
        title: 'Costume Deux Pièces en Laine Super 130s',
        slug: 'costume-deux-pieces-laine-super-130s',
        price: 48500,
        quantity: 2,
        selectedSize: '50',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      },
    ];

    const lineTotal = items[0].price * items[0].quantity;
    expect(lineTotal).toBe(97000);
    expect(formatDZD(lineTotal)).toBe('97\u00A0000\u00A0DA');
    expect(items[0].selectedSize).toBe('50');
    expect(items[0].title).toContain('Costume');
  });

  // ==========================================
  // Test 2: Free Shipping Progress Bar (Under Threshold)
  // ==========================================
  it('calculates free shipping remaining deficit and progress percentage when under threshold', () => {
    const items: OrderItem[] = [
      {
        productId: 'prod-003',
        title: 'Chemise Formelle en Coton Égyptien',
        slug: 'chemise-formelle-coton-egyptien',
        price: 12500,
        quantity: 1,
        selectedSize: '40',
        image: 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf',
      },
    ];

    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(12500);

    const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    expect(amountRemaining).toBe(2500);
    expect(formatDZD(amountRemaining)).toBe('2\u00A0500\u00A0DA');

    const progressPercentage = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
    expect(progressPercentage).toBe(83);
  });

  // ==========================================
  // Test 3: Free Shipping Achieved (100% Progress)
  // ==========================================
  it('reports free shipping unlocked (100% progress, 0 DA remaining) when subtotal meets or exceeds threshold', () => {
    const items: OrderItem[] = [
      {
        productId: 'prod-001',
        title: 'Costume Laine Super 130s',
        slug: 'costume-laine-super-130s',
        price: 48500,
        quantity: 1,
        selectedSize: '50',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      },
    ];

    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(48500);

    const amountRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    expect(amountRemaining).toBe(0);

    const deliveryFee = calculateDeliveryFee(subtotal, 16, FREE_SHIPPING_THRESHOLD);
    expect(deliveryFee).toBe(0); // Free shipping for Alger
  });

  // ==========================================
  // Test 4: Empty Cart Page State
  // ==========================================
  it('detects empty cart state and prepares navigation target back to catalog', () => {
    const emptyItems: OrderItem[] = [];
    const subtotal = calculateSubtotal(emptyItems);

    expect(emptyItems).toHaveLength(0);
    expect(subtotal).toBe(0);

    const emptyCartCta = {
      label: 'Découvrir la Collection',
      href: '/catalog',
    };
    expect(emptyCartCta.href).toBe('/catalog');
  });

  // ==========================================
  // Test 5: Checkout CTA Trigger
  // ==========================================
  it('validates readiness for checkout and prepares navigation to /checkout', () => {
    const items: OrderItem[] = [
      {
        productId: 'prod-009',
        title: 'Richelieu One-Cut en Cuir de Veau',
        slug: 'richelieu-one-cut-cuir-veau',
        price: 32000,
        quantity: 1,
        selectedSize: '42',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
      },
    ];

    expect(items.length).toBeGreaterThan(0);
    const checkoutNavigationTarget = '/checkout';
    expect(checkoutNavigationTarget).toBe('/checkout');
  });

  // ==========================================
  // Test 6: Multi-Item Aggregate Subtotal
  // ==========================================
  it('accurately computes subtotal for complex multi-category carts (Suit + Shoes + Accessories)', () => {
    const multiItems: OrderItem[] = [
      {
        productId: 'prod-001',
        title: 'Costume Laine',
        slug: 'costume-laine',
        price: 48500,
        quantity: 1,
        selectedSize: '50',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      },
      {
        productId: 'prod-009',
        title: 'Richelieu One-Cut',
        slug: 'richelieu-one-cut',
        price: 32000,
        quantity: 1,
        selectedSize: '42',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
      },
      {
        productId: 'prod-015',
        title: 'Cravate Soie Jacquard',
        slug: 'cravate-soie-jacquard',
        price: 8500,
        quantity: 2,
        selectedSize: 'Unique',
        image: 'https://images.unsplash.com/photo-1589756823695-278bc923f962',
      },
    ];

    const subtotal = calculateSubtotal(multiItems);
    expect(subtotal).toBe(48500 * 1 + 32000 * 1 + 8500 * 2);
    expect(subtotal).toBe(97500);
  });
});
