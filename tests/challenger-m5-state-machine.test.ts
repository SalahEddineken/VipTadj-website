/**
 * VIP TADJ — Adversarial Stress Test Suite: Milestone 5
 * Order State Machine, Transition Rules, Cancellation Reasons, and Inventory Restoration (F-ORD-01, F-ORD-02, F-ORD-03, F-ORD-04)
 *
 * Empirical verification suite by Challenger M5-1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  VALID_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
  ORDER_STATUS_TRANSITIONS,
  CANCELLATION_REASONS,
  STATUS_LABELS_FR,
  STATUS_CONFIG,
  STATUS_BADGE_CLASSES,
  isValidTransition,
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
  assertValidTransition,
  normalizeCancellationReason,
} from '@/lib/utils/orderStateMachine';
import { updateOrderStatusSchema } from '@/lib/validations/order';
import { PATCH as statusPatch } from '@/app/api/orders/[id]/status/route';
import { GET as orderGet, PATCH as orderPatch } from '@/app/api/orders/[id]/route';
import { getDataStore } from '@/lib/data-provider';
import { OrderStatus, CreateOrderInput } from '@/types';
import { formatTelLink } from '@/lib/utils/phoneUtils';
import { generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';

describe('CHALLENGER M5 — EMPIRICAL ADVERSARIAL STRESS TEST SUITE', () => {
  beforeEach(async () => {
    const store = getDataStore();
    await store.seedCatalog(true);
  });

  // =========================================================================
  // 1. FORWARD LIFECYCLE & AUDIT HISTORY
  // =========================================================================
  describe('1. Valid Forward Lifecycle Progression & Audit History Trail', () => {
    it('executes full forward lifecycle: pending -> confirmed -> shipped -> delivered', async () => {
      const store = getDataStore();
      const order = await store.getOrderById('ord-001');
      expect(order).not.toBeNull();
      expect(order?.status).toBe('pending');
      expect(order?.statusHistory.length).toBe(1);

      // Step 1: pending -> confirmed
      expect(isValidTransition('pending', 'confirmed')).toBe(true);
      const confirmed = await store.updateOrderStatus(
        'ord-001',
        'confirmed',
        'Client joint et confirmé par téléphone',
        'Admin Sofiane'
      );
      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.statusHistory.length).toBe(2);
      expect(confirmed.statusHistory[1].status).toBe('confirmed');
      expect(confirmed.statusHistory[1].note).toBe('Client joint et confirmé par téléphone');
      expect(confirmed.statusHistory[1].updatedBy).toBe('Admin Sofiane');

      // Step 2: confirmed -> shipped
      expect(isValidTransition('confirmed', 'shipped')).toBe(true);
      const shipped = await store.updateOrderStatus(
        'ord-001',
        'shipped',
        'Colis remis au transporteur Yalidine Express',
        'Admin Mehdi'
      );
      expect(shipped.status).toBe('shipped');
      expect(shipped.statusHistory.length).toBe(3);
      expect(shipped.statusHistory[2].status).toBe('shipped');
      expect(shipped.statusHistory[2].note).toBe('Colis remis au transporteur Yalidine Express');

      // Step 3: shipped -> delivered
      expect(isValidTransition('shipped', 'delivered')).toBe(true);
      const delivered = await store.updateOrderStatus(
        'ord-001',
        'delivered',
        'Livraison effectuée avec succès, paiement COD encaissé',
        'Livreur Yalidine'
      );
      expect(delivered.status).toBe('delivered');
      expect(delivered.statusHistory.length).toBe(4);
      expect(delivered.statusHistory[3].status).toBe('delivered');
      expect(delivered.statusHistory[3].updatedBy).toBe('Livreur Yalidine');

      // Verify product stock was NOT restored during forward lifecycle
      const suit = await store.getProductById('prod-suit-01');
      // Initially 14 in seed data, ord-001 was seeded with mock initial data without decrementing seed stock
      expect(suit?.stockQuantity).toBe(14);
    });

    it('ensures timestamps in statusHistory are strictly chronological and ISO 8601', async () => {
      const store = getDataStore();
      await store.updateOrderStatus('ord-001', 'confirmed', 'Step 1');
      await store.updateOrderStatus('ord-001', 'shipped', 'Step 2');
      const finalOrder = await store.updateOrderStatus('ord-001', 'delivered', 'Step 3');

      const timestamps = finalOrder.statusHistory.map((h) => new Date(h.timestamp).getTime());
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
        expect(isNaN(timestamps[i])).toBe(false);
      }
    });
  });

  // =========================================================================
  // 2. EXHAUSTIVE MATRIX OF ILLEGAL & BACKWARD TRANSITIONS
  // =========================================================================
  describe('2. Exhaustive Matrix of Disallowed Transitions & Boundary Rejections', () => {
    const allStatuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const validPairs: [OrderStatus, OrderStatus][] = [
      ['pending', 'confirmed'],
      ['pending', 'cancelled'],
      ['confirmed', 'shipped'],
      ['confirmed', 'cancelled'],
      ['shipped', 'delivered'],
      ['shipped', 'cancelled'],
    ];

    it('validates that exactly 6 transitions are permitted and 19 transitions are strictly rejected', () => {
      let allowedCount = 0;
      let rejectedCount = 0;

      for (const from of allStatuses) {
        for (const to of allStatuses) {
          const isPermitted = isValidTransition(from, to);
          const shouldBePermitted = validPairs.some(([f, t]) => f === from && t === to);

          if (shouldBePermitted) {
            expect(isPermitted).toBe(true);
            expect(canTransition(from, to)).toBe(true);
            allowedCount++;
          } else {
            expect(isPermitted).toBe(false);
            expect(canTransition(from, to)).toBe(false);
            expect(() => assertValidTransition(from, to)).toThrow();
            rejectedCount++;
          }
        }
      }

      expect(allowedCount).toBe(6);
      expect(rejectedCount).toBe(19);
    });

    it('rejects step-skipping transitions with explicit assertValidTransition errors', () => {
      // Skipping from pending directly to shipped
      expect(() => assertValidTransition('pending', 'shipped')).toThrowError(
        /Transition de statut invalide : passage de "pending" vers "shipped" interdit/
      );
      // Skipping from pending directly to delivered
      expect(() => assertValidTransition('pending', 'delivered')).toThrowError(
        /Transition de statut invalide : passage de "pending" vers "delivered" interdit/
      );
      // Skipping from confirmed directly to delivered
      expect(() => assertValidTransition('confirmed', 'delivered')).toThrowError(
        /Transition de statut invalide : passage de "confirmed" vers "delivered" interdit/
      );
    });

    it('rejects backward transitions with explicit assertValidTransition errors', () => {
      // confirmed back to pending
      expect(() => assertValidTransition('confirmed', 'pending')).toThrowError(
        /Transition de statut invalide : passage de "confirmed" vers "pending" interdit/
      );
      // shipped back to confirmed
      expect(() => assertValidTransition('shipped', 'confirmed')).toThrowError(
        /Transition de statut invalide : passage de "shipped" vers "confirmed" interdit/
      );
      // shipped back to pending
      expect(() => assertValidTransition('shipped', 'pending')).toThrowError(
        /Transition de statut invalide : passage de "shipped" vers "pending" interdit/
      );
    });

    it('rejects self-transitions (no-op transitions)', () => {
      expect(isValidTransition('pending', 'pending')).toBe(false);
      expect(isValidTransition('confirmed', 'confirmed')).toBe(false);
      expect(isValidTransition('shipped', 'shipped')).toBe(false);
      expect(isValidTransition('delivered', 'delivered')).toBe(false);
      expect(isValidTransition('cancelled', 'cancelled')).toBe(false);
    });

    it('API PATCH /api/orders/[id]/status rejects invalid state jump with 422 and metadata', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }), // Jump over confirmed
      });

      const res = await statusPatch(req, { params: { id: 'ord-001' } });
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INVALID_STATE_TRANSITION');
      expect(json.currentStatus).toBe('pending');
      expect(json.targetStatus).toBe('shipped');
      expect(json.allowedTransitions).toEqual(['confirmed', 'cancelled']);
    });
  });

  // =========================================================================
  // 3. TERMINAL STATE IMMUTABILITY
  // =========================================================================
  describe('3. Terminal State Immutability & Permanent Lockout', () => {
    it('confirms delivered and cancelled are terminal statuses and have zero allowed transitions', () => {
      expect(isTerminalStatus('delivered')).toBe(true);
      expect(isTerminalStatus('cancelled')).toBe(true);
      expect(isTerminalStatus('pending')).toBe(false);
      expect(isTerminalStatus('confirmed')).toBe(false);
      expect(isTerminalStatus('shipped')).toBe(false);

      expect(getAllowedTransitions('delivered')).toEqual([]);
      expect(getAllowedTransitions('cancelled')).toEqual([]);
    });

    it('assertValidTransition throws dedicated terminal error message for delivered and cancelled', () => {
      expect(() => assertValidTransition('delivered', 'pending')).toThrowError(
        /Impossible de modifier une commande clôturée\. Le statut "delivered" est un état terminal définitif\./
      );
      expect(() => assertValidTransition('delivered', 'cancelled')).toThrowError(
        /Impossible de modifier une commande clôturée\. Le statut "delivered" est un état terminal définitif\./
      );
      expect(() => assertValidTransition('cancelled', 'confirmed')).toThrowError(
        /Impossible de modifier une commande clôturée\. Le statut "cancelled" est un état terminal définitif\./
      );
      expect(() => assertValidTransition('cancelled', 'pending')).toThrowError(
        /Impossible de modifier une commande clôturée\. Le statut "cancelled" est un état terminal définitif\./
      );
    });

    it('API PATCH /api/orders/[id]/status rejects modifying delivered order with HTTP 422 TERMINAL_STATE', async () => {
      const store = getDataStore();
      await store.updateOrderStatus('ord-001', 'confirmed');
      await store.updateOrderStatus('ord-001', 'shipped');
      await store.updateOrderStatus('ord-001', 'delivered');

      const statusesToAttempt: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'cancelled', 'delivered'];

      for (const target of statusesToAttempt) {
        const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: target,
            note: `Attempt to move delivered to ${target}`,
            reason: 'other',
          }),
        });

        const res = await statusPatch(req, { params: { id: 'ord-001' } });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.code).toBe('TERMINAL_STATE');
        expect(data.allowedTransitions).toEqual([]);
      }
    });

    it('API PATCH /api/orders/[id]/status rejects modifying cancelled order with HTTP 422 TERMINAL_STATE', async () => {
      const store = getDataStore();
      await store.updateOrderStatus('ord-001', 'cancelled', 'Annulé client', 'Admin', 'customer_cancelled');

      const statusesToAttempt: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

      for (const target of statusesToAttempt) {
        const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: target,
            note: `Attempt to revive cancelled order to ${target}`,
            reason: 'other',
          }),
        });

        const res = await statusPatch(req, { params: { id: 'ord-001' } });
        expect(res.status).toBe(422);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.code).toBe('TERMINAL_STATE');
      }
    });

    it('API PATCH /api/orders/[id] (alias route) enforces terminal state lockout identically', async () => {
      const store = getDataStore();
      await store.updateOrderStatus('ord-001', 'confirmed');
      await store.updateOrderStatus('ord-001', 'shipped');
      await store.updateOrderStatus('ord-001', 'delivered');

      const req = new NextRequest('http://localhost:3000/api/orders/ord-001', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          note: 'Reopen delivered order',
        }),
      });

      const res = await orderPatch(req, { params: { id: 'ord-001' } });
      expect(res.status).toBe(422);
      const data = await res.json();
      expect(data.code).toBe('TERMINAL_STATE');
    });
  });

  // =========================================================================
  // 4. ZOD VALIDATION & CANCELLATION REASONS
  // =========================================================================
  describe('4. Zod Schema & Cancellation Reason Validation', () => {
    it('strictly rejects cancellation when both note and reason are missing or empty', () => {
      const emptyNote = updateOrderStatusSchema.safeParse({
        status: 'cancelled',
        note: '',
      });
      expect(emptyNote.success).toBe(false);
      if (!emptyNote.success) {
        expect(emptyNote.error.issues[0].message).toContain('obligatoire');
      }

      const whitespaceNote = updateOrderStatusSchema.safeParse({
        status: 'cancelled',
        note: '     ',
      });
      expect(whitespaceNote.success).toBe(false);

      const noNoteNoReason = updateOrderStatusSchema.safeParse({
        status: 'cancelled',
      });
      expect(noNoteNoReason.success).toBe(false);
    });

    it('accepts cancellation when valid reason or cancellationReason is provided', () => {
      const withReason = updateOrderStatusSchema.safeParse({
        status: 'cancelled',
        reason: 'customer_unreachable',
      });
      expect(withReason.success).toBe(true);

      const withCancellationReason = updateOrderStatusSchema.safeParse({
        status: 'cancelled',
        cancellationReason: 'out_of_stock',
      });
      expect(withCancellationReason.success).toBe(true);

      const withNote = updateOrderStatusSchema.safeParse({
        status: 'cancelled',
        note: 'Raison exceptionnelle fournie par le client',
      });
      expect(withNote.success).toBe(true);
    });

    it('rejects notes exceeding 1000 characters', () => {
      const overlongNote = updateOrderStatusSchema.safeParse({
        status: 'confirmed',
        note: 'A'.repeat(1001),
      });
      expect(overlongNote.success).toBe(false);
      if (!overlongNote.success) {
        expect(overlongNote.error.issues[0].message).toContain('1000');
      }
    });

    it('rejects invalid or forged status values', () => {
      const invalidStatus = updateOrderStatusSchema.safeParse({
        status: 'refunded',
      });
      expect(invalidStatus.success).toBe(false);

      const numericStatus = updateOrderStatusSchema.safeParse({
        status: 404,
      });
      expect(numericStatus.success).toBe(false);

      const nullStatus = updateOrderStatusSchema.safeParse({
        status: null,
      });
      expect(nullStatus.success).toBe(false);
    });

    it('applies default updatedBy as "Admin" when unspecified', () => {
      const parsed = updateOrderStatusSchema.safeParse({
        status: 'confirmed',
        note: 'Note valide',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.updatedBy).toBe('Admin');
      }
    });

    it('normalizes cancellation reason strings and legacy codes', () => {
      expect(normalizeCancellationReason('CUSTOMER_CANCELLED')).toBe('customer_cancelled');
      expect(normalizeCancellationReason('UNREACHABLE_AFTER_CALLS')).toBe('customer_unreachable');
      expect(normalizeCancellationReason('FAKE_ORDER')).toBe('invalid_phone');
      expect(normalizeCancellationReason('DELIVERY_REFUSED')).toBe('refused_delivery');
      expect(normalizeCancellationReason('DUPLICATE_ORDER')).toBe('duplicate_order');
      expect(normalizeCancellationReason('OUT_OF_STOCK')).toBe('out_of_stock');
      expect(normalizeCancellationReason('OTHER')).toBe('other');

      // Free text reasons preserved
      expect(normalizeCancellationReason('motif personnel spécifique')).toBe('motif personnel spécifique');
      expect(normalizeCancellationReason(undefined)).toBeUndefined();
    });

    it('API PATCH /api/orders/[id]/status returns 400 for malformed JSON request bodies', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{"status": "confirmed", broken_json',
      });

      const res = await statusPatch(req, { params: { id: 'ord-001' } });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('JSON invalide');
    });
  });

  // =========================================================================
  // 5. INVENTORY RESTORATION & IDEMPOTENCE
  // =========================================================================
  describe('5. Inventory Restoration & Cancellation Idempotence', () => {
    it('restores exact quantities for multiple items upon order cancellation from pending', async () => {
      const store = getDataStore();
      const suitBefore = await store.getProductById('prod-suit-01');
      const shoesBefore = await store.getProductById('prod-shoes-01');
      const initialSuitStock = suitBefore!.stockQuantity;
      const initialShoesStock = shoesBefore!.stockQuantity;

      // Create a multi-item order: 2 suits, 3 shoes
      const newOrder = await store.createOrder({
        customer: {
          fullName: 'Amine Testeur',
          phone: '0555987654',
          wilaya: '31 - Oran',
          wilayaCode: 31,
          commune: 'Es Senia',
          address: 'Lot 15',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-suit-01',
            title: 'Costume',
            slug: 'costume',
            price: 48500,
            quantity: 2,
            selectedSize: '50',
            image: 'https://example.com/suit.jpg',
          },
          {
            productId: 'prod-shoes-01',
            title: 'Souliers Richelieu',
            slug: 'souliers',
            price: 32000,
            quantity: 3,
            selectedSize: '42',
            image: 'https://example.com/shoes.jpg',
          },
        ],
        deliveryFee: 600,
      });

      // Verify stock was decremented upon creation
      const suitAfterCreate = await store.getProductById('prod-suit-01');
      const shoesAfterCreate = await store.getProductById('prod-shoes-01');
      expect(suitAfterCreate!.stockQuantity).toBe(initialSuitStock - 2);
      expect(shoesAfterCreate!.stockQuantity).toBe(initialShoesStock - 3);

      // Now cancel the order via API
      const req = new NextRequest(`http://localhost:3000/api/orders/${newOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          cancellationReason: 'customer_cancelled',
          note: 'Annulation demandée avant confirmation',
        }),
      });

      const res = await statusPatch(req, { params: { id: newOrder.id } });
      expect(res.status).toBe(200);

      // Verify exact stock restored
      const suitRestored = await store.getProductById('prod-suit-01');
      const shoesRestored = await store.getProductById('prod-shoes-01');
      expect(suitRestored!.stockQuantity).toBe(initialSuitStock);
      expect(shoesRestored!.stockQuantity).toBe(initialShoesStock);
    });

    it('restores stock and flips inStock back to true when a sold-out product order is cancelled', async () => {
      const store = getDataStore();
      const tie = await store.getProductById('prod-cravate-soie-jacquard');
      expect(tie).not.toBeNull();
      const currentStock = tie!.stockQuantity;

      // Create an order purchasing the ENTIRE remaining inventory of the tie
      const order = await store.createOrder({
        customer: {
          fullName: 'Sold Out Tester',
          phone: '0770112233',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Bab Ezzouar',
          address: 'Cité Universitaire',
          deliveryType: 'desk',
        },
        items: [
          {
            productId: 'prod-cravate-soie-jacquard',
            title: tie!.title,
            slug: tie!.slug,
            price: tie!.price,
            quantity: currentStock,
            selectedSize: 'TU',
            image: tie!.images[0]?.url || '',
          },
        ],
        deliveryFee: 250,
      });

      // Verify tie is now sold out
      const tieSoldOut = await store.getProductById('prod-cravate-soie-jacquard');
      expect(tieSoldOut!.stockQuantity).toBe(0);
      expect(tieSoldOut!.inStock).toBe(false);

      // Cancel the order
      const req = new NextRequest(`http://localhost:3000/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: 'customer_unreachable',
        }),
      });
      const res = await statusPatch(req, { params: { id: order.id } });
      expect(res.status).toBe(200);

      // Verify stock restored AND inStock flipped back to true
      const tieRestored = await store.getProductById('prod-cravate-soie-jacquard');
      expect(tieRestored!.stockQuantity).toBe(currentStock);
      expect(tieRestored!.inStock).toBe(true);
    });

    it('guarantees cancellation idempotence: repeated cancellation does NOT double-restore stock', async () => {
      const store = getDataStore();
      const suit = await store.getProductById('prod-suit-01');
      const stockBaseline = suit!.stockQuantity; // Currently 6 because ord-001 holds 1 unit

      // Cancel ord-001 once via dataStore directly
      await store.updateOrderStatus('ord-001', 'cancelled', 'First cancellation', 'Admin', 'out_of_stock');

      const stockAfterFirstCancel = (await store.getProductById('prod-suit-01'))!.stockQuantity;
      expect(stockAfterFirstCancel).toBe(stockBaseline + 1); // Restored by 1 unit

      // Attempt second cancellation via dataStore directly
      await store.updateOrderStatus('ord-001', 'cancelled', 'Second cancellation attempt', 'Admin', 'out_of_stock');

      const stockAfterSecondCancel = (await store.getProductById('prod-suit-01'))!.stockQuantity;
      // MUST NOT DOUBLE-RESTORE!
      expect(stockAfterSecondCancel).toBe(stockAfterFirstCancel);

      // Attempt third cancellation via API route
      const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          note: 'Third cancellation via API',
        }),
      });
      const res = await statusPatch(req, { params: { id: 'ord-001' } });
      expect(res.status).toBe(422); // Terminal state lockout

      const stockAfterThirdCancel = (await store.getProductById('prod-suit-01'))!.stockQuantity;
      expect(stockAfterThirdCancel).toBe(stockAfterFirstCancel);
    });

    it('cancelling from confirmed status properly restores stock', async () => {
      const store = getDataStore();
      const suit = await store.getProductById('prod-suit-01');
      const stockBaseline = suit!.stockQuantity;

      // Advance to confirmed
      await store.updateOrderStatus('ord-001', 'confirmed', 'Validé');

      // Cancel from confirmed
      await store.updateOrderStatus('ord-001', 'cancelled', 'Annulé après confirmation', 'Admin', 'customer_cancelled');

      const suitAfter = await store.getProductById('prod-suit-01');
      expect(suitAfter!.stockQuantity).toBe(stockBaseline + 1);
    });

    it('cancelling from shipped status properly restores stock', async () => {
      const store = getDataStore();
      const suit = await store.getProductById('prod-suit-01');
      const stockBaseline = suit!.stockQuantity;

      // Advance to confirmed then shipped
      await store.updateOrderStatus('ord-001', 'confirmed', 'Validé');
      await store.updateOrderStatus('ord-001', 'shipped', 'Expédié');

      // Cancel from shipped (e.g. refused at doorstep)
      await store.updateOrderStatus('ord-001', 'cancelled', 'Refusé à la livraison', 'Transporteur', 'refused_delivery');

      const suitAfter = await store.getProductById('prod-suit-01');
      expect(suitAfter!.stockQuantity).toBe(stockBaseline + 1);
    });
  });

  // =========================================================================
  // 6. API ROUTE CONTRACTS & ERROR HANDLING
  // =========================================================================
  describe('6. API Route Contracts & Error Handling', () => {
    it('GET /api/orders/[id] returns 404 for non-existent order ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/ord-999999');
      const res = await orderGet(req, { params: { id: 'ord-999999' } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('introuvable');
    });

    it('GET /api/orders/[id] returns complete order dossier for valid ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/ord-001');
      const res = await orderGet(req, { params: { id: 'ord-001' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.order.id).toBe('ord-001');
      expect(json.order.customer.fullName).toBe('Karim Benali');
      expect(json.order.items.length).toBeGreaterThan(0);
      expect(json.order.total).toBeGreaterThan(0);
    });

    it('PATCH /api/orders/[id]/status returns 404 for non-existent order ID', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/ord-non-existent/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          note: 'Confirm non-existent',
        }),
      });

      const res = await statusPatch(req, { params: { id: 'ord-non-existent' } });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain('introuvable');
    });

    it('PATCH /api/orders/[id] forwards status updates cleanly', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/ord-001', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'confirmed',
          note: 'Mise à jour via route alias',
          updatedBy: 'SuperAdmin',
        }),
      });

      const res = await orderPatch(req, { params: { id: 'ord-001' } });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.order.status).toBe('confirmed');
      const lastEntry = json.order.statusHistory[json.order.statusHistory.length - 1];
      expect(lastEntry.updatedBy).toBe('SuperAdmin');
    });
  });

  // =========================================================================
  // 7. PHONE & WHATSAPP CONFIRMATION HARNESS (F-ORD-04)
  // =========================================================================
  describe('7. Communication Normalization & WhatsApp Concierge Generation (F-ORD-04)', () => {
    it('normalizes diverse Algerian phone formats into RFC-compliant tel: URIs', () => {
      // 10-digit standard formats
      expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('0661987654')).toBe('tel:+213661987654');
      expect(formatTelLink('0770554433')).toBe('tel:+213770554433');

      // Formatted with spaces and dashes
      expect(formatTelLink('05 50 12 34 56')).toBe('tel:+213550123456');
      expect(formatTelLink('06-61-98-76-54')).toBe('tel:+213661987654');

      // 9-digit format (omitted leading zero)
      expect(formatTelLink('550123456')).toBe('tel:+213550123456');

      // International prefixes
      expect(formatTelLink('+213550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('00213550123456')).toBe('tel:+213550123456');
    });

    it('generates luxury WhatsApp confirmation link containing order details and totals', async () => {
      const store = getDataStore();
      const order = await store.getOrderById('ord-001');
      expect(order).not.toBeNull();

      const waLink = generateWhatsAppConfirmLink(order!);
      expect(waLink).toContain('https://wa.me/213550123456');
      const decoded = decodeURIComponent(waLink);
      expect(decoded).toContain('VIP TADJ');
      expect(decoded).toContain('VIP-2026-0001');
      expect(decoded).toContain('Karim Benali');
      expect(decoded).toContain('48'); // Total amount or line item reference
    });
  });

  // =========================================================================
  // 8. ADVERSARIAL CONCURRENCY, HOSTILE INPUTS & BOUNDARIES
  // =========================================================================
  describe('8. Adversarial Concurrency, Hostile Inputs & Boundary Lengths', () => {
    it('handles repeated sequential cancellation requests: first succeeds with 200, second is rejected with 422 TERMINAL_STATE', async () => {
      const store = getDataStore();
      const suitBefore = (await store.getProductById('prod-suit-01'))!.stockQuantity;

      // First cancellation
      const req1 = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: 'customer_cancelled',
          note: 'First cancellation attempt',
        }),
      });
      const res1 = await statusPatch(req1, { params: { id: 'ord-001' } });
      expect(res1.status).toBe(200);

      const suitAfterFirst = (await store.getProductById('prod-suit-01'))!.stockQuantity;
      expect(suitAfterFirst).toBe(suitBefore + 1);

      // Second cancellation
      const req2 = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled',
          reason: 'customer_cancelled',
          note: 'Second cancellation attempt',
        }),
      });
      const res2 = await statusPatch(req2, { params: { id: 'ord-001' } });
      expect(res2.status).toBe(422);
      const json2 = await res2.json();
      expect(json2.code).toBe('TERMINAL_STATE');

      // Verify stock was NOT restored a second time
      const suitAfterSecond = (await store.getProductById('prod-suit-01'))!.stockQuantity;
      expect(suitAfterSecond).toBe(suitAfterFirst);
    });

    it('guarantees zero stock drift under concurrent cancellation attempts', async () => {
      const store = getDataStore();
      const suitBefore = (await store.getProductById('prod-suit-01'))!.stockQuantity;

      // Dispatch 5 concurrent cancellation requests for ord-001
      const requests = Array.from({ length: 5 }, (_, i) => {
        const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'cancelled',
            reason: 'customer_cancelled',
            note: `Concurrent cancellation attempt #${i + 1}`,
          }),
        });
        return statusPatch(req, { params: { id: 'ord-001' } });
      });

      const responses = await Promise.all(requests);
      expect(responses.length).toBe(5);

      // Verify stock was restored EXACTLY ONCE (from baseline to baseline + 1), never 5x!
      const suitAfter = (await store.getProductById('prod-suit-01'))!.stockQuantity;
      expect(suitAfter).toBe(suitBefore + 1);
    });

    it('enforces exact boundary limits for note (1000), reason (100), and updatedBy (150)', () => {
      // Exactly at limit: passes
      const exactLimits = updateOrderStatusSchema.safeParse({
        status: 'confirmed',
        note: 'X'.repeat(1000),
        reason: 'Y'.repeat(100),
        updatedBy: 'Z'.repeat(150),
      });
      expect(exactLimits.success).toBe(true);

      // Over limit: fails
      const overNote = updateOrderStatusSchema.safeParse({
        status: 'confirmed',
        note: 'X'.repeat(1001),
      });
      expect(overNote.success).toBe(false);

      const overReason = updateOrderStatusSchema.safeParse({
        status: 'confirmed',
        reason: 'Y'.repeat(101),
      });
      expect(overReason.success).toBe(false);

      const overUpdatedBy = updateOrderStatusSchema.safeParse({
        status: 'confirmed',
        updatedBy: 'Z'.repeat(151),
      });
      expect(overUpdatedBy.success).toBe(false);
    });

    it('rejects case-mismatched and whitespace-padded status strings with HTTP 400', async () => {
      const invalidStatuses = ['PENDING', ' pending ', 'Confirmed', 'delivered\n', 'SHIPPED'];

      for (const invalid of invalidStatuses) {
        const req = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: invalid }),
        });

        const res = await statusPatch(req, { params: { id: 'ord-001' } });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.success).toBe(false);
      }
    });

    it('handles hostile order IDs gracefully without crashing or server errors', async () => {
      const hostileIds = [
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        "' OR '1'='1",
        'null',
        'undefined',
        '__proto__',
      ];

      for (const hostileId of hostileIds) {
        const getReq = new NextRequest(`http://localhost:3000/api/orders/${encodeURIComponent(hostileId)}`);
        const getRes = await orderGet(getReq, { params: { id: hostileId } });
        expect(getRes.status).toBe(404);

        const patchReq = new NextRequest(
          `http://localhost:3000/api/orders/${encodeURIComponent(hostileId)}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' }),
          }
        );
        const patchRes = await statusPatch(patchReq, { params: { id: hostileId } });
        expect(patchRes.status).toBe(404);
      }
    });

    it('resolves order by both internal id (ord-001) and public orderNumber (VIP-2026-0001)', async () => {
      const reqById = new NextRequest('http://localhost:3000/api/orders/ord-001');
      const resById = await orderGet(reqById, { params: { id: 'ord-001' } });
      expect(resById.status).toBe(200);
      const jsonById = await resById.json();
      expect(jsonById.order.orderNumber).toBe('VIP-2026-0001');

      const reqByNumber = new NextRequest('http://localhost:3000/api/orders/VIP-2026-0001');
      const resByNumber = await orderGet(reqByNumber, { params: { id: 'VIP-2026-0001' } });
      expect(resByNumber.status).toBe(200);
      const jsonByNumber = await resByNumber.json();
      expect(jsonByNumber.order.id).toBe('ord-001');
    });

    it('preserves complete audit trail immutability across repeated transitions', async () => {
      const store = getDataStore();
      await store.updateOrderStatus('ord-001', 'confirmed', 'Note A', 'User 1');
      await store.updateOrderStatus('ord-001', 'shipped', 'Note B', 'User 2');
      const finalOrder = await store.updateOrderStatus('ord-001', 'delivered', 'Note C', 'User 3');

      expect(finalOrder.statusHistory.length).toBe(4);
      expect(finalOrder.statusHistory[0].status).toBe('pending');
      expect(finalOrder.statusHistory[1].status).toBe('confirmed');
      expect(finalOrder.statusHistory[1].note).toBe('Note A');
      expect(finalOrder.statusHistory[1].updatedBy).toBe('User 1');

      expect(finalOrder.statusHistory[2].status).toBe('shipped');
      expect(finalOrder.statusHistory[2].note).toBe('Note B');
      expect(finalOrder.statusHistory[2].updatedBy).toBe('User 2');

      expect(finalOrder.statusHistory[3].status).toBe('delivered');
      expect(finalOrder.statusHistory[3].note).toBe('Note C');
      expect(finalOrder.statusHistory[3].updatedBy).toBe('User 3');
    });
  });
});
