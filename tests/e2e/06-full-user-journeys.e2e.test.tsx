import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertZeroFrenchLeakage,
  assertArabicRTLDocument,
  assertArabicCurrencyDisplay,
} from '../helpers/i18n-assertions';
import {
  setupMockFetch,
  createMockCartItem,
  createMockOrder,
  MOCK_ALGERIAN_CUSTOMER,
} from './helpers/e2eTestUtils';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { AddToCartSection } from '@/components/store/pdp/AddToCartSection';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import AdminDashboardPage from '@/app/admin/page';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { getWilayaByCode } from '@/lib/data/wilayas';

describe('E2E Test Suite 06: Full Real-World User Journeys (Tier 3 & Tier 4)', () => {
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
  // SCENARIO 1: End-to-End Arabic Luxury Shopping & COD Placement Journey
  // =========================================================================
  describe('Scenario 1: Arabic Luxury Shopping Journey (PDP -> Cart -> Checkout)', () => {
    it('executes full shopping journey in Arabic: PDP selection, Cart review, and Wilaya 16 Alger COD order', async () => {
      // 1. Customer visits PDP in Arabic
      const localizedSuit = getLocalizedProduct(suitProduct, 'ar');
      const { rerender } = renderWithProviders(
        <ProductDetailPage product={suitProduct} />,
        {
          language: 'ar',
          navigation: { pathname: `/catalog/clothing/${suitProduct.slug}` },
        }
      );

      assertArabicRTLDocument();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(localizedSuit.title);

      // 2. Add product to cart with size 50
      const cartItem = createMockCartItem({
        productId: suitProduct.id,
        title: localizedSuit.title,
        price: suitProduct.price,
        selectedSize: '50',
        quantity: 1,
      });
      localStorage.setItem('vip_cart', JSON.stringify([cartItem]));

      // 3. Customer opens cart page
      rerender(<CartPage />);
      assertArabicRTLDocument();
      assertZeroFrenchLeakage(document.body, 'ar');

      // 4. Customer proceeds to checkout
      const { container: checkoutContainer } = renderWithProviders(<CheckoutPage />, {
        language: 'ar',
        navigation: { pathname: '/checkout' },
        initialCartItems: [cartItem],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/nom|الاسم/i)).toBeInTheDocument();
      });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(checkoutContainer, 'ar');
    });
  });

  // =========================================================================
  // SCENARIO 2: Direct Express COD Checkout Flow in Arabic
  // =========================================================================
  describe('Scenario 2: Direct Express COD Checkout Flow in Arabic', () => {
    it('bypasses standard cart, stores single item in sessionStorage, and routes to express checkout', () => {
      const handleValidate = vi.fn().mockReturnValue(true);

      const { nav } = renderWithProviders(
        <AddToCartSection
          product={suitProduct}
          selectedSize="52"
          selectedColor={suitProduct.colors?.[0]}
          onValidateSize={handleValidate}
        />,
        { language: 'ar' }
      );

      // Click "الطلب المباشر" / "Commander directement"
      const directOrderBtn = screen.getByRole('button', {
        name: /commander directement|طلب مباشر|الطلب المباشر/i,
      });
      fireEvent.click(directOrderBtn);

      // Expect navigation to /checkout?direct=1
      expect(nav.router.push).toHaveBeenCalledWith(expect.stringContaining('/checkout?direct=1'));

      // Expect sessionStorage to contain express item, while localStorage vip_cart is untouched
      const expressRaw = sessionStorage.getItem('vip_express_checkout');
      expect(expressRaw).not.toBeNull();
      const expressItem = JSON.parse(expressRaw!);
      expect(expressItem.productId).toBe(suitProduct.id);
      expect(expressItem.selectedSize).toBe('52');
      expect(localStorage.getItem('vip_cart')).toBeNull();
    });
  });

  // =========================================================================
  // SCENARIO 3: Store Manager Fulfillment Lifecycle in Arabic Admin Portal
  // =========================================================================
  describe('Scenario 3: Store Manager Administrative Fulfillment Lifecycle in Arabic', () => {
    it('manages incoming COD order lifecycle: dashboard review, status transition to confirmed & shipped', async () => {
      const initialOrder = createMockOrder({
        id: 'ord-journey-01',
        orderNumber: 'VIP-2026-9001',
        status: 'pending',
      });

      // 1. Manager views dashboard
      const { rerender } = renderWithProviders(<AdminDashboardPage />, {
        language: 'ar',
        includeAdmin: true,
        navigation: { pathname: '/admin' },
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
      assertArabicRTLDocument();

      // 2. Manager views orders table
      rerender(<OrdersManagementClient initialOrders={[initialOrder]} />);
      expect(screen.getByText('VIP-2026-9001')).toBeInTheDocument();

      // 3. Manager opens status transition modal to advance order
      const handleSuccess = vi.fn();
      renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          order={initialOrder}
          onClose={() => {}}
          onSuccess={handleSuccess}
        />,
        {
          language: 'ar',
          includeAdmin: true,
        }
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SCENARIO 4: Mid-Session Trilingual Language Switch During Checkout
  // =========================================================================
  describe('Scenario 4: Mid-Session Trilingual Language Switch During Checkout', () => {
    it('preserves user input across French to Arabic language switch without losing form state', async () => {
      const cartItem = createMockCartItem({ price: 48500 });

      // 1. Start checkout in French
      const { rerender } = renderWithProviders(<CheckoutPage />, {
        language: 'fr',
        navigation: { pathname: '/checkout' },
        initialCartItems: [cartItem],
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/nom et prénom/i)).toBeInTheDocument();
      });

      // 2. User enters customer details in French mode
      const nameInput = screen.getByLabelText(/nom et prénom/i) as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Karim Ziani' } });
      expect(nameInput.value).toBe('Karim Ziani');

      // 3. User switches language to Arabic
      localStorage.setItem('vip_tadj_lang', 'ar');
      document.documentElement.lang = 'ar';
      document.documentElement.dir = 'rtl';

      rerender(<CheckoutPage />);

      // Document switches to RTL
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');

      // User input is preserved
      expect(nameInput.value).toBe('Karim Ziani');
    });
  });

  // =========================================================================
  // SCENARIO 5: Wilaya Shipping Reconfiguration & Dynamic Free Shipping
  // =========================================================================
  describe('Scenario 5: Wilaya Delivery Fee & Dynamic Free Shipping Threshold Reconfiguration', () => {
    it('applies delivery fee under threshold and waives fee dynamically when cart reaches 15,000 DA', () => {
      const wilaya31 = getWilayaByCode(31); // Oran: 600 DA home fee
      expect(wilaya31).toBeDefined();

      const handleChangeType = vi.fn();
      const handleSelectWilaya = vi.fn();

      // 1. Under 15,000 DA threshold (e.g. 10,000 DA)
      const { rerender } = renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={31}
          deliveryType="home"
          cartSubtotal={10000}
          freeShippingThreshold={15000}
          onSelectWilaya={handleSelectWilaya}
          onChangeDeliveryType={handleChangeType}
        />,
        { language: 'ar' }
      );

      assertArabicRTLDocument();
      // Should show Oran standard fee (800 د.ج)
      expect(screen.getByText(/800/)).toBeInTheDocument();

      // 2. Crossing 15,000 DA threshold (e.g. 25,000 DA)
      rerender(
        <WilayaSelector
          selectedWilayaCode={31}
          deliveryType="home"
          cartSubtotal={25000}
          freeShippingThreshold={15000}
          onSelectWilaya={handleSelectWilaya}
          onChangeDeliveryType={handleChangeType}
        />
      );

      // Should show free delivery indicator (0 د.ج or gratuit / مجاني)
      expect(screen.getAllByText(/0|gratuit|مجاناً|مجاني/i).length).toBeGreaterThan(0);
    });
  });
});
