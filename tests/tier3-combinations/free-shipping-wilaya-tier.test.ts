import { describe, it, expect } from 'vitest';
import {
  wilayasFixture,
  getWilayaByCode,
  getWilayaFee,
} from '../fixtures/wilayas.fixture';
import { settingsFixture } from '../fixtures/settings.fixture';
import {
  calculateSubtotal,
  calculateDeliveryFee,
  calculateTotal,
  formatDZD,
} from '../helpers/testUtils';

describe('Tier 3: Combinations — Free Shipping & Wilaya Regional Tiers (free-shipping-wilaya-tier.test.ts)', () => {
  const baseThreshold = settingsFixture.freeShippingThreshold; // 15,000 DA

  // ==========================================
  // Combination 1: Southern Wilayas Maximum Shipping Saving
  // ==========================================
  it('delivers 900 DA cost savings to Grand Sud customers when cart qualifies for free shipping', () => {
    const sudWilayaCodes = [1, 11, 33, 37, 49, 50, 52, 53, 54, 56, 58]; // Adrar, Tam, Illizi, Tindouf, etc.
    const subtotalUnder = 14000;
    const subtotalOver = 18000;

    for (const code of sudWilayaCodes) {
      // Under threshold: customer must pay 900 DA
      const feeUnder = calculateDeliveryFee(subtotalUnder, code, baseThreshold);
      expect(feeUnder).toBe(900);
      expect(calculateTotal(subtotalUnder, feeUnder)).toBe(14900);

      // Over threshold: 900 DA fee completely waived
      const feeOver = calculateDeliveryFee(subtotalOver, code, baseThreshold);
      expect(feeOver).toBe(0);
      expect(calculateTotal(subtotalOver, feeOver)).toBe(18000);
    }
  });

  // ==========================================
  // Combination 2: Multi-Tier Fee Elimination Across All 6 Regional Zones
  // ==========================================
  it('waives shipping fee consistently across all 6 zones (Alger, Centre, Est, Ouest, Hauts-Plateaux, Sud)', () => {
    const zones = [
      { name: 'alger', sampleCode: 16, standardFee: 400 },
      { name: 'centre', sampleCode: 9, standardFee: 500 },
      { name: 'est', sampleCode: 25, standardFee: 600 },
      { name: 'ouest', sampleCode: 31, standardFee: 600 },
      { name: 'hauts-plateaux', sampleCode: 19, standardFee: 600 },
      { name: 'sud', sampleCode: 1, standardFee: 900 },
    ];

    const qualifyingCart = 15000; // Exact threshold

    for (const zone of zones) {
      // Confirm standard fee applies under threshold
      expect(calculateDeliveryFee(14999, zone.sampleCode, baseThreshold)).toBe(zone.standardFee);

      // Confirm 0 DA applies at threshold
      const fee = calculateDeliveryFee(qualifyingCart, zone.sampleCode, baseThreshold);
      expect(fee).toBe(0);
      expect(calculateTotal(qualifyingCart, fee)).toBe(15000);
    }
  });

  // ==========================================
  // Combination 3: Cart Add-Item Threshold Crossing Flow
  // ==========================================
  it('dynamically drops delivery fee to 0 DA when shopper adds accessory to cross 15,000 DA threshold', () => {
    const wilayaCode = 31; // Oran (600 DA)

    // Step 1: Customer has 1 chemise (12,500 DA)
    let cart = [{ price: 12500, quantity: 1 }];
    let subtotal = calculateSubtotal(cart);
    let fee = calculateDeliveryFee(subtotal, wilayaCode, baseThreshold);
    let total = calculateTotal(subtotal, fee);

    expect(subtotal).toBe(12500);
    expect(fee).toBe(600);
    expect(total).toBe(13100);

    // Step 2: Customer adds a silk tie (3,500 DA) to reach 16,000 DA
    cart.push({ price: 3500, quantity: 1 });
    subtotal = calculateSubtotal(cart);
    fee = calculateDeliveryFee(subtotal, wilayaCode, baseThreshold);
    total = calculateTotal(subtotal, fee);

    expect(subtotal).toBe(16000);
    expect(fee).toBe(0); // FREE SHIPPING!
    expect(total).toBe(16000);
  });

  // ==========================================
  // Combination 4: Cart Remove-Item Sub-Threshold Fallback
  // ==========================================
  it('re-applies standard delivery fee when an item removal brings subtotal below threshold', () => {
    const wilayaCode = 16; // Alger (400 DA)

    // Step 1: Qualifying subtotal (21,000 DA)
    let cart = [
      { price: 12500, quantity: 1 },
      { price: 8500, quantity: 1 },
    ];
    let subtotal = calculateSubtotal(cart);
    let fee = calculateDeliveryFee(subtotal, wilayaCode, baseThreshold);
    expect(fee).toBe(0);
    expect(calculateTotal(subtotal, fee)).toBe(21000);

    // Step 2: Customer removes the 8,500 DA item -> subtotal drops to 12,500 DA
    cart = [{ price: 12500, quantity: 1 }];
    subtotal = calculateSubtotal(cart);
    fee = calculateDeliveryFee(subtotal, wilayaCode, baseThreshold);

    expect(subtotal).toBe(12500);
    expect(fee).toBe(400); // 400 DA fee reinstated
    expect(calculateTotal(subtotal, fee)).toBe(12900);
  });

  // ==========================================
  // Combination 5: Reconfigured Threshold in Settings
  // ==========================================
  it('adapts fee calculation seamlessly when store updates threshold from 15,000 DA to 25,000 DA', () => {
    const newThreshold = 25000;
    const wilayaCode = 31; // Oran (600 DA)

    // 18,000 DA was free under old threshold, but pays fee under new threshold
    expect(calculateDeliveryFee(18000, wilayaCode, baseThreshold)).toBe(0);
    expect(calculateDeliveryFee(18000, wilayaCode, newThreshold)).toBe(600);

    // 25,000 DA qualifies for free delivery under new threshold
    expect(calculateDeliveryFee(25000, wilayaCode, newThreshold)).toBe(0);
    expect(calculateDeliveryFee(35000, wilayaCode, newThreshold)).toBe(0);
  });
});
