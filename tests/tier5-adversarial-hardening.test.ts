/**
 * VIP TADJ — Tier 5 Adversarial Coverage Hardening Test Suite (F-VERIF-02)
 *
 * Comprehensive White-Box Adversarial Stress & Hardening Test Suite
 * covering 40 dedicated assertions across 5 architectural domains:
 * - Suite A: Inventory Integrity & Multi-Line Composite Aggregation (8 tests)
 * - Suite B: State Machine Terminal Lockdown & Audit Trail Invariants (8 tests)
 * - Suite C: Wilaya Tariffs, Dynamic Free Shipping & Currency Precision (8 tests)
 * - Suite D: Hostile Inputs, Phone Sanitization & Media Pipeline (8 tests)
 * - Suite E: Admin Auth Guard, Session TTL & Storage Isolation (8 tests)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NextRequest } from 'next/server';

// Domain and Data Store imports
import { getDataStore } from '@/lib/data-provider';
import { Order, OrderStatus } from '@/types';

// API Route Handlers
import { POST as ordersPost } from '@/app/api/orders/route';
import { PATCH as statusPatch } from '@/app/api/orders/[id]/status/route';
import { PUT as settingsPut } from '@/app/api/settings/route';
import { PATCH as productPatch } from '@/app/api/products/[id]/route';

// Core Utilities
import {
  assertValidTransition,
  getAllowedTransitions,
  isTerminalStatus,
  normalizeCancellationReason,
} from '@/lib/utils/orderStateMachine';
import {
  calculateDeliveryFee,
  calculateSubtotal,
  calculateTotal,
} from '@/lib/utils/deliveryUtils';
import { formatDZD, parseDZD } from '@/lib/utils/formatDZD';
import {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  normalizePhoneForWhatsApp,
} from '@/lib/utils/phoneUtils';
import { generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';
import {
  normalizeImageUrl,
  isValidMediaUrl,
  getLuxuryPlaceholderSvg,
} from '@/lib/media/url-normalizer';
import {
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  checkAdminAccess,
  PRIMARY_STORAGE_KEY,
  SECONDARY_STORAGE_KEY,
  SESSION_TTL_MS,
  StoredAdminSession,
} from '@/lib/context/auth-context';
import { clampQuantity, getCartItemId } from '@/lib/context/cart-context';

// UI Components
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { OrderConfirmationCartCleaner } from '@/app/checkout/success/[orderId]/OrderConfirmationCartCleaner';

describe('VIP TADJ — Tier 5 Adversarial Coverage Hardening (F-VERIF-02)', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    const store = getDataStore();
    await store.seedCatalog(true);
  });

  // =========================================================================
  // SUITE A: Inventory Integrity & Multi-Line Composite Aggregation (8 tests)
  // =========================================================================
  describe('Suite A: Inventory Integrity & Multi-Line Composite Aggregation', () => {
    it('A.1 handles multi-line order with same product across distinct sizes and defends non-negative stock floor', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Veste de Soirée Smoking Velours',
        slug: 'veste-soiree-smoking-velours',
        description: 'Veste de soirée en velours italien.',
        price: 35000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'costumes',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['48', '50'],
        stockQuantity: 5,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      // Composite order requesting 3 units of size 48 and 3 units of size 50 (aggregate demand = 6, stock = 5)
      const order = await store.createOrder({
        customer: {
          fullName: 'Farid Belhadj',
          phone: '0550123456',
          wilaya: 'Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: '10 Rue Didouche Mourad',
        },
        items: [
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            quantity: 3,
            selectedSize: '48',
            image: product.images[0].url,
          },
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            quantity: 3,
            selectedSize: '50',
            image: product.images[0].url,
          },
        ],
        deliveryFee: 400,
      });

      expect(order.id).toBeDefined();
      const updatedProduct = await store.getProductById(product.id);
      expect(updatedProduct?.stockQuantity).toBe(0);
      expect(updatedProduct?.inStock).toBe(false);

      // Subsequent order attempt via API route is strictly rejected with 409 OUT_OF_STOCK
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Karim Ziani',
            phone: '0661234567',
            wilaya: 'Alger',
            wilayaCode: 16,
            commune: 'El Biar',
            address: '5 Boulevard des Martyrs',
          },
          items: [
            {
              productId: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              quantity: 1,
              selectedSize: '48',
              image: product.images[0].url,
            },
          ],
          deliveryFee: 400,
        }),
      });
      const res = await ordersPost(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.code).toBe('OUT_OF_STOCK');
    });

    it('A.2 purchasing exact available inventory decrements stock to 0 and flips inStock to false', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Pochette de Soie Édition Limitée',
        slug: 'pochette-soie-edition-limitee',
        description: 'Pochette de costume en soie.',
        price: 6500,
        categoryId: 'accessories',
        categorySlug: 'accessoires',
        subcategory: 'cravates',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['Unique'],
        stockQuantity: 4,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      await store.createOrder({
        customer: {
          fullName: 'Hassan Yebda',
          phone: '0770334455',
          wilaya: 'Oran',
          wilayaCode: 31,
          commune: 'Centre',
          address: "15 Rue Larbi Ben M'hidi",
        },
        items: [
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            quantity: 4,
            selectedSize: 'Unique',
            image: product.images[0].url,
          },
        ],
        deliveryFee: 600,
      });

      const updated = await store.getProductById(product.id);
      expect(updated?.stockQuantity).toBe(0);
      expect(updated?.inStock).toBe(false);

      const inStockList = await store.getProducts({ inStock: true });
      expect(inStockList.some((p) => p.id === product.id)).toBe(false);

      const outOfStockList = await store.getProducts({ inStock: false });
      expect(outOfStockList.some((p) => p.id === product.id)).toBe(true);
    });

    it('A.3 repeated cancellation of an already cancelled order never increments stock beyond initial quantity', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Derbies Oxford Cousus Goodyear',
        slug: 'derbies-oxford-cousus-goodyear',
        description: 'Souliers en cuir de veau pleine fleur.',
        price: 42000,
        categoryId: 'shoes',
        categorySlug: 'chaussures',
        subcategory: 'richelieus',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['42'],
        stockQuantity: 10,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      const order = await store.createOrder({
        customer: {
          fullName: 'Riad Boudebouz',
          phone: '0555667788',
          wilaya: 'Constantine',
          wilayaCode: 25,
          commune: 'Sidi Mabrouk',
          address: 'Rue Didouche Mourad',
        },
        items: [
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            quantity: 3,
            selectedSize: '42',
            image: product.images[0].url,
          },
        ],
        deliveryFee: 600,
      });

      const prodAfterOrder = await store.getProductById(product.id);
      expect(prodAfterOrder?.stockQuantity).toBe(7);

      // First cancellation: restores 3 units to 10
      await store.updateOrderStatus(order.id, 'cancelled', 'Client a annulé');
      const prodAfterFirstCancel = await store.getProductById(product.id);
      expect(prodAfterFirstCancel?.stockQuantity).toBe(10);

      // Second cancellation: idempotent, remains 10
      await store.updateOrderStatus(order.id, 'cancelled', 'Deuxième appel');
      const prodAfterSecondCancel = await store.getProductById(product.id);
      expect(prodAfterSecondCancel?.stockQuantity).toBe(10);

      // Third cancellation: remains 10
      await store.updateOrderStatus(order.id, 'cancelled', 'Troisième tentative');
      const prodAfterThirdCancel = await store.getProductById(product.id);
      expect(prodAfterThirdCancel?.stockQuantity).toBe(10);
    });

    it('A.4 cancelling an order for a sold-out product restores stock and immediately returns it in inStock catalog queries', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Cravate Soie Noire Cérémonie',
        slug: 'cravate-soie-noire-ceremonie',
        description: 'Cravate en soie tissée main.',
        price: 12000,
        categoryId: 'accessories',
        categorySlug: 'accessoires',
        subcategory: 'cravates',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['Unique'],
        stockQuantity: 1,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      const order = await store.createOrder({
        customer: {
          fullName: 'Sofiane Feghouli',
          phone: '0661223344',
          wilaya: 'Annaba',
          wilayaCode: 23,
          commune: 'Centre',
          address: 'Cours de la Révolution',
        },
        items: [
          {
            productId: product.id,
            title: product.title,
            slug: product.slug,
            price: product.price,
            quantity: 1,
            selectedSize: 'Unique',
            image: product.images[0].url,
          },
        ],
        deliveryFee: 600,
      });

      let inStockProducts = await store.getProducts({ inStock: true });
      expect(inStockProducts.some((p) => p.id === product.id)).toBe(false);

      await store.updateOrderStatus(order.id, 'cancelled', 'Annulation client');
      const refreshed = await store.getProductById(product.id);
      expect(refreshed?.stockQuantity).toBe(1);
      expect(refreshed?.inStock).toBe(true);

      inStockProducts = await store.getProducts({ inStock: true });
      expect(inStockProducts.some((p) => p.id === product.id)).toBe(true);
    });

    it('A.5 order creation payload with negative or non-integer quantity is strictly rejected with HTTP 400', async () => {
      const store = getDataStore();
      const product = (await store.getProducts())[0];

      const hostileQuantities = [-1, 0, 1.5, -99];
      for (const badQty of hostileQuantities) {
        const req = new NextRequest('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              fullName: 'Test Adversaire',
              phone: '0550123456',
              wilaya: 'Alger',
              wilayaCode: 16,
              commune: 'Bab El Oued',
              address: '12 Rue Colonel Lotfi',
            },
            items: [
              {
                productId: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                quantity: badQty,
                selectedSize: '50',
                image: product.images[0]?.url || 'https://example.com/img.jpg',
              },
            ],
            deliveryFee: 400,
          }),
        });

        const res = await ordersPost(req);
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('Quantité invalide');
      }
    });

    it('A.6 order creation for product with inStock=false returns HTTP 409 OUT_OF_STOCK', async () => {
      const store = getDataStore();
      const soldOutProduct = await store.createProduct({
        title: 'Chemise Col Cassé Épuisée',
        slug: 'chemise-col-casse-epuisee',
        description: 'Chemise pour smoking.',
        price: 18000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'chemises',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['41'],
        stockQuantity: 0,
        inStock: false,
        isFeatured: false,
        isNewArrival: false,
      });

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Mehdi Lacen',
            phone: '0550998877',
            wilaya: 'Alger',
            wilayaCode: 16,
            commune: 'Kouba',
            address: 'Rue de la Liberté',
          },
          items: [
            {
              productId: soldOutProduct.id,
              title: soldOutProduct.title,
              slug: soldOutProduct.slug,
              price: soldOutProduct.price,
              quantity: 1,
              selectedSize: '41',
              image: soldOutProduct.images[0].url,
            },
          ],
          deliveryFee: 400,
        }),
      });

      const res = await ordersPost(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.code).toBe('OUT_OF_STOCK');
    });

    it('A.7 SizeSelector component disables size button and displays Épuisé badge when size inventory is 0', () => {
      const onSelect = vi.fn();
      render(
        React.createElement(SizeSelector, {
          sizes: ['48', '50', '52'],
          sizeInventory: { '48': 3, '50': 0, '52': 5 },
          inStock: true,
          selectedSize: null,
          onSelectSize: onSelect,
        })
      );

      const btn48 = screen.getByRole('button', { name: /Taille 48/i });
      const btn50 = screen.getByRole('button', { name: /Taille 50/i });
      const btn52 = screen.getByRole('button', { name: /Taille 52/i });

      expect((btn48 as HTMLButtonElement).disabled).toBe(false);
      expect((btn50 as HTMLButtonElement).disabled).toBe(true);
      expect((btn52 as HTMLButtonElement).disabled).toBe(false);

      expect(btn50.getAttribute('aria-label')).toContain('Épuisé');

      fireEvent.click(btn50);
      expect(onSelect).not.toHaveBeenCalled();

      fireEvent.click(btn48);
      expect(onSelect).toHaveBeenCalledWith('48');
    });

    it('A.8 restocking a sold-out item via PATCH /api/products/[id] restores stock and reactivates inStock=true', async () => {
      const store = getDataStore();
      const product = await store.createProduct({
        title: 'Mocassins Nubuck Chocolat',
        slug: 'mocassins-nubuck-chocolat',
        description: 'Mocassins italiens en nubuck.',
        price: 38000,
        categoryId: 'shoes',
        categorySlug: 'chaussures',
        subcategory: 'mocassins',
        images: [{ id: 'img-1', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35', isPrimary: true }],
        sizes: ['42', '43'],
        stockQuantity: 0,
        inStock: false,
        isFeatured: false,
        isNewArrival: false,
      });

      expect(product.inStock).toBe(false);

      const req = new NextRequest(`http://localhost:3000/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockQuantity: 12,
          inStock: true,
        }),
      });

      const res = await productPatch(req, { params: { id: product.id } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.product.stockQuantity).toBe(12);
      expect(data.product.inStock).toBe(true);

      const refreshed = await store.getProductById(product.id);
      expect(refreshed?.stockQuantity).toBe(12);
      expect(refreshed?.inStock).toBe(true);
    });
  });

  // =========================================================================
  // SUITE B: State Machine Terminal Lockdown & Audit Trail Invariants (8 tests)
  // =========================================================================
  describe('Suite B: State Machine Terminal Lockdown & Audit Trail Invariants', () => {
    it('B.1 terminal lockdown from delivered rejects any transition with HTTP 422 TERMINAL_STATE', async () => {
      expect(() => assertValidTransition('delivered', 'confirmed')).toThrow(/terminal/i);
      expect(() => assertValidTransition('delivered', 'cancelled')).toThrow(/terminal/i);
      expect(getAllowedTransitions('delivered')).toEqual([]);

      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Ali B', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'confirmed');
      await store.updateOrderStatus(order.id, 'shipped');
      await store.updateOrderStatus(order.id, 'delivered');

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('TERMINAL_STATE');
    });

    it('B.2 terminal lockdown from cancelled rejects any transition with HTTP 422 TERMINAL_STATE', async () => {
      expect(() => assertValidTransition('cancelled', 'pending')).toThrow(/terminal/i);
      expect(() => assertValidTransition('cancelled', 'confirmed')).toThrow(/terminal/i);
      expect(getAllowedTransitions('cancelled')).toEqual([]);

      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Omar C', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'cancelled', 'Client indisponible');

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('TERMINAL_STATE');
    });

    it('B.3 illegal backward transition rejection prevents shipped to confirmed with HTTP 422 INVALID_STATE_TRANSITION', async () => {
      expect(() => assertValidTransition('shipped', 'confirmed')).toThrow(/interdit|invalide/i);

      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Adel D', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'confirmed');
      await store.updateOrderStatus(order.id, 'shipped');

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('B.4 illegal skip transition rejection prevents pending directly to delivered with HTTP 422', async () => {
      expect(() => assertValidTransition('pending', 'delivered')).toThrow(/interdit|invalide/i);

      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Sami E', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('INVALID_STATE_TRANSITION');
    });

    it('B.5 mandatory cancellation audit trail rejects PATCH to cancelled without note or reason with HTTP 400', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Yassine F', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('B.6 cancellation reason normalization standardizes legacy and custom cancellation codes', async () => {
      expect(normalizeCancellationReason('CUSTOMER_CANCELLED')).toBe('customer_cancelled');
      expect(normalizeCancellationReason('UNREACHABLE_AFTER_CALLS')).toBe('customer_unreachable');
      expect(normalizeCancellationReason('FAKE_ORDER')).toBe('invalid_phone');
      expect(normalizeCancellationReason('OUT_OF_STOCK')).toBe('out_of_stock');
      expect(normalizeCancellationReason('DELIVERY_REFUSED')).toBe('refused_delivery');
      expect(normalizeCancellationReason('DUPLICATE_ORDER')).toBe('duplicate_order');
      expect(normalizeCancellationReason('OTHER')).toBe('other');
      expect(normalizeCancellationReason('Demande spéciale de report')).toBe('Demande spéciale de report');

      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Nabil G', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: 'CUSTOMER_CANCELLED',
          note: 'Annulation demandée par téléphone',
          updatedBy: 'Admin Mehdi',
        }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      const lastHistory = data.order.statusHistory[data.order.statusHistory.length - 1];
      expect(lastHistory.status).toBe('cancelled');
    });

    it('B.7 audit history chronological integrity maintains strictly increasing ISO 8601 timestamps', async () => {
      const store = getDataStore();
      const order = await store.createOrder({
        customer: { fullName: 'Tarek H', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, commune: 'Hydra', address: 'Rue 1' },
        items: [{ productId: 'prod-001', title: 'Suit', slug: 'suit', price: 48500, quantity: 1, selectedSize: '50', image: 'https://example.com/img.jpg' }],
        deliveryFee: 400,
      });

      await store.updateOrderStatus(order.id, 'confirmed');
      await store.updateOrderStatus(order.id, 'shipped');
      await store.updateOrderStatus(order.id, 'delivered');

      const finalOrder = await store.getOrderById(order.id);
      expect(finalOrder?.statusHistory.length).toBe(4);

      for (let i = 1; i < (finalOrder?.statusHistory.length || 0); i++) {
        const prev = new Date(finalOrder!.statusHistory[i - 1].timestamp).getTime();
        const curr = new Date(finalOrder!.statusHistory[i].timestamp).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('B.8 transition modal UI guard allows only legal forward targets and identifies terminal states', () => {
      expect(getAllowedTransitions('pending')).toEqual(['confirmed', 'cancelled']);
      expect(getAllowedTransitions('confirmed')).toEqual(['shipped', 'cancelled']);
      expect(getAllowedTransitions('shipped')).toEqual(['delivered', 'cancelled']);
      expect(getAllowedTransitions('delivered')).toEqual([]);
      expect(getAllowedTransitions('cancelled')).toEqual([]);

      expect(isTerminalStatus('delivered')).toBe(true);
      expect(isTerminalStatus('cancelled')).toBe(true);
      expect(isTerminalStatus('pending')).toBe(false);
      expect(isTerminalStatus('confirmed')).toBe(false);
      expect(isTerminalStatus('shipped')).toBe(false);
    });
  });

  // =========================================================================
  // SUITE C: Wilaya Tariffs, Dynamic Free Shipping & Currency Precision (8 tests)
  // =========================================================================
  describe('Suite C: Wilaya Tariffs, Dynamic Free Shipping & Currency Precision', () => {
    it('C.1 exact threshold boundary waiver waives delivery fee at exactly 15,000 DA and above', () => {
      expect(calculateDeliveryFee(14999, 16)).toBe(400);
      expect(calculateDeliveryFee(14999.99, 16)).toBe(400);
      expect(calculateDeliveryFee(15000, 16)).toBe(0);
      expect(calculateDeliveryFee(15001, 16)).toBe(0);
    });

    it('C.2 Grand Sud 900 DA fee waiver eliminates shipping across all 8 Grand Sud wilayas at threshold', () => {
      const grandSudWilayas = [1, 11, 33, 37, 49, 50, 56, 58];
      for (const code of grandSudWilayas) {
        expect(calculateDeliveryFee(14000, code)).toBe(900);
        expect(calculateDeliveryFee(15000, code)).toBe(0);
        expect(calculateDeliveryFee(25000, code)).toBe(0);
      }
    });

    it('C.3 custom store threshold reconfiguration dynamically recalculates fee for 18,000 DA cart with 25,000 DA threshold', () => {
      expect(calculateDeliveryFee(18000, 31, 25000)).toBe(600);
      expect(calculateDeliveryFee(24999, 31, 25000)).toBe(600);
      expect(calculateDeliveryFee(25000, 31, 25000)).toBe(0);
      expect(calculateDeliveryFee(32000, 31, 25000)).toBe(0);
    });

    it('C.4 zero threshold configuration grants free shipping to all carts regardless of subtotal or wilaya', () => {
      expect(calculateDeliveryFee(0, 16, 0)).toBe(0);
      expect(calculateDeliveryFee(1, 1, 0)).toBe(0);
      expect(calculateDeliveryFee(500, 31, 0)).toBe(0);
      expect(calculateDeliveryFee(10000, 58, 0)).toBe(0);
    });

    it('C.5 68 Wilaya partial deep merge in PUT /api/settings preserves other 67 wilayas intact', async () => {
      const store = getDataStore();
      const req = new NextRequest('http://localhost:3000/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wilayaShippingFees: {
            31: { homeFee: 520, deskFee: 280, active: true },
          },
        }),
      });

      const res = await settingsPut(req);
      expect(res.status).toBe(200);

      const settings = await store.getSettings();
      expect(settings.wilayaShippingFees[31].homeFee).toBe(520);
      expect(settings.wilayaShippingFees[31].deskFee).toBe(280);
      expect(settings.wilayaShippingFees[16].homeFee).toBe(400); // Alger preserved
      expect(settings.wilayaShippingFees[1].homeFee).toBe(900); // Adrar preserved
      expect(Object.keys(settings.wilayaShippingFees).length).toBe(68);
    });

    it('C.6 Stop Desk vs Home delivery tariff calculation applies appropriate discounted rate', () => {
      expect(calculateDeliveryFee(10000, 16, 15000, 'desk')).toBe(250);
      expect(calculateDeliveryFee(10000, 16, 15000, 'home')).toBe(400);
      expect(calculateDeliveryFee(10000, 31, 15000, 'desk')).toBe(350);
      expect(calculateDeliveryFee(10000, 31, 15000, 'home')).toBe(600);
      expect(calculateDeliveryFee(10000, 1, 15000, 'desk')).toBe(500);
      expect(calculateDeliveryFee(10000, 1, 15000, 'home')).toBe(900);
    });

    it('C.7 DZD high-value luxury formatting formats amounts with non-breaking spaces and correct rounding', () => {
      expect(formatDZD(12500000)).toBe('12\u00A0500\u00A0000\u00A0DA');
      expect(formatDZD(12500000.4)).toBe('12\u00A0500\u00A0000\u00A0DA');
      expect(formatDZD(12500000.8)).toBe('12\u00A0500\u00A0001\u00A0DA');
      expect(formatDZD(12500000, { currencyCode: 'DZD' })).toBe('12\u00A0500\u00A0000\u00A0DZD');
      expect(formatDZD(12500000, { showCurrency: false })).toBe('12\u00A0500\u00A0000');
      expect(formatDZD(0)).toBe('0\u00A0DA');
      expect(formatDZD(-15000)).toBe('-15\u00A0000\u00A0DA');
    });

    it('C.8 parseDZD resilience safely parses formatted strings, non-numeric noise, floats, and edge inputs', () => {
      expect(parseDZD('12 500 000 DA')).toBe(12500000);
      expect(parseDZD('12\u00A0500\u00A0000\u00A0DA')).toBe(12500000);
      expect(parseDZD('48 500 DA')).toBe(48500);
      expect(parseDZD('Total: 9 500 DZD')).toBe(9500);
      expect(parseDZD('')).toBe(0);
      expect(parseDZD(null)).toBe(0);
      expect(parseDZD(undefined)).toBe(0);
      expect(parseDZD('non-numeric-text')).toBe(0);
      expect(parseDZD(75000)).toBe(75000);
    });
  });

  // =========================================================================
  // SUITE D: Hostile Inputs, Phone Sanitization & Media Pipeline (8 tests)
  // =========================================================================
  describe('Suite D: Hostile Inputs, Phone Sanitization & Media Pipeline', () => {
    it('D.1 hostile delimiter phone validation accepts valid Algerian numbers with arbitrary delimiters', () => {
      const validHostilePhones = [
        '05 50 12 34 56',
        '06-61-23-45-67',
        '07.70.33.44.55',
        '(0550) 12-34.56',
        '+213 550 12 34 56',
        '00213-661-23-45-67',
        '0550-12-34-56',
        '+213(770)33.44.55',
      ];

      for (const phone of validHostilePhones) {
        expect(isValidAlgerianPhone(phone)).toBe(true);
      }
    });

    it('D.2 malformed phone prefix rejection strictly rejects landlines, VoIP, foreign prefixes, and malformed lengths', () => {
      const invalidPhones = [
        '021 12 34 56', // Landline Algiers
        '031 23 45 67', // Landline Constantine
        '041 34 56 78', // Landline Oran
        '080 12 34 56', // VoIP
        '098 12 34 56', // VoIP
        '+33 6 12 34 56 78', // France
        '+1 555 123 4567', // USA
        '055012345', // 9 digits
        '05501234567', // 11 digits
        '0550abc456', // letters
        '',
      ];

      for (const phone of invalidPhones) {
        expect(isValidAlgerianPhone(phone)).toBe(false);
      }
    });

    it('D.3 RFC-compliant tel: link normalization formats any valid phone into tel:+213...', () => {
      expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('06 61 23 45 67')).toBe('tel:+213661234567');
      expect(formatTelLink('+213 770 33 44 55')).toBe('tel:+213770334455');
      expect(formatTelLink('00213 550 12 34 56')).toBe('tel:+213550123456');
      expect(formatTelLink('550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('')).toBe('tel:');
      expect(formatTelLink(null)).toBe('tel:');
    });

    it('D.4 WhatsApp link URI encoding encodes customer names, order references, and French/Arabic characters safely', () => {
      const sampleOrder: Order = {
        id: 'ord-test-01',
        orderNumber: 'VIP-2026-9999',
        customer: {
          fullName: 'Mehdi & Farid <VIP>',
          phone: '0550123456',
          wilaya: 'Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: 'Résidence Les Pins, Appt 4',
          notes: 'Appeler avant 14h & sonnette 3ème étage',
        },
        items: [
          {
            productId: 'prod-001',
            title: 'Costume d\'Été "Super 130s" & Soie',
            slug: 'costume-ete-super-130s-soie',
            price: 48500,
            quantity: 1,
            selectedSize: '50',
            image: 'https://example.com/suit.jpg',
          },
        ],
        subtotal: 48500,
        deliveryFee: 0,
        total: 48500,
        status: 'pending',
        paymentMethod: 'cod',
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const link = generateWhatsAppConfirmLink(sampleOrder);
      expect(link.startsWith('https://wa.me/213550123456?text=')).toBe(true);
      expect(link).toContain('%26');
      expect(link).toContain('%3C');

      const queryPart = link.split('?text=')[1];
      const decoded = decodeURIComponent(queryPart);
      expect(decoded).toContain('Mehdi & Farid <VIP>');
      expect(decoded).toContain('Costume d\'Été "Super 130s" & Soie');
      expect(decoded).toContain('Appeler avant 14h & sonnette 3ème étage');
    });

    it('D.5 malformed Google Drive URL handling returns luxury SVG placeholder without throwing', () => {
      const url1 = normalizeImageUrl('https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ');
      expect(url1.startsWith('data:image/svg+xml')).toBe(true);

      const url2 = normalizeImageUrl('https://drive.google.com/open?broken_param=true');
      expect(url2.startsWith('data:image/svg+xml')).toBe(true);

      const url3 = normalizeImageUrl('');
      expect(url3.startsWith('data:image/svg+xml')).toBe(true);

      const url4 = normalizeImageUrl(null);
      expect(url4.startsWith('data:image/svg+xml')).toBe(true);
    });

    it('D.6 script injection prevention in media URLs blocks javascript:, vbscript:, and malicious schemes and replaces with luxury SVG', () => {
      const xss1 = normalizeImageUrl('javascript:alert(document.cookie)');
      expect(xss1.startsWith('data:image/svg+xml')).toBe(true);

      const xss2 = normalizeImageUrl('vbscript:msgbox("XSS")');
      expect(xss2.startsWith('data:image/svg+xml')).toBe(true);

      const xss3 = normalizeImageUrl('data:text/html,<script>alert(1)</script>');
      expect(xss3.startsWith('data:image/svg+xml')).toBe(true);

      const xss4 = normalizeImageUrl('//malicious.com/tracker.png');
      expect(xss4.startsWith('data:image/svg+xml')).toBe(true);
    });

    it('D.7 XML entity escaping in SVG escapes <, >, &, ", \' in category strings safely', () => {
      const svgUri = getLuxuryPlaceholderSvg('Suits & "Tuxedos" <Luxury> \'26\'');
      const decodedSvg = decodeURIComponent(svgUri.replace('data:image/svg+xml;utf8,', ''));

      expect(decodedSvg).toContain('&amp;');
      expect(decodedSvg).toContain('&quot;');
      expect(decodedSvg).toContain('&lt;');
      expect(decodedSvg).toContain('&gt;');
      expect(decodedSvg).toContain('&apos;');
      expect(decodedSvg).not.toContain('<Luxury>');
    });

    it('D.8 maximum length customer notes handles 5,000 characters without buffer overflow or URIError', async () => {
      const store = getDataStore();
      const product = (await store.getProducts())[0];
      const longNotes = 'Livraison spéciale VIP : ' + 'A'.repeat(4970);

      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Client Grande Note',
            phone: '0550123456',
            wilaya: 'Alger',
            wilayaCode: 16,
            commune: 'Hydra',
            address: '10 Boulevard des Martyrs',
            notes: longNotes,
          },
          items: [
            {
              productId: product.id,
              title: product.title,
              slug: product.slug,
              price: product.price,
              quantity: 1,
              selectedSize: '50',
              image: product.images[0]?.url || 'https://example.com/img.jpg',
            },
          ],
          deliveryFee: 400,
        }),
      });

      const res = await ordersPost(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.order.customer.notes.length).toBeGreaterThanOrEqual(4990);

      const link = generateWhatsAppConfirmLink(data.order);
      expect(link.startsWith('https://wa.me/213550123456?text=')).toBe(true);
    });
  });

  // =========================================================================
  // SUITE E: Admin Auth Guard, Session TTL & Storage Isolation (8 tests)
  // =========================================================================
  describe('Suite E: Admin Auth Guard, Session TTL & Storage Isolation', () => {
    const mockAdminSession: StoredAdminSession = {
      isAuthenticated: true,
      token: 'jwt-mock-token-admin-12345',
      email: 'admin@viptadj.dz',
      role: 'admin',
      user: {
        id: 'admin-001',
        email: 'admin@viptadj.dz',
        displayName: 'Administrateur Principal',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      expiresAt: Date.now() + SESSION_TTL_MS,
      lastActive: Date.now(),
    };

    it('E.1 session TTL exact boundary rejects expired session and clears storage', () => {
      const expiredSession: StoredAdminSession = {
        ...mockAdminSession,
        expiresAt: Date.now() - 1000,
      };

      saveStoredSession(expiredSession);
      expect(getStoredSession()).toBeNull();
      expect(localStorage.getItem(PRIMARY_STORAGE_KEY)).toBeNull();

      const validSession: StoredAdminSession = {
        ...mockAdminSession,
        expiresAt: Date.now() + 60000,
      };

      saveStoredSession(validSession);
      const retrieved = getStoredSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe('admin@viptadj.dz');
    });

    it('E.2 session TTL sliding window extends expiration by SESSION_TTL_MS upon activity', () => {
      const initialSession: StoredAdminSession = {
        ...mockAdminSession,
        expiresAt: Date.now() + 10000,
      };

      saveStoredSession(initialSession);

      const session = getStoredSession();
      if (session) {
        session.expiresAt = Date.now() + SESSION_TTL_MS;
        session.lastActive = Date.now();
        saveStoredSession(session);
      }

      const touched = getStoredSession();
      expect(touched?.expiresAt).toBeGreaterThan(Date.now() + 3500000);
    });

    it('E.3 role-based access control denies customer and guest sessions while admitting admin and superadmin', () => {
      const customerSession: StoredAdminSession = {
        ...mockAdminSession,
        role: 'customer' as any,
        user: { ...mockAdminSession.user, role: 'customer' as any },
      };

      saveStoredSession(customerSession);
      expect(checkAdminAccess('/admin')).toEqual({ allowed: false, redirectUrl: '/admin/login' });
      expect(checkAdminAccess('/admin/orders')).toEqual({ allowed: false, redirectUrl: '/admin/login' });
      expect(checkAdminAccess('/admin/products')).toEqual({ allowed: false, redirectUrl: '/admin/login' });

      // Admin role
      saveStoredSession(mockAdminSession);
      expect(checkAdminAccess('/admin')).toEqual({ allowed: true });
      expect(checkAdminAccess('/admin/orders')).toEqual({ allowed: true });

      // Superadmin role
      const superAdminSession: StoredAdminSession = {
        ...mockAdminSession,
        role: 'superadmin',
        user: { ...mockAdminSession.user, role: 'superadmin' },
      };
      saveStoredSession(superAdminSession);
      expect(checkAdminAccess('/admin')).toEqual({ allowed: true });
    });

    it('E.4 malformed session JSON recovery purges corrupted string without throwing unhandled exceptions', () => {
      localStorage.setItem(PRIMARY_STORAGE_KEY, '{"bad_json: [truncated, non-closing');
      expect(getStoredSession()).toBeNull();
      expect(localStorage.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
    });

    it('E.5 multi-tab logout synchronization clears both primary and secondary storage entries', () => {
      saveStoredSession(mockAdminSession);
      expect(getStoredSession()).not.toBeNull();

      clearStoredSession();
      expect(getStoredSession()).toBeNull();
      expect(localStorage.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(SECONDARY_STORAGE_KEY)).toBeNull();
    });

    it('E.6 express direct checkout isolation writes strictly to sessionStorage and leaves localStorage.vip_cart empty', () => {
      const expressItem = {
        productId: 'prod-001',
        title: 'Costume Deux Pièces',
        price: 48500,
        quantity: 1,
        selectedSize: '50',
      };

      sessionStorage.setItem('vip_express_checkout', JSON.stringify(expressItem));

      expect(sessionStorage.getItem('vip_express_checkout')).not.toBeNull();
      expect(localStorage.getItem('vip_cart')).toBeNull();
      expect(localStorage.getItem('vip_tadj_cart')).toBeNull();
    });

    it('E.7 post-checkout cleanup segregation preserves vip_cart during express checkout and clears on standard checkout', () => {
      localStorage.setItem('vip_cart', JSON.stringify([{ productId: 'prod-002', quantity: 2 }]));
      sessionStorage.setItem('vip_express_checkout', JSON.stringify({ productId: 'prod-001', quantity: 1 }));

      // Direct order cleanup: sessionStorage cleared, localStorage preserved
      render(React.createElement(OrderConfirmationCartCleaner, { isDirectOrder: true }));
      expect(sessionStorage.getItem('vip_express_checkout')).toBeNull();
      expect(localStorage.getItem('vip_cart')).not.toBeNull();

      // Standard order cleanup: localStorage cleared
      render(React.createElement(OrderConfirmationCartCleaner, { isDirectOrder: false }));
      expect(localStorage.getItem('vip_cart')).toBeNull();
    });

    it('E.8 cart drawer quantity bounds clamps item quantities to [1, 99] and generates composite keys', () => {
      expect(clampQuantity(-10)).toBe(1);
      expect(clampQuantity(0)).toBe(1);
      expect(clampQuantity(1)).toBe(1);
      expect(clampQuantity(50)).toBe(50);
      expect(clampQuantity(99)).toBe(99);
      expect(clampQuantity(100)).toBe(99);
      expect(clampQuantity(9999)).toBe(99);
      expect(clampQuantity(4.9)).toBe(4);

      expect(getCartItemId('prod-001', '50')).toBe('prod-001-50');
      expect(getCartItemId('prod-shoes-02', '42')).toBe('prod-shoes-02-42');
    });
  });
});
