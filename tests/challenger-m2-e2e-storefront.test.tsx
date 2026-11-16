import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { mockDataProvider } from './helpers/mockDataProvider';
import { localStorageMock } from './setup';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { AddToCartSection } from '@/components/store/pdp/AddToCartSection';
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { Header } from '@/components/store/Header';
import { Product } from '@/types';
import * as navigation from 'next/navigation';

describe('CHALLENGER M2-2: Adversarial Storefront E2E Journeys & State Transition Verification', () => {
  let routerPushMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDataProvider.reset();
    localStorageMock.clear();
    sessionStorage.clear();
    vi.clearAllMocks();

    routerPushMock = vi.fn();
    vi.spyOn(navigation, 'useRouter').mockReturnValue({
      push: routerPushMock,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  // =========================================================================
  // JOURNEY 1 CHALLENGES: Customer Discovery to Cart State Transitions
  // =========================================================================
  describe('Journey 1: Discovery-to-Cart State Transitions & Edge Cases', () => {
    it('verifies catalog filter -> suit PDP -> size 50 -> Add to Cart state persistence', async () => {
      // 1. Fetch suit product as customer would find it via catalog
      const suits = await mockDataProvider.getProducts({
        categoryId: 'clothing',
        subcategory: 'costumes',
      });
      const suit = suits.find((p) => p.slug === 'costume-deux-pieces-laine-super-130s');
      expect(suit).toBeDefined();

      // 2. Render master PDP component
      const { unmount } = render(<ProductDetailPage product={suit!} />);

      // 3. Confirm sizes include 50
      const size50Btn = screen.getByRole('button', { name: /^Taille 50/i });
      expect(size50Btn).toBeInTheDocument();
      expect(size50Btn).not.toBeDisabled();

      // 4. Select size 50
      fireEvent.click(size50Btn);
      expect(size50Btn).toHaveAttribute('aria-pressed', 'true');

      // 5. Click "Ajouter au Panier"
      const addToCartBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
      fireEvent.click(addToCartBtn);

      // 6. Verify localStorage state transition
      const rawCart = localStorageMock.getItem('vip_cart');
      expect(rawCart).not.toBeNull();
      const cart = JSON.parse(rawCart!);
      expect(cart).toHaveLength(1);
      expect(cart[0]).toMatchObject({
        productId: suit!.id,
        title: suit!.title,
        price: suit!.price,
        selectedSize: '50',
        quantity: 1,
      });

      unmount();
    });

    it('handles repeated additions of same size by incrementing quantity without duplicating items', async () => {
      const suit = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
      expect(suit).toBeDefined();

      const { unmount } = render(<ProductDetailPage product={suit!} />);

      const size50Btn = screen.getByRole('button', { name: /^Taille 50/i });
      fireEvent.click(size50Btn);

      const addToCartBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });

      // Click once (qty 1)
      fireEvent.click(addToCartBtn);
      // Click second time (qty 1 + 1 = 2)
      fireEvent.click(addToCartBtn);

      const cart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(cart).toHaveLength(1);
      expect(cart[0].selectedSize).toBe('50');
      expect(cart[0].quantity).toBe(2);

      unmount();
    });

    it('creates separate line items when customer selects distinct sizes of the same product', async () => {
      const suit = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
      const { unmount } = render(<ProductDetailPage product={suit!} />);

      // Add size 50
      const size50Btn = screen.getByRole('button', { name: /^Taille 50/i });
      fireEvent.click(size50Btn);
      const addToCartBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
      fireEvent.click(addToCartBtn);

      // Now switch to size 52
      const size52Btn = screen.getByRole('button', { name: /^Taille 52/i });
      fireEvent.click(size52Btn);
      fireEvent.click(addToCartBtn);

      const cart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(cart).toHaveLength(2);
      expect(cart[0].selectedSize).toBe('50');
      expect(cart[0].quantity).toBe(1);
      expect(cart[1].selectedSize).toBe('52');
      expect(cart[1].quantity).toBe(1);

      unmount();
    });

    it('prevents adding to cart without selecting a size when product has multiple sizes', async () => {
      const suit = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
      const { unmount } = render(<ProductDetailPage product={suit!} />);

      // Click "Ajouter au Panier" directly without choosing size
      const addToCartBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
      fireEvent.click(addToCartBtn);

      // Verify validation error is displayed
      expect(
        screen.getByText(/Veuillez sélectionner votre taille avant d'ajouter au panier/i)
      ).toBeInTheDocument();

      // Verify cart remains untouched
      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      unmount();
    });

    it('syncs Header live cart count when "vip-cart-updated" event is dispatched', async () => {
      const { unmount } = render(<Header cartCount={0} />);

      // Initially no count badge
      expect(screen.queryByText('3')).toBeNull();

      // Put 3 items in localStorage
      localStorageMock.setItem(
        'vip_cart',
        JSON.stringify([
          { productId: 'p1', quantity: 2, selectedSize: '50' },
          { productId: 'p2', quantity: 1, selectedSize: '42' },
        ])
      );

      // Dispatch event
      act(() => {
        window.dispatchEvent(new CustomEvent('vip-cart-updated'));
      });

      // Header should now display total count 3
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });

      unmount();
    });

    it('survives corrupted JSON in localStorage without throwing error in Header or AddToCart', () => {
      localStorageMock.setItem('vip_cart', '{{BAD_JSON_MALFORMED');

      // Header render should not throw
      expect(() => {
        render(<Header cartCount={0} />);
      }).not.toThrow();

      // AddToCart render & action should not throw
      const dummyProduct: Product = {
        id: 'prod-test',
        title: 'Costume Test',
        slug: 'costume-test',
        description: 'Test',
        price: 30000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'costumes',
        images: [{ id: '1', url: 'https://example.com/img.jpg', alt: 'Test', isPrimary: true }],
        sizes: ['50'],
        stockQuantity: 5,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      expect(() => {
        const { getByRole } = render(
          <AddToCartSection
            product={dummyProduct}
            selectedSize="50"
            onValidateSize={() => true}
          />
        );
        fireEvent.click(getByRole('button', { name: /Ajouter au Panier/i }));
      }).not.toThrow();
    });
  });

  // =========================================================================
  // JOURNEY 2 CHALLENGES: 1-Click Express Direct Checkout Isolation
  // =========================================================================
  describe('Journey 2: Express Direct Checkout Isolation & 1-Click COD Bypass', () => {
    it('strictly preserves localStorage "vip_cart" as null during direct checkout', async () => {
      const shoe = await mockDataProvider.getProductBySlug('richelieu-one-cut-cuir-veau');
      expect(shoe).toBeDefined();

      // Ensure clean initial state
      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      const { unmount } = render(<ProductDetailPage product={shoe!} />);

      // Select Size 42
      const size42Btn = screen.getByRole('button', { name: /^Taille 42/i });
      fireEvent.click(size42Btn);

      // Click "Commander directement"
      const expressBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(expressBtn);

      // 1. vip_cart MUST remain strictly null in localStorage
      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      // 2. Router should push directly to /checkout?direct=1
      expect(routerPushMock).toHaveBeenCalledWith(
        expect.stringContaining('/checkout?direct=1')
      );
      expect(routerPushMock).toHaveBeenCalledWith(
        expect.stringContaining(`productId=${encodeURIComponent(shoe!.id)}`)
      );
      expect(routerPushMock).toHaveBeenCalledWith(
        expect.stringContaining('size=42')
      );

      // 3. sessionStorage holds express payload
      const expressPayload = sessionStorage.getItem('vip_express_checkout');
      expect(expressPayload).not.toBeNull();
      const parsed = JSON.parse(expressPayload!);
      expect(parsed.productId).toBe(shoe!.id);
      expect(parsed.selectedSize).toBe('42');
      expect(parsed.quantity).toBe(1);

      unmount();
    });

    it('does NOT overwrite or purge existing items in vip_cart when doing express checkout for another item', async () => {
      // Pre-existing cart with a suit
      const existingCart = [
        {
          productId: 'prod-suit',
          title: 'Costume Pré-existant',
          slug: 'costume-preexistant',
          price: 45000,
          quantity: 1,
          selectedSize: '50',
          image: 'https://example.com/suit.jpg',
        },
      ];
      localStorageMock.setItem('vip_cart', JSON.stringify(existingCart));

      const shoe = await mockDataProvider.getProductBySlug('richelieu-one-cut-cuir-veau');
      const { unmount } = render(<ProductDetailPage product={shoe!} />);

      // Select Size 42 and click "Commander directement"
      fireEvent.click(screen.getByRole('button', { name: /^Taille 42/i }));
      fireEvent.click(screen.getByRole('button', { name: /Commander directement/i }));

      // Existing cart MUST remain completely untouched!
      const finalCart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(finalCart).toEqual(existingCart);
      expect(finalCart).toHaveLength(1);
      expect(finalCart[0].productId).toBe('prod-suit');

      unmount();
    });

    it('blocks Express Direct Checkout if size is not selected and triggers size validation alert', async () => {
      const shoe = await mockDataProvider.getProductBySlug('richelieu-one-cut-cuir-veau');
      const { unmount } = render(<ProductDetailPage product={shoe!} />);

      // Click "Commander directement" without selecting size
      const expressBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(expressBtn);

      // Router push must NOT be called
      expect(routerPushMock).not.toHaveBeenCalled();

      // Error message must show
      expect(
        screen.getByText(/Veuillez sélectionner votre taille avant d'ajouter au panier/i)
      ).toBeInTheDocument();

      unmount();
    });
  });

  // =========================================================================
  // ADMIN PDP SYNC CHALLENGES: Price Changes, Stock Depletion & Matrix Editing
  // =========================================================================
  describe('Admin PDP Sync: Dynamic Updates & Sold-Out Handling', () => {
    it('reflects price adjustments from admin update immediately in product display', async () => {
      const original = await mockDataProvider.getProductById('prod-001');
      expect(original!.price).toBe(48500);

      // Admin modifies price
      await mockDataProvider.updateProduct('prod-001', {
        price: 59000,
        compareAtPrice: 65000,
      });

      const updated = await mockDataProvider.getProductById('prod-001');
      expect(updated!.price).toBe(59000);

      const { unmount } = render(<ProductDetailPage product={updated!} />);

      // PDP info displays 59 000 DA
      expect(screen.getByText(/59\s*000\s*DA/)).toBeInTheDocument();
      // Compare price displays 65 000 DA
      expect(screen.getByText(/65\s*000\s*DA/)).toBeInTheDocument();

      unmount();
    });

    it('renders disabled "Produit Épuisé" state when stock is depleted to zero', async () => {
      const original = await mockDataProvider.getProductById('prod-001');
      const outOfStockProduct: Product = {
        ...original!,
        stockQuantity: 0,
        inStock: false,
      };

      const { unmount } = render(<ProductDetailPage product={outOfStockProduct} />);

      // Out of stock banner
      expect(
        screen.getByText(/Produit Épuisé • Rupture Temporaire/i)
      ).toBeInTheDocument();

      // "Ajouter au Panier" and "Commander directement" should not exist
      expect(screen.queryByRole('button', { name: /Ajouter au Panier/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Commander directement/i })).toBeNull();

      // All size buttons are disabled with "Épuisé"
      for (const size of outOfStockProduct.sizes) {
        const btn = screen.getByRole('button', { name: new RegExp(`Taille ${size}`, 'i') });
        expect(btn).toBeDisabled();
      }

      unmount();
    });

    it('respects granular sizeInventory matrix disabling exhausted sizes while keeping available sizes selectable', () => {
      const granularInventory = {
        '48': 0, // Out of stock
        '50': 4, // Available
        '52': 0, // Out of stock
        '54': 2, // Available
      };

      const onSelectMock = vi.fn();

      const { unmount } = render(
        <SizeSelector
          sizes={['48', '50', '52', '54']}
          selectedSize={null}
          onSelectSize={onSelectMock}
          sizeInventory={granularInventory}
          inStock={true}
        />
      );

      const btn48 = screen.getByRole('button', { name: /Taille 48 - Épuisé/i });
      const btn50 = screen.getByRole('button', { name: /^Taille 50$/i });
      const btn52 = screen.getByRole('button', { name: /Taille 52 - Épuisé/i });
      const btn54 = screen.getByRole('button', { name: /^Taille 54$/i });

      expect(btn48).toBeDisabled();
      expect(btn50).not.toBeDisabled();
      expect(btn52).toBeDisabled();
      expect(btn54).not.toBeDisabled();

      // Clicking disabled size should NOT trigger onSelect
      fireEvent.click(btn48);
      expect(onSelectMock).not.toHaveBeenCalled();

      // Clicking available size triggers onSelect
      fireEvent.click(btn50);
      expect(onSelectMock).toHaveBeenCalledWith('50');

      unmount();
    });
  });
});
