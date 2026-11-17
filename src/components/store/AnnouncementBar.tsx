'use client';

import React from 'react';
import { Sparkles, Phone } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export function AnnouncementBar() {
  const { t } = useLanguage();

  return (
    <aside
      suppressHydrationWarning
      className="bg-obsidian-950 text-ivory text-xs font-sans tracking-[0.2em] uppercase py-2 px-4 border-b border-obsidian-800"
    >
      <div className="luxury-container flex flex-col md:flex-row justify-between items-center gap-1.5 md:gap-4 text-center">
        <span className="flex items-center justify-center gap-1.5 text-gold-400 text-center w-full md:w-auto">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span suppressHydrationWarning>
            {t('announcement.title', 'Maison VIP TADJ | Haute Élégance Masculine')}
          </span>
        </span>
        <span suppressHydrationWarning className="hidden md:inline text-neutral-300">
          {t('announcement.shipping', 'Livraison 58 Wilayas • Paiement à la Livraison (COD)')}
        </span>
        <a
          href="tel:+213550000000"
          className="min-h-[44px] flex items-center justify-center gap-1.5 py-1 px-2 text-gold-400 hover:text-gold-200 transition-colors ltr-protect focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 w-full md:w-auto mx-auto md:mx-0"
          dir="ltr"
        >
          <Phone className="w-3 h-3 flex-shrink-0" />
          <span className="font-sans tabular-nums text-xs">+213 (0) 550 00 00 00</span>
        </a>
      </div>
    </aside>
  );
}
