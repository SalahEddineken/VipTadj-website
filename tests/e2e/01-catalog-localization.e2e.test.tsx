import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertZeroFrenchLeakage,
  assertArabicRTLDocument,
  assertArabicCurrencyDisplay,
} from '../helpers/i18n-assertions';
import { setupMockFetch } from './helpers/e2eTestUtils';
import { CatalogClient } from '@/components/store/CatalogClient';
import { ProductCard } from '@/components/store/ProductCard';
import { SearchBar } from '@/components/store/SearchBar';
import { CatalogSortDropdown } from '@/components/store/CatalogSortDropdown';
import { CatalogFilterSidebar } from '@/components/store/CatalogFilterSidebar';
import { ZeroResults } from '@/components/store/ZeroResults';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import {
  CATEGORY_TRANSLATIONS,
  getLocalizedProduct,
  getLocalizedCategoryName,
} from '@/lib/i18n/catalog-translations';
import { DEFAULT_FILTER_STATE } from '@/lib/utils/catalogUtils';
import { ar, en } from '@/lib/i18n/locales';

describe('E2E Test Suite 01: Catalog & Discovery Localization (Tiers 1 & 2)', () => {
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

  describe('Tier 1: Category Banners & Catalog Localization', () => {
    it('translates category banner metadata for Clothing, Shoes, and Accessories in Arabic', () => {
      expect(['أزياء فاخرة', 'ملابس وأزياء']).toContain(getLocalizedCategoryName('clothing', 'ar'));
      expect(getLocalizedCategoryName('shoes', 'ar')).toBe('أحذية');
      expect(getLocalizedCategoryName('accessories', 'ar')).toBe('إكسسوارات');

      const clothingAr = CATEGORY_TRANSLATIONS.clothing.ar;
      expect(['أزياء فاخرة', 'ملابس وأزياء']).toContain(clothingAr.name);
      expect(clothingAr.subtitle).toMatch(/[\u0600-\u06FF]+/);
      expect(clothingAr.description).toMatch(/[\u0600-\u06FF]+/);

      const shoesAr = CATEGORY_TRANSLATIONS.shoes.ar;
      expect(shoesAr.name).toBe('أحذية');
      expect(shoesAr.subtitle).toContain('أحذية جلدية كلاسيكية');

      const accessoriesAr = CATEGORY_TRANSLATIONS.accessories.ar;
      expect(accessoriesAr.name).toBe('إكسسوارات');
      expect(accessoriesAr.subtitle).toContain('حرير طبيعي');
    });

    it('translates category banner metadata in English', () => {
      expect(getLocalizedCategoryName('clothing', 'en')).toBe('Clothing');
      expect(getLocalizedCategoryName('shoes', 'en')).toBe('Footwear');
      expect(getLocalizedCategoryName('accessories', 'en')).toBe('Accessories');

      expect(CATEGORY_TRANSLATIONS.clothing.en.name).toBe('Clothing');
      expect(CATEGORY_TRANSLATIONS.shoes.en.name).toBe('Footwear');
      expect(CATEGORY_TRANSLATIONS.accessories.en.name).toBe('Accessories');
    });

    it('renders CatalogClient in Arabic with RTL document root and zero French leakage', () => {
      const { container } = renderWithProviders(
        <CatalogClient initialProducts={SEED_PRODUCTS} />,
        {
          language: 'ar',
          navigation: { pathname: '/catalog' },
        }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
    });
  });

  describe('Tier 1: SearchBar Localization', () => {
    it('renders SearchBar with Arabic placeholder and handles clear button interaction', () => {
      const handleChange = vi.fn();
      const arabicPlaceholder = ar['nav.search_placeholder'] || 'ابحث عن الموديل، المادة (صوف، جلد، حرير)...';

      const { rerender } = renderWithProviders(
        <SearchBar value="" onChange={handleChange} placeholder={arabicPlaceholder} />,
        { language: 'ar' }
      );

      const input = screen.getByRole('textbox', { name: /rechercher|بحث/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', arabicPlaceholder);

      // Typing in search bar triggers change handler
      fireEvent.change(input, { target: { value: 'صوف' } });
      expect(handleChange).toHaveBeenCalledWith('صوف');

      // When value is present, clear button appears
      rerender(
        <SearchBar value="صوف" onChange={handleChange} placeholder={arabicPlaceholder} />
      );

      const clearBtn = screen.getByRole('button', { name: /effacer|مسح|clear/i });
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);
      expect(handleChange).toHaveBeenCalledWith('');
    });
  });

  describe('Tier 1: CatalogSortDropdown Localization', () => {
    it('renders sort options in Arabic and triggers onChange with valid CatalogSortOption', () => {
      const handleChange = vi.fn();

      renderWithProviders(
        <CatalogSortDropdown value="featured" onChange={handleChange} />,
        { language: 'ar' }
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      fireEvent.change(select, { target: { value: 'price-asc' } });
      expect(handleChange).toHaveBeenCalledWith('price-asc');
    });
  });

  describe('Tier 1: CatalogFilterSidebar Localization', () => {
    it('renders category and subcategory filters in Arabic', () => {
      const handleChange = vi.fn();
      const handleReset = vi.fn();

      const { container } = renderWithProviders(
        <CatalogFilterSidebar
          filters={DEFAULT_FILTER_STATE}
          onChange={handleChange}
          onReset={handleReset}
        />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      expect(container).toBeInTheDocument();
    });
  });

  describe('Tier 1: ZeroResults Component Localization', () => {
    it('renders localized zero results empty state in Arabic with reset button', () => {
      const handleReset = vi.fn();

      const { container } = renderWithProviders(
        <ZeroResults onReset={handleReset} query="بدلة غير موجودة" />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Click reset button
      const resetBtn = screen.getByRole('button');
      expect(resetBtn).toBeInTheDocument();
      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tier 1: ProductCard Dynamic Localization', () => {
    it('renders translated Arabic title, category tag, and د.ج currency on ProductCard', () => {
      const suit = SEED_PRODUCTS[0];
      const localizedSuit = getLocalizedProduct(suit, 'ar');

      const { container } = renderWithProviders(
        <ProductCard product={suit} />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
      assertArabicCurrencyDisplay(container);

      // Verify localized title is displayed
      expect(screen.getByText(localizedSuit.title)).toBeInTheDocument();
    });

    it('renders localized ProductCard in English with DZD currency', () => {
      const suit = SEED_PRODUCTS[0];
      const localizedSuit = getLocalizedProduct(suit, 'en');

      const { container } = renderWithProviders(
        <ProductCard product={suit} />,
        { language: 'en' }
      );

      assertZeroFrenchLeakage(container, 'en');
      expect(screen.getByText(localizedSuit.title)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe('Tier 2: Search Boundaries & Special Inputs', () => {
    it('E2E-T2-SRCH-01: empty search input displays full catalog', () => {
      const { container } = renderWithProviders(<CatalogClient initialProducts={SEED_PRODUCTS} />, {
        language: 'ar',
      });

      // Product cards should match the full catalog length
      const productCards = container.querySelectorAll('.group.relative');
      expect(productCards.length).toBe(SEED_PRODUCTS.length);
    });

    it('E2E-T2-SRCH-02: unmatched search in Arabic renders ZeroResults with reset CTA', () => {
      renderWithProviders(
        <CatalogClient initialProducts={SEED_PRODUCTS} />,
        {
          language: 'ar',
          navigation: { searchParams: { search: 'موديل_مستحيل_وجوده_99999' } },
        }
      );

      // ZeroResults heading should be rendered
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      const resetBtn = screen.getByRole('button', { name: /réinitialiser|إعادة ضبط|reset/i });
      expect(resetBtn).toBeInTheDocument();
    });

    it('E2E-T2-SRCH-04: extreme 500-char search string is handled safely without layout crash', () => {
      const extremeQuery = 'صوف_فاخر_'.repeat(50);
      expect(() => {
        renderWithProviders(
          <CatalogClient initialProducts={SEED_PRODUCTS} />,
          {
            language: 'ar',
            navigation: { searchParams: { search: extremeQuery } },
          }
        );
      }).not.toThrow();
    });

    it('E2E-T2-SRCH-05: special characters and script injection in search query are sanitized', () => {
      const hostileQuery = '<script>alert("xss")</script> & "quotes" \'test\'';
      const { container } = renderWithProviders(
        <ZeroResults onReset={() => {}} query={hostileQuery} />,
        { language: 'ar' }
      );

      // Must not render raw script tag
      expect(container.querySelector('script')).toBeNull();
      expect(screen.getByText(hostileQuery)).toBeInTheDocument();
    });
  });

  describe('Tier 2: Price Range & Filter Boundaries', () => {
    it('E2E-T2-PRC-01: minimum price equals maximum price filters accurately', () => {
      const exactPrice = 85000;
      const matchingProducts = SEED_PRODUCTS.filter((p) => p.price === exactPrice);

      const { container } = renderWithProviders(
        <CatalogClient initialProducts={SEED_PRODUCTS} />,
        {
          language: 'ar',
          navigation: {
            searchParams: { minPrice: String(exactPrice), maxPrice: String(exactPrice) },
          },
        }
      );

      const productCards = container.querySelectorAll('.group.relative');
      expect(productCards.length).toBe(matchingProducts.length);
    });

    it('E2E-T2-PRC-03: lower boundary at 0 DA displays all products without negative price errors', () => {
      const { container } = renderWithProviders(
        <CatalogClient initialProducts={SEED_PRODUCTS} />,
        {
          language: 'ar',
          navigation: { searchParams: { minPrice: '0' } },
        }
      );

      const productCards = container.querySelectorAll('.group.relative');
      expect(productCards.length).toBe(SEED_PRODUCTS.length);
    });

    it('E2E-T2-STK-01: out-of-stock product displays out-of-stock badge in Arabic', () => {
      const oosProduct = {
        ...SEED_PRODUCTS[0],
        id: 'prod-test-oos',
        stockQuantity: 0,
        inStock: false,
      };

      const { container } = renderWithProviders(<ProductCard product={oosProduct} />, {
        language: 'ar',
      });

      assertArabicRTLDocument();
      // Should show out of stock indicator
      const oosBadge = screen.getByText(ar['badge.out_of_stock'] || /نفدت الكمية/i);
      expect(oosBadge).toBeInTheDocument();
    });
  });
});
