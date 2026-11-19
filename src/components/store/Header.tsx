'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, ShoppingBag, Shield } from 'lucide-react';
import { MobileNavDrawer } from './MobileNavDrawer';
import { useCart } from '@/lib/context/cart-context';
import { getStoredSession } from '@/lib/context/auth-context';
import { useLanguage } from '@/lib/context/language-context';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export interface HeaderProps {
  cartCount?: number;
  onOpenCart?: () => void;
}

export function Header({ cartCount = 0, onOpenCart }: HeaderProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const cart = useCart();
  const { t } = useLanguage();
  const [liveCount, setLiveCount] = useState(cartCount);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const session = getStoredSession();
    setIsAdmin(!!(session && session.isAuthenticated));
  }, []);

  const syncCartCount = useCallback(() => {
    try {
      const stored =
        typeof window !== 'undefined'
          ? localStorage.getItem('vip_cart') || localStorage.getItem('vip_tadj_cart')
          : null;
      if (stored) {
        const items = JSON.parse(stored);
        if (Array.isArray(items)) {
          const total = items.reduce(
            (sum: number, it: { quantity?: number }) => sum + (it.quantity || 1),
            0
          );
          setLiveCount(total);
          return;
        }
      }
      setLiveCount(cartCount);
    } catch {
      setLiveCount(cartCount);
    }
  }, [cartCount]);

  useEffect(() => {
    if (cart.isHydrated) {
      setLiveCount(cart.itemCount);
    }
  }, [cart.isHydrated, cart.itemCount]);

  useEffect(() => {
    syncCartCount();

    const handleCartUpdate = () => {
      syncCartCount();
    };

    window.addEventListener('vip-cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('vip-cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, [syncCartCount]);

  return (
    <>
      <header dir="ltr" className="sticky top-0 z-40 bg-ivory/95 backdrop-blur-md border-b border-sand-200 [direction:ltr]">
        <div className="luxury-container py-4 md:py-5 flex items-center justify-between">
          {/* Mobile hamburger & search button */}
          <div className="flex items-center gap-1.5 sm:gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-obsidian-900 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label={t('common.menu', 'Menu')}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link
              href="/catalog"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-obsidian-800 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label={t('nav.search', 'Recherche')}
            >
              <Search className="w-5 h-5" />
            </Link>
          </div>

          {/* Brand Logo */}
          <Link href="/" className="group flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500">
            <Image
              src="/images/logo.png"
              alt={t('header.logo_alt', 'Logo VIP TADJ')}
              width={1024}
              height={384}
              priority
              className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-opacity group-hover:opacity-90"
            />
          </Link>

          {/* Desktop Navigation Links (Clean customer luxury categories) */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10 text-base lg:text-[17px] font-semibold tracking-wide text-obsidian-900">
            <Link
              href="/catalog?category=clothing"
              className="hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t('nav.clothing', 'Vêtements')}
            </Link>
            <Link
              href="/catalog?category=shoes"
              className="hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t('nav.shoes', 'Chaussures')}
            </Link>
            <Link
              href="/catalog?category=accessories"
              className="hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t('nav.accessories', 'Accessoires')}
            </Link>
          </nav>

          {/* Right Action Icons (Search, Cart, and Admin link ONLY if authenticated) */}
          <div className="flex items-center gap-1.5 sm:gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-wider font-semibold text-gold-700 bg-gold-50 border border-gold-200/80 rounded hover:bg-gold-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                title={t('nav.admin_portal_title', "Accéder au panneau d'administration")}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{t('nav.admin_space', 'Espace Admin')}</span>
              </Link>
            )}

            <Link
              href="/catalog"
              className="hidden lg:flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-obsidian-700 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label={t('nav.search', 'Rechercher')}
            >
              <Search className="w-4 h-4" />
              <span className="hidden xl:inline">{t('nav.search', 'Recherche')}</span>
            </Link>

            <LanguageSelector variant="header" />

            <Link
              href="/cart"
              onClick={(e) => {
                if (onOpenCart) {
                  e.preventDefault();
                  onOpenCart();
                } else if (cart?.openCart) {
                  e.preventDefault();
                  cart.openCart();
                }
              }}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-obsidian-900 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label={t('cart.drawer.title', "Panier d'achats")}
            >
              <ShoppingBag className="w-5 h-5" />
              {liveCount > 0 && (
                <span className="absolute -top-1 -end-1 bg-gold-500 text-obsidian-950 text-[10px] font-bold min-w-[1.25rem] h-5 px-1 rounded-full flex items-center justify-center font-sans tabular-nums shadow-sm">
                  {liveCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Slide-out mobile navigation drawer */}
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        cartCount={liveCount}
        isAdmin={isAdmin}
      />
    </>
  );
}
