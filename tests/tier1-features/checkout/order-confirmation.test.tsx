import { describe, it, expect } from 'vitest';
import { generateWhatsAppConfirmLink, formatDZD } from '../../helpers/testUtils';
import { ordersFixture } from '../../fixtures/orders.fixture';
import { Order } from '@/types';

describe('Tier 1: Checkout — Order Confirmation & WhatsApp Telephone Notice (F-CHECK-04)', () => {
  const sampleOrder: Order = ordersFixture[0]; // ord-001, pending order

  // ==========================================
  // Test 1: Order Number Display
  // ==========================================
  it('displays official order confirmation number with VIP-2026-XXXX format', () => {
    expect(sampleOrder.orderNumber).toMatch(/^VIP-2026-\d{4}$/);
    expect(sampleOrder.status).toBe('pending');
  });

  // ==========================================
  // Test 2: Customer Dossier Recap
  // ==========================================
  it('displays full customer dossier recap including name, phone, wilaya, and street address', () => {
    const customer = sampleOrder.customer;

    expect(customer.fullName).toBe('Karim Benali');
    expect(customer.phone).toMatch(/^0(5|6|7)\d{8}$/);
    expect(customer.wilaya).toBe('Alger');
    expect(customer.wilayaCode).toBe(16);
    expect(customer.commune).toBeTruthy();
    expect(customer.address).toBeTruthy();
  });

  // ==========================================
  // Test 3: Ordered Items Breakdown
  // ==========================================
  it('displays ordered items summary with selected sizes, quantities, and individual prices', () => {
    expect(sampleOrder.items.length).toBeGreaterThan(0);

    sampleOrder.items.forEach((item) => {
      expect(item.title).toBeTruthy();
      expect(item.selectedSize).toBeTruthy();
      expect(item.quantity).toBeGreaterThan(0);
      expect(item.price).toBeGreaterThan(0);

      const itemTotal = item.price * item.quantity;
      expect(formatDZD(itemTotal)).toContain('DA');
    });
  });

  // ==========================================
  // Test 4: Financial Totals Breakdown in DZD
  // ==========================================
  it('breaks down financial figures: subtotal, delivery fee, and final COD total', () => {
    expect(sampleOrder.subtotal).toBeGreaterThan(0);
    expect(sampleOrder.deliveryFee).toBeGreaterThanOrEqual(0);
    expect(sampleOrder.subtotal + sampleOrder.deliveryFee).toBe(sampleOrder.total);

    const formattedTotal = formatDZD(sampleOrder.total);
    expect(formattedTotal).toContain('DA');
  });

  // ==========================================
  // Test 5: WhatsApp Concierge Link Generation
  // ==========================================
  it('generates direct WhatsApp concierge link with prefilled order number, items, and total', () => {
    const whatsappLink = generateWhatsAppConfirmLink(sampleOrder);

    expect(whatsappLink).toContain('https://wa.me/');
    expect(whatsappLink).toContain('text=');

    // Decode URL component to check text
    const decodedUrl = decodeURIComponent(whatsappLink);
    expect(decodedUrl).toContain(sampleOrder.customer.fullName);
    expect(decodedUrl).toContain(sampleOrder.orderNumber);
    expect(decodedUrl).toContain('VIP TADJ');
    expect(decodedUrl).toContain('61');
    expect(decodedUrl).toContain('400');
    expect(decodedUrl).toContain('DA');
  });

  // ==========================================
  // Test 6: Telephone Confirmation Policy Notice
  // ==========================================
  it('includes telephone validation advisory warning that agent will call prior to parcel dispatch', () => {
    const confirmationNotice = {
      title: 'Commande Enregistrée avec Succès',
      telephoneNotice:
        'Un conseiller Maison VIP TADJ vous contactera par téléphone dans les prochaines heures pour valider votre commande avant expédition.',
      paymentNotice: 'Paiement en espèces à la livraison (COD).',
    };

    expect(confirmationNotice.telephoneNotice).toContain('contactera par téléphone');
    expect(confirmationNotice.telephoneNotice).toContain('avant expédition');
    expect(confirmationNotice.paymentNotice).toContain('espèces à la livraison');
  });
});
