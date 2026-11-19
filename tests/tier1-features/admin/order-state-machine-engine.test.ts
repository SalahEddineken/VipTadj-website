import { describe, it, expect } from 'vitest';
import {
  isValidTransition,
  canTransition,
  getAllowedTransitions,
  isTerminalStatus,
  assertValidTransition,
  normalizeCancellationReason,
  VALID_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  STATUS_LABELS_FR,
  STATUS_CONFIG,
  CANCELLATION_REASONS,
} from '@/lib/utils/orderStateMachine';
import { OrderStatus } from '@/types';

describe('Order State Machine & Audit History Engine (F-ORD-03)', () => {
  it('defines 5 valid order statuses and 2 terminal statuses', () => {
    expect(VALID_ORDER_STATUSES).toEqual([
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ]);
    expect(TERMINAL_ORDER_STATUSES).toEqual(['delivered', 'cancelled']);
  });

  it('allows valid forward lifecycle transitions: pending -> confirmed -> shipped -> delivered', () => {
    expect(isValidTransition('pending', 'confirmed')).toBe(true);
    expect(isValidTransition('confirmed', 'shipped')).toBe(true);
    expect(isValidTransition('shipped', 'delivered')).toBe(true);
    expect(canTransition('pending', 'confirmed')).toBe(true);
  });

  it('allows cancellation from any active status (pending, confirmed, shipped)', () => {
    expect(isValidTransition('pending', 'cancelled')).toBe(true);
    expect(isValidTransition('confirmed', 'cancelled')).toBe(true);
    expect(isValidTransition('shipped', 'cancelled')).toBe(true);
  });

  it('strictly forbids transitions from terminal states', () => {
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    statuses.forEach((target) => {
      expect(isValidTransition('delivered', target)).toBe(false);
      expect(isValidTransition('cancelled', target)).toBe(false);
    });
    expect(getAllowedTransitions('delivered')).toEqual([]);
    expect(getAllowedTransitions('cancelled')).toEqual([]);
  });

  it('strictly forbids backward transitions and stage skipping', () => {
    expect(isValidTransition('pending', 'shipped')).toBe(false);
    expect(isValidTransition('pending', 'delivered')).toBe(false);
    expect(isValidTransition('confirmed', 'pending')).toBe(false);
    expect(isValidTransition('confirmed', 'delivered')).toBe(false);
    expect(isValidTransition('shipped', 'pending')).toBe(false);
    expect(isValidTransition('shipped', 'confirmed')).toBe(false);
  });

  it('assertValidTransition throws actionable French error for terminal orders', () => {
    expect(() => assertValidTransition('delivered', 'cancelled')).toThrowError(
      /Impossible de modifier une commande clôturée/
    );
    expect(() => assertValidTransition('cancelled', 'confirmed')).toThrowError(
      /Impossible de modifier une commande clôturée/
    );
  });

  it('assertValidTransition throws actionable French error for illegal state transitions', () => {
    expect(() => assertValidTransition('pending', 'delivered')).toThrowError(
      /Transition de statut invalide : passage de "pending" vers "delivered" interdit/
    );
  });

  it('normalizes cancellation reasons across formats', () => {
    expect(normalizeCancellationReason('CUSTOMER_CANCELLED')).toBe('customer_cancelled');
    expect(normalizeCancellationReason('UNREACHABLE_AFTER_CALLS')).toBe('customer_unreachable');
    expect(normalizeCancellationReason('fake-order')).toBe('invalid_phone');
    expect(normalizeCancellationReason('custom reason')).toBe('custom reason');
    expect(normalizeCancellationReason(undefined)).toBeUndefined();
  });

  it('provides French labels and configurations for all 5 statuses', () => {
    VALID_ORDER_STATUSES.forEach((status) => {
      expect(STATUS_LABELS_FR[status]).toBeTruthy();
      expect(STATUS_CONFIG[status]).toBeDefined();
      expect(STATUS_CONFIG[status].badgeClass).toBeTruthy();
      expect(STATUS_CONFIG[status].label).toBe(STATUS_LABELS_FR[status]);
    });
  });

  it('provides standard cancellation reasons dictionary', () => {
    expect(CANCELLATION_REASONS.length).toBeGreaterThanOrEqual(5);
    const codes = CANCELLATION_REASONS.map((r) => r.code);
    expect(codes).toContain('customer_cancelled');
    expect(codes).toContain('customer_unreachable');
    expect(codes).toContain('out_of_stock');
  });

  it('supports deleteOrder via MockSeedDataProvider with true/false return values', async () => {
    const { MockSeedDataProvider } = await import('@/lib/data-provider/mock-provider');
    const store = new MockSeedDataProvider();
    const created = await store.createOrder({
      customer: {
        fullName: 'Test Delete',
        phone: '0550123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Hydra',
        address: 'Rue 1',
        deliveryType: 'home',
      },
      items: [
        {
          productId: 'prod-suit-01',
          title: 'Veste Test',
          slug: 'veste-test',
          price: 10000,
          quantity: 1,
          selectedSize: 'L',
        },
      ],
      deliveryFee: 400,
      paymentMethod: 'cod',
    });

    expect(await store.getOrderById(created.id)).toBeDefined();

    const deleted = await store.deleteOrder(created.id);
    expect(deleted).toBe(true);

    expect(await store.getOrderById(created.id)).toBeNull();

    // Deleting again or non-existent returns false
    const deletedAgain = await store.deleteOrder(created.id);
    expect(deletedAgain).toBe(false);
  });
});
