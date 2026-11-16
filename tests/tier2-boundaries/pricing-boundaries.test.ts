import { describe, it, expect } from 'vitest';
import {
  formatDZD,
  parseDZD,
  calculateDeliveryFee,
  calculateTotal,
  calculateSubtotal,
} from '../helpers/testUtils';
import { getWilayaFee } from '../fixtures/wilayas.fixture';

describe('Tier 2: Boundary & Corner Cases — Pricing Boundaries (pricing-boundaries.test.ts)', () => {
  // ==========================================
  // 1. Free Shipping Threshold Boundary (14,999 vs 15,000 vs 15,001 DA)
  // ==========================================
  it('strictly enforces free shipping eligibility at exact threshold boundary (14,999 vs 15,000 vs 15,001 DA)', () => {
    const threshold = 15000;

    // Boundary 1: 1 DA below threshold -> Ineligible (pays standard fee)
    expect(calculateDeliveryFee(14999, 16, threshold)).toBe(400); // Alger
    expect(calculateDeliveryFee(14999, 31, threshold)).toBe(600); // Oran
    expect(calculateDeliveryFee(14999, 1, threshold)).toBe(900); // Adrar

    // Boundary 2: Exact threshold -> Eligible (Free shipping: 0 DA)
    expect(calculateDeliveryFee(15000, 16, threshold)).toBe(0);
    expect(calculateDeliveryFee(15000, 31, threshold)).toBe(0);
    expect(calculateDeliveryFee(15000, 1, threshold)).toBe(0);

    // Boundary 3: 1 DA above threshold -> Eligible (Free shipping: 0 DA)
    expect(calculateDeliveryFee(15001, 16, threshold)).toBe(0);
    expect(calculateDeliveryFee(15001, 31, threshold)).toBe(0);
    expect(calculateDeliveryFee(15001, 1, threshold)).toBe(0);
  });

  // ==========================================
  // 2. Custom & Dynamic Free Shipping Thresholds
  // ==========================================
  it('supports custom free shipping thresholds configured in store settings (e.g. 20,000 DA or 50,000 DA)', () => {
    const customThreshold = 20000;

    // Subtotal 18,000 DA would be free under 15,000 DA, but pays under 20,000 DA
    expect(calculateDeliveryFee(18000, 16, 15000)).toBe(0);
    expect(calculateDeliveryFee(18000, 16, customThreshold)).toBe(400);

    // 19,999 DA vs 20,000 DA
    expect(calculateDeliveryFee(19999, 31, customThreshold)).toBe(600);
    expect(calculateDeliveryFee(20000, 31, customThreshold)).toBe(0);
    expect(calculateDeliveryFee(25000, 1, customThreshold)).toBe(0);
  });

  // ==========================================
  // 3. Zero Fee and Discount Flooring
  // ==========================================
  it('handles 0 DA delivery fees and guarantees total is floored at 0 DA under heavy discounts', () => {
    // Zero delivery fee total
    const subtotal = 35000;
    const deliveryFee = 0;
    expect(calculateTotal(subtotal, deliveryFee)).toBe(35000);

    // Partial discount
    expect(calculateTotal(subtotal, deliveryFee, 5000)).toBe(30000);

    // Exact 100% discount
    expect(calculateTotal(subtotal, deliveryFee, 35000)).toBe(0);

    // Discount exceeding total is strictly floored at 0 (never negative balance)
    expect(calculateTotal(subtotal, deliveryFee, 50000)).toBe(0);
    expect(calculateTotal(1000, 400, 5000)).toBe(0);
  });

  // ==========================================
  // 4. Large DZD Currency Formatting (1,000,000+ DA)
  // ==========================================
  it('correctly formats and parses high-value luxury amounts (1,000,000+ DA) with non-breaking spaces', () => {
    const oneMillion = 1000000;
    const multiMillion = 12500000;

    const formatted1M = formatDZD(oneMillion);
    const formattedMulti = formatDZD(multiMillion);

    // Check formatting contains thousands separators and currency symbol
    expect(formatted1M).toContain('1');
    expect(formatted1M).toContain('000');
    expect(formatted1M).toContain('DA');

    expect(formattedMulti).toContain('12');
    expect(formattedMulti).toContain('500');
    expect(formattedMulti).toContain('000');
    expect(formattedMulti).toContain('DA');

    // Parse back guarantees round-trip integrity
    expect(parseDZD(formatted1M)).toBe(oneMillion);
    expect(parseDZD(formattedMulti)).toBe(multiMillion);
  });

  // ==========================================
  // 5. Decimal Rounding & Floating Point Precision
  // ==========================================
  it('handles floating point decimals and rounds to whole DZD currency units', () => {
    // Floating point amounts
    expect(formatDZD(48500.4)).toContain('48');
    expect(formatDZD(48500.4)).toContain('500');

    // 48500.6 rounds up to 48501
    expect(formatDZD(48500.6)).toContain('501');

    // Items with fractional quantities or percentage discounts
    const fractionalSubtotal = calculateSubtotal([
      { price: 48500, quantity: 1 },
      { price: 8500, quantity: 1 },
    ]);
    expect(fractionalSubtotal).toBe(57000);

    // Discount of 15% on 57,000 = 8,550
    const discount = Math.round(57000 * 0.15);
    expect(discount).toBe(8550);
    expect(calculateTotal(57000, 0, discount)).toBe(48450);
  });

  // ==========================================
  // 6. formatDZD Edge Cases (Zero, NaN, Undefined, Null)
  // ==========================================
  it('handles nullish, NaN, and zero edge cases safely in formatDZD and parseDZD', () => {
    expect(formatDZD(0)).toContain('0');
    expect(formatDZD(0)).toContain('DA');

    // @ts-expect-error Testing invalid runtime input
    expect(formatDZD(null)).toBe('0 DA');
    // @ts-expect-error Testing invalid runtime input
    expect(formatDZD(undefined)).toBe('0 DA');
    expect(formatDZD(NaN)).toBe('0 DA');

    // parseDZD edges
    expect(parseDZD('')).toBe(0);
    expect(parseDZD('gratuit')).toBe(0);
    expect(parseDZD('Total: 0 DA')).toBe(0);
    expect(parseDZD('DA')).toBe(0);
  });
});
