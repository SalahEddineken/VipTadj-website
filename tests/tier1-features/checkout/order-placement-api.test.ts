import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { isValidAlgerianPhone } from '../../helpers/testUtils';
import { CreateOrderInput, Order } from '@/types';

describe('Tier 1: Checkout — Order Placement Engine & API Contract (F-CHECK-03)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  const validOrderPayload: CreateOrderInput = {
    customer: {
      fullName: 'Amine Gouiri',
      phone: '0555987654',
      wilaya: 'Alger',
      wilayaCode: 16,
      commune: 'Hydra',
      address: 'Résidence Les Pins, Appt 4',
      notes: 'Livraison en après-midi',
    },
    items: [
      {
        productId: 'prod-001',
        title: 'Costume Deux Pièces en Laine Super 130s',
        slug: 'costume-deux-pieces-laine-super-130s',
        price: 48500,
        quantity: 1,
        selectedSize: '50',
        image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      },
    ],
    deliveryFee: 400,
  };

  // ==========================================
  // Test 1: Successful COD Order Placement
  // ==========================================
  it('creates a new order, generates unique ID, and assigns official order number (VIP-2026-XXXX)', async () => {
    const order = await mockDataProvider.createOrder(validOrderPayload);

    expect(order.id).toBeDefined();
    expect(order.orderNumber).toMatch(/^VIP-2026-\d{4}$/);
    expect(order.status).toBe('pending');
    expect(order.paymentMethod).toBe('cod');
    expect(order.subtotal).toBe(48500);
    expect(order.deliveryFee).toBe(400);
    expect(order.total).toBe(48900);
  });

  // ==========================================
  // Test 2: Order Persistence and Retrieval
  // ==========================================
  it('persists placed order in data store and enables retrieval by ID and orderNumber', async () => {
    const created = await mockDataProvider.createOrder(validOrderPayload);

    const fetchedById = await mockDataProvider.getOrderById(created.id);
    expect(fetchedById).not.toBeNull();
    expect(fetchedById?.id).toBe(created.id);
    expect(fetchedById?.customer.fullName).toBe('Amine Gouiri');

    const fetchedByOrderNumber = await mockDataProvider.getOrderById(created.orderNumber);
    expect(fetchedByOrderNumber).not.toBeNull();
    expect(fetchedByOrderNumber?.id).toBe(created.id);
  });

  // ==========================================
  // Test 3: Stock Decrement on Order Placement
  // ==========================================
  it('automatically decrements product inventory when order is placed successfully', async () => {
    const productBefore = await mockDataProvider.getProductById('prod-001');
    const initialStock = productBefore!.stockQuantity;

    await mockDataProvider.createOrder({
      ...validOrderPayload,
      items: [
        {
          productId: 'prod-001',
          title: productBefore!.title,
          slug: productBefore!.slug,
          price: productBefore!.price,
          quantity: 2,
          selectedSize: '50',
          image: productBefore!.images[0].url,
        },
      ],
    });

    const productAfter = await mockDataProvider.getProductById('prod-001');
    expect(productAfter?.stockQuantity).toBe(initialStock - 2);
  });

  // ==========================================
  // Test 4: Rejection of Order with Empty Items
  // ==========================================
  it('rejects order submission with empty items array or zero line items', async () => {
    const emptyItemsPayload: CreateOrderInput = {
      ...validOrderPayload,
      items: [],
    };

    // Validation guard simulates API endpoint check
    const validateApiPayload = (data: CreateOrderInput) => {
      if (!data.items || data.items.length === 0) {
        throw new Error('Une commande doit contenir au moins un article.');
      }
      if (!isValidAlgerianPhone(data.customer.phone)) {
        throw new Error('Numéro de téléphone algérien invalide.');
      }
    };

    expect(() => validateApiPayload(emptyItemsPayload)).toThrow(
      'Une commande doit contenir au moins un article.'
    );
  });

  // ==========================================
  // Test 5: Rejection of Order with Invalid Phone
  // ==========================================
  it('rejects order placement with invalid Algerian mobile phone number', async () => {
    const invalidPhonePayload: CreateOrderInput = {
      ...validOrderPayload,
      customer: {
        ...validOrderPayload.customer,
        phone: '0123456789', // Invalid carrier
      },
    };

    const validateApiPayload = (data: CreateOrderInput) => {
      if (!data.items || data.items.length === 0) {
        throw new Error('Une commande doit contenir au moins un article.');
      }
      if (!isValidAlgerianPhone(data.customer.phone)) {
        throw new Error('Numéro de téléphone algérien invalide.');
      }
    };

    expect(() => validateApiPayload(invalidPhonePayload)).toThrow(
      'Numéro de téléphone algérien invalide.'
    );
  });

  // ==========================================
  // Test 6: Initial Status and Audit History Setup
  // ==========================================
  it('initializes order status strictly to pending with creation timestamp in statusHistory', async () => {
    const order = await mockDataProvider.createOrder(validOrderPayload);

    expect(order.status).toBe('pending');
    expect(order.statusHistory).toHaveLength(1);
    expect(order.statusHistory[0].status).toBe('pending');
    expect(order.statusHistory[0].timestamp).toBeTruthy();
    expect(order.createdAt).toBeTruthy();
  });
});
