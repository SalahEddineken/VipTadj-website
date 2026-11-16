import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { localStorageMock } from '../setup';
import {
  calculateDeliveryFee,
  calculateTotal,
  isValidAlgerianPhone,
  formatDZD,
  formatTelLink,
  generateWhatsAppConfirmLink,
} from '../helpers/testUtils';
import { getWilayaByCode } from '../fixtures/wilayas.fixture';

describe('Tier 4: Scenario Journey 2 — 1-Click Express Direct Checkout (express-direct-checkout.test.tsx)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
    localStorageMock.clear();
  });

  it('executes full Journey 2: Shoe PDP -> Select Size 42 -> 1-Click "Commander directement" -> Instant COD Order', async () => {
    // ========================================================
    // Step 1: Shopper Lands Directly on Luxury Oxford Shoe PDP
    // ========================================================
    const shoeProduct = await mockDataProvider.getProductBySlug('richelieu-one-cut-cuir-veau');
    expect(shoeProduct).not.toBeNull();
    expect(shoeProduct!.title).toContain('Richelieu');
    expect(shoeProduct!.price).toBe(32000);
    expect(shoeProduct!.sizes).toContain('42');
    expect(shoeProduct!.inStock).toBe(true);

    const initialShoeStock = shoeProduct!.stockQuantity;

    // Existing shopping cart is empty or holds separate item
    expect(localStorageMock.getItem('vip_cart')).toBeNull();

    // ========================================================
    // Step 2: Selects Size 42 & Clicks "Commander directement"
    // ========================================================
    const selectedShoeSize = '42';
    const expressItem = {
      productId: shoeProduct!.id,
      title: shoeProduct!.title,
      slug: shoeProduct!.slug,
      price: shoeProduct!.price,
      quantity: 1,
      selectedSize: selectedShoeSize,
      image: shoeProduct!.images[0].url,
    };

    // Express flow bypasses the regular cart drawer completely
    expect(localStorageMock.getItem('vip_cart')).toBeNull();

    // ========================================================
    // Step 3: Streamlined 1-Page Checkout Opens with Express Item
    // ========================================================
    const oranWilaya = getWilayaByCode(31);
    expect(oranWilaya).toBeDefined();
    expect(oranWilaya!.name).toBe('Oran');
    expect(oranWilaya!.fee).toBe(600);

    const settings = await mockDataProvider.getSettings();
    const subtotal = expressItem.price * expressItem.quantity; // 32,000 DA
    const deliveryFee = calculateDeliveryFee(subtotal, oranWilaya!.code, settings.freeShippingThreshold);

    // 32,000 DA >= 15,000 DA threshold -> Delivery is FREE (0 DA)
    expect(deliveryFee).toBe(0);
    const total = calculateTotal(subtotal, deliveryFee);
    expect(total).toBe(32000);

    // ========================================================
    // Step 4: Customer Enters Shipping Details for Oran
    // ========================================================
    const customerPhone = '0661223344';
    expect(isValidAlgerianPhone(customerPhone)).toBe(true);

    const shippingInfo = {
      fullName: 'Youssef Belaili',
      phone: customerPhone,
      wilaya: oranWilaya!.name,
      wilayaCode: oranWilaya!.code,
      commune: 'Akid Lotfi',
      address: 'Boulevard du 1er Novembre, Bâtiment D, 4ème étage',
      notes: 'Commander directement depuis la page produit',
    };

    // ========================================================
    // Step 5: Submits Order Instantaneously
    // ========================================================
    const expressOrder = await mockDataProvider.createOrder({
      customer: shippingInfo,
      items: [expressItem],
      deliveryFee,
      subtotal,
      total,
    });

    expect(expressOrder.id).toBeDefined();
    expect(expressOrder.orderNumber).toMatch(/^VIP-2026-\d{4}$/);
    expect(expressOrder.status).toBe('pending');
    expect(expressOrder.paymentMethod).toBe('cod');
    expect(expressOrder.items).toHaveLength(1);
    expect(expressOrder.items[0].selectedSize).toBe('42');
    expect(expressOrder.items[0].productId).toBe(shoeProduct!.id);

    // Standard cart in storage was never touched
    expect(localStorageMock.getItem('vip_cart')).toBeNull();

    // Inventory was decremented immediately
    const updatedShoe = await mockDataProvider.getProductById(shoeProduct!.id);
    expect(updatedShoe!.stockQuantity).toBe(initialShoeStock - 1);

    // ========================================================
    // Step 6: Confirmation Dossier & WhatsApp Generator
    // ========================================================
    const savedOrder = await mockDataProvider.getOrderById(expressOrder.id);
    expect(savedOrder).not.toBeNull();
    expect(savedOrder!.customer.fullName).toBe('Youssef Belaili');

    const waLink = generateWhatsAppConfirmLink(savedOrder!);
    expect(waLink).toContain('https://wa.me/213661223344?text=');
    expect(waLink).toContain(encodeURIComponent(savedOrder!.orderNumber));
    expect(waLink).toContain(encodeURIComponent('Taille 42'));

    const telLink = formatTelLink(savedOrder!.customer.phone);
    expect(telLink).toBe('tel:+213661223344');
  });

  it('executes express checkout for an item below the free shipping threshold and applies Wilaya fee', async () => {
    // 1. Accessory item under 15,000 DA threshold
    const tie = await mockDataProvider.getProductBySlug('cravate-soie-jacquard-sept-plis');
    expect(tie).not.toBeNull();
    expect(tie!.price).toBe(8500);

    const wilayaAdrar = getWilayaByCode(1)!; // Fee 900 DA
    const settings = await mockDataProvider.getSettings();

    const subtotal = tie!.price;
    const deliveryFee = calculateDeliveryFee(subtotal, wilayaAdrar.code, settings.freeShippingThreshold);
    expect(deliveryFee).toBe(900);
    const total = calculateTotal(subtotal, deliveryFee);
    expect(total).toBe(8500 + 900);

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Ismaël Bennacer',
        phone: '0770889900',
        wilaya: wilayaAdrar.name,
        wilayaCode: wilayaAdrar.code,
        commune: 'Adrar Centre',
        address: 'Rue de la Palmeraie',
      },
      items: [
        {
          productId: tie!.id,
          title: tie!.title,
          slug: tie!.slug,
          price: tie!.price,
          quantity: 1,
          selectedSize: 'Unique',
          image: tie!.images[0].url,
        },
      ],
      deliveryFee,
      subtotal,
      total,
    });

    expect(order.deliveryFee).toBe(900);
    expect(order.total).toBe(9400);
    expect(order.status).toBe('pending');
  });
});
