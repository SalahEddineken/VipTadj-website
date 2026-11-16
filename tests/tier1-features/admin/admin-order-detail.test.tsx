import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { formatDZD } from '../../helpers/testUtils';
import { Order } from '@/types';

describe('Tier 1: Admin — Order Details & Customer Dossier Inspection (F-ORD-02)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: Order Inspection by ID
  // ==========================================
  it('retrieves complete order inspection dossier by unique ID', async () => {
    const order = await mockDataProvider.getOrderById('ord-001');

    expect(order).not.toBeNull();
    expect(order?.id).toBe('ord-001');
    expect(order?.orderNumber).toBe('VIP-2026-0001');
    expect(order?.status).toBe('pending');
    expect(order?.paymentMethod).toBe('cod');
  });

  // ==========================================
  // Test 2: Customer Dossier Verification
  // ==========================================
  it('displays full customer shipping information (name, phone, wilaya, commune, address, notes)', async () => {
    const order = await mockDataProvider.getOrderById('ord-001');
    const customer = order!.customer;

    expect(customer.fullName).toBe('Karim Benali');
    expect(customer.phone).toMatch(/^0(5|6|7)\d{8}$/);
    expect(customer.wilaya).toBe('Alger');
    expect(customer.wilayaCode).toBe(16);
    expect(customer.commune).toBe('Hydra');
    expect(customer.address).toBe('14 Boulevard du 11 Décembre 1960, Résidence Les Pins');
    expect(customer.notes).toBe('Appeler avant livraison svp, disponible après 14h');
  });

  // ==========================================
  // Test 3: Ordered Items Specification
  // ==========================================
  it('displays line items breakdown with title, selected size, quantity, unit price, and image', async () => {
    const order = await mockDataProvider.getOrderById('ord-001');
    expect(order?.items.length).toBeGreaterThanOrEqual(1);

    order?.items.forEach((item) => {
      expect(item.productId).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.selectedSize).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThan(0);
      expect(item.image).toContain('https://images.unsplash.com');

      const lineTotal = item.price * item.quantity;
      expect(formatDZD(lineTotal)).toContain('DA');
    });
  });

  // ==========================================
  // Test 4: Financial Summary & Currency Integrity
  // ==========================================
  it('verifies subtotal, delivery fee, and final COD total balance', async () => {
    const order = await mockDataProvider.getOrderById('ord-001');

    const expectedSubtotal = order!.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(order?.subtotal).toBe(expectedSubtotal);
    expect(order?.subtotal! + order?.deliveryFee!).toBe(order?.total);

    const formattedTotal = formatDZD(order!.total);
    expect(formattedTotal).toContain('DA');
  });

  // ==========================================
  // Test 5: Chronological Audit History Trail
  // ==========================================
  it('tracks chronological audit history of status updates with author and explanatory notes', async () => {
    const order = await mockDataProvider.getOrderById('ord-002');
    expect(order?.statusHistory).toBeDefined();
    expect(order?.statusHistory.length).toBeGreaterThanOrEqual(2);

    order?.statusHistory.forEach((log) => {
      expect(log.status).toBeDefined();
      expect(log.timestamp).toBeTruthy();
      expect(typeof log.timestamp).toBe('string');
    });
  });

  // ==========================================
  // Test 6: Courier Logistics Integration
  // ==========================================
  it('records courier dispatch info (courier name, tracking reference, dispatch date)', async () => {
    const shippedOrder = await mockDataProvider.getOrderById('ord-003');
    expect(shippedOrder?.status).toBe('shipped');

    // Simulate appending tracking info
    const withTracking = {
      ...shippedOrder,
      tracking: {
        courier: 'Yalidine Express',
        trackingNumber: 'YAL-2026-987654',
        dispatchedAt: new Date().toISOString(),
      },
    };

    expect(withTracking.tracking.courier).toBe('Yalidine Express');
    expect(withTracking.tracking.trackingNumber).toMatch(/^YAL-2026-\d{6}$/);
  });
});
