'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { Product } from '@/types';
import {
  CatalogFilterState,
  DEFAULT_FILTER_STATE,
  filterProducts,
  isProductVisibleInShop,
  CatalogSortOption,
  resolveCategoryId,
  normalizeProductSizes,
} from '@/lib/utils/catalogUtils';
import { SearchBar } from './SearchBar';
import { CatalogSortDropdown } from './CatalogSortDropdown';
import { ActiveFilterBadges } from './ActiveFilterBadges';
import { CatalogFilterSidebar } from './CatalogFilterSidebar';
import { ProductGrid } from './ProductGrid';
import { ZeroResults } from './ZeroResults';
import { useLanguage } from '@/lib/context/language-context';

export interface CatalogClientProps {
  initialProducts: Product[];
  initialCategory?: string;
  isCategoryLocked?: boolean;
}

function CatalogClientInner({
  initialProducts,
  initialCategory,
  isCategoryLocked = false,
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();

  // Read URL query params on initial mount
  const initialCategoryParam =
    initialCategory || searchParams.get('category') || 'all';
  const initialSubcategoryParam = searchParams.get('subcategory') || 'all';
  const initialSearchParam = searchParams.get('search') || '';
  const initialSizeParam = searchParams.get('size');
  const initialSizes = initialSizeParam ? initialSizeParam.split(',') : [];
  const initialSortBy = (searchParams.get('sortBy') as CatalogSortOption) || 'featured';
  const initialMinPrice = searchParams.get('minPrice')
    ? Number(searchParams.get('minPrice'))
    : 0;
  const initialMaxPrice = searchParams.get('maxPrice')
    ? Number(searchParams.get('maxPrice'))
    : 150000;
  const initialInStock = searchParams.get('inStock') === 'true';

  const [filters, setFilters] = useState<CatalogFilterState>({
    searchQuery: initialSearchParam,
    category: initialCategoryParam,
    subcategory: initialSubcategoryParam,
    selectedSizes: initialSizes,
    minPrice: initialMinPrice,
    maxPrice: initialMaxPrice,
    inStockOnly: initialInStock,
    sortBy: initialSortBy,
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(true);

  const categories = useMemo(
    () => [
      { id: 'all', label: t('catalog.filter.all_creations', 'Toutes les Créations') },
      { id: 'clothing', label: t('category.clothing', 'Vêtements') },
      { id: 'shoes', label: t('category.shoes', 'Chaussures & Souliers') },
      { id: 'accessories', label: t('category.accessories', 'Accessoires & Maroquinerie') },
    ],
    [t]
  );

  const resolvedCategory =
    filters.category === 'all'
      ? 'all'
      : resolveCategoryId(filters.category) || filters.category;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count += 1;
    if (filters.category !== 'all' && !isCategoryLocked) count += 1;
    if (filters.subcategory !== 'all') count += 1;
    if (filters.selectedSizes.length > 0) count += filters.selectedSizes.length;
    if (filters.inStockOnly) count += 1;
    if (filters.minPrice > 0 || filters.maxPrice < 150000) count += 1;
    return count;
  }, [filters, isCategoryLocked]);

  // 1. Sync searchParams from URL (e.g. Header nav links, Footer links, browser Back/Forward) into state
  useEffect(() => {
    const urlCategory = isCategoryLocked && initialCategory
      ? initialCategory
      : (searchParams.get('category') || 'all');
    const urlSubcategory = searchParams.get('subcategory') || 'all';
    const urlSearch = searchParams.get('search') || '';
    const urlSizeParam = searchParams.get('size');
    const urlSizes = urlSizeParam ? urlSizeParam.split(',') : [];
    const urlSortBy = (searchParams.get('sortBy') as CatalogSortOption) || 'featured';
    const urlMinPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0;
    const urlMaxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 150000;
    const urlInStock = searchParams.get('inStock') === 'true';

    setFilters((prev) => {
      const sizesEqual =
        prev.selectedSizes.length === urlSizes.length &&
        prev.selectedSizes.every((s, i) => s === urlSizes[i]);

      if (
        prev.category === urlCategory &&
        prev.subcategory === urlSubcategory &&
        prev.searchQuery === urlSearch &&
        sizesEqual &&
        prev.sortBy === urlSortBy &&
        prev.minPrice === urlMinPrice &&
        prev.maxPrice === urlMaxPrice &&
        prev.inStockOnly === urlInStock
      ) {
        return prev;
      }

      return {
        ...prev,
        category: urlCategory,
        subcategory: urlSubcategory,
        searchQuery: urlSearch,
        selectedSizes: urlSizes,
        sortBy: urlSortBy,
        minPrice: urlMinPrice,
        maxPrice: urlMaxPrice,
        inStockOnly: urlInStock,
      };
    });
  }, [searchParams, initialCategory, isCategoryLocked]);

  // Synchronize filter updates from direct user actions to URL search parameters
  const updateUrlParams = (newFilters: CatalogFilterState) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (newFilters.searchQuery) params.set('search', newFilters.searchQuery);
    if (newFilters.category && newFilters.category !== 'all' && !isCategoryLocked) {
      params.set('category', newFilters.category);
    }
    if (newFilters.subcategory && newFilters.subcategory !== 'all') {
      params.set('subcategory', newFilters.subcategory);
    }
    if (newFilters.selectedSizes.length > 0) {
      params.set('size', newFilters.selectedSizes.join(','));
    }
    if (newFilters.minPrice > 0) params.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice < 150000) params.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.inStockOnly) params.set('inStock', 'true');
    if (newFilters.sortBy !== 'featured') params.set('sortBy', newFilters.sortBy);

    const queryString = params.toString();
    const newPath = queryString ? `?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newPath);
  };

  const handleFilterChange = (updates: Partial<CatalogFilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      updateUrlParams(next);
      return next;
    });
  };

  const handleReset = () => {
    const resetState: CatalogFilterState = {
      ...DEFAULT_FILTER_STATE,
      category: isCategoryLocked && initialCategory ? initialCategory : 'all',
    };
    setFilters(resetState);
    updateUrlParams(resetState);
  };

  const cleanInitialProducts = useMemo(() => {
    return initialProducts.map(normalizeProductSizes);
  }, [initialProducts]);

  // Filter products pure client-side
  const filteredProducts = useMemo(() => {
    return filterProducts(cleanInitialProducts, filters, language);
  }, [cleanInitialProducts, filters, language]);

  // Compute available sizes across the current category (visible active products only)
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    const pool =
      filters.category === 'all'
        ? cleanInitialProducts.filter(isProductVisibleInShop)
        : cleanInitialProducts.filter(
          (p) =>
            isProductVisibleInShop(p) &&
            (p.categoryId === resolveCategoryId(filters.category) ||
             p.categorySlug === filters.category)
        );
    pool.forEach((p) => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach((s) => sizeSet.add(s));
      }
    });
    return Array.from(sizeSet);
  }, [cleanInitialProducts, filters.category]);

  return (
    <div id="catalog-content" className="luxury-container py-8 md:py-12">
      {/* Top Controls: Search Bar & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-sand-200">
        <div className="flex-1 max-w-xl">
          <SearchBar
            value={filters.searchQuery}
            onChange={(val) => handleFilterChange({ searchQuery: val })}
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3">
          {/* Desktop Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsDesktopFilterOpen((prev) => !prev)}
            className="hidden lg:flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-sand-300 text-xs font-semibold uppercase tracking-wider text-obsidian-900 hover:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm"
            aria-expanded={isDesktopFilterOpen}
          >
            <SlidersHorizontal className="w-4 h-4 text-gold-700" />
            <span>
              {isDesktopFilterOpen
                ? t('catalog.filter.hide_desktop', 'Masquer les filtres')
                : t('catalog.filter.show_desktop', 'Afficher les filtres')}
            </span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-gold-600 text-obsidian-950 font-bold text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-sand-300 text-xs font-semibold uppercase tracking-wider text-obsidian-900 hover:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-gold-700" />
            <span>{t('catalog.filter.title', 'Filtres')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-gold-600 text-obsidian-950 font-bold text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <CatalogSortDropdown
            value={filters.sortBy}
            onChange={(val) => handleFilterChange({ sortBy: val })}
          />
        </div>
      </div>

      {/* Casual Quick Category Pill Navigation */}
      {!isCategoryLocked && (
        <div className="py-4 border-b border-sand-200">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs uppercase tracking-wider text-sand-800 font-semibold me-1 hidden sm:inline">
              {t('catalog.filter.quick_categories', 'Rayons :')}
            </span>
            {categories.map((cat) => {
              const isActive = resolvedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    handleFilterChange({
                      category: cat.id,
                      subcategory: 'all',
                    })
                  }
                  className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-obsidian-950 text-ivory border border-obsidian-950 shadow-sm'
                      : 'bg-white hover:bg-sand-100 text-obsidian-800 border border-sand-300'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Filter Badges */}
      <ActiveFilterBadges
        filters={filters}
        onRemoveSearch={() => handleFilterChange({ searchQuery: '' })}
        onRemoveCategory={() => handleFilterChange({ category: 'all' })}
        onRemoveSubcategory={() => handleFilterChange({ subcategory: 'all' })}
        onRemoveSize={(sz) =>
          handleFilterChange({
            selectedSizes: filters.selectedSizes.filter((s) => s !== sz),
          })
        }
        onRemoveInStock={() => handleFilterChange({ inStockOnly: false })}
        onRemovePrice={() =>
          handleFilterChange({ minPrice: 0, maxPrice: 150000 })
        }
        onResetAll={handleReset}
      />

      {/* Result Count and Grid Layout */}
      <div className="flex items-center justify-between pt-2 pb-6 text-xs text-neutral-600 font-sans">
        <span className="uppercase tracking-wider">
          {filteredProducts.length === 0 ? (
            t('catalog.results_count_zero', '0 création d\'exception')
          ) : (
            <>
              {filteredProducts.length}{' '}
              {filteredProducts.length > 1
                ? t('catalog.results_count_plural', 'Créations')
                : t('catalog.results_count_single', 'Création')}
            </>
          )}
        </span>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sidebar Filters (Desktop & Mobile Drawer) */}
        <CatalogFilterSidebar
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleReset}
          isOpenMobile={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
          isCategoryLocked={isCategoryLocked}
          availableSizes={availableSizes}
          isDesktopVisible={isDesktopFilterOpen}
        />

        {/* Product Grid or Zero Results */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <ProductGrid
              products={filteredProducts}
              columns={isDesktopFilterOpen ? 3 : 4}
            />
          ) : (
            <ZeroResults
              onReset={handleReset}
              query={filters.searchQuery}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogFallback() {
  const { t } = useLanguage();
  return (
    <div className="luxury-container py-16 text-center text-xs uppercase tracking-wider text-neutral-400">
      {t('catalog.loading', 'Chargement de la collection...')}
    </div>
  );
}

export function CatalogClient(props: CatalogClientProps) {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CatalogClientInner {...props} />
    </Suspense>
  );
}
