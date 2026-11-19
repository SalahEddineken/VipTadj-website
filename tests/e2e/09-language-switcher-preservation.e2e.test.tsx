import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { LanguageProvider, useLanguage } from '@/lib/context/language-context';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';
import { CatalogClient } from '@/components/store/CatalogClient';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import AdminDashboardPage from '@/app/admin/page';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { OrderDetailClient } from '@/components/admin/OrderDetailClient';
import * as dataProvider from '@/lib/data-provider';
import { MockSeedDataProvider } from '@/lib/data-provider';
import { SEED_PRODUCTS, DEFAULT_STORE_SETTINGS } from '@/lib/seed/seed-data';
import { fr, en, ar } from '@/lib/i18n/locales';
import { Order } from '@/types';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertDocumentDirection,
  assertZeroFrenchLeakage,
} from '../helpers/i18n-assertions';
import { createMockCartItem, createMockOrder } from './helpers/e2eTestUtils';
import {
  assertZeroFrenchOrEnglishLeakage,
  assertArabicCurrencyDisplayStrict,
  renderStorefrontWithProviders,
  setupExtendedE2EFetch,
} from './helpers/ar-leakage-assertions';

function buildSwitchOrder(): Order {
  return createMockOrder({
    id: 'ord-switch-01',
    orderNumber: 'VT-2026-3001',
    status: 'pending',
    customer: {
      fullName: 'ياسين براهيمي',
      phone: '0555123456',
      wilaya: 'الجزائر',
      wilayaCode: 16,
      commune: 'حيدرة',
      address: 'شارع الشهداء رقم 14',
      deliveryType: 'home',
    },
    items: [
      createMockCartItem({
        productId: SEED_PRODUCTS[0].id,
        title: SEED_PRODUCTS[0].title,
        price: 48500,
        quantity: 1,
        selectedSize: '50',
        selectedColor: 'Bleu Nuit',
      }),
    ],
    subtotal: 48500,
    deliveryFee: 400,
    total: 48900,
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-11-10T10:00:00.000Z',
        note: 'تم إنشاء الطلبية',
        updatedBy: 'system',
      },
    ],
  });
}

function selectDropdownLanguage(
  container: HTMLElement,
  targetLabelRegex: RegExp
) {
  const trigger = container.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
  expect(trigger).toBeTruthy();
  fireEvent.click(trigger);

  const listbox = container.querySelector('[role="listbox"]') as HTMLElement;
  expect(listbox).toBeTruthy();
  const option = within(listbox).getByRole('option', { name: targetLabelRegex });
  fireEvent.click(option);
}

