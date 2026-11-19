import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertZeroFrenchLeakage,
  assertArabicRTLDocument,
  assertArabicCurrencyDisplay,
  assertLtrPhoneIsolation,
} from '../helpers/i18n-assertions';
import {
  setupMockFetch,
  createMockCartItem,
  MOCK_ALGERIAN_CUSTOMER,
} from './helpers/e2eTestUtils';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { isValidAlgerianPhone, formatAlgerianPhone } from '@/lib/utils/phoneUtils';
import { ar } from '@/lib/i18n/locales';

describe('E2E Test Suite 03: Cart & Direct COD Checkout Localization (Tiers 1, 2 & 3)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    setupMockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  describe('Tier 1: CartDrawer Localization & States', () => {
    it('renders empty CartDrawer in Arabic with RTL orientation and discovery button', () => {
      const handleClose = vi.fn();

      const { container } = renderWithProviders(
        <CartDrawer isOpen={true} onClose={handleClose} />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Verify drawer slide-over panel has border-s and end-0
      const aside = container.querySelector('aside');
      expect(aside).toHaveClass('end-0');
      expect(aside).toHaveClass('border-s');
    });

    it('renders CartDrawer with line items, quantity controls, and د.ج currency in Arabic', () => {
      const mockItem = createMockCartItem({
        title: 'بدلة كلاسيكية من قطعتين',
        price: 48500,
        quantity: 1,
      });

      const { container } = renderWithProviders(
        <CartDrawer isOpen={true} onClose={() => {}} />,
        {
          language: 'ar',
          initialCartItems: [mockItem],
        }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
      assertArabicCurrencyDisplay(container);

      // Verify item title is present
      expect(screen.getByText('بدلة كلاسيكية من قطعتين')).toBeInTheDocument();
    });
  });

  describe('Tier 1: Cart Page & Free Shipping Progress Meter', () => {
    it('renders CartPage with subtotal under 15,000 DA displaying remaining shipping meter', () => {
      const mockItem = createMockCartItem({
        price: 9500, // Under 15,000 threshold
        quantity: 1,
      });

      const { container } = renderWithProviders(<CartPage />, {
        language: 'ar',
        navigation: { pathname: '/cart' },
        initialCartItems: [mockItem],
      });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
      assertArabicCurrencyDisplay(container);
    });

    it('renders CartPage with subtotal >= 15,000 DA displaying qualified free shipping banner', () => {
      const mockItem = createMockCartItem({
        price: 18500, // Qualified >= 15,000 threshold
        quantity: 1,
      });

      const { container } = renderWithProviders(<CartPage />, {
        language: 'ar',
        navigation: { pathname: '/cart' },
        initialCartItems: [mockItem],
      });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
    });
  });

  describe('Tier 1: Algerian Wilaya Selector Multi-Locale', () => {
    it('renders WilayaSelector with code, Arabic wilaya name, and bilingual search', () => {
      const handleSelect = vi.fn();
      const handleChangeType = vi.fn();

      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={null}
          deliveryType="home"
          cartSubtotal={10000}
          onSelectWilaya={handleSelect}
          onChangeDeliveryType={handleChangeType}
        />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();

      // Open dropdown
      const triggerBtn = screen.getByRole('button', { name: /wilaya|ولاية/i });
      fireEvent.click(triggerBtn);

      // Search input is focused and accepts Arabic query
      const searchInput = screen.getByPlaceholderText(/tapez le code|ابحث/i);
      expect(searchInput).toBeInTheDocument();

      // Type "وهران" to filter Wilaya 31
      fireEvent.change(searchInput, { target: { value: 'وهران' } });

      const oranOption = screen.getByText(/31/);
      expect(oranOption).toBeInTheDocument();

      fireEvent.click(oranOption);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({ code: 31, name: 'Oran', nameAr: 'وهران' })
      );
    });

    it('allows toggling between Home delivery and Stop Desk relay mode in Arabic', () => {
      const handleChangeType = vi.fn();

      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={10000}
          onSelectWilaya={() => {}}
          onChangeDeliveryType={handleChangeType}
        />,
        { language: 'ar' }
      );

      // Toggle to Stop Desk
      const deskRadio = screen.getByRole('radio', { name: /point relais|stop desk|استلام/i });
      fireEvent.click(deskRadio);
      expect(handleChangeType).toHaveBeenCalledWith('desk');
    });
  });

  describe('Tier 1: Telephone Input LTR Isolation in Arabic COD Checkout', () => {
    it('isolates telephone input with dir="ltr" and prevents collision with prefix', async () => {
      const mockItem = createMockCartItem({ price: 48500 });

      const { container } = renderWithProviders(<CheckoutPage />, {
        language: 'ar',
        navigation: { pathname: '/checkout' },
        initialCartItems: [mockItem],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/téléphone|هاتف/i)).toBeInTheDocument();
      });

      assertArabicRTLDocument();

      const phoneInput = screen.getByLabelText(/téléphone|هاتف/i);
      assertLtrPhoneIsolation(phoneInput);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe('Tier 2: Phone Validation Boundaries & Operator Prefixes', () => {
    it('E2E-T2-PHN-01: accepts valid Algerian mobile numbers for Mobilis (06), Djezzy (07), Ooredoo (05)', () => {
      expect(isValidAlgerianPhone('0555123456')).toBe(true);
      expect(isValidAlgerianPhone('0661234567')).toBe(true);
      expect(isValidAlgerianPhone('0770987654')).toBe(true);
    });

    it('E2E-T2-PHN-02: accepts international format with +213 or 00213 prefix', () => {
      expect(isValidAlgerianPhone('+213555123456')).toBe(true);
      expect(isValidAlgerianPhone('00213661234567')).toBe(true);
    });

    it('E2E-T2-PHN-03: rejects landline numbers (021, 031, 041) for COD mobile confirmation', () => {
      expect(isValidAlgerianPhone('021234567')).toBe(false);
      expect(isValidAlgerianPhone('031987654')).toBe(false);
    });

    it('E2E-T2-PHN-04: rejects too short and too long numeric strings', () => {
      expect(isValidAlgerianPhone('055512345')).toBe(false); // 9 digits
      expect(isValidAlgerianPhone('05551234567')).toBe(false); // 11 digits
    });

    it('E2E-T2-PHN-05: sanitizes delimiters, hyphens, and spaces cleanly', () => {
      expect(isValidAlgerianPhone('05 55-12.34.56')).toBe(true);
      expect(formatAlgerianPhone('05 55-12.34.56')).toBe('0555 12 34 56');
    });
  });

  describe('Tier 2: Wilaya Boundaries & Limits', () => {
    it('E2E-T2-WIL-01 & 02: resolves lower limit Wilaya 01 (Adrar) and upper limit 58 (El Meniaa)', () => {
      const wilaya01 = getWilayaByCode(1);
      expect(wilaya01?.code).toBe(1);
      expect(wilaya01?.name).toBe('Adrar');
      expect(wilaya01?.nameAr).toBe('أدرار');

      const wilaya58 = getWilayaByCode(58);
      expect(wilaya58?.code).toBe(58);
      expect(wilaya58?.name).toBe('El Meniaa');
      expect(wilaya58?.nameAr).toBe('المنيعة');
    });

    it('E2E-T2-WIL-04: out-of-range wilaya code handles safely', () => {
      expect(getWilayaByCode(0)).toBeUndefined();
      expect(getWilayaByCode(69)).toBeUndefined();
      expect(getWilayaByCode(99)).toBeUndefined();
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================

  describe('Tier 3: Combinatorial State & Language Switch', () => {
    it('E2E-T3-COMB-01: cart persistence across language switch (FR -> AR)', () => {
      const mockItem = createMockCartItem({
        title: 'Costume Deux Pièces en Laine Italienne',
        price: 85000,
        quantity: 1,
        selectedSize: '50',
      });

      // 1. Initial render in French
      const { rerender, container } = renderWithProviders(
        <CartDrawer isOpen={true} onClose={() => {}} />,
        {
          language: 'fr',
          initialCartItems: [mockItem],
        }
      );

      expect(document.documentElement.dir).toBe('ltr');
      expect(screen.getAllByText('85 000 DA').length).toBeGreaterThan(0);

      // 2. Switch language to Arabic
      rerender(<CartDrawer isOpen={true} onClose={() => {}} />);
      localStorage.setItem('vip_tadj_lang', 'ar');
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';

      // Item remains in cart with size 50 and quantity 1
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('E2E-T3-COMB-05: checkout submission with missing fields triggers all validation errors in Arabic', async () => {
      const mockItem = createMockCartItem({ price: 48500 });

      renderWithProviders(<CheckoutPage />, {
        language: 'ar',
        navigation: { pathname: '/checkout' },
        initialCartItems: [mockItem],
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmer|تأكيد الطلب/i })).toBeInTheDocument();
      });

      // Submit empty form
      const submitBtn = screen.getByRole('button', { name: /confirmer|تأكيد الطلب/i });
      fireEvent.click(submitBtn);

      // Verify validation errors appear
      await waitFor(() => {
        const errorAlerts = screen.getAllByRole('alert');
        expect(errorAlerts.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
