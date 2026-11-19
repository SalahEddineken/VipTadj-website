import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
import * as navigation from 'next/navigation';
import { LanguageProvider } from '@/lib/context/language-context';
import { CartProvider, CartItem } from '@/lib/context/cart-context';
import { AuthProvider, PRIMARY_STORAGE_KEY, StoredAdminSession } from '@/lib/context/auth-context';
import { AdminNotificationProvider } from '@/lib/context/admin-notification-context';
import { SupportedLanguage } from '@/lib/i18n/types';

// Global DOM polyfills for JSDOM in-process runner
if (typeof window !== 'undefined') {
  if (!window.scrollTo) {
    window.scrollTo = vi.fn();
  }
}

export interface SetupNavigationOptions {
  pathname?: string;
  searchParams?: Record<string, string> | string | URLSearchParams;
  params?: Record<string, string | string[]>;
}

export interface NavigationMocks {
  router: {
    push: ReturnType<typeof vi.fn>;
    replace: ReturnType<typeof vi.fn>;
    back: ReturnType<typeof vi.fn>;
    forward: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    prefetch: ReturnType<typeof vi.fn>;
  };
  searchParams: URLSearchParams;
  pathname: string;
}

/**
 * Dynamically configures Next.js 14 App Router navigation mocks for a test scenario.
 */
export function setupTestNavigation(options: SetupNavigationOptions = {}): NavigationMocks {
  const pushMock = vi.fn();
  const replaceMock = vi.fn();
  const backMock = vi.fn();
  const forwardMock = vi.fn();
  const refreshMock = vi.fn();
  const prefetchMock = vi.fn();

  const router = {
    push: pushMock,
    replace: replaceMock,
    back: backMock,
    forward: forwardMock,
    refresh: refreshMock,
    prefetch: prefetchMock,
  };

  const pathname = options.pathname || '/';

  let searchParams: URLSearchParams;
  if (options.searchParams instanceof URLSearchParams) {
    searchParams = options.searchParams;
  } else if (typeof options.searchParams === 'string') {
    searchParams = new URLSearchParams(options.searchParams);
  } else if (options.searchParams && typeof options.searchParams === 'object') {
    searchParams = new URLSearchParams(options.searchParams as Record<string, string>);
  } else {
    searchParams = new URLSearchParams();
  }

  vi.spyOn(navigation, 'useRouter').mockReturnValue(router as any);
  vi.spyOn(navigation, 'usePathname').mockReturnValue(pathname);
  vi.spyOn(navigation, 'useSearchParams').mockReturnValue(searchParams as any);
  vi.spyOn(navigation, 'useParams').mockReturnValue(options.params || {});

  return { router, searchParams, pathname };
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  language?: SupportedLanguage;
  navigation?: SetupNavigationOptions;
  includeAdmin?: boolean;
  initialCartItems?: CartItem[];
  initialAdminSession?: Partial<StoredAdminSession>;
}

export interface RenderWithProvidersResult extends RenderResult {
  nav: NavigationMocks;
}

/**
 * Standard test wrapper providing clean execution context:
 * - Synchronizes localStorage and document direction (dir="rtl" / "ltr", lang="ar" / "fr" / "en")
 * - Injects Next.js App Router navigation hooks
 * - Wraps UI with LanguageProvider, CartProvider, and optional AuthProvider & AdminNotificationProvider
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    language = 'ar',
    navigation: navOptions,
    includeAdmin = false,
    initialCartItems,
    initialAdminSession,
    ...renderOptions
  }: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  // 1. Configure DOM and localStorage for locale
  localStorage.setItem('vip_tadj_lang', language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  if (language === 'ar') {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.remove('rtl');
    document.documentElement.classList.add('ltr');
  }

  // 2. Pre-seed cart items in localStorage if provided
  if (initialCartItems) {
    localStorage.setItem('vip_cart', JSON.stringify(initialCartItems));
  }

  // 3. Pre-seed Admin session in localStorage if requested or admin session provided
  if (includeAdmin || initialAdminSession) {
    const defaultAdminSession: StoredAdminSession = {
      isAuthenticated: initialAdminSession?.isAuthenticated ?? true,
      token: 'mock-admin-token-xyz',
      email: 'direction@viptadj.dz',
      role: 'superadmin',
      user: {
        id: 'usr-admin-01',
        email: 'direction@viptadj.dz',
        displayName: 'Direction Générale VIP TADJ',
        displayNameAr: 'الإدارة العامة VIP TADJ',
        displayNameEn: 'VIP TADJ General Management',
        role: 'superadmin',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      expiresAt: Date.now() + 3600000,
      lastActive: Date.now(),
      ...initialAdminSession,
    };
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(defaultAdminSession));
  }

  // 4. Setup navigation spies
  const nav = setupTestNavigation(navOptions);

  // 5. Build provider wrapper hierarchy
  function ProviderWrapper({ children }: { children: React.ReactNode }) {
    let content = (
      <LanguageProvider initialLanguage={language}>
        <CartProvider>{children}</CartProvider>
      </LanguageProvider>
    );

    if (includeAdmin) {
      content = (
        <AuthProvider>
          <AdminNotificationProvider>{content}</AdminNotificationProvider>
        </AuthProvider>
      );
    }

    return content;
  }

  const renderResult = render(ui, { wrapper: ProviderWrapper, ...renderOptions });

  return {
    ...renderResult,
    nav,
  };
}
