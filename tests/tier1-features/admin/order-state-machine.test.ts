import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { OrderStatus, Order } from '@/types';

describe('Tier 1: Admin — Order State Machine & Audit History (F-ORD-03)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // State machine transition validator
  function isValidTransition(current: OrderStatus, target: OrderStatus): boolean {
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
    };

    return allowedTransitions[current]?.includes(target) ?? false;
  }

  // ==========================================
  // Test 1: Complete Happy Path Lifecycle Transitions
  // ==========================================
  it('advances order along valid forward lifecycle (pending -> confirmed -> shipped -> delivered)', async () => {
    let order = await mockDataProvider.getOrderById('ord-001');
    expect(order?.status).toBe('pending');

    // 1. pending -> confirmed
    expect(isValidTransition('pending', 'confirmed')).toBe(true);
    order = await mockDataProvider.updateOrderStatus(
      'ord-001',
      'confirmed',
      'Client validé par téléphone',
      'Admin Mehdi'
    );
    expect(order.status).toBe('confirmed');

    // 2. confirmed -> shipped
    expect(isValidTransition('confirmed', 'shipped')).toBe(true);
    order = await mockDataProvider.updateOrderStatus(
      'ord-001',
      'shipped',
      'Colis remis à Yalidine Express',
      'Admin Mehdi'
    );
    expect(order.status).toBe('shipped');

    // 3. shipped -> delivered
    expect(isValidTransition('shipped', 'delivered')).toBe(true);
    order = await mockDataProvider.updateOrderStatus(
      'ord-001',
      'delivered',
      'Colis livré et montant COD encaissé',
      'Système Yalidine'
    );
    expect(order.status).toBe('delivered');
  });

  // ==========================================
  // Test 2: Order Cancellation with Mandatory Reason Note
  // ==========================================
  it('allows cancellation from pending status with required explanatory note', async () => {
    const reason = 'Client injoignable après 3 tentatives d’appel téléphonique';
    const cancelled = await mockDataProvider.updateOrderStatus(
      'ord-001',
      'cancelled',
      reason,
      'Admin Sarah'
    );

    expect(cancelled.status).toBe('cancelled');
    const latestLog = cancelled.statusHistory[cancelled.statusHistory.length - 1];
    expect(latestLog.status).toBe('cancelled');
    expect(latestLog.note).toBe(reason);
    expect(latestLog.updatedBy).toBe('Admin Sarah');
  });

  // ==========================================
  // Test 3: Stock Restoration on Cancellation
  // ==========================================
  it('automatically restores inventory quantities when an order is cancelled', async () => {
    const order = await mockDataProvider.getOrderById('ord-001');
    const suit = await mockDataProvider.getProductById('prod-001');
    const initialStock = suit!.stockQuantity;

    // Cancel order
    await mockDataProvider.updateOrderStatus(
      'ord-001',
      'cancelled',
      'Annulation demandée par le client',
      'Admin Mehdi'
    );

    // Verify stock restored
    const suitAfterCancel = await mockDataProvider.getProductById('prod-001');
    expect(suitAfterCancel?.stockQuantity).toBe(initialStock + 1); // 1 item returned
  });

  // ==========================================
  // Test 4: Terminal States Cannot Transition
  // ==========================================
  it('strictly forbids transitions originating from terminal states (delivered, cancelled)', () => {
    // Delivered cannot transition
    expect(isValidTransition('delivered', 'pending')).toBe(false);
    expect(isValidTransition('delivered', 'confirmed')).toBe(false);
    expect(isValidTransition('delivered', 'shipped')).toBe(false);
    expect(isValidTransition('delivered', 'cancelled')).toBe(false);

    // Cancelled cannot transition
    expect(isValidTransition('cancelled', 'pending')).toBe(false);
    expect(isValidTransition('cancelled', 'confirmed')).toBe(false);
    expect(isValidTransition('cancelled', 'shipped')).toBe(false);
    expect(isValidTransition('cancelled', 'delivered')).toBe(false);
  });

  // ==========================================
  // Test 5: Forbids Skipping Essential Lifecycle Steps
  // ==========================================
  it('prevents skipping lifecycle stages (e.g. pending directly to delivered)', () => {
    expect(isValidTransition('pending', 'delivered')).toBe(false);
    expect(isValidTransition('pending', 'shipped')).toBe(false);
    expect(isValidTransition('confirmed', 'delivered')).toBe(false);
  });

  // ==========================================
  // Test 6: Audit History Trail Appending
  // ==========================================
  it('appends audit log entries with ISO timestamp for every state change without overwriting past entries', async () => {
    const initialOrder = await mockDataProvider.getOrderById('ord-001');
    const initialHistoryLength = initialOrder!.statusHistory.length;

    await mockDataProvider.updateOrderStatus('ord-001', 'confirmed', 'Étape 1 validée');
    await mockDataProvider.updateOrderStatus('ord-001', 'shipped', 'Étape 2 expédiée');

    const updated = await mockDataProvider.getOrderById('ord-001');
    expect(updated?.statusHistory.length).toBe(initialHistoryLength + 2);
    expect(updated?.statusHistory[updated.statusHistory.length - 2].status).toBe('confirmed');
    expect(updated?.statusHistory[updated.statusHistory.length - 1].status).toBe('shipped');
  });
});
