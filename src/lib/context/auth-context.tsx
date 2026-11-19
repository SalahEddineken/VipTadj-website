'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AdminUser, AdminRole } from '@/types';
import { isFirebaseConfigured } from '@/lib/firebase/config';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { signInWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/locales';

export const PRIMARY_STORAGE_KEY = 'vip_tadj_admin_auth';
export const SECONDARY_STORAGE_KEY = 'vip_admin_session';
export const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface StoredAdminSession {
  isAuthenticated: boolean;
  token: string;
  email: string;
  role: AdminRole;
  user: AdminUser;
  expiresAt: number;
  lastActive: number;
}

export interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMode: 'firebase' | 'mock';
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; errorKey?: string }>;
  logout: () => Promise<void>;
  touchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Standalone Session Helpers (usable inside and outside React components)
export function getStoredSession(): StoredAdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(SECONDARY_STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (
      !session ||
      typeof session !== 'object' ||
      !session.token ||
      typeof session.token !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      !Number.isFinite(session.expiresAt) ||
      session.expiresAt <= 0
    ) {
      clearStoredSession();
      return null;
    }
    if (Date.now() > session.expiresAt) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function saveStoredSession(session: StoredAdminSession): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(session);
    localStorage.setItem(PRIMARY_STORAGE_KEY, serialized);
    localStorage.setItem(SECONDARY_STORAGE_KEY, serialized);
  } catch {
    // Graceful fallback if storage quota exceeded or disabled
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PRIMARY_STORAGE_KEY);
    localStorage.removeItem(SECONDARY_STORAGE_KEY);
  } catch {
    // Ignore storage deletion errors
  }
}

export function checkAdminAccess(pathname: string): { allowed: boolean; redirectUrl?: string } {
  const isPublicAdminRoute = pathname === '/admin/login';
  const session = getStoredSession();
  const isAuth =
    session !== null &&
    session.isAuthenticated === true &&
    (session.role === 'admin' || session.role === 'superadmin' || session.user?.role === 'admin' || session.user?.role === 'superadmin');

  if (!isAuth) {
    if (isPublicAdminRoute) return { allowed: true };
    return { allowed: false, redirectUrl: '/admin/login' };
  }

  if (isAuth && isPublicAdminRoute) {
    return { allowed: false, redirectUrl: '/admin' };
  }

  return { allowed: true };
}

// Default Mock Admin Credentials
export const MOCK_ADMIN_CREDENTIALS = {
  email: 'admin@viptadj.dz',
  password: 'admin123',
  user: {
    id: 'vt-adm-super-01',
    email: 'admin@viptadj.dz',
    displayName: 'Direction Générale VIP TADJ',
    displayNameAr: 'الإدارة العامة VIP TADJ',
    displayNameEn: 'VIP TADJ General Management',
    role: 'superadmin' as AdminRole,
    isActive: true,
  },
};

