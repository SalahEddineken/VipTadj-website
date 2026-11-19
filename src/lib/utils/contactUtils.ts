/**
 * VIP TADJ — Contact & Algerian Mobile Communication Engine (F-ORD-04)
 * Authoritative module for Algerian phone validation, tel: links, and WhatsApp concierge messages.
 * Produces luxurious, bilingual (French & Arabic) order confirmation links for COD customers.
 */

import { Order } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizePhoneForWhatsApp } from '@/lib/utils/phoneUtils';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/locales';
import { getLocalizedProduct, getLocalizedSize } from '@/lib/i18n/catalog-translations';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';

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
export function generateWhatsAppConfirmLink(
  order: Order,
  storeWhatsAppNumber?: string,
  language?: SupportedLanguage
): string {
  const targetNumber = storeWhatsAppNumber || order.customer.phone;
  const normalizedPhone = normalizePhoneForWhatsApp(targetNumber);

  // Preserve exact legacy bilingual FR/AR output when no language is explicitly provided
  if (!language) {
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
      order.customer.address
        ? `*Adresse de livraison / عنوان التوصيل :* ${order.customer.address}, ${order.customer.commune}, ${order.customer.wilaya}`
        : `*Lieu de livraison / مكان التوصيل :* ${order.customer.commune}, ${order.customer.wilaya} (${order.customer.deliveryType === 'desk' ? 'Point Relais / استلام من المكتب' : 'À domicile / توصيل منزلي'})`,
      ...(order.customer.notes ? [`*Note :* ${order.customer.notes}`] : []),
      '',
      "Merci de répondre à ce message pour valider définitivement l'expédition de votre colis.",
      'Veuillez confirmer votre commande pour expédition immédiate / يرجى تأكيد طلبيتكم لإرسالها فوراً.',
      '',
      "L'équipe VIP TADJ vous remercie pour votre confiance. / شكراً لثقتكم بنا.",
    ].join('\n');

    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  }

  const rawWilayaCode = order.customer.wilayaCode;
  const wilayaCodeNum = typeof rawWilayaCode === 'number' ? rawWilayaCode : Number(rawWilayaCode);
  const wilayaObj =
    Number.isFinite(wilayaCodeNum) && wilayaCodeNum > 0
      ? getWilayaByCode(wilayaCodeNum)
      : undefined;
  const communeObj =
    Number.isFinite(wilayaCodeNum) && wilayaCodeNum > 0 && order.customer.commune
      ? findCommune(wilayaCodeNum, order.customer.commune)
      : undefined;

  const wilayaDisplay =
    language === 'ar'
      ? wilayaObj?.nameAr || order.customer.wilaya
      : wilayaObj
      ? `${wilayaObj.code} - ${wilayaObj.name}`
      : order.customer.wilaya;

  const communeDisplay =
    language === 'ar' ? communeObj?.nameAr || order.customer.commune : communeObj?.name || order.customer.commune;

  const freeLabel = getTranslation(language, 'checkout.summary.free', 'Gratuit');
  const deliveryDisplay =
    order.deliveryFee === 0 ? freeLabel : formatDZD(order.deliveryFee, { locale: language });

  const itemsList = order.items
    .map((item) => {
      const localizedTitle = getLocalizedProduct(
        { id: item.productId, title: item.title, description: '' },
        language
      ).title;
      const localizedSize = getLocalizedSize(item.selectedSize, language);
      const lineTotal = formatDZD(item.price * item.quantity, { locale: language });
      if (language === 'ar') {
        const sizeDisplay = localizedSize.startsWith('مقاس')
          ? localizedSize
          : `المقاس ${localizedSize}`;
        return `- ${item.quantity}× ${localizedTitle} (${sizeDisplay}): ${lineTotal}`;
      }
      if (language === 'en') {
        return `- ${item.quantity}x ${localizedTitle} (Size ${localizedSize}): ${lineTotal}`;
      }
      return `- ${item.quantity}x ${localizedTitle} (Taille ${localizedSize}) : ${lineTotal}`;
    })
    .join('\n');

  const deliveryModeLabel =
    order.customer.deliveryType === 'desk'
      ? language === 'ar'
        ? 'استلام من المكتب'
        : language === 'en'
        ? 'Pickup Hub / Stop Desk'
        : 'Point Relais'
      : language === 'ar'
      ? 'توصيل للمنزل'
      : language === 'en'
      ? 'Home Delivery'
      : 'À domicile';

  let messageLines: string[];

  if (language === 'ar') {
    messageLines = [
      '👑 *VIP TADJ* 👑',
      '*تأكيد الطلبية*',
      '',
      `مرحباً ${order.customer.fullName}،`,
      `نأكدولك استلام طلبيتك رقم *${order.orderNumber}* من *VIP TADJ*.`,
      '',
      '*تفاصيل الطلبية:*',
      itemsList,
      '',
      `*المجموع الفرعي:* ${formatDZD(order.subtotal, { locale: 'ar' })}`,
      `*التوصيل (${wilayaDisplay}):* ${deliveryDisplay}`,
      `*المبلغ الإجمالي عند الاستلام:* ${formatDZD(order.total, { locale: 'ar' })}`,
      '',
      order.customer.address
        ? `*عنوان التوصيل:* ${order.customer.address}، ${communeDisplay}، ${wilayaDisplay}`
        : `*مكان التوصيل:* ${communeDisplay}، ${wilayaDisplay} (${deliveryModeLabel})`,
      ...(order.customer.notes ? [`*ملاحظة:* ${order.customer.notes}`] : []),
      '',
      'يرجى الرد على هذه الرسالة لتأكيد إرسال الطرد في أقرب وقت.',
      'فريق VIP TADJ يشكرك على ثقتك بنا.',
    ];
  } else if (language === 'en') {
    messageLines = [
      '👑 *VIP TADJ Luxury Menswear* 👑',
      '*Order Confirmation*',
      '',
      `Hello ${order.customer.fullName},`,
      `We confirm receipt of your order *${order.orderNumber}* at *VIP TADJ*.`,
      '',
      '*Ordered Items:*',
      itemsList,
      '',
      `*Subtotal:* ${formatDZD(order.subtotal, { locale: 'en' })}`,
      `*Delivery (${wilayaDisplay}):* ${deliveryDisplay}`,
      `*Total to pay on delivery (COD):* ${formatDZD(order.total, { locale: 'en' })}`,
      '',
      order.customer.address
        ? `*Delivery Address:* ${order.customer.address}, ${communeDisplay}, ${wilayaDisplay}`
        : `*Delivery Location:* ${communeDisplay}, ${wilayaDisplay} (${deliveryModeLabel})`,
      ...(order.customer.notes ? [`*Note:* ${order.customer.notes}`] : []),
      '',
      'Please reply to this message to confirm dispatch of your parcel.',
      'The VIP TADJ team thanks you for your trust.',
    ];
  } else {
    messageLines = [
      '👑 *VIP TADJ Haute Élégance Masculine* 👑',
      '*Confirmation de Commande*',
      '',
      `Bonjour ${order.customer.fullName},`,
      `Nous confirmons la réception de votre commande *${order.orderNumber}* chez *VIP TADJ*.`,
      '',
      '*Articles commandés :*',
      itemsList,
      '',
      `*Sous-total :* ${formatDZD(order.subtotal, { locale: 'fr' })}`,
      `*Livraison (${wilayaDisplay}) :* ${deliveryDisplay}`,
      `*Total à payer à la réception :* ${formatDZD(order.total, { locale: 'fr' })}`,
      '',
      order.customer.address
        ? `*Adresse de livraison :* ${order.customer.address}, ${communeDisplay}, ${wilayaDisplay}`
        : `*Lieu de livraison :* ${communeDisplay}, ${wilayaDisplay} (${deliveryModeLabel})`,
      ...(order.customer.notes ? [`*Note :* ${order.customer.notes}`] : []),
      '',
      "Merci de répondre à ce message pour valider définitivement l'expédition de votre colis.",
      "L'équipe VIP TADJ vous remercie pour votre confiance.",
    ];
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageLines.join('\n'))}`;
}
