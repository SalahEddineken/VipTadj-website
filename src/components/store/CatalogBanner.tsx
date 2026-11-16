'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/language-context';

export function CatalogBanner() {
  const { t } = useLanguage();

  return (
    <section className="bg-obsidian-950 text-ivory py-12 sm:py-16 md:py-24 border-b border-obsidian-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(197,160,89,0.12),transparent_50%)]" />
      <div className="luxury-container relative z-10 text-center max-w-3xl">
        <h1 className="luxury-serif-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-ivory mb-4 text-balance">
          {t('catalog.banner.title', 'Le Catalogue VIP TADJ')}
        </h1>
        <p className="text-neutral-400 text-xs md:text-sm font-sans leading-relaxed max-w-xl mx-auto text-balance">
          {t(
            'catalog.banner.desc',
            'Collection Intégrale 2026 — Chaque modèle est sélectionné selon les critères les plus stricts de la couture traditionnelle européenne et adapté aux exigences des 58 Wilayas algériennes.'
          )}
        </p>
      </div>
    </section>
  );
}
