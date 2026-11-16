'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Phone, ShieldCheck, Truck, Search } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount?: number;
  isAdmin?: boolean;
}

export function MobileNavDrawer({ isOpen, onClose, isAdmin = false }: MobileNavDrawerProps) {
  const { t } = useLanguage();

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-obsidian-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel - uses start-0 and border-e for automatic RTL mirroring */}
      <div className="fixed inset-y-0 start-0 w-[85%] max-w-sm bg-ivory shadow-2xl border-e border-sand-200 flex flex-col justify-between z-10 overflow-y-auto animate-in slide-in-from-left rtl:slide-in-from-right duration-300">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-sand-200 flex items-center justify-between">
            <Link href="/" onClick={onClose} className="flex flex-col">
              <span className="luxury-cinzel-title text-2xl tracking-[0.25em] text-obsidian-950">
                VIP TADJ
              </span>
              <span className="text-xs tracking-[0.25em] uppercase text-sand-800 font-sans">
                {t('brand.subtitle', 'Haute Couture Masculine')}
              </span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center text-obsidian-800 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              aria-label={t('nav.close', 'Fermer le menu')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Switcher in Drawer */}
          <div className="px-6 py-3 bg-sand-100 border-b border-sand-200 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-semibold text-obsidian-700">
              {t('lang.selector.label', 'Langue')}
            </span>
            <LanguageSelector variant="pills" />
          </div>

          {/* Search Quick Link */}
          <div className="p-6 border-b border-sand-200">
            <Link
              href="/catalog"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 bg-sand-100 text-obsidian-700 text-xs tracking-wider uppercase border border-sand-200 hover:border-gold-400 transition-colors"
            >
              <Search className="w-4 h-4 text-gold-600 flex-shrink-0" />
              <span>{t('nav.search_placeholder', 'Rechercher un modèle...')}</span>
            </Link>
          </div>

          {/* Navigation Categories */}
          <nav className="p-6 space-y-4 text-sm uppercase tracking-[0.2em] font-medium text-obsidian-900">
            <div>
              <Link
                href="/catalog?category=clothing"
                onClick={onClose}
                className="block hover:text-gold-600 py-2.5 sm:py-2 transition-colors"
              >
                {t('nav.clothing', 'Vêtements')}
              </Link>
              <p className="text-xs text-obsidian-600 tracking-normal normal-case mt-0.5">
                {t('category.clothing.subtitle', 'Costumes, Blazers & Confection Sartoriale')}
              </p>
            </div>

            <div>
              <Link
                href="/catalog?category=shoes"
                onClick={onClose}
                className="block hover:text-gold-600 py-2.5 sm:py-2 transition-colors"
              >
                {t('nav.shoes', 'Chaussures')}
              </Link>
              <p className="text-xs text-obsidian-600 tracking-normal normal-case mt-0.5">
                {t('category.shoes.subtitle', 'Souliers de Maître Bottier & Richelieus')}
              </p>
            </div>

            <div>
              <Link
                href="/catalog?category=accessories"
                onClick={onClose}
                className="block hover:text-gold-600 py-2.5 sm:py-2 transition-colors"
              >
                {t('nav.accessories', 'Accessoires')}
              </Link>
              <p className="text-xs text-obsidian-600 tracking-normal normal-case mt-0.5">
                {t('category.accessories.subtitle', 'Soie Jacquard, Maroquinerie & Horlogerie')}
              </p>
            </div>

            <div className="pt-2 border-t border-sand-200">
              <Link
                href="/catalog"
                onClick={onClose}
                className="block hover:text-gold-600 py-2.5 sm:py-2 text-gold-700 font-semibold transition-colors"
              >
                {t('footer.link.all_catalog', 'Explorer Tout le Catalogue')}
              </Link>
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-sand-200">
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2 text-gold-700 hover:text-gold-800 font-semibold py-1 transition-colors text-xs uppercase tracking-wider"
                >
                  <ShieldCheck className="w-4 h-4 text-gold-600" />
                  <span>{t('nav.admin_space', 'Espace Admin')}</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Footer info inside Drawer */}
        <div className="p-6 bg-sand-100 border-t border-sand-200 space-y-3 text-xs text-neutral-600">
          <a
            href="tel:+213550000000"
            className="flex items-center gap-2 text-obsidian-900 font-semibold hover:text-gold-700 transition-colors ltr-protect focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            dir="ltr"
          >
            <Phone className="w-4 h-4 text-gold-700 flex-shrink-0" />
            <span className="font-sans tabular-nums text-xs">+213 (0) 550 00 00 00</span>
          </a>
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gold-600 flex-shrink-0" />
            <span>{t('announcement.shipping', 'Livraison 58 Wilayas • Paiement à la Livraison (COD)')}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-600 flex-shrink-0" />
            <span>{t('home.pillars.cod.title', 'Paiement à la Livraison (COD)')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
