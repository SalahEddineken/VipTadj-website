'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useAdminAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';

export interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated, isLoading, touchSession } = useAdminAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const isAdmin = Boolean(
    isAuthenticated &&
      user &&
      (user.role === 'admin' || user.role === 'superadmin')
  );

  const isLoginPage = pathname === '/admin/login';

  // Safety fallback timer: if verification takes more than 1.5s, unblock UI
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setHasTimedOut(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isLoading && !hasTimedOut) return;

    if (!isAuthenticated || !isAdmin) {
      if (!isLoginPage) {
        router.replace('/admin/login');
        // Secondary safety fallback: if router soft navigation does not transition, hard redirect
        const hardRedirectTimer = setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname !== '/admin/login') {
            window.location.replace('/admin/login');
          }
        }, 1200);
        return () => clearTimeout(hardRedirectTimer);
      }
    } else {
      touchSession();
      if (isLoginPage) {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, hasTimedOut, isLoginPage, router, touchSession]);

  // If user is directly on the login page and not authenticated, immediately show the login page
  if (isLoginPage && (!isAuthenticated || !isAdmin)) {
    return <>{children}</>;
  }

  // If session is still loading and hasn't timed out, display the branded luxury verification spinner
  if (isLoading && !hasTimedOut) {
    return (
      <div className="min-h-screen bg-ivory-200 flex flex-col items-center justify-center text-obsidian-900 p-6">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-gold-500/20 border-t-gold-600 animate-spin" />
          <span className="absolute text-gold-700 font-cinzel text-xl font-bold">
            {language === 'ar' ? 'تاج' : 'VT'}
          </span>
        </div>
        <p className="font-cinzel text-sm tracking-widest text-gold-700 uppercase mb-2">
          {t('admin.auth.brand_header', 'VIP TADJ ADMINISTRATION')}
        </p>
        <p className="text-obsidian-500 text-xs">{t('admin.auth.verifying', 'Vérification sécurisée des accréditations...')}</p>
        <Link
          href="/admin/login"
          className="mt-6 inline-flex items-center gap-1 text-xs text-gold-700 hover:text-gold-800 underline transition-colors"
        >
          <span>{t('admin.auth.direct_login_link', 'Accéder directement à la connexion')}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  // If unauthenticated and on a protected route, show clear redirecting indicator with instant escape link
  if ((!isAuthenticated || !isAdmin) && !isLoginPage) {
    return (
      <div className="min-h-screen bg-ivory-200 flex flex-col items-center justify-center text-obsidian-900 p-6">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-gold-500/20 border-t-gold-600 animate-spin" />
          <span className="absolute text-gold-700 font-cinzel text-xl font-bold">
            {language === 'ar' ? 'تاج' : 'VT'}
          </span>
        </div>
        <p className="font-cinzel text-sm tracking-widest text-gold-700 uppercase mb-2">
          {t('admin.auth.brand_header', 'VIP TADJ ADMINISTRATION')}
        </p>
        <p className="text-obsidian-500 text-xs mb-4">{t('admin.auth.redirecting', 'Redirection vers le portail de connexion...')}</p>
        <Link
          href="/admin/login"
          className="px-4 py-2 rounded bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          {t('admin.auth.login_btn', 'Se connecter')}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
