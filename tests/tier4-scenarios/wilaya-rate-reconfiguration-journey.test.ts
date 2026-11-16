import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import {
  calculateSubtotal,
  calculateDeliveryFee,
  calculateTotal,
  formatDZD,
} from '../helpers/testUtils';
import { getWilayaByCode } from '../fixtures/wilayas.fixture';

describe('Tier 4: Scenario Journey 5 — Wilaya Shipping Rate Reconfiguration (wilaya-rate-reconfiguration-journey.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  it('executes full Journey 5: Admin Updates Oran Fee & Threshold -> Shopper Sees New 550 DA Fee -> Crosses 20k Threshold -> Free Delivery', async () => {
    // ========================================================
    // Step 1: Initial Store Settings State
    // ========================================================
    const initialSettings = await mockDataProvider.getSettings();
    expect(initialSettings.freeShippingThreshold).toBe(15000);
    expect(initialSettings.wilayaShippingFees[31].homeFee).toBe(600);

    // ========================================================
    // Step 2: Store Manager Updates Settings under /admin/settings
    // ========================================================
    const updatedWilayaFees = { ...initialSettings.wilayaShippingFees };
    updatedWilayaFees[31] = {
      ...updatedWilayaFees[31],
      homeFee: 550, // Reduced from 600 to 550 DA
      deskFee: 320,
    };

    const newThreshold = 20000; // Increased from 15,000 to 20,000 DA

    const savedSettings = await mockDataProvider.updateSettings({
      freeShippingThreshold: newThreshold,
      wilayaShippingFees: updatedWilayaFees,
    });

    expect(savedSettings.freeShippingThreshold).toBe(20000);
    expect(savedSettings.wilayaShippingFees[31].homeFee).toBe(550);

    // ========================================================
    // Step 3: Customer from Oran Builds an 18,000 DA Cart
    // ========================================================
    // Under old threshold (15,000), 18,000 was free.
    // Under new threshold (20,000), 18,000 must pay the new 550 DA fee!
    const cartItems = [
      { price: 18000, quantity: 1, title: 'Veste Casual Laine', selectedSize: '50' },
    ];
    let subtotal = calculateSubtotal(cartItems);
    expect(subtotal).toBe(18000);

    // Query active fee for Oran (code 31) from updated settings
    const activeSettings = await mockDataProvider.getSettings();
    const oranFeeConfig = activeSettings.wilayaShippingFees[31];
    expect(oranFeeConfig.homeFee).toBe(550);

    // Fee calculation using updated settings values
    let deliveryFee = subtotal >= activeSettings.freeShippingThreshold ? 0 : oranFeeConfig.homeFee;
    expect(deliveryFee).toBe(550); // Not 600 DA and not 0 DA!

    let total = calculateTotal(subtotal, deliveryFee);
    expect(total).toBe(18550);
    expect(formatDZD(total)).toContain('18');
    expect(formatDZD(total)).toContain('550');

    // ========================================================
    // Step 4: Customer Adds a 3,000 DA Accessory (Subtotal = 21,000 DA)
    // ========================================================
    cartItems.push({
      price: 3000,
      quantity: 1,
      title: 'Pochette de Costume en Soie',
      selectedSize: 'Unique',
    });

    subtotal = calculateSubtotal(cartItems);
    expect(subtotal).toBe(21000);

    // Now subtotal (21,000 DA) crosses the new threshold (20,000 DA)
    deliveryFee = subtotal >= activeSettings.freeShippingThreshold ? 0 : oranFeeConfig.homeFee;
    expect(deliveryFee).toBe(0); // Dynamically drops to 0 DA (Gratuit)

    total = calculateTotal(subtotal, deliveryFee);
    expect(total).toBe(21000);

    // ========================================================
    // Step 5: Customer Completes Order with Free Delivery in Oran
    // ========================================================
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Khaled Lemmouchia',
        phone: '0661332211',
        wilaya: 'Oran',
        wilayaCode: 31,
        commune: 'Maraval',
        address: 'Rue de la Victoire',
      },
      items: [
        {
          productId: 'prod-002',
          title: 'Veste Casual Laine',
          slug: 'veste-casual-laine',
          price: 18000,
          quantity: 1,
          selectedSize: '50',
          image: 'https://example.com/veste.jpg',
        },
        {
          productId: 'prod-016',
          title: 'Pochette de Costume en Soie',
          slug: 'pochette-costume-soie',
          price: 3000,
          quantity: 1,
          selectedSize: 'Unique',
          image: 'https://example.com/pochette.jpg',
        },
      ],
      deliveryFee,
      subtotal,
      total,
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
    expect(order.deliveryFee).toBe(0);
    expect(order.total).toBe(21000);
    expect(order.customer.wilayaCode).toBe(31);
  });
});
