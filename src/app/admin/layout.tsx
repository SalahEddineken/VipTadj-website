'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from '@/lib/context/auth-context';
import { AdminAuthGuard } from '@/components/admin/AdminAuthGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  AdminNotificationProvider,
  useAdminNotification,
} from '@/lib/context/admin-notification-context';
import { Menu, X, Volume2, VolumeX, ShoppingBag, Crown } from 'lucide-react';

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pendingCount, isMuted, toggleMuted } = useAdminNotification();

  // If visiting /admin/login, bypass the administrative sidebar shell
  if (pathname === '/admin/login') {
    return <AdminAuthGuard>{children}</AdminAuthGuard>;
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-obsidian-900 text-ivory flex flex-col lg:flex-row">
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-obsidian-950 border-b border-gold-500/15 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gold-400" />
            <span className="font-cinzel font-bold text-gold-400">VIP TADJ</span>
            <span className="text-xs px-2 py-0.5 rounded bg-gold-500/15 text-gold-400 font-medium uppercase tracking-wider">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute Toggle */}
            <button
              onClick={() => toggleMuted()}
              className="p-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-gold-400 hover:bg-obsidian-800 transition-colors"
              title={isMuted ? 'Activer le carillon sonore' : 'Désactiver le carillon sonore'}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-obsidian-400" /> : <Volume2 className="w-4 h-4 text-gold-400" />}
            </button>

            {/* Pending Orders Alert Chip */}
            {pendingCount > 0 && (
              <Link
                href="/admin/orders?status=pending"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 text-xs font-semibold animate-pulse"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{pendingCount}</span>
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-gold-400 hover:bg-obsidian-800 transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
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
          <div className="hidden lg:flex items-center justify-end gap-3 px-8 py-3 bg-obsidian-950/40 border-b border-gold-500/10">
            {pendingCount > 0 && (
              <Link
                href="/admin/orders?status=pending"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-medium hover:bg-gold-500/20 transition-all"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
                </span>
                <span>
                  {pendingCount} commande{pendingCount > 1 ? 's' : ''} en attente de confirmation
                </span>
              </Link>
            )}

            {/* Audio Mute/Unmute Toggle */}
            <button
              onClick={() => toggleMuted()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-obsidian-900 border border-gold-500/20 text-xs text-obsidian-300 hover:text-gold-400 hover:border-gold-500/40 transition-colors"
              title={isMuted ? 'Notifications sonores coupées' : 'Notifications sonores actives'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-obsidian-400" />
                  <span>Son coupé</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-gold-400" />
                  <span className="text-gold-400/90">Carillon actif</span>
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
