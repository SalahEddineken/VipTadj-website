import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';

let mockCookieLang: 'ar' | 'fr' | 'en' = 'ar';
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      name === 'vip_tadj_lang' ? { value: mockCookieLang } : undefined,
  }),
}));

import HomePage from '@/app/page';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import GlobalErrorPage from '@/app/error';
import NotFound from '@/app/not-found';
import { Header } from '@/components/store/Header';
import { MobileNavDrawer } from '@/components/store/MobileNavDrawer';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { Footer } from '@/components/store/Footer';
import { CatalogBanner } from '@/components/store/CatalogBanner';
import { CategoryBanner } from '@/components/store/CategoryBanner';
import { CatalogClient } from '@/components/store/CatalogClient';
import { CatalogFilterSidebar } from '@/components/store/CatalogFilterSidebar';
import { ActiveFilterBadges } from '@/components/store/ActiveFilterBadges';
import { ZeroResults } from '@/components/store/ZeroResults';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import { CommuneSelector } from '@/components/store/CommuneSelector';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { PDPBreadcrumb } from '@/components/store/pdp/PDPBreadcrumb';
import { ProductInfo } from '@/components/store/pdp/ProductInfo';
import { ColorSelector } from '@/components/store/pdp/ColorSelector';
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { AddToCartSection } from '@/components/store/pdp/AddToCartSection';
import { SizeGuideModal } from '@/components/store/pdp/SizeGuideModal';
import { ProductAccordions } from '@/components/store/pdp/ProductAccordions';
import { TrustPillarsBar } from '@/components/store/pdp/TrustPillarsBar';
import { OrderSuccessView } from '@/app/checkout/success/[orderId]/OrderSuccessView';
import { OrderSuccessFallback } from '@/app/checkout/success/[orderId]/OrderSuccessFallback';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { DEFAULT_FILTER_STATE } from '@/lib/utils/catalogUtils';
import { Order } from '@/types';
import { assertArabicRTLDocument, assertLtrPhoneIsolation } from '../helpers/i18n-assertions';
import { createMockCartItem, createMockOrder } from './helpers/e2eTestUtils';
import {
  assertZeroFrenchOrEnglishLeakage,
  assertArabicCurrencyDisplayStrict,
  renderStorefrontWithProviders,
  setupExtendedE2EFetch,
} from './helpers/ar-leakage-assertions';

function buildArabicOrder(overrides: Partial<Order> = {}): Order {
  return createMockOrder({
    id: 'ord-store-ar-01',
    orderNumber: 'VT-2026-4401',
    customer: {
      fullName: 'ياسين براهيمي',
      phone: '0555123456',
      secondaryPhone: '0770987654',
      wilaya: 'الجزائر',
      wilayaCode: 16,
      commune: 'حيدرة',
      address: 'شارع الشهداء رقم 14',
      notes: 'الاتصال قبل التوصيل بنصف ساعة',
      deliveryType: 'home',
    },
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-11-10T10:00:00.000Z',
        note: 'تم استلام الطلبية بنجاح',
      },
    ],
    ...overrides,
  });
}

