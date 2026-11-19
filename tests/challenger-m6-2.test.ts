/**
 * VIP TADJ — Challenger M6-2 Adversarial Empirical Test Suite
 * Independent empirical challenge testing:
 * - Order State Machine Terminal Lockdown & Illegal Transitions
 * - Cancellation Note Validation & Code Normalization
 * - Cancellation Stock Restoration Idempotency Under Re-execution
 * - 58 Wilayas Partial Deep-Merge Configuration Integrity
 * - WhatsApp URI Encoding & RFC-Compliant Algerian Tel Dialers
 * - Media Pipeline XSS/Script Injection Blocking & SVG Fallback
 * - Admin Auth Guard Sliding TTL & Role-Based Access Control
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { PATCH as statusPatch } from '@/app/api/orders/[id]/status/route';
import { PUT as settingsPut, GET as settingsGet } from '@/app/api/settings/route';
import {
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
  assertValidTransition,
  normalizeCancellationReason,
  VALID_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
} from '@/lib/utils/orderStateMachine';
import {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  normalizePhoneForWhatsApp,
} from '@/lib/utils/phoneUtils';
import { generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';
import {
  normalizeImageUrl,
  getLuxuryPlaceholderSvg,
} from '@/lib/media/url-normalizer';
import {
  saveStoredSession,
  getStoredSession,
  clearStoredSession,
  checkAdminAccess,
  SESSION_TTL_MS,
  PRIMARY_STORAGE_KEY,
  StoredAdminSession,
} from '@/lib/context/auth-context';
import { Order, OrderStatus } from '@/types';

describe('CHALLENGER M6-2: Adversarial Empirical Verification Suite', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const store = getDataStore();
    await store.seedCatalog(true);
  });

  // =========================================================================
  // 1. Order State Machine Terminal Status Lockdown & Illegal Transitions
  // =========================================================================
  describe('1. State Machine Terminal Lockdown & Transition Guards', () => {
    it('1.1 delivered is strictly terminal and rejects transitions to ALL valid statuses with 422 TERMINAL_STATE', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Challenger Client', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'confirmed');
      await store.updateOrderStatus(order.id, 'shipped');
      await store.updateOrderStatus(order.id, 'delivered');

      expect(isTerminalStatus('delivered')).toBe(true);
      expect(getAllowedTransitions('delivered')).toEqual([]);

      for (const target of VALID_ORDER_STATUSES) {
        expect(canTransition('delivered', target)).toBe(false);
        expect(() => assertValidTransition('delivered', target)).toThrow(/terminal/i);

        const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: target, note: 'Tentative de transition depuis terminal' }),
        });
        const res = await statusPatch(req, { params: { id: order.id } });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.code).toBe('TERMINAL_STATE');
      }
    });

    it('1.2 cancelled is strictly terminal and rejects transitions to ALL valid statuses with 422 TERMINAL_STATE', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Challenger Client 2', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'cancelled', 'Client indisponible');

      expect(isTerminalStatus('cancelled')).toBe(true);
      expect(getAllowedTransitions('cancelled')).toEqual([]);

      for (const target of VALID_ORDER_STATUSES) {
        expect(canTransition('cancelled', target)).toBe(false);
        expect(() => assertValidTransition('cancelled', target)).toThrow(/terminal/i);

        const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: target, note: 'Tentative de réouverture' }),
        });
        const res = await statusPatch(req, { params: { id: order.id } });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.code).toBe('TERMINAL_STATE');
      }
    });

    it('1.3 illegal forward jump (pending -> delivered, pending -> shipped) rejected with 422 INVALID_STATE_TRANSITION', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Challenger Client 3', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      // Jump 1: pending -> delivered
      const reqDelivered = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });
      const resDelivered = await statusPatch(reqDelivered, { params: { id: order.id } });
      expect(resDelivered.status).toBe(422);
      const dataDelivered = await resDelivered.json();
      expect(dataDelivered.code).toBe('INVALID_STATE_TRANSITION');

      // Jump 2: pending -> shipped
      const reqShipped = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      const resShipped = await statusPatch(reqShipped, { params: { id: order.id } });
      expect(resShipped.status).toBe(422);
      const dataShipped = await resShipped.json();
      expect(dataShipped.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('1.4 illegal backward move (shipped -> confirmed, shipped -> pending, confirmed -> pending) rejected with 422 INVALID_STATE_TRANSITION', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Challenger Client 4', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'confirmed');

      // Backward 1: confirmed -> pending
      const reqConfirmedToPending = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
      const resConfirmedToPending = await statusPatch(reqConfirmedToPending, { params: { id: order.id } });
      expect(resConfirmedToPending.status).toBe(422);
      expect((await resConfirmedToPending.json()).code).toBe('INVALID_STATE_TRANSITION');

      await store.updateOrderStatus(order.id, 'shipped');

      // Backward 2: shipped -> confirmed
      const reqShippedToConfirmed = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      const resShippedToConfirmed = await statusPatch(reqShippedToConfirmed, { params: { id: order.id } });
      expect(resShippedToConfirmed.status).toBe(422);
      expect((await resShippedToConfirmed.json()).code).toBe('INVALID_STATE_TRANSITION');

      // Backward 3: shipped -> pending
      const reqShippedToPending = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
      const resShippedToPending = await statusPatch(reqShippedToPending, { params: { id: order.id } });
      expect(resShippedToPending.status).toBe(422);
      expect((await resShippedToPending.json()).code).toBe('INVALID_STATE_TRANSITION');
    });
  });

  // =========================================================================
  // 2. Cancellation Note Validation & Normalization
  // =========================================================================
  describe('2. Cancellation Note Validation & Reason Normalization', () => {
    it('2.1 cancellation without note or reason fails schema validation with HTTP 400', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Challenger Client 5', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      // No note, no reason
      const req1 = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const res1 = await statusPatch(req1, { params: { id: order.id } });
      expect(res1.status).toBe(400);

      // Whitespace-only note
      const req2 = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: '     ' }),
      });
      const res2 = await statusPatch(req2, { params: { id: order.id } });
      expect(res2.status).toBe(400);

      // Note exceeding 1000 characters
      const req3 = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: 'X'.repeat(1001) }),
      });
      const res3 = await statusPatch(req3, { params: { id: order.id } });
      expect(res3.status).toBe(400);
      const data3 = await res3.json();
      expect(data3.success).toBe(false);
    });

    it('2.2 cancellation reason normalizer maps legacy constants to canonical snake_case codes', () => {
      expect(normalizeCancellationReason('CUSTOMER_CANCELLED')).toBe('customer_cancelled');
      expect(normalizeCancellationReason('UNREACHABLE_AFTER_CALLS')).toBe('customer_unreachable');
      expect(normalizeCancellationReason('FAKE_ORDER')).toBe('invalid_phone');
      expect(normalizeCancellationReason('OUT_OF_STOCK')).toBe('out_of_stock');
      expect(normalizeCancellationReason('DELIVERY_REFUSED')).toBe('refused_delivery');
      expect(normalizeCancellationReason('DUPLICATE_ORDER')).toBe('duplicate_order');
      expect(normalizeCancellationReason('OTHER')).toBe('other');
      expect(normalizeCancellationReason('custom_user_reason')).toBe('custom_user_reason');
      expect(normalizeCancellationReason(undefined)).toBeUndefined();
    });
  });

  // =========================================================================
  // 3. Repeated Cancellation Stock Restoration Idempotency
  // =========================================================================
  describe('3. Stock Restoration Idempotency Under Multiple Cancellations', () => {
    it('3.1 cancelling order restores reserved stock exactly once without infinite stock inflation', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Chemise Sur Mesure Idempotence',
        slug: 'chemise-sur-mesure-idempotence',
        description: 'Chemise en popeline de coton égyptien.',
        price: 18500,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'chemises',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['40', '41'],
        stockQuantity: 10,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      // Place order for 3 items
      const order = await store.createOrder({
        customer: { fullName: 'Idempotency Tester', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: product.id, title: product.title, slug: product.slug, price: product.price, quantity: 3, selectedSize: '40', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      // Stock should now be 7
      const stockAfterOrder = (await store.getProductById(product.id))?.stockQuantity;
      expect(stockAfterOrder).toBe(7);

      // First cancellation via PATCH API route
      const cancelReq1 = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: 'Première annulation' }),
      });
      const cancelRes1 = await statusPatch(cancelReq1, { params: { id: order.id } });
      expect(cancelRes1.status).toBe(200);

      // Stock should now be restored to 10
      const stockAfterCancel1 = (await store.getProductById(product.id))?.stockQuantity;
      expect(stockAfterCancel1).toBe(10);

      // Second cancellation attempt via PATCH API route must fail with 422 TERMINAL_STATE
      const cancelReq2 = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled', note: 'Seconde tentative frauduleuse' }),
      });
      const cancelRes2 = await statusPatch(cancelReq2, { params: { id: order.id } });
      expect(cancelRes2.status).toBe(422);

      // Stock MUST remain exactly 10, not 13!
      const stockAfterCancel2 = (await store.getProductById(product.id))?.stockQuantity;
      expect(stockAfterCancel2).toBe(10);

      // Third cancellation attempt directly calling store.updateOrderStatus (bypassing route)
      await store.updateOrderStatus(order.id, 'cancelled', 'Direct store call bypass');

      // Stock MUST STILL remain exactly 10 because previousStatus was 'cancelled'
      const stockAfterDirectCall = (await store.getProductById(product.id))?.stockQuantity;
      expect(stockAfterDirectCall).toBe(10);
    });

    it('3.2 multi-product order cancellation restores all distinct item quantities without double counting', async () => {
      const store = getDataStore();
      const p1 = await store.createProduct({
        title: 'Costume M6-Multi 1',
        slug: 'costume-m6-multi-1',
        description: 'Test suit',
        price: 45000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'costumes',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['48'],
        stockQuantity: 15,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      const p2 = await store.createProduct({
        title: 'Mocassins M6-Multi 2',
        slug: 'mocassins-m6-multi-2',
        description: 'Test shoes',
        price: 25000,
        categoryId: 'shoes',
        categorySlug: 'chaussures',
        subcategory: 'mocassins',
        images: [{ id: 'img-2', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['42'],
        stockQuantity: 8,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      // Place composite order: 3 of p1, 2 of p2
      const order = await store.createOrder({
        customer: { fullName: 'Multi Tester', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [
          { productId: p1.id, title: p1.title, slug: p1.slug, price: p1.price, quantity: 3, selectedSize: '48', image: 'https://example.com/p1.jpg' },
          { productId: p2.id, title: p2.title, slug: p2.slug, price: p2.price, quantity: 2, selectedSize: '42', image: 'https://example.com/p2.jpg' },
        ],
        deliveryFee: 400,
      });

      expect((await store.getProductById(p1.id))?.stockQuantity).toBe(12);
      expect((await store.getProductById(p2.id))?.stockQuantity).toBe(6);

      // Cancel order
      await store.updateOrderStatus(order.id, 'cancelled', 'Annulation multi-articles');

      expect((await store.getProductById(p1.id))?.stockQuantity).toBe(15);
      expect((await store.getProductById(p2.id))?.stockQuantity).toBe(8);

      // Repeated updateOrderStatus call to cancelled
      await store.updateOrderStatus(order.id, 'cancelled', 'Deuxième tentative');

      // Quantities must remain strictly unchanged
      expect((await store.getProductById(p1.id))?.stockQuantity).toBe(15);
      expect((await store.getProductById(p2.id))?.stockQuantity).toBe(8);
    });
  });

  // =========================================================================
  // 4. 68 Wilaya Partial Settings PUT Updates (Deep Merge)
  // =========================================================================
  describe('4. 68 Wilayas Partial Deep-Merge Configuration Integrity', () => {
    it('4.1 partial PUT /api/settings updates only specified wilayas and preserves other 67 intact', async () => {
      const store = getDataStore();
      const initialSettings = await store.getSettings();
      expect(Object.keys(initialSettings.wilayaShippingFees).length).toBe(68);

      const adrarOriginalHomeFee = initialSettings.wilayaShippingFees[1].homeFee;
      const constantineOriginalHomeFee = initialSettings.wilayaShippingFees[25].homeFee;
      const inGuezzamOriginalHomeFee = initialSettings.wilayaShippingFees[58].homeFee;
      const bouSaadaOriginalHomeFee = initialSettings.wilayaShippingFees[68].homeFee;

      // Update Wilaya 16 (Alger) and Wilaya 31 (Oran) only
      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayaShippingFees: {
            16: { homeFee: 450, deskFee: 220, active: true },
            31: { homeFee: 580, deskFee: 310, active: false },
          },
        }),
      });

      const res = await settingsPut(req);
      expect(res.status).toBe(200);

      const refreshed = await store.getSettings();
      // Total count of wilayas MUST still be 68
      expect(Object.keys(refreshed.wilayaShippingFees).length).toBe(68);

      // Targeted wilayas updated
      expect(refreshed.wilayaShippingFees[16].homeFee).toBe(450);
      expect(refreshed.wilayaShippingFees[16].deskFee).toBe(220);
      expect(refreshed.wilayaShippingFees[31].homeFee).toBe(580);
      expect(refreshed.wilayaShippingFees[31].deskFee).toBe(310);
      expect(refreshed.wilayaShippingFees[31].active).toBe(false);

      // Untouched wilayas preserved perfectly
      expect(refreshed.wilayaShippingFees[1].homeFee).toBe(adrarOriginalHomeFee);
      expect(refreshed.wilayaShippingFees[25].homeFee).toBe(constantineOriginalHomeFee);
      expect(refreshed.wilayaShippingFees[58].homeFee).toBe(inGuezzamOriginalHomeFee);
      expect(refreshed.wilayaShippingFees[68].homeFee).toBe(bouSaadaOriginalHomeFee);
    });

    it('4.2 invalid settings payload with negative shipping fee or threshold is rejected with HTTP 400', async () => {
      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingThreshold: -5000,
          wilayaShippingFees: {
            16: { homeFee: -400, deskFee: -200, active: true },
          },
        }),
      });

      const res = await settingsPut(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.errors).toBeDefined();
    });
  });

  // =========================================================================
  // 5. WhatsApp & Algerian Phone Communication Engine
  // =========================================================================
  describe('5. WhatsApp Link URI Encoding & RFC Tel Link Generator', () => {
    it('5.1 formatTelLink produces RFC-compliant tel:+213... for all Algerian operator formats', () => {
      expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('06 61 23 45 67')).toBe('tel:+213661234567');
      expect(formatTelLink('07-70-33-44-55')).toBe('tel:+213770334455');
      expect(formatTelLink('+213 550 12 34 56')).toBe('tel:+213550123456');
      expect(formatTelLink('00213 661 23 45 67')).toBe('tel:+213661234567');
      expect(formatTelLink('770334455')).toBe('tel:+213770334455');
      expect(formatTelLink('')).toBe('tel:');
      expect(formatTelLink(null)).toBe('tel:');
    });

    it('5.2 generateWhatsAppConfirmLink encodes bilingual Arabic and French text with special characters', () => {
      const order: Order = {
        id: 'ord-m6-concierge',
        orderNumber: 'VIP-2026-CHALLENGER',
        customer: {
          fullName: 'Mohamed & Karim "L\'Élégant"',
          phone: '0550123456',
          wilaya: 'Oran',
          wilayaCode: 31,
          commune: 'Es Senia',
          address: 'Villa 12, Rue des Palmiers',
          notes: 'Attention: sonner chez M. Benali & appeler au 0550123456',
        },
        items: [
          {
            productId: 'prod-001',
            title: 'Costume Croisé "Super 150s" & Boutons Dorés',
            slug: 'costume-croise-super-150s',
            price: 52000,
            quantity: 1,
            selectedSize: '52',
            image: 'https://example.com/suit.jpg',
          },
        ],
        subtotal: 52000,
        deliveryFee: 600,
        total: 52600,
        status: 'pending',
        paymentMethod: 'cod',
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const waLink = generateWhatsAppConfirmLink(order);
      expect(waLink.startsWith('https://wa.me/213550123456?text=')).toBe(true);

      const queryText = waLink.substring('https://wa.me/213550123456?text='.length);
      // Valid URI encoding checks
      expect(queryText).not.toContain(' ');
      expect(queryText).not.toContain('\n');
      expect(queryText).toContain('%20');
      expect(queryText).toContain('%0A');

      const decoded = decodeURIComponent(queryText);
      expect(decoded).toContain('Mohamed & Karim "L\'Élégant"');
      expect(decoded).toContain('تأكيد الطلبية');
      expect(decoded).toContain('VIP-2026-CHALLENGER');
      expect(decoded).toContain('52\u00A0600\u00A0DA');
    });
  });

  // =========================================================================
  // 6. Media Pipeline XSS Blocking & SVG Fallback
  // =========================================================================
  describe('6. Media Pipeline XSS Sanitization & Fallback Safeguards', () => {
    it('6.1 normalizeImageUrl intercepts dangerous script injection protocols and falls back to luxury SVG', () => {
      const maliciousPayloads = [
        'javascript:alert("XSS")',
        'JAVASCRIPT:alert(document.domain)',
        'vbscript:msgbox("malicious")',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        '//malicious-cdn.com/exploit.png',
        'ftp://evil.com/hack.jpg',
        'file:///etc/passwd',
      ];

      for (const payload of maliciousPayloads) {
        const result = normalizeImageUrl(payload);
        expect(result.startsWith('data:image/svg+xml')).toBe(true);
      }
    });

    it('6.2 getLuxuryPlaceholderSvg safely escapes XML entities in dynamic category labels', () => {
      const hostileCategory = 'Suits <script>alert("hack")</script> & Tuxedos';
      const svgDataUri = getLuxuryPlaceholderSvg(hostileCategory);
      const decodedSvg = decodeURIComponent(svgDataUri.replace('data:image/svg+xml;utf8,', ''));

      expect(decodedSvg).not.toContain('<script>');
      expect(decodedSvg).toContain('&lt;SCRIPT&gt;');
      expect(decodedSvg).toContain('&quot;HACK&quot;');
      expect(decodedSvg).toContain('&amp;');
    });
  });

  // =========================================================================
  // 7. Admin Session TTL Sliding Window & Role-Based Access Denial
  // =========================================================================
  describe('7. Admin Auth Guard Sliding TTL & Role-Based Access Control', () => {
    const baseAdminSession: StoredAdminSession = {
      isAuthenticated: true,
      token: 'jwt-m6-challenge-token',
      email: 'directeur@viptadj.dz',
      role: 'admin',
      user: {
        id: 'admin-002',
        email: 'directeur@viptadj.dz',
        displayName: 'Directeur Général',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      expiresAt: Date.now() + SESSION_TTL_MS,
      lastActive: Date.now(),
    };

    it('7.1 expired session triggers automatic session invalidation and storage purge', () => {
      const expiredSession: StoredAdminSession = {
        ...baseAdminSession,
        expiresAt: Date.now() - 500, // Expired 500ms ago
      };

      saveStoredSession(expiredSession);
      const session = getStoredSession();
      expect(session).toBeNull();
      expect(localStorage.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
    });

    it('7.2 non-admin roles (customer, viewer, anonymous) are blocked from /admin routes', () => {
      // 1. Customer role
      saveStoredSession({
        ...baseAdminSession,
        role: 'customer' as any,
        user: { ...baseAdminSession.user, role: 'customer' as any },
      });
      const customerCheck = checkAdminAccess('/admin/orders');
      expect(customerCheck.allowed).toBe(false);
      expect(customerCheck.redirectUrl).toBe('/admin/login');

      // 2. Anonymous / empty session
      clearStoredSession();
      const anonymousCheck = checkAdminAccess('/admin/settings');
      expect(anonymousCheck.allowed).toBe(false);
      expect(anonymousCheck.redirectUrl).toBe('/admin/login');

      // 3. Admin role
      saveStoredSession(baseAdminSession);
      const adminCheck = checkAdminAccess('/admin/orders');
      expect(adminCheck.allowed).toBe(true);
    });
  });
});
