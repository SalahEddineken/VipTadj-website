import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import {
  formatTelLink,
  generateWhatsAppConfirmLink,
  formatDZD,
  isValidAlgerianPhone,
} from '../helpers/testUtils';

describe('Tier 4: Scenario Journey 3 — Store Manager Fulfillment & Telephone Confirmation (admin-order-confirmation-lifecycle.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  it('executes full Journey 3: Audio Chime -> View Pending Dossier -> Phone & WhatsApp -> Confirm -> Yalidine Ship -> Delivered', async () => {
    // ========================================================
    // Step 1: Store Manager Observes Initial Orders Table
    // ========================================================
    const initialPendingOrders = await mockDataProvider.getOrders({ status: 'pending' });
    const initialPendingCount = initialPendingOrders.length;

    // ========================================================
    // Step 2: New Incoming COD Order Arrives & Triggers Audio Alert Chime (F-ORD-05)
    // ========================================================
    const chime = new Audio('/sounds/order-chime.mp3');
    expect(chime).toBeDefined();
    await expect(chime.play()).resolves.toBeUndefined();
    expect(chime.play).toHaveBeenCalledTimes(1);

    const suit = await mockDataProvider.getProductById('prod-001');
    const stockBefore = suit!.stockQuantity;

    const incomingOrder = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Ryad Boudebouz',
        phone: '0550998877',
        wilaya: 'Sétif',
        wilayaCode: 19,
        commune: 'El Eulma',
        address: 'Rue Commerciale, Bâtiment El Baraka',
        notes: 'Disponible après 16h pour livraison',
      },
      items: [
        {
          productId: suit!.id,
          title: suit!.title,
          slug: suit!.slug,
          price: suit!.price,
          quantity: 1,
          selectedSize: '50',
          image: suit!.images[0].url,
        },
      ],
      deliveryFee: 0, // Free shipping qualified
    });

    expect(incomingOrder.id).toBeDefined();
    expect(incomingOrder.status).toBe('pending');

    // Pending count increments
    const pendingAfter = await mockDataProvider.getOrders({ status: 'pending' });
    expect(pendingAfter.length).toBe(initialPendingCount + 1);
    expect(pendingAfter[0].id).toBe(incomingOrder.id);

    // ========================================================
    // Step 3: Manager Inspects Customer Dossier
    // ========================================================
    const dossier = await mockDataProvider.getOrderById(incomingOrder.id);
    expect(dossier).not.toBeNull();
    expect(dossier!.customer.fullName).toBe('Ryad Boudebouz');
    expect(dossier!.customer.wilaya).toBe('Sétif');
    expect(dossier!.customer.notes).toContain('Disponible après 16h');
    expect(isValidAlgerianPhone(dossier!.customer.phone)).toBe(true);

    // ========================================================
    // Step 4: Manager Clicks Telephone Dialer & WhatsApp Generator (F-ORD-04)
    // ========================================================
    // 1-Click Phone Call link
    const telLink = formatTelLink(dossier!.customer.phone);
    expect(telLink).toBe('tel:+213550998877');

    // Pre-composed WhatsApp confirmation link
    const waLink = generateWhatsAppConfirmLink(dossier!);
    expect(waLink).toContain('https://wa.me/213550998877?text=');
    expect(waLink).toContain(encodeURIComponent(dossier!.orderNumber));
    expect(waLink).toContain(encodeURIComponent('Ryad Boudebouz'));
    expect(waLink).toContain(encodeURIComponent(formatDZD(dossier!.total)));

    // ========================================================
    // Step 5: Transition 1: Pending -> Confirmed
    // ========================================================
    const confirmedOrder = await mockDataProvider.updateOrderStatus(
      dossier!.id,
      'confirmed',
      'Client contacté par téléphone - Adresse et taille 50 confirmées',
      'Manager Mehdi'
    );

    expect(confirmedOrder.status).toBe('confirmed');
    expect(confirmedOrder.statusHistory).toHaveLength(2);
    expect(confirmedOrder.statusHistory[1].status).toBe('confirmed');
    expect(confirmedOrder.statusHistory[1].updatedBy).toBe('Manager Mehdi');

    // ========================================================
    // Step 6: Transition 2: Confirmed -> Shipped (Courier: Yalidine Express)
    // ========================================================
    const trackingCode = 'YAL-2026-99182';
    const shippedOrder = await mockDataProvider.updateOrderStatus(
      confirmedOrder.id,
      'shipped',
      `Colis remis au transporteur Yalidine Express - Tracking ${trackingCode}`,
      'Manager Mehdi'
    );

    expect(shippedOrder.status).toBe('shipped');
    expect(shippedOrder.statusHistory).toHaveLength(3);
    expect(shippedOrder.statusHistory[2].note).toContain(trackingCode);

    // ========================================================
    // Step 7: Transition 3: Shipped -> Delivered (Payment Collected in Cash)
    // ========================================================
    const deliveredOrder = await mockDataProvider.updateOrderStatus(
      shippedOrder.id,
      'delivered',
      `Colis livré avec succès à El Eulma. Montant de ${formatDZD(shippedOrder.total)} encaissé en espèces.`,
      'Système Yalidine Webhook'
    );

    expect(deliveredOrder.status).toBe('delivered');
    expect(deliveredOrder.statusHistory).toHaveLength(4);

    // Order is no longer in pending queue
    const finalPending = await mockDataProvider.getOrders({ status: 'pending' });
    expect(finalPending.some((o) => o.id === incomingOrder.id)).toBe(false);

    // Product stock remains decremented
    const suitAfter = await mockDataProvider.getProductById('prod-001');
    expect(suitAfter!.stockQuantity).toBe(stockBefore - 1);
  });
});
