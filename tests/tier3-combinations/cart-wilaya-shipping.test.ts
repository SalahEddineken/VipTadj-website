import { describe, it, expect, beforeEach } from 'vitest';
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
import { productsFixture } from '../fixtures/products.fixture';

describe('Tier 3: Combinations — Cart Subtotal & 58 Wilaya Delivery Matrix (cart-wilaya-shipping.test.ts)', () => {
  const threshold = settingsFixture.freeShippingThreshold; // 15,000 DA

  // ==========================================
  // Combination 1: Under-Threshold Cart across All Regional Tiers
  // ==========================================
  it('combines under-threshold cart subtotal with each of the 58 Wilaya delivery fees', () => {
    // 1 Chemise Popeline (8,500 DA) < 15,000 DA threshold
    const items = [{ price: 8500, quantity: 1 }];
    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(8500);

    // Test across distinct regional zones:
    // 1. Alger (Zone Alger, Code 16) -> 400 DA
    const feeAlger = calculateDeliveryFee(subtotal, 16, threshold);
    expect(feeAlger).toBe(400);
    expect(calculateTotal(subtotal, feeAlger)).toBe(8900);

    // 2. Blida (Zone Centre, Code 9) -> 500 DA
    const feeBlida = calculateDeliveryFee(subtotal, 9, threshold);
    expect(feeBlida).toBe(500);
    expect(calculateTotal(subtotal, feeBlida)).toBe(9000);

    // 3. Oran (Zone Ouest, Code 31) -> 600 DA
    const feeOran = calculateDeliveryFee(subtotal, 31, threshold);
    expect(feeOran).toBe(600);
    expect(calculateTotal(subtotal, feeOran)).toBe(9100);

    // 4. Constantine (Zone Est, Code 25) -> 600 DA
    const feeConstantine = calculateDeliveryFee(subtotal, 25, threshold);
    expect(feeConstantine).toBe(600);
    expect(calculateTotal(subtotal, feeConstantine)).toBe(9100);

    // 5. Sétif (Zone Hauts-Plateaux, Code 19) -> 600 DA
    const feeSetif = calculateDeliveryFee(subtotal, 19, threshold);
    expect(feeSetif).toBe(600);
    expect(calculateTotal(subtotal, feeSetif)).toBe(9100);

    // 6. Adrar & Tamanrasset (Zone Sud, Codes 1 & 11) -> 900 DA
    const feeAdrar = calculateDeliveryFee(subtotal, 1, threshold);
    const feeTam = calculateDeliveryFee(subtotal, 11, threshold);
    expect(feeAdrar).toBe(900);
    expect(feeTam).toBe(900);
    expect(calculateTotal(subtotal, feeAdrar)).toBe(9400);
  });

  // ==========================================
  // Combination 2: Free Shipping Threshold Waiver across All 58 Wilayas
  // ==========================================
  it('waives shipping fee across ALL 58 Wilayas when cart subtotal meets or exceeds 15,000 DA', () => {
    // 1 Costume Laine Super 130s (48,500 DA) > 15,000 DA threshold
    const items = [{ price: 48500, quantity: 1 }];
    const subtotal = calculateSubtotal(items);

    // Check all 58 wilayas individually
    for (let code = 1; code <= 58; code++) {
      const fee = calculateDeliveryFee(subtotal, code, threshold);
      expect(fee).toBe(0);
      expect(calculateTotal(subtotal, fee)).toBe(subtotal);
    }
  });

  // ==========================================
  // Combination 3: Dynamic Threshold Crossing via Quantity Modification
  // ==========================================
  it('dynamically drops delivery fee from standard rate to 0 DA when cart quantity crosses threshold', () => {
    const unitPrice = 8500;
    const wilayaCode = 31; // Oran (600 DA standard fee)

    // Step 1: 1 unit = 8,500 DA -> pays 600 DA delivery
    let items = [{ price: unitPrice, quantity: 1 }];
    let subtotal = calculateSubtotal(items);
    let fee = calculateDeliveryFee(subtotal, wilayaCode, threshold);
    expect(fee).toBe(600);
    expect(calculateTotal(subtotal, fee)).toBe(9100);

    // Step 2: Customer increments quantity to 2 -> 17,000 DA -> Free delivery!
    items = [{ price: unitPrice, quantity: 2 }];
    subtotal = calculateSubtotal(items);
    fee = calculateDeliveryFee(subtotal, wilayaCode, threshold);
    expect(fee).toBe(0);
    expect(calculateTotal(subtotal, fee)).toBe(17000);

    // Step 3: Customer decrements back to 1 -> Fee reinstated
    items = [{ price: unitPrice, quantity: 1 }];
    subtotal = calculateSubtotal(items);
    fee = calculateDeliveryFee(subtotal, wilayaCode, threshold);
    expect(fee).toBe(600);
    expect(calculateTotal(subtotal, fee)).toBe(9100);
  });

  // ==========================================
  // Combination 4: Home Delivery vs Desk Delivery Pricing Matrix
  // ==========================================
  it('combines cart subtotal with desk delivery fee vs home delivery fee selection', () => {
    const items = [{ price: 12500, quantity: 1 }]; // Under threshold
    const subtotal = calculateSubtotal(items);

    const alger = getWilayaByCode(16)!;
    const oran = getWilayaByCode(31)!;
    const adrar = getWilayaByCode(1)!;

    // Home vs Desk for Alger (400 vs 250)
    expect(calculateTotal(subtotal, alger.fee)).toBe(12900);
    expect(calculateTotal(subtotal, alger.deskFee!)).toBe(12750);

    // Home vs Desk for Oran (600 vs 350)
    expect(calculateTotal(subtotal, oran.fee)).toBe(13100);
    expect(calculateTotal(subtotal, oran.deskFee!)).toBe(12850);

    // Home vs Desk for Adrar (900 vs 500)
    expect(calculateTotal(subtotal, adrar.fee)).toBe(13400);
    expect(calculateTotal(subtotal, adrar.deskFee!)).toBe(13000);
  });

  // ==========================================
  // Combination 5: Multi-Category Cart with Promotional Discount Interaction
  // ==========================================
  it('calculates total for multi-category luxury basket with wilaya shipping and coupon discount', () => {
    // Multi-category basket: 1 suit + 1 shirt + 1 tie
    const items = [
      { price: 48500, quantity: 1 }, // Clothing
      { price: 8500, quantity: 1 },  // Clothing
      { price: 4500, quantity: 1 },  // Accessories
    ];
    const subtotal = calculateSubtotal(items); // 61,500 DA
    expect(subtotal).toBe(61500);

    // Free delivery qualified
    const deliveryFee = calculateDeliveryFee(subtotal, 16, threshold);
    expect(deliveryFee).toBe(0);

    // Apply VIP Welcome Coupon (5,000 DA off)
    const discount = 5000;
    const finalTotal = calculateTotal(subtotal, deliveryFee, discount);
    expect(finalTotal).toBe(56500);
    expect(formatDZD(finalTotal)).toContain('56');
    expect(formatDZD(finalTotal)).toContain('500');
  });
});
