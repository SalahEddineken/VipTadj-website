/**
 * VIP TADJ — Challenger M6 Empirical Adversarial Test Harness
 *
 * Dedicated verification suite authored by Challenger M6-1 (teamwork_challenger)
 * to empirically stress-test and probe:
 * 1. Free shipping threshold exact boundaries (14,999 vs 15,000 vs 15,001 DA) & dynamic reconfiguration
 * 2. 58 Wilaya delivery fee matrix across all regional zones (Adrar 900 to Alger 400, Stop Desk vs Home)
 * 3. Algerian phone validation regex and hostile input rejection
 * 4. Shopping cart quantity clamping ([1, 99]), composite keys, and storage isolation
 * 5. Real-time stock floor defense and sold-out behavior in PDP
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { NextRequest } from 'next/server';

// Domain imports
import { ALGERIAN_58_WILAYAS, getWilayaByCode, getWilayaFee, searchWilayas } from '@/lib/data/wilayas';
import {
  calculateDeliveryFee,
  calculateSubtotal,
  calculateTotal,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
} from '@/lib/utils/deliveryUtils';
import {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  normalizePhoneForWhatsApp,
} from '@/lib/utils/phoneUtils';
import { formatDZD, parseDZD } from '@/lib/utils/formatDZD';
import {
  CartProvider,
  useCart,
  clampQuantity,
  getCartItemId,
} from '@/lib/context/cart-context';
import { getDataStore } from '@/lib/data-provider';
import { POST as ordersPost } from '@/app/api/orders/route';
import { PUT as settingsPut } from '@/app/api/settings/route';
import { PATCH as statusPatch } from '@/app/api/orders/[id]/status/route';
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { OrderConfirmationCartCleaner } from '@/app/checkout/success/[orderId]/OrderConfirmationCartCleaner';

// Mock storage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('Challenger M6 Empirical Adversarial Evaluation', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const store = getDataStore();
    await store.seedCatalog(true);
  });

  // =========================================================================
  // FOCUS AREA 1: Free Shipping Threshold Boundaries & Dynamic Reconfiguration
  // =========================================================================
  describe('Focus Area 1: Free Shipping Threshold Exact Boundaries & Dynamic Reconfiguration', () => {
    it('empirically verifies exact threshold boundaries: 14,999 DA charges fee, 15,000 DA waives fee, 15,001 DA waives fee', () => {
      const defaultThreshold = 15000;

      // 14,999 DA (ineligible - 1 DA below threshold) across distinct zones
      expect(calculateDeliveryFee(14999, 16, defaultThreshold, 'home')).toBe(400); // Alger
      expect(calculateDeliveryFee(14999, 16, defaultThreshold, 'desk')).toBe(250); // Alger Desk
      expect(calculateDeliveryFee(14999, 31, defaultThreshold, 'home')).toBe(600); // Oran
      expect(calculateDeliveryFee(14999, 31, defaultThreshold, 'desk')).toBe(350); // Oran Desk
      expect(calculateDeliveryFee(14999, 1, defaultThreshold, 'home')).toBe(900);  // Adrar Grand Sud
      expect(calculateDeliveryFee(14999, 1, defaultThreshold, 'desk')).toBe(500);  // Adrar Desk

      // 15,000 DA (exact threshold - eligible)
      expect(calculateDeliveryFee(15000, 16, defaultThreshold, 'home')).toBe(0);
      expect(calculateDeliveryFee(15000, 16, defaultThreshold, 'desk')).toBe(0);
      expect(calculateDeliveryFee(15000, 31, defaultThreshold, 'home')).toBe(0);
      expect(calculateDeliveryFee(15000, 31, defaultThreshold, 'desk')).toBe(0);
      expect(calculateDeliveryFee(15000, 1, defaultThreshold, 'home')).toBe(0);
      expect(calculateDeliveryFee(15000, 1, defaultThreshold, 'desk')).toBe(0);

      // 15,001 DA (above threshold - eligible)
      expect(calculateDeliveryFee(15001, 16, defaultThreshold, 'home')).toBe(0);
      expect(calculateDeliveryFee(15001, 31, defaultThreshold, 'home')).toBe(0);
      expect(calculateDeliveryFee(15001, 1, defaultThreshold, 'home')).toBe(0);
    });

    it('empirically verifies dynamic threshold reconfiguration via API and custom store settings', async () => {
      // Reconfigure threshold to 25,000 DA via PUT /api/settings
      const updateReq = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingThreshold: 25000,
        }),
      });
      const updateRes = await settingsPut(updateReq);
      expect(updateRes.status).toBe(200);

      const store = getDataStore();
      const settings = await store.getSettings();
      expect(settings.freeShippingThreshold).toBe(25000);

      // Under 25,000 DA threshold:
      // Subtotal 20,000 DA (previously free under 15,000) now pays delivery fee
      expect(calculateDeliveryFee(20000, 16, settings.freeShippingThreshold)).toBe(400);
      expect(calculateDeliveryFee(24999, 16, settings.freeShippingThreshold)).toBe(400);
      expect(calculateDeliveryFee(25000, 16, settings.freeShippingThreshold)).toBe(0);
      expect(calculateDeliveryFee(30000, 16, settings.freeShippingThreshold)).toBe(0);

      // Zero-threshold configuration (all orders get free shipping)
      const zeroReq = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingThreshold: 0,
        }),
      });
      await settingsPut(zeroReq);
      const zeroSettings = await store.getSettings();
      expect(zeroSettings.freeShippingThreshold).toBe(0);
      expect(calculateDeliveryFee(500, 1, zeroSettings.freeShippingThreshold)).toBe(0);
      expect(calculateDeliveryFee(1, 16, zeroSettings.freeShippingThreshold)).toBe(0);
    });

    it('handles edge subtotal amounts (0, negative, floating point decimals)', () => {
      // Subtotal 0 DA -> charges fee
      expect(calculateDeliveryFee(0, 16, 15000)).toBe(400);
      // Negative subtotal -> charges fee
      expect(calculateDeliveryFee(-100, 16, 15000)).toBe(400);
      // Floating subtotal boundary: 14999.99 vs 15000.00
      expect(calculateDeliveryFee(14999.99, 16, 15000)).toBe(400);
      expect(calculateDeliveryFee(15000.00, 16, 15000)).toBe(0);
    });
  });

  // =========================================================================
  // FOCUS AREA 2: 58 Wilaya Delivery Fee Matrix & Regional Zones
  // =========================================================================
  describe('Focus Area 2: 58 Wilaya Delivery Fee Matrix & Regional Zones', () => {
    it('verifies that all 58 wilayas exist with contiguous codes 1 to 58, valid French/Arabic names, and positive fees', () => {
      expect(ALGERIAN_58_WILAYAS).toHaveLength(58);

      const seenCodes = new Set<number>();

      for (let code = 1; code <= 58; code++) {
        const wilaya = getWilayaByCode(code);
        expect(wilaya).toBeDefined();
        expect(wilaya?.code).toBe(code);
        expect(wilaya?.name).toBeTruthy();
        expect(wilaya?.nameAr).toBeTruthy();
        expect(wilaya?.zone).toBeTruthy();
        expect(wilaya?.homeDeliveryFee).toBeGreaterThanOrEqual(400);
        expect(wilaya?.deskFee).toBeGreaterThanOrEqual(250);
        // Desk fee invariant: Stop Desk fee must always be strictly less than Home delivery fee
        expect(wilaya!.deskFee).toBeLessThan(wilaya!.homeDeliveryFee);

        seenCodes.add(code);
      }

      expect(seenCodes.size).toBe(58);
    });

    it('verifies regional zone fee distribution adheres to national pricing model', () => {
      // 1. Alger (Wilaya 16): 400 DA Home / 250 DA Desk
      const alger = getWilayaByCode(16)!;
      expect(alger.fee).toBe(400);
      expect(alger.deskFee).toBe(250);
      expect(alger.zone).toBe('alger');

      // 2. Centre Mitidja (Blida 9, Boumerdes 35, Tipaza 42): 500 DA Home / 300 DA Desk
      for (const code of [9, 35, 42]) {
        const w = getWilayaByCode(code)!;
        expect(w.fee).toBe(500);
        expect(w.deskFee).toBe(300);
        expect(w.zone).toBe('centre');
      }

      // 3. Grand Sud (Wilayas 1, 7, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58): 900 DA Home
      const sudCodes = [1, 7, 8, 11, 30, 33, 37, 39, 47, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];
      for (const code of sudCodes) {
        const w = getWilayaByCode(code)!;
        expect(w.fee).toBe(900);
        expect(w.zone).toBe('sud');
        expect(w.deskFee).toBeGreaterThanOrEqual(500);
      }

      // 4. Standard Regional (Ouest, Est, Hauts-Plateaux): 600 DA Home / 350 DA Desk
      const standardCodes = [2, 13, 23, 25, 31, 19]; // Chlef, Tlemcen, Annaba, Constantine, Oran, Setif
      for (const code of standardCodes) {
        const w = getWilayaByCode(code)!;
        expect(w.fee).toBe(600);
        expect(w.deskFee).toBe(350);
      }
    });

    it('handles out-of-range, NaN, null, and negative wilaya codes safely with standard fallback fee', () => {
      const hostileCodes = [0, 59, 60, 100, -1, -58, 9999];
      for (const code of hostileCodes) {
        expect(getWilayaByCode(code)).toBeUndefined();
        expect(getWilayaFee(code)).toBe(600); // Standard national fallback
        expect(calculateDeliveryFee(5000, code)).toBe(600);
      }

      // Nullish inputs
      expect(calculateDeliveryFee(5000, null)).toBe(600);
      expect(calculateDeliveryFee(5000, undefined)).toBe(600);
    });

    it('verifies searchWilayas functionality with accent folding, Arabic script, and numeric codes', () => {
      // Accent-insensitive search
      expect(searchWilayas('bejaia')[0]?.name).toBe('Béjaïa');
      expect(searchWilayas('setif')[0]?.name).toBe('Sétif');
      expect(searchWilayas('medea')[0]?.name).toBe('Médéa');

      // Arabic script search
      expect(searchWilayas('الجزائر')[0]?.code).toBe(16);
      expect(searchWilayas('وهران')[0]?.code).toBe(31);
      expect(searchWilayas('أدرار')[0]?.code).toBe(1);

      // Numeric code search
      expect(searchWilayas('16')[0]?.code).toBe(16);
      expect(searchWilayas('31')[0]?.code).toBe(31);
      expect(searchWilayas('58')[0]?.code).toBe(58);

      // Empty or whitespace query returns all 58
      expect(searchWilayas('')).toHaveLength(58);
      expect(searchWilayas('   ')).toHaveLength(58);
    });
  });

  // =========================================================================
  // FOCUS AREA 3: Algerian Phone Validation Regex & Hostile Inputs
  // =========================================================================
  describe('Focus Area 3: Algerian Phone Validation Regex & Hostile Input Rejection', () => {
    it('accepts valid mobile phone numbers across Mobilis (06), Djezzy (07), Ooredoo (05) and prefixes', () => {
      const validNumbers = [
        // 10-digit national
        '0550123456',
        '0661234567',
        '0770987654',
        // With common delimiters (spaces, hyphens, dots, parentheses)
        '05 50 12 34 56',
        '06-61-23-45-67',
        '07.70.98.76.54',
        '(05) 50 12 34 56',
        // International +213 format
        '+213550123456',
        '+213 661 23 45 67',
        '+213-770-98-76-54',
        // International 00213 format
        '00213550123456',
        '00213 661 23 45 67',
        '00213-770-98-76-54',
      ];

      for (const phone of validNumbers) {
        expect(isValidAlgerianPhone(phone)).toBe(true);
      }
    });

    it('strictly rejects hostile inputs, landlines, VoIP, foreign numbers, and injection attacks', () => {
      const hostilePhones = [
        // Fixed landlines
        '021123456',    // Alger fixed
        '023456789',    // Tipaza fixed
        '031123456',    // Constantine fixed
        '038123456',    // Annaba fixed
        '041123456',    // Oran fixed
        // VoIP / special
        '0800123456',
        '0982123456',
        // Invalid leading prefix
        '0123456789',
        // Foreign country codes
        '+33612345678', // France
        '+15551234567', // USA
        '+212612345678', // Morocco
        '+21621234567',  // Tunisia
        '0033612345678',
        // Length anomalies
        '055012345',     // 9 digits (too short)
        '05501234567',   // 11 digits (too long)
        '05501234',      // 8 digits
        '+21355012345',  // +213 with 8 digits instead of 9
        '+2135501234567',// +213 with 10 digits
        // Alphabetic and alphanumeric noise
        '055012345a',
        '055012345O',
        'phone0550123456',
        'O55O123456',
        // SQL Injection & script injection payloads
        '<script>0550123456</script>',
        "0550123456' OR '1'='1",
        '0550123456; DROP TABLE orders;--',
        // Whitespace, null, undefined, empty
        '',
        '          ',
        'null',
        'undefined',
      ];

      for (const phone of hostilePhones) {
        expect(isValidAlgerianPhone(phone)).toBe(false);
      }
    });

    it('formats valid phone numbers into standard display and RFC-compliant tel: and WhatsApp URIs', () => {
      // Display format: 0X XX XX XX XX
      expect(formatAlgerianPhone('0550123456')).toBe('0550 12 34 56');
      expect(formatAlgerianPhone('+213661234567')).toBe('0661 23 45 67');
      expect(formatAlgerianPhone('00213770987654')).toBe('0770 98 76 54');

      // RFC-compliant tel: URI
      expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('+213661234567')).toBe('tel:+213661234567');
      expect(formatTelLink('00213770987654')).toBe('tel:+213770987654');
      expect(formatTelLink('05 50 12 34 56')).toBe('tel:+213550123456');

      // WhatsApp normalization: digits without leading zero or + symbol
      expect(normalizePhoneForWhatsApp('0550123456')).toBe('213550123456');
      expect(normalizePhoneForWhatsApp('+213661234567')).toBe('213661234567');
      expect(normalizePhoneForWhatsApp('00213770987654')).toBe('213770987654');
    });
  });

  // =========================================================================
  // FOCUS AREA 4: Cart Clamping, Composite Keys & Storage Isolation
  // =========================================================================
  describe('Focus Area 4: Cart Quantity Clamping, Composite Keys & Storage Isolation', () => {
    it('strictly clamps quantities to [1, 99] and handles boundary values', () => {
      expect(clampQuantity(1)).toBe(1);
      expect(clampQuantity(99)).toBe(99);
      expect(clampQuantity(0)).toBe(1);
      expect(clampQuantity(-10)).toBe(1);
      expect(clampQuantity(-999)).toBe(1);
      expect(clampQuantity(100)).toBe(99);
      expect(clampQuantity(9999)).toBe(99);
      expect(clampQuantity(2.7)).toBe(2);
      expect(clampQuantity(1.1)).toBe(1);
    });

    it('generates deterministic composite keys (productId-selectedSize)', () => {
      expect(getCartItemId('prod-1', '50')).toBe('prod-1-50');
      expect(getCartItemId('prod-1', '52')).toBe('prod-1-52');
      expect(getCartItemId('shoe-01', '42')).toBe('shoe-01-42');
      expect(getCartItemId('shoe-01', '43')).toBe('shoe-01-43');
    });

    it('enforces separate line items for identical product added with different sizes', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(CartProvider, null, children),
      });

      const sampleProduct = {
        productId: 'suit-001',
        title: 'Costume Laine Super 130s',
        slug: 'costume-laine',
        price: 48500,
        quantity: 1,
        selectedSize: '50',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      };

      // Add Size 50
      act(() => {
        result.current.addItem(sampleProduct);
      });
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].selectedSize).toBe('50');

      // Add Size 52 of the SAME product
      act(() => {
        result.current.addItem({
          ...sampleProduct,
          selectedSize: '52',
          quantity: 2,
        });
      });

      // Must result in 2 distinct line items with separate composite IDs
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].id).toBe('suit-001-50');
      expect(result.current.items[1].id).toBe('suit-001-52');
      expect(result.current.itemCount).toBe(3); // 1 + 2
      expect(result.current.subtotal).toBe(48500 * 3);
    });

    it('maintains strict storage isolation between Express Direct Checkout (sessionStorage) and Regular Cart (localStorage)', () => {
      // 1. Regular cart has existing items in localStorage
      localStorage.setItem(
        'vip_cart',
        JSON.stringify([
          {
            id: 'cart-item-1',
            productId: 'p1',
            title: 'Chemise Blanche',
            price: 12500,
            quantity: 1,
            selectedSize: '40',
            image: 'https://images.unsplash.com/photo-1620012253295-c15c429f66bf',
          },
        ])
      );

      // 2. Customer performs Express Direct Checkout on a blazer
      const expressItem = {
        productId: 'blazer-02',
        title: 'Blazer Cachemire',
        price: 34000,
        quantity: 1,
        selectedSize: '52',
        image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
      };
      sessionStorage.setItem('vip_express_checkout', JSON.stringify(expressItem));

      // Assert isolation: localStorage vip_cart is NOT modified by express checkout
      const storedCart = JSON.parse(localStorage.getItem('vip_cart') || '[]');
      expect(storedCart).toHaveLength(1);
      expect(storedCart[0].productId).toBe('p1');

      // 3. Post-checkout cleanup: OrderConfirmationCartCleaner for direct order
      render(React.createElement(OrderConfirmationCartCleaner, { isDirectOrder: true }));

      // Express item purged from sessionStorage
      expect(sessionStorage.getItem('vip_express_checkout')).toBeNull();
      // Regular cart in localStorage remains intact!
      const preservedCart = JSON.parse(localStorage.getItem('vip_cart') || '[]');
      expect(preservedCart).toHaveLength(1);
      expect(preservedCart[0].productId).toBe('p1');

      // 4. In contrast, standard order cleanup clears localStorage
      render(React.createElement(OrderConfirmationCartCleaner, { isDirectOrder: false }));
      expect(localStorage.getItem('vip_cart')).toBeNull();
    });
  });

  // =========================================================================
  // FOCUS AREA 5: Real-Time Stock Floor Defense & Sold-Out PDP Behavior
  // =========================================================================
  describe('Focus Area 5: Real-Time Stock Floor Defense & Sold-Out Behavior in PDP', () => {
    it('PDP SizeSelector disables unavailable sizes with Épuisé label and line-through styling', () => {
      const handleSelect = vi.fn();

      const { container } = render(
        React.createElement(SizeSelector, {
          sizes: ['48', '50', '52'],
          selectedSize: null,
          onSelectSize: handleSelect,
          sizeInventory: {
            '48': 2,
            '50': 0, // SOLD OUT
            '52': 1,
          },
          inStock: true,
        })
      );

      const size50Button = screen.getByRole('button', { name: /Taille 50/i });
      expect(size50Button).toBeDisabled();
      expect(size50Button.className).toContain('cursor-not-allowed');
      expect(size50Button.className).toContain('line-through');
      expect(size50Button.textContent).toContain('Épuisé');

      // Clicking disabled size 50 does not trigger selection
      fireEvent.click(size50Button);
      expect(handleSelect).not.toHaveBeenCalled();

      // Size 48 is available and clickable
      const size48Button = screen.getByRole('button', { name: /Taille 48/i });
      expect(size48Button).not.toBeDisabled();
      fireEvent.click(size48Button);
      expect(handleSelect).toHaveBeenCalledWith('48');
    });

    it('defends non-negative stock floor and rejects out-of-stock orders via POST /api/orders with 409 OUT_OF_STOCK', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Mocassins en Cuir Patiné Édition Rare',
        slug: 'mocassins-cuir-patine-edition-rare',
        description: 'Mocassins patinés main en cuir de veau.',
        price: 28000,
        categoryId: 'shoes',
        categorySlug: 'chaussures',
        subcategory: 'mocassins',
        images: [{ id: 'img-shoe', url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f', isPrimary: true }],
        sizes: ['41', '42'],
        stockQuantity: 2, // Exactly 2 units in stock
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      // Customer 1 orders both 2 remaining units
      const validOrderReq = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Mehdi Benali',
            phone: '0555123456',
            wilaya: 'Oran',
            wilayaCode: 31,
            commune: 'Es Senia',
            address: '15 Boulevard de la Soummam',
          },
          items: [
            {
              productId: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              quantity: 2,
              selectedSize: '42',
              image: product.images[0].url,
            },
          ],
          deliveryFee: 600,
        }),
      });

      const res1 = await ordersPost(validOrderReq);
      expect(res1.status).toBe(201);
      const data1 = await res1.json();
      expect(data1.success).toBe(true);

      // Verify stock in data store is now 0 and inStock flipped to false
      const updatedProduct = await store.getProductById(product.id);
      expect(updatedProduct?.stockQuantity).toBe(0);
      expect(updatedProduct?.inStock).toBe(false);

      // Customer 2 attempts to order the now sold-out item -> HTTP 409 OUT_OF_STOCK
      const failedOrderReq = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Karim Ziani',
            phone: '0661998877',
            wilaya: 'Alger',
            wilayaCode: 16,
            commune: 'Bab Ezzouar',
            address: 'Cite 5 Juillet',
          },
          items: [
            {
              productId: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              quantity: 1,
              selectedSize: '42',
              image: product.images[0].url,
            },
          ],
          deliveryFee: 400,
        }),
      });

      const res2 = await ordersPost(failedOrderReq);
      expect(res2.status).toBe(409);
      const data2 = await res2.json();
      expect(data2.success).toBe(false);
      expect(data2.code).toBe('OUT_OF_STOCK');
      expect(data2.availableStock).toBe(0);
    });

    it('restores stock quantity and reactivates inStock when order is cancelled from pending', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Ceinture Réversible en Cuir d\'Autruche',
        slug: 'ceinture-reversible-cuir-autruche',
        description: 'Ceinture artisanale de luxe.',
        price: 18000,
        categoryId: 'accessories',
        categorySlug: 'accessoires',
        subcategory: 'ceintures',
        images: [{ id: 'belt-1', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62', isPrimary: true }],
        sizes: ['95'],
        stockQuantity: 1, // 1 unit in stock
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      // Order the single unit
      const order = await store.createOrder({
        customer: {
          fullName: 'Anis Hadj',
          phone: '0770112233',
          wilaya: 'Annaba',
          wilayaCode: 23,
          commune: 'Annaba Ville',
          address: 'Cours de la Revolution',
        },
        items: [
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            quantity: 1,
            selectedSize: '95',
            image: product.images[0].url,
          },
        ],
        deliveryFee: 600,
      });

      // Product is now sold out
      let p = await store.getProductById(product.id);
      expect(p?.stockQuantity).toBe(0);
      expect(p?.inStock).toBe(false);

      // Cancel order via status PATCH endpoint
      const cancelReq = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: 'customer_cancelled',
          note: 'Annulation demandée par le client avant confirmation téléphonique',
        }),
      });

      const cancelRes = await statusPatch(cancelReq, { params: { id: order.id } });
      expect(cancelRes.status).toBe(200);

      // Verify stock was restored to 1 and inStock flipped back to true
      p = await store.getProductById(product.id);
      expect(p?.stockQuantity).toBe(1);
      expect(p?.inStock).toBe(true);
    });

    it('empirically verifies POST /api/orders input validation boundary defenses', async () => {
      // 1. Missing body
      const badReq1 = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'NOT_JSON',
      });
      const res1 = await ordersPost(badReq1);
      expect(res1.status).toBe(400);

      // 2. Empty items array
      const badReq2 = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Mehdi Benali',
            phone: '0555123456',
            wilaya: 'Oran',
            wilayaCode: 31,
            commune: 'Es Senia',
            address: '15 Boulevard de la Soummam',
          },
          items: [],
        }),
      });
      const res2 = await ordersPost(badReq2);
      expect(res2.status).toBe(400);

      // 3. Invalid phone number (foreign prefix)
      const badReq3 = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Mehdi Benali',
            phone: '+33612345678', // French number rejected
            wilaya: 'Oran',
            wilayaCode: 31,
            commune: 'Es Senia',
            address: '15 Boulevard de la Soummam',
          },
          items: [
            {
              productId: 'prod-001',
              title: 'Costume Laine Super 130s',
              price: 48500,
              quantity: 1,
              selectedSize: '50',
            },
          ],
        }),
      });
      const res3 = await ordersPost(badReq3);
      expect(res3.status).toBe(400);

      // 4. Invalid Wilaya Code (0 and 59)
      const badReq4 = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Mehdi Benali',
            phone: '0555123456',
            wilaya: 'Invalide',
            wilayaCode: 99, // Out of range
            commune: 'Es Senia',
            address: '15 Boulevard de la Soummam',
          },
          items: [
            {
              productId: 'prod-001',
              title: 'Costume Laine Super 130s',
              price: 48500,
              quantity: 1,
              selectedSize: '50',
            },
          ],
        }),
      });
      const res4 = await ordersPost(badReq4);
      expect(res4.status).toBe(400);
    });

    it('empirically verifies cart quantity update removal and clamping in CartProvider', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: React.ReactNode }) =>
          React.createElement(CartProvider, null, children),
      });

      const sampleItem = {
        productId: 'item-10',
        title: 'Mocassins en Cuir',
        slug: 'mocassins',
        price: 25000,
        quantity: 2,
        selectedSize: '42',
        image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
      };

      act(() => {
        result.current.addItem(sampleItem);
      });
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);

      // Update to 0 removes the item
      act(() => {
        result.current.updateQuantity('item-10-42', 0);
      });
      expect(result.current.items).toHaveLength(0);

      // Add again and update to 150 clamps to 99
      act(() => {
        result.current.addItem(sampleItem);
        result.current.updateQuantity('item-10-42', 150);
      });
      expect(result.current.items[0].quantity).toBe(99);
    });
  });
});
