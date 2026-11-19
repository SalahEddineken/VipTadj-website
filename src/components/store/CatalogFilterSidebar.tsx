'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import {
  CatalogFilterState,
  STANDARD_SIZES,
  resolveCategoryId,
} from '@/lib/utils/catalogUtils';
import { formatDZD } from '@/lib/utils/formatDZD';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedSize } from '@/lib/i18n/catalog-translations';

export interface CatalogFilterSidebarProps {
  filters: CatalogFilterState;
  onChange: (filters: Partial<CatalogFilterState>) => void;
  onReset: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCategoryLocked?: boolean;
  availableSizes?: string[];
  isDesktopVisible?: boolean;
}

export function CatalogFilterSidebar({
  filters,
  onChange,
  onReset,
  isOpenMobile = false,
  onCloseMobile,
  isCategoryLocked = false,
  availableSizes,
  isDesktopVisible = true,
}: CatalogFilterSidebarProps) {
  const { language, t } = useLanguage();
  const [showCustomPrice, setShowCustomPrice] = useState(
    Boolean(
      (filters.minPrice > 0 && filters.minPrice !== 15000 && filters.minPrice !== 35000 && filters.minPrice !== 60000) ||
      (filters.maxPrice < 150000 && filters.maxPrice !== 15000 && filters.maxPrice !== 35000 && filters.maxPrice !== 60000)
    )
  );

  const resolvedCategory =
    filters.category === 'all'
      ? 'all'
      : resolveCategoryId(filters.category) || filters.category;

  const sizesToDisplay =
    availableSizes && availableSizes.length > 0
      ? availableSizes
      : resolvedCategory === 'shoes'
      ? STANDARD_SIZES.shoes
      : resolvedCategory === 'clothing'
      ? STANDARD_SIZES.clothing
      : ['48', '50', '52', '54', '56', '39', '40', '41', '42', '43', '44', '45'];

  const toggleSize = (size: string) => {
    const isSelected = filters.selectedSizes.includes(size);
    const newSizes = isSelected
      ? filters.selectedSizes.filter((s) => s !== size)
      : [...filters.selectedSizes, size];
    onChange({ selectedSizes: newSizes });
  };

  const budgetTiers = [
    {
      id: 'all',
      label: t('catalog.filter.price_all', 'Tous les prix'),
      min: 0,
      max: 150000,
    },
    {
      id: 'under15',
      label: `< ${formatDZD(15000, { locale: language })}`,
      min: 0,
      max: 15000,
    },
    {
      id: '15to35',
      label: `${formatDZD(15000, { locale: language })} – ${formatDZD(35000, { locale: language })}`,
      min: 15000,
      max: 35000,
    },
    {
      id: '35to60',
      label: `${formatDZD(35000, { locale: language })} – ${formatDZD(60000, { locale: language })}`,
      min: 35000,
      max: 60000,
    },
    {
      id: 'over60',
      label: `> ${formatDZD(60000, { locale: language })}`,
      min: 60000,
      max: 150000,
    },
  ];

  const content = (
    <div className="space-y-6 font-sans text-xs">
      {/* 1. Sizes Facet */}
      <div className="space-y-3 pb-5 border-b border-sand-200">
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
                className={`min-w-[2.75rem] h-11 px-2.5 text-xs font-sans rounded-sm border transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-obsidian-950 text-ivory border-obsidian-950 font-semibold shadow-sm'
                    : 'bg-white text-obsidian-900 border-sand-200 hover:border-gold-500 hover:bg-sand-50'
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
      <div className="space-y-3 pb-5 border-b border-sand-200">
        <div className="flex items-center justify-between">
          <h4 className="luxury-serif-title text-sm tracking-[0.15em] text-obsidian-950 uppercase">
            {t('catalog.filter.price_range', 'Gamme de Prix (DZD)')}
          </h4>
          {(filters.minPrice > 0 || filters.maxPrice < 150000) && (
            <button
              type="button"
              onClick={() => onChange({ minPrice: 0, maxPrice: 150000 })}
              className="text-xs text-neutral-500 hover:text-obsidian-900 underline"
            >
              {t('catalog.filter.clear_size', 'Effacer')}
            </button>
          )}
        </div>

        {/* 1-Click Budget Pills */}
        <div className="grid grid-cols-1 gap-1.5">
          {budgetTiers.map((tier) => {
            const isActive = filters.minPrice === tier.min && filters.maxPrice === tier.max;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onChange({ minPrice: tier.min, maxPrice: tier.max })}
                className={`px-3 py-2 text-xs border rounded-sm font-sans text-start transition-all ${
                  isActive
                    ? 'bg-obsidian-950 text-ivory border-obsidian-950 font-semibold shadow-sm'
                    : 'bg-white text-neutral-800 border-sand-200 hover:border-gold-500 hover:bg-sand-50'
                }`}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

        {/* Custom Price Inputs Collapsible */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowCustomPrice((prev) => !prev)}
            className="text-xs text-gold-700 hover:text-gold-800 font-semibold flex items-center justify-between w-full py-1"
          >
            <span>{t('catalog.filter.custom_price', 'Montant personnalisé')}</span>
            <span className="text-[10px]">{showCustomPrice ? '▲' : '▼'}</span>
          </button>

          {showCustomPrice && (
            <div className="pt-2 mt-1 border-t border-sand-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-sand-800 font-medium block mb-1">
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
                    className="w-full px-2.5 py-2 min-h-[40px] bg-white border border-sand-300 text-xs text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 font-sans tabular-nums text-start rounded-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-sand-800 font-medium block mb-1">
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
                    className="w-full px-2.5 py-2 min-h-[40px] bg-white border border-sand-300 text-xs text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 font-sans tabular-nums text-start rounded-sm"
                  />
                </div>
              </div>
              <div className="text-[11px] text-sand-800 flex justify-between font-sans tabular-nums">
                <span>{formatDZD(filters.minPrice, { locale: language })}</span>
                <span>{formatDZD(filters.maxPrice, { locale: language })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. In-Stock Availability Toggle */}
      <div className="pb-5 border-b border-sand-200">
        <label className="flex items-center justify-between cursor-pointer p-3 rounded-sm border border-sand-200 bg-sand-50/60 hover:bg-sand-50 transition-colors">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-obsidian-900">
              {t('catalog.filter.in_stock_only', 'En stock uniquement')}
            </span>
            <span className="text-[11px] text-neutral-500 font-sans mt-0.5">
              {t('catalog.filter.in_stock_desc', 'Masquer les pièces épuisées')}
            </span>
          </div>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ inStockOnly: e.target.checked })}
            className="w-4 h-4 text-gold-700 rounded border-sand-300 focus:ring-gold-500 cursor-pointer accent-gold-600"
          />
        </label>
      </div>

      {/* Reset Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 min-h-[44px] border border-sand-300 hover:border-obsidian-950 text-xs uppercase tracking-wider font-semibold text-obsidian-900 hover:bg-sand-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
        >
          {t('catalog.filter.reset_all', 'Réinitialiser tous les filtres')}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Static / Collapsible Sidebar */}
      <aside
        className={`${
          isDesktopVisible ? 'hidden lg:block w-72 flex-shrink-0' : 'hidden'
        }`}
      >
        <div className="sticky top-28 bg-white p-6 border border-sand-200 shadow-luxury-subtle rounded-sm">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-sand-200">
            <span className="luxury-cinzel-title text-base tracking-[0.15em] text-obsidian-950">
              {t('catalog.filter.title', 'Filtres')}
            </span>
            {(filters.category !== 'all' ||
              filters.subcategory !== 'all' ||
              filters.selectedSizes.length > 0 ||
              filters.inStockOnly ||
              filters.minPrice > 0 ||
              filters.maxPrice < 150000) && (
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] text-gold-700 hover:text-gold-800 underline font-medium"
              >
                {t('catalog.filter.clear_size', 'Effacer')}
              </button>
            )}
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
            <div className="flex-1 overflow-y-auto pe-1">{content}</div>
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
