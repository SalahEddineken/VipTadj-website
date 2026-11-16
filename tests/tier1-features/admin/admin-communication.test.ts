import { describe, it, expect } from 'vitest';
import {
  formatTelLink,
  generateWhatsAppConfirmLink,
  formatAlgerianPhone,
  formatDZD,
} from '../../helpers/testUtils';
import { ordersFixture } from '../../fixtures/orders.fixture';
import { Order } from '@/types';

describe('Tier 1: Admin — 1-Click Phone Call & WhatsApp Confirmation Link Engine (F-ORD-04)', () => {
  const sampleOrder: Order = ordersFixture[0];

  // ==========================================
  // Test 1: 1-Click Telephone Dialer RFC Link Generation
  // ==========================================
  it('generates an RFC-compliant tel: link starting with +213 for direct dialing on mobile or desktop softphones', () => {
    const rawNational = '0550123456';
    const telLink = formatTelLink(rawNational);

    expect(telLink).toBe('tel:+213550123456');
    expect(telLink.startsWith('tel:+213')).toBe(true);
  });

  // ==========================================
  // Test 2: Dialer Links for All Algerian Operators (05, 06, 07)
  // ==========================================
  it('formats dialer links accurately across Ooredoo, Mobilis, and Djezzy numbers', () => {
    expect(formatTelLink('0550112233')).toBe('tel:+213550112233'); // Ooredoo
    expect(formatTelLink('0661223344')).toBe('tel:+213661223344'); // Mobilis
    expect(formatTelLink('0770334455')).toBe('tel:+213770334455'); // Djezzy
  });

  // ==========================================
  // Test 3: Spaced and Hyphenated Phone Inputs
  // ==========================================
  it('cleanses spaces, hyphens, and dots prior to tel: link generation', () => {
    expect(formatTelLink('05 50 12 34 56')).toBe('tel:+213550123456');
    expect(formatTelLink('06-61-23-45-67')).toBe('tel:+213661234567');
    expect(formatTelLink('07.70.98.76.54')).toBe('tel:+213770987654');
    expect(formatTelLink('+213550123456')).toBe('tel:+213550123456');
    expect(formatTelLink('00213550123456')).toBe('tel:+213550123456');
  });

  // ==========================================
  // Test 4: WhatsApp Confirmation URL Structure
  // ==========================================
  it('generates WhatsApp confirmation URL targeting the customer mobile with valid https://wa.me format', () => {
    const whatsappUrl = generateWhatsAppConfirmLink(sampleOrder);

    expect(whatsappUrl.startsWith('https://wa.me/213550123456?text=')).toBe(true);
  });

  // ==========================================
  // Test 5: WhatsApp Pre-Composed Message Content
  // ==========================================
  it('embeds customer name, order number, line items, and total price into the WhatsApp message', () => {
    const whatsappUrl = generateWhatsAppConfirmLink(sampleOrder);
    const decodedMessage = decodeURIComponent(whatsappUrl);

    expect(decodedMessage).toContain(sampleOrder.customer.fullName);
    expect(decodedMessage).toContain(sampleOrder.orderNumber);
    expect(decodedMessage).toContain('VIP TADJ');
    expect(decodedMessage).toContain(sampleOrder.customer.wilaya);
    expect(decodedMessage).toContain('Articles commandés');
    expect(decodedMessage).toContain("valider définitivement l'expédition");
  });

  // ==========================================
  // Test 6: WhatsApp Custom Store Number Support
  // ==========================================
  it('routes WhatsApp confirmation through dedicated store customer support number when configured', () => {
    const storeSupportNumber = '0555009988';
    const whatsappUrl = generateWhatsAppConfirmLink(sampleOrder, storeSupportNumber);

    expect(whatsappUrl.startsWith('https://wa.me/213555009988?text=')).toBe(true);
  });
});
