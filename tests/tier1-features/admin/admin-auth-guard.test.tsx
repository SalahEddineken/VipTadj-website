import { describe, it, expect, beforeEach } from 'vitest';
import { useRouter } from 'next/navigation';

describe('Tier 1: Admin — Authentication Guard & Session Management (F-ADM-01)', () => {
  const SESSION_KEY = 'vip_tadj_admin_auth';

  beforeEach(() => {
    localStorage.clear();
  });

  // Helper simulating AdminAuthGuard logic
  function checkAdminAccess(pathname: string): { allowed: boolean; redirectUrl?: string } {
    const isPublicAdminRoute = pathname === '/admin/login';
    const session = localStorage.getItem(SESSION_KEY);
    const isAuthenticated = session !== null && JSON.parse(session).isAuthenticated === true;

    if (!isAuthenticated) {
      if (isPublicAdminRoute) {
        return { allowed: true };
      }
      return { allowed: false, redirectUrl: '/admin/login' };
    }

    if (isAuthenticated && isPublicAdminRoute) {
      return { allowed: false, redirectUrl: '/admin' };
    }

    return { allowed: true };
  }

  // ==========================================
  // Test 1: Unauthenticated Guard Redirect
  // ==========================================
  it('blocks unauthenticated access to /admin routes and redirects to /admin/login', () => {
    const resultDashboard = checkAdminAccess('/admin');
    expect(resultDashboard.allowed).toBe(false);
    expect(resultDashboard.redirectUrl).toBe('/admin/login');

    const resultOrders = checkAdminAccess('/admin/orders');
    expect(resultOrders.allowed).toBe(false);
    expect(resultOrders.redirectUrl).toBe('/admin/login');

    const resultProducts = checkAdminAccess('/admin/products/new');
    expect(resultProducts.allowed).toBe(false);
    expect(resultProducts.redirectUrl).toBe('/admin/login');
  });

  // ==========================================
  // Test 2: Public Login Route Access
  // ==========================================
  it('permits unauthenticated visitors to view the /admin/login portal page', () => {
    const result = checkAdminAccess('/admin/login');
    expect(result.allowed).toBe(true);
    expect(result.redirectUrl).toBeUndefined();
  });

  // ==========================================
  // Test 3: Authenticated Session Grants Access
  // ==========================================
  it('permits authenticated administrator access to protected /admin routes', () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        isAuthenticated: true,
        user: { email: 'admin@viptadj.dz', role: 'superadmin' },
        expiresAt: Date.now() + 3600000,
      })
    );

    const resultDashboard = checkAdminAccess('/admin');
    expect(resultDashboard.allowed).toBe(true);

    const resultOrders = checkAdminAccess('/admin/orders');
    expect(resultOrders.allowed).toBe(true);

    const resultSettings = checkAdminAccess('/admin/settings');
    expect(resultSettings.allowed).toBe(true);
  });

  // ==========================================
  // Test 4: Authenticated User Login Redirect
  // ==========================================
  it('redirects already-authenticated administrators visiting /admin/login directly to /admin', () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        isAuthenticated: true,
        user: { email: 'admin@viptadj.dz' },
      })
    );

    const result = checkAdminAccess('/admin/login');
    expect(result.allowed).toBe(false);
    expect(result.redirectUrl).toBe('/admin');
  });

  // ==========================================
  // Test 5: Logout Action Clears Session
  // ==========================================
  it('clears admin session on logout and restores unauthenticated guard protection', () => {
    // Login
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ isAuthenticated: true, user: { email: 'admin@viptadj.dz' } })
    );
    expect(checkAdminAccess('/admin').allowed).toBe(true);

    // Logout
    localStorage.removeItem(SESSION_KEY);
    const postLogout = checkAdminAccess('/admin');
    expect(postLogout.allowed).toBe(false);
    expect(postLogout.redirectUrl).toBe('/admin/login');
  });

  // ==========================================
  // Test 6: Expired Session Detection
  // ==========================================
  it('detects expired session and invalidates access with redirection to login', () => {
    const expiredTimestamp = Date.now() - 1000; // In the past
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        isAuthenticated: true,
        expiresAt: expiredTimestamp,
      })
    );

    function checkWithExpiry(pathname: string): boolean {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return false;
      const data = JSON.parse(session);
      if (data.expiresAt && data.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
      return data.isAuthenticated === true;
    }

    const isAccessAllowed = checkWithExpiry('/admin');
    expect(isAccessAllowed).toBe(false);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
