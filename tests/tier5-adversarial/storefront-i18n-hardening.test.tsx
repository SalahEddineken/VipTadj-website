import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

let mockCookieLang: 'ar' | 'fr' | 'en' | undefined = 'ar';
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) =>
      name === 'vip_tadj_lang' && mockCookieLang ? { value: mockCookieLang } : undefined,
  }),
}));

import { generateMetadata as rootGenerateMetadata } from '@/app/layout';
import { generateMetadata as catalogGenerateMetadata } from '@/app/catalog/page';
import { generateMetadata as categoryGenerateMetadata } from '@/app/catalog/[category]/page';
import { generateMetadata as categoryProductGenerateMetadata } from '@/app/catalog/[category]/[slug]/page';
import { generateMetadata as directProductGenerateMetadata } from '@/app/product/[slug]/page';
import { generateMetadata as adminNewProductGenerateMetadata } from '@/app/admin/products/new/page';
import { generateMetadata as adminEditProductGenerateMetadata } from '@/app/admin/products/[id]/page';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import { OrderSuccessView } from '@/app/checkout/success/[orderId]/OrderSuccessView';
import { ProductAccordions } from '@/components/store/pdp/ProductAccordions';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { ProductCard } from '@/components/store/ProductCard';
import { CatalogFilterSidebar } from '@/components/store/CatalogFilterSidebar';
import { CatalogClient } from '@/components/store/CatalogClient';
import { CartDrawer } from '@/components/store/CartDrawer';
import { LanguageProvider, useLanguage } from '@/lib/context/language-context';
import {
  getLocalizedSize,
  getLocalizedFit,
  getLocalizedProduct,
  getLocalizedColor,
} from '@/lib/i18n/catalog-translations';
import { DEFAULT_FILTER_STATE } from '@/lib/utils/catalogUtils';
import { getStatusLabel } from '@/lib/utils/orderStateMachine';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { fr, en, ar } from '@/lib/i18n/locales';
import { OrderStatus } from '@/types';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { assertLtrPhoneIsolation } from '../helpers/i18n-assertions';
import { createMockCartItem, createMockOrder } from '../e2e/helpers/e2eTestUtils';
import {
  assertZeroFrenchOrEnglishLeakage,
  checkArabicStringAntiLeakage,
  renderStorefrontWithProviders,
  setupExtendedE2EFetch,
} from '../e2e/helpers/ar-leakage-assertions';

