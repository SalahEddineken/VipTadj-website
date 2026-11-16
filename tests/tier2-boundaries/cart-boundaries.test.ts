import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageMock } from '../setup';
import { calculateSubtotal, calculateTotal, calculateDeliveryFee } from '../helpers/testUtils';
import { Product } from '../fixtures/types';
import { productsFixture } from '../fixtures/products.fixture';

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  image: string;
}

// In-memory cart manager simulating persistent cart operations
class CartManager {
  private items: CartItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public getItems(): CartItem[] {
    return [...this.items];
  }

  public getSubtotal(): number {
    return calculateSubtotal(this.items);
  }

  public getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  public addItem(product: Product, size: string, quantity: number = 1): void {
    if (quantity <= 0) return; // Prevent 0 or negative quantities
    const safeQty = Math.min(99, Math.max(1, Math.floor(quantity))); // Clamp 1..99

    const cartItemId = `${product.id}-${size}`;
    const existingIndex = this.items.findIndex((item) => item.id === cartItemId);

    if (existingIndex > -1) {
      const updatedQty = Math.min(99, this.items[existingIndex].quantity + safeQty);
      this.items[existingIndex].quantity = updatedQty;
    } else {
      this.items.push({
        id: cartItemId,
        productId: product.id,
        title: product.title,
        price: product.price,
        quantity: safeQty,
        selectedSize: size,
        image: product.images[0]?.url || '',
      });
    }

    this.saveToStorage();
  }

  public updateQuantity(cartItemId: string, newQty: number): void {
    const index = this.items.findIndex((item) => item.id === cartItemId);
    if (index === -1) return;

    if (newQty <= 0) {
      // Non-positive quantity removes item from cart
      this.items.splice(index, 1);
    } else {
      this.items[index].quantity = Math.min(99, Math.floor(newQty));
    }

    this.saveToStorage();
  }

  public removeItem(cartItemId: string): void {
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => item.id !== cartItemId);
    if (this.items.length !== initialLen) {
      this.saveToStorage();
    }
  }

  public clear(): void {
    this.items = [];
    this.saveToStorage();
  }

  public canCheckout(): boolean {
    return this.items.length > 0 && this.getSubtotal() > 0;
  }

  private saveToStorage(): void {
    localStorageMock.setItem('vip_cart', JSON.stringify(this.items));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorageMock.getItem('vip_cart');
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        this.items = [];
      }
    } catch {
      this.items = [];
    }
  }
}

