'use client';

import React from 'react';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedCategory } from '@/lib/i18n/catalog-translations';

export interface CategoryBannerProps {
  category: string;
  fallbackName: string;
  fallbackSubtitle: string;
  fallbackDescription: string;
}

export function CategoryBanner({
  category,
  fallbackName,
  fallbackSubtitle,
  fallbackDescription,
}: CategoryBannerProps) {
  const { language } = useLanguage();
  const localized = getLocalizedCategory(category, language);

  const name = localized?.name || fallbackName;
  const subtitle = localized?.subtitle || fallbackSubtitle;
  const description = localized?.description || fallbackDescription;

  return (
    <section className="bg-obsidian-950 text-ivory py-12 sm:py-16 md:py-24 border-b border-obsidian-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.14),transparent_60%)]" />
      <div className="luxury-container relative z-10 text-center max-w-3xl">
        <h1 className="luxury-serif-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl text-ivory mb-4 text-balance">
          {name}
        </h1>
        <p className="text-gold-400/90 text-sm md:text-base font-serif italic mb-3">
          {subtitle}
        </p>
        <p className="text-neutral-400 text-xs md:text-sm font-sans leading-relaxed max-w-xl mx-auto text-balance">
          {description}
        </p>
      </div>
    </section>
  );
}
