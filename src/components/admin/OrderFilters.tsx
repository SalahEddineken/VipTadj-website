'use client';

import React from 'react';
import { OrderStatus } from '@/types';
import { ALGERIAN_58_WILAYAS } from '@/lib/data/wilayas';
import { Search, X, RotateCw, Filter, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';

export interface OrderFiltersProps {
  activeStatus: 'all' | OrderStatus;
  onStatusChange: (status: 'all' | OrderStatus) => void;
  counts: Record<'all' | OrderStatus, number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  wilayaFilter: number | 'all';
  onWilayaChange: (wilaya: number | 'all') => void;
  dateSort: 'newest' | 'oldest';
  onDateSortChange: (sort: 'newest' | 'oldest') => void;
  onReset: () => void;
  isFiltered: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function OrderFilters({
  activeStatus,
  onStatusChange,
  counts,
  searchQuery,
  onSearchChange,
  wilayaFilter,
  onWilayaChange,
  dateSort,
  onDateSortChange,
  onReset,
  isFiltered,
  onRefresh,
  isRefreshing,
}: OrderFiltersProps) {
  const { t } = useLanguage();

  const tabs: Array<{
    id: 'all' | OrderStatus;
    label: string;
    count: number;
    badgeStyle: string;
    pulse?: boolean;
  }> = [
    {
      id: 'all',
      label: t('admin.orders.tab.all', 'Toutes'),
      count: counts.all,
      badgeStyle: 'bg-obsidian-800 text-obsidian-300 border-obsidian-700',
    },
    {
      id: 'pending',
      label: t('admin.orders.tab.pending', 'En attente'),
      count: counts.pending,
      badgeStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      pulse: counts.pending > 0,
    },
    {
      id: 'confirmed',
      label: t('admin.orders.tab.confirmed', 'Confirmées'),
      count: counts.confirmed,
      badgeStyle: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    },
    {
      id: 'shipped',
      label: t('admin.orders.tab.shipped', 'Expédiées'),
      count: counts.shipped,
      badgeStyle: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    },
    {
      id: 'delivered',
      label: t('admin.orders.tab.delivered', 'Livrées'),
      count: counts.delivered,
      badgeStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'cancelled',
      label: t('admin.orders.tab.cancelled', 'Annulées'),
      count: counts.cancelled,
      badgeStyle: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal Status Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-sm bg-obsidian-950 border border-gold-500/15 shadow-luxury-subtle scrollbar-none">
        {tabs.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onStatusChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-sm text-xs font-medium whitespace-nowrap transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                isActive
                  ? 'bg-gradient-to-r from-gold-500/20 via-gold-500/15 to-transparent text-gold-300 border border-gold-500/40 shadow-luxury-glow font-semibold'
                  : 'text-obsidian-300 hover:text-ivory hover:bg-obsidian-900/60'
              )}
            >
              {tab.pulse && !isActive && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-bold border transition-colors',
                  isActive
                    ? 'bg-gold-500/25 text-gold-200 border-gold-500/40'
                    : tab.badgeStyle
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Multi-Field Search & Filter Controls Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Input Field */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-obsidian-300">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('admin.orders.search_placeholder', 'Rechercher par réf. VIP-2026-XXXX, client, tél 05/06/07, wilaya...')}
            className="w-full ps-10 pe-10 py-2.5 rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory placeholder-obsidian-400 text-base md:text-sm focus:outline-none focus:border-gold-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors shadow-luxury-subtle text-start"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 end-0 pe-1 min-w-[44px] min-h-[44px] flex items-center justify-center text-obsidian-400 hover:text-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
              aria-label={t('catalog.search.clear_aria', 'Effacer la recherche')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Algerian Wilayas Dropdown Filter */}
        <div className="w-full md:w-56">
          <select
            value={wilayaFilter}
            onChange={(e) =>
              onWilayaChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            aria-label={t('admin.orders.wilaya_filter_aria', 'Filtrer par Wilaya')}
            className="w-full px-3 py-2.5 rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-base md:text-sm focus:outline-none focus:border-gold-500/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors shadow-luxury-subtle appearance-none cursor-pointer min-h-[44px]"
          >
            <option value="all">{t('admin.orders.all_wilayas', 'Toutes les Wilayas (58)')}</option>
            {ALGERIAN_58_WILAYAS.map((w) => (
              <option key={w.code} value={w.code} className="bg-obsidian-900 text-ivory">
                {w.code < 10 ? `0${w.code}` : w.code} - {w.name} ({w.nameAr})
              </option>
            ))}
          </select>
        </div>

        {/* Date Sort Toggle */}
        <div className="w-full md:w-48">
          <button
            onClick={() => onDateSortChange(dateSort === 'newest' ? 'oldest' : 'newest')}
            className="w-full flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-sm bg-obsidian-950 border border-gold-500/20 text-xs sm:text-sm text-obsidian-300 hover:text-ivory hover:border-gold-500/40 transition-colors shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            title={t('admin.orders.sort_title', 'Trier par date de création')}
          >
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-400" />
              <span>{dateSort === 'newest' ? t('admin.orders.date_sort_newest', 'Plus récentes') : t('admin.orders.date_sort_oldest', 'Plus anciennes')}</span>
            </div>
            <span className="text-[10px] text-obsidian-500 uppercase">{t('admin.orders.sort_tag', 'Tri')}</span>
          </button>
        </div>

        {/* Refresh & Reset Buttons */}
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-obsidian-950 border border-gold-500/20 text-gold-400 hover:bg-obsidian-900 hover:border-gold-500/40 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title={t('admin.orders.refresh_title', 'Rafraîchir les commandes')}
              aria-label={t('admin.orders.refresh_aria', 'Rafraîchir')}
            >
              <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </button>
          )}

          {isFiltered && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-sm bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title={t('admin.orders.reset_filters', 'Réinitialiser tous les filtres')}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{t('admin.orders.reset_btn', 'Réinitialiser')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
