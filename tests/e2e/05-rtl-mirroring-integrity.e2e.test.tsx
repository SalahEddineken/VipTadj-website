import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertZeroFrenchLeakage,
  assertArabicRTLDocument,
  assertDocumentDirection,
  assertLtrPhoneIsolation,
  assertArabicCurrencyDisplay,
} from '../helpers/i18n-assertions';
import { setupMockFetch } from './helpers/e2eTestUtils';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { CartDrawer } from '@/components/store/CartDrawer';
import { MobileNavDrawer } from '@/components/store/MobileNavDrawer';
import { PDPBreadcrumb } from '@/components/store/pdp/PDPBreadcrumb';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { formatDZD } from '@/lib/utils/formatDZD';

describe('E2E Test Suite 05: RTL Mirroring, Directional Icons & Typography Integrity (Tier 1)', () => {
  const suitProduct = SEED_PRODUCTS[0];

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

  describe('Tier 1: Document Root & Directional Attributes', () => {
    it('sets dir="rtl", lang="ar", and rtl class on documentElement in Arabic', () => {
      renderWithProviders(<div>Test RTL Root</div>, { language: 'ar' });

      assertArabicRTLDocument();
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.classList.contains('rtl')).toBe(true);
    });

    it('sets dir="ltr", lang="fr", and removes rtl class in French', () => {
      renderWithProviders(<div>Test LTR Root</div>, { language: 'fr' });

      assertDocumentDirection('ltr', 'fr');
      expect(document.documentElement.classList.contains('rtl')).toBe(false);
    });

    it('sets dir="ltr", lang="en", and removes rtl class in English', () => {
      renderWithProviders(<div>Test LTR Root</div>, { language: 'en' });

      assertDocumentDirection('ltr', 'en');
      expect(document.documentElement.classList.contains('rtl')).toBe(false);
    });
  });

  describe('Tier 1: Directional Icon Mirroring (rtl:rotate-180)', () => {
    it('applies rtl:rotate-180 to breadcrumb navigation chevrons in PDPBreadcrumb', () => {
      const { container } = renderWithProviders(
        <PDPBreadcrumb product={suitProduct} />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Check all chevrons inside the breadcrumb navigation
      const nav = screen.getByRole('navigation', { name: /fil d'ariane|مسار|breadcrumb/i });
      const chevrons = nav.querySelectorAll('svg');
      expect(chevrons.length).toBeGreaterThanOrEqual(2);

      chevrons.forEach((chevron) => {
        expect(chevron.className.baseVal || chevron.getAttribute('class')).toContain(
          'rtl:rotate-180'
        );
      });
    });
  });

  describe('Tier 1: Drawer Slide-Over Logical Alignment', () => {
    it('aligns CartDrawer to logical end-0 with border-s for RTL mirroring', () => {
      const { container } = renderWithProviders(
        <CartDrawer isOpen={true} onClose={() => {}} />,
        { language: 'ar' }
      );

      const aside = container.querySelector('aside');
      expect(aside).not.toBeNull();
      expect(aside?.className).toContain('end-0');
      expect(aside?.className).toContain('border-s');
    });

    it('aligns MobileNavDrawer to logical start-0 with border-e for RTL mirroring', () => {
      const { container } = renderWithProviders(
        <MobileNavDrawer isOpen={true} onClose={() => {}} />,
        { language: 'ar' }
      );

      const dialog = screen.getByRole('dialog', { name: /navigation|قائمة التنقل/i });
      const drawerPanel = dialog.querySelector('.start-0');
      expect(drawerPanel).not.toBeNull();
      expect(drawerPanel?.className).toContain('start-0');
      expect(drawerPanel?.className).toContain('border-e');
    });
  });

  describe('Tier 1: Telephone Numbers & Link Strict LTR Isolation', () => {
    it('enforces dir="ltr" and ltr-protect class on phone links in AnnouncementBar', () => {
      const { container } = renderWithProviders(<AnnouncementBar />, { language: 'ar' });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      const phoneLink = screen.getByRole('link', { name: /\+213/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:+213550000000');
      assertLtrPhoneIsolation(phoneLink);
    });
  });

  describe('Tier 1: Algerian DZD Currency Formatter Typography', () => {
    it('formats amounts in Arabic with Western numerals (0-9) and د.ج suffix', () => {
      const formatted = formatDZD(48500, { locale: 'ar' });

      expect(formatted).toMatch(/48[\s\u00A0\u202F]500[\s\u00A0\u202F]د\.ج/);
      expect(formatted).toContain('48');
      expect(formatted).toContain('500');
      expect(formatted).not.toContain('DA');
      expect(formatted).not.toContain('DZD');
    });

    it('formats amounts in French with DA suffix and English with DZD suffix', () => {
      const formattedFr = formatDZD(48500, { locale: 'fr' });
      expect(formattedFr).toMatch(/48[\s\u00A0\u202F]500[\s\u00A0\u202F]DA/);

      const formattedEn = formatDZD(48500, { locale: 'en' });
      expect(formattedEn.replace(/\u00a0/g, ' ')).toBe('48,500 DZD');
    });
  });
});
