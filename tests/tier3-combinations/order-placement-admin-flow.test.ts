import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { isValidAlgerianPhone, formatAlgerianPhone, formatTelLink, generateWhatsAppConfirmLink } from '../helpers/testUtils';
import { Order, OrderStatus } from '../fixtures/types';

describe('Tier 3: Combinations — Order Placement to Admin Fulfillment Flow (order-placement-admin-flow.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Combination 1: Storefront Order Placement Creation
  // ==========================================
  it('submits a storefront COD order and generates pending status with unique order number', async () => {
    const newOrder = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Abdelkader Ghezzal',
        phone: '0555123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Sidi M\'Hamed',
        address: '12 Rue Didouche Mourad, 3ème étage',
        notes: 'Sonner à l\'interphone Ghezzal',
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
      deliveryFee: 0, // Free shipping qualified (48,500 >= 15,000)
    });

    expect(newOrder.id).toBeDefined();
    expect(newOrder.orderNumber).toMatch(/^VIP-2026-\d{4}$/);
    expect(newOrder.status).toBe('pending');
    expect(newOrder.paymentMethod).toBe('cod');
    expect(newOrder.subtotal).toBe(48500);
    expect(newOrder.deliveryFee).toBe(0);
    expect(newOrder.total).toBe(48500);
    expect(isValidAlgerianPhone(newOrder.customer.phone)).toBe(true);
  });

  // ==========================================
  // Combination 2: Admin Pending Orders Table Reflection
  // ==========================================
  it('reflects new order immediately in admin pending orders query queue', async () => {
    const initialPending = await mockDataProvider.getOrders({ status: 'pending' });
    const initialCount = initialPending.length;

    // Storefront places new order
    const created = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Karim Ziani',
        phone: '0661998877',
        wilaya: 'Oran',
        wilayaCode: 31,
        commune: 'Es Senia',
        address: 'Cité 200 Logements',
      },
      items: [
        {
          productId: 'prod-002',
          title: 'Blazer Sartorial',
          slug: 'blazer-sartorial-cachemire-soie',
          price: 34000,
          quantity: 1,
          selectedSize: '52',
          image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
        },
      ],
      deliveryFee: 0,
    });

    // Admin queries pending orders
    const updatedPending = await mockDataProvider.getOrders({ status: 'pending' });
    expect(updatedPending.length).toBe(initialCount + 1);
    expect(updatedPending[0].id).toBe(created.id);
    expect(updatedPending[0].customer.fullName).toBe('Karim Ziani');
  });

  // ==========================================
  // Combination 3: Admin Search Matrix (Name, Phone, OrderNumber)
  // ==========================================
  it('allows admin to locate order via customer name, phone number, and order number', async () => {
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Djamel Belmadi',
        phone: '0770334455',
        wilaya: 'Constantine',
        wilayaCode: 25,
        commune: 'Zighoud Youcef',
        address: 'Villa Numidia',
      },
      items: [
        {
          productId: 'prod-008',
          title: 'Souliers Richelieu Cuir Oxford',
          slug: 'souliers-richelieu-cuir-oxford',
          price: 28000,
          quantity: 1,
          selectedSize: '42',
          image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
        },
      ],
      deliveryFee: 0,
    });

    // 1. Search by name
    const byName = await mockDataProvider.getOrders({ search: 'Belmadi' });
    expect(byName.some((o) => o.id === order.id)).toBe(true);

    // 2. Search by phone
    const byPhone = await mockDataProvider.getOrders({ search: '0770334455' });
    expect(byPhone.some((o) => o.id === order.id)).toBe(true);

    // 3. Search by orderNumber
    const byOrderNumber = await mockDataProvider.getOrders({ search: order.orderNumber });
    expect(byOrderNumber.some((o) => o.id === order.id)).toBe(true);
  });

  // ==========================================
  // Combination 4: Admin Customer Dossier & Telephone Validation
  // ==========================================
  it('provides complete customer dossier with telephone dialing and WhatsApp generator', async () => {
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Madjid Bougherra',
        phone: '0550445566',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Bologhine',
        address: 'Boulevard de la Corniche, Villa 8',
        notes: 'Appeler avant midi',
      },
      items: [
        {
          productId: 'prod-001',
          title: 'Costume Deux Pièces',
          slug: 'costume-deux-pieces',
          price: 48500,
          quantity: 2,
          selectedSize: '52',
          image: 'https://example.com/suit.jpg',
        },
      ],
      deliveryFee: 0,
    });

    // Admin opens customer dossier
    const dossier = await mockDataProvider.getOrderById(order.id);
    expect(dossier).not.toBeNull();
    expect(dossier!.customer.fullName).toBe('Madjid Bougherra');
    expect(dossier!.customer.address).toContain('Villa 8');
    expect(dossier!.customer.notes).toBe('Appeler avant midi');

    // Admin telephone dialer link
    const telLink = formatTelLink(dossier!.customer.phone);
    expect(telLink).toBe('tel:+213550445566');

    // Admin WhatsApp confirmation link
    const waLink = generateWhatsAppConfirmLink(dossier!);
    expect(waLink).toContain('https://wa.me/213550445566?text=');
    expect(waLink).toContain(encodeURIComponent(dossier!.orderNumber));
    expect(waLink).toContain(encodeURIComponent('Madjid Bougherra'));
  });

  // ==========================================
  // Combination 5: Status Transition & Chronological Audit History
  // ==========================================
  it('transitions order from pending to confirmed and appends audit trail entry', async () => {
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Hassan Yebda',
        phone: '0662334455',
        wilaya: 'Blida',
        wilayaCode: 9,
        commune: 'Ouled Yaïch',
        address: 'Cité des Roses',
      },
      items: [
        {
          productId: 'prod-003',
          title: 'Chemise Formelle',
          slug: 'chemise-formelle',
          price: 12500,
          quantity: 1,
          selectedSize: '41',
          image: 'https://example.com/chemise.jpg',
        },
      ],
      deliveryFee: 500,
    });

    expect(order.status).toBe('pending');
    expect(order.statusHistory).toHaveLength(1);

    // Admin confirms order by phone
    const confirmed = await mockDataProvider.updateOrderStatus(
      order.id,
      'confirmed',
      'Client contacté par téléphone - Commande et taille validées',
      'Admin Sarah'
    );

    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.statusHistory).toHaveLength(2);

    const latestAudit = confirmed.statusHistory[1];
    expect(latestAudit.status).toBe('confirmed');
    expect(latestAudit.note).toContain('Client contacté par téléphone');
    expect(latestAudit.updatedBy).toBe('Admin Sarah');
    expect(latestAudit.timestamp).toBeTruthy();
  });
});
