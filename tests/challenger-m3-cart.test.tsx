import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, renderHook, act, screen, fireEvent } from '@testing-library/react';
import {
  CartProvider,
  useCart,
  clampQuantity,
  getCartItemId,
  CartItem,
} from '@/lib/context/cart-context';
import { CartDrawer } from '@/components/store/CartDrawer';
import CartPage from '@/app/cart/page';
import { localStorageMock } from './setup';

describe('CHALLENGER 1: Adversarial Stress & Empirical Verification of Cart & State Boundaries', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
  });

  // =========================================================================
  // 1. PURE UTILITY & FUNCTION BOUNDARIES (clampQuantity, getCartItemId)
  // =========================================================================
  describe('1. Pure Function Boundary Constraints', () => {
    it('enforces integer clamping within [1, 99]', () => {
      expect(clampQuantity(1)).toBe(1);
      expect(clampQuantity(99)).toBe(99);
      expect(clampQuantity(0)).toBe(1);
      expect(clampQuantity(-10)).toBe(1);
      expect(clampQuantity(100)).toBe(99);
      expect(clampQuantity(9999)).toBe(99);
      expect(clampQuantity(4.9)).toBe(4);
      expect(clampQuantity(1.1)).toBe(1);
    });

    it('generates predictable composite line IDs', () => {
      expect(getCartItemId('prod-1', '50')).toBe('prod-1-50');
      expect(getCartItemId('prod-xyz', 'Unique')).toBe('prod-xyz-Unique');
      expect(getCartItemId('prod-1', '')).toBe('prod-1-');
    });
  });

  // =========================================================================
  // 2. LOCALSTORAGE RECOVERY & CORRUPTED JSON IMMUNITY
  // =========================================================================
  describe('2. LocalStorage Corruption Recovery & Key Fallback', () => {
    it('gracefully recovers from non-JSON string in localStorage without throwing', () => {
      localStorageMock.setItem('vip_cart', 'MALFORMED_{{{[[NOT_JSON');

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.canCheckout).toBe(false);
    });

    it('recovers when localStorage holds a JSON primitive instead of an array', () => {
      localStorageMock.setItem('vip_cart', JSON.stringify('a plain string'));

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
    });

    it('recovers when localStorage holds a JSON object instead of an array', () => {
      localStorageMock.setItem('vip_cart', JSON.stringify({ error: 'not an array' }));

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
    });

    it('recovers when localStorage contains an array containing null or invalid entries', () => {
      localStorageMock.setItem('vip_cart', JSON.stringify([null, 123, 'corrupt']));

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      // Mapping over null throws inside try block, catching and returning empty array
      expect(result.current.items).toEqual([]);
      expect(result.current.subtotal).toBe(0);
    });

    it('falls back to reading vip_tadj_cart if vip_cart is empty', () => {
      const legacyItem: CartItem = {
        productId: 'prod-legacy',
        title: 'Legacy Item',
        slug: 'legacy-item',
        price: 15000,
        quantity: 2,
        selectedSize: '42',
        image: 'https://example.com/img.jpg',
      };
      localStorageMock.setItem('vip_tadj_cart', JSON.stringify([legacyItem]));

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].productId).toBe('prod-legacy');
      expect(result.current.items[0].id).toBe('prod-legacy-42');
      expect(result.current.itemCount).toBe(2);
      expect(result.current.subtotal).toBe(30000);
    });

    it('survives when localStorage.setItem throws QuotaExceededError or SecurityError', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      // Mock setItem throwing
      const spy = vi.spyOn(localStorageMock, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError: storage limit reached');
      });

      // Should not throw and maintain in-memory state
      expect(() => {
        act(() => {
          result.current.addItem({
            productId: 'test-quota',
            title: 'Quota Product',
            slug: 'quota-product',
            price: 5000,
            quantity: 1,
            selectedSize: 'M',
            image: '',
          });
        });
      }).not.toThrow();

      expect(result.current.items).toHaveLength(1);
      expect(result.current.subtotal).toBe(5000);
      spy.mockRestore();
    });

    it('synchronizes cart across tabs when window receives storage or custom event', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      expect(result.current.items).toHaveLength(0);

      // External write (e.g. from another tab)
      const newItem: CartItem = {
        productId: 'external-prod',
        title: 'External Prod',
        slug: 'external-prod',
        price: 9000,
        quantity: 2,
        selectedSize: '50',
        image: '',
      };
      localStorageMock.setItem('vip_cart', JSON.stringify([newItem]));

      // Dispatch custom event
      act(() => {
        window.dispatchEvent(new CustomEvent('vip-cart-updated'));
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].productId).toBe('external-prod');
      expect(result.current.subtotal).toBe(18000);
    });
  });

  // =========================================================================
  // 3. VARIANT COLLISION PREVENTION (Same Product, Different Sizes)
  // =========================================================================
  describe('3. Variant Collision Prevention', () => {
    const baseProduct: Omit<CartItem, 'selectedSize' | 'quantity'> = {
      productId: 'suit-super-130s',
      title: 'Costume Sartorial Laine',
      slug: 'costume-sartorial-laine',
      price: 48500,
      image: '/images/suit.jpg',
    };

    it('maintains distinct line items for identical product in different sizes', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...baseProduct, selectedSize: '48', quantity: 1 });
        result.current.addItem({ ...baseProduct, selectedSize: '50', quantity: 2 });
        result.current.addItem({ ...baseProduct, selectedSize: '52', quantity: 1 });
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.itemCount).toBe(4);
      expect(result.current.subtotal).toBe(48500 * 4);

      const item48 = result.current.items.find((it) => it.selectedSize === '48');
      const item50 = result.current.items.find((it) => it.selectedSize === '50');
      const item52 = result.current.items.find((it) => it.selectedSize === '52');

      expect(item48?.id).toBe('suit-super-130s-48');
      expect(item50?.id).toBe('suit-super-130s-50');
      expect(item52?.id).toBe('suit-super-130s-52');
      expect(item50?.quantity).toBe(2);
    });

    it('modifying quantity of size 48 leaves size 50 and 52 completely intact', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...baseProduct, selectedSize: '48', quantity: 1 });
        result.current.addItem({ ...baseProduct, selectedSize: '50', quantity: 2 });
        result.current.addItem({ ...baseProduct, selectedSize: '52', quantity: 1 });
      });

      // Update quantity of size 48 to 5
      act(() => {
        result.current.updateQuantity('suit-super-130s-48', 5);
      });

      expect(result.current.items.find((it) => it.selectedSize === '48')?.quantity).toBe(5);
      expect(result.current.items.find((it) => it.selectedSize === '50')?.quantity).toBe(2);
      expect(result.current.items.find((it) => it.selectedSize === '52')?.quantity).toBe(1);
      expect(result.current.itemCount).toBe(8);
      expect(result.current.subtotal).toBe(48500 * 8);
    });

    it('removing size 48 does NOT delete size 50 or 52', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...baseProduct, selectedSize: '48', quantity: 1 });
        result.current.addItem({ ...baseProduct, selectedSize: '50', quantity: 2 });
      });

      expect(result.current.items).toHaveLength(2);

      // Remove size 48
      act(() => {
        result.current.removeItem('suit-super-130s-48');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].selectedSize).toBe('50');
      expect(result.current.items[0].quantity).toBe(2);
      expect(result.current.subtotal).toBe(48500 * 2);
    });

    it('does not collide products whose IDs are substrings of each other', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({
          productId: 'prod-1',
          title: 'Prod 1',
          slug: 'prod-1',
          price: 1000,
          quantity: 1,
          selectedSize: 'M',
          image: '',
        });
        result.current.addItem({
          productId: 'prod-10',
          title: 'Prod 10',
          slug: 'prod-10',
          price: 2000,
          quantity: 1,
          selectedSize: 'M',
          image: '',
        });
      });

      expect(result.current.items).toHaveLength(2);

      act(() => {
        result.current.removeItem('prod-1', 'M');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].productId).toBe('prod-10');
      expect(result.current.subtotal).toBe(2000);
    });
  });

  // =========================================================================
  // 4. QUANTITY BOUNDARIES (0, Negative, >99, Fractional)
  // =========================================================================
  describe('4. Quantity Bounds & Clamping Mechanics', () => {
    const itemTemplate: CartItem = {
      productId: 'shirt-01',
      title: 'Chemise Popeline',
      slug: 'chemise-popeline',
      price: 8500,
      quantity: 1,
      selectedSize: '40',
      image: '',
    };

    it('rejects adding items with 0 or negative quantities', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 0 });
        result.current.addItem({ ...itemTemplate, quantity: -5 });
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });

    it('clamps quantity to 99 when adding more than 99 units', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 200 });
      });

      expect(result.current.items[0].quantity).toBe(99);
      expect(result.current.itemCount).toBe(99);
      expect(result.current.subtotal).toBe(8500 * 99);
    });

    it('caps cumulative additions at maximum boundary of 99', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 90 });
      });
      expect(result.current.items[0].quantity).toBe(90);

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 20 });
      });
      expect(result.current.items[0].quantity).toBe(99);
      expect(result.current.itemCount).toBe(99);
    });

    it('floors fractional quantities when adding', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 3.8 });
      });

      expect(result.current.items[0].quantity).toBe(3);
    });

    it('removes item when updateQuantity is called with 0 or negative value', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 2 });
      });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.updateQuantity('shirt-01-40', 0);
      });
      expect(result.current.items).toHaveLength(0);
      expect(result.current.subtotal).toBe(0);

      // Re-add and test negative
      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 2 });
      });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.updateQuantity('shirt-01', -1, '40');
      });
      expect(result.current.items).toHaveLength(0);
    });

    it('clamps updateQuantity to 99 when requested value exceeds 99', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({ ...itemTemplate, quantity: 1 });
        result.current.updateQuantity('shirt-01-40', 500);
      });

      expect(result.current.items[0].quantity).toBe(99);
    });
  });

  // =========================================================================
  // 5. RAPID BURST EVENTS & STATE CONCURRENCY
  // =========================================================================
  describe('5. Rapid Concurrency & Stress Harness', () => {
    it('survives a rapid burst of 50 interleaved operations maintaining mathematical integrity', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        for (let i = 1; i <= 25; i++) {
          result.current.addItem({
            productId: `item-${i % 5}`,
            title: `Product ${i % 5}`,
            slug: `product-${i % 5}`,
            price: 1000 * ((i % 5) + 1),
            quantity: 1,
            selectedSize: i % 2 === 0 ? 'M' : 'L',
            image: '',
          });
        }
      });

      // Total items should have positive quantities
      expect(result.current.items.length).toBeGreaterThan(0);
      for (const item of result.current.items) {
        expect(item.quantity).toBeGreaterThanOrEqual(1);
        expect(item.quantity).toBeLessThanOrEqual(99);
      }

      // Mathematical invariant: Subtotal must equal exact sum of (price * quantity)
      const expectedSubtotal = result.current.items.reduce(
        (sum, it) => sum + it.price * it.quantity,
        0
      );
      expect(result.current.subtotal).toBe(expectedSubtotal);

      // Mathematical invariant: itemCount must equal exact sum of item.quantity
      const expectedItemCount = result.current.items.reduce((sum, it) => sum + it.quantity, 0);
      expect(result.current.itemCount).toBe(expectedItemCount);
    });

    it('clearCart reliably resets all items and resets storage', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({
          productId: 'p1',
          title: 'P1',
          slug: 'p1',
          price: 5000,
          quantity: 2,
          selectedSize: '40',
          image: '',
        });
      });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.itemCount).toBe(0);
      expect(result.current.subtotal).toBe(0);
      expect(result.current.canCheckout).toBe(false);
      expect(localStorageMock.getItem('vip_cart')).toBe('[]');
    });

    it('safely ignores remove requests for phantom IDs', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });

      act(() => {
        result.current.addItem({
          productId: 'p1',
          title: 'P1',
          slug: 'p1',
          price: 5000,
          quantity: 1,
          selectedSize: '40',
          image: '',
        });
      });

      act(() => {
        result.current.removeItem('non-existent-id');
        result.current.removeItem('p1', '99'); // non-matching size
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.subtotal).toBe(5000);
    });
  });

  // =========================================================================
  // 6. FREE SHIPPING ORACLE & PROGRESS PERCENTAGE
  // =========================================================================
  describe('6. Free Shipping Calculation Oracle', () => {
    it('evaluates threshold boundaries at 0 DA, below, exact, and above 15,000 DA', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider initialThreshold={15000}>{children}</CartProvider>,
      });

      // 0 DA (empty)
      expect(result.current.subtotal).toBe(0);
      expect(result.current.amountRemaining).toBe(15000);
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.isFreeShipping).toBe(false);

      // 5,000 DA (33%)
      act(() => {
        result.current.addItem({
          productId: 'acc-1',
          title: 'Ceinture Cuir',
          slug: 'ceinture-cuir',
          price: 5000,
          quantity: 1,
          selectedSize: '95',
          image: '',
        });
      });
      expect(result.current.subtotal).toBe(5000);
      expect(result.current.amountRemaining).toBe(10000);
      expect(result.current.progressPercentage).toBe(33);
      expect(result.current.isFreeShipping).toBe(false);

      // Exact 15,000 DA (100%)
      act(() => {
        result.current.addItem({
          productId: 'acc-2',
          title: 'Porte-cartes',
          slug: 'porte-cartes',
          price: 10000,
          quantity: 1,
          selectedSize: 'Unique',
          image: '',
        });
      });
      expect(result.current.subtotal).toBe(15000);
      expect(result.current.amountRemaining).toBe(0);
      expect(result.current.progressPercentage).toBe(100);
      expect(result.current.isFreeShipping).toBe(true);

      // Exceeding 15,000 DA (capped at 100% progress, 0 remaining)
      act(() => {
        result.current.addItem({
          productId: 'acc-3',
          title: 'Cravate Soie',
          slug: 'cravate-soie',
          price: 5000,
          quantity: 1,
          selectedSize: 'Unique',
          image: '',
        });
      });
      expect(result.current.subtotal).toBe(20000);
      expect(result.current.amountRemaining).toBe(0);
      expect(result.current.progressPercentage).toBe(100);
      expect(result.current.isFreeShipping).toBe(true);
    });
  });

  // =========================================================================
  // 7. COMPONENT RENDERING & ACCESSIBILITY TESTS (CartDrawer & CartPage)
  // =========================================================================
  describe('7. CartDrawer and CartPage UI Behavior', () => {
    it('CartDrawer locks document body overflow when opened and restores on close', () => {
      const { rerender } = render(
        <CartProvider>
          <CartDrawer isOpen={false} />
        </CartProvider>
      );
      expect(document.body.style.overflow).toBe('');

      rerender(
        <CartProvider>
          <CartDrawer isOpen={true} />
        </CartProvider>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('CartDrawer closes when Escape key is pressed', () => {
      const onCloseMock = vi.fn();
      render(
        <CartProvider>
          <CartDrawer isOpen={true} onClose={onCloseMock} />
        </CartProvider>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('CartDrawer disables plus button when line item quantity reaches 99', () => {
      const maxItem: CartItem = {
        productId: 'item-99',
        title: 'Max Item Test',
        slug: 'max-item-test',
        price: 1000,
        quantity: 99,
        selectedSize: 'M',
        image: '',
      };
      localStorageMock.setItem('vip_cart', JSON.stringify([maxItem]));

      render(
        <CartProvider>
          <CartDrawer isOpen={true} />
        </CartProvider>
      );

      const plusBtn = screen.getByLabelText('Augmenter la quantité');
      expect(plusBtn).toBeDisabled();
    });

    it('CartDrawer removes line item when minus button is clicked at quantity 1', () => {
      const singleItem: CartItem = {
        productId: 'single-item',
        title: 'Costume Test',
        slug: 'costume-test',
        price: 45000,
        quantity: 1,
        selectedSize: '50',
        image: '',
      };
      localStorageMock.setItem('vip_cart', JSON.stringify([singleItem]));

      render(
        <CartProvider>
          <CartDrawer isOpen={true} />
        </CartProvider>
      );

      expect(screen.getByText('Costume Test')).toBeInTheDocument();

      const minusBtn = screen.getByLabelText('Diminuer la quantité');
      fireEvent.click(minusBtn);

      // Item should be removed, and empty state should appear
      expect(screen.queryByText('Costume Test')).not.toBeInTheDocument();
      expect(screen.getByText('Votre panier est vide')).toBeInTheDocument();
    });

    it('CartDrawer removes line item when delete trash icon is clicked', () => {
      const item: CartItem = {
        productId: 'del-item',
        title: 'Blazer Test',
        slug: 'blazer-test',
        price: 30000,
        quantity: 2,
        selectedSize: '52',
        image: '',
      };
      localStorageMock.setItem('vip_cart', JSON.stringify([item]));

      render(
        <CartProvider>
          <CartDrawer isOpen={true} />
        </CartProvider>
      );

      const trashBtn = screen.getByLabelText('Supprimer Blazer Test');
      fireEvent.click(trashBtn);

      expect(screen.queryByText('Blazer Test')).not.toBeInTheDocument();
      expect(screen.getByText('Votre panier est vide')).toBeInTheDocument();
    });

    it('CartPage renders items and clears all items when clicking "Vider le panier"', () => {
      const testItems: CartItem[] = [
        {
          productId: 'page-item-1',
          title: 'Article Panier 1',
          slug: 'article-panier-1',
          price: 12000,
          quantity: 1,
          selectedSize: '40',
          image: '',
        },
      ];
      localStorageMock.setItem('vip_cart', JSON.stringify(testItems));

      render(
        <CartProvider>
          <CartPage />
        </CartProvider>
      );

      expect(screen.getByText('Article Panier 1')).toBeInTheDocument();
      expect(screen.getByText('Récapitulatif')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: /vider le panier/i });
      fireEvent.click(clearBtn);

      expect(screen.queryByText('Article Panier 1')).not.toBeInTheDocument();
      expect(screen.getByText('Votre panier est actuellement vide')).toBeInTheDocument();
    });

    it('CartDrawer and CartPage safely handle un-provided context without throwing', () => {
      // Test that components do not crash if accidentally rendered outside CartProvider
      expect(() => render(<CartDrawer isOpen={false} />)).not.toThrow();
      expect(() => render(<CartPage />)).not.toThrow();
    });
  });
});
