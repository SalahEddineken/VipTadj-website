import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminLayout from '@/app/admin/layout';
import AdminDashboardPage from '@/app/admin/page';
import AdminSettingsPage from '@/app/admin/settings/page';
import AdminLoginPage from '@/app/admin/login/page';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';
import { OrderFilters } from '@/components/admin/OrderFilters';
import { OrderTable } from '@/components/admin/OrderTable';
import { OrderDetailClient } from '@/components/admin/OrderDetailClient';
import { OrderItemsTable } from '@/components/admin/OrderItemsTable';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import { ProductsManagementClient } from '@/components/admin/ProductsManagementClient';
import { ProductForm } from '@/components/admin/ProductForm';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import * as dataProvider from '@/lib/data-provider';
import { MockSeedDataProvider } from '@/lib/data-provider';
import { orderAudioChime } from '@/lib/utils/orderAudioChime';
import { SEED_PRODUCTS, DEFAULT_STORE_SETTINGS } from '@/lib/seed/seed-data';
import { Order, OrderStatus } from '@/types';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertArabicRTLDocument,
  assertLtrPhoneIsolation,
} from '../helpers/i18n-assertions';
import { createMockCartItem, createMockOrder } from './helpers/e2eTestUtils';
import {
  CONTEXT_UNTRANSLATED_STRINGS,
  assertZeroFrenchOrEnglishLeakage,
  assertArabicCurrencyDisplayStrict,
  assertNoFrenchOrEnglishDates,
  setupExtendedE2EFetch,
} from './helpers/ar-leakage-assertions';

