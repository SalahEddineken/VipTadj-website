'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, ShieldCheck, Truck, Clock, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { useStoreSettings } from '@/lib/context/store-settings-context';
import { formatTelLink } from '@/lib/utils/phoneUtils';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export function Footer() {
  const { t } = useLanguage();
  const { phone } = useStoreSettings();

  return (
    <footer className="mt-auto bg-obsidian-950 text-neutral-400 pt-10 pb-8 md:pt-14 md:pb-10 border-t border-obsidian-800 text-xs font-sans">
      <div className="luxury-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-8 pb-10 border-b border-obsidian-800/80">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div>
              <span className="luxury-cinzel-title text-2xl tracking-[0.2em] text-ivory">
                VIP TADJ
              </span>
              <p className="text-xs tracking-[0.2em] uppercase text-sand-400 mt-1">
                {t('brand.tagline', 'Maison de Haute Élégance')}
              </p>
            </div>
            <p className="text-neutral-400 text-xs">
              {t('footer.location', 'Chelghoum Laïd, Mila, Algérie')}
            </p>
          </div>

          {/* Col 2: Collections */}
          <div className="space-y-3">
            <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-ivory">
              {t('footer.col.collections', 'Collections')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/catalog?category=clothing"
                  className="inline-block hover:text-gold-400 transition-colors"
                >
                  {t('footer.collection.clothing', 'Prêt-à-Porter')}
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?category=shoes"
                  className="inline-block hover:text-gold-400 transition-colors"
                >
                  {t('footer.collection.shoes', 'Souliers')}
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog?category=accessories"
                  className="inline-block hover:text-gold-400 transition-colors"
                >
                  {t('footer.collection.accessories', 'Accessoires')}
                </Link>
              </li>
              <li>
                <Link
                  href="/catalog"
                  className="inline-block hover:text-gold-400 transition-colors text-sand-400"
                >
                  {t('footer.link.all_catalog', 'Tout le catalogue')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div className="space-y-3">
            <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-ivory">
              {t('footer.col.services', 'Service Client')}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                <a
                  href={formatTelLink(phone)}
                  dir="ltr"
                  className="ltr-protect hover:text-gold-200 transition-colors font-medium text-gold-400"
                >
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('footer.support_hours', '7j/7 de 9h à 21h')}</span>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="inline-block hover:text-gold-400 transition-colors"
                >
                  {t('footer.link.cart', 'Mon Panier')}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="sr-only focus:not-sr-only focus:inline-block py-1 hover:text-gold-400 transition-colors"
                >
                  {t('footer.link.admin_short', 'Espace Admin')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Shipping & Guarantees */}
          <div className="space-y-3">
            <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-ivory">
              {t('footer.col.engagements', 'Livraison & Garanties')}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('footer.shipping', 'Expédition 68 wilayas')}</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('footer.cod', 'Paiement à la livraison')}</span>
              </li>
              <li className="flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('footer.exchange', 'Échange garanti sous 48h')}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Language Selector */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-neutral-400 text-xs">
          <p className="text-center sm:text-start">
            {t('footer.copyright', '© 2026 VIP TADJ. Tous droits réservés.')}
          </p>
          <LanguageSelector variant="minimal" />
        </div>
      </div>
    </footer>
  );
}
