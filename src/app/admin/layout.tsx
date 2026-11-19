'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from '@/lib/context/auth-context';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  AdminNotificationProvider,
  useAdminNotification,
} from '@/lib/context/admin-notification-context';
import { useLanguage } from '@/lib/context/language-context';
import { Menu, X, Volume2, VolumeX, ShoppingBag, Crown } from 'lucide-react';

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pendingCount, isMuted, toggleMuted } = useAdminNotification();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // If visiting /admin/login, bypass the administrative sidebar shell
  if (pathname === '/admin/login') {
    return <AdminAuthGuard>{children}</AdminAuthGuard>;
  }

  const pendingOrdersAriaLabel = (pendingCount === 1
    ? t('admin.layout.pending_orders_single', '{count} commande en attente de confirmation')
    : t('admin.layout.pending_orders_plural', '{count} commandes en attente de confirmation')
  ).replace('{count}', String(pendingCount));

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-ivory-200 text-obsidian-900 flex flex-col lg:flex-row">
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-white border-b border-obsidian-200 p-4 flex items-center justify-between sticky top-0 z-40 shadow-luxury-subtle">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold-600" />
            <span className="font-cinzel font-bold text-obsidian-950">VIP TADJ</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gold-50 border border-gold-500/30 text-gold-700 font-medium uppercase tracking-wider">
              {t('admin.layout.admin_badge', 'Admin')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute Toggle */}
            <button
              onClick={() => toggleMuted()}
              className="p-2 rounded-lg bg-ivory-100 border border-obsidian-200 text-gold-700 hover:bg-ivory-200 transition-colors"
              title={isMuted ? t('admin.chime.enable_title', 'Activer le carillon sonore') : t('admin.chime.disable_title', 'Désactiver le carillon sonore')}
              aria-label={isMuted ? t('admin.layout.unmute_aria', 'Activer le son') : t('admin.layout.mute_aria', 'Couper le son')}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-obsidian-400" /> : <Volume2 className="w-4 h-4 text-gold-600" />}
            </button>

            {/* Pending Orders Alert Chip */}
            {pendingCount > 0 && (
              <Link
                href="/admin/orders?status=pending"
                aria-label={pendingOrdersAriaLabel}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-50 border border-gold-500/40 text-gold-700 text-xs font-semibold animate-pulse"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{pendingCount}</span>
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-ivory-100 border border-obsidian-200 text-obsidian-800 hover:bg-ivory-200 transition-colors"
              aria-label={t('common.menu', 'Menu')}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 flex"
            role="dialog"
            aria-modal="true"
            aria-label={t('admin.nav.menu', 'Navigation Principale')}
          >
            <div
              className="fixed inset-0 bg-obsidian-950/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="relative w-72 max-w-[85vw] h-full z-10">
              <AdminSidebar
                pendingOrdersCount={pendingCount}
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Desktop Sticky Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar pendingOrdersCount={pendingCount} />
        </div>

        {/* Main Administrative Workspace with Quick Action Bar */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Desktop Subtle Top Status Bar */}
          <div className="hidden lg:flex items-center justify-end gap-3 px-8 py-3 bg-white/90 backdrop-blur-sm border-b border-obsidian-200">
            {pendingCount > 0 && (
              <Link
                href="/admin/orders?status=pending"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-500/40 text-gold-800 text-xs font-medium hover:bg-gold-100 transition-all"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-600" />
                </span>
                <span>
                  {(pendingCount === 1
                    ? t('admin.layout.pending_orders_single', '{count} commande en attente de confirmation')
                    : t('admin.layout.pending_orders_plural', '{count} commandes en attente de confirmation')
                  ).replace('{count}', String(pendingCount))}
                </span>
              </Link>
            )}

            {/* Audio Mute/Unmute Toggle */}
            <button
              onClick={() => toggleMuted()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ivory-100 border border-obsidian-200 text-xs text-obsidian-600 hover:text-gold-700 hover:border-gold-500/50 transition-colors"
              title={isMuted ? t('admin.layout.chime_muted_title', 'Notifications sonores coupées') : t('admin.layout.chime_active_title', 'Notifications sonores actives')}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-obsidian-400" />
                  <span>{t('admin.chime.muted', 'Son coupé')}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-gold-600" />
                  <span className="text-gold-700 font-medium">{t('admin.chime.active', 'Carillon actif')}</span>
                </>
              )}
            </button>
          </div>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminNotificationProvider>
        <AdminShellContent>{children}</AdminShellContent>
      </AdminNotificationProvider>
    </AuthProvider>
  );
}
