import { describe, it, expect, beforeEach } from 'vitest';
import { ordersFixture } from '../../fixtures/orders.fixture';
import { formatDZD } from '../../helpers/testUtils';
import { Order, OrderStatus } from '@/types';

describe('Tier 1: Admin — Command Center & Dashboard KPIs (F-ADM-02)', () => {
  // Helper to calculate admin dashboard KPI metrics
  function computeAdminKPIs(orders: Order[]) {
    // Orders contributing to revenue: confirmed, shipped, delivered
    const revenueOrders = orders.filter((o) =>
      ['confirmed', 'shipped', 'delivered'].includes(o.status)
    );
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + o.total, 0);

    // Pending orders requiring phone confirmation
    const pendingOrders = orders.filter((o) => o.status === 'pending');
    const pendingCount = pendingOrders.length;

    // In-flight fulfillment (confirmed + shipped)
    const inFlightOrders = orders.filter((o) =>
      ['confirmed', 'shipped'].includes(o.status)
    );
    const inFlightCount = inFlightOrders.length;

    // Average Order Value (AOV)
    const aov = revenueOrders.length > 0 ? Math.round(totalRevenue / revenueOrders.length) : 0;

    // Delivered count & cancelled count
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

    return {
      totalRevenue,
      pendingCount,
      inFlightCount,
      aov,
      deliveredCount,
      cancelledCount,
      totalOrdersCount: orders.length,
    };
  }

  // ==========================================
  // Test 1: Total Revenue Calculation in DZD
  // ==========================================
  it('calculates total revenue from confirmed, shipped, and delivered orders, excluding cancelled', () => {
    const kpis = computeAdminKPIs(ordersFixture);

    expect(kpis.totalRevenue).toBeGreaterThan(0);
    expect(Number.isInteger(kpis.totalRevenue)).toBe(true);

    const formattedRevenue = formatDZD(kpis.totalRevenue);
    expect(formattedRevenue).toContain('DA');

    // Verify cancelled orders are excluded from revenue
    const cancelledOrderTotal = ordersFixture
      .filter((o) => o.status === 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);

    const allOrdersSum = ordersFixture.reduce((sum, o) => sum + o.total, 0);
    expect(kpis.totalRevenue).toBeLessThan(allOrdersSum);
    expect(allOrdersSum - cancelledOrderTotal).toBeGreaterThanOrEqual(kpis.totalRevenue);
  });

  // ==========================================
  // Test 2: Pending Orders Alert Count
  // ==========================================
  it('accurately tallies pending orders requiring urgent telephone validation', () => {
    const kpis = computeAdminKPIs(ordersFixture);

    expect(kpis.pendingCount).toBeGreaterThanOrEqual(1);

    const manualPendingCount = ordersFixture.filter((o) => o.status === 'pending').length;
    expect(kpis.pendingCount).toBe(manualPendingCount);
  });

  // ==========================================
  // Test 3: Average Order Value (AOV)
  // ==========================================
  it('calculates Average Order Value (AOV) in DZD across active revenue orders', () => {
    const kpis = computeAdminKPIs(ordersFixture);

    expect(kpis.aov).toBeGreaterThan(0);
    expect(kpis.aov).toBeGreaterThanOrEqual(9500); // At least lowest product price
    const formattedAov = formatDZD(kpis.aov);
    expect(formattedAov).toContain('DA');
  });

  // ==========================================
  // Test 4: In-Flight Fulfillment Counter
  // ==========================================
  it('accurately computes in-flight fulfillment volume (confirmed + shipped orders in courier network)', () => {
    const kpis = computeAdminKPIs(ordersFixture);

    const manualInFlight = ordersFixture.filter((o) =>
      ['confirmed', 'shipped'].includes(o.status)
    ).length;

    expect(kpis.inFlightCount).toBe(manualInFlight);
  });

  // ==========================================
  // Test 5: Delivered vs Cancelled Orders Breakdown
  // ==========================================
  it('tracks delivered completed orders and cancelled order loss metrics', () => {
    const kpis = computeAdminKPIs(ordersFixture);

    expect(kpis.deliveredCount).toBeGreaterThanOrEqual(1);
    expect(kpis.cancelledCount).toBeGreaterThanOrEqual(1);
    expect(kpis.deliveredCount + kpis.cancelledCount + kpis.inFlightCount + kpis.pendingCount).toBe(
      kpis.totalOrdersCount
    );
  });

  // ==========================================
  // Test 6: Zero State Handing
  // ==========================================
  it('handles empty orders dataset gracefully with zero revenue and zero AOV without NaN errors', () => {
    const emptyKpis = computeAdminKPIs([]);

    expect(emptyKpis.totalRevenue).toBe(0);
    expect(emptyKpis.aov).toBe(0);
    expect(emptyKpis.pendingCount).toBe(0);
    expect(emptyKpis.inFlightCount).toBe(0);
    expect(emptyKpis.totalOrdersCount).toBe(0);
    expect(isNaN(emptyKpis.aov)).toBe(false);
  });
});
