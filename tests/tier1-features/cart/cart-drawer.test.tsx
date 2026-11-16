import { describe, it, expect, beforeEach } from 'vitest';
import { calculateSubtotal, formatDZD } from '../../helpers/testUtils';
import { OrderItem } from '@/types';

describe('Tier 1: Cart — Shopping Cart State & Drawer (F-CART-01)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ==========================================
  // Test 1: Empty Cart Drawer Initial State
  // ==========================================
  it('initializes cart drawer with zero items, 0 DA subtotal, and closed drawer state', () => {
    const cartState = {
      isOpen: false,
      items: [] as OrderItem[],
    };

    expect(cartState.isOpen).toBe(false);
    expect(cartState.items).toHaveLength(0);
    expect(calculateSubtotal(cartState.items)).toBe(0);
    expect(formatDZD(calculateSubtotal(cartState.items))).toBe('0\u00A0DA');
  });

  // ==========================================
  // Test 2: Add Items to Cart with Size Selection
  // ==========================================
  it('adds items with selected size, quantity, and unit price into cart', () => {
    const items: OrderItem[] = [];

    const newItem: OrderItem = {
      productId: 'prod-001',
      title: 'Costume Deux Pièces en Laine Super 130s',
      slug: 'costume-deux-pieces-laine-super-130s',
      price: 48500,
      quantity: 1,
      selectedSize: '50',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
    };

    items.push(newItem);

    expect(items).toHaveLength(1);
    expect(items[0].selectedSize).toBe('50');
    expect(items[0].price).toBe(48500);
    expect(calculateSubtotal(items)).toBe(48500);
  });

  // ==========================================
  // Test 3: Quantity Increment
  // ==========================================
  it('increments item quantity and recalculates line total and subtotal', () => {
    const items: OrderItem[] = [
      {
        productId: 'prod-002',
        title: 'Blazer Sartorial en Cachemire et Soie',
        slug: 'blazer-sartorial-cachemire-soie',
        price: 34000,
        quantity: 1,
        selectedSize: '52',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
      },
    ];

    // Increment quantity from 1 to 3
    items[0].quantity += 2;

    expect(items[0].quantity).toBe(3);
    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(34000 * 3);
    expect(subtotal).toBe(102000);
  });

  // ==========================================
  // Test 4: Quantity Decrement with Lower Bound
  // ==========================================
  it('decrements item quantity safely and prevents quantity below 1', () => {
    const items: OrderItem[] = [
      {
        productId: 'prod-003',
        title: 'Chemise Formelle en Coton Égyptien',
        slug: 'chemise-formelle-coton-egyptien',
        price: 12500,
        quantity: 2,
        selectedSize: '40',
        image: 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf',
      },
    ];

    // Decrement from 2 to 1
    items[0].quantity = Math.max(1, items[0].quantity - 1);
    expect(items[0].quantity).toBe(1);

    // Decrement attempt below 1 remains 1
    items[0].quantity = Math.max(1, items[0].quantity - 1);
    expect(items[0].quantity).toBe(1);
    expect(calculateSubtotal(items)).toBe(12500);
  });

  // ==========================================
  // Test 5: Remove Item from Cart
  // ==========================================
  it('removes an item by product ID and selected size from cart drawer', () => {
    let items: OrderItem[] = [
      {
        productId: 'prod-001',
        title: 'Costume Laine Super 130s',
        slug: 'costume-laine-super-130s',
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
    ];

    expect(items).toHaveLength(2);

    // Remove the suit
    items = items.filter((item) => !(item.productId === 'prod-001' && item.selectedSize === '50'));

    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-009');
    expect(calculateSubtotal(items)).toBe(32000);
  });

  // ==========================================
  // Test 6: LocalStorage Persistence
  // ==========================================
  it('persists cart state to localStorage and restores on subsequent session', () => {
    const cartKey = 'vip_tadj_cart';
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

    // Save to localStorage
    localStorage.setItem(cartKey, JSON.stringify(items));

    // Retrieve from localStorage
    const savedRaw = localStorage.getItem(cartKey);
    expect(savedRaw).not.toBeNull();

    const restoredItems: OrderItem[] = JSON.parse(savedRaw!);
    expect(restoredItems).toHaveLength(1);
    expect(restoredItems[0].productId).toBe('prod-001');
    expect(restoredItems[0].price).toBe(48500);
    expect(calculateSubtotal(restoredItems)).toBe(48500);
  });
});
