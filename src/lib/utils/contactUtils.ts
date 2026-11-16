/**
 * VIP TADJ — Contact & Algerian Mobile Communication Engine (F-ORD-04)
 * Authoritative module for Algerian phone validation, tel: links, and WhatsApp concierge messages.
 * Produces luxurious, bilingual (French & Arabic) order confirmation links for COD customers.
 */

import { Order } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizePhoneForWhatsApp } from '@/lib/utils/phoneUtils';

export {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  normalizePhoneForWhatsApp,
} from '@/lib/utils/phoneUtils';

/**
 * Generates a pre-composed WhatsApp order confirmation URL.
 * Enables 1-click customer confirmation via WhatsApp Web / App.
 *
 * Pattern: https://wa.me/213550123456?text=...
 */
export function generateWhatsAppConfirmLink(order: Order, storeWhatsAppNumber?: string): string {
  const targetNumber = storeWhatsAppNumber || order.customer.phone;
  const normalizedPhone = normalizePhoneForWhatsApp(targetNumber);

  const itemsList = order.items
    .map(
      (item) =>
        `- ${item.quantity}x ${item.title} (Taille ${item.selectedSize}) : ${formatDZD(
          item.price * item.quantity
        )}`
    )
    .join('\n');

  const deliveryDisplay =
    order.deliveryFee === 0 ? 'Gratuite (Offerte)' : formatDZD(order.deliveryFee);

  const message = [
    `👑 *VIP TADJ Luxury Menswear* 👑`,
    `*Confirmation de Commande / تأكيد الطلبية*`,
    '',
    `Bonjour ${order.customer.fullName} / مرحباً بك،`,
    `Nous confirmons la réception de votre commande *${order.orderNumber}* chez *VIP TADJ*.`,
    '',
    '*Articles commandés / تفاصيل الطلبية :*',
    itemsList,
    '',
    `*Sous-total :* ${formatDZD(order.subtotal)}`,
    `*Livraison (${order.customer.wilaya}) :* ${deliveryDisplay}`,
    `*Total à payer à la réception / المبلغ الإجمالي :* ${formatDZD(order.total)}`,
    '',
    `*Adresse de livraison / عنوان التوصيل :* ${order.customer.address}, ${order.customer.commune}, ${order.customer.wilaya}`,
    ...(order.customer.notes ? [`*Note :* ${order.customer.notes}`] : []),
    '',
    "Merci de répondre à ce message pour valider définitivement l'expédition de votre colis.",
    'Veuillez confirmer votre commande pour expédition immédiate / يرجى تأكيد طلبيتكم لإرسالها فوراً.',
    '',
    "L'équipe VIP TADJ vous remercie pour votre confiance. / شكراً لثقتكم بنا.",
  ].join('\n');

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