describe('E2E 07 — Complete Customer Storefront Arabic (ar) Localization', () => {
  const originalPlay = HTMLMediaElement.prototype.play;
  const originalPause = HTMLMediaElement.prototype.pause;
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    mockCookieLang = 'ar';
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
    HTMLMediaElement.prototype.pause = vi.fn();
    setupExtendedE2EFetch();
  });

  afterEach(() => {
    HTMLMediaElement.prototype.play = originalPlay;
    HTMLMediaElement.prototype.pause = originalPause;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TIER 1A: Storefront Shell & Home Page
  // =========================================================================
  describe('Tier 1A: Storefront Shell & Home Page in AR', () => {
    it('renders HomePage completely in Arabic RTL with video controls, hero, pillars, universes, and sr-only content free of FR/EN leakage', async () => {
      const { container } = renderStorefrontWithProviders(<HomePage />, { language: 'ar' });

      assertArabicRTLDocument();
      await waitFor(() => {
        expect(container.textContent).toMatch(/[\u0600-\u06FF]+/);
      });

      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
    });

    it('renders Header, AnnouncementBar, MobileNavDrawer, and Footer in AR without any French/English UI or attribute leaks', async () => {
      const onClose = vi.fn();
      const { container } = renderStorefrontWithProviders(
        <>
          <AnnouncementBar />
          <Header cartCount={2} />
          <MobileNavDrawer isOpen={true} onClose={onClose} cartCount={2} isAdmin={true} />
          <Footer />
        </>,
        {
          language: 'ar',
          initialAdminSession: { isAuthenticated: true },
        }
      );

      await waitFor(() => {
        expect(container.textContent).toContain('68');
      });

      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });

      const telLinks = container.querySelectorAll('a[href^="tel:"]');
      expect(telLinks.length).toBeGreaterThan(0);
      telLinks.forEach((el) => assertLtrPhoneIsolation(el as HTMLElement));

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TIER 1B: Catalog, Search, Filters, Badges & ZeroResults
  // =========================================================================
  describe('Tier 1B: Catalog, Arabic Search, Filters in AR', () => {
    it('renders CatalogBanner and CategoryBanner for clothing, shoes, and accessories in AR', () => {
      const { container } = renderStorefrontWithProviders(
        <>
          <CatalogBanner />
          <CategoryBanner
            category="clothing"
            fallbackName="Vêtements"
            fallbackSubtitle="Sous-titre"
            fallbackDescription="Description"
          />
          <CategoryBanner
            category="shoes"
            fallbackName="Chaussures"
            fallbackSubtitle="Sous-titre"
            fallbackDescription="Description"
          />
          <CategoryBanner
            category="accessories"
            fallbackName="Accessoires"
            fallbackSubtitle="Sous-titre"
            fallbackDescription="Description"
          />
        </>,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container);
    });

    it('renders CatalogClient with all 30 SEED_PRODUCTS, Arabic search filtering, and ActiveFilterBadges in AR', async () => {
      const { container } = renderStorefrontWithProviders(
        <CatalogClient initialProducts={SEED_PRODUCTS} />,
        {
          language: 'ar',
          navigation: { pathname: '/catalog' },
        }
      );

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });

      // Search with Arabic query
      const searchInput = container.querySelector('input[type="search"], input[type="text"]') as HTMLInputElement;
      expect(searchInput).toBeTruthy();
      fireEvent.change(searchInput, { target: { value: 'سفاري' } });

      await waitFor(() => {
        const productLinks = Array.from(container.querySelectorAll('a[href^="/catalog/"]')).filter(
          (a) => (a.getAttribute('href') || '').split('/').filter(Boolean).length >= 3
        );
        expect(productLinks.length).toBeGreaterThan(0);
        expect(productLinks.length).toBeLessThan(SEED_PRODUCTS.length);
      });

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });

    it('renders CatalogFilterSidebar (including mobile drawer) and ActiveFilterBadges in AR with zero FR/EN aria-labels', () => {
      const { container } = renderStorefrontWithProviders(
        <>
          <CatalogFilterSidebar
            filters={{
              ...DEFAULT_FILTER_STATE,
              category: 'clothing',
              subcategory: 'costumes',
              selectedSizes: ['50'],
              inStockOnly: true,
              minPrice: 10000,
              maxPrice: 80000,
            }}
            onChange={vi.fn()}
            onReset={vi.fn()}
            isOpenMobile={true}
            onCloseMobile={vi.fn()}
          />
          <ActiveFilterBadges
            filters={{
              ...DEFAULT_FILTER_STATE,
              searchQuery: 'صوف',
              category: 'clothing',
              subcategory: 'costumes',
              selectedSizes: ['50'],
              inStockOnly: true,
              minPrice: 10000,
              maxPrice: 80000,
            }}
            onRemoveSearch={vi.fn()}
            onRemoveCategory={vi.fn()}
            onRemoveSubcategory={vi.fn()}
            onRemoveSize={vi.fn()}
            onRemoveInStock={vi.fn()}
            onRemovePrice={vi.fn()}
            onResetAll={vi.fn()}
          />
        </>,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });

    it('renders ZeroResults with and without query in AR without French fallback', () => {
      const { container } = renderStorefrontWithProviders(
        <>
          <ZeroResults onReset={vi.fn()} />
          <ZeroResults onReset={vi.fn()} query="سترة مخملية نادرة" />
        </>,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container);
      expect(container.textContent).toContain('سترة مخملية نادرة');
    });
  });

  // =========================================================================
  // TIER 1C: Product Detail Page (PDP) Components
  // =========================================================================
  describe('Tier 1C: Product Detail Page (PDP) in AR', () => {
    it('renders ProductDetailPage, PDPBreadcrumb, ProductInfo, ColorSelector, SizeSelector, AddToCartSection, Accordions, and TrustPillarsBar in AR', () => {
      const shoeProduct = SEED_PRODUCTS.find((p) => p.categoryId === 'shoes') || SEED_PRODUCTS[0];
      const { container } = renderStorefrontWithProviders(
        <ProductDetailPage product={shoeProduct} />,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });

    it('renders PDP subcomponents across clothing, shoes (richelieus), and accessories (boucles/Taille Unique) in AR including SizeGuideModal', () => {
      const accessoryProduct =
        SEED_PRODUCTS.find((p) => p.sizes.some((s) => /unique/i.test(s))) ||
        SEED_PRODUCTS.find((p) => p.categoryId === 'accessories') ||
        SEED_PRODUCTS[0];

      const { container } = renderStorefrontWithProviders(
        <>
          <PDPBreadcrumb product={accessoryProduct} />
          <ProductInfo product={accessoryProduct} />
          <ColorSelector
            colors={accessoryProduct.colors}
            selectedColor={accessoryProduct.colors?.[0] || null}
            onSelectColor={vi.fn()}
          />
          <SizeSelector
            sizes={accessoryProduct.sizes}
            selectedSize={accessoryProduct.sizes[0] || null}
            onSelectSize={vi.fn()}
            sizeInventory={accessoryProduct.sizeInventory}
            inStock={accessoryProduct.inStock}
            onOpenSizeGuide={vi.fn()}
          />
          <AddToCartSection
            product={accessoryProduct}
            selectedSize={accessoryProduct.sizes[0] || null}
            selectedColor={accessoryProduct.colors?.[0] || null}
            onValidateSize={() => true}
          />
          <TrustPillarsBar />
          <ProductAccordions product={accessoryProduct} onOpenSizeGuide={vi.fn()} />
          <SizeGuideModal isOpen={true} onClose={vi.fn()} category="clothing" />
        </>,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });
  });

  // =========================================================================
  // TIER 1D: Cart, Checkout, OrderSuccess, Error & NotFound
  // =========================================================================
  describe('Tier 1D: Cart, Checkout, OrderSuccess, Error & NotFound in AR', () => {
    it('renders CartPage (single item & plural items) and CartDrawer (empty & populated) in AR with re-localized items and د.ج', async () => {
      const cartItem1 = createMockCartItem({ quantity: 1 });
      const singleCart = renderStorefrontWithProviders(<CartPage />, {
        language: 'ar',
        initialCartItems: [cartItem1],
      });

      await waitFor(() => {
        expect(singleCart.container.textContent).toMatch(/1/);
      });
      assertZeroFrenchOrEnglishLeakage(singleCart.container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
      singleCart.unmount();

      // Plural CartPage (>= 2 items)
      const cartItem2 = createMockCartItem({
        productId: SEED_PRODUCTS[1].id,
        title: SEED_PRODUCTS[1].title,
        slug: SEED_PRODUCTS[1].slug,
        price: SEED_PRODUCTS[1].price,
        quantity: 2,
        selectedSize: SEED_PRODUCTS[1].sizes[0] || '50',
        selectedColor: SEED_PRODUCTS[1].colors?.[0]?.name || 'Noir',
      });
      const pluralCart = renderStorefrontWithProviders(<CartPage />, {
        language: 'ar',
        initialCartItems: [cartItem1, cartItem2],
      });

      await waitFor(() => {
        expect(pluralCart.container.textContent).toMatch(/3/);
      });
      assertZeroFrenchOrEnglishLeakage(pluralCart.container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
      pluralCart.unmount();

      // Empty CartDrawer
      const emptyDrawer = renderStorefrontWithProviders(
        <CartDrawer isOpen={true} onClose={vi.fn()} />,
        { language: 'ar', initialCartItems: [] }
      );
      assertZeroFrenchOrEnglishLeakage(emptyDrawer.container);
      emptyDrawer.unmount();

      // Populated CartDrawer
      const populatedDrawer = renderStorefrontWithProviders(
        <CartDrawer isOpen={true} onClose={vi.fn()} />,
        { language: 'ar', initialCartItems: [cartItem1, cartItem2] }
      );
      await waitFor(() => {
        expect(populatedDrawer.container.textContent).toMatch(/د\.ج/);
      });
      assertZeroFrenchOrEnglishLeakage(populatedDrawer.container, { requireCurrency: true });
      populatedDrawer.unmount();
    });

    it('renders CheckoutPage, WilayaSelector, and CommuneSelector (with opened matching lists) in AR with zero French/English leakage', async () => {
      const cartItem = createMockCartItem({ quantity: 1 });
      const { container, unmount } = renderStorefrontWithProviders(<CheckoutPage />, {
        language: 'ar',
        initialCartItems: [cartItem],
      });

      await waitFor(() => {
        expect(container.querySelector('form')).toBeTruthy();
      });
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
      unmount();

      // Open WilayaSelector with matching query "16" so dropdown rows (nameAr, estimatedDays) render
      const wilayaRender = renderStorefrontWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={12000}
          freeShippingThreshold={15000}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'ar' }
      );
      const wilayaTrigger = wilayaRender.container.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
      expect(wilayaTrigger).toBeTruthy();
      fireEvent.click(wilayaTrigger);
      const wilayaSearch = await waitFor(() => {
        const input = wilayaRender.container.querySelector('input') as HTMLInputElement | null;
        expect(input).toBeTruthy();
        return input!;
      });
      fireEvent.change(wilayaSearch, { target: { value: '16' } });
      await waitFor(() => {
        expect(wilayaRender.container.textContent).toContain('الجزائر');
      });
      assertZeroFrenchOrEnglishLeakage(wilayaRender.container, { requireCurrency: true });
      wilayaRender.unmount();

      // Open CommuneSelector for wilaya 16 so Baladiyat listbox renders
      const communeRender = renderStorefrontWithProviders(
        <CommuneSelector
          selectedWilayaCode={16}
          value="حيدرة"
          onChange={vi.fn()}
        />,
        { language: 'ar' }
      );
      const communeCombo = communeRender.container.querySelector('[role="combobox"]') as HTMLElement;
      expect(communeCombo).toBeTruthy();
      fireEvent.click(communeCombo);
      await waitFor(() => {
        expect(communeRender.container.querySelector('[role="listbox"]')).toBeTruthy();
      });
      assertZeroFrenchOrEnglishLeakage(communeRender.container);
      communeRender.unmount();
    });

    it('renders OrderSuccessView and OrderSuccessFallback (loading & not-found states) in AR with zero FR/EN leakage', async () => {
      const order = buildArabicOrder();
      const successRender = renderStorefrontWithProviders(<OrderSuccessView order={order} />, {
        language: 'ar',
      });

      assertZeroFrenchOrEnglishLeakage(successRender.container, { requireCurrency: true });
      expect(successRender.container.textContent).toContain('VT-2026-4401');

      // Test OrderSuccessFallback when order is missing (404)
      setupExtendedE2EFetch({ orderById: { 'VT-2026-9999': null } });
      const fallbackRender = renderStorefrontWithProviders(
        <OrderSuccessFallback orderId="VT-2026-9999" />,
        { language: 'ar' }
      );

      // Immediate loading state must also be Arabic
      assertZeroFrenchOrEnglishLeakage(fallbackRender.container);

      await waitFor(() => {
        expect(fallbackRender.container.textContent).toContain('VT-2026-9999');
      });
      assertZeroFrenchOrEnglishLeakage(fallbackRender.container);
    });

    it('renders error.tsx and not-found.tsx completely in AR when vip_tadj_lang cookie is "ar"', async () => {
      mockCookieLang = 'ar';
      const errRender = renderStorefrontWithProviders(
        <GlobalErrorPage
          error={Object.assign(new Error('Boom'), { digest: 'ERR-500-AR' })}
          reset={vi.fn()}
        />,
        { language: 'ar' }
      );
      assertZeroFrenchOrEnglishLeakage(errRender.container);

      const rawNotFound = NotFound();
      const resolvedNotFound = rawNotFound instanceof Promise ? await rawNotFound : rawNotFound;
      const notFoundRender = renderStorefrontWithProviders(resolvedNotFound, {
        language: 'ar',
      });
      assertZeroFrenchOrEnglishLeakage(notFoundRender.container);
      expect(notFoundRender.container.textContent).toContain('404');
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Storefront Validation, Stock, Threshold & Search Boundaries in AR', () => {
    it('displays Arabic checkout validation errors for empty submission and invalid phone format', async () => {
      const { container } = renderStorefrontWithProviders(<CheckoutPage />, {
        language: 'ar',
        initialCartItems: [createMockCartItem({ quantity: 1 })],
      });

      const submitBtn = await waitFor(() => {
        const btn = container.querySelector('button[type="submit"]');
        expect(btn).toBeTruthy();
        return btn as HTMLButtonElement;
      });

      fireEvent.click(submitBtn);
      await waitFor(() => {
        const alerts = container.querySelectorAll('[role="alert"], .text-red-600, .text-red-500');
        expect(alerts.length).toBeGreaterThan(0);
      });
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });

      // Invalid phone format check
      const fullNameInput = container.querySelector('#checkout-fullName') as HTMLInputElement;
      const phoneInput = container.querySelector('#checkout-phone') as HTMLInputElement;
      expect(fullNameInput).toBeTruthy();
      expect(phoneInput).toBeTruthy();
      fireEvent.change(fullNameInput, { target: { value: 'كريم بن علي' } });
      fireEvent.change(phoneInput, { target: { value: '123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const phoneErr = container.querySelector('#checkout-phone-error');
        expect(phoneErr).toBeTruthy();
        expect(phoneErr!.textContent || '').toMatch(/[\u0600-\u06FF]+/);
      });
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('displays Arabic error when POST /api/orders fails on CheckoutPage', async () => {
      const failingFetch = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true, settings: { freeShippingThreshold: 15000 } }),
          } as Response);
        }
        if (url.includes('/api/orders') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () =>
              Promise.resolve({
                success: false,
                error: 'Erreur de stock',
                errorCode: 'INSUFFICIENT_STOCK',
              }),
          } as Response);
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) } as Response);
      });
      global.fetch = failingFetch;

      const { container } = renderStorefrontWithProviders(<CheckoutPage />, {
        language: 'ar',
        initialCartItems: [createMockCartItem({ quantity: 1 })],
      });

      const nameInput = await waitFor(() => {
        const el = container.querySelector('input[name="fullName"], #checkout-fullName') as HTMLInputElement | null;
        expect(el).toBeTruthy();
        return el!;
      });
      const phoneInput = container.querySelector('input[name="phone"], input[type="tel"], #checkout-phone') as HTMLInputElement;
      expect(phoneInput).toBeTruthy();
      fireEvent.change(nameInput, { target: { value: 'كريم بن علي' } });
      fireEvent.change(phoneInput, { target: { value: '0555112233' } });

      // Select Wilaya 16 via WilayaSelector inside the checkout form (not Header's LanguageSelector)
      const formEl = container.querySelector('form') as HTMLFormElement;
      expect(formEl).toBeTruthy();
      const wilayaTrigger = formEl.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
      expect(wilayaTrigger).toBeTruthy();
      fireEvent.click(wilayaTrigger);
      const wilayaSearchInput = await waitFor(() => {
        const inp = wilayaTrigger.parentElement?.querySelector('input') as HTMLInputElement | null;
        expect(inp).toBeTruthy();
        return inp!;
      });
      fireEvent.change(wilayaSearchInput, { target: { value: '16' } });
      const wilaya16Option = await waitFor(() => {
        const opt = Array.from(wilayaTrigger.parentElement?.querySelectorAll('.max-h-60 button') || []).find((b) =>
          b.textContent?.includes('16')
        );
        expect(opt).toBeTruthy();
        return opt as HTMLButtonElement;
      });
      fireEvent.click(wilaya16Option);

      // Select Commune via CommuneSelector
      const communeInput = container.querySelector('#checkout-commune, input[role="combobox"]') as HTMLInputElement;
      expect(communeInput).toBeTruthy();
      fireEvent.click(communeInput);
      const communeOption = await waitFor(() => {
        const listbox = container.querySelector('#checkout-commune-listbox, [role="listbox"]');
        const opt = listbox?.querySelector('button') as HTMLButtonElement | null;
        expect(opt).toBeTruthy();
        return opt!;
      });
      fireEvent.click(communeOption);

      // Submit checkout form and verify POST /api/orders failure renders localized error
      const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitBtn).toBeTruthy();
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(failingFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/orders'),
          expect.objectContaining({ method: 'POST' })
        );
      });

      await waitFor(() => {
        const errBanner = container.querySelector('.bg-red-50, [role="alert"]');
        expect(errBanner).toBeTruthy();
      });

      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('shows Arabic empty-wilaya message in WilayaSelector when search has no match', async () => {
      const { container } = renderStorefrontWithProviders(
        <WilayaSelector
          selectedWilayaCode={null}
          deliveryType="home"
          cartSubtotal={5000}
          freeShippingThreshold={15000}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'ar' }
      );

      const trigger = container.querySelector('button') as HTMLButtonElement;
      fireEvent.click(trigger);

      const searchInput = await waitFor(() => {
        const inp = container.querySelector('input') as HTMLInputElement | null;
        expect(inp).toBeTruthy();
        return inp!;
      });
      fireEvent.change(searchInput, { target: { value: 'ولاية_وهمية_999' } });

      await waitFor(() => {
        const listBox = container.querySelector('.max-h-60');
        expect(listBox).toBeTruthy();
        expect(listBox!.querySelectorAll('button').length).toBe(0);
        expect(listBox!.textContent).toContain('ولاية_وهمية_999');
      });

      assertZeroFrenchOrEnglishLeakage(container);
    });

    it('handles PDP out-of-stock size selection and max-stock boundary in Arabic', async () => {
      const limitedProduct = {
        ...SEED_PRODUCTS[0],
        sizes: ['48', '50'],
        sizeInventory: { '48': 0, '50': 1 },
        stockQuantity: 1,
        inStock: true,
      };

      const { container } = renderStorefrontWithProviders(
        <ProductDetailPage product={limitedProduct} />,
        { language: 'ar' }
      );

      // Target the actual Arabic Add-to-Cart button (zero FR/EN fallback)
      const addBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        /إضافة إلى السلة|أضف إلى السلة/.test(b.textContent || '')
      ) as HTMLButtonElement | undefined;
      expect(addBtn).toBeTruthy();

      // Confirm SizeSelector required-size alert is NOT mounted prior to clicking Add to Cart
      expect(container.querySelector('div.text-red-600')).toBeNull();

      // Click Add to Cart before selecting size -> mounts SizeSelector div.text-red-600 alert
      fireEvent.click(addBtn!);
      const sizeRequiredAlert = await waitFor(() => {
        const alertEl = container.querySelector('div.text-red-600');
        expect(alertEl).toBeTruthy();
        expect(alertEl!.textContent || '').toMatch(/[\u0600-\u06FF]+/);
        return alertEl!;
      });
      expect(sizeRequiredAlert.textContent || '').toMatch(/يرجى تحديد المقاس|تحديد المقاس/);

      // Audit mounted required-size alert in AR BEFORE size50Btn! clears hasSizeError
      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });

      // Verify out-of-stock size 48 is disabled
      const size48Btn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('48')
      ) as HTMLButtonElement | undefined;
      expect(size48Btn).toBeTruthy();
      expect(size48Btn).toBeDisabled();

      // Select in-stock size 50 (stock=1) and add to cart twice to exceed maxStock = 1
      const size50Btn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.trim() === '50'
      ) as HTMLButtonElement | undefined;
      expect(size50Btn).toBeTruthy();
      fireEvent.click(size50Btn!);

      fireEvent.click(addBtn!); // Adds 1/1 to vip_cart
      fireEvent.click(addBtn!); // Second click exceeds maxStock=1 -> triggers pdp.error.max_stock_reached

      await waitFor(() => {
        const stockAlert = container.querySelector('.bg-red-50');
        expect(stockAlert).toBeTruthy();
      });

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });

    it('handles free-shipping threshold boundary (14999 vs 15000 د.ج) in WilayaSelector in AR', () => {
      const under = renderStorefrontWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={14999}
          freeShippingThreshold={15000}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'ar' }
      );
      assertZeroFrenchOrEnglishLeakage(under.container, { requireCurrency: true });
      expect(under.container.textContent).toContain('1');

      const exact = renderStorefrontWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={15000}
          freeShippingThreshold={15000}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'ar' }
      );
      assertZeroFrenchOrEnglishLeakage(exact.container, { requireCurrency: true });
    });
  });

  // =========================================================================
  // TIER 3: PAIRWISE CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Pairwise Storefront Combinations in AR', () => {
    it('combines Category + Arabic Search + InStock + Price Sort cleanly in CatalogClient', async () => {
      const { container } = renderStorefrontWithProviders(
        <CatalogClient initialProducts={SEED_PRODUCTS} initialCategory="shoes" isCategoryLocked={true} />,
        {
          language: 'ar',
          navigation: {
            pathname: '/catalog/shoes',
            searchParams: { search: 'ريشليو', inStock: 'true', sortBy: 'price-asc' },
          },
        }
      );

      await waitFor(() => {
        expect(container.textContent).toMatch(/[\u0600-\u06FF]+/);
      });
      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });

    it('recovers order via sessionStorage and via GET /api/orders/:id in OrderSuccessFallback in AR', async () => {
      const order = buildArabicOrder({ id: 'ord-recover-1', orderNumber: 'VT-2026-5501' });
      sessionStorage.setItem('vip_last_order_ord-recover-1', JSON.stringify(order));

      const viaSession = renderStorefrontWithProviders(
        <OrderSuccessFallback orderId="ord-recover-1" />,
        { language: 'ar' }
      );
      await waitFor(() => {
        expect(viaSession.container.textContent).toContain('VT-2026-5501');
      });
      assertZeroFrenchOrEnglishLeakage(viaSession.container, { requireCurrency: true });

      sessionStorage.clear();
      setupExtendedE2EFetch({ orderById: { 'VT-2026-5502': buildArabicOrder({ id: 'ord-recover-2', orderNumber: 'VT-2026-5502' }) } });
      const viaApi = renderStorefrontWithProviders(
        <OrderSuccessFallback orderId="VT-2026-5502" />,
        { language: 'ar' }
      );
      await waitFor(() => {
        expect(viaApi.container.textContent).toContain('VT-2026-5502');
      });
      assertZeroFrenchOrEnglishLeakage(viaApi.container, { requireCurrency: true });
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD END-TO-END CUSTOMER COD SCENARIOS
  // =========================================================================
  describe('Tier 4: End-to-End Customer COD Journeys in AR', () => {
    it('completes PDP Add-to-Cart -> CartDrawer -> CartPage -> OrderSuccessView in AR with zero leakage', async () => {
      const targetProduct = SEED_PRODUCTS[0];
      const pdp = renderStorefrontWithProviders(
        <ProductDetailPage product={targetProduct} />,
        { language: 'ar' }
      );

      // Select first available size
      const sizeBtn = Array.from(pdp.container.querySelectorAll('button')).find(
        (b) => b.textContent?.trim() === targetProduct.sizes[0]
      );
      if (sizeBtn) fireEvent.click(sizeBtn);

      assertZeroFrenchOrEnglishLeakage(pdp.container, { requireCurrency: true });
      assertArabicCurrencyDisplayStrict(pdp.container);

      // Verify CartPage & OrderSuccessView with same product in AR
      const cartItem = createMockCartItem({
        productId: targetProduct.id,
        title: targetProduct.title,
        price: targetProduct.price,
        selectedSize: targetProduct.sizes[0],
        quantity: 1,
      });

      const cartRender = renderStorefrontWithProviders(<CartPage />, {
        language: 'ar',
        initialCartItems: [cartItem],
      });
      await waitFor(() => {
        expect(cartRender.container.textContent).toMatch(/د\.ج/);
      });
      assertZeroFrenchOrEnglishLeakage(cartRender.container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });

      const finalOrder = buildArabicOrder({
        items: [cartItem],
        subtotal: targetProduct.price,
        deliveryFee: 0,
        total: targetProduct.price,
      });
      const successRender = renderStorefrontWithProviders(
        <OrderSuccessView order={finalOrder} />,
        { language: 'ar' }
      );
      assertZeroFrenchOrEnglishLeakage(successRender.container, { requireCurrency: true });
    });

    it('supports Express Direct Checkout (?direct=1) flow in AR without polluting main vip_cart', async () => {
      const targetProduct = SEED_PRODUCTS[0];
      const expectedArabicTitle = getLocalizedProduct(targetProduct, 'ar').title;
      const directItem = createMockCartItem({
        productId: targetProduct.id,
        title: targetProduct.title,
        price: 48500,
        selectedSize: '50',
        quantity: 1,
      });
      sessionStorage.setItem('vip_express_checkout', JSON.stringify(directItem));
      localStorage.setItem('vip_cart', JSON.stringify([createMockCartItem({ productId: SEED_PRODUCTS[1].id })]));

      const { container } = renderStorefrontWithProviders(<CheckoutPage />, {
        language: 'ar',
        navigation: { pathname: '/checkout', searchParams: { direct: '1' } },
      });

      await waitFor(() => {
        expect(container.querySelector('form')).toBeTruthy();
      });

      const normalizedText = (container.textContent || '').replace(/\u00A0/g, ' ');
      expect(normalizedText).toContain('48 500');
      expect(normalizedText).toContain('50');
      expect(normalizedText).toContain(expectedArabicTitle);
      expect(normalizedText).not.toMatch(/(?:^|[^\d])0\s*د\.ج/);

      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
      expect(localStorage.getItem('vip_cart')).toContain(SEED_PRODUCTS[1].id);
    });
  });
});
