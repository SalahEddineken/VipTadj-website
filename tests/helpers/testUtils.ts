import { Order } from '../fixtures/types';
import { getWilayaFee } from '../fixtures/wilayas.fixture';

/**
 * Validates whether a phone number matches Algerian mobile operator standards:
 * - 10 digits starting with 05 (Ooredoo), 06 (Mobilis), or 07 (Djezzy)
 * - Or international format: +213 followed by 5/6/7 and 8 digits (9 digits total after prefix)
 * - Or 00213 followed by 5/6/7 and 8 digits
 */
export function isValidAlgerianPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;

  // Clean out common separator characters: spaces, hyphens, dots, parentheses
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, '');

  // Local national format: 05, 06, 07 + 8 digits = 10 digits total
  const nationalRegex = /^0(5|6|7)\d{8}$/;

  // International format with +213: +213(5|6|7) + 8 digits = 12 characters
  const internationalPlusRegex = /^\+213(5|6|7)\d{8}$/;

  // International format with 00213: 00213(5|6|7) + 8 digits = 13 digits
  const internationalZeroRegex = /^00213(5|6|7)\d{8}$/;

  return (
    nationalRegex.test(cleaned) ||
    internationalPlusRegex.test(cleaned) ||
    internationalZeroRegex.test(cleaned)
  );
}

/**
 * Normalizes an Algerian phone number into the standard national 10-digit format (0X XX XX XX XX).
 */
export function formatAlgerianPhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');

  if (cleaned.startsWith('+213')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (cleaned.startsWith('00213')) {
    cleaned = '0' + cleaned.substring(5);
  }

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  }

  return phone;
}

/**
 * Generates an RFC-compliant tel: link for Algerian phone dialing.
 * Converts 0550123456 -> tel:+213550123456
 */
export function formatTelLink(rawPhone: string): string {
  if (!rawPhone) return 'tel:';
  let cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '');

  if (cleaned.startsWith('+213')) {
    return `tel:${cleaned}`;
  }
  if (cleaned.startsWith('00213')) {
    return `tel:+${cleaned.substring(2)}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `tel:+213${cleaned.substring(1)}`;
  }

  return `tel:${cleaned}`;
}

/**
 * Formats a numeric price into the standard Algerian Dinar luxury display string.
 * Example: 48500 -> "48 500 DA" (uses non-breaking space \u00A0 to prevent wrapping).
 */
export function formatDZD(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 DA';
  }

  const integerPart = Math.round(amount);
  const formatted = integerPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  return `${formatted}\u00A0DA`;
}

/**
 * Parses a DZD formatted string back to an integer.
 * Example: "48 500 DA" -> 48500
 */
export function parseDZD(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Calculates subtotal for a list of items.
 */
export function calculateSubtotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculates delivery fee based on wilaya code and free shipping threshold.
 * If subtotal meets or exceeds the threshold, shipping is 0 DA (Gratuit).
 */
export function calculateDeliveryFee(
  subtotal: number,
  wilayaCode: number,
  freeShippingThreshold: number = 15000
): number {
  if (subtotal >= freeShippingThreshold) {
    return 0; // Free shipping qualification
  }
  return getWilayaFee(wilayaCode);
}

/**
 * Calculates the final total for an order.
 */
export function calculateTotal(subtotal: number, deliveryFee: number, discount: number = 0): number {
  return Math.max(0, subtotal + deliveryFee - discount);
}

/**
 * Generates a pre-composed WhatsApp order confirmation URL.
 * Enables 1-click customer confirmation via WhatsApp Web / App.
 */
export function generateWhatsAppConfirmLink(order: Order, storeWhatsAppNumber?: string): string {
  const targetNumber = (storeWhatsAppNumber || order.customer.phone).replace(/[\s\-\.\(\)]/g, '');
  const normalizedPhone = targetNumber.startsWith('+')
    ? targetNumber.substring(1)
    : targetNumber.startsWith('0')
    ? `213${targetNumber.substring(1)}`
    : targetNumber;

  const itemsList = order.items
    .map((item) => `- ${item.quantity}x ${item.title} (Taille ${item.selectedSize}) : ${formatDZD(item.price * item.quantity)}`)
    .join('\n');

  const message = [
    `Bonjour ${order.customer.fullName},`,
    `Nous confirmons la réception de votre commande *${order.orderNumber}* chez *VIP TADJ*.`,
    '',
    '*Articles commandés :*',
    itemsList,
    '',
    `*Sous-total :* ${formatDZD(order.subtotal)}`,
    `*Livraison (${order.customer.wilaya}) :* ${formatDZD(order.deliveryFee)}`,
    `*Total à payer à la réception :* ${formatDZD(order.total)}`,
    '',
    `*Adresse de livraison :* ${order.customer.address}, ${order.customer.commune}, ${order.customer.wilaya}`,
    '',
    'Merci de répondre à ce message pour valider définitivement l\'expédition de votre colis.',
    'L\'équipe VIP TADJ vous remercie pour votre confiance.',
  ].join('\n');

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