describe('Tier 5 Adversarial — Storefront, Data, Context & i18n Hardening', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    mockCookieLang = 'ar';
    vi.restoreAllMocks();
    setupExtendedE2EFetch({ productsList: SEED_PRODUCTS });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Centimeter sizes ('85 cm'..'110 cm') + prod-acc-01 across all surfaces
  // =========================================================================
  it('localizes centimeter sizes ("85 cm".."110 cm") to Arabic "سم" across helper and all prod-acc-01 surfaces', async () => {
    const cmSizes = ['85 cm', '90 cm', '95 cm', '100 cm', '105 cm', '110 cm'];
    for (const s of cmSizes) {
      const expectedAr = s.replace('cm', 'سم');
      expect(getLocalizedSize(s, 'ar')).toBe(expectedAr);
      expect(getLocalizedSize(s, 'fr')).toBe(s);
      expect(getLocalizedSize(s, 'en')).toBe(s);
      expect(getLocalizedSize(expectedAr, 'fr')).toBe(s);
      expect(getLocalizedSize(expectedAr, 'en')).toBe(s);
    }

    // Leakage helper must flag raw "85 cm" in AR mode
    expect(checkArabicStringAntiLeakage('مقاس 85 cm').length).toBeGreaterThan(0);

    const belt = SEED_PRODUCTS.find((p) => p.id === 'prod-acc-01')!;
    expect(belt).toBeDefined();

    // PDP
    const pdp = renderStorefrontWithProviders(<ProductDetailPage product={belt} />, {
      language: 'ar',
    });
    expect(pdp.container.textContent).toContain('85 سم');
    expect(pdp.container.textContent).not.toMatch(/\b85\s*cm\b/i);
    assertZeroFrenchOrEnglishLeakage(pdp.container, { requireCurrency: true });
    pdp.unmount();

    // CartPage, CartDrawer, CheckoutPage, OrderSuccessView
    const beltCartItem = createMockCartItem({
      productId: belt.id,
      title: belt.title,
      slug: belt.slug,
      price: belt.price,
      quantity: 1,
      selectedSize: '85 cm',
      selectedColor: 'Noir',
    });

    const cart = renderStorefrontWithProviders(<CartPage />, {
      language: 'ar',
      initialCartItems: [beltCartItem],
    });
    await waitFor(() => {
      expect(cart.container.textContent).toContain('85 سم');
    });
    expect(cart.container.textContent).not.toMatch(/\b85\s*cm\b/i);
    assertZeroFrenchOrEnglishLeakage(cart.container, {
      allowLanguageNames: true,
      requireCurrency: true,
    });
    cart.unmount();

    const drawer = renderStorefrontWithProviders(
      <CartDrawer isOpen={true} onClose={vi.fn()} />,
      { language: 'ar', initialCartItems: [beltCartItem] }
    );
    expect(drawer.container.textContent).toContain('85 سم');
    assertZeroFrenchOrEnglishLeakage(drawer.container, { requireCurrency: true });
    drawer.unmount();

    const checkout = renderStorefrontWithProviders(<CheckoutPage />, {
      language: 'ar',
      initialCartItems: [beltCartItem],
    });
    await waitFor(() => {
      expect(checkout.container.textContent).toContain('85 سم');
    });
    expect(checkout.container.textContent).not.toMatch(/\b85\s*cm\b/i);
    assertZeroFrenchOrEnglishLeakage(checkout.container, {
      allowLanguageNames: true,
      requireCurrency: true,
      exceptions: ['DZ'],
    });
    checkout.unmount();

    const order = createMockOrder({
      items: [beltCartItem],
      subtotal: belt.price,
      deliveryFee: 400,
      total: belt.price + 400,
    });
    const success = renderStorefrontWithProviders(<OrderSuccessView order={order} />, {
      language: 'ar',
    });
    expect(success.container.textContent).toContain('85 سم');
    expect(success.container.textContent).not.toMatch(/\b85\s*cm\b/i);
    assertZeroFrenchOrEnglishLeakage(success.container, { requireCurrency: true });
  });

  // =========================================================================
  // 2. Product.fit localization across all 4 fits in AR
  // =========================================================================
  it('localizes all 4 Product.fit values in getLocalizedProduct and ProductAccordions in AR with zero Latin leakage', () => {
    const fits = ['Slim Fit', 'Tailored Fit', 'Classic Fit', 'Relaxed Fit'] as const;
    for (const fit of fits) {
      const localized = getLocalizedProduct({ ...SEED_PRODUCTS[0], fit }, 'ar');
      expect(localized.fit).toBe(getLocalizedFit(fit, 'ar'));
      expect(localized.fit).not.toMatch(/[A-Za-z]/);

      const { container, unmount } = renderStorefrontWithProviders(
        <ProductAccordions product={{ ...SEED_PRODUCTS[0], fit }} />,
        { language: 'ar' }
      );
      expect(container.textContent).toContain(getLocalizedFit(fit, 'ar'));
      expect(container.textContent).not.toContain(fit);
      assertZeroFrenchOrEnglishLeakage(container, {
        extraWhitelist: ['Yalidine', 'Express'],
      });
      unmount();
    }
  });

  // =========================================================================
  // 3. Checkout #checkout-phone RTL non-overlapping badge & padding
  // =========================================================================
  it('places #checkout-phone and its "DZ" prefix in a non-overlapping dir="ltr" container with physical left padding in RTL mode', async () => {
    const item = createMockCartItem({ quantity: 1 });
    const { container } = renderStorefrontWithProviders(<CheckoutPage />, {
      language: 'ar',
      initialCartItems: [item],
    });

    const phoneInput = (await waitFor(() =>
      container.querySelector('#checkout-phone')
    )) as HTMLInputElement;
    expect(phoneInput).toBeTruthy();
    assertLtrPhoneIsolation(phoneInput);

    const wrapper = phoneInput.parentElement as HTMLElement;
    expect(wrapper.getAttribute('dir')).toBe('ltr');

    const dzBadge = wrapper.querySelector('span');
    expect(dzBadge?.textContent?.trim()).toBe('DZ');
    expect(dzBadge?.className).toContain('left-3');
    expect(dzBadge?.className).not.toContain('start-3');

    expect(phoneInput.className).toContain('pl-10');
    expect(phoneInput.className).toContain('pr-3.5');
    expect(phoneInput.className).toContain('text-left');
    expect(phoneInput.className).not.toContain('ps-10');
  });

  // =========================================================================
  // 4. LanguageProvider preserves explicit initialLanguage when storage/cookie empty
  // =========================================================================
  it('preserves explicit initialLanguage="fr" and "en" when localStorage and cookies are empty, while defaulting omitted prop to "ar"', () => {
    function Probe() {
      const { language, direction } = useLanguage();
      return <span data-testid="probe">{`${language}:${direction}`}</span>;
    }

    const rFr = render(
      <LanguageProvider initialLanguage="fr">
        <Probe />
      </LanguageProvider>
    );
    expect(rFr.getByTestId('probe').textContent).toBe('fr:ltr');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    rFr.unmount();

    const rEn = render(
      <LanguageProvider initialLanguage="en">
        <Probe />
      </LanguageProvider>
    );
    expect(rEn.getByTestId('probe').textContent).toBe('en:ltr');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
    rEn.unmount();

    const rDefault = render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    );
    expect(rDefault.getByTestId('probe').textContent).toBe('ar:rtl');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    rDefault.unmount();
  });

  // =========================================================================
  // 5. CatalogFilterSidebar French category slug normalization
  // =========================================================================
  it('normalizes French category slugs ("vetements", "chaussures", "accessoires") in CatalogFilterSidebar', () => {
    const cases: Array<{ slug: string; expectedSubId: string }> = [
      { slug: 'vetements', expectedSubId: 'vestes' },
      { slug: 'chaussures', expectedSubId: 'richelieus' },
      { slug: 'accessoires', expectedSubId: 'ceintures' },
    ];

    for (const { slug, expectedSubId } of cases) {
      const { container, unmount } = renderStorefrontWithProviders(
        <CatalogFilterSidebar
          filters={{ ...DEFAULT_FILTER_STATE, category: slug }}
          onChange={vi.fn()}
          onReset={vi.fn()}
        />,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container);
      unmount();
    }
  });

  // =========================================================================
  // 6. CatalogClient 0-results copy
  // =========================================================================
  it('handles 0-results copy without singular label in AR', async () => {
    const { container } = renderStorefrontWithProviders(
      <CatalogClient initialProducts={SEED_PRODUCTS.slice(0, 2)} />,
      { language: 'ar' }
    );

    const searchInput = within(container).getByPlaceholderText(ar['catalog.search.placeholder']);
    fireEvent.change(searchInput, { target: { value: 'منتج-غير-موجود-999' } });
    await waitFor(() => {
      expect(container.textContent).toContain(ar['catalog.results_count_zero']);
    });
    expect(container.textContent).not.toContain(`0 ${ar['catalog.results_count_single']}`);
    assertZeroFrenchOrEnglishLeakage(container);
  });

  // =========================================================================
  // 7. OrderSuccessView all 5 statuses, commune colon, selectedColor, secondaryPhone
  // =========================================================================
  it('renders OrderSuccessView across all 5 OrderStatus values with commune colon, localized selectedColor, and secondaryPhone', () => {
    const statuses: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    for (const status of statuses) {
      const order = createMockOrder({
        status,
        customer: {
          fullName: 'ياسين براهيمي',
          phone: '0555123456',
          secondaryPhone: '0770987654',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: 'حي الرياض رقم 10',
          deliveryType: 'home',
        },
        items: [
          createMockCartItem({
            productId: SEED_PRODUCTS[0].id,
            title: SEED_PRODUCTS[0].title,
            selectedSize: '50',
            selectedColor: 'Bleu Nuit',
          }),
        ],
      });

      const { container, unmount } = renderStorefrontWithProviders(
        <OrderSuccessView order={order} />,
        { language: 'ar' }
      );

      expect(container.textContent).toContain(getStatusLabel(status, 'ar'));
      expect(container.textContent).toContain(`${ar['checkout.field.commune']} : حيدرة`);
      expect(container.textContent).toContain('أزرق ليلي');
      expect(container.textContent).toContain('0770 98 76 54');

      const telLinks = container.querySelectorAll('a[href^="tel:"][dir="ltr"]');
      expect(telLinks.length).toBeGreaterThanOrEqual(2);
      telLinks.forEach((el) => assertLtrPhoneIsolation(el as HTMLElement));

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
      unmount();
    }
  });

  // =========================================================================
  // 8. Storefront & Admin Product generateMetadata across ar/fr/en and 404
  // =========================================================================
  it('returns properly localized Storefront and Admin Product generateMetadata across ar, fr, en, and 404', async () => {
    const sampleProd = SEED_PRODUCTS[0];

    for (const lang of ['ar', 'fr', 'en'] as const) {
      mockCookieLang = lang;
      const dict = lang === 'ar' ? ar : lang === 'en' ? en : fr;

      const rootMeta = await rootGenerateMetadata();
      expect(rootMeta.title).toBe(dict['meta.site.title']);
      expect(rootMeta.openGraph?.locale).toBe(
        lang === 'ar' ? 'ar_DZ' : lang === 'fr' ? 'fr_DZ' : 'en_US'
      );

      const catMeta = await catalogGenerateMetadata();
      expect(catMeta.title).toBe(dict['meta.catalog.title']);

      const catSlugMeta = await categoryGenerateMetadata({ params: { category: 'vetements' } });
      expect(String(catSlugMeta.title)).toContain(dict['meta.category.title_suffix']);

      const notFoundCatMeta = await categoryGenerateMetadata({ params: { category: 'unknown-cat' } });
      expect(notFoundCatMeta.title).toBe(dict['meta.category.fallback_title']);

      const prodMeta = await categoryProductGenerateMetadata({
        params: { category: sampleProd.categorySlug, slug: sampleProd.slug },
      });
      const localizedTitle = getLocalizedProduct(sampleProd, lang).title;
      expect(String(prodMeta.title)).toContain(localizedTitle);
      expect(String(prodMeta.title)).toContain(dict['meta.product.title_suffix']);

      const directMeta = await directProductGenerateMetadata({
        params: { slug: sampleProd.slug },
      });
      expect(String(directMeta.title)).toContain(localizedTitle);

      const notFoundProdMeta = await directProductGenerateMetadata({
        params: { slug: 'non-existent-slug-xyz' },
      });
      expect(notFoundProdMeta.title).toBe(dict['meta.product.not_found']);

      const adminNewMeta = await adminNewProductGenerateMetadata();
      expect(adminNewMeta.title).toBe(dict['admin.meta.product_new_title']);

      const adminEditMeta = await adminEditProductGenerateMetadata({
        params: { id: sampleProd.id },
      });
      expect(String(adminEditMeta.title)).toContain(localizedTitle);

      const adminEditMissingMeta = await adminEditProductGenerateMetadata({
        params: { id: 'missing-prod-999' },
      });
      expect(adminEditMissingMeta.title).toBe(dict['admin.meta.product_not_found_title']);
    }
  });

  // =========================================================================
  // 9. CheckoutPage errorParams localization with centimeter size in AR
  // =========================================================================
  it('localizes CheckoutPage OUT_OF_STOCK errorParams ("85 cm" -> "85 سم" + Arabic product title) in AR', async () => {
    const belt = SEED_PRODUCTS.find((p) => p.id === 'prod-acc-01')!;
    const beltItem = createMockCartItem({
      productId: belt.id,
      title: belt.title,
      slug: belt.slug,
      price: belt.price,
      quantity: 1,
      selectedSize: '85 cm',
    });

    const baseFetch = setupExtendedE2EFetch({ productsList: SEED_PRODUCTS });
    global.fetch = vi.fn().mockImplementation((input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      if (url.includes('/api/orders') && method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: () =>
            Promise.resolve({
              success: false,
              errorCode: 'OUT_OF_STOCK',
              errorKey: 'api.error.out_of_stock_size',
              errorParams: {
                productId: belt.id,
                title: belt.title,
                size: '85 cm',
                available: 1,
              },
            }),
        } as Response);
      }
      return baseFetch(input, init);
    });

    const { container } = renderStorefrontWithProviders(<CheckoutPage />, {
      language: 'ar',
      initialCartItems: [beltItem],
    });

    const nameInput = (await waitFor(() =>
      container.querySelector('#checkout-fullName')
    )) as HTMLInputElement;
    const phoneInput = container.querySelector('#checkout-phone') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'محمد أمين' } });
    fireEvent.change(phoneInput, { target: { value: '0555123456' } });

    // Open Wilaya selector and pick wilaya 16 (Alger / الجزائر)
    const wilayaTrigger = within(container).getByRole('button', {
      name: new RegExp(ar['checkout.wilaya.label']),
    }) as HTMLButtonElement;
    fireEvent.click(wilayaTrigger);

    const wilayaInput = (await waitFor(() =>
      container.querySelector(`input[placeholder="${ar['checkout.wilaya.search_ph']}"]`)
    )) as HTMLInputElement;
    fireEvent.change(wilayaInput, { target: { value: '16' } });

    const wilayaOption = await waitFor(() => {
      const btn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('16') && b.textContent?.includes('الجزائر')
      );
      expect(btn).toBeTruthy();
      return btn!;
    });
    fireEvent.click(wilayaOption);

    // Select commune via combobox
    const communeCombo = container.querySelector('[role="combobox"]') as HTMLInputElement;
    expect(communeCombo).toBeTruthy();
    fireEvent.click(communeCombo);
    const communeOption = await waitFor(() => {
      const opt = Array.from(container.querySelectorAll('[role="listbox"] button')).find((el) =>
        el.textContent?.includes('حيدرة')
      );
      expect(opt).toBeTruthy();
      return opt!;
    });
    fireEvent.click(communeOption);

    const submitBtn = within(container).getByRole('button', {
      name: new RegExp(ar['checkout.submit.btn']),
    });
    fireEvent.click(submitBtn);

    const arabicTitle = getLocalizedProduct(belt, 'ar').title;
    await waitFor(() => {
      expect(container.textContent).toContain(arabicTitle);
      expect(container.textContent).toContain('85 سم');
    });
    expect(container.textContent).not.toMatch(/\b85\s*cm\b/i);
    assertZeroFrenchOrEnglishLeakage(container, {
      allowLanguageNames: true,
      requireCurrency: true,
      exceptions: ['DZ'],
    });
  });

  // =========================================================================
  // 10. ProductCard & ProductDetailPage out-of-stock & out-of-stock color in AR
  // =========================================================================
  it('renders out-of-stock ProductCard and ProductDetailPage (including out-of-stock color) in AR with zero FR/EN leakage', () => {
    const outOfStockProduct = {
      ...SEED_PRODUCTS[0],
      inStock: false,
      stockQuantity: 0,
      sizeInventory: { '48': 0, '50': 0, '52': 0 },
      colors: [
        { name: 'Bleu Nuit', hex: '#1B2A4A', inStock: false },
        { name: 'Cognac', hex: '#9A4D1E', inStock: false },
      ],
    };

    const card = renderStorefrontWithProviders(<ProductCard product={outOfStockProduct} />, {
      language: 'ar',
    });
    expect(card.container.textContent).toContain(ar['badge.out_of_stock']);
    assertZeroFrenchOrEnglishLeakage(card.container, { requireCurrency: true });
    card.unmount();

    const pdp = renderStorefrontWithProviders(<ProductDetailPage product={outOfStockProduct} />, {
      language: 'ar',
    });
    expect(pdp.container.textContent).toContain(ar['pdp.btn.out_of_stock']);
    expect(pdp.container.textContent).toContain(ar['pdp.color.out_of_stock']);
    const cognacRadio = within(pdp.container).getByRole('radio', {
      name: new RegExp(getLocalizedColor('Cognac', 'ar')),
    });
    fireEvent.click(cognacRadio);
    expect(pdp.container.textContent).toContain(getLocalizedColor('Cognac', 'ar'));
    assertZeroFrenchOrEnglishLeakage(pdp.container, { requireCurrency: true });
  });
});
