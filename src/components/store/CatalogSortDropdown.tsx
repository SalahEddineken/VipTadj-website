'use client';

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { CatalogSortOption } from '@/lib/utils/catalogUtils';
import { useLanguage } from '@/lib/context/language-context';

export interface CatalogSortDropdownProps {
  value: CatalogSortOption;
  onChange: (value: CatalogSortOption) => void;
  className?: string;
}

export function CatalogSortDropdown({
  value,
  onChange,
  className = '',
}: CatalogSortDropdownProps) {
  const { t } = useLanguage();

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <label htmlFor="catalog-sort" className="text-xs uppercase tracking-wider text-neutral-500 font-sans whitespace-nowrap hidden sm:inline">
        {t('catalog.sort.label', 'Trier par :')}
      </label>
      <div className="relative">
        <select
          id="catalog-sort"
          value={value}
          onChange={(e) => onChange(e.target.value as CatalogSortOption)}
          className="appearance-none bg-white border border-sand-300 text-xs text-obsidian-900 min-h-[44px] py-2.5 ps-3.5 pe-8 tracking-wider uppercase font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 cursor-pointer"
        >
          <option value="featured">{t('catalog.sort.featured', 'Sélection Prestige')}</option>
          <option value="newest">{t('catalog.sort.newest', 'Nouveautés')}</option>
          <option value="price-asc">{t('catalog.sort.price_asc', 'Prix : Croissant')}</option>
          <option value="price-desc">{t('catalog.sort.price_desc', 'Prix : Décroissant')}</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center px-2.5 text-neutral-500">
          <ArrowUpDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
