'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAdminAuth } from '@/lib/context/auth-context';

export interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, isAuthenticated, isLoading, touchSession } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = Boolean(
    isAuthenticated &&
      user &&
      (user.role === 'admin' || user.role === 'superadmin')
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !isAdmin) {
      if (pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
    } else {
      touchSession();
      if (pathname === '/admin/login') {
        router.replace('/admin');
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, pathname, router, touchSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center text-ivory p-6">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full border-2 border-gold-500/20 border-t-gold-500 animate-spin" />
          <span className="absolute text-gold-500 font-cinzel text-xl font-bold">VT</span>
        </div>
        <p className="font-cinzel text-sm tracking-widest text-gold-400 uppercase mb-2">
          VIP TADJ ADMINISTRATION
        </p>
        <p className="text-obsidian-400 text-xs">Vérification sécurisée des accréditations...</p>
      </div>
    );
  }

  if ((!isAuthenticated || !isAdmin) && pathname !== '/admin/login') {
    return null;
  }

  return <>{children}</>;
}
