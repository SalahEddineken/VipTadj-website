'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  className = '',
}: SearchBarProps) {
  const { t } = useLanguage();
  const resolvedPlaceholder =
    placeholder ||
    t(
      'catalog.search.placeholder',
      'Rechercher un produit...'
    );

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-neutral-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="w-full ps-10 pe-10 py-3 bg-white border border-sand-300 text-base md:text-sm text-obsidian-950 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors font-sans text-start"
        aria-label={t('catalog.search.aria_label', 'Rechercher des produits')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 end-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-500 hover:text-obsidian-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
          aria-label={t('catalog.search.clear_aria', 'Effacer la recherche')}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
