import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { filterProducts, DEFAULT_FILTER_STATE, resolveCategoryId } from '@/lib/utils/catalogUtils';
import { initialProducts } from '@/lib/seed/seed-data';
import { mockDataProvider } from './helpers/mockDataProvider';
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { AddToCartSection } from '@/components/store/pdp/AddToCartSection';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { ZeroResults } from '@/components/store/ZeroResults';
import { localStorageMock } from './setup';
import { Product } from '@/types';

// Mock useRouter from next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/catalog',
    useParams: () => ({}),
  };
});

// Setup mock sessionStorage if not present in test env
const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, val: string) => {
      store[key] = String(val);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

const sessionStorageMock = createStorageMock();
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true,
  });
}

describe('CHALLENGER M2-1 — Adversarial Stress Test Suite (Milestone 2 Customer Storefront)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
    localStorageMock.clear();
    sessionStorageMock.clear();
    mockPush.mockClear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. HOSTILE & BOUNDARY SEARCH INPUTS (F-SF-03, F-SF-04)
  // =========================================================================
  describe('1. Hostile & Boundary Search Inputs', () => {
    it('handles empty and whitespace-only search queries gracefully without crashing or filtering out products', () => {
      const emptyQueries = ['', ' ', '   ', '\t', '\n', '\r\n   \t  '];

      for (const query of emptyQueries) {
        const result = filterProducts(initialProducts, {
          ...DEFAULT_FILTER_STATE,
          searchQuery: query,
        });

        // An empty or whitespace search query must return all products
        expect(result.length).toBe(initialProducts.length);
      }
    });

    it('handles non-matching terms cleanly and triggers zero-results state', () => {
      const nonMatchingQueries = [
        'terme_completement_inconnu_123456789',
        'qwertyuiopasdfghjklzxcvbnm',
        '99999999999999999999',
        '@@@@@@#######$$$$$$',
      ];

      for (const query of nonMatchingQueries) {
        const result = filterProducts(initialProducts, {
          ...DEFAULT_FILTER_STATE,
          searchQuery: query,
        });

        expect(result).toHaveLength(0);
      }

      // Verify ZeroResults component rendering and reset action
      const resetMock = vi.fn();
      render(<ZeroResults query="non-existent-luxury-item" onReset={resetMock} />);

      expect(screen.getByText(/Aucun Modèle Trouvé/i)).toBeInTheDocument();
      expect(screen.getByText(/non-existent-luxury-item/i)).toBeInTheDocument();

      const resetBtn = screen.getByRole('button', { name: /Réinitialiser les Filtres/i });
      fireEvent.click(resetBtn);
      expect(resetMock).toHaveBeenCalledTimes(1);
    });

    it('is immune to regex injection attacks and metacharacters', () => {
      // Regex special characters that cause SyntaxError if passed into new RegExp() unsanitized
      const regexPayloads = [
        '.*',
        '+',
        '?',
        '^',
        '$',
        '{1,10}',
        '(',
        ')',
        '[a-z]+',
        '\\d+',
        '\\w+',
        '|',
        '(.*)',
        '[',
        ']',
        '\\',
      ];

      for (const payload of regexPayloads) {
        // filterProducts must NOT throw SyntaxError
        expect(() => {
          const result = filterProducts(initialProducts, {
            ...DEFAULT_FILTER_STATE,
            searchQuery: payload,
          });
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      }
    });

    it('safely encapsulates HTML and script injection attempts in search queries', () => {
      const injectionPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert(1)>',
        '"><svg onload=alert(1)>',
        'javascript:alert(1)',
        "'; DROP TABLE products; --",
        '{{constructor.constructor("alert(1)")()}}',
      ];

      for (const payload of injectionPayloads) {
        expect(() => {
          const result = filterProducts(initialProducts, {
            ...DEFAULT_FILTER_STATE,
            searchQuery: payload,
          });
          expect(Array.isArray(result)).toBe(true);
        }).not.toThrow();
      }
    });

    it('handles search queries in uppercase, lowercase, and mixed casing identically', () => {
      const testTerms = [
        { lower: 'laine', upper: 'LAINE', mixed: 'LaInE' },
        { lower: 'veste', upper: 'VESTE', mixed: 'VeStE' },
        { lower: 'soie', upper: 'SOIE', mixed: 'SoIe' },
        { lower: 'cuir', upper: 'CUIR', mixed: 'CuIr' },
      ];

      for (const term of testTerms) {
        const lowerRes = filterProducts(initialProducts, {
          ...DEFAULT_FILTER_STATE,
          searchQuery: term.lower,
        });
        const upperRes = filterProducts(initialProducts, {
          ...DEFAULT_FILTER_STATE,
          searchQuery: term.upper,
        });
        const mixedRes = filterProducts(initialProducts, {
          ...DEFAULT_FILTER_STATE,
          searchQuery: term.mixed,
        });

        expect(lowerRes.length).toBeGreaterThan(0);
        expect(upperRes.length).toBe(lowerRes.length);
        expect(mixedRes.length).toBe(lowerRes.length);

        const lowerIds = lowerRes.map((p) => p.id).sort();
        const upperIds = upperRes.map((p) => p.id).sort();
        const mixedIds = mixedRes.map((p) => p.id).sort();

        expect(upperIds).toEqual(lowerIds);
        expect(mixedIds).toEqual(lowerIds);
      }
    });

    it('handles French accents and diacritics in search queries safely without crashing', () => {
      const accentedQueries = [
        'vêtements',
        'vetements',
        'écharpe',
        'laine',
        'pièces',
        'cérémonie',
        'élégance',
        'été',
        'drap de laine',
        'sartorial',
      ];

      for (const query of accentedQueries) {
        expect(() => {
          const res = filterProducts(initialProducts, {
            ...DEFAULT_FILTER_STATE,
            searchQuery: query,
          });
          expect(Array.isArray(res)).toBe(true);
        }).not.toThrow();
      }

      // Test 'laine': must find multiple suits, coats, blazers
      const laineMatches = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'laine',
      });
      expect(laineMatches.length).toBeGreaterThanOrEqual(2);
      expect(laineMatches.every((p) => 
        p.title.toLowerCase().includes('laine') || 
        p.description.toLowerCase().includes('laine') ||
        (p.materials && p.materials.toLowerCase().includes('laine'))
      )).toBe(true);

      // Verify behavior of 'vêtements' vs 'vetements'
      const vetementsWithAccent = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'vêtements',
      });
      const vetementsWithoutAccent = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'vetements',
      });

      // Both should be arrays and not crash
      expect(Array.isArray(vetementsWithAccent)).toBe(true);
      expect(Array.isArray(vetementsWithoutAccent)).toBe(true);
      const suedeMatches = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'suédé',
      });
      expect(suedeMatches.some((p) => p.title.toLowerCase().includes('suédé'))).toBe(true);

      // Verify that 'pièce' matches products with 'pièce' in description
      const suitMatches = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'pièce',
      });
      expect(suitMatches.some((p) => p.description.toLowerCase().includes('pièce'))).toBe(true);

      // Verify that non-matching term 'écharpe' returns an empty array cleanly without crashing
      const echarpeMatches = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'écharpe',
      });
      expect(echarpeMatches).toHaveLength(0);
    });

    it('survives extreme length search strings (10,000 characters) without ReDoS or performance degradation', () => {
      const extremeQuery = 'super-luxe-costume-'.repeat(500); // 9500 chars

      const start = performance.now();
      const res = filterProducts(initialProducts, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: extremeQuery,
      });
      const duration = performance.now() - start;

      expect(res).toHaveLength(0);
      expect(duration).toBeLessThan(100); // Execution under 100ms
    });

    it('resolves category slugs, IDs, uppercase, and trims whitespace correctly', () => {
      expect(resolveCategoryId('vetements')).toBe('clothing');
      expect(resolveCategoryId('clothing')).toBe('clothing');
      expect(resolveCategoryId('  VETEMENTS  ')).toBe('clothing');
      expect(resolveCategoryId('CLOTHING')).toBe('clothing');

      expect(resolveCategoryId('chaussures')).toBe('shoes');
      expect(resolveCategoryId('shoes')).toBe('shoes');
      expect(resolveCategoryId('Chaussures')).toBe('shoes');

      expect(resolveCategoryId('accessoires')).toBe('accessories');
      expect(resolveCategoryId('accessories')).toBe('accessories');
      expect(resolveCategoryId('ACCESSOIRES')).toBe('accessories');

      expect(resolveCategoryId('nonexistent-category')).toBeNull();
      expect(resolveCategoryId('')).toBeNull();
    });
  });

  // =========================================================================
  // 2. SIZE SELECTOR BEHAVIOR & INVENTORY MATRIX (F-SF-05)
  // =========================================================================
  describe('2. Size Selector Behavior & Out-of-Stock Matrix', () => {
    it('disables depleted sizes when sizeInventory indicates 0 units and marks them as Épuisé', () => {
      const onSelectSizeMock = vi.fn();

      render(
        <SizeSelector
          sizes={['48', '50', '52', '54']}
          selectedSize={null}
          onSelectSize={onSelectSizeMock}
          sizeInventory={{ '48': 0, '50': 5, '52': 0, '54': 2 }}
          inStock={true}
        />
      );

      // Size 48: 0 stock -> disabled, Épuisé
      const size48Btn = screen.getByRole('button', { name: /Taille 48 - Épuisé/i });
      expect(size48Btn).toBeDisabled();
      expect(size48Btn).toHaveTextContent('Épuisé');

      // Size 52: 0 stock -> disabled, Épuisé
      const size52Btn = screen.getByRole('button', { name: /Taille 52 - Épuisé/i });
      expect(size52Btn).toBeDisabled();
      expect(size52Btn).toHaveTextContent('Épuisé');

      // Size 50: 5 stock -> enabled
      const size50Btn = screen.getByRole('button', { name: 'Taille 50' });
      expect(size50Btn).not.toBeDisabled();

      // Size 54: 2 stock -> enabled
      const size54Btn = screen.getByRole('button', { name: 'Taille 54' });
      expect(size54Btn).not.toBeDisabled();

      // Attempt clicking depleted size 48 -> should not trigger callback
      fireEvent.click(size48Btn);
      expect(onSelectSizeMock).not.toHaveBeenCalled();

      // Clicking available size 50 -> triggers callback
      fireEvent.click(size50Btn);
      expect(onSelectSizeMock).toHaveBeenCalledWith('50');
    });

    it('defaults unlisted sizes in sizeInventory to unavailable/depleted (safe fallback)', () => {
      const onSelectSizeMock = vi.fn();

      render(
        <SizeSelector
          sizes={['48', '50', '56']}
          selectedSize={null}
          onSelectSize={onSelectSizeMock}
          sizeInventory={{ '48': 3, '50': 2 }} // Size 56 is omitted
          inStock={true}
        />
      );

      const size56Btn = screen.getByRole('button', { name: /Taille 56 - Épuisé/i });
      expect(size56Btn).toBeDisabled();
      expect(size56Btn).toHaveTextContent('Épuisé');
    });

    it('safely treats negative stockQuantity and negative size inventory as depleted', () => {
      const negativeInventoryProduct: Product = {
        ...initialProducts[0],
        stockQuantity: -2,
        inStock: true,
        sizeInventory: { '48': -5, '50': 0 },
      };

      // AddToCartSection must display out-of-stock banner
      render(
        <AddToCartSection
          product={negativeInventoryProduct}
          selectedSize="48"
          onValidateSize={() => true}
        />
      );

      expect(screen.getByRole('button', { name: /Produit Épuisé • Rupture Temporaire/i })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Ajouter au Panier/i })).not.toBeInTheDocument();
    });

    it('handles empty image array without crashing when adding to cart or direct checkout', () => {
      const noImageProduct: Product = {
        ...initialProducts[0],
        images: [],
      };

      render(
        <AddToCartSection
          product={noImageProduct}
          selectedSize="50"
          onValidateSize={() => true}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
      expect(() => fireEvent.click(addBtn)).not.toThrow();

      const cart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(cart).toHaveLength(1);
      expect(cart[0].image).toBeTruthy(); // Fallback placeholder image URL used
    });

    it('disables ALL sizes when overall inStock is false (completely sold out)', () => {
      const onSelectSizeMock = vi.fn();

      render(
        <SizeSelector
          sizes={['48', '50', '52']}
          selectedSize={null}
          onSelectSize={onSelectSizeMock}
          sizeInventory={{ '48': 5, '50': 5, '52': 5 }}
          inStock={false}
        />
      );

      const size48 = screen.getByRole('button', { name: /Taille 48 - Épuisé/i });
      const size50 = screen.getByRole('button', { name: /Taille 50 - Épuisé/i });
      const size52 = screen.getByRole('button', { name: /Taille 52 - Épuisé/i });

      expect(size48).toBeDisabled();
      expect(size50).toBeDisabled();
      expect(size52).toBeDisabled();
    });

    it('renders disabled "Produit Épuisé • Rupture Temporaire" banner in AddToCartSection when product is out of stock', () => {
      const outOfStockProduct: Product = {
        ...initialProducts[0],
        inStock: false,
        stockQuantity: 0,
      };

      render(
        <AddToCartSection
          product={outOfStockProduct}
          selectedSize="50"
          onValidateSize={() => true}
        />
      );

      expect(screen.getByRole('button', { name: /Produit Épuisé • Rupture Temporaire/i })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Ajouter au Panier/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Commander directement/i })).not.toBeInTheDocument();
    });

    it('auto-selects the size when product has exactly 1 size (accessories / single size items)', () => {
      const singleSizeProduct: Product = {
        ...initialProducts[0],
        id: 'prod-tie-single',
        sizes: ['Taille Unique'],
      };

      render(<ProductDetailPage product={singleSizeProduct} />);

      // Verify that the single size button is selected by default
      const sizeBtn = screen.getByRole('button', { name: 'Taille Taille Unique' });
      expect(sizeBtn).toHaveAttribute('aria-pressed', 'true');

      // Clicking "Commander directement" works immediately without showing error
      const directCheckoutBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(directCheckoutBtn);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('size=Taille%20Unique')
      );
      expect(screen.queryByText(/Veuillez sélectionner votre taille/i)).not.toBeInTheDocument();
    });

    it('prevents adding to cart or direct checkout when multi-size item has no size selected and shows error alert', () => {
      const multiSizeProduct: Product = {
        ...initialProducts[0],
        sizes: ['48', '50', '52'],
      };

      render(<ProductDetailPage product={multiSizeProduct} />);

      // Verify no size is pre-selected initially
      expect(screen.queryByText(/Veuillez sélectionner votre taille/i)).not.toBeInTheDocument();

      // Click "Ajouter au Panier" without choosing a size
      const addCartBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
      fireEvent.click(addCartBtn);

      // Validation error must appear
      expect(
        screen.getByText(/Veuillez sélectionner votre taille avant d'ajouter au panier ou de commander/i)
      ).toBeInTheDocument();

      // LocalStorage cart must NOT have been created or modified
      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      // Click "Commander directement" without choosing a size
      const directBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(directBtn);

      // Router push must NOT be called
      expect(mockPush).not.toHaveBeenCalled();

      // SessionStorage must NOT have express checkout item
      expect(sessionStorageMock.getItem('vip_express_checkout')).toBeNull();
    });
  });

  // =========================================================================
  // 3. DIRECT CHECKOUT BYPASS & STORAGE ISOLATION (F-SF-05, Journey 2)
  // =========================================================================
  describe('3. Direct Checkout Bypass & State Isolation', () => {
    it('verifies "Commander directement" NEVER writes or leaves residues in localStorage.getItem("vip_cart")', () => {
      const product: Product = initialProducts[0];
      const validateSizeMock = vi.fn(() => true);

      render(
        <AddToCartSection
          product={product}
          selectedSize="50"
          onValidateSize={validateSizeMock}
        />
      );

      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      const directBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(directBtn);

      // CRITICAL ASSERTION: vip_cart must remain strictly NULL
      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      // Express item must be placed in sessionStorage
      const expressRaw = sessionStorageMock.getItem('vip_express_checkout');
      expect(expressRaw).not.toBeNull();
      const expressItem = JSON.parse(expressRaw!);
      expect(expressItem.productId).toBe(product.id);
      expect(expressItem.selectedSize).toBe('50');
      expect(expressItem.price).toBe(product.price);
      expect(expressItem.quantity).toBe(1);

      // Router redirected to direct checkout route
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/^\/checkout\?direct=1&productId=.*&size=50&qty=1$/)
      );
    });

    it('preserves pre-existing cart items in localStorage without modification when "Commander directement" is used', () => {
      // Pre-fill localStorage with 2 existing items
      const preExistingCart = [
        {
          productId: 'prod-item-1',
          title: 'Ceinture Cuir Grainé',
          slug: 'ceinture-cuir-graine',
          price: 9500,
          quantity: 1,
          selectedSize: '95',
          image: 'https://example.com/belt.jpg',
        },
        {
          productId: 'prod-item-2',
          title: 'Pochette de Costume Soie',
          slug: 'pochette-costume-soie',
          price: 4500,
          quantity: 2,
          selectedSize: 'Unique',
          image: 'https://example.com/pochette.jpg',
        },
      ];
      localStorageMock.setItem('vip_cart', JSON.stringify(preExistingCart));

      const product: Product = initialProducts[1]; // Different product (e.g. Smoking)

      render(
        <AddToCartSection
          product={product}
          selectedSize="52"
          onValidateSize={() => true}
        />
      );

      // Trigger express direct checkout
      const directBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(directBtn);

      // CRITICAL: Pre-existing cart must NOT be wiped, overwritten, or appended to!
      const storedCart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(storedCart).toHaveLength(2);
      expect(storedCart[0].productId).toBe('prod-item-1');
      expect(storedCart[1].productId).toBe('prod-item-2');
      expect(storedCart.some((it: any) => it.productId === product.id)).toBe(false);

      // Express item stored separately in sessionStorage
      const expressItem = JSON.parse(sessionStorageMock.getItem('vip_express_checkout')!);
      expect(expressItem.productId).toBe(product.id);
      expect(expressItem.selectedSize).toBe('52');
    });

    it('accurately passes updated quantity to direct checkout payload and URL params', () => {
      const product: Product = initialProducts[0];

      render(
        <AddToCartSection
          product={product}
          selectedSize="50"
          onValidateSize={() => true}
        />
      );

      // Increment quantity from 1 to 3
      const plusBtn = screen.getByRole('button', { name: /Augmenter la quantité/i });
      fireEvent.click(plusBtn);
      fireEvent.click(plusBtn);

      expect(screen.getByText('3')).toBeInTheDocument();

      // Click "Commander directement"
      const directBtn = screen.getByRole('button', { name: /Commander directement/i });
      fireEvent.click(directBtn);

      // Verify quantity 3 in sessionStorage
      const expressItem = JSON.parse(sessionStorageMock.getItem('vip_express_checkout')!);
      expect(expressItem.quantity).toBe(3);

      // Verify quantity 3 in URL
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('&qty=3')
      );

      // Verify cart remains null
      expect(localStorageMock.getItem('vip_cart')).toBeNull();
    });

    it('clamps quantity decrement at minimum 1 and prevents exceeding available stock', () => {
      const lowStockProduct: Product = {
        ...initialProducts[0],
        stockQuantity: 2,
      };

      render(
        <AddToCartSection
          product={lowStockProduct}
          selectedSize="50"
          onValidateSize={() => true}
        />
      );

      const minusBtn = screen.getByRole('button', { name: /Diminuer la quantité/i });
      const plusBtn = screen.getByRole('button', { name: /Augmenter la quantité/i });

      // Try decrementing below 1
      fireEvent.click(minusBtn);
      expect(screen.getByText('1')).toBeInTheDocument();

      // Increment to stock limit (2)
      fireEvent.click(plusBtn);
      expect(screen.getByText('2')).toBeInTheDocument();

      // Try incrementing above stock limit
      fireEvent.click(plusBtn);
      expect(screen.getByText('2')).toBeInTheDocument(); // Still 2, clamped!
    });
  });

  // =========================================================================
  // 4. ADD TO CART STANDARD FLOW (F-SF-05, Journey 1)
  // =========================================================================
  describe('4. Standard Add to Cart Flow', () => {
    it('adds item to localStorage.getItem("vip_cart") and dispatches custom event "vip-cart-updated"', () => {
      const product: Product = initialProducts[0];
      const eventListenerMock = vi.fn();
      window.addEventListener('vip-cart-updated', eventListenerMock);

      render(
        <AddToCartSection
          product={product}
          selectedSize="50"
          onValidateSize={() => true}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
      fireEvent.click(addBtn);

      // Check localStorage
      const cart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(product.id);
      expect(cart[0].selectedSize).toBe('50');
      expect(cart[0].quantity).toBe(1);

      // Check event dispatched
      expect(eventListenerMock).toHaveBeenCalled();

      // Check visual confirmation feedback
      expect(screen.getByText(/Ajouté au Panier !/i)).toBeInTheDocument();

      window.removeEventListener('vip-cart-updated', eventListenerMock);
    });

    it('increments quantity of existing item when added again with same size', () => {
      const product: Product = initialProducts[0];

      render(
        <AddToCartSection
          product={product}
          selectedSize="50"
          onValidateSize={() => true}
        />
      );

      const addBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });

      // Add once (qty 1)
      fireEvent.click(addBtn);
      let cart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(1);

      // Add again (qty 1)
      fireEvent.click(addBtn);
      cart = JSON.parse(localStorageMock.getItem('vip_cart')!);
      expect(cart).toHaveLength(1);
      expect(cart[0].quantity).toBe(2);
    });
  });
});