describe('E2E 09 — Language Switcher (AR <-> FR <-> EN) & State Preservation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    vi.restoreAllMocks();
    setupExtendedE2EFetch();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TIER 1: ALL 4 LanguageSelector VARIANTS & DOM / STORAGE / COOKIE SYNC
  // =========================================================================
  describe('Tier 1: All 4 LanguageSelector Variants & Document Synchronization', () => {
    it('switches AR -> FR -> EN -> AR via Header (variant="header") and syncs lang, dir, localStorage, cookie, and event', () => {
      const events: string[] = [];
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        events.push(detail?.language || '');
      };
      window.addEventListener('vip-language-changed', handler);
      try {
        const { container } = renderStorefrontWithProviders(<Header cartCount={1} />, {
          language: 'ar',
        });

        assertDocumentDirection('rtl', 'ar');
        expect(localStorage.getItem('vip_tadj_lang')).toBe('ar');

        // AR -> FR
        selectDropdownLanguage(container, /Français/i);
        assertDocumentDirection('ltr', 'fr');
        expect(localStorage.getItem('vip_tadj_lang')).toBe('fr');
        expect(document.cookie).toContain('vip_tadj_lang=fr');
        expect(container.textContent).toContain(fr['nav.clothing']);

        // FR -> EN
        selectDropdownLanguage(container, /English/i);
        assertDocumentDirection('ltr', 'en');
        expect(localStorage.getItem('vip_tadj_lang')).toBe('en');
        expect(document.cookie).toContain('vip_tadj_lang=en');
        expect(container.textContent).toContain(en['nav.clothing']);
        assertZeroFrenchLeakage(container, 'en', { exceptions: ['VIP TADJ', 'Français', 'FR'] });

        // EN -> AR
        selectDropdownLanguage(container, /العربية/);
        assertDocumentDirection('rtl', 'ar');
        expect(localStorage.getItem('vip_tadj_lang')).toBe('ar');
        expect(document.cookie).toContain('vip_tadj_lang=ar');
        assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });

        expect(events).toEqual(['fr', 'en', 'ar']);
      } finally {
        window.removeEventListener('vip-language-changed', handler);
      }
    });

    it('switches AR -> FR -> EN -> AR via Footer (variant="minimal")', () => {
      const { container } = renderStorefrontWithProviders(<Footer />, { language: 'ar' });

      const frBtn = screen.getByRole('button', { name: /Français/i });
      const enBtn = screen.getByRole('button', { name: /English/i });
      const arBtn = screen.getByRole('button', { name: /العربية/ });

      expect(arBtn.getAttribute('aria-pressed')).toBe('true');

      fireEvent.click(frBtn);
      assertDocumentDirection('ltr', 'fr');
      expect(frBtn.getAttribute('aria-pressed')).toBe('true');
      expect(container.textContent).toContain(fr['footer.col.collections']);

      fireEvent.click(enBtn);
      assertDocumentDirection('ltr', 'en');
      expect(enBtn.getAttribute('aria-pressed')).toBe('true');
      expect(container.textContent).toContain(en['footer.col.collections']);

      fireEvent.click(arBtn);
      assertDocumentDirection('rtl', 'ar');
      expect(arBtn.getAttribute('aria-pressed')).toBe('true');
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('switches AR -> FR -> EN -> AR via AdminSidebar (variant="admin")', () => {
      const { container } = renderWithProviders(<AdminSidebar pendingOrdersCount={2} />, {
        language: 'ar',
        includeAdmin: true,
        navigation: { pathname: '/admin' },
        initialAdminSession: {
          user: {
            id: 'usr-admin-ar',
            email: 'direction@viptadj.dz',
            displayName: 'مدير المتجر',
            role: 'superadmin',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        },
      });

      assertDocumentDirection('rtl', 'ar');
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });

      selectDropdownLanguage(container, /Français/i);
      assertDocumentDirection('ltr', 'fr');
      expect(container.textContent).toContain(fr['admin.nav.orders']);

      selectDropdownLanguage(container, /English/i);
      assertDocumentDirection('ltr', 'en');
      expect(container.textContent).toContain(en['admin.nav.orders']);

      selectDropdownLanguage(container, /العربية/);
      assertDocumentDirection('rtl', 'ar');
      expect(container.textContent).toContain(ar['admin.nav.orders']);
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('switches AR -> FR -> EN -> AR via standalone LanguageSelector (variant="pills")', () => {
      const { container } = renderWithProviders(<LanguageSelector variant="pills" />, {
        language: 'ar',
      });

      const group = within(container).getByRole('group');
      const buttons = within(group).getAllByRole('button');
      expect(buttons).toHaveLength(3);

      fireEvent.click(within(group).getByRole('button', { name: /Français/i }));
      assertDocumentDirection('ltr', 'fr');

      fireEvent.click(within(group).getByRole('button', { name: /English/i }));
      assertDocumentDirection('ltr', 'en');

      fireEvent.click(within(group).getByRole('button', { name: /العربية/ }));
      assertDocumentDirection('rtl', 'ar');
    });

    it('defaults LanguageProvider to Arabic RTL when storage and cookies are empty', () => {
      function DefaultProbe() {
        const { language, direction, t } = useLanguage();
        return <div data-testid="default-probe">{`${language}:${direction}:${t('nav.all_catalog')}`}</div>;
      }

      const rendered = render(
        <LanguageProvider>
          <DefaultProbe />
        </LanguageProvider>
      );
      expect(rendered.getByTestId('default-probe').textContent).toBe(`ar:rtl:${ar['nav.all_catalog']}`);
      rendered.unmount();
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Keyboard Dismiss, Outside Click, Hydration Precedence & Persistence', () => {
    it('closes open header/admin dropdowns on Escape key and outside mousedown', () => {
      const { container } = renderWithProviders(
        <div>
          <span data-testid="outside-area">خارج القائمة</span>
          <LanguageSelector variant="header" />
        </div>,
        { language: 'ar' }
      );

      const trigger = container.querySelector('button[aria-haspopup="listbox"]') as HTMLButtonElement;
      fireEvent.click(trigger);
      expect(container.querySelector('[role="listbox"]')).toBeTruthy();

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(container.querySelector('[role="listbox"]')).toBeNull();

      fireEvent.click(trigger);
      expect(container.querySelector('[role="listbox"]')).toBeTruthy();

      fireEvent.mouseDown(screen.getByTestId('outside-area'));
      expect(container.querySelector('[role="listbox"]')).toBeNull();
    });

    it('hydrates correctly from localStorage["vip_tadj_lang"], legacy "vip_lang", cookie-only, and invalid fallback', () => {
      function Probe() {
        const { language, direction } = useLanguage();
        return <div data-testid="lang-probe">{`${language}:${direction}`}</div>;
      }

      // 1. Primary localStorage key
      localStorage.setItem('vip_tadj_lang', 'en');
      const r1 = renderWithProviders(<Probe />, { language: 'en' });
      expect(within(r1.container).getByTestId('lang-probe').textContent).toBe('en:ltr');
      r1.unmount();

      // 2. Legacy localStorage key when primary is empty
      localStorage.clear();
      localStorage.setItem('vip_lang', 'fr');
      const rLegacy = render(
        <LanguageProvider>
          <Probe />
        </LanguageProvider>
      );
      expect(rLegacy.getByTestId('lang-probe').textContent).toBe('fr:ltr');
      rLegacy.unmount();

      // 3. Cookie-only fallback
      localStorage.clear();
      document.cookie = 'vip_tadj_lang=en; path=/';
      const rCookie = render(
        <LanguageProvider>
          <Probe />
        </LanguageProvider>
      );
      expect(rCookie.getByTestId('lang-probe').textContent).toBe('en:ltr');
      rCookie.unmount();

      // 4. Invalid language string falls back safely to 'ar'
      localStorage.clear();
      document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.setItem('vip_tadj_lang', 'de');
      const rInvalid = render(
        <LanguageProvider>
          <Probe />
        </LanguageProvider>
      );
      expect(rInvalid.getByTestId('lang-probe').textContent).toBe('ar:rtl');
      rInvalid.unmount();
    });

    it('persists switched language across LanguageProvider remount without reverting to AR', () => {
      const first = renderWithProviders(<LanguageSelector variant="pills" />, { language: 'ar' });

      fireEvent.click(within(first.container).getByRole('button', { name: /English/i }));
      expect(localStorage.getItem('vip_tadj_lang')).toBe('en');
      first.unmount();

      function Probe() {
        const { language } = useLanguage();
        return <span data-testid="remount-lang">{language}</span>;
      }
      const remounted = render(
        <LanguageProvider>
          <Probe />
        </LanguageProvider>
      );
      expect(remounted.getByTestId('remount-lang').textContent).toBe('en');
      remounted.unmount();
    });

    it('protects t() against prototype keys across AR, FR, and EN switches', () => {
      function ProtoProbe() {
        const { t } = useLanguage();
        return (
          <div data-testid="proto-probe">
            {t('toString', 'fb1')}|{t('__proto__', 'fb2')}|{t('constructor', 'fb3')}
          </div>
        );
      }

      const { container } = renderWithProviders(
        <div>
          <LanguageSelector variant="pills" />
          <ProtoProbe />
        </div>,
        { language: 'ar' }
      );

      expect(within(container).getByTestId('proto-probe').textContent).toBe('fb1|fb2|fb3');
      fireEvent.click(within(container).getByRole('button', { name: /Français/i }));
      expect(within(container).getByTestId('proto-probe').textContent).toBe('fb1|fb2|fb3');
      fireEvent.click(within(container).getByRole('button', { name: /English/i }));
      expect(within(container).getByTestId('proto-probe').textContent).toBe('fb1|fb2|fb3');
    });

    it('handles rapid sequential AR -> EN -> FR -> AR switching without dir/lang desync', () => {
      const { container } = renderWithProviders(<LanguageSelector variant="pills" />, {
        language: 'ar',
      });

      const group = within(container).getByRole('group');
      fireEvent.click(within(group).getByRole('button', { name: /English/i }));
      fireEvent.click(within(group).getByRole('button', { name: /Français/i }));
      fireEvent.click(within(group).getByRole('button', { name: /العربية/ }));

      assertDocumentDirection('rtl', 'ar');
      expect(localStorage.getItem('vip_tadj_lang')).toBe('ar');
      expect(document.cookie).toContain('vip_tadj_lang=ar');
    });
  });

  // =========================================================================
  // TIER 3: PAIRWISE CROSS-SURFACE SWITCHING (STOREFRONT & ADMIN)
  // =========================================================================
  describe('Tier 3: Cross-Surface Storefront & Admin Language Switching', () => {
    it('updates AnnouncementBar + Header + Footer seamlessly across AR -> FR -> EN -> AR', () => {
      const { container } = renderStorefrontWithProviders(
        <>
          <AnnouncementBar />
          <Header cartCount={2} />
          <Footer />
        </>,
        { language: 'ar' }
      );

      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });

      // Switch to FR via Footer minimal buttons
      fireEvent.click(screen.getByRole('button', { name: /Français/i }));
      assertDocumentDirection('ltr', 'fr');
      expect(container.textContent).toContain(fr['announcement.shipping']);

      // Switch to EN
      fireEvent.click(screen.getByRole('button', { name: /English/i }));
      assertDocumentDirection('ltr', 'en');
      expect(container.textContent).toContain(en['announcement.shipping']);
      assertZeroFrenchLeakage(container, 'en', {
        exceptions: ['VIP TADJ', 'Français', 'FR', 'Chelghoum Laïd', 'Boutique'],
      });

      // Switch back to AR
      fireEvent.click(screen.getByRole('button', { name: /العربية/ }));
      assertDocumentDirection('rtl', 'ar');
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('updates AdminSidebar + AdminDashboardPage + OrderDetailClient currency (د.ج <-> DA <-> DZD) and labels across AR -> FR -> EN -> AR', async () => {
      const order = buildSwitchOrder();
      const provider = new MockSeedDataProvider();
      vi.spyOn(provider, 'getOrders').mockResolvedValue([order]);
      vi.spyOn(provider, 'getProducts').mockResolvedValue(SEED_PRODUCTS);
      vi.spyOn(provider, 'getSettings').mockResolvedValue(DEFAULT_STORE_SETTINGS);
      vi.spyOn(dataProvider, 'getDataStore').mockReturnValue(provider);

      const { container } = renderWithProviders(
        <div className="flex">
          <AdminSidebar pendingOrdersCount={1} />
          <div className="flex-1">
            <AdminDashboardPage />
            <OrderDetailClient initialOrder={order} />
          </div>
        </div>,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin' },
          initialAdminSession: {
            user: {
              id: 'usr-admin-ar',
              email: 'direction@viptadj.dz',
              displayName: 'مدير المتجر',
              role: 'superadmin',
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }
      );

      await waitFor(() => {
        expect(container.textContent).not.toContain(ar['admin.dashboard.loading_orders']);
        expect(container.textContent).toContain('VT-2026-3001');
      });
      assertArabicCurrencyDisplayStrict(container);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
        extraWhitelist: ['system'],
      });

      // AR -> FR
      selectDropdownLanguage(container, /Français/i);
      assertDocumentDirection('ltr', 'fr');
      expect(container.textContent).toMatch(/\d[\d\s\u00A0]*DA/);
      expect(container.textContent).toContain(fr['admin.dashboard.title']);

      // FR -> EN
      selectDropdownLanguage(container, /English/i);
      assertDocumentDirection('ltr', 'en');
      expect(container.textContent).toMatch(/\d[\d\s\u00A0]*DZD/);
      expect(container.textContent).toContain(en['admin.dashboard.title']);

      // EN -> AR
      selectDropdownLanguage(container, /العربية/);
      assertDocumentDirection('rtl', 'ar');
      assertArabicCurrencyDisplayStrict(container);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
        extraWhitelist: ['system'],
      });
    });
  });

  // =========================================================================
  // TIER 4: END-TO-END CONTINUITY & STATE PRESERVATION SCENARIOS
  // =========================================================================
  describe('Tier 4: End-to-End State Preservation Across Language Switching', () => {
    it('preserves Cart items & quantities in CartPage while switching AR -> FR -> EN -> AR', async () => {
      const cartItem = createMockCartItem({ quantity: 2, selectedSize: '50' });
      const { container } = renderStorefrontWithProviders(<CartPage />, {
        language: 'ar',
        initialCartItems: [cartItem],
      });

      await waitFor(() => {
        expect(container.textContent).toContain('2');
      });
      assertArabicCurrencyDisplayStrict(container);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });

      fireEvent.click(screen.getByRole('button', { name: /Français/i }));
      assertDocumentDirection('ltr', 'fr');
      expect(container.textContent).toMatch(/DA/);
      expect(container.textContent).toContain('2');

      fireEvent.click(screen.getByRole('button', { name: /English/i }));
      assertDocumentDirection('ltr', 'en');
      expect(container.textContent).toMatch(/DZD/);
      expect(container.textContent).toContain('2');

      fireEvent.click(screen.getByRole('button', { name: /العربية/ }));
      assertDocumentDirection('rtl', 'ar');
      assertArabicCurrencyDisplayStrict(container);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
      expect(container.textContent).toContain('2');
    });

    it('preserves CheckoutPage form inputs (name, phone, address, notes) while cycling AR -> FR -> EN -> AR', async () => {
      const cartItem = createMockCartItem({ quantity: 1 });
      const { container } = renderStorefrontWithProviders(<CheckoutPage />, {
        language: 'ar',
        initialCartItems: [cartItem],
      });

      const nameInput = (await waitFor(() =>
        container.querySelector('#checkout-fullName, input[name="fullName"]')
      )) as HTMLInputElement;
      const phoneInput = container.querySelector('#checkout-phone, input[name="phone"]') as HTMLInputElement;
      const addressInput = container.querySelector('#checkout-address, input[name="address"]') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'أمير قاسمي' } });
      fireEvent.change(phoneInput, { target: { value: '0555998877' } });
      if (addressInput) fireEvent.change(addressInput, { target: { value: 'حي الرياض رقم 8' } });

      // Switch AR -> FR -> EN -> AR
      fireEvent.click(screen.getByRole('button', { name: /Français/i }));
      assertDocumentDirection('ltr', 'fr');
      expect(nameInput.value).toBe('أمير قاسمي');
      expect(phoneInput.value).toBe('0555998877');
      expect(container.textContent).toMatch(/DA/);

      fireEvent.click(screen.getByRole('button', { name: /English/i }));
      assertDocumentDirection('ltr', 'en');
      expect(nameInput.value).toBe('أمير قاسمي');
      expect(phoneInput.value).toBe('0555998877');
      expect(container.textContent).toMatch(/DZD/);

      fireEvent.click(screen.getByRole('button', { name: /العربية/ }));
      assertDocumentDirection('rtl', 'ar');
      expect(nameInput.value).toBe('أمير قاسمي');
      expect(phoneInput.value).toBe('0555998877');
      if (addressInput) expect(addressInput.value).toBe('حي الرياض رقم 8');
      assertArabicCurrencyDisplayStrict(container);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
    });

    it('preserves CatalogClient filtered products across AR -> FR -> EN -> AR', () => {
      const { container } = renderStorefrontWithProviders(
        <div>
          <LanguageSelector variant="pills" />
          <CatalogClient initialProducts={SEED_PRODUCTS} initialCategory="shoes" isCategoryLocked={true} />
        </div>,
        {
          language: 'ar',
          navigation: { pathname: '/catalog/shoes' },
        }
      );

      const countProductCards = () =>
        Array.from(container.querySelectorAll('a[href^="/catalog/"]')).filter(
          (a) => (a.getAttribute('href') || '').split('/').filter(Boolean).length >= 3
        ).length;

      const initialCount = countProductCards();
      expect(initialCount).toBeGreaterThan(0);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });

      const group = within(container).getByRole('group');
      fireEvent.click(within(group).getByRole('button', { name: /Français/i }));
      expect(countProductCards()).toBe(initialCount);
      expect(container.textContent).toMatch(/DA/);

      fireEvent.click(within(group).getByRole('button', { name: /English/i }));
      expect(countProductCards()).toBe(initialCount);
      expect(container.textContent).toMatch(/DZD/);

      fireEvent.click(within(group).getByRole('button', { name: /العربية/ }));
      expect(countProductCards()).toBe(initialCount);
      assertArabicCurrencyDisplayStrict(container);
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
    });
  });
});
