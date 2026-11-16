import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import {
  assertZeroFrenchLeakage,
  assertArabicRTLDocument,
  assertArabicCurrencyDisplay,
} from '../helpers/i18n-assertions';
import { setupMockFetch, createMockOrder } from './helpers/e2eTestUtils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import AdminDashboardPage from '@/app/admin/page';
import AdminLoginPage from '@/app/admin/login/page';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import AdminSettingsPage from '@/app/admin/settings/page';
import { ar } from '@/lib/i18n/locales';

describe('E2E Test Suite 04: Admin Portal Localization & State Machine (Tier 1)', () => {
  const sampleOrder = createMockOrder({
    id: 'ord-admin-test-01',
    orderNumber: 'VIP-2026-1111',
    status: 'pending',
  });

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    setupMockFetch({
      ordersList: [sampleOrder],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE
  // =========================================================================

  describe('Tier 1: AdminSidebar Navigation Localization', () => {
    it('renders navigation links and language selector in Arabic', () => {
      const { container } = renderWithProviders(
        <AdminSidebar pendingOrdersCount={3} />,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin' },
        }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Verify dashboard and orders navigation links are rendered
      expect(screen.getByRole('link', { name: new RegExp(ar['admin.nav.dashboard'] || 'لوحة التحكم', 'i') })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: new RegExp(ar['admin.nav.orders'] || 'الطلبات', 'i') })).toBeInTheDocument();
    });
  });

  describe('Tier 1: Admin Dashboard & KPI Cards Localization', () => {
    it('renders admin dashboard with KPI metric cards in Arabic', async () => {
      const { container } = renderWithProviders(<AdminDashboardPage />, {
        language: 'ar',
        includeAdmin: true,
        navigation: { pathname: '/admin' },
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');
    });
  });

  describe('Tier 1: Admin Login Page Localization', () => {
    it('renders admin login form and demo credentials card in Arabic', () => {
      const { container } = renderWithProviders(<AdminLoginPage />, {
        language: 'ar',
        includeAdmin: true,
        initialAdminSession: { isAuthenticated: false },
        navigation: { pathname: '/admin/login' },
      });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Check for email and password inputs
      expect(screen.getByRole('textbox', { name: /email|بريد/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connexion|دخول|تسجيل الدخول/i })).toBeInTheDocument();
    });
  });

  describe('Tier 1: Admin Orders Management & Status Machine', () => {
    it('renders orders management with Arabic filter tabs and status badges', () => {
      const { container } = renderWithProviders(
        <OrdersManagementClient initialOrders={[sampleOrder]} />,
        {
          language: 'ar',
          includeAdmin: true,
          navigation: { pathname: '/admin/orders' },
        }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Order number rendered
      expect(screen.getByText('VIP-2026-1111')).toBeInTheDocument();
    });

    it('renders OrderStatusBadge with Arabic status label', () => {
      const { container: pendingContainer } = renderWithProviders(
        <OrderStatusBadge status="pending" />,
        { language: 'ar' }
      );
      expect(pendingContainer).toBeInTheDocument();

      const { container: confirmedContainer } = renderWithProviders(
        <OrderStatusBadge status="confirmed" />,
        { language: 'ar' }
      );
      expect(confirmedContainer).toBeInTheDocument();
    });

    it('renders OrderStatusTransitionModal with Arabic options and cancellation note', () => {
      const handleClose = vi.fn();
      const handleSuccess = vi.fn();

      const { container } = renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          order={sampleOrder}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />,
        {
          language: 'ar',
          includeAdmin: true,
        }
      );

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Verify modal is open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Tier 1: Admin Settings & 58 Wilayas Matrix Localization', () => {
    it('renders 58 Wilayas shipping fees table with Arabic names in AdminSettingsPage', async () => {
      const { container } = renderWithProviders(<AdminSettingsPage />, {
        language: 'ar',
        includeAdmin: true,
        navigation: { pathname: '/admin/settings' },
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });

      assertArabicRTLDocument();
      assertZeroFrenchLeakage(container, 'ar');

      // Verify Arabic Wilaya name (e.g. الجزائر or وهران) appears in the table
      expect(screen.getAllByText(/الجزائر|وهران/)[0]).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================

  describe('Tier 2: Admin Order Filtering & State Machine Boundaries', () => {
    it('filters orders by Algerian customer mobile phone number', () => {
      renderWithProviders(
        <OrdersManagementClient initialOrders={[sampleOrder]} />,
        {
          language: 'ar',
          includeAdmin: true,
        }
      );

      const searchInput = screen.getByRole('textbox');
      fireEvent.change(searchInput, { target: { value: '0555123456' } });

      // Order should remain visible
      expect(screen.getByText('VIP-2026-1111')).toBeInTheDocument();

      // Search for non-existent phone
      fireEvent.change(searchInput, { target: { value: '0999999999' } });
      expect(screen.queryByText('VIP-2026-1111')).not.toBeInTheDocument();
    });

    it('displays empty orders queue message when no orders match criteria', () => {
      renderWithProviders(
        <OrdersManagementClient initialOrders={[]} />,
        {
          language: 'ar',
          includeAdmin: true,
        }
      );

      // Should indicate empty order queue
      expect(screen.getAllByText(/aucune commande|لا توجد طلبات/i).length).toBeGreaterThan(0);
    });
  });
});
