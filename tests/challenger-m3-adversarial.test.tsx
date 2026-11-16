import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { render, screen, fireEvent } from '@testing-library/react';

// Domain modules under test
import { ALGERIAN_58_WILAYAS, getWilayaByCode, getWilayaFee, searchWilayas } from '@/lib/data/wilayas';
import { isValidAlgerianPhone, formatAlgerianPhone, formatTelLink, normalizePhoneForWhatsApp } from '@/lib/utils/phoneUtils';
import { calculateDeliveryFee, calculateSubtotal, calculateTotal, DEFAULT_FREE_SHIPPING_THRESHOLD } from '@/lib/utils/deliveryUtils';
import { formatDZD } from '@/lib/utils/formatDZD';
import { generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import { OrderConfirmationCartCleaner } from '@/app/checkout/success/[orderId]/OrderConfirmationCartCleaner';
import { POST, GET } from '@/app/api/orders/route';
import { getDataStore } from '@/lib/data-provider';
import { mockDataProvider } from './helpers/mockDataProvider';
import { localStorageMock } from './setup';
import { Order, OrderItem, CustomerShippingInfo } from '@/types';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('Challenger M3 Empirical Adversarial Test Suite', () => {
  beforeEach(async () => {
    await getDataStore().seedCatalog(true);
    mockDataProvider.reset();
    localStorageMock.clear();
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // SUITE 1: ALGERIAN PHONE VALIDATION & CONTACT FORMATTING STRESS
  // =========================================================================
  describe('1. Adversarial Algerian Phone Validation & Normalization', () => {
    it('accepts valid 10-digit mobile operator numbers with diverse delimiters', () => {
      const validNumbers = [
        '0550123456', // Ooredoo
        '0561998877',
        '0661234567', // Mobilis
        '0655887766',
        '0770987654', // Djezzy
        '0780123456',
        '05 50 12 34 56',
        '06-61-23-45-67',
        '07.70.98.76.54',
        '(05) 50 12 34 56',
        '  0661234567  ', // with whitespace
      ];

      for (const num of validNumbers) {
        expect(isValidAlgerianPhone(num)).toBe(true);
      }
    });

    it('accepts international mobile formats (+213 and 00213)', () => {
      const validInternational = [
        '+213550123456',
        '+213661234567',
        '+213770987654',
        '+213 550 12 34 56',
        '+213-661-23-45-67',
        '+213.770.98.76.54',
        '00213550123456',
        '00213 661 23 45 67',
        '00213-770-98-76-54',
      ];

      for (const num of validInternational) {
        expect(isValidAlgerianPhone(num)).toBe(true);
      }
    });

    it('strictly rejects Algerian landlines, VoIP, and non-mobile prefixes', () => {
      const invalidPrefixes = [
        '021123456', // Algiers landline
        '023456789', // Tipaza/Blida landline
        '031123456', // Constantine landline
        '038123456', // Annaba landline
        '041123456', // Oran landline
        '0800123456', // Toll-free / special
        '0982123456', // VoIP
        '0123456789', // Invalid prefix 01
        '+21321123456', // International landline
        '0021321123456',
      ];

      for (const num of invalidPrefixes) {
        expect(isValidAlgerianPhone(num)).toBe(false);
      }
    });

    it('rejects length violations, malformed strings, null/undefined, and malicious payloads', () => {
      const maliciousOrMalformed = [
        '',
        '   ',
        null,
        undefined,
        '055012345', // 9 digits (missing 1)
        '05501234567', // 11 digits (extra 1)
        '05501234', // 8 digits
        '+213 (05) 50 12 34 56', // extra 0 in international
        '+21355012345', // 11 chars (missing 1)
        '+2135501234567', // 13 chars (extra 1)
        '055012345a', // alpha character
        '06612345#7', // symbol
        '<script>0550123456</script>',
        "0550123456' OR '1'='1",
        '0550 12 34 5X',
        'undefined',
        'null',
        'NaN',
      ];

      for (const val of maliciousOrMalformed) {
        expect(isValidAlgerianPhone(val as any)).toBe(false);
      }
    });

    it('normalizes phone for display and generates correct tel: link', () => {
      expect(formatAlgerianPhone('0550123456')).toBe('0550 12 34 56');
      expect(formatAlgerianPhone('+213550123456')).toBe('0550 12 34 56');
      expect(formatAlgerianPhone('00213661234567')).toBe('0661 23 45 67');
      expect(formatAlgerianPhone('')).toBe('');

      expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('+213661234567')).toBe('tel:+213661234567');
      expect(formatTelLink('00213770987654')).toBe('tel:+213770987654');
      expect(formatTelLink('05 50 12 34 56')).toBe('tel:+213550123456');
      expect(formatTelLink('')).toBe('tel:');
      expect(formatTelLink(null)).toBe('tel:');
    });

    it('normalizes customer phone in WhatsApp link and generates properly encoded message', () => {
      const order: Order = {
        id: 'ord-test-01',
        orderNumber: 'VT-2026-9999',
        customer: {
          fullName: 'Mohamed Larbi & Frères',
          phone: '0550 12 34 56',
          wilaya: 'Oran',
          wilayaCode: 31,
          commune: 'Es Sénia',
          address: 'Rue de la Liberté, N° 12',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-001',
            title: 'Costume Laine Super 130s',
            slug: 'costume-laine',
            price: 48500,
            quantity: 1,
            selectedSize: '52',
            image: 'https://images.unsplash.com/test',
          },
        ],
        subtotal: 48500,
        deliveryFee: 0,
        total: 48500,
        paymentMethod: 'cod',
        status: 'pending',
        statusHistory: [],
        createdAt: '2026-11-13T20:00:00Z',
        updatedAt: '2026-11-13T20:00:00Z',
      };

      const waLink = generateWhatsAppConfirmLink(order);
      expect(waLink).toContain('https://wa.me/213550123456?text=');
      expect(waLink).not.toContain('wa.me/0550');
      expect(waLink).not.toContain('wa.me/+213');

      // Check URL encoding of special characters
      const url = new URL(waLink);
      const textParam = url.searchParams.get('text');
      expect(textParam).not.toBeNull();
      expect(textParam).toContain('Mohamed Larbi & Frères');
      expect(textParam).toContain('VT-2026-9999');
      expect(textParam).toContain('Taille 52');
      expect(textParam).toContain(formatDZD(order.total));
    });
  });

  // =========================================================================
  // SUITE 2: 58 WILAYAS DATASET & SEARCH RESILIENCE
  // =========================================================================
  describe('2. 58 Wilayas Dataset Completeness & Tariff Tiers', () => {
    it('verifies exact 58 wilayas with contiguous codes 1 to 58 and unique names', () => {
      expect(ALGERIAN_58_WILAYAS).toHaveLength(58);

      const codes = new Set<number>();
      const names = new Set<string>();

      ALGERIAN_58_WILAYAS.forEach((w, idx) => {
        expect(w.code).toBe(idx + 1);
        expect(w.name).toBeTruthy();
        expect(w.nameAr).toBeTruthy();
        expect(w.fee).toBeGreaterThan(0);
        expect(w.deskFee).toBeGreaterThan(0);
        expect(w.deskFee).toBeLessThan(w.fee);
        expect(w.estimatedDays).toBeTruthy();
        expect(w.isAvailable).toBe(true);

        codes.add(w.code);
        names.add(w.name);
      });

      expect(codes.size).toBe(58);
      expect(names.size).toBe(58);
      expect(Math.min(...codes)).toBe(1);
      expect(Math.max(...codes)).toBe(58);
    });

    it('enforces regional fee rules: Alger (400), Centre (500/600), Sud (900)', () => {
      expect(getWilayaFee(16, 'home')).toBe(400); // Alger
      expect(getWilayaFee(16, 'desk')).toBe(250); // Alger stop desk

      expect(getWilayaFee(9, 'home')).toBe(500); // Blida
      expect(getWilayaFee(9, 'desk')).toBe(300);

      expect(getWilayaFee(1, 'home')).toBe(900); // Adrar
      expect(getWilayaFee(11, 'home')).toBe(900); // Tamanrasset
      expect(getWilayaFee(58, 'home')).toBe(900); // El Meniaa
    });

    it('handles out-of-bounds codes with safe default national fallback', () => {
      const outOfBounds = [0, -1, 59, 60, 999, NaN];
      for (const code of outOfBounds) {
        expect(getWilayaByCode(code)).toBeUndefined();
        // getWilayaFee falls back to 600 for unknown wilayas
        expect(getWilayaFee(code, 'home')).toBe(600);
      }
    });

    it('searches wilayas by Arabic, French with accents, code, and injection strings', () => {
      // Arabic search
      const algerAr = searchWilayas('الجزائر');
      expect(algerAr.some((w) => w.code === 16)).toBe(true);

      const oranAr = searchWilayas('وهران');
      expect(oranAr.some((w) => w.code === 31)).toBe(true);

      // French accent-insensitive search
      const bejaiaNoAccent = searchWilayas('bejaia');
      expect(bejaiaNoAccent.some((w) => w.code === 6)).toBe(true);

      const medeaNoAccent = searchWilayas('medea');
      expect(medeaNoAccent.some((w) => w.code === 26)).toBe(true);

      // Numeric code search
      const code16 = searchWilayas('16');
      expect(code16.some((w) => w.code === 16)).toBe(true);

      // Empty query returns all 58
      expect(searchWilayas('')).toHaveLength(58);
      expect(searchWilayas('   ')).toHaveLength(58);

      // Special characters & injection strings do not crash
      expect(searchWilayas('[[').length).toBe(0);
      expect(searchWilayas('(?=.*)').length).toBe(0);
      expect(searchWilayas('<script>').length).toBe(0);
    });
  });

  // =========================================================================
  // SUITE 3: FREE SHIPPING THRESHOLD & FINANCIAL INTEGRITY
  // =========================================================================
  describe('3. Free Shipping Threshold Waiver & Financial Math', () => {
    it('strictly waives delivery fee (returns 0 DA) at and above 15,000 DA threshold across all 58 wilayas', () => {
      for (let code = 1; code <= 58; code++) {
        // At threshold (15,000 DA)
        expect(calculateDeliveryFee(15000, code, 15000, 'home')).toBe(0);
        expect(calculateDeliveryFee(15000, code, 15000, 'desk')).toBe(0);

        // Above threshold (25,000 DA)
        expect(calculateDeliveryFee(25000, code, 15000, 'home')).toBe(0);
        expect(calculateDeliveryFee(25000, code, 15000, 'desk')).toBe(0);

        // Below threshold (14,999 DA) -> Fee MUST be > 0
        expect(calculateDeliveryFee(14999, code, 15000, 'home')).toBeGreaterThan(0);
        expect(calculateDeliveryFee(14999, code, 15000, 'desk')).toBeGreaterThan(0);
      }
    });

    it('accurately computes subtotal and handles negative, null, or malformed prices/quantities', () => {
      const items = [
        { price: 10000, quantity: 2 },
        { price: 5000, quantity: 1 },
      ];
      expect(calculateSubtotal(items)).toBe(25000);

      // Malformed items clamp to zero without NaN
      expect(calculateSubtotal([{ price: -500, quantity: 2 }])).toBe(0);
      expect(calculateSubtotal([{ price: 500, quantity: -2 }])).toBe(0);
      expect(calculateSubtotal([] as any)).toBe(0);
      expect(calculateSubtotal(null as any)).toBe(0);
    });

    it('accurately computes total and clamps negative discounts', () => {
      expect(calculateTotal(25000, 0, 0)).toBe(25000);
      expect(calculateTotal(10000, 600, 1000)).toBe(9600);
      // Discount larger than total clamps to 0
      expect(calculateTotal(5000, 400, 10000)).toBe(0);
      // Negative discount does not artificially increase total
      expect(calculateTotal(10000, 600, -500)).toBe(10600);
    });
  });

  // =========================================================================
  // SUITE 4: EXPRESS DIRECT CHECKOUT ISOLATION VS VIP_CART
  // =========================================================================
  describe('4. Express Direct Checkout Isolation vs localStorage Cart', () => {
    it('ensures OrderConfirmationCartCleaner preserves vip_cart when isDirectOrder=true', () => {
      const cartItems = [
        { productId: 'prod-001', title: 'Suit', price: 48500, quantity: 1, selectedSize: '50' },
      ];
      localStorageMock.setItem('vip_cart', JSON.stringify(cartItems));
      sessionStorageMock.setItem('vip_express_checkout', JSON.stringify({ productId: 'prod-002' }));

      // Render cleaner for express direct order
      const { unmount } = render(<OrderConfirmationCartCleaner isDirectOrder={true} />);

      // sessionStorage should be cleared, but localStorage must remain intact!
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('vip_express_checkout');
      expect(localStorageMock.removeItem).not.toHaveBeenCalledWith('vip_cart');
      expect(localStorageMock.getItem('vip_cart')).toBe(JSON.stringify(cartItems));

      unmount();
    });

    it('ensures OrderConfirmationCartCleaner purges vip_cart when isDirectOrder=false', () => {
      const cartItems = [
        { productId: 'prod-001', title: 'Suit', price: 48500, quantity: 1, selectedSize: '50' },
      ];
      localStorageMock.setItem('vip_cart', JSON.stringify(cartItems));

      const eventSpy = vi.fn();
      window.addEventListener('vip-cart-updated', eventSpy);

      // Render cleaner for standard order
      const { unmount } = render(<OrderConfirmationCartCleaner isDirectOrder={false} />);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('vip_cart');
      expect(eventSpy).toHaveBeenCalled();

      window.removeEventListener('vip-cart-updated', eventSpy);
      unmount();
    });
  });

  // =========================================================================
  // SUITE 5: ORDER PLACEMENT API ROUTE (POST /api/orders & GET /api/orders)
  // =========================================================================
  describe('5. Order Placement API Endpoint Adversarial Hardening', () => {
    const validRequestBody = {
      customer: {
        fullName: 'Abderrahmane Belhadj',
        phone: '0555123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Hydra',
        address: '15 Boulevard du 11 Décembre 1960',
        deliveryType: 'home',
      },
      items: [
        {
          productId: 'prod-suit-01',
          title: 'Costume Deux Pièces en Laine Italienne Super 130s',
          slug: 'costume-deux-pieces-laine-italienne',
          price: 48500,
          quantity: 1,
          selectedSize: '50',
          image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
        },
      ],
      deliveryFee: 0,
      subtotal: 48500,
      total: 48500,
    };

    it('creates an order via POST /api/orders and returns 201 Created with orderNumber and id', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequestBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.orderId).toBeDefined();
      expect(json.orderNumber).toMatch(/^VT-2026-\d{4}$/);
      expect(json.order.status).toBe('pending');
      expect(json.order.subtotal).toBe(48500);
      expect(json.order.deliveryFee).toBe(0); // Qualified for free shipping
      expect(json.order.total).toBe(48500);
    });

    it('retrieves created order via GET /api/orders?id=...', async () => {
      // 1. Create order
      const postReq = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRequestBody),
      });
      const postRes = await POST(postReq);
      const postJson = await postRes.json();
      const orderId = postJson.orderId;

      // 2. Fetch by ID
      const getReq = new NextRequest(`http://localhost:3000/api/orders?id=${orderId}`, {
        method: 'GET',
      });
      const getRes = await GET(getReq);
      expect(getRes.status).toBe(200);

      const getJson = await getRes.json();
      expect(getJson.success).toBe(true);
      expect(getJson.order.id).toBe(orderId);
      expect(getJson.order.customer.fullName).toBe('Abderrahmane Belhadj');
    });

    it('rejects POST /api/orders when product is OUT OF STOCK (quantity exceeds stock)', async () => {
      // prod-suit-01 has initial stock of 8 in seed catalog
      const excessiveQuantityBody = {
        ...validRequestBody,
        items: [
          {
            ...validRequestBody.items[0],
            quantity: 999, // Exceeds inventory
          },
        ],
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(excessiveQuantityBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(409);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('OUT_OF_STOCK');
      expect(json.error).toContain('Stock insuffisant');
    });

    it('rejects POST /api/orders with invalid phone number', async () => {
      const invalidPhoneBody = {
        ...validRequestBody,
        customer: {
          ...validRequestBody.customer,
          phone: '021123456', // Landline rejected
        },
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPhoneBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Numéro de téléphone algérien invalide');
    });

    it('rejects POST /api/orders with invalid wilaya code (0 or 59)', async () => {
      for (const badCode of [0, 59, 99]) {
        const badWilayaBody = {
          ...validRequestBody,
          customer: {
            ...validRequestBody.customer,
            wilayaCode: badCode,
          },
        };

        const req = new NextRequest('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(badWilayaBody),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);

        const json = await res.json();
        expect(json.success).toBe(false);
        expect(json.error).toContain('Veuillez sélectionner une wilaya parmi les 58 wilayas');
      }
    });

    it('rejects POST /api/orders with empty items array', async () => {
      const emptyItemsBody = {
        ...validRequestBody,
        items: [],
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyItemsBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Une commande doit contenir au moins un article');
    });

    it('probes freeShippingThreshold setting parity: reveals DEFAULT_STORE_SETTINGS is 50000 while UI uses 15000', async () => {
      const dataStore = getDataStore();
      const settings = await dataStore.getSettings();
      // EMPIRICAL DISCREPANCY: database seed has 50000 DA, whereas PROJECT.md and UI define 15000 DA
      expect(settings.freeShippingThreshold).toBe(50000);
      expect(DEFAULT_FREE_SHIPPING_THRESHOLD).toBe(15000);

      // When subtotal >= storeSettings.freeShippingThreshold (50,000 DA)
      const over50kBody = {
        ...validRequestBody,
        items: [
          {
            ...validRequestBody.items[0],
            quantity: 2, // 48,500 * 2 = 97,000 DA >= 50,000 DA
          },
        ],
        deliveryFee: 900,
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(over50kBody),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.order.deliveryFee).toBe(0); // Successfully waived when >= 50000 DA
    });

    it('probes adversarial cumulative multi-line stock exhaustion', async () => {
      // prod-suit-01 has 14 items in stock initially
      // Client sends 2 separate lines of the same product with qty 8 each (total 16 > 14)
      const cumulativeExhaustionBody = {
        ...validRequestBody,
        items: [
          {
            ...validRequestBody.items[0],
            selectedSize: '50',
            quantity: 8,
          },
          {
            ...validRequestBody.items[0],
            selectedSize: '52',
            quantity: 8,
          },
        ],
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cumulativeExhaustionBody),
      });

      const res = await POST(req);
      const json = await res.json();

      // EMPIRICAL FINDING: The API checks line items in isolation without aggregating per productId.
      // Line 1 (qty 8 <= 14) passes, Line 2 (qty 8 <= 14) passes. Order is created (201) and stock drops to 0.
      expect(res.status).toBe(201);
      expect(json.success).toBe(true);

      const suitInDb = await getDataStore().getProductById('prod-suit-01');
      expect(suitInDb?.stockQuantity).toBe(0); // 14 - 8 - 8 clamped to 0
    });

    it('probes client-side price tampering vulnerability on POST /api/orders', async () => {
      // Client tampers product price from 48,500 DA to 10 DA
      const tamperedPriceBody = {
        ...validRequestBody,
        items: [
          {
            ...validRequestBody.items[0],
            price: 10, // Tampered price
          },
        ],
        subtotal: 10,
        total: 10,
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tamperedPriceBody),
      });

      const res = await POST(req);
      const json = await res.json();

      // EMPIRICAL FINDING: Server trusts client-supplied item.price instead of enforcing catalog price.
      expect(res.status).toBe(201);
      expect(json.order.subtotal).toBe(10);
      expect(json.order.total).toBe(10);
    });

    it('probes client-side delivery fee tampering on orders below threshold', async () => {
      // Tie product: 8,500 DA (well below 15,000 DA threshold)
      // Destination: Wilaya 1 (Adrar), which costs 900 DA
      // Malicious client specifies deliveryFee = 0
      const tamperedDeliveryFeeBody = {
        customer: {
          fullName: 'Brahim Boudebouz',
          phone: '0550112233',
          wilaya: 'Adrar',
          wilayaCode: 1,
          commune: 'Adrar Centre',
          address: 'Rue de la Paix',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-cravate-soie-jacquard',
            title: 'Cravate Soie Jacquard Bleu Impérial & Or',
            slug: 'cravate-soie-jacquard-bleu-imperial-or',
            price: 8500,
            quantity: 1,
            selectedSize: 'Unique',
            image: 'https://images.unsplash.com/test',
          },
        ],
        deliveryFee: 0, // Tampered: should be 900 DA
        subtotal: 8500,
        total: 8500,
      };

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tamperedDeliveryFeeBody),
      });

      const res = await POST(req);
      const json = await res.json();

      // EMPIRICAL FINDING: Server accepts client-supplied deliveryFee without validating with calculateDeliveryFee
      expect(res.status).toBe(201);
      expect(json.order.deliveryFee).toBe(0); // Accepted 0 DA instead of charging 900 DA for Adrar
      expect(json.order.total).toBe(8500);
    });

    it('returns 404 on GET /api/orders with unknown order reference', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders?id=non-existent-id-999', {
        method: 'GET',
      });
      const res = await GET(req);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('Commande introuvable');
    });
  });

  // =========================================================================
  // SUITE 6: WILAYA SELECTOR COMPONENT RENDERING & USER INTERACTION
  // =========================================================================
  describe('6. WilayaSelector Component Rendering & Interaction', () => {
    it('renders WilayaSelector, opens dropdown, and triggers onSelectWilaya', () => {
      const handleSelect = vi.fn();
      const handleChangeType = vi.fn();

      render(
        <WilayaSelector
          selectedWilayaCode={null}
          deliveryType="home"
          cartSubtotal={10000}
          onSelectWilaya={handleSelect}
          onChangeDeliveryType={handleChangeType}
        />
      );

      // Verify initial trigger button
      const trigger = screen.getByRole('button', { name: /sélectionnez votre wilaya/i });
      expect(trigger).toBeInTheDocument();

      // Open dropdown
      fireEvent.click(trigger);

      // Search input should appear
      const searchInput = screen.getByPlaceholderText(/tapez le code/i);
      expect(searchInput).toBeInTheDocument();

      // Search for Alger
      fireEvent.change(searchInput, { target: { value: 'Alger' } });

      // Click Alger option
      const algerOption = screen.getByText('Alger');
      expect(algerOption).toBeInTheDocument();
      fireEvent.click(algerOption);

      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 16,
          name: 'Alger',
        })
      );
    });

    it('displays free delivery badge when cartSubtotal >= freeShippingThreshold', () => {
      const handleSelect = vi.fn();
      const handleChangeType = vi.fn();

      render(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={16000} // Above 15,000 threshold
          onSelectWilaya={handleSelect}
          onChangeDeliveryType={handleChangeType}
        />
      );

      // Should display Gratuit badge
      const freeBadges = screen.getAllByText(/gratuit/i);
      expect(freeBadges.length).toBeGreaterThan(0);
    });
  });
});
