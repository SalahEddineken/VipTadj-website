'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, ShieldCheck, Truck, Clock } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-obsidian-950 text-neutral-400 pt-10 pb-8 md:pt-16 md:pb-12 border-t border-obsidian-800 text-xs font-sans">
      <div className="luxury-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 pb-12 border-b border-obsidian-800/80">
          {/* Col 1: Brand & Algerian Prestige */}
          <div className="space-y-4">
            <div>
              <span className="luxury-cinzel-title text-2xl tracking-[0.2em] text-ivory">
                VIP TADJ
              </span>
              <p className="text-xs tracking-[0.25em] uppercase text-sand-400 mt-1">
                {t('brand.tagline', 'Maison de Haute Élégance')}
              </p>
            </div>
            <p className="text-sand-400 text-xs font-medium tracking-wide">
              {t('footer.cities', 'Alger • Oran • Constantine')}
            </p>
            <p className="text-neutral-300 text-xs leading-relaxed font-sans">
              {t(
                'footer.brand_desc',
                "L'incarnation de l'élégance vestimentaire masculine en Algérie. Costumes sur-mesure en laine peignée, vestes sartoriales et souliers artisanaux en cuir pleine fleur."
              )}
            </p>
          </div>

          {/* Col 2: Sartorial Collections */}
          <div className="space-y-3">
            <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-ivory">
              {t('footer.col.collections', 'Collections')}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/catalog?category=clothing" className="inline-block py-1.5 hover:text-gold-400 transition-colors">
                  {t('footer.collection.clothing', 'Prêt-à-Porter Sartorial')}
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=shoes" className="inline-block py-1.5 hover:text-gold-400 transition-colors">
                  {t('footer.collection.shoes', "L'Art Bottier")}
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=accessories" className="inline-block py-1.5 hover:text-gold-400 transition-colors">
                  {t('footer.collection.accessories', 'Soieries & Maroquinerie')}
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="inline-block py-1.5 hover:text-gold-400 transition-colors">
                  {t('footer.link.all_catalog', 'Explorer Tout le Catalogue')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service & Algeria Delivery */}
          <div className="space-y-3">
            <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-ivory">
              {t('footer.col.services', 'Service Client Algérie')}
            </h4>
            <ul className="space-y-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2 text-gold-400">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="ltr-protect" dir="ltr">
                  {t('footer.phone_support', 'Assistance Téléphonique : +213 (0) 550 00 00 00')}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('footer.shipping_partners', 'Expédition nationale (Yalidine / ZR)')}</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('home.pillars.cod.title', 'Paiement à la Livraison (COD)')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-sand-400 flex-shrink-0" />
                <span>{t('footer.support_hours', 'Assistance 7j/7 de 9h à 21h')}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Maison & Atelier */}
          <div className="space-y-3">
            <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-ivory">
              {t('footer.col.maison', 'Maison & Atelier')}
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/catalog" className="inline-block py-1.5 hover:text-gold-400 transition-colors">
                  {t('footer.link.all_catalog', 'Explorer Tout le Catalogue')}
                </Link>
              </li>
              <li>
                <Link href="/cart" className="inline-block py-1.5 hover:text-gold-400 transition-colors">
                  {t('footer.link.cart', "Mon Panier d'Achats")}
                </Link>
              </li>
              <li>
                <Link href="/admin" className="sr-only focus:not-sr-only focus:inline-block py-2 hover:text-gold-400 transition-colors">
                  {t('footer.link.admin_short', 'Espace Admin')}
                </Link>
              </li>
              <li>
                <span className="text-neutral-400">
                  {t('footer.showroom', 'Atelier & Showroom : Alger Centre, Algérie')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Language Selection Row in Footer */}
        <div className="pt-6 pb-2 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-obsidian-900">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs">
              {t('lang.selector.label', 'Langue')} :
            </span>
            <LanguageSelector variant="minimal" />
          </div>
          <span className="text-neutral-400 text-xs">
            {t('footer.cod_guarantee', 'Paiement en espèces à réception • Échange garanti sous 48h')}
          </span>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-400 text-xs">
          <p className="text-center md:text-start">
            {t(
              'footer.copyright',
              '© 2026 VIP TADJ. Tous droits réservés. Conçu selon les plus hauts standards de la couture masculine.'
            )}
          </p>
          <p className="text-center md:text-end text-sand-500">
            {t('footer.atelier_location', 'Atelier Sartorial & Salons Privés en Algérie')}
          </p>
        </div>
      </div>
    </footer>
  );
}
