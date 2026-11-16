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

export interface ProductsManagementClientProps {
  initialProducts: Product[];
}

export function ProductsManagementClient({ initialProducts }: ProductsManagementClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
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
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
          const matchSub = p.subcategory.toLowerCase().includes(q);
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
  }, [products, selectedCategory, stockFilter, searchQuery, sortBy]);

  // Toggle Active / Draft (inStock)
  const handleToggleActive = async (product: Product) => {
    const newInStock = !product.inStock;
    const newStockQuantity = !newInStock ? 0 : product.stockQuantity <= 0 ? 10 : product.stockQuantity;

    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: newInStock, stockQuantity: newStockQuantity }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, inStock: newInStock, stockQuantity: newStockQuantity } : p
          )
        );
        showNotification(
          'success',
          `Produit "${product.title}" passé en ${newInStock ? 'Actif' : 'Brouillon'}.`
        );
      } else {
        showNotification('error', data.error || 'Échec de la modification du statut.');
      }
    } catch (err: any) {
      showNotification('error', 'Erreur réseau lors de la mise à jour.');
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
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        showNotification('success', 'Produit retiré définitivement du catalogue.');
        setProductToDelete(null);
      } else {
        showNotification('error', data.error || 'Échec de la suppression.');
      }
    } catch (err) {
      showNotification('error', 'Erreur réseau lors de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/15 pb-6">
        <div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-ivory">
            Catalogue & Stocks VIP TADJ
          </h1>
          <p className="text-xs sm:text-sm text-obsidian-300 mt-1">
            Supervision des pièces sartoriales, prix en DZD, pointures et disponiblités
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-sm bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-luxury-subtle shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nouveau Produit</span>
        </Link>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'p-4 rounded-sm flex items-center justify-between gap-3 text-xs animate-fade-in',
            notification.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gold-500/10 pb-3">
        {[
          { id: 'all', label: 'Tous les Articles', count: counts.all },
          { id: 'clothing', label: 'Vêtements', count: counts.clothing },
          { id: 'shoes', label: 'Chaussures', count: counts.shoes },
          { id: 'accessories', label: 'Accessoires', count: counts.accessories },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-sm text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
              selectedCategory === tab.id
                ? 'bg-obsidian-950 text-gold-400 border border-gold-500/40 shadow-luxury-subtle font-semibold'
                : 'text-obsidian-300 hover:text-ivory hover:bg-obsidian-900/60'
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                selectedCategory === tab.id
                  ? 'bg-gold-500/20 text-gold-400'
                  : 'bg-obsidian-800 text-obsidian-200'
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
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, référence SKU, sous-catégorie..."
            className="w-full ps-10 pe-10 py-2.5 rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-base md:text-xs placeholder:text-obsidian-400 focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute end-1 top-1/2 -translate-y-1/2 text-obsidian-300 hover:text-ivory min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
              aria-label="Effacer la recherche"
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
            className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-base md:text-xs focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="all">Tous les niveaux de stock</option>
            <option value="in-stock">En Stock (&gt; 5 unités)</option>
            <option value="low-stock">Stock Faible (1 - 5 unités)</option>
            <option value="out-of-stock">Rupture de Stock (0)</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="md:col-span-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-base md:text-xs focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <option value="newest">Plus récents d&apos;abord</option>
            <option value="price-desc">Prix décroissant (DZD)</option>
            <option value="price-asc">Prix croissant (DZD)</option>
            <option value="stock-desc">Stock décroissant</option>
            <option value="stock-asc">Stock croissant</option>
          </select>
        </div>
      </div>

      {/* High-Density Products Table */}
      <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 overflow-hidden shadow-luxury-subtle">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-obsidian-300 text-xs space-y-2">
            <p>Aucun produit ne correspond à vos critères de recherche.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setStockFilter('all');
              }}
              className="text-gold-400 hover:text-gold-300 underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead>
                  <tr className="border-b border-gold-500/15 bg-obsidian-900/60 text-obsidian-300 select-none">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">Visuel</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">Produit & Catégorie</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">Prix (DZD)</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">Stock & Tailles</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-start">Statut</th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-xs text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-500/5">
                  {filteredProducts.map((p) => {
                    const thumbnail = normalizeImageUrl(p.images[0]?.url || p.primaryImage || '');
                    const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 5;
                    const isOutOfStock = !p.inStock || p.stockQuantity === 0;

                    return (
                      <tr key={p.id} className="hover:bg-obsidian-900/50 transition-colors">
                        {/* 1. Thumbnail */}
                        <td className="py-3 px-4 w-16">
                          <div className="w-12 h-14 rounded-sm overflow-hidden border border-gold-500/20 bg-obsidian-900 shrink-0">
                            <img
                              src={thumbnail}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </td>

                        {/* 2. Product Title, SKU, Category */}
                        <td className="py-3 px-4 min-w-[240px]">
                          <div className="font-semibold text-ivory text-sm line-clamp-1">{p.title}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-sm text-xs font-semibold border',
                                p.categoryId === 'clothing' &&
                                  'bg-blue-950/60 text-blue-300 border-blue-800/60',
                                p.categoryId === 'shoes' &&
                                  'bg-amber-950/60 text-amber-300 border-amber-800/60',
                                p.categoryId === 'accessories' &&
                                  'bg-purple-950/60 text-purple-300 border-purple-800/60'
                              )}
                            >
                              {p.categoryId === 'clothing'
                                ? 'Vêtements'
                                : p.categoryId === 'shoes'
                                ? 'Chaussures'
                                : 'Accessoires'}
                            </span>
                            <span className="text-xs text-obsidian-200 capitalize">{p.subcategory}</span>
                            {p.sku && (
                              <span className="text-xs font-mono text-obsidian-300">
                                REF: {p.sku}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. Price DZD */}
                        <td className="py-3 px-4">
                          <div className="font-serif font-bold text-gold-400 text-sm">
                            {formatDZD(p.price)}
                          </div>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <div className="text-xs text-obsidian-300 line-through">
                              {formatDZD(p.compareAtPrice)}
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
                                  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                                isLowStock &&
                                  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                                isOutOfStock &&
                                  'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              )}
                            >
                              {isOutOfStock
                                ? 'Rupture'
                                : isLowStock
                                ? 'Stock Faible'
                                : 'En Stock'}
                            </span>
                            <span className="text-xs font-sans tabular-nums text-obsidian-200">
                              {p.stockQuantity} unité{p.stockQuantity > 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Size pills */}
                          {p.sizes && p.sizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                              {p.sizes.slice(0, 5).map((size) => (
                                <span
                                  key={size}
                                  className="px-2 py-0.5 rounded-sm bg-obsidian-900 border border-gold-500/10 text-xs text-obsidian-200 font-sans tabular-nums"
                                >
                                  {size}
                                </span>
                              ))}
                              {p.sizes.length > 5 && (
                                <span className="text-xs text-obsidian-300">
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
                            onClick={() => handleToggleActive(p)}
                            disabled={togglingId === p.id}
                            className={cn(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 disabled:opacity-50',
                              p.inStock ? 'bg-gold-500' : 'bg-obsidian-800'
                            )}
                            title={p.inStock ? 'Produit actif (cliquez pour passer en brouillon)' : 'Brouillon (cliquez pour activer)'}
                            aria-label={`Statut de ${p.title}`}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-obsidian-950 shadow ring-0 transition duration-200 ease-in-out',
                                p.inStock ? 'translate-x-5' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <span className="block text-xs text-obsidian-200 mt-0.5">
                            {p.inStock ? 'Actif' : 'Brouillon'}
                          </span>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3 px-4 text-end">
                          <div className="inline-flex items-center gap-1">
                            {/* Preview Link */}
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm text-obsidian-300 hover:text-gold-400 hover:bg-obsidian-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                              title="Aperçu Storefront"
                              aria-label={`Aperçu ${p.title}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            {/* Edit Link */}
                            <Link
                              href={`/admin/products/${p.id}`}
                              className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm text-obsidian-300 hover:text-gold-400 hover:bg-obsidian-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                              title="Éditer le produit"
                              aria-label={`Éditer ${p.title}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setProductToDelete(p)}
                              className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm text-obsidian-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                              title="Supprimer définitivement"
                              aria-label={`Supprimer ${p.title}`}
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
            <div className="md:hidden divide-y divide-gold-500/10">
              {filteredProducts.map((p) => {
                const thumbnail = normalizeImageUrl(p.images[0]?.url || p.primaryImage || '');
                const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 5;
                const isOutOfStock = !p.inStock || p.stockQuantity === 0;

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    {/* Top Section: Visual Thumbnail + Info + Price */}
                    <div className="flex gap-3 items-start">
                      <div className="w-16 h-20 rounded-lg overflow-hidden border border-gold-500/20 bg-obsidian-900 shrink-0">
                        <img
                          src={thumbnail}
                          alt={p.title}
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
                                'bg-blue-950/60 text-blue-300 border-blue-800/60',
                              p.categoryId === 'shoes' &&
                                'bg-amber-950/60 text-amber-300 border-amber-800/60',
                              p.categoryId === 'accessories' &&
                                'bg-purple-950/60 text-purple-300 border-purple-800/60'
                            )}
                          >
                            {p.categoryId === 'clothing'
                              ? 'Vêtements'
                              : p.categoryId === 'shoes'
                              ? 'Chaussures'
                              : 'Accessoires'}
                          </span>
                          <span className="text-xs text-obsidian-200 capitalize">{p.subcategory}</span>
                          {p.sku && (
                            <span className="text-xs font-mono text-obsidian-300">
                              REF: {p.sku}
                            </span>
                          )}
                        </div>

                        <h2 className="font-semibold text-ivory text-sm line-clamp-2 leading-snug text-balance">
                          {p.title}
                        </h2>

                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-serif font-bold text-gold-400 text-sm">
                            {formatDZD(p.price)}
                          </span>
                          {p.compareAtPrice && p.compareAtPrice > p.price && (
                            <span className="text-xs text-obsidian-300 line-through">
                              {formatDZD(p.compareAtPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock & Sizes Section */}
                    <div className="pt-2 border-t border-gold-500/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                            !isOutOfStock && !isLowStock &&
                              'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                            isLowStock &&
                              'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                            isOutOfStock &&
                              'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          )}
                        >
                          {isOutOfStock
                            ? 'Rupture'
                            : isLowStock
                            ? 'Stock Faible'
                            : 'En Stock'}
                        </span>
                        <span className="text-xs font-mono text-obsidian-200">
                          {p.stockQuantity} unité{p.stockQuantity > 1 ? 's' : ''}
                        </span>
                      </div>

                      {p.sizes && p.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.sizes.map((size) => (
                            <span
                              key={size}
                              className="px-2 py-0.5 rounded bg-obsidian-900 border border-gold-500/15 text-xs text-obsidian-200 font-mono"
                            >
                              {size}
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
                          onClick={() => handleToggleActive(p)}
                          disabled={togglingId === p.id}
                          className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                            p.inStock ? 'bg-gold-500' : 'bg-obsidian-800'
                          )}
                          title={p.inStock ? 'Produit actif' : 'Brouillon'}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-obsidian-950 shadow ring-0 transition duration-200 ease-in-out',
                              p.inStock ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                        <span className="text-xs font-medium text-obsidian-300">
                          {p.inStock ? 'Actif' : 'Brouillon'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm bg-obsidian-900 border border-gold-500/20 text-obsidian-300 hover:text-gold-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          title="Aperçu Storefront"
                          aria-label={`Aperçu ${p.title}`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <Link
                          href={`/admin/products/${p.id}`}
                          className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm bg-obsidian-900 border border-gold-500/20 text-obsidian-300 hover:text-gold-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          title="Éditer le produit"
                          aria-label={`Éditer ${p.title}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-2 min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-sm bg-obsidian-900 border border-gold-500/20 text-obsidian-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          title="Supprimer"
                          aria-label={`Supprimer ${p.title}`}
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isDeleting && setProductToDelete(null)}
          />
          <div className="relative w-full max-w-md rounded-sm bg-obsidian-950 border border-gold-500/30 p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 rounded-sm bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 id="delete-dialog-title" className="font-cinzel text-lg font-bold text-ivory">
                Confirmer la suppression
              </h2>
            </div>

            <p className="text-xs text-obsidian-200 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le produit suivant du catalogue VIP TADJ ? Cette action est irréversible.
            </p>

            {/* Product Snapshot */}
            <div className="p-3 rounded-sm bg-obsidian-900 border border-gold-500/15 flex items-center gap-3">
              <div className="w-12 h-14 rounded-sm overflow-hidden bg-obsidian-950 shrink-0">
                <img
                  src={normalizeImageUrl(productToDelete.images[0]?.url || productToDelete.primaryImage || '')}
                  alt={productToDelete.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ivory truncate">{productToDelete.title}</p>
                <p className="text-xs font-serif text-gold-400">{formatDZD(productToDelete.price)}</p>
                <p className="text-xs text-obsidian-200">{productToDelete.subcategory}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 min-h-[44px] rounded-sm bg-obsidian-900 hover:bg-obsidian-800 text-xs text-obsidian-300 hover:text-ivory transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 min-h-[44px] rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <span>Supprimer définitivement</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
