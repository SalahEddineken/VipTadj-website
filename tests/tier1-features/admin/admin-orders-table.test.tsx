import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { Order, OrderStatus } from '@/types';

describe('Tier 1: Admin — Sales Orders Fulfillment Table (F-ORD-01)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: Complete Orders Table Display
  // ==========================================
  it('retrieves and displays order rows with order number, customer, wilaya, total, and status', async () => {
    const orders = await mockDataProvider.getOrders();
    expect(orders.length).toBeGreaterThanOrEqual(5);

    orders.forEach((o: Order) => {
      expect(o.id).toBeTruthy();
      expect(o.orderNumber).toMatch(/^VIP-2026-\d{4}$/);
      expect(o.customer.fullName).toBeTruthy();
      expect(o.customer.phone).toBeTruthy();
      expect(o.customer.wilaya).toBeTruthy();
      expect(o.total).toBeGreaterThan(0);
      expect(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).toContain(o.status);
    });
  });

  // ==========================================
  // Test 2: Filter by Status Tabs (Pending)
  // ==========================================
  it('filters orders table by status tab: pending (incoming orders awaiting confirmation)', async () => {
    const pendingOrders = await mockDataProvider.getOrders({ status: 'pending' });
    expect(pendingOrders.length).toBeGreaterThanOrEqual(1);
    pendingOrders.forEach((o) => expect(o.status).toBe('pending'));
  });

  // ==========================================
  // Test 3: Filter by Status Tabs (Confirmed, Shipped, Delivered, Cancelled)
  // ==========================================
  it('filters orders table across all lifecycle status tabs accurately', async () => {
    const statuses: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled'];

    for (const status of statuses) {
      const filtered = await mockDataProvider.getOrders({ status });
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      filtered.forEach((o) => expect(o.status).toBe(status));
    }
  });

  // ==========================================
  // Test 4: Search Orders by Customer Name
  // ==========================================
  it('searches orders by customer full name with case-insensitive matching', async () => {
    const all = await mockDataProvider.getOrders();
    const targetCustomerName = all[0].customer.fullName;
    const searchToken = targetCustomerName.split(' ')[0].toLowerCase();

    const results = await mockDataProvider.getOrders({ search: searchToken });
    expect(results.length).toBeGreaterThanOrEqual(1);
    const matchesTarget = results.some((o) =>
      o.customer.fullName.toLowerCase().includes(searchToken)
    );
    expect(matchesTarget).toBe(true);
  });

  // ==========================================
  // Test 5: Search Orders by Order Number
  // ==========================================
  it('searches orders by unique order reference number (e.g. VIP-2026-0001)', async () => {
    const results = await mockDataProvider.getOrders({ search: 'VIP-2026-0001' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].orderNumber).toBe('VIP-2026-0001');
  });

  // ==========================================
  // Test 6: Search Orders by Customer Phone
  // ==========================================
  it('searches orders by customer mobile phone number', async () => {
    const all = await mockDataProvider.getOrders();
    const phoneToken = all[0].customer.phone.substring(0, 6);

    const results = await mockDataProvider.getOrders({ search: phoneToken });
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].customer.phone).toContain(phoneToken);
  });

  // ==========================================
  // Test 7: Chronological Sorting
  // ==========================================
  it('sorts orders chronologically with most recent orders listed first', async () => {
    const orders = await mockDataProvider.getOrders();

    for (let i = 0; i < orders.length - 1; i++) {
      const currentTimestamp = new Date(orders[i].createdAt).getTime();
      const nextTimestamp = new Date(orders[i + 1].createdAt).getTime();
      expect(currentTimestamp).toBeGreaterThanOrEqual(nextTimestamp);
    }
  });
});