export function getLocalizedAdminDisplayName(
  user: AdminUser | null | undefined,
  language: SupportedLanguage = 'fr'
): string {
  if (!user) {
    return getTranslation(language, 'admin.sidebar.default_admin_name', 'Administrateur');
  }
  if (language === 'ar') {
    if (user.displayNameAr) return user.displayNameAr;
    if (
      user.displayName === MOCK_ADMIN_CREDENTIALS.user.displayName ||
      user.displayName === 'Directeur Général VIP TADJ'
    ) {
      return MOCK_ADMIN_CREDENTIALS.user.displayNameAr;
    }
    if (!user.displayName || user.displayName === 'Administrateur') {
      return getTranslation('ar', 'admin.sidebar.default_admin_name', 'المدير');
    }
    return user.displayName;
  }
  if (language === 'en') {
    if (user.displayNameEn) return user.displayNameEn;
    if (
      user.displayName === MOCK_ADMIN_CREDENTIALS.user.displayName ||
      user.displayName === 'Directeur Général VIP TADJ'
    ) {
      return MOCK_ADMIN_CREDENTIALS.user.displayNameEn;
    }
    if (!user.displayName || user.displayName === 'Administrateur') {
      return getTranslation('en', 'admin.sidebar.default_admin_name', 'Administrator');
    }
    return user.displayName;
  }
  return user.displayName || getTranslation('fr', 'admin.sidebar.default_admin_name', 'Administrateur');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authMode = useMemo<'firebase' | 'mock'>(() => (isFirebaseConfigured() ? 'firebase' : 'mock'), []);
  const router = useRouter();

  const syncStateFromStorage = useCallback(() => {
    try {
      const session = getStoredSession();
      const isAdmin =
        session !== null &&
        session.isAuthenticated === true &&
        (session.role === 'admin' ||
          session.role === 'superadmin' ||
          session.user?.role === 'admin' ||
          session.user?.role === 'superadmin');

      if (isAdmin && session.user) {
        const adminUser: AdminUser = {
          ...session.user,
          role: (session.user.role || session.role || 'admin') as AdminRole,
        };
        setUser(adminUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncStateFromStorage();

    // Multi-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PRIMARY_STORAGE_KEY || e.key === SECONDARY_STORAGE_KEY) {
        syncStateFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [syncStateFromStorage]);

  const touchSession = useCallback(() => {
    const session = getStoredSession();
    const isAdmin =
      session !== null &&
      session.isAuthenticated === true &&
      (session.role === 'admin' ||
        session.role === 'superadmin' ||
        session.user?.role === 'admin' ||
        session.user?.role === 'superadmin');

    if (isAdmin && session) {
      const now = Date.now();
      session.lastActive = now;
      session.expiresAt = now + SESSION_TTL_MS;
      saveStoredSession(session);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; errorKey?: string }> => {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();

      // Check mock credentials first or if in mock mode
      if (cleanEmail === MOCK_ADMIN_CREDENTIALS.email && password === MOCK_ADMIN_CREDENTIALS.password) {
        const now = Date.now();
        const session: StoredAdminSession = {
          isAuthenticated: true,
          token: `vt-mock-token-${now}-${Math.random().toString(36).substring(2)}`,
          email: MOCK_ADMIN_CREDENTIALS.user.email,
          role: MOCK_ADMIN_CREDENTIALS.user.role,
          user: MOCK_ADMIN_CREDENTIALS.user,
          expiresAt: now + SESSION_TTL_MS,
          lastActive: now,
        };
        saveStoredSession(session);
        setUser(session.user);
        setIsLoading(false);
        return { success: true };
      }

      // If Firebase Auth is configured, attempt Firebase sign in
      if (isFirebaseConfigured()) {
        const auth = getFirebaseAuth();
        if (auth) {
          try {
            const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
            const now = Date.now();
            const adminUser: AdminUser = {
              id: userCred.user.uid,
              email: userCred.user.email || cleanEmail,
              displayName: userCred.user.displayName || 'Administrateur',
              role: 'admin',
              isActive: true,
            };
            const session: StoredAdminSession = {
              isAuthenticated: true,
              token: await userCred.user.getIdToken(),
              email: adminUser.email,
              role: adminUser.role,
              user: adminUser,
              expiresAt: now + SESSION_TTL_MS,
              lastActive: now,
            };
            saveStoredSession(session);
            setUser(adminUser);
            setIsLoading(false);
            return { success: true };
          } catch {
            setIsLoading(false);
            return {
              success: false,
              error: 'Identifiants Firebase invalides.',
              errorKey: 'auth.error.invalid_firebase',
            };
          }
        }
      }

      setIsLoading(false);
      return {
        success: false,
        error: 'Identifiants invalides. Utilisez les identifiants de démonstration.',
        errorKey: 'auth.error.invalid_credentials',
      };
    },
    []
  );

  const logout = useCallback(async () => {
    clearStoredSession();
    setUser(null);
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          await fbSignOut(auth);
        } catch {
          // ignore
        }
      }
    }
    router.replace('/admin/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      authMode,
      login,
      logout,
      touchSession,
    }),
    [user, isLoading, authMode, login, logout, touchSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
}
