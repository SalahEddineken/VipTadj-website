import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatDZD } from '@/lib/utils/formatDZD';
import {
  getLocalizedProduct,
  getLocalizedCategoryName,
  CATALOG_TRANSLATIONS,
} from '@/lib/i18n/catalog-translations';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { LanguageProvider } from '@/lib/context/language-context';
import { CartProvider } from '@/lib/context/cart-context';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { CartDrawer } from '@/components/store/CartDrawer';
import { MobileNavDrawer } from '@/components/store/MobileNavDrawer';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';

describe('Tier 1: RTL Layout & Algerian Retail Localization', () => {
  describe('Algerian Dinar (DZD) Multi-Locale Currency Formatter', () => {
    it('formats amounts in French with non-breaking spaces and DA suffix', () => {
      const formatted = formatDZD(18500, { locale: 'fr' });
      expect(formatted).toMatch(/18[\s\u00A0\u202F]500[\s\u00A0\u202F]DA/);
    });

    it('formats amounts in English with standard thousands commas and DZD suffix', () => {
      const formatted = formatDZD(18500, { locale: 'en' });
      expect(formatted.replace(/\u00a0/g, ' ')).toBe('18,500 DZD');
    });

    it('formats amounts in Arabic with Western Arabic numerals (0-9) and د.ج suffix', () => {
      const formatted = formatDZD(18500, { locale: 'ar' });
      expect(formatted).toMatch(/18[\s\u00A0\u202F]500[\s\u00A0\u202F]د\.ج/);
      // Confirms Western Arabic 0-9 numerals are used, not Eastern Arabic Indic numerals
      expect(formatted).toContain('18');
      expect(formatted).toContain('500');
    });

    it('handles zero and null/undefined values safely across all locales', () => {
      expect(formatDZD(0, { locale: 'fr' }).replace(/\u00a0/g, ' ')).toBe('0 DA');
      expect(formatDZD(0, { locale: 'en' }).replace(/\u00a0/g, ' ')).toBe('0 DZD');
      expect(formatDZD(0, { locale: 'ar' }).replace(/\u00a0/g, ' ')).toBe('0 د.ج');
      expect(formatDZD(null as any, { locale: 'fr' }).replace(/\u00a0/g, ' ')).toBe('0 DA');
    });
  });

  describe('Catalog & Category Localization', () => {
    it('translates all 18 seed products into Arabic and English', () => {
      expect(SEED_PRODUCTS.length).toBe(18);

      SEED_PRODUCTS.forEach((product) => {
        // Arabic
        const arProduct = getLocalizedProduct(product, 'ar');
        expect(arProduct.title).toBeDefined();
        expect(arProduct.title.length).toBeGreaterThan(0);
        expect(arProduct.description).toBeDefined();
        expect(arProduct.description.length).toBeGreaterThan(0);

        // English
        const enProduct = getLocalizedProduct(product, 'en');
        expect(enProduct.title).toBeDefined();
        expect(enProduct.title.length).toBeGreaterThan(0);
        expect(enProduct.description).toBeDefined();
        expect(enProduct.description.length).toBeGreaterThan(0);

        // French returns original
        const frProduct = getLocalizedProduct(product, 'fr');
        expect(frProduct.title).toBe(product.title);
        expect(frProduct.description).toBe(product.description);
      });
    });

    it('translates categories accurately across all 3 languages', () => {
      // Arabic
      expect(getLocalizedCategoryName('clothing', 'ar')).toBe('أزياء فاخرة');
      expect(getLocalizedCategoryName('shoes', 'ar')).toBe('أحذية');
      expect(getLocalizedCategoryName('accessories', 'ar')).toBe('إكسسوارات');

      // English
      expect(getLocalizedCategoryName('clothing', 'en')).toBe('Clothing');
      expect(getLocalizedCategoryName('shoes', 'en')).toBe('Footwear');
      expect(getLocalizedCategoryName('accessories', 'en')).toBe('Accessories');

      // French
      expect(getLocalizedCategoryName('clothing', 'fr')).toBe('Vêtements');
      expect(getLocalizedCategoryName('shoes', 'fr')).toBe('Chaussures');
      expect(getLocalizedCategoryName('accessories', 'fr')).toBe('Accessoires');
    });
  });

  describe('RTL Layout Adaptations & Directional Mirroring', () => {
    it('protects telephone numbers in AnnouncementBar with LTR isolation', () => {
      render(
        <LanguageProvider>
          <AnnouncementBar />
        </LanguageProvider>
      );

      const phoneLink = screen.getByRole('link', { name: /\+213/i });
      expect(phoneLink).toHaveAttribute('href', 'tel:+213550000000');
      expect(phoneLink.className).toContain('ltr-protect');
      expect(phoneLink.getAttribute('dir')).toBe('ltr');
    });

    it('configures CartDrawer with logical end-0 and border-s positioning', () => {
      render(
        <LanguageProvider>
          <CartDrawer isOpen={true} onClose={() => {}} />
        </LanguageProvider>
      );

      const aside = screen.getByRole('complementary');
      expect(aside.className).toContain('end-0');
      expect(aside.className).toContain('border-s');
    });

    it('configures MobileNavDrawer with logical start-0 and border-e positioning', () => {
      render(
        <LanguageProvider>
          <MobileNavDrawer isOpen={true} onClose={() => {}} />
        </LanguageProvider>
      );

      const dialog = screen.getByRole('dialog', { name: /navigation/i });
      const drawerPanel = dialog.querySelector('.fixed.inset-y-0.start-0');
      expect(drawerPanel).not.toBeNull();
      expect(drawerPanel?.className).toContain('start-0');
      expect(drawerPanel?.className).toContain('border-e');
    });
  });

  describe('ProductDetailPage Localization', () => {
    it('renders localized product title, description, and accordions in Arabic', () => {
      localStorage.setItem('vip_tadj_lang', 'ar');
      render(
        <LanguageProvider>
          <CartProvider>
            <ProductDetailPage product={SEED_PRODUCTS[0]} />
          </CartProvider>
        </LanguageProvider>
      );

      // Verify Arabic Title is rendered in h1 heading
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'بدلة كلاسيكية من قطعتين بصوف إيطالي فائق الجودة Super 130s',
        })
      ).toBeInTheDocument();

      // Verify Arabic Accordions Title is rendered
      expect(screen.getByText('التفاصيل والقصة الكلاسيكية')).toBeInTheDocument();
    });

    it('renders localized product title, description, and accordions in English', () => {
      localStorage.setItem('vip_tadj_lang', 'en');
      render(
        <LanguageProvider>
          <CartProvider>
            <ProductDetailPage product={SEED_PRODUCTS[0]} />
          </CartProvider>
        </LanguageProvider>
      );

      // Verify English Title is rendered in h1 heading
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: 'Two-Piece Italian Super 130s Wool Suit',
        })
      ).toBeInTheDocument();

      // Verify English Accordions Title is rendered
      expect(screen.getByText('Description & Tailored Cut')).toBeInTheDocument();
    });
  });
});
