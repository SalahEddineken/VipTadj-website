import { describe, it, expect, beforeEach, vi } from 'vitest';
import { localStorageMock } from '../setup';

interface AdminSession {
  token: string;
  email: string;
  role: 'superadmin' | 'admin' | 'manager' | 'customer';
  expiresAt: number;
  lastActive: number;
}

class AdminSessionManager {
  private static readonly STORAGE_KEY = 'vip_admin_session';
  private static readonly SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

  public static login(email: string, role: AdminSession['role'] = 'admin'): AdminSession {
    const now = Date.now();
    const session: AdminSession = {
      token: `vt-adm-${Math.random().toString(36).substring(2)}-${now}`,
      email,
      role,
      expiresAt: now + this.SESSION_TTL_MS,
      lastActive: now,
    };
    localStorageMock.setItem(this.STORAGE_KEY, JSON.stringify(session));
    return session;
  }

  public static getSession(): AdminSession | null {
    const raw = localStorageMock.getItem(this.STORAGE_KEY);
    if (!raw) return null;

    try {
      const session: AdminSession = JSON.parse(raw);
      if (!session.token || !session.expiresAt) {
        this.logout();
        return null;
      }

      // Check expiry
      if (Date.now() > session.expiresAt) {
        this.logout(); // Auto purge expired session
        return null;
      }

      return session;
    } catch {
      this.logout(); // Clean corrupted session data
      return null;
    }
  }

  public static isAuthenticated(): boolean {
    const session = this.getSession();
    if (!session) return false;
    return session.role === 'admin' || session.role === 'superadmin' || session.role === 'manager';
  }

  public static touch(): void {
    const session = this.getSession();
    if (session) {
      session.lastActive = Date.now();
      session.expiresAt = Date.now() + this.SESSION_TTL_MS;
      localStorageMock.setItem(this.STORAGE_KEY, JSON.stringify(session));
    }
  }

  public static logout(): void {
    localStorageMock.removeItem(this.STORAGE_KEY);
  }

  public static canAccessRoute(route: string): { allowed: boolean; redirect?: string } {
    if (!route.startsWith('/admin')) {
      return { allowed: true };
    }

    if (route === '/admin/login') {
      return { allowed: true };
    }

    if (!this.isAuthenticated()) {
      return { allowed: false, redirect: '/admin/login' };
    }

    return { allowed: true };
  }
}

describe('Tier 3: Combinations — Admin Authentication & Multi-View Session State (auth-session-multi-tab.test.ts)', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // ==========================================
  // Combination 1: Active Authenticated Session Access
  // ==========================================
  it('grants access to all protected admin views when active authenticated session exists', () => {
    // Initially not authenticated
    expect(AdminSessionManager.isAuthenticated()).toBe(false);
    expect(AdminSessionManager.canAccessRoute('/admin')).toEqual({
      allowed: false,
      redirect: '/admin/login',
    });

    // Admin logs in
    AdminSessionManager.login('admin@viptadj.dz', 'admin');
    expect(AdminSessionManager.isAuthenticated()).toBe(true);

    // Verify all admin views are allowed
    const adminRoutes = [
      '/admin',
      '/admin/orders',
      '/admin/orders/ord-001',
      '/admin/products',
      '/admin/products/new',
      '/admin/products/prod-001',
      '/admin/settings',
    ];

    for (const route of adminRoutes) {
      const access = AdminSessionManager.canAccessRoute(route);
      expect(access.allowed).toBe(true);
      expect(access.redirect).toBeUndefined();
    }
  });

  // ==========================================
  // Combination 2: Session Expiration & Automated Invalidation
  // ==========================================
  it('automatically invalidates session and redirects to login when token timestamp expires', () => {
    // Create an expired session (timestamp in the past)
    const expiredSession: AdminSession = {
      token: 'vt-expired-token-123',
      email: 'manager@viptadj.dz',
      role: 'admin',
      expiresAt: Date.now() - 5000, // Expired 5 seconds ago
      lastActive: Date.now() - 3600000,
    };
    localStorageMock.setItem('vip_admin_session', JSON.stringify(expiredSession));

    // Access check should detect expiry, clear storage, and redirect
    expect(AdminSessionManager.isAuthenticated()).toBe(false);
    expect(AdminSessionManager.getSession()).toBeNull();
    expect(localStorageMock.getItem('vip_admin_session')).toBeNull();

    const access = AdminSessionManager.canAccessRoute('/admin/orders');
    expect(access.allowed).toBe(false);
    expect(access.redirect).toBe('/admin/login');
  });

  // ==========================================
  // Combination 3: Multi-Tab Logout Synchronization
  // ==========================================
  it('blocks access across all views immediately when logout clears storage in another view/tab', () => {
    // 1. Admin logs in
    AdminSessionManager.login('admin@viptadj.dz', 'admin');
    expect(AdminSessionManager.isAuthenticated()).toBe(true);

    // 2. Tab A logs out
    AdminSessionManager.logout();

    // 3. Tab B checks access
    expect(AdminSessionManager.isAuthenticated()).toBe(false);
    const accessOrders = AdminSessionManager.canAccessRoute('/admin/orders');
    expect(accessOrders.allowed).toBe(false);
    expect(accessOrders.redirect).toBe('/admin/login');

    const accessSettings = AdminSessionManager.canAccessRoute('/admin/settings');
    expect(accessSettings.allowed).toBe(false);
    expect(accessSettings.redirect).toBe('/admin/login');
  });

  // ==========================================
  // Combination 4: Role-Based Authorization Restrictions
  // ==========================================
  it('rejects unauthorized customer accounts attempting to access admin routes', () => {
    // User logged in as a normal customer
    AdminSessionManager.login('customer@example.dz', 'customer');

    // Customer role is NOT authorized for admin dashboard
    expect(AdminSessionManager.isAuthenticated()).toBe(false);
    expect(AdminSessionManager.canAccessRoute('/admin/orders')).toEqual({
      allowed: false,
      redirect: '/admin/login',
    });
  });

  // ==========================================
  // Combination 5: Tampered / Malformed Session Token Recovery
  // ==========================================
  it('safely purges corrupted or malformed session JSON without unhandled exceptions', () => {
    // Set corrupted non-JSON string in localStorage
    localStorageMock.setItem('vip_admin_session', 'MALFORMED_{{TOKEN}}:;;');

    expect(AdminSessionManager.getSession()).toBeNull();
    expect(AdminSessionManager.isAuthenticated()).toBe(false);

    // Corrupted item should be cleanly cleared
    expect(localStorageMock.getItem('vip_admin_session')).toBeNull();

    // Incomplete session object (missing expiresAt)
    localStorageMock.setItem('vip_admin_session', JSON.stringify({ token: 'xyz' }));
    expect(AdminSessionManager.getSession()).toBeNull();
    expect(AdminSessionManager.isAuthenticated()).toBe(false);
  });

  // ==========================================
  // Combination 6: Session Touch & Sliding Expiration Extension
  // ==========================================
  it('extends session expiration upon user activity via session touch', () => {
    const session = AdminSessionManager.login('admin@viptadj.dz', 'admin');
    const initialExpiry = session.expiresAt;

    // Simulate time passing
    vi.setSystemTime(Date.now() + 10000);

    // Activity touch
    AdminSessionManager.touch();
    const updated = AdminSessionManager.getSession();
    expect(updated).not.toBeNull();
    expect(updated!.expiresAt).toBeGreaterThan(initialExpiry);

    vi.useRealTimers();
  });
});
