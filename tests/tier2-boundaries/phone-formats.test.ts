import { describe, it, expect } from 'vitest';
import {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  generateWhatsAppConfirmLink,
} from '../helpers/testUtils';
import { ordersFixture } from '../fixtures/orders.fixture';

describe('Tier 2: Boundary & Corner Cases — Algerian Phone Formats (phone-formats.test.ts)', () => {
  // ==========================================
  // 1. Valid Mobile Operator Prefixes (05, 06, 07)
  // ==========================================
  it('validates exact 10-digit national formats across all three Algerian mobile operators', () => {
    // 05 = Ooredoo
    expect(isValidAlgerianPhone('0550123456')).toBe(true);
    expect(isValidAlgerianPhone('0561998877')).toBe(true);
    expect(isValidAlgerianPhone('0549001122')).toBe(true);

    // 06 = Mobilis
    expect(isValidAlgerianPhone('0661234567')).toBe(true);
    expect(isValidAlgerianPhone('0655887766')).toBe(true);
    expect(isValidAlgerianPhone('0670112233')).toBe(true);

    // 07 = Djezzy
    expect(isValidAlgerianPhone('0770987654')).toBe(true);
    expect(isValidAlgerianPhone('0780123456')).toBe(true);
    expect(isValidAlgerianPhone('0799887766')).toBe(true);
  });

  // ==========================================
  // 2. International Prefixes and Delimiters
  // ==========================================
  it('handles international prefixes (+213 and 00213) with diverse spacing and punctuation', () => {
    // +213 formats
    expect(isValidAlgerianPhone('+213550123456')).toBe(true);
    expect(isValidAlgerianPhone('+213 661 23 45 67')).toBe(true);
    expect(isValidAlgerianPhone('+213-770-98-76-54')).toBe(true);
    expect(isValidAlgerianPhone('+213.550.12.34.56')).toBe(true);
    expect(isValidAlgerianPhone('+213 (05) 50 12 34 56')).toBe(false); // Extra leading zero in international form is invalid

    // 00213 formats
    expect(isValidAlgerianPhone('00213550123456')).toBe(true);
    expect(isValidAlgerianPhone('00213 661 23 45 67')).toBe(true);
    expect(isValidAlgerianPhone('00213-770-98-76-54')).toBe(true);

    // Local formats with spaces and hyphens
    expect(isValidAlgerianPhone('05 50 12 34 56')).toBe(true);
    expect(isValidAlgerianPhone('06-61-23-45-67')).toBe(true);
    expect(isValidAlgerianPhone('(07) 70 98 76 54')).toBe(true);
  });

  // ==========================================
  // 3. Invalid Operator Prefixes (02, 03, 04, 08, 09, 01)
  // ==========================================
  it('strictly rejects non-mobile prefixes unsuitable for Cash on Delivery SMS/call validation', () => {
    // 02 = Alger landline (fixed line)
    expect(isValidAlgerianPhone('021123456')).toBe(false);
    expect(isValidAlgerianPhone('023456789')).toBe(false);
    expect(isValidAlgerianPhone('+21321123456')).toBe(false);

    // 03 = East regional landline
    expect(isValidAlgerianPhone('031123456')).toBe(false);
    expect(isValidAlgerianPhone('038123456')).toBe(false);

    // 04 = West regional landline
    expect(isValidAlgerianPhone('041123456')).toBe(false);

    // 08/09 = Reserved / VoIP / Special numbers
    expect(isValidAlgerianPhone('0800123456')).toBe(false);
    expect(isValidAlgerianPhone('0982123456')).toBe(false);

    // 01 = Non-existent prefix
    expect(isValidAlgerianPhone('0123456789')).toBe(false);
  });

  // ==========================================
  // 4. Boundary Length Violations (8, 9, 11, 15 digits)
  // ==========================================
  it('rejects numbers that deviate from exact 10-digit national or 12-char international boundaries', () => {
    // 9 digits (1 digit missing)
    expect(isValidAlgerianPhone('055012345')).toBe(false);
    expect(isValidAlgerianPhone('066123456')).toBe(false);
    expect(isValidAlgerianPhone('077098765')).toBe(false);

    // 11 digits (1 digit extra)
    expect(isValidAlgerianPhone('05501234567')).toBe(false);
    expect(isValidAlgerianPhone('06612345678')).toBe(false);
    expect(isValidAlgerianPhone('07709876543')).toBe(false);

    // 8 digits (too short)
    expect(isValidAlgerianPhone('05501234')).toBe(false);

    // International with wrong length (+213 + 7 digits instead of 9 digits)
    expect(isValidAlgerianPhone('+21355012345')).toBe(false);
    expect(isValidAlgerianPhone('+2135501234567')).toBe(false); // +213 + 10 digits

    // Empty and nullish
    expect(isValidAlgerianPhone('')).toBe(false);
    expect(isValidAlgerianPhone('   ')).toBe(false);
  });

  // ==========================================
  // 5. Non-Numeric Characters & Injection Attempts
  // ==========================================
  it('rejects alphabetic characters, symbols, and script injection payloads in phone field', () => {
    expect(isValidAlgerianPhone('abcdefghij')).toBe(false);
    expect(isValidAlgerianPhone('055012345a')).toBe(false);
    expect(isValidAlgerianPhone('06612345#7')).toBe(false);
    expect(isValidAlgerianPhone('<script>0550123456</script>')).toBe(false);
    expect(isValidAlgerianPhone("0550123456' OR '1'='1")).toBe(false);
    expect(isValidAlgerianPhone('+213 550 12 34 5X')).toBe(false);
    expect(isValidAlgerianPhone('null')).toBe(false);
    expect(isValidAlgerianPhone('undefined')).toBe(false);
  });

  // ==========================================
  // 6. Formatting & RFC-Compliant Tel Links
  // ==========================================
  it('formats Algerian numbers into standard display and generates RFC tel: dialing URIs', () => {
    // formatAlgerianPhone
    expect(formatAlgerianPhone('0550123456')).toBe('0550 12 34 56');
    expect(formatAlgerianPhone('+213550123456')).toBe('0550 12 34 56');
    expect(formatAlgerianPhone('00213661234567')).toBe('0661 23 45 67');
    expect(formatAlgerianPhone('')).toBe('');

    // formatTelLink
    expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
    expect(formatTelLink('+213661234567')).toBe('tel:+213661234567');
    expect(formatTelLink('00213770987654')).toBe('tel:+213770987654');
    expect(formatTelLink('05 50 12 34 56')).toBe('tel:+213550123456');
    expect(formatTelLink('')).toBe('tel:');
  });

  // ==========================================
  // 7. WhatsApp Link Phone Normalization
  // ==========================================
  it('normalizes customer phone in pre-composed WhatsApp concierge link', () => {
    const sampleOrder = {
      ...ordersFixture[0],
      customer: {
        ...ordersFixture[0].customer,
        phone: '0550 12 34 56',
      },
    };

    const link = generateWhatsAppConfirmLink(sampleOrder);
    // WhatsApp direct API expects https://wa.me/213550123456 (no leading 0, no + symbol)
    expect(link).toContain('https://wa.me/213550123456?text=');
    expect(link).not.toContain('wa.me/0550');
    expect(link).not.toContain('wa.me/+213');
  });
});
