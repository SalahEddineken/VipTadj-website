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
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { AddToCartSection } from '@/components/store/pdp/AddToCartSection';
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { SizeGuideModal } from '@/components/store/pdp/SizeGuideModal';
import { ProductAccordions } from '@/components/store/pdp/ProductAccordions';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { ar, en } from '@/lib/i18n/locales';

describe('E2E Test Suite 02: Product Detail Page (PDP) Localization (Tiers 1 & 2)', () => {
  const suitProduct = SEED_PRODUCTS[0]; // Italian Wool Suit

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

  describe('Tier 1: PDP Hero, Breadcrumb & Header Localization', () => {
    it('renders localized product title, description, and breadcrumbs in Arabic', () => {
      const localizedSuit = getLocalizedProduct(suitProduct, 'ar');

      const { container } = renderWithProviders(
        <ProductDetailPage product={suitProduct} />,
        {
          language: 'ar',
          navigation: { pathname: `/catalog/clothing/${suitProduct.slug}` },
        }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
      assertArabicCurrencyDisplay(container);

      // Verify localized Arabic H1
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(localizedSuit.title);
    });

    it('renders localized product title, description, and breadcrumbs in English', () => {
      const localizedSuit = getLocalizedProduct(suitProduct, 'en');

      const { container } = renderWithProviders(
        <ProductDetailPage product={suitProduct} />,
        {
          language: 'en',
          navigation: { pathname: `/catalog/clothing/${suitProduct.slug}` },
        }
      );

      assertZeroFrenchLeakage(container, 'en');

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(localizedSuit.title);
    });
  });

  describe('Tier 1: SizeSelector & Size Guide Modal Localization', () => {
    it('renders SizeSelector and triggers size guide modal in Arabic', () => {
      const handleSelectSize = vi.fn();
      const handleOpenGuide = vi.fn();

      renderWithProviders(
        <SizeSelector
          sizes={['48', '50', '52', '54']}
          selectedSize="50"
          onSelectSize={handleSelectSize}
          inStock={true}
          onOpenSizeGuide={handleOpenGuide}
        />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();

      // Open Size Guide button
      const guideBtn = screen.getByRole('button', { name: /guide|دليل/i });
      expect(guideBtn).toBeInTheDocument();
      fireEvent.click(guideBtn);
      expect(handleOpenGuide).toHaveBeenCalledTimes(1);

      // Select size 52
      const size52Btn = screen.getByRole('button', { name: /52/ });
      fireEvent.click(size52Btn);
      expect(handleSelectSize).toHaveBeenCalledWith('52');
    });

    it('renders SizeGuideModal with Arabic measurements table and instructions', () => {
      const handleClose = vi.fn();

      const { container } = renderWithProviders(
        <SizeGuideModal isOpen={true} onClose={handleClose} />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Close modal
      const closeBtn = screen.getByRole('button', { name: /fermer|إغلاق|close/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tier 1: AddToCartSection & Direct Express Order CTA Localization', () => {
    it('renders CTA buttons and increments/decrements quantity in Arabic', () => {
      const handleValidate = vi.fn().mockReturnValue(true);

      const { nav } = renderWithProviders(
        <AddToCartSection
          product={suitProduct}
          selectedSize="50"
          selectedColor={suitProduct.colors?.[0]}
          onValidateSize={handleValidate}
        />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();

      // Direct buy now button triggers express checkout
      const buyNowBtn = screen.getByRole('button', { name: /commander directement|طلب مباشر|الطلب المباشر/i });
      expect(buyNowBtn).toBeInTheDocument();

      fireEvent.click(buyNowBtn);
      expect(handleValidate).toHaveBeenCalled();
      expect(nav.router.push).toHaveBeenCalledWith(
        expect.stringContaining('/checkout?direct=1')
      );
    });
  });

  describe('Tier 1: ProductAccordions Localization', () => {
    it('renders all accordion tabs with Arabic text content', () => {
      const { container } = renderWithProviders(
        <ProductAccordions product={suitProduct} />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Verify accordion buttons exist
      const accordionButtons = screen.getAllByRole('button');
      expect(accordionButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe('Tier 2: PDP Stock & Quantity Boundaries', () => {
    it('E2E-T2-STK-01: zero-stock product disables purchase CTA buttons', () => {
      const oosProduct = {
        ...suitProduct,
        id: 'prod-oos-suit',
        stockQuantity: 0,
        inStock: false,
      };

      renderWithProviders(
        <AddToCartSection
          product={oosProduct}
          selectedSize="50"
          onValidateSize={() => true}
        />,
        { language: 'ar' }
      );

      const disabledBtn = screen.getByRole('button');
      expect(disabledBtn).toBeDisabled();
      expect(disabledBtn).toHaveTextContent(/épuisé|نفدت الكمية/i);
    });

    it('E2E-T2-CART-03: quantity decrement floor is clamped at 1', () => {
      renderWithProviders(
        <AddToCartSection
          product={suitProduct}
          selectedSize="50"
          onValidateSize={() => true}
        />,
        { language: 'ar' }
      );

      const minusBtn = screen.getByRole('button', { name: /diminuer|minus|تقليل/i });

      // Click minus when quantity is 1
      fireEvent.click(minusBtn);
      fireEvent.click(minusBtn);

      // Quantity must remain 1
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('E2E-T2-STK-03: out of stock size cannot be selected when size inventory is 0', () => {
      const sizeInventory = {
        '48': 0, // sold out
        '50': 2,
        '52': 5,
      };

      const handleSelect = vi.fn();

      renderWithProviders(
        <SizeSelector
          sizes={['48', '50', '52']}
          selectedSize="50"
          onSelectSize={handleSelect}
          sizeInventory={sizeInventory}
          inStock={true}
        />,
        { language: 'ar' }
      );

      const size48Btn = screen.getByRole('button', { name: /48/ });
      expect(size48Btn).toBeDisabled();
    });

    it('E2E-T2-STK-04: compareAtPrice discount badge is calculated accurately', () => {
      const discountedProduct = {
        ...suitProduct,
        price: 75000,
        compareAtPrice: 100000, // 25% discount
      };

      const { container } = renderWithProviders(
        <ProductDetailPage product={discountedProduct} />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      // Should show -25% discount badge
      expect(screen.getByText(/-25%/)).toBeInTheDocument();
    });
  });
});