describe('Tier 2: Boundary & Corner Cases — Cart Boundaries (cart-boundaries.test.ts)', () => {
  let cart: CartManager;

  beforeEach(() => {
    localStorageMock.clear();
    cart = new CartManager();
  });

  // ==========================================
  // 1. Empty Cart Subtotal & Checkout Blocking
  // ==========================================
  it('prevents checkout and maintains 0 DA subtotal when cart is empty', () => {
    expect(cart.getItems()).toHaveLength(0);
    expect(cart.getItemCount()).toBe(0);
    expect(cart.getSubtotal()).toBe(0);
    expect(cart.canCheckout()).toBe(false);

    // Empty cart delivery fee check
    const fee = calculateDeliveryFee(cart.getSubtotal(), 16);
    expect(fee).toBe(400); // Wilaya fee applies if checkout were initiated
    expect(calculateTotal(cart.getSubtotal(), fee)).toBe(400);
  });

  // ==========================================
  // 2. Negative and Zero Quantity Rejection / Clamping
  // ==========================================
  it('blocks negative and zero quantities on addition and removes items on zero update', () => {
    const product = productsFixture[0]; // 48,500 DA

    // Attempt to add with 0 quantity -> ignored
    cart.addItem(product, '50', 0);
    expect(cart.getItems()).toHaveLength(0);

    // Attempt to add with negative quantity -> ignored
    cart.addItem(product, '50', -5);
    expect(cart.getItems()).toHaveLength(0);

    // Add 1 valid unit
    cart.addItem(product, '50', 1);
    expect(cart.getItems()).toHaveLength(1);
    expect(cart.getItems()[0].quantity).toBe(1);

    // Update quantity to 0 -> removes item
    cart.updateQuantity(`${product.id}-50`, 0);
    expect(cart.getItems()).toHaveLength(0);

    // Re-add and update to negative -> removes item
    cart.addItem(product, '50', 2);
    cart.updateQuantity(`${product.id}-50`, -3);
    expect(cart.getItems()).toHaveLength(0);
  });

  // ==========================================
  // 3. Upper Quantity Boundary (99 Items)
  // ==========================================
  it('enforces maximum boundary quantity of 99 items per line item', () => {
    const product = productsFixture[2]; // Chemise Popeline Blanche (8,500 DA)

    // Add 150 items -> clamped to 99
    cart.addItem(product, '40', 150);
    expect(cart.getItems()[0].quantity).toBe(99);
    expect(cart.getSubtotal()).toBe(product.price * 99);

    // Incremental addition exceeding 99 remains capped at 99
    cart.addItem(product, '40', 10);
    expect(cart.getItems()[0].quantity).toBe(99);

    // Update quantity directly above 99 clamps to 99
    cart.updateQuantity(`${product.id}-40`, 500);
    expect(cart.getItems()[0].quantity).toBe(99);
  });

  // ==========================================
  // 4. Removing Non-Existent Items
  // ==========================================
  it('safely handles removal requests for non-existent item IDs without mutating state', () => {
    const product = productsFixture[0];
    cart.addItem(product, '50', 1);
    expect(cart.getItems()).toHaveLength(1);

    // Attempt removing phantom item ID
    cart.removeItem('phantom-product-id-999');
    expect(cart.getItems()).toHaveLength(1);

    cart.updateQuantity('phantom-product-id-999', 5);
    expect(cart.getItems()).toHaveLength(1);
  });

  // ==========================================
  // 5. Variant Separation: Same Product, Different Sizes
  // ==========================================
  it('creates distinct cart line items when same product is added with different sizes', () => {
    const suit = productsFixture[0]; // Costume

    cart.addItem(suit, '48', 1);
    cart.addItem(suit, '50', 2);
    cart.addItem(suit, '52', 1);

    expect(cart.getItems()).toHaveLength(3);
    expect(cart.getItemCount()).toBe(4); // 1 + 2 + 1 = 4 units

    const item48 = cart.getItems().find((i) => i.selectedSize === '48');
    const item50 = cart.getItems().find((i) => i.selectedSize === '50');
    const item52 = cart.getItems().find((i) => i.selectedSize === '52');

    expect(item48?.quantity).toBe(1);
    expect(item50?.quantity).toBe(2);
    expect(item52?.quantity).toBe(1);

    // Subtotal = 4 * 48,500 = 194,000 DA
    expect(cart.getSubtotal()).toBe(194000);
  });

  // ==========================================
  // 6. LocalStorage Persistence and Corruption Recovery
  // ==========================================
  it('persists cart state across reloads and recovers gracefully from corrupted JSON in storage', () => {
    const shoe = productsFixture[8]; // Richelieu Cuir Oxford (28,000 DA)
    cart.addItem(shoe, '42', 1);

    // Check localStorage was written
    const storedRaw = localStorageMock.getItem('vip_cart');
    expect(storedRaw).toBeTruthy();
    expect(JSON.parse(storedRaw!)).toHaveLength(1);

    // Reload new manager from storage
    const reloadedCart = new CartManager();
    expect(reloadedCart.getItems()).toHaveLength(1);
    expect(reloadedCart.getItems()[0].title).toBe(shoe.title);

    // Corrupt localStorage intentionally
    localStorageMock.setItem('vip_cart', 'CORRUPTED_NOT_JSON_{{[}}');

    // New manager instance should catch error and initialize with empty array
    const corruptedCart = new CartManager();
    expect(corruptedCart.getItems()).toEqual([]);
    expect(corruptedCart.getSubtotal()).toBe(0);
  });
});
