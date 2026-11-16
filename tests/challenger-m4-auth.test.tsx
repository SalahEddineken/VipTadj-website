import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';

// Domain modules under adversarial test
import {
  AuthProvider,
  useAdminAuth,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  checkAdminAccess,
  PRIMARY_STORAGE_KEY,
  SECONDARY_STORAGE_KEY,
  SESSION_TTL_MS,
  MOCK_ADMIN_CREDENTIALS,
  StoredAdminSession,
} from '@/lib/context/auth-context';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { computeAdminKPIs, DashboardKPIs } from '@/lib/admin/kpi-calculator';
import { calculateTotalStock, generateSlug, validateProductForm } from '@/lib/validations/product';
import { updateStoreSettingsSchema } from '@/lib/validations/settings';
import { ALGERIAN_58_WILAYAS } from '@/lib/data/wilayas';
import { localStorageMock } from './setup';
import { Order, Product, AdminUser } from '@/types';

// Mock next/navigation dynamically
const mockPush = vi.fn();
const mockReplace = vi.fn();
let currentMockPathname = '/admin';

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => currentMockPathname,
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  };
});

// Helper to create a valid StoredAdminSession
function createValidSession(overrides: Partial<StoredAdminSession> = {}): StoredAdminSession {
  const now = Date.now();
  const defaultUser: AdminUser = {
    id: 'vt-superadmin-01',
    email: 'admin@viptadj.dz',
    displayName: 'Direction Générale VIP TADJ',
    role: 'superadmin',
    isActive: true,
  };

  return {
    isAuthenticated: true,
    token: `vt-token-test-${now}-${Math.random().toString(36).substring(2)}`,
    email: defaultUser.email,
    role: defaultUser.role,
    user: defaultUser,
    expiresAt: now + SESSION_TTL_MS,
    lastActive: now,
    ...overrides,
  };
}

