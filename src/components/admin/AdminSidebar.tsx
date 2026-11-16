'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Shirt,
  Settings,
  ExternalLink,
  LogOut,
  Crown,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

export interface AdminSidebarProps {
  pendingOrdersCount?: number;
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ pendingOrdersCount = 0, className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const { t } = useLanguage();

  const navItems: NavItem[] = [
    { label: t('admin.nav.dashboard', 'Vue d’ensemble'), href: '/admin', icon: LayoutDashboard },
    {
      label: t('admin.nav.orders', 'Commandes'),
      href: '/admin/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
    },
    { label: t('admin.nav.products', 'Catalogue Produits'), href: '/admin/products', icon: Shirt },
    { label: t('admin.nav.settings', 'Paramètres & Tarifs'), href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'w-72 bg-obsidian-950 border-e border-gold-500/15 flex flex-col h-screen sticky top-0 text-ivory select-none z-30',
        className
      )}
    >
      {/* Brand Header */}
      <div className="p-6 border-b border-gold-500/15 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm">
          <div className="w-10 h-10 rounded-sm bg-obsidian-900 border border-gold-500/40 flex items-center justify-center text-gold-500 shadow-luxury-subtle group-hover:border-gold-500 transition-colors">
            <Crown className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="font-cinzel text-lg tracking-wider font-bold text-gold-400 group-hover:text-gold-300 transition-colors">
              VIP TADJ
            </div>
            <div className="text-xs tracking-wider text-obsidian-200 uppercase font-sans">
              {t('nav.admin_portal', 'Administration')}
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold tracking-wider text-obsidian-200 uppercase">
          {t('admin.nav.menu', 'Navigation Principale')}
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-sm text-sm font-medium transition-all group relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                isActive
                  ? 'bg-obsidian-900 text-gold-400 border border-gold-500/30 shadow-luxury-subtle font-semibold'
                  : 'text-obsidian-300 hover:text-ivory hover:bg-obsidian-900/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    isActive ? 'text-gold-400' : 'text-obsidian-300 group-hover:text-gold-400'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/40 shadow-[0_0_12px_rgba(212,175,55,0.25)] animate-pulse motion-reduce:animate-none">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-500" />
                  </span>
                  <span className="font-sans tabular-nums">{item.badge}</span>
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-6 px-3 py-2 text-xs font-semibold tracking-wider text-obsidian-200 uppercase">
          {t('admin.nav.storefront_section', 'Boutique Client')}
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-sm text-sm text-obsidian-300 hover:text-gold-400 hover:bg-obsidian-900/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <div className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-obsidian-300" />
            <span>{t('admin.nav.storefront', 'Voir le Storefront')}</span>
          </div>
          <span className="text-xs text-obsidian-300 uppercase tracking-wider">
            {t('admin.nav.storefront_badge', 'Boutique')}
          </span>
        </Link>
      </nav>

      {/* Language Selector + User Profile & Logout Footer */}
      <div className="p-4 border-t border-gold-500/15 bg-obsidian-950/80 space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-obsidian-200 font-medium">
            {t('lang.selector.label', 'Langue')} :
          </span>
          <LanguageSelector variant="admin" />
        </div>

        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 text-xs font-bold font-cinzel">
            {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ivory truncate">{user?.displayName || 'Administrateur'}</p>
            <p className="text-xs text-obsidian-200 truncate">{user?.email}</p>
          </div>
          <span className="px-2 py-0.5 rounded-sm text-xs font-semibold bg-gold-500/10 text-gold-400 border border-gold-500/30 uppercase tracking-wide">
            {user?.role || 'Admin'}
          </span>
        </div>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 min-h-[44px] rounded-sm text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{t('admin.nav.logout', 'Déconnexion')}</span>
        </button>
      </div>
    </aside>
  );
}
