'use client';

import React from 'react';
import { X } from 'lucide-react';
import { CatalogFilterState } from '@/lib/utils/catalogUtils';
import { formatDZD } from '@/lib/utils/formatDZD';
import { useLanguage } from '@/lib/context/language-context';
import {
  getLocalizedCategoryName,
  getLocalizedSubcategory,
  getLocalizedSize,
} from '@/lib/i18n/catalog-translations';

export interface ActiveFilterBadgesProps {
  filters: CatalogFilterState;
  onRemoveSearch: () => void;
  onRemoveCategory: () => void;
  onRemoveSubcategory: () => void;
  onRemoveSize: (size: string) => void;
  onRemoveInStock: () => void;
  onRemovePrice: () => void;
  onResetAll: () => void;
}

export function ActiveFilterBadges({
  filters,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveSubcategory,
  onRemoveSize,
  onRemoveInStock,
  onRemovePrice,
  onResetAll,
}: ActiveFilterBadgesProps) {
  const { language, t } = useLanguage();

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.category !== 'all' ||
    filters.subcategory !== 'all' ||
    filters.selectedSizes.length > 0 ||
    filters.inStockOnly ||
    filters.minPrice > 0 ||
    filters.maxPrice < 150000;

  if (!hasActiveFilters) return null;

  const localizedCategoryName =
    filters.category !== 'all'
      ? getLocalizedCategoryName(filters.category, language) || filters.category
      : '';

  const localizedSubcategoryName =
    filters.subcategory !== 'all'
      ? getLocalizedSubcategory(filters.subcategory, language) || filters.subcategory
      : '';

  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <span className="text-xs uppercase tracking-wider text-sand-800 font-sans me-1 font-semibold">
        {t('catalog.filter.active_filters', 'Filtres actifs :')}
      </span>

      {/* Search pill */}
      {filters.searchQuery && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 border border-sand-300 text-xs text-obsidian-900 font-sans">
          <span>
            {t('catalog.filter.search_prefix', 'Recherche :')} &quot;{filters.searchQuery}&quot;
          </span>
          <button
            type="button"
            onClick={onRemoveSearch}
            className="p-1 ms-0.5 inline-flex items-center justify-center text-obsidian-600 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={t('catalog.filter.clear_aria_search', 'Supprimer le filtre de recherche')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Category pill */}
      {filters.category !== 'all' && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 border border-sand-300 text-xs text-obsidian-900 uppercase font-sans">
          <span>
            {t('catalog.filter.category_prefix', 'Catégorie :')} {localizedCategoryName}
          </span>
          <button
            type="button"
            onClick={onRemoveCategory}
            className="p-1 ms-0.5 inline-flex items-center justify-center text-obsidian-600 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={t('catalog.filter.clear_aria_category', 'Supprimer le filtre de catégorie')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Subcategory pill */}
      {filters.subcategory !== 'all' && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 border border-sand-300 text-xs text-obsidian-900 uppercase font-sans">
          <span>{localizedSubcategoryName}</span>
          <button
            type="button"
            onClick={onRemoveSubcategory}
            className="p-1 ms-0.5 inline-flex items-center justify-center text-obsidian-600 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={t('catalog.filter.clear_aria_subcategory', 'Supprimer le filtre de sous-catégorie')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Size pills */}
      {filters.selectedSizes.map((size) => (
        <span
          key={size}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 border border-sand-300 text-xs text-obsidian-900 font-sans"
        >
          <span>
            {t('catalog.filter.size_prefix', 'Taille :')} {getLocalizedSize(size, language)}
          </span>
          <button
            type="button"
            onClick={() => onRemoveSize(size)}
            className="p-1 ms-0.5 inline-flex items-center justify-center text-obsidian-600 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={`${t('catalog.filter.clear_size', 'Effacer')} ${getLocalizedSize(size, language)}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      {/* In-Stock pill */}
      {filters.inStockOnly && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 border border-sand-300 text-xs text-obsidian-900 font-sans">
          <span>{t('catalog.filter.in_stock_only', 'En stock uniquement')}</span>
          <button
            type="button"
            onClick={onRemoveInStock}
            className="p-1 ms-0.5 inline-flex items-center justify-center text-obsidian-600 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={t('catalog.filter.clear_in_stock', 'Supprimer le filtre en stock')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Price range pill */}
      {(filters.minPrice > 0 || filters.maxPrice < 150000) && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sand-100 border border-sand-300 text-xs text-obsidian-900 font-sans">
          <span>
            {formatDZD(filters.minPrice, { locale: language })} - {formatDZD(filters.maxPrice, { locale: language })}
          </span>
          <button
            type="button"
            onClick={onRemovePrice}
            className="p-1 ms-0.5 inline-flex items-center justify-center text-obsidian-600 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
            aria-label={t('catalog.filter.clear_price', 'Réinitialiser la fourchette de prix')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Reset all button */}
      <button
        type="button"
        onClick={onResetAll}
        className="text-xs tracking-wider uppercase text-gold-700 hover:text-gold-800 underline underline-offset-4 ms-2 font-medium min-h-[44px] inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
      >
        {t('catalog.filter.clear_all', 'Tout effacer')}
      </button>
    </div>
  );
}
