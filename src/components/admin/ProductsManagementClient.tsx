'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Product, ProductCategoryType } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';
import { formatTranslation } from '@/lib/i18n/locales';
import {
  getLocalizedProduct,
  getLocalizedCategoryName,
  getLocalizedSubcategory,
  getLocalizedSize,
} from '@/lib/i18n/catalog-translations';
import { normalizeProductSizes } from '@/lib/utils/catalogUtils';

export interface ProductsManagementClientProps {
  initialProducts: Product[];
}

export function ProductsManagementClient({ initialProducts }: ProductsManagementClientProps) {
  const { language, t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(() => initialProducts.map(normalizeProductSizes));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategoryType>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock-desc' | 'stock-asc'>('newest');

  // Modal & Async states
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Keyboard accessibility for delete modal
  React.useEffect(() => {
    if (!productToDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        setProductToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productToDelete, isDeleting]);

  // Counts for Category Tabs
  const counts = useMemo(() => {
    const all = products.length;
    const clothing = products.filter((p) => p.categoryId === 'clothing').length;
    const shoes = products.filter((p) => p.categoryId === 'shoes').length;
    const accessories = products.filter((p) => p.categoryId === 'accessories').length;
    return { all, clothing, shoes, accessories };
  }, [products]);

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
          return false;
        }

        // Stock filter
        if (stockFilter === 'in-stock' && (!p.inStock || p.stockQuantity <= 5)) return false;
        if (stockFilter === 'low-stock' && (!p.inStock || p.stockQuantity === 0 || p.stockQuantity > 5)) return false;
        if (stockFilter === 'out-of-stock' && p.inStock && p.stockQuantity > 0) return false;

        // Search query
        if (searchQuery.trim()) {
          const normalizeSearch = (val: string) =>
            val
              .toLowerCase()
              .replace(/[\u064B-\u065F\u0670]/g, '')
              .replace(/[أإآ]/g, 'ا')
              .replace(/ة/g, 'ه')
              .replace(/ى/g, 'ي');
          const q = normalizeSearch(searchQuery.trim());
          const localizedTitle = getLocalizedProduct(p, language).title;
          const localizedSub = getLocalizedSubcategory(p.subcategory, language);
          const matchTitle =
            normalizeSearch(p.title).includes(q) ||
            normalizeSearch(localizedTitle).includes(q) ||
            (p.titleAr ? normalizeSearch(p.titleAr).includes(q) : false) ||
            (p.titleEn ? normalizeSearch(p.titleEn).includes(q) : false);
          const matchSku = p.sku ? p.sku.toLowerCase().includes(searchQuery.toLowerCase().trim()) : false;
          const matchSub =
            normalizeSearch(p.subcategory).includes(q) || normalizeSearch(localizedSub).includes(q);
          if (!matchTitle && !matchSku && !matchSub) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock-asc') return a.stockQuantity - b.stockQuantity;
        if (sortBy === 'stock-desc') return b.stockQuantity - a.stockQuantity;
        // Default newest
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
      });
  }, [products, selectedCategory, stockFilter, searchQuery, sortBy, language]);

  // Toggle Active / Draft (inStock)
  const handleToggleActive = async (product: Product) => {
    const newInStock = !product.inStock;
    const newStockQuantity = !newInStock ? 0 : product.stockQuantity <= 0 ? 10 : product.stockQuantity;
    const newStatus = newInStock ? 'active' : 'draft';

    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-lang': language,
        },
        body: JSON.stringify({
          inStock: newInStock,
          stockQuantity: newStockQuantity,
          status: newStatus,
          isActive: newInStock,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? {
                  ...p,
                  inStock: newInStock,
                  stockQuantity: newStockQuantity,
                  status: newStatus,
                  isActive: newInStock,
                }
              : p
          )
        );
        showNotification(
          'success',
          formatTranslation(t('admin.products.toggle_active_toast', 'Produit "{title}" passé en {status}.'), {
            title: getLocalizedProduct(product, language).title,
            status: newInStock
              ? t('admin.products.status_active', 'Actif')
              : t('admin.products.status_draft', 'Brouillon'),
          })
        );
      } else {
        showNotification(
          'error',
          data.errorKey
            ? t(data.errorKey, data.error)
            : language === 'fr' && data.error
            ? data.error
            : t('admin.products.status_change_error', 'Échec de la modification du statut.')
        );
      }
    } catch {
      showNotification('error', t('admin.products.network_error_update', 'Erreur réseau lors de la mise à jour.'));
    } finally {
      setTogglingId(null);
    }
  };

  // Delete product confirmation
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-lang': language,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        showNotification('success', t('admin.products.deleted_toast', 'Produit retiré définitivement du catalogue.'));
        setProductToDelete(null);
      } else {
        showNotification(
          'error',
          data.errorKey
            ? t(data.errorKey, data.error)
            : language === 'fr' && data.error
            ? data.error
            : t('admin.products.delete_error', 'Échec de la suppression.')
        );
      }
    } catch {
      showNotification('error', t('admin.products.network_error_delete', 'Erreur réseau lors de la suppression.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-obsidian-200 pb-6">
        <div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-obsidian-950">
            {t('admin.products.title', 'Gestion du Catalogue')}
          </h1>
          <p className="text-xs sm:text-sm text-obsidian-500 mt-1">
            {t('admin.products.supervision', 'Supervision des articles, prix en DZD, pointures et disponibilités')}
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-luxury-subtle shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('admin.products.new_btn', 'Nouveau Produit')}</span>
        </Link>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'p-4 rounded-sm flex items-center justify-between gap-3 text-xs animate-fade-in',
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            aria-label={t('common.close', 'Fermer')}
            className="p-1 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-obsidian-200 pb-3">
        {[
          { id: 'all', label: t('admin.products.tab_all', 'Tous les Articles'), count: counts.all },
          { id: 'clothing', label: t('admin.products.tab_clothing', 'Vêtements'), count: counts.clothing },
          { id: 'shoes', label: t('admin.products.tab_shoes', 'Chaussures'), count: counts.shoes },
          { id: 'accessories', label: t('admin.products.tab_accessories', 'Accessoires'), count: counts.accessories },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-sm text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
              selectedCategory === tab.id
                ? 'bg-white text-gold-800 border border-gold-500/40 shadow-luxury-subtle font-semibold'
                : 'text-obsidian-600 hover:text-obsidian-950 hover:bg-white/70'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                selectedCategory === tab.id
                  ? 'bg-gold-100 text-gold-800'
                  : 'bg-obsidian-200/70 text-obsidian-700'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Controls: Search, Stock Filter, Sort */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-6 relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.products.search_ph', 'Rechercher par titre, référence SKU, sous-catégorie...')}
            className="w-full ps-10 pe-10 py-2.5 rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-base md:text-xs placeholder:text-obsidian-400 focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-1 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-950 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
              aria-label={t('catalog.search.clear_aria', 'Effacer la recherche')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Stock Filter */}
        <div className="md:col-span-3">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-base md:text-xs focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="all">{t('admin.products.stock_filter_all', 'Tous les niveaux de stock')}</option>
            <option value="in-stock">{t('admin.products.stock_filter_in', 'En Stock (> 5 unités)')}</option>
            <option value="low-stock">{t('admin.products.stock_filter_low', 'Stock Faible (1 - 5 unités)')}</option>
            <option value="out-of-stock">{t('admin.products.stock_filter_out', 'Rupture de Stock (0)')}</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-base md:text-xs focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="newest">{t('admin.products.sort_newest', "Plus récents d'abord")}</option>
            <option value="price-desc">{t('admin.products.sort_price_desc', 'Prix décroissant (DZD)')}</option>
            <option value="price-asc">{t('admin.products.sort_price_asc', 'Prix croissant (DZD)')}</option>
            <option value="stock-desc">{t('admin.products.sort_stock_desc', 'Stock décroissant')}</option>
            <option value="stock-asc">{t('admin.products.sort_stock_asc', 'Stock croissant')}</option>
          </select>
        </div>
      </div>

      {/* High-Density Products Table */}
      <div className="rounded-sm bg-white border border-obsidian-200 overflow-hidden shadow-luxury-subtle">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-obsidian-500 text-xs space-y-2">
            <p>{t('admin.products.no_matches', 'Aucun produit ne correspond à vos critères de recherche.')}</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStockFilter('all');
              }}
              className="text-gold-700 hover:text-gold-800 underline font-semibold"
            >
              {t('admin.products.reset_filters', 'Réinitialiser les filtres')}
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-obsidian-200 bg-ivory-100 text-obsidian-600 select-none">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">{t('admin.products.th_image', 'Visuel')}</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">{t('admin.products.th_product', 'Produit & Catégorie')}</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">{t('admin.products.th_price', 'Prix (DZD)')}</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">{t('admin.products.th_stock', 'Stock & Tailles')}</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">{t('admin.products.th_status', 'Statut')}</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-end">{t('admin.products.th_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-obsidian-100">
                  {filteredProducts.map((p) => {
                    const thumbnail = normalizeImageUrl(p.images[0]?.url || p.primaryImage || '', {
                      fallbackCategory: p.categoryId,
                      language,
                    });
                    const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 5;
                    const isOutOfStock = !p.inStock || p.stockQuantity === 0;
                    const localizedProduct = getLocalizedProduct(p, language);

                    return (
                      <tr key={p.id} className="hover:bg-ivory-100/70 transition-colors">
                        {/* 1. Thumbnail */}
                        <td className="py-3 px-4 w-16">
                          <div className="w-12 h-14 rounded-sm overflow-hidden border border-obsidian-200 bg-ivory-100 shrink-0">
                            <img
                              src={thumbnail}
                              alt={localizedProduct.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </td>

                        {/* 2. Product Title, SKU, Category */}
                        <td className="py-3 px-4 min-w-[240px]">
                          <div className="font-semibold text-obsidian-950 text-sm line-clamp-1">{localizedProduct.title}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-sm text-xs font-semibold border',
                                p.categoryId === 'clothing' &&
                                  'bg-blue-50 text-blue-700 border-blue-200',
                                p.categoryId === 'shoes' &&
                                  'bg-amber-50 text-amber-800 border-amber-200',
                                p.categoryId === 'accessories' &&
                                  'bg-purple-50 text-purple-700 border-purple-200'
                              )}
                            >
                              {getLocalizedCategoryName(p.categoryId, language)}
                            </span>
                            <span className="text-xs text-obsidian-500 capitalize">{getLocalizedSubcategory(p.subcategory, language)}</span>
                            {p.sku && (
                              <span className="text-xs font-mono text-obsidian-400">
                                {t('admin.products.sku_prefix', 'RÉF :')} {p.sku}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Price DZD */}
                        <td className="py-3 px-4">
                          <div className="font-serif font-bold text-gold-700 text-sm">
                            {formatDZD(p.price, { locale: language })}
                          </div>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <div className="text-xs text-obsidian-400 line-through">
                              {formatDZD(p.compareAtPrice, { locale: language })}
                            </div>
                          )}
                        </td>

                        {/* 4. Stock & Sizes */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                                !isOutOfStock && !isLowStock &&
                                  'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                isLowStock &&
                                  'bg-amber-50 text-amber-800 border border-amber-200',
                                isOutOfStock &&
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                              )}
                            >
                              {isOutOfStock
                                ? t('admin.products.status_out_of_stock', 'Rupture')
                                : isLowStock
                                ? t('admin.products.status_low_stock', 'Stock Faible')
                                : t('admin.products.status_in_stock', 'En Stock')}
                            </span>
                            <span className="text-xs font-sans tabular-nums text-obsidian-600">
                              {formatTranslation(t('admin.products.units_count', '{count} unité(s)'), { count: p.stockQuantity })}
                            </span>
                          </div>

                          {/* Size pills */}
                          {p.sizes && p.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                              {p.sizes.slice(0, 5).map((size) => (
                                <span
                                  key={size}
                                  className="px-2 py-0.5 rounded-sm bg-ivory-100 border border-obsidian-200 text-xs text-obsidian-700 font-sans tabular-nums"
                                >
                                  {getLocalizedSize(size, language)}
                                </span>
                              ))}
                              {p.sizes.length > 5 && (
                                <span className="text-xs text-obsidian-500">
                                  +{p.sizes.length - 5}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 5. Active / Draft Toggle */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            dir="ltr"
                            onClick={() => handleToggleActive(p)}
                            disabled={togglingId === p.id}
                            className={cn(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-50',
                              p.inStock ? 'bg-gold-500' : 'bg-obsidian-200'
                            )}
                            title={
                              p.inStock
                                ? t('admin.products.toggle_to_draft_title', 'Produit actif (cliquez pour passer en brouillon)')
                                : t('admin.products.toggle_to_active_title', 'Brouillon (cliquez pour activer)')
                            }
                            aria-label={formatTranslation(t('admin.products.status_aria', 'Statut de {title}'), { title: localizedProduct.title })}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                                p.inStock ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <span className="block text-xs text-obsidian-500 mt-0.5">
                            {p.inStock ? t('admin.products.status_active', 'Actif') : t('admin.products.status_draft', 'Brouillon')}
                          </span>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3 px-4 text-end">
                          <div className="inline-flex items-center gap-1">
                            {/* Preview Link */}
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm text-obsidian-500 hover:text-gold-700 hover:bg-ivory-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                              title={t('admin.products.action_preview', 'Aperçu Storefront')}
                              aria-label={`${t('admin.products.action_preview', 'Aperçu Storefront')} ${localizedProduct.title}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5 rtl:-scale-x-100" />
                            </Link>

                            {/* Edit Link */}
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm text-obsidian-500 hover:text-gold-700 hover:bg-ivory-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                              title={t('admin.products.action_edit', 'Éditer le produit')}
                              aria-label={`${t('admin.products.action_edit', 'Éditer le produit')} ${localizedProduct.title}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm text-obsidian-500 hover:text-rose-700 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                              title={t('admin.products.action_delete', 'Supprimer définitivement')}
                              aria-label={`${t('admin.products.action_delete', 'Supprimer définitivement')} ${localizedProduct.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< md) */}
            <div className="md:hidden divide-y divide-obsidian-100">
              {filteredProducts.map((p) => {
                const thumbnail = normalizeImageUrl(p.images[0]?.url || p.primaryImage || '', {
                  fallbackCategory: p.categoryId,
                  language,
                });
                const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 5;
                const isOutOfStock = !p.inStock || p.stockQuantity === 0;
                const localizedProduct = getLocalizedProduct(p, language);

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    {/* Top Section: Visual Thumbnail + Info + Price */}
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-20 rounded-lg overflow-hidden border border-obsidian-200 bg-ivory-100 shrink-0">
                        <img
                          src={thumbnail}
                          alt={localizedProduct.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-semibold border',
                              p.categoryId === 'clothing' &&
                                'bg-blue-50 text-blue-700 border-blue-200',
                              p.categoryId === 'shoes' &&
                                'bg-amber-50 text-amber-800 border-amber-200',
                              p.categoryId === 'accessories' &&
                                'bg-purple-50 text-purple-700 border-purple-200'
                            )}
                          >
                            {getLocalizedCategoryName(p.categoryId, language)}
                          </span>
                          <span className="text-xs text-obsidian-500 capitalize">{getLocalizedSubcategory(p.subcategory, language)}</span>
                          {p.sku && (
                            <span className="text-xs font-mono text-obsidian-400">
                              {t('admin.products.sku_prefix', 'RÉF :')} {p.sku}
                            </span>
                          )}
                        </div>

                        <h2 className="font-semibold text-obsidian-950 text-sm line-clamp-2 leading-snug text-balance">
                          {localizedProduct.title}
                        </h2>

                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-serif font-bold text-gold-700 text-sm">
                            {formatDZD(p.price, { locale: language })}
                          </span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-xs text-obsidian-400 line-through">
                              {formatDZD(p.compareAtPrice, { locale: language })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock & Sizes Section */}
                    <div className="pt-2 border-t border-obsidian-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                            !isOutOfStock && !isLowStock &&
                              'bg-emerald-50 text-emerald-700 border border-emerald-200',
                            isLowStock &&
                              'bg-amber-50 text-amber-800 border border-amber-200',
                            isOutOfStock &&
                              'bg-rose-50 text-rose-700 border border-rose-200'
                          )}
                        >
                          {isOutOfStock
                            ? t('admin.products.status_out_of_stock', 'Rupture')
                            : isLowStock
                            ? t('admin.products.status_low_stock', 'Stock Faible')
                            : t('admin.products.status_in_stock', 'En Stock')}
                        </span>
                        <span className="text-xs font-mono text-obsidian-600">
                          {formatTranslation(t('admin.products.units_count', '{count} unité(s)'), { count: p.stockQuantity })}
                        </span>
                      </div>

                      {p.sizes && p.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.sizes.map((size) => (
                            <span
                              key={size}
                              className="px-2 py-0.5 rounded bg-ivory-100 border border-obsidian-200 text-xs text-obsidian-700 font-mono"
                            >
                              {getLocalizedSize(size, language)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Controls: Active Switch & Action Buttons */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          dir="ltr"
                          onClick={() => handleToggleActive(p)}
                          disabled={togglingId === p.id}
                          className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                            p.inStock ? 'bg-gold-500' : 'bg-obsidian-200'
                          )}
                          title={
                            p.inStock
                              ? t('admin.products.toggle_to_draft_title', 'Produit actif (cliquez pour passer en brouillon)')
                              : t('admin.products.toggle_to_active_title', 'Brouillon (cliquez pour activer)')
                          }
                          aria-label={formatTranslation(t('admin.products.status_aria', 'Statut de {title}'), { title: localizedProduct.title })}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                              p.inStock ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                        <span className="text-xs font-medium text-obsidian-600">
                          {p.inStock ? t('admin.products.status_active', 'Actif') : t('admin.products.status_draft', 'Brouillon')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-600 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          title={t('admin.products.action_preview', 'Aperçu Storefront')}
                          aria-label={`${t('admin.products.action_preview', 'Aperçu Storefront')} ${localizedProduct.title}`}
                        >
                          <ExternalLink className="w-4 h-4 rtl:-scale-x-100" />
                        </Link>

                        <Link
                          href={`/admin/products/${p.id}`}
                          className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-600 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          title={t('admin.products.action_edit', 'Éditer le produit')}
                          aria-label={`${t('admin.products.action_edit', 'Éditer le produit')} ${localizedProduct.title}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-600 hover:text-rose-700 hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          title={t('admin.products.action_delete', 'Supprimer définitivement')}
                          aria-label={`${t('admin.products.action_delete', 'Supprimer définitivement')} ${localizedProduct.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div
            className="fixed inset-0 bg-obsidian-950/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setProductToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-sm bg-white border border-obsidian-200 p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2 rounded-sm bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 id="delete-dialog-title" className="font-cinzel text-lg font-bold text-obsidian-950">
                {t('admin.products.delete_modal_title', 'Confirmer la suppression')}
              </h2>
            </div>

            <p className="text-xs text-obsidian-600 leading-relaxed">
              {t(
                'admin.products.delete_modal_desc',
                'Êtes-vous sûr de vouloir supprimer définitivement le produit suivant du catalogue VIP TADJ ? Cette action est irréversible.'
              )}
            </p>

            {/* Product Snapshot */}
            <div className="p-3 rounded-sm bg-ivory-100 border border-obsidian-200 flex items-center gap-3">
              <div className="w-12 h-14 rounded-sm overflow-hidden bg-white border border-obsidian-200 shrink-0">
                <img
                  src={normalizeImageUrl(productToDelete.images[0]?.url || productToDelete.primaryImage || '', {
                    fallbackCategory: productToDelete.categoryId,
                    language,
                  })}
                  alt={getLocalizedProduct(productToDelete, language).title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-obsidian-950 truncate">
                  {getLocalizedProduct(productToDelete, language).title}
                </p>
                <p className="text-xs font-serif text-gold-700">
                  {formatDZD(productToDelete.price, { locale: language })}
                </p>
                <p className="text-xs text-obsidian-500">
                  {getLocalizedSubcategory(productToDelete.subcategory, language)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 min-h-[44px] rounded-sm bg-white border border-obsidian-200 hover:bg-ivory-100 text-xs text-obsidian-700 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {t('admin.products.btn_cancel', 'Annuler')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 min-h-[44px] rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>{t('admin.products.btn_deleting', 'Suppression...')}</span>
                  </>
                ) : (
                  <span>{t('admin.products.btn_confirm_delete', 'Supprimer définitivement')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
