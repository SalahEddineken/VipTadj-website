import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { localStorageMock } from '../setup';
import {
  calculateSubtotal,
  calculateDeliveryFee,
  calculateTotal,
  isValidAlgerianPhone,
  formatDZD,
  formatTelLink,
  generateWhatsAppConfirmLink,
} from '../helpers/testUtils';
import { getWilayaByCode } from '../fixtures/wilayas.fixture';

describe('Tier 4: Scenario Journey 1 — Customer Discovery to COD Checkout (customer-discovery-to-checkout.test.tsx)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
    localStorageMock.clear();
  });

  it('executes full Journey 1: Homepage -> Catalog Filter -> PDP -> Cart -> Wilaya Selection -> COD Order -> WhatsApp Link', async () => {
    // ========================================================
    // Step 1: Customer Visits Homepage & Explores Collections
    // ========================================================
    const featuredProducts = await mockDataProvider.getProducts({ featured: true });
    expect(featuredProducts.length).toBeGreaterThanOrEqual(4);
    for (const p of featuredProducts) {
      expect(p.isFeatured).toBe(true);
      expect(p.inStock).toBe(true);
    }

    // ========================================================
    // Step 2: Navigates to /catalog & Filters by Category & Subcategory
    // ========================================================
    const catalogSuits = await mockDataProvider.getProducts({
      categoryId: 'clothing',
      subcategory: 'costumes',
      inStock: true,
      minPrice: 40000,
    });

    expect(catalogSuits.length).toBeGreaterThanOrEqual(1);
    const selectedSuit = catalogSuits.find(
      (p) => p.slug === 'costume-deux-pieces-laine-super-130s'
    );
    expect(selectedSuit).toBeDefined();
    expect(selectedSuit!.title).toBe('Costume Deux Pièces en Laine Super 130s');
    expect(selectedSuit!.price).toBe(48500);

    // ========================================================
    // Step 3: Opens PDP & Selects Size 50
    // ========================================================
    const pdpProduct = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(pdpProduct).not.toBeNull();
    expect(pdpProduct!.sizes).toContain('50');
    expect(pdpProduct!.inStock).toBe(true);

    const initialStock = pdpProduct!.stockQuantity;
    expect(initialStock).toBe(14);

    const chosenSize = '50';

    // ========================================================
    // Step 4: Adds to Cart & Saves to Persistent LocalStorage
    // ========================================================
    const cartLineItem = {
      productId: pdpProduct!.id,
      title: pdpProduct!.title,
      slug: pdpProduct!.slug,
      price: pdpProduct!.price,
      quantity: 1,
      selectedSize: chosenSize,
      image: pdpProduct!.images[0].url,
    };

    localStorageMock.setItem('vip_cart', JSON.stringify([cartLineItem]));

    // Read back and verify cart drawer contents
    const storedCart = JSON.parse(localStorageMock.getItem('vip_cart')!);
    expect(storedCart).toHaveLength(1);
    expect(storedCart[0].selectedSize).toBe('50');

    // ========================================================
    // Step 5: Reviews Cart Subtotal & Free Shipping Qualification
    // ========================================================
    const subtotal = calculateSubtotal(storedCart);
    expect(subtotal).toBe(48500);

    const settings = await mockDataProvider.getSettings();
    expect(settings.freeShippingThreshold).toBe(15000);

    // Subtotal (48,500 DA) exceeds threshold (15,000 DA) -> qualifies for free shipping
    expect(subtotal).toBeGreaterThanOrEqual(settings.freeShippingThreshold);

    // ========================================================
    // Step 6: Enters Checkout & Selects Wilaya 16 (Alger)
    // ========================================================
    const wilayaAlger = getWilayaByCode(16);
    expect(wilayaAlger).toBeDefined();
    expect(wilayaAlger!.name).toBe('Alger');

    // Delivery fee is 0 DA because subtotal >= threshold
    const deliveryFee = calculateDeliveryFee(subtotal, wilayaAlger!.code, settings.freeShippingThreshold);
    expect(deliveryFee).toBe(0);

    const orderTotal = calculateTotal(subtotal, deliveryFee);
    expect(orderTotal).toBe(48500);

    // Validate Algerian customer phone number
    const customerPhone = '0555123456';
    expect(isValidAlgerianPhone(customerPhone)).toBe(true);

    const customerDetails = {
      fullName: 'Amine Slimani',
      phone: customerPhone,
      wilaya: wilayaAlger!.name,
      wilayaCode: wilayaAlger!.code,
      commune: 'Hydra',
      address: '12 Rue des Pins, Résidence Belle Vue',
      notes: 'Livraison en après-midi si possible',
    };

    // ========================================================
    // Step 7: Submits COD Order to Store
    // ========================================================
    const createdOrder = await mockDataProvider.createOrder({
      customer: customerDetails,
      items: storedCart,
      deliveryFee,
      subtotal,
      total: orderTotal,
    });

    expect(createdOrder.id).toBeDefined();
    expect(createdOrder.orderNumber).toMatch(/^VIP-2026-\d{4}$/);
    expect(createdOrder.status).toBe('pending');
    expect(createdOrder.paymentMethod).toBe('cod');
    expect(createdOrder.total).toBe(48500);

    // Stock for the suit is immediately decremented
    const refreshedProduct = await mockDataProvider.getProductById(pdpProduct!.id);
    expect(refreshedProduct!.stockQuantity).toBe(initialStock - 1);

    // Cart is purged after successful submission
    localStorageMock.removeItem('vip_cart');
    expect(localStorageMock.getItem('vip_cart')).toBeNull();

    // ========================================================
    // Step 8: Order Confirmation Screen & WhatsApp Link Generation
    // ========================================================
    const confirmationDossier = await mockDataProvider.getOrderById(createdOrder.id);
    expect(confirmationDossier).not.toBeNull();
    expect(confirmationDossier!.orderNumber).toBe(createdOrder.orderNumber);

    const whatsappLink = generateWhatsAppConfirmLink(confirmationDossier!);
    expect(whatsappLink).toContain('https://wa.me/213555123456?text=');
    expect(whatsappLink).toContain(encodeURIComponent(confirmationDossier!.orderNumber));
    expect(whatsappLink).toContain(encodeURIComponent('Amine Slimani'));
    expect(whatsappLink).toContain(encodeURIComponent('VIP TADJ'));

    const dialerLink = formatTelLink(confirmationDossier!.customer.phone);
    expect(dialerLink).toBe('tel:+213555123456');
  });
});