describe('Challenger M4 Adversarial Security & Stress Test Suite', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
    currentMockPathname = '/admin';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SUITE 1: AdminAuthGuard Route Access & Redirect Enforcement
  // =========================================================================
  describe('1. AdminAuthGuard Route Access & Redirect Enforcement', () => {
    it('1.1 checkAdminAccess blocks unauthenticated access to /admin and all subroutes', () => {
      const protectedRoutes = [
        '/admin',
        '/admin/products',
        '/admin/products/new',
        '/admin/products/prod-123',
        '/admin/settings',
        '/admin/orders',
        '/admin/orders/ord-456',
        '/admin/media',
      ];

      for (const route of protectedRoutes) {
        const check = checkAdminAccess(route);
        expect(check.allowed).toBe(false);
        expect(check.redirectUrl).toBe('/admin/login');
      }
    });

    it('1.2 checkAdminAccess permits unauthenticated visitors to view /admin/login', () => {
      const check = checkAdminAccess('/admin/login');
      expect(check.allowed).toBe(true);
      expect(check.redirectUrl).toBeUndefined();
    });

    it('1.3 checkAdminAccess grants access to protected routes when authenticated with valid admin role', () => {
      const validSession = createValidSession();
      saveStoredSession(validSession);

      expect(checkAdminAccess('/admin').allowed).toBe(true);
      expect(checkAdminAccess('/admin/products').allowed).toBe(true);
      expect(checkAdminAccess('/admin/settings').allowed).toBe(true);
    });

    it('1.4 checkAdminAccess redirects authenticated admins away from /admin/login directly to /admin', () => {
      const validSession = createValidSession();
      saveStoredSession(validSession);

      const check = checkAdminAccess('/admin/login');
      expect(check.allowed).toBe(false);
      expect(check.redirectUrl).toBe('/admin');
    });

    it('1.5 AdminAuthGuard React component blocks unauthenticated access and calls router.replace("/admin/login")', async () => {
      currentMockPathname = '/admin';

      render(
        <AuthProvider>
          <AdminAuthGuard>
            <div data-testid="protected-content">Secret Admin Dashboard</div>
          </AdminAuthGuard>
        </AuthProvider>
      );

      // Secret content must never be visible
      expect(screen.queryByTestId('protected-content')).toBeNull();

      // Must trigger redirect to /admin/login
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/login');
      });
    });

    it('1.6 AdminAuthGuard renders protected children when valid admin session is present', async () => {
      currentMockPathname = '/admin';
      const session = createValidSession();
      saveStoredSession(session);

      render(
        <AuthProvider>
          <AdminAuthGuard>
            <div data-testid="protected-content">Secret Admin Dashboard</div>
          </AdminAuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('1.7 AdminAuthGuard on /admin/login redirects authenticated admin to /admin', async () => {
      currentMockPathname = '/admin/login';
      const session = createValidSession();
      saveStoredSession(session);

      render(
        <AuthProvider>
          <AdminAuthGuard>
            <div data-testid="login-content">Login Form</div>
          </AdminAuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin');
      });
    });

    it('1.8 AdminAuthGuard rejects non-admin users (e.g. role: customer) and redirects to /admin/login', async () => {
      currentMockPathname = '/admin';
      const customerSession = createValidSession({
        role: 'customer' as any,
        user: {
          id: 'cust-99',
          email: 'customer@viptadj.dz',
          displayName: 'Client VIP',
          role: 'customer' as any,
          isActive: true,
        },
      });
      saveStoredSession(customerSession);

      render(
        <AuthProvider>
          <AdminAuthGuard>
            <div data-testid="admin-secret">Classified Orders</div>
          </AdminAuthGuard>
        </AuthProvider>
      );

      expect(screen.queryByTestId('admin-secret')).toBeNull();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/login');
      });
    });
  });

  // =========================================================================
  // SUITE 2: Tampered or Corrupted JSON Tokens in localStorage
  // =========================================================================
  describe('2. Tampered or Corrupted JSON Tokens in localStorage', () => {
    it('2.1 malformed JSON syntax in PRIMARY_STORAGE_KEY does not throw and purges storage', () => {
      const corruptedPayloads = [
        '{not-valid-json',
        '{"token": "xyz",',
        'undefined',
        '<<<XML>>>',
        '#@%$!^&*',
      ];

      for (const payload of corruptedPayloads) {
        localStorageMock.setItem(PRIMARY_STORAGE_KEY, payload);

        expect(() => {
          const session = getStoredSession();
          expect(session).toBeNull();
        }).not.toThrow();

        // Storage must be purged clean
        expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
        expect(localStorageMock.getItem(SECONDARY_STORAGE_KEY)).toBeNull();
      }
    });

    it('2.2 non-object JSON primitives in PRIMARY_STORAGE_KEY do not crash and purge storage', () => {
      const primitivePayloads = [
        'null',
        '12345',
        'true',
        'false',
        '""',
        '[]',
        '[1, 2, 3]',
      ];

      for (const payload of primitivePayloads) {
        localStorageMock.setItem(PRIMARY_STORAGE_KEY, payload);

        expect(() => {
          const session = getStoredSession();
          expect(session).toBeNull();
        }).not.toThrow();

        expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
      }
    });

    it('2.3 missing required session fields (missing token or missing expiresAt) purges storage', () => {
      // Missing token
      localStorageMock.setItem(
        PRIMARY_STORAGE_KEY,
        JSON.stringify({ isAuthenticated: true, expiresAt: Date.now() + 100000 })
      );
      expect(getStoredSession()).toBeNull();
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();

      // Missing expiresAt
      localStorageMock.setItem(
        PRIMARY_STORAGE_KEY,
        JSON.stringify({ isAuthenticated: true, token: 'some-token' })
      );
      expect(getStoredSession()).toBeNull();
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();

      // Empty object
      localStorageMock.setItem(PRIMARY_STORAGE_KEY, JSON.stringify({}));
      expect(getStoredSession()).toBeNull();
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();

      // Non-numeric expiresAt (e.g. "never" or NaN)
      localStorageMock.setItem(
        PRIMARY_STORAGE_KEY,
        JSON.stringify({ isAuthenticated: true, token: 'some-token', expiresAt: 'never' })
      );
      const invalidSession = getStoredSession();
      expect(invalidSession).toBeNull();
    });

    it('2.4 corrupted SECONDARY_STORAGE_KEY fallback does not throw and cleans storage', () => {
      localStorageMock.removeItem(PRIMARY_STORAGE_KEY);
      localStorageMock.setItem(SECONDARY_STORAGE_KEY, '{corrupted-secondary-key');

      expect(() => {
        const session = getStoredSession();
        expect(session).toBeNull();
      }).not.toThrow();

      expect(localStorageMock.getItem(SECONDARY_STORAGE_KEY)).toBeNull();
    });

    it('2.5 dual-key inconsistency: corrupted primary key triggers fail-closed cleanup of secondary key', () => {
      const validSession = createValidSession();
      // Secondary has valid session, but primary is corrupted
      localStorageMock.setItem(PRIMARY_STORAGE_KEY, '{corrupted-primary');
      localStorageMock.setItem(SECONDARY_STORAGE_KEY, JSON.stringify(validSession));

      const session = getStoredSession();
      expect(session).toBeNull();
      // Fail-closed security must clean both keys
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
      expect(localStorageMock.getItem(SECONDARY_STORAGE_KEY)).toBeNull();
    });

    it('2.6 AuthProvider mounting with corrupted storage does not crash and renders unauthenticated', async () => {
      localStorageMock.setItem(PRIMARY_STORAGE_KEY, '{corrupted-json-crash-test');

      let authState: any = null;
      function TestConsumer() {
        authState = useAdminAuth();
        return <div>{authState.isAuthenticated ? 'Logged In' : 'Logged Out'}</div>;
      }

      expect(() => {
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        );
      }).not.toThrow();

      await waitFor(() => {
        expect(authState.isLoading).toBe(false);
      });

      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
      expect(screen.getByText('Logged Out')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // SUITE 3: Expired Session TTL Auto-Purge & Redirect
  // =========================================================================
  describe('3. Expired Session TTL Auto-Purge & Redirect', () => {
    it('3.1 session expired by 1ms (Date.now() > expiresAt) immediately returns null and purges storage', () => {
      const expiredSession = createValidSession({
        expiresAt: Date.now() - 1,
      });
      saveStoredSession(expiredSession);

      expect(getStoredSession()).toBeNull();
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
      expect(localStorageMock.getItem(SECONDARY_STORAGE_KEY)).toBeNull();
    });

    it('3.2 session expired 2 hours ago is automatically purged on access', () => {
      const expiredSession = createValidSession({
        expiresAt: Date.now() - 2 * 3600 * 1000,
        lastActive: Date.now() - 3 * 3600 * 1000,
      });
      saveStoredSession(expiredSession);

      expect(getStoredSession()).toBeNull();
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
    });

    it('3.3 AdminAuthGuard automatically purges expired session and redirects to /admin/login', async () => {
      currentMockPathname = '/admin';
      const expiredSession = createValidSession({
        expiresAt: Date.now() - 5000,
      });
      saveStoredSession(expiredSession);

      render(
        <AuthProvider>
          <AdminAuthGuard>
            <div data-testid="secret-area">Secret Area</div>
          </AdminAuthGuard>
        </AuthProvider>
      );

      expect(screen.queryByTestId('secret-area')).toBeNull();

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/admin/login');
      });

      // Confirm storage was purged
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
    });

    it('3.4 touchSession extends session expiresAt by SESSION_TTL_MS and updates lastActive', async () => {
      const initialTime = 1700000000000;
      vi.setSystemTime(initialTime);

      const session = createValidSession({
        expiresAt: initialTime + 1800000, // 30 min left
        lastActive: initialTime - 1800000,
      });
      saveStoredSession(session);

      let contextVal: any = null;
      function TestTouch() {
        contextVal = useAdminAuth();
        return <button onClick={() => contextVal.touchSession()}>Touch</button>;
      }

      render(
        <AuthProvider>
          <TestTouch />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextVal.isLoading).toBe(false);
      });

      // Advance time by 10 minutes
      const touchedTime = initialTime + 600000;
      vi.setSystemTime(touchedTime);

      act(() => {
        contextVal.touchSession();
      });

      const updated = getStoredSession();
      expect(updated).not.toBeNull();
      expect(updated?.lastActive).toBe(touchedTime);
      expect(updated?.expiresAt).toBe(touchedTime + SESSION_TTL_MS);

      vi.useRealTimers();
    });

    it('3.5 touchSession does not revive an already expired session', () => {
      const pastTime = Date.now() - 100000;
      const expired = createValidSession({
        expiresAt: pastTime,
      });
      saveStoredSession(expired);

      let contextVal: any = null;
      function TestTouch() {
        contextVal = useAdminAuth();
        return null;
      }

      render(
        <AuthProvider>
          <TestTouch />
        </AuthProvider>
      );

      act(() => {
        contextVal.touchSession();
      });

      // Must remain purged
      expect(getStoredSession()).toBeNull();
      expect(localStorageMock.getItem(PRIMARY_STORAGE_KEY)).toBeNull();
    });
  });

  // =========================================================================
  // SUITE 4: Multi-Tab Storage Synchronization
  // =========================================================================
  describe('4. Multi-Tab Storage Synchronization', () => {
    it('4.1 Tab B logs out when Tab A removes session storage key', async () => {
      // Initially authenticated
      const session = createValidSession();
      saveStoredSession(session);

      let authState: any = null;
      function TabBConsumer() {
        authState = useAdminAuth();
        return <div>{authState.isAuthenticated ? 'AuthActive' : 'AuthLoggedOut'}</div>;
      }

      render(
        <AuthProvider>
          <TabBConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(true);
      });

      // Simulate Tab A logging out (clearing storage and dispatching StorageEvent)
      act(() => {
        clearStoredSession();
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: PRIMARY_STORAGE_KEY,
            oldValue: JSON.stringify(session),
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(false);
        expect(authState.user).toBeNull();
      });

      expect(screen.getByText('AuthLoggedOut')).toBeInTheDocument();
    });

    it('4.2 Tab B synchronizes when Tab A logs out via SECONDARY_STORAGE_KEY', async () => {
      const session = createValidSession();
      saveStoredSession(session);

      let authState: any = null;
      function TabBConsumer() {
        authState = useAdminAuth();
        return <div>{authState.isAuthenticated ? 'AuthActive' : 'AuthLoggedOut'}</div>;
      }

      render(
        <AuthProvider>
          <TabBConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(true);
      });

      act(() => {
        clearStoredSession();
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: SECONDARY_STORAGE_KEY,
            oldValue: JSON.stringify(session),
            newValue: null,
          })
        );
      });

      await waitFor(() => {
        expect(authState.isAuthenticated).toBe(false);
      });
    });

    it('4.3 Tab B updates user state when Tab A switches credentials', async () => {
      const initialSession = createValidSession({
        email: 'manager@viptadj.dz',
        user: {
          id: 'adm-01',
          email: 'manager@viptadj.dz',
          displayName: 'Gestionnaire VIP',
          role: 'admin',
          isActive: true,
        },
      });
      saveStoredSession(initialSession);

      let authState: any = null;
      function TabBConsumer() {
        authState = useAdminAuth();
        return <div>User: {authState.user?.displayName || 'None'}</div>;
      }

      render(
        <AuthProvider>
          <TabBConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('User: Gestionnaire VIP')).toBeInTheDocument();
      });

      // Tab A switches to Superadmin
      const newAdminSession = createValidSession({
        email: 'superadmin@viptadj.dz',
        user: {
          id: 'adm-super',
          email: 'superadmin@viptadj.dz',
          displayName: 'Directeur Général',
          role: 'superadmin',
          isActive: true,
        },
      });
      saveStoredSession(newAdminSession);

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: PRIMARY_STORAGE_KEY,
            oldValue: JSON.stringify(initialSession),
            newValue: JSON.stringify(newAdminSession),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('User: Directeur Général')).toBeInTheDocument();
      });
    });

    it('4.4 Storage events on unrelated keys (e.g. cart or theme) do not disrupt admin auth state', async () => {
      const session = createValidSession();
      saveStoredSession(session);

      let authState: any = null;
      function TabBConsumer() {
        authState = useAdminAuth();
        return <div>Auth: {authState.isAuthenticated ? 'YES' : 'NO'}</div>;
      }

      render(
        <AuthProvider>
          <TabBConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Auth: YES')).toBeInTheDocument();
      });

      // Unrelated storage change (cart updated in another tab)
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'vip_cart_items',
            oldValue: '[]',
            newValue: '[{"id":"1"}]',
          })
        );
      });

      // Auth state must remain unaffected
      expect(authState.isAuthenticated).toBe(true);
      expect(screen.getByText('Auth: YES')).toBeInTheDocument();
    });

    it('4.5 Burst of 50 storage events does not cause unhandled crashes', async () => {
      const session = createValidSession();
      saveStoredSession(session);

      let authState: any = null;
      function TabBConsumer() {
        authState = useAdminAuth();
        return <div>Auth</div>;
      }

      render(
        <AuthProvider>
          <TabBConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.isLoading).toBe(false);
      });

      expect(() => {
        act(() => {
          for (let i = 0; i < 50; i++) {
            window.dispatchEvent(
              new StorageEvent('storage', {
                key: PRIMARY_STORAGE_KEY,
                oldValue: JSON.stringify(session),
                newValue: JSON.stringify(session),
              })
            );
          }
        });
      }).not.toThrow();

      expect(authState.isAuthenticated).toBe(true);
    });
  });

  // =========================================================================
  // SUITE 5: Zero NaN in KPI Revenue & AOV Calculations
  // =========================================================================
  describe('5. Zero NaN in KPI Revenue & AOV Calculations', () => {
    it('5.1 empty orders and products lists produce zero NaN and all zero values', () => {
      const kpis = computeAdminKPIs([], []);

      expect(kpis.totalRevenue).toBe(0);
      expect(kpis.aov).toBe(0);
      expect(Number.isNaN(kpis.totalRevenue)).toBe(false);
      expect(Number.isNaN(kpis.aov)).toBe(false);
      expect(Number.isFinite(kpis.totalRevenue)).toBe(true);
      expect(Number.isFinite(kpis.aov)).toBe(true);
      expect(kpis.pendingCount).toBe(0);
      expect(kpis.inFlightCount).toBe(0);
      expect(kpis.deliveredCount).toBe(0);
      expect(kpis.cancelledCount).toBe(0);
      expect(kpis.totalOrdersCount).toBe(0);
      expect(kpis.activeProductsCount).toBe(0);
      expect(kpis.lowStockCount).toBe(0);
      expect(kpis.outOfStockCount).toBe(0);
      expect(kpis.totalProductsCount).toBe(0);
    });

    it('5.2 orders list with zero revenue-qualifying orders produces exactly AOV 0 and Revenue 0 (zero NaN)', () => {
      const nonRevenueOrders: Order[] = [
        {
          id: 'ord-01',
          orderNumber: 'VT-001',
          customer: { name: 'Amine', phone: '0550123456', wilaya: 'Alger', wilayaCode: 16, address: 'Kouba', deliveryType: 'home' },
          items: [],
          subtotal: 10000,
          deliveryFee: 600,
          total: 10600,
          status: 'cancelled',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ord-02',
          orderNumber: 'VT-002',
          customer: { name: 'Karim', phone: '0661123456', wilaya: 'Oran', wilayaCode: 31, address: 'Es-Senia', deliveryType: 'desk' },
          items: [],
          subtotal: 5000,
          deliveryFee: 400,
          total: 5400,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const kpis = computeAdminKPIs(nonRevenueOrders, []);

      expect(kpis.totalRevenue).toBe(0);
      expect(kpis.aov).toBe(0);
      expect(Number.isNaN(kpis.totalRevenue)).toBe(false);
      expect(Number.isNaN(kpis.aov)).toBe(false);
      expect(kpis.pendingCount).toBe(1);
      expect(kpis.cancelledCount).toBe(1);
      expect(kpis.inFlightCount).toBe(0);
    });

    it('5.3 orders with total = 0 do not cause divide-by-zero or NaN AOV', () => {
      const freeOrders: Order[] = [
        {
          id: 'ord-free-1',
          orderNumber: 'VT-FREE-1',
          customer: { name: 'Test', phone: '0770123456', wilaya: 'Alger', wilayaCode: 16, address: 'Bab Ezzouar', deliveryType: 'home' },
          items: [],
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ord-free-2',
          orderNumber: 'VT-FREE-2',
          customer: { name: 'Test 2', phone: '0770123457', wilaya: 'Alger', wilayaCode: 16, address: 'Hydra', deliveryType: 'home' },
          items: [],
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          status: 'delivered',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const kpis = computeAdminKPIs(freeOrders, []);

      expect(kpis.totalRevenue).toBe(0);
      expect(kpis.aov).toBe(0);
      expect(Number.isNaN(kpis.totalRevenue)).toBe(false);
      expect(Number.isNaN(kpis.aov)).toBe(false);
    });

    it('5.4 orders with malformed totals (NaN, undefined, null, string) are handled safely without producing NaN', () => {
      const corruptOrders: any[] = [
        {
          id: 'ord-bad-1',
          total: NaN,
          status: 'confirmed',
        },
        {
          id: 'ord-bad-2',
          total: undefined,
          status: 'confirmed',
        },
        {
          id: 'ord-bad-3',
          total: null,
          status: 'delivered',
        },
        {
          id: 'ord-bad-4',
          total: 'invalid-string',
          status: 'shipped',
        },
        {
          id: 'ord-valid',
          total: 15000,
          status: 'delivered',
        },
      ];

      const kpis = computeAdminKPIs(corruptOrders, []);

      expect(kpis.totalRevenue).toBe(15000);
      // 5 revenue-qualifying orders, total 15000 -> 15000 / 5 = 3000
      expect(kpis.aov).toBe(3000);
      expect(Number.isNaN(kpis.totalRevenue)).toBe(false);
      expect(Number.isNaN(kpis.aov)).toBe(false);
    });

    it('5.5 non-array arguments and array containing null/undefined elements do not throw and return safe KPIs', () => {
      const adversarialInputs = [
        [null as any, null as any],
        [undefined as any, undefined as any],
        ['string-input' as any, 12345 as any],
        [{} as any, {} as any],
        [[null as any, undefined as any], [null as any, undefined as any]],
      ];

      for (const [orders, products] of adversarialInputs) {
        expect(() => {
          const kpis = computeAdminKPIs(orders, products);
          expect(kpis.totalRevenue).toBe(0);
          expect(kpis.aov).toBe(0);
          expect(kpis.totalOrdersCount).toBeDefined();
          expect(Number.isNaN(kpis.totalRevenue)).toBe(false);
          expect(Number.isNaN(kpis.aov)).toBe(false);
        }).not.toThrow();
      }
    });

    it('5.6 large multi-million DZD volume calculates exact integer AOV without overflow', () => {
      const highVolumeOrders: Order[] = [
        { id: '1', status: 'confirmed', total: 60000000 } as any,
        { id: '2', status: 'shipped', total: 40000000 } as any,
        { id: '3', status: 'delivered', total: 50000000 } as any,
      ];

      const kpis = computeAdminKPIs(highVolumeOrders, []);

      expect(kpis.totalRevenue).toBe(150000000);
      expect(kpis.aov).toBe(50000000);
      expect(Number.isInteger(kpis.aov)).toBe(true);
    });

    it('5.7 stock health KPI classification (active, low stock, out of stock)', () => {
      const mockProducts: Product[] = [
        { id: 'p1', inStock: true, stockQuantity: 10 } as any,  // Active
        { id: 'p2', inStock: true, stockQuantity: 3 } as any,   // Active + Low Stock
        { id: 'p3', inStock: true, stockQuantity: 1 } as any,   // Active + Low Stock
        { id: 'p4', inStock: true, stockQuantity: 0 } as any,   // Out of stock
        { id: 'p5', inStock: false, stockQuantity: 5 } as any,  // Out of stock (inStock=false)
        { id: 'p6', inStock: false, stockQuantity: 0 } as any,  // Out of stock
      ];

      const kpis = computeAdminKPIs([], mockProducts);

      expect(kpis.totalProductsCount).toBe(6);
      expect(kpis.activeProductsCount).toBe(3); // p1, p2, p3
      expect(kpis.lowStockCount).toBe(2);       // p2 (3), p3 (1)
      expect(kpis.outOfStockCount).toBe(3);      // p4, p5, p6
    });
  });

  // =========================================================================
  // SUITE 6: Additional M4 Catalog & Settings Operations Stress
  // =========================================================================
  describe('6. Catalog Stock Matrix & 58 Wilaya Settings Invariants', () => {
    it('6.1 calculateTotalStock handles negative, non-numeric, or null values cleanly', () => {
      expect(calculateTotalStock({})).toBe(0);
      expect(calculateTotalStock(null as any)).toBe(0);
      expect(calculateTotalStock(undefined as any)).toBe(0);

      const matrixWithAdversarialValues = {
        S: 5,
        M: 10,
        L: -3,       // negative clamped to 0
        XL: NaN,     // NaN clamped to 0
        XXL: '4' as any, // coerced to 4
        '48': 0,
      };

      // 5 + 10 + 0 + 0 + 4 + 0 = 19
      expect(calculateTotalStock(matrixWithAdversarialValues)).toBe(19);
    });

    it('6.2 generateSlug stress tests with accents, apostrophes, and unusual formatting', () => {
      expect(generateSlug("Costume Deux Pièces en Laine d'Hiver")).toBe(
        'costume-deux-pieces-en-laine-d-hiver'
      );
      expect(generateSlug('Mocassins en Cuir Véritable — Édition Spéciale 2026!')).toBe(
        'mocassins-en-cuir-veritable-edition-speciale-2026'
      );
      expect(generateSlug('   ---Cravate en Soie Pure---   ')).toBe(
        'cravate-en-soie-pure'
      );
      expect(generateSlug('')).toBe('');
      expect(generateSlug(null as any)).toBe('');
    });

    it('6.3 validateProductForm strictly enforces compareAtPrice > price invariant', () => {
      const baseValidProduct = {
        title: 'Costume Laine Mérinos 140s',
        slug: 'costume-laine-merinos-140s',
        description: 'Magnifique costume sur-mesure confectionné en Italie pour VIP TADJ.',
        price: 35000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'costumes',
        images: [
          {
            url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
            alt: 'Costume de face',
            isPrimary: true,
          },
        ],
        stockQuantity: 15,
        inStock: true,
      };

      // Valid: compareAtPrice > price
      const validCase = validateProductForm({
        ...baseValidProduct,
        compareAtPrice: 42000,
      });
      expect(validCase.valid).toBe(true);

      // Invalid: compareAtPrice === price
      const equalCase = validateProductForm({
        ...baseValidProduct,
        compareAtPrice: 35000,
      });
      expect(equalCase.valid).toBe(false);
      expect(equalCase.errors.compareAtPrice).toBeDefined();

      // Invalid: compareAtPrice < price
      const lowerCase = validateProductForm({
        ...baseValidProduct,
        compareAtPrice: 30000,
      });
      expect(lowerCase.valid).toBe(false);
      expect(lowerCase.errors.compareAtPrice).toBeDefined();

      // Valid: compareAtPrice omitted or null
      const noCompareCase = validateProductForm({
        ...baseValidProduct,
        compareAtPrice: null,
      });
      expect(noCompareCase.valid).toBe(true);
    });

    it('6.4 58 Wilaya Delivery Settings partial update preserves all 58 wilayas', () => {
      const initialWilayaFees: Record<number, { homeFee: number; deskFee: number; active: boolean }> = {};
      for (const w of ALGERIAN_58_WILAYAS) {
        initialWilayaFees[w.code] = {
          homeFee: w.homeDeliveryFee,
          deskFee: w.deskFee,
          active: true,
        };
      }
      expect(Object.keys(initialWilayaFees).length).toBe(58);

      // Merchant updates only Wilaya 16 (Alger)
      const updateInput = {
        wilayaShippingFees: {
          16: {
            homeFee: 350,
            deskFee: 150,
            active: true,
          },
        },
      };

      const parseResult = updateStoreSettingsSchema.safeParse(updateInput);
      expect(parseResult.success).toBe(true);

      // Emulate deep-merge from src/app/api/settings/route.ts:
      const mergedFees = {
        ...initialWilayaFees,
        ...(parseResult.data?.wilayaShippingFees || {}),
      };

      // All 58 wilayas must still be preserved
      expect(Object.keys(mergedFees).length).toBe(58);
      // Wilaya 16 is updated
      expect(mergedFees[16].homeFee).toBe(350);
      expect(mergedFees[16].deskFee).toBe(150);
      // Wilaya 31 (Oran) and Wilaya 25 (Constantine) are completely preserved
      expect(mergedFees[31].homeFee).toBe(initialWilayaFees[31].homeFee);
      expect(mergedFees[25].deskFee).toBe(initialWilayaFees[25].deskFee);
      // Wilaya 58 (El Menia) is completely preserved
      expect(mergedFees[58]).toBeDefined();
      expect(mergedFees[58].homeFee).toBe(initialWilayaFees[58].homeFee);
    });
  });
});
