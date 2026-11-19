/**
 * VIP TADJ — Algerian Phone & Communication Utilities (F-ORD-04)
 * Supports Mobilis (06), Djezzy (07), Ooredoo (05) and international +213 / 00213 prefixes.
 */

/**
 * Validates whether a phone number matches Algerian mobile operator standards:
 * - 10 digits starting with 05 (Ooredoo), 06 (Mobilis), or 07 (Djezzy)
 * - Or international format: +213 followed by 5/6/7 and 8 digits (12 characters total)
 * - Or 00213 followed by 5/6/7 and 8 digits (13 characters total)
 * - Allows common delimiters: spaces, hyphens, dots, parentheses
 * - Strictly rejects landlines (02, 03, 04), VoIP (08, 09), letters, or symbols
 */
export function isValidAlgerianPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false;

  const trimmed = phone.trim();
  if (!trimmed) return false;

  // Clean out common separator characters
  const cleaned = trimmed.replace(/[\s\-\.\(\)]/g, '');

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
 * Normalizes an Algerian phone number into standard national format: "0X XX XX XX XX".
 */
export function formatAlgerianPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');

  if (/^\+2130[567]\d{8}$/.test(cleaned)) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith('+213')) {
    cleaned = '0' + cleaned.substring(4);
  } else if (/^002130[567]\d{8}$/.test(cleaned)) {
    cleaned = cleaned.substring(5);
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
 * 0550123456 -> tel:+213550123456
 * Handles 9-digit, international +213, 00213, and spaced/hyphenated formats.
 */
export function formatTelLink(rawPhone: string | null | undefined): string {
  if (!rawPhone || typeof rawPhone !== 'string') return 'tel:';
  const cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '');
  if (!cleaned) return 'tel:';

  // Already prefixed with +213 (strip optional national trunk '0', e.g. +213 (0) 550 00 00 00)
  if (/^\+2130[567]\d{8}$/.test(cleaned)) {
    return `tel:+213${cleaned.substring(5)}`;
  }
  if (cleaned.startsWith('+213')) {
    return `tel:${cleaned}`;
  }
  // Other international plus format
  if (cleaned.startsWith('+')) {
    return `tel:${cleaned}`;
  }
  // 00213 prefix (strip optional national trunk '0', e.g. 00213 (0) 550 00 00 00)
  if (/^002130[567]\d{8}$/.test(cleaned)) {
    return `tel:+213${cleaned.substring(6)}`;
  }
  if (cleaned.startsWith('00213')) {
    return `tel:+${cleaned.substring(2)}`;
  }
  // Standard national 10-digit format (05, 06, 07)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `tel:+213${cleaned.substring(1)}`;
  }
  // 9-digit format without leading 0 (550123456, 661223344, 770334455)
  if (cleaned.length === 9 && /^[567]/.test(cleaned)) {
    return `tel:+213${cleaned}`;
  }

  return `tel:${cleaned}`;
}

/**
 * Normalizes customer phone for WhatsApp wa.me links.
 * Returns digits without + or leading zero: 213550123456.
 */
export function normalizePhoneForWhatsApp(rawPhone: string | null | undefined): string {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const cleaned = rawPhone.replace(/[\s\-\.\(\)]/g, '');
  if (!cleaned) return '';

  if (/^\+2130[567]\d{8}$/.test(cleaned)) {
    return `213${cleaned.substring(5)}`;
  }
  if (/^002130[567]\d{8}$/.test(cleaned)) {
    return `213${cleaned.substring(6)}`;
  }
  if (cleaned.startsWith('+')) {
    return cleaned.substring(1);
  }
  if (cleaned.startsWith('00')) {
    return cleaned.substring(2);
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `213${cleaned.substring(1)}`;
  }
  if (cleaned.length === 9 && /^[567]/.test(cleaned)) {
    return `213${cleaned}`;
  }
  return cleaned;
}
