'use client';

import React from 'react';
import { Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export function TrustPillarsBar() {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-sand-200 text-xs font-sans">
      <div className="flex items-start gap-2.5">
        <Truck className="w-4 h-4 text-gold-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-obsidian-950 block">
            {t('home.pillars.wilayas.title', 'Livraison 58 Wilayas')}
          </span>
          <span className="text-neutral-600 text-xs">
            {t('pdp.trust.delivery', 'Yalidine & ZR Express (24-48h)')}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-gold-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-obsidian-950 block">
            {t('home.pillars.cod.title', 'Paiement à la Livraison')}
          </span>
          <span className="text-neutral-600 text-xs">
            {t('pdp.trust.cod', 'En espèces à la réception du colis')}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <RefreshCw className="w-4 h-4 text-gold-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-obsidian-950 block">
            {t('pdp.trust.exchange', 'Échange Garanti 48h')}
          </span>
          <span className="text-neutral-600 text-xs">
            {t('home.story.stat3.label', 'Essayage et changement de taille')}
          </span>
        </div>
      </div>
    </div>
  );
}
