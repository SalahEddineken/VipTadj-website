'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import {
  CatalogFilterState,
  SUBCATEGORIES_BY_CATEGORY,
  STANDARD_SIZES,
} from '@/lib/utils/catalogUtils';
import { formatDZD } from '@/lib/utils/formatDZD';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedSubcategory, getLocalizedSize } from '@/lib/i18n/catalog-translations';

export interface CatalogFilterSidebarProps {
  filters: CatalogFilterState;
  onChange: (filters: Partial<CatalogFilterState>) => void;
  onReset: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCategoryLocked?: boolean;
  availableSizes?: string[];
}

export function CatalogFilterSidebar({
  filters,
  onChange,
  onReset,
  isOpenMobile = false,
  onCloseMobile,
  isCategoryLocked = false,
  availableSizes,
}: CatalogFilterSidebarProps) {
  const { language, t } = useLanguage();

  const categories = [
    { id: 'all', label: t('catalog.filter.all_creations', 'Toutes les Créations') },
    { id: 'clothing', label: t('category.clothing', 'Vêtements & Costumes') },
    { id: 'shoes', label: t('category.shoes', 'Chaussures & Souliers') },
    { id: 'accessories', label: t('category.accessories', 'Accessoires & Maroquinerie') },
  ];

  const currentSubcategories =
    filters.category !== 'all'
      ? SUBCATEGORIES_BY_CATEGORY[filters.category] || []
      : Object.values(SUBCATEGORIES_BY_CATEGORY).flat();

  // Deduplicate subcategories when showing 'all'
  const uniqueSubcategories = Array.from(
    new Map(currentSubcategories.map((item) => [item.id, item])).values()
  );

  const sizesToDisplay =
    availableSizes && availableSizes.length > 0
      ? availableSizes
      : filters.category === 'shoes'
      ? STANDARD_SIZES.shoes
      : filters.category === 'clothing'
      ? STANDARD_SIZES.clothing
      : ['48', '50', '52', '54', '56', '39', '40', '41', '42', '43', '44', '45'];

  const toggleSize = (size: string) => {
    const isSelected = filters.selectedSizes.includes(size);
    const newSizes = isSelected
      ? filters.selectedSizes.filter((s) => s !== size)
      : [...filters.selectedSizes, size];
    onChange({ selectedSizes: newSizes });
  };

  const content = (
    <div className="space-y-8 font-sans text-xs">
      {/* 1. Category Facet */}
      {!isCategoryLocked && (
        <div className="space-y-3 pb-6 border-b border-sand-200">
          <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-obsidian-950 uppercase">
            {t('catalog.filter.category', 'Catégorie')}
          </h4>
          <div className="space-y-1">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2.5 cursor-pointer group min-h-[44px] py-2"
              >
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.id}
                  onChange={() =>
                    onChange({
                      category: cat.id,
                      subcategory: 'all',
                    })
                  }
                  className="w-4 h-4 text-gold-700 focus:ring-gold-500 border-sand-300"
                />
                <span
                  className={`text-xs transition-colors ${
                    filters.category === cat.id
                      ? 'text-obsidian-950 font-semibold'
                      : 'text-neutral-700 group-hover:text-gold-700'
                  }`}
                >
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* 2. Subcategory Facet */}
      {uniqueSubcategories.length > 0 && (
        <div className="space-y-3 pb-6 border-b border-sand-200">
          <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-obsidian-950 uppercase">
            {t('catalog.filter.piece_type', 'Type de Pièce')}
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <label className="flex items-center gap-2.5 cursor-pointer group min-h-[44px] py-2">
              <input
                type="radio"
                name="subcategory"
                checked={filters.subcategory === 'all'}
                onChange={() => onChange({ subcategory: 'all' })}
                className="w-4 h-4 text-gold-700 focus:ring-gold-500 border-sand-300"
              />
              <span
                className={`text-xs transition-colors ${
                  filters.subcategory === 'all'
                    ? 'text-obsidian-950 font-semibold'
                    : 'text-neutral-700 group-hover:text-gold-700'
                }`}
              >
                {t('catalog.filter.all_types', 'Tous les types')}
              </span>
            </label>
            {uniqueSubcategories.map((sub) => {
              const localizedLabel = getLocalizedSubcategory(sub.id, language) || sub.label;
              return (
                <label
                  key={sub.id}
                  className="flex items-center gap-2.5 cursor-pointer group min-h-[44px] py-2"
                >
                  <input
                    type="radio"
                    name="subcategory"
                    checked={filters.subcategory.toLowerCase() === sub.id.toLowerCase()}
                    onChange={() => onChange({ subcategory: sub.id })}
                    className="w-4 h-4 text-gold-700 focus:ring-gold-500 border-sand-300"
                  />
                  <span
                    className={`text-xs transition-colors ${
                      filters.subcategory.toLowerCase() === sub.id.toLowerCase()
                        ? 'text-obsidian-950 font-semibold'
                        : 'text-neutral-700 group-hover:text-gold-700'
                    }`}
                  >
                    {localizedLabel}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Sizes Facet */}
      <div className="space-y-3 pb-6 border-b border-sand-200">
        <div className="flex items-center justify-between">
          <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-obsidian-950 uppercase">
            {t('catalog.filter.sizes', 'Tailles & Pointures')}
          </h4>
          {filters.selectedSizes.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ selectedSizes: [] })}
              className="text-xs text-neutral-500 hover:text-obsidian-900 underline"
            >
              {t('catalog.filter.clear_size', 'Effacer')}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {sizesToDisplay.map((size) => {
            const isSelected = filters.selectedSizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`min-w-[2.75rem] h-11 px-2.5 text-xs font-sans border transition-colors flex items-center justify-center ${
                  isSelected
                    ? 'bg-obsidian-950 text-ivory border-obsidian-950 font-semibold'
                    : 'bg-white text-obsidian-900 border-sand-300 hover:border-gold-500'
                }`}
                aria-pressed={isSelected}
              >
                {getLocalizedSize(size, language)}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Price Boundaries (DZD) */}
      <div className="space-y-3 pb-6 border-b border-sand-200">
        <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-obsidian-950 uppercase">
          {t('catalog.filter.price_range', 'Gamme de Prix (DZD)')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-sand-800 font-medium block mb-1">
              {t('catalog.filter.min_price_label', 'Min (DA)')}
            </label>
            <input
              type="number"
              min={0}
              max={150000}
              step={1000}
              value={filters.minPrice || ''}
              onChange={(e) =>
                onChange({ minPrice: Number(e.target.value) || 0 })
              }
              placeholder="0"
              className="w-full px-2.5 py-2.5 min-h-[44px] bg-white border border-sand-300 text-xs text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 font-sans tabular-nums text-start"
            />
          </div>
          <div>
            <label className="text-xs text-sand-800 font-medium block mb-1">
              {t('catalog.filter.max_price_label', 'Max (DA)')}
            </label>
            <input
              type="number"
              min={0}
              max={150000}
              step={1000}
              value={filters.maxPrice === 150000 ? '' : filters.maxPrice}
              onChange={(e) =>
                onChange({
                  maxPrice: e.target.value ? Number(e.target.value) : 150000,
                })
              }
              placeholder="150000"
              className="w-full px-2.5 py-2.5 min-h-[44px] bg-white border border-sand-300 text-xs text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 font-sans tabular-nums text-start"
            />
          </div>
        </div>
        <div className="text-xs text-sand-800 flex justify-between font-sans tabular-nums">
          <span>{formatDZD(filters.minPrice, { locale: language })}</span>
          <span>{formatDZD(filters.maxPrice, { locale: language })}</span>
        </div>
      </div>

      {/* 5. In-Stock Availability Toggle */}
      <div className="space-y-3 pb-6 border-b border-sand-200">
        <label className="flex items-center justify-between cursor-pointer group min-h-[44px] py-2">
          <span className="text-xs font-medium text-obsidian-900 group-hover:text-gold-700 transition-colors">
            {t('catalog.filter.in_stock_only', 'En stock uniquement')}
          </span>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ inStockOnly: e.target.checked })}
            className="w-4 h-4 text-gold-700 rounded border-sand-300 focus:ring-gold-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Reset Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-3 min-h-[44px] border border-sand-300 hover:border-obsidian-950 text-xs uppercase tracking-wider font-semibold text-obsidian-900 hover:bg-sand-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          {t('catalog.filter.reset_all', 'Réinitialiser tous les filtres')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-28 bg-white p-6 border border-sand-200 shadow-luxury-subtle">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-sand-200">
            <span className="luxury-cinzel-title text-base tracking-[0.15em] text-obsidian-950">
              {t('catalog.filter.title', 'Filtres')}
            </span>
          </div>
          {content}
        </div>
      </aside>

      {/* Mobile Modal Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-obsidian-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 end-0 w-[85%] max-w-md bg-ivory shadow-2xl flex flex-col justify-between z-10 overflow-y-auto p-6">
            <div className="flex items-center justify-between pb-4 border-b border-sand-200 mb-6">
              <span className="luxury-cinzel-title text-lg tracking-[0.15em] text-obsidian-950">
                {t('catalog.filter.mobile_title', 'Filtres & Critères')}
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center text-obsidian-800 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                aria-label={t('catalog.filter.close_aria', 'Fermer les filtres')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">{content}</div>
            <div className="pt-6 border-t border-sand-200 mt-6">
              <button
                type="button"
                onClick={onCloseMobile}
                className="btn-luxury-gold w-full text-center text-xs uppercase tracking-[0.2em]"
              >
                {t('catalog.filter.apply_mobile', 'Voir les résultats')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
