'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { Product } from '@/types';
import {
  CatalogFilterState,
  DEFAULT_FILTER_STATE,
  filterProducts,
  CatalogSortOption,
  resolveCategoryId,
} from '@/lib/utils/catalogUtils';
import { SearchBar } from './SearchBar';
import { CatalogSortDropdown } from './CatalogSortDropdown';
import { ActiveFilterBadges } from './ActiveFilterBadges';
import { CatalogFilterSidebar } from './CatalogFilterSidebar';
import { ProductGrid } from './ProductGrid';
import { ZeroResults } from './ZeroResults';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { useLanguage } from '@/lib/context/language-context';
import {
  getLocalizedProduct,
  getLocalizedCategoryName,
  getLocalizedSubcategory,
  getLocalizedSize,
} from '@/lib/i18n/catalog-translations';
import Link from 'next/link';

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
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

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

  // Handle ESC key for Quick View modal
  useEffect(() => {
    if (!quickViewProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuickViewProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickViewProduct]);

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

  // Filter products pure client-side
  const filteredProducts = useMemo(() => {
    return filterProducts(initialProducts, filters);
  }, [initialProducts, filters]);

  // Compute available sizes across the current category
  const availableSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    const pool =
      filters.category === 'all'
        ? initialProducts
        : initialProducts.filter(
          (p) =>
            p.categoryId === resolveCategoryId(filters.category) ||
            p.categorySlug === filters.category
        );
    pool.forEach((p) => {
      if (Array.isArray(p.sizes)) {
        p.sizes.forEach((s) => sizeSet.add(s));
      }
    });
    return Array.from(sizeSet);
  }, [initialProducts, filters.category]);

  const qvProduct = quickViewProduct ? getLocalizedProduct(quickViewProduct, language) : null;

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
          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white border border-sand-300 text-xs font-semibold uppercase tracking-wider text-obsidian-900 hover:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4 text-gold-700" />
            <span>{t('catalog.filter.title', 'Filtres')}</span>
          </button>

          {/* Sort Dropdown */}
          <CatalogSortDropdown
            value={filters.sortBy}
            onChange={(val) => handleFilterChange({ sortBy: val })}
          />
        </div>
      </div>

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
          {filteredProducts.length}{' '}
          {filteredProducts.length > 1
            ? t('catalog.results_count_plural', 'Créations')
            : t('catalog.results_count_single', 'Création')}
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
        />

        {/* Product Grid or Zero Results */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <ProductGrid
              products={filteredProducts}
              onQuickView={(p) => setQuickViewProduct(p)}
              columns={3}
            />
          ) : (
            <ZeroResults
              onReset={handleReset}
              query={filters.searchQuery}
            />
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && qvProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setQuickViewProduct(null);
            }
          }}
        >
          <div className="bg-ivory max-w-3xl w-full border border-sand-300 shadow-2xl relative p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 end-4 min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-obsidian-700 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
              aria-label={t('catalog.quick_view.close_aria', 'Fermer')}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="aspect-[3/4] bg-sand-100 overflow-hidden">
                <img
                  src={normalizeImageUrl(
                    quickViewProduct.images?.[0]?.url || '',
                    { width: 800, quality: 85 }
                  )}
                  alt={qvProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sand-800 font-sans text-start">
                  {(quickViewProduct.categorySlug ? getLocalizedCategoryName(quickViewProduct.categorySlug, language) : null) || quickViewProduct.categorySlug}
                  {' • '}
                  {(quickViewProduct.subcategory ? getLocalizedSubcategory(quickViewProduct.subcategory, language) : null) || quickViewProduct.subcategory}
                </p>
                <h3 className="luxury-serif-title text-2xl text-obsidian-950 text-start">
                  {qvProduct.title}
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-serif font-bold text-obsidian-950">
                    {formatDZD(quickViewProduct.price, { locale: language })}
                  </span>
                  {quickViewProduct.compareAtPrice && (
                    <span className="text-sm line-through text-neutral-500 font-sans">
                      {formatDZD(quickViewProduct.compareAtPrice, { locale: language })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed font-sans text-start">
                  {qvProduct.description}
                </p>
                {Array.isArray(quickViewProduct.sizes) && (
                  <div>
                    <span className="text-xs uppercase tracking-wider text-sand-800 font-medium block mb-2 text-start">
                      {t('catalog.quick_view.sizes', 'Tailles disponibles :')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {quickViewProduct.sizes.map((s) => (
                        <span
                          key={s}
                          className="px-2.5 py-1 text-xs border border-sand-300 bg-white"
                        >
                          {getLocalizedSize(s, language)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 flex flex-col gap-2">
                  <Link
                    href={`/catalog/${quickViewProduct.categorySlug || 'clothing'}/${quickViewProduct.slug}`}
                    onClick={() => setQuickViewProduct(null)}
                    className="btn-luxury-gold text-center text-xs uppercase tracking-[0.2em] py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    {t('catalog.quick_view.view_full', 'Voir la Fiche Complète')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
