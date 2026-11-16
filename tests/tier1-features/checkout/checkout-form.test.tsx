import { describe, it, expect } from 'vitest';
import { isValidAlgerianPhone, formatAlgerianPhone } from '../../helpers/testUtils';
import { CustomerShippingInfo } from '@/types';

describe('Tier 1: Checkout — Algerian Direct COD Checkout Form (F-CHECK-02)', () => {
  // Helper to simulate checkout form field validation
  function validateCheckoutForm(form: Partial<CustomerShippingInfo>): {
    valid: boolean;
    errors: Record<string, string>;
  } {
    const errors: Record<string, string> = {};

    if (!form.fullName || form.fullName.trim().length < 3) {
      errors.fullName = 'Le nom complet est obligatoire (min 3 caractères).';
    }

    if (!form.phone || !isValidAlgerianPhone(form.phone)) {
      errors.phone = 'Numéro de téléphone algérien invalide (doit commencer par 05, 06 ou 07).';
    }

    if (!form.wilaya || !form.wilayaCode || form.wilayaCode < 1 || form.wilayaCode > 58) {
      errors.wilaya = 'Veuillez sélectionner une wilaya parmi les 58 wilayas.';
    }

    if (!form.commune || form.commune.trim().length === 0) {
      errors.commune = 'La commune de livraison est obligatoire.';
    }

    if (!form.address || form.address.trim().length < 5) {
      errors.address = "L'adresse de livraison détaillée est obligatoire.";
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // ==========================================
  // Test 1: Valid Algerian Phone Formats (05, 06, 07)
  // ==========================================
  it('validates Algerian mobile phone numbers across all 3 major operators (Ooredoo, Mobilis, Djezzy)', () => {
    // 05: Ooredoo
    expect(isValidAlgerianPhone('0550123456')).toBe(true);
    // 06: Mobilis
    expect(isValidAlgerianPhone('0661234567')).toBe(true);
    // 07: Djezzy
    expect(isValidAlgerianPhone('0770987654')).toBe(true);

    // Spaced and hyphenated formats
    expect(isValidAlgerianPhone('05 50 12 34 56')).toBe(true);
    expect(isValidAlgerianPhone('06-61-23-45-67')).toBe(true);
  });

  // ==========================================
  // Test 2: Rejection of Invalid Phone Numbers
  // ==========================================
  it('rejects invalid phone numbers (wrong prefix, wrong length, letters, symbols)', () => {
    // Non-Algerian prefixes
    expect(isValidAlgerianPhone('0123456789')).toBe(false);
    expect(isValidAlgerianPhone('0987654321')).toBe(false);
    expect(isValidAlgerianPhone('0212345678')).toBe(false); // Landline

    // Incorrect lengths
    expect(isValidAlgerianPhone('055012345')).toBe(false); // 9 digits
    expect(isValidAlgerianPhone('05501234567')).toBe(false); // 11 digits

    // Invalid characters
    expect(isValidAlgerianPhone('0550abc456')).toBe(false);
    expect(isValidAlgerianPhone('')).toBe(false);
    expect(isValidAlgerianPhone(null as any)).toBe(false);
  });

  // ==========================================
  // Test 3: International +213 Prefix Support
  // ==========================================
  it('accepts and normalizes international dial codes (+213 and 00213)', () => {
    expect(isValidAlgerianPhone('+213550123456')).toBe(true);
    expect(isValidAlgerianPhone('+213661234567')).toBe(true);
    expect(isValidAlgerianPhone('00213770987654')).toBe(true);

    const formatted = formatAlgerianPhone('+213550123456');
    expect(formatted).toBe('0550 12 34 56');
  });

  // ==========================================
  // Test 4: Validation Error States for Missing Fields
  // ==========================================
  it('returns explicit error messages for missing mandatory customer shipping fields', () => {
    const emptyFormResult = validateCheckoutForm({});
    expect(emptyFormResult.valid).toBe(false);
    expect(emptyFormResult.errors.fullName).toBeDefined();
    expect(emptyFormResult.errors.phone).toBeDefined();
    expect(emptyFormResult.errors.wilaya).toBeDefined();
    expect(emptyFormResult.errors.commune).toBeDefined();
    expect(emptyFormResult.errors.address).toBeDefined();
  });

  // ==========================================
  // Test 5: Partial Form Error States
  // ==========================================
  it('isolates specific field error when only one field is invalid (e.g. invalid phone)', () => {
    const partialFormResult = validateCheckoutForm({
      fullName: 'Yacine Brahimi',
      phone: '0123456789', // Invalid prefix
      wilaya: 'Oran',
      wilayaCode: 31,
      commune: 'Es Sénia',
      address: 'Cité Universitaire, Bloc B',
    });

    expect(partialFormResult.valid).toBe(false);
    expect(partialFormResult.errors.phone).toBeDefined();
    expect(partialFormResult.errors.fullName).toBeUndefined();
    expect(partialFormResult.errors.wilaya).toBeUndefined();
  });

  // ==========================================
  // Test 6: Successful COD Customer Dossier Packaging
  // ==========================================
  it('validates a complete, authentic Algerian COD customer shipping dossier', () => {
    const completeCustomer: CustomerShippingInfo = {
      fullName: 'Sofiane Feghouli',
      phone: '0555123456',
      wilaya: 'Alger',
      wilayaCode: 16,
      commune: 'El Biar',
      address: '14 Boulevard des Martyrs',
      notes: 'Appeler avant livraison svp',
    };

    const result = validateCheckoutForm(completeCustomer);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });
});