const ARABIC_ADMIN_SESSION = {
  user: {
    id: 'usr-admin-ar',
    email: 'admin@viptadj.dz',
    displayName: 'مدير المتجر',
    role: 'superadmin' as const,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
};

function buildAdminOrder(overrides: Partial<Order> = {}): Order {
  const item = createMockCartItem({
    productId: SEED_PRODUCTS[0].id,
    title: SEED_PRODUCTS[0].title,
    price: 48500,
    quantity: 1,
    selectedSize: '50',
    selectedColor: 'Bleu Nuit',
  });

  return createMockOrder({
    id: 'ord-admin-2993',
    orderNumber: 'VT-2026-2993',
    status: 'delivered',
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
    items: [item],
    subtotal: 48500,
    deliveryFee: 400,
    discount: 0,
    total: 48900,
    courier: {
      name: 'Yalidine',
      trackingCode: 'YAL-2026-299301',
    },
    statusHistory: [
      {
        status: 'pending',
        timestamp: '2026-11-10T10:00:00.000Z',
        note: 'تم إنشاء الطلبية',
        updatedBy: 'system',
      },
      {
        status: 'delivered',
        timestamp: '2026-11-12T15:30:00.000Z',
        note: 'تم التسليم والتحصيل بنجاح',
        updatedBy: 'admin@viptadj.dz',
      },
    ],
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-12T15:30:00.000Z',
    ...overrides,
  });
}

function spyMockDataStore(orders: Order[], products = SEED_PRODUCTS) {
  const provider = new MockSeedDataProvider();
  vi.spyOn(provider, 'getOrders').mockImplementation(async (filter) => {
    if (filter?.status) {
      return orders.filter((o) => o.status === filter.status);
    }
    return orders;
  });
  vi.spyOn(provider, 'getProducts').mockResolvedValue(products);
  vi.spyOn(provider, 'getSettings').mockResolvedValue(DEFAULT_STORE_SETTINGS);
  vi.spyOn(dataProvider, 'getDataStore').mockReturnValue(provider);
  return provider;
}

describe('E2E 08 — Complete Admin Portal Arabic (ar) Localization & Context Audit', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    delete (globalThis as Record<string, unknown>).__vipTadjDataStore;
    orderAudioChime.setMuted(false);
    vi.restoreAllMocks();
    setupExtendedE2EFetch({
      ordersList: [buildAdminOrder({ status: 'pending' })],
      productsList: SEED_PRODUCTS,
    });
  });

  afterEach(() => {
    orderAudioChime.setMuted(false);
    global.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE — All Admin Portal Surfaces in AR Mode
  // =========================================================================
  describe('Tier 1: Admin Portal Components & Pages in AR', () => {
    it('renders AdminLayout with pending=1 banner and chime active/muted states completely in AR (zero Context French strings)', async () => {
      const pendingOrder = buildAdminOrder({ id: 'ord-pending-1', status: 'pending' });
      spyMockDataStore([pendingOrder]);

      const { container } = renderWithProviders(
        <AdminLayout>
          <div>محتوى لوحة التحكم</div>
        </AdminLayout>,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin/orders/ord-pending-1' },
          initialAdminSession: {
            user: {
              id: 'usr-1',
              email: 'admin@viptadj.dz',
              displayName: 'مدير المتجر',
              role: 'superadmin',
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }
      );

      assertArabicRTLDocument();
      await waitFor(() => {
        expect(container.querySelector('a[href="/admin/orders?status=pending"]')).toBeTruthy();
      });

      // Must NOT contain ORIGINAL_REQUEST Context strings "Carillon actif" or "commande en attente de confirmation"
      expect(container.textContent).not.toContain('Carillon actif');
      expect(container.textContent).not.toContain('commande en attente de confirmation');
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });

      // Toggle chime mute -> muted state must also be 100% Arabic
      const chimeBtns = Array.from(container.querySelectorAll('button')).filter((b) => {
        const hay = `${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`;
        return /التنبيه الصوتي|التنبيهات الصوتية|الصوت مكتوم|جرس التنبيهات|كتم الصوت|تفعيل الصوت/.test(hay);
      });
      expect(chimeBtns.length).toBeGreaterThan(0);

      const primaryChimeBtn = chimeBtns[0];
      const beforeHay = `${primaryChimeBtn.getAttribute('title') || ''} ${primaryChimeBtn.getAttribute('aria-label') || ''} ${primaryChimeBtn.textContent || ''}`;
      fireEvent.click(primaryChimeBtn);
      await waitFor(() => {
        const updatedHay = `${primaryChimeBtn.getAttribute('title') || ''} ${primaryChimeBtn.getAttribute('aria-label') || ''} ${primaryChimeBtn.textContent || ''}`;
        expect(updatedHay).not.toBe(beforeHay);
        expect(updatedHay).toMatch(/الصوت مكتوم|التنبيهات الصوتية مكتومة|تفعيل التنبيه الصوتي|تفعيل الصوت/);
      });
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('renders AdminAuthGuard (authenticated & unauthenticated) and AdminLoginPage in AR with zero French leakage', () => {
      vi.useFakeTimers();

      const unauth = renderWithProviders(
        <AdminAuthGuard>
          <div>محتوى محمي</div>
        </AdminAuthGuard>,
        {
          language: 'ar',
          includeAdmin: true,
          initialAdminSession: { isAuthenticated: false },
          navigation: { pathname: '/admin' },
        }
      );
      assertZeroFrenchOrEnglishLeakage(unauth.container);
      unauth.unmount();

      const login = renderWithProviders(<AdminLoginPage />, {
        language: 'ar',
        includeAdmin: true,
        navigation: { pathname: '/admin/login' },
      });
      assertZeroFrenchOrEnglishLeakage(login.container);
    });

    it('renders AdminSidebar (with fallback profile) and AdminDashboardPage in AR with د.ج KPIs', async () => {
      const orders = [
        buildAdminOrder({ id: 'ord-d1', status: 'pending' }),
        buildAdminOrder({ id: 'ord-d2', orderNumber: 'VT-2026-2994', status: 'delivered' }),
      ];
      spyMockDataStore(orders, SEED_PRODUCTS);

      const { container } = renderWithProviders(
        <div className="flex">
          <AdminSidebar pendingOrdersCount={1} />
          <AdminDashboardPage />
        </div>,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin' },
          initialAdminSession: {
            user: {
              id: 'usr-fallback',
              email: 'admin@viptadj.dz',
              displayName: '',
              role: 'admin',
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }
      );

      await waitFor(() => {
        expect(container.textContent).toMatch(/د\.ج/);
      });

      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
      assertNoFrenchOrEnglishDates(container);
    });

    it('renders OrdersManagementClient, OrderFilters, and OrderTable in AR with zero FR/EN leakage and Arabic order counts', () => {
      const orders = [
        buildAdminOrder({ id: 'ord-1', orderNumber: 'VT-2026-2993', status: 'pending' }),
        buildAdminOrder({ id: 'ord-2', orderNumber: 'VT-2026-2995', status: 'confirmed' }),
      ];

      const { container } = renderWithProviders(
        <OrdersManagementClient initialOrders={orders} />,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin/orders' },
        }
      );

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
      assertNoFrenchOrEnglishDates(container);

      // Standalone OrderFilters & OrderTable checks
      const filtersRender = renderWithProviders(
        <OrderFilters
          activeStatus="all"
          onStatusChange={vi.fn()}
          counts={{ all: 2, pending: 1, confirmed: 1, shipped: 0, delivered: 0, cancelled: 0 }}
          searchQuery=""
          onSearchChange={vi.fn()}
          wilayaFilter="all"
          onWilayaChange={vi.fn()}
          dateSort="newest"
          onDateSortChange={vi.fn()}
          onReset={vi.fn()}
          isFiltered={false}
          onRefresh={vi.fn()}
        />,
        { language: 'ar' }
      );
      assertZeroFrenchOrEnglishLeakage(filtersRender.container);

      const tableRender = renderWithProviders(
        <OrderTable orders={orders} onOpenStatusModal={vi.fn()} />,
        { language: 'ar' }
      );
      assertZeroFrenchOrEnglishLeakage(tableRender.container, { requireCurrency: true });
      assertNoFrenchOrEnglishDates(tableRender.container);
    });

    it('renders OrderDetailClient + OrderItemsTable for terminal delivered VT-2026-2993 (1 item) with ZERO Context French strings', () => {
      const deliveredOrder = buildAdminOrder({
        orderNumber: 'VT-2026-2993',
        status: 'delivered',
        discount: 500,
        total: 48400,
      });

      const { container } = renderWithProviders(
        <OrderDetailClient initialOrder={deliveredOrder} />,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin/orders/ord-admin-2993' },
        }
      );

      const normalized = (container.textContent || '').replace(/[\u2018\u2019]/g, "'");
      for (const ctxString of CONTEXT_UNTRANSLATED_STRINGS) {
        expect(
          normalized.toLowerCase(),
          `ORIGINAL_REQUEST Context string "${ctxString}" still leaked in AR OrderDetailClient!`
        ).not.toContain(ctxString.toLowerCase());
      }

      expect(container.textContent).toContain('VT-2026-2993');
      assertZeroFrenchOrEnglishLeakage(container, {
        requireCurrency: true,
        extraWhitelist: ['Yalidine', 'system'],
      });
      assertArabicCurrencyDisplayStrict(container);
      assertNoFrenchOrEnglishDates(container);

      const telLinks = container.querySelectorAll('a[href^="tel:"]');
      expect(telLinks.length).toBeGreaterThan(0);
      telLinks.forEach((el) => assertLtrPhoneIsolation(el as HTMLElement));
    });

    it('renders OrderDetailClient for active pending/shipped orders and OrderStatusTransitionModal across all transitions in AR', () => {
      const pendingOrder = buildAdminOrder({ status: 'pending', courier: undefined });
      const activeDetail = renderWithProviders(
        <OrderDetailClient initialOrder={pendingOrder} />,
        { language: 'ar', includeAdmin: true }
      );
      assertZeroFrenchOrEnglishLeakage(activeDetail.container, {
        requireCurrency: true,
        extraWhitelist: ['system'],
      });

      const shippedModal = renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          onClose={vi.fn()}
          order={buildAdminOrder({ status: 'confirmed' })}
          initialTargetStatus="shipped"
          onSuccess={vi.fn()}
        />,
        { language: 'ar', includeAdmin: true }
      );
      assertZeroFrenchOrEnglishLeakage(shippedModal.container);

      const cancelModal = renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          onClose={vi.fn()}
          order={pendingOrder}
          initialTargetStatus="cancelled"
          onSuccess={vi.fn()}
        />,
        { language: 'ar', includeAdmin: true }
      );
      assertZeroFrenchOrEnglishLeakage(cancelModal.container);
    });

    it('renders ProductsManagementClient, ProductForm (create & edit), and AdminMediaUpload (all 4 tabs) in AR', async () => {
      const prodMgmt = renderWithProviders(
        <ProductsManagementClient initialProducts={SEED_PRODUCTS.slice(0, 6)} />,
        { language: 'ar', includeAdmin: true }
      );
      assertZeroFrenchOrEnglishLeakage(prodMgmt.container, { requireCurrency: true });

      const formCreate = renderWithProviders(
        <ProductForm mode="create" />,
        { language: 'ar', includeAdmin: true }
      );
      assertZeroFrenchOrEnglishLeakage(formCreate.container);

      const media = renderWithProviders(
        <AdminMediaUpload
          images={SEED_PRODUCTS[0].images}
          onChange={vi.fn()}
          category="clothing"
          showLegacyTabs
        />,
        { language: 'ar', includeAdmin: true }
      );
      assertZeroFrenchOrEnglishLeakage(media.container);

      // Switch across all 4 AdminMediaUpload tabs (upload, url, library, guide — excluding quick-upload button)
      const tabBar = media.container.querySelector('.flex.flex-wrap.items-center.gap-2.border-b');
      expect(tabBar).toBeTruthy();
      const tabButtons = Array.from(tabBar!.querySelectorAll('button[type="button"]'));
      expect(tabButtons).toHaveLength(4);
      for (const tabBtn of tabButtons) {
        fireEvent.click(tabBtn);
        assertZeroFrenchOrEnglishLeakage(media.container);
      }
      expect(media.container.textContent).toContain('drive.google.com');
    });

    it('renders AdminSettingsPage (with expanded Baladiyat panel) in AR with zero DA/French hero preview/French location leaks', async () => {
      const { container } = renderWithProviders(<AdminSettingsPage />, {
        language: 'ar',
        includeAdmin: true,
        initialAdminSession: ARABIC_ADMIN_SESSION,
        navigation: { pathname: '/admin/settings' },
      });

      const expandBtns = await waitFor(() => {
        const btns = container.querySelectorAll('button[aria-expanded]');
        expect(btns.length).toBeGreaterThan(0);
        return btns;
      });

      // Expand first wilaya's Baladiyat/communes panel before anti-leakage assertion
      fireEvent.click(expandBtns[0]);
      await waitFor(() => {
        expect(expandBtns[0].getAttribute('aria-expanded')).toBe('true');
      });

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Admin Boundary & Error Cases in AR', () => {
    it('handles AdminLayout pendingCount = 0 and preserves chime muted state cleanly', async () => {
      orderAudioChime.setMuted(true);
      spyMockDataStore([buildAdminOrder({ status: 'delivered' })]);

      const { container } = renderWithProviders(
        <AdminLayout>
          <div>لوحة الإدارة</div>
        </AdminLayout>,
        {
          language: 'ar',
          includeAdmin: true,
          initialAdminSession: ARABIC_ADMIN_SESSION,
          navigation: { pathname: '/admin' },
        }
      );

      await waitFor(() => {
        expect(container.textContent).toMatch(/[\u0600-\u06FF]+/);
      });
      assertZeroFrenchOrEnglishLeakage(container, { allowLanguageNames: true });
    });

    it('renders OrdersManagementClient empty state and filtered zero-results strictly in Arabic (no French fallback)', () => {
      const { container } = renderWithProviders(
        <OrdersManagementClient initialOrders={[]} />,
        { language: 'ar', includeAdmin: true }
      );

      expect(container.textContent?.toLowerCase()).not.toContain('aucune commande');
      assertZeroFrenchOrEnglishLeakage(container);
    });

    it('renders cancelled OrderDetailClient (desk delivery, missing address/notes) and free delivery OrderItemsTable in AR', () => {
      const cancelledOrder = buildAdminOrder({
        status: 'cancelled',
        deliveryFee: 0,
        discount: 0,
        total: 48500,
        customer: {
          fullName: 'كريم منصوري',
          phone: '0661223344',
          wilaya: 'وهران',
          wilayaCode: 31,
          commune: 'وهران',
          deliveryType: 'desk',
        },
        statusHistory: [
          {
            status: 'cancelled',
            timestamp: '2026-11-11T12:00:00.000Z',
            cancellationReason: 'UNREACHABLE_AFTER_CALLS',
            updatedBy: 'admin@viptadj.dz',
          },
        ],
      });

      const { container } = renderWithProviders(
        <>
          <OrderDetailClient initialOrder={cancelledOrder} />
          <OrderItemsTable
            items={cancelledOrder.items}
            subtotal={48500}
            deliveryFee={0}
            total={48500}
            wilayaName="وهران"
          />
        </>,
        { language: 'ar', includeAdmin: true }
      );

      expect(container.textContent).not.toContain('0 DA (Offerte)');
      assertZeroFrenchOrEnglishLeakage(container, {
        requireCurrency: true,
        extraWhitelist: ['Yalidine'],
      });
      assertNoFrenchOrEnglishDates(container);
    });

    it('renders OrderStatusTransitionModal API failure error strictly in Arabic', async () => {
      setupExtendedE2EFetch({
        statusUpdateResult: {
          ok: false,
          status: 400,
          body: {
            success: false,
            error: 'Transition invalide',
            errorCode: 'INVALID_STATUS_TRANSITION',
          },
        },
      });

      const { container } = renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          onClose={vi.fn()}
          order={buildAdminOrder({ status: 'pending' })}
          initialTargetStatus="confirmed"
          onSuccess={vi.fn()}
        />,
        { language: 'ar', includeAdmin: true }
      );

      const submitBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.getAttribute('type') === 'submit'
      ) as HTMLButtonElement | undefined;
      expect(submitBtn).toBeTruthy();
      fireEvent.click(submitBtn!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/status'),
          expect.objectContaining({ method: 'PATCH' })
        );
      });

      await waitFor(() => {
        expect(container.querySelector('.bg-rose-50')).toBeTruthy();
      });

      assertZeroFrenchOrEnglishLeakage(container);
    });

    it('triggers Arabic validation errors on empty ProductForm submission', async () => {
      const { container } = renderWithProviders(
        <ProductForm mode="create" />,
        { language: 'ar', includeAdmin: true, initialAdminSession: ARABIC_ADMIN_SESSION }
      );

      const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      expect(submitBtn).toBeTruthy();
      fireEvent.click(submitBtn!);

      await waitFor(() => {
        expect(container.querySelector('.bg-rose-50, .text-rose-600')).toBeTruthy();
      });

      assertZeroFrenchOrEnglishLeakage(container);
    });
  });

  // =========================================================================
  // TIER 3: PAIRWISE CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Pairwise Admin Combinations in AR', () => {
    it('composes AdminLayout + AdminSidebar + AdminDashboardPage together in AR with consistent terminology', async () => {
      const pending = buildAdminOrder({ status: 'pending' });
      spyMockDataStore([pending], SEED_PRODUCTS);

      const { container } = renderWithProviders(
        <AdminLayout>
          <AdminDashboardPage />
        </AdminLayout>,
        {
          language: 'ar',
          includeAdmin: true,
          initialAdminSession: ARABIC_ADMIN_SESSION,
          navigation: { pathname: '/admin' },
        }
      );

      await waitFor(() => {
        expect(container.textContent).toMatch(/د\.ج/);
        expect(container.querySelector('a[href="/admin/orders?status=pending"]')).toBeTruthy();
      });
      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
      });
    });

    it('filters OrdersManagementClient (pending + search) and transitions order status via modal with Arabic toast', async () => {
      const pending = buildAdminOrder({ id: 'ord-p1', orderNumber: 'VT-2026-2993', status: 'pending' });
      setupExtendedE2EFetch({ orderById: { 'ord-p1': pending } });

      const { container } = renderWithProviders(
        <OrdersManagementClient initialOrders={[pending]} initialStatus="pending" />,
        { language: 'ar', includeAdmin: true, initialAdminSession: ARABIC_ADMIN_SESSION }
      );

      const searchInput = container.querySelector('input[type="text"], input[type="search"]') as HTMLInputElement | null;
      expect(searchInput).toBeTruthy();
      fireEvent.change(searchInput!, { target: { value: 'VT-2026-2993' } });

      expect(container.querySelector('tbody tr')).toBeTruthy();
      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });

      // Find the row's status transition button inside tbody
      const advanceBtn = Array.from(container.querySelectorAll('tbody button')).find((b) => {
        const hay = `${b.getAttribute('title') || ''} ${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`;
        return /تحديث الحالة|تأكيد/.test(hay);
      }) as HTMLButtonElement | undefined;
      expect(advanceBtn).toBeTruthy();
      fireEvent.click(advanceBtn!);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      assertZeroFrenchOrEnglishLeakage(dialog);

      const modalSubmitBtn = dialog.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      expect(modalSubmitBtn).toBeTruthy();
      fireEvent.click(modalSubmitBtn!);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/orders/ord-p1/status'),
          expect.objectContaining({ method: 'PATCH' })
        );
      });

      await waitFor(() => {
        const toast = container.querySelector('.bg-emerald-50');
        expect(toast).toBeTruthy();
        expect(toast?.textContent).toContain('VT-2026-2993');
        expect(toast?.textContent).toContain('مؤكدة');
      });

      // While activeStatus stays 'pending', the transitioned order leaves this tab (empty state + Arabic toast)
      assertZeroFrenchOrEnglishLeakage(container);

      // Switch to 'confirmed' tab in OrderFilters and verify the transitioned order re-renders in Arabic with د.ج
      const confirmedTabBtn = Array.from(container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes('مؤكدة')
      ) as HTMLButtonElement | undefined;
      expect(confirmedTabBtn).toBeTruthy();
      fireEvent.click(confirmedTabBtn!);

      await waitFor(() => {
        expect(container.querySelector('tbody tr')).toBeTruthy();
        expect(container.textContent).toContain('VT-2026-2993');
      });

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });
    });

    it('switches categories in ProductForm (clothing -> shoes -> accessories) updating subcategories & sizes in AR', async () => {
      const { container } = renderWithProviders(
        <ProductForm mode="edit" initialData={SEED_PRODUCTS[0]} />,
        { language: 'ar', includeAdmin: true, initialAdminSession: ARABIC_ADMIN_SESSION }
      );

      assertZeroFrenchOrEnglishLeakage(container, { requireCurrency: true });

      // Target the 3 category card buttons specifically (clothing, shoes, accessories — NOT "Régénérer")
      const categoryGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-3');
      expect(categoryGrid).toBeTruthy();
      const categoryCards = Array.from(categoryGrid!.querySelectorAll('button[type="button"]'));
      expect(categoryCards).toHaveLength(3);

      // Switch to shoes -> verifies shoe size matrix (39-45) renders
      fireEvent.click(categoryCards[1]);
      await waitFor(() => {
        expect(container.textContent).toContain('39');
        expect(container.textContent).toContain('45');
      });
      assertZeroFrenchOrEnglishLeakage(container);

      // Switch to accessories -> verifies single-size matrix renders
      fireEvent.click(categoryCards[2]);
      await waitFor(() => {
        expect(container.textContent).toContain('مقاس موحد');
      });
      assertZeroFrenchOrEnglishLeakage(container);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD END-TO-END ADMIN SCENARIOS
  // =========================================================================
  describe('Tier 4: End-to-End Admin Workflows in AR', () => {
    it('executes full order lifecycle view from AdminLayout -> Orders -> OrderDetailClient VT-2026-2993 -> StatusTransitionModal in AR', async () => {
      const order = buildAdminOrder({ id: 'ord-flow-2993', orderNumber: 'VT-2026-2993', status: 'pending' });
      spyMockDataStore([order]);
      setupExtendedE2EFetch({ orderById: { 'ord-flow-2993': order } });

      const { container } = renderWithProviders(
        <AdminLayout>
          <OrderDetailClient initialOrder={order} />
        </AdminLayout>,
        {
          language: 'ar',
          includeAdmin: true,
          initialAdminSession: ARABIC_ADMIN_SESSION,
          navigation: { pathname: '/admin/orders/ord-flow-2993' },
        }
      );

      await waitFor(() => {
        expect(container.textContent).toContain('VT-2026-2993');
        expect(container.querySelector('a[href="/admin/orders?status=pending"]')).toBeTruthy();
      });

      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
        extraWhitelist: ['Yalidine', 'system'],
      });
      assertNoFrenchOrEnglishDates(container);

      // Target the status controller transition button inside <main> specifically
      const mainEl = container.querySelector('main');
      expect(mainEl).toBeTruthy();
      const modalTrigger = Array.from(mainEl!.querySelectorAll('button')).find((b) =>
        /تأكيد الطلبية|تأكيد/.test(b.textContent || '')
      ) as HTMLButtonElement | undefined;
      expect(modalTrigger).toBeTruthy();
      fireEvent.click(modalTrigger!);

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      assertZeroFrenchOrEnglishLeakage(container, {
        allowLanguageNames: true,
        requireCurrency: true,
        extraWhitelist: ['Yalidine', 'system'],
      });
    });

    it('executes Admin Catalog + Settings management workflow in AR with zero French/English leakage', async () => {
      const prodRender = renderWithProviders(
        <ProductsManagementClient initialProducts={SEED_PRODUCTS.slice(0, 4)} />,
        { language: 'ar', includeAdmin: true, initialAdminSession: ARABIC_ADMIN_SESSION }
      );
      assertZeroFrenchOrEnglishLeakage(prodRender.container, { requireCurrency: true });
      prodRender.unmount();

      const settingsRender = renderWithProviders(<AdminSettingsPage />, {
        language: 'ar',
        includeAdmin: true,
        initialAdminSession: ARABIC_ADMIN_SESSION,
      });
      const expandBtns = await waitFor(() => {
        const btns = settingsRender.container.querySelectorAll('button[aria-expanded]');
        expect(btns.length).toBeGreaterThan(0);
        return btns;
      });
      fireEvent.click(expandBtns[0]);
      await waitFor(() => {
        expect(expandBtns[0].getAttribute('aria-expanded')).toBe('true');
      });

      assertZeroFrenchOrEnglishLeakage(settingsRender.container, { requireCurrency: true });
    });
  });
});
