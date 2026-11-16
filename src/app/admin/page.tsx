'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  Shirt,
  ShoppingCart,
  PlusCircle,
  PhoneCall,
  Sliders,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  PackageCheck,
} from 'lucide-react';
import { getDataStore } from '@/lib/data-provider';
import { Order, Product } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { computeAdminKPIs, DashboardKPIs } from '@/lib/admin/kpi-calculator';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';
import { useAdminNotification } from '@/lib/context/admin-notification-context';

export default function AdminDashboardPage() {
  const { language, t } = useLanguage();
  const { refreshPendingCount } = useAdminNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // In browser runtime, query live server API routes for real persisted orders and products
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders', { cache: 'no-store' }),
          fetch('/api/products', { cache: 'no-store' }),
        ]);

        if (ordersRes.ok && productsRes.ok) {
          const [ordersData, productsData] = await Promise.all([
            ordersRes.json(),
            productsRes.json(),
          ]);

          if (Array.isArray(ordersData.orders)) {
            setOrders(ordersData.orders);
          }
          if (Array.isArray(productsData.products)) {
            setProducts(productsData.products);
          }
          return;
        }
      }

      // Fallback for tests or SSR
      const store = getDataStore();
      const [fetchedOrders, fetchedProducts] = await Promise.all([
        store.getOrders(),
        store.getProducts(),
      ]);
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('[VIP TADJ Admin] Failed to load dashboard data:', err);
      try {
        const store = getDataStore();
        const [fetchedOrders, fetchedProducts] = await Promise.all([
          store.getOrders(),
          store.getProducts(),
        ]);
        setOrders(fetchedOrders);
        setProducts(fetchedProducts);
      } catch {
        // Graceful error fallback
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh every 15 seconds to keep the dashboard in real-time sync
    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadData(),
      refreshPendingCount?.(),
    ]);
  };

  const kpis: DashboardKPIs = useMemo(
    () => computeAdminKPIs(orders, products),
    [orders, products]
  );

  const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockQuantity <= 3).slice(0, 5),
    [products]
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/15 pb-6">
        <div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-ivory text-balance">
            {t('admin.dashboard.title', 'Command Center Commercial')}
          </h1>
          <p className="text-xs sm:text-sm text-obsidian-300 mt-1">
            {t('admin.dashboard.subtitle', 'Pilotage en direct des ventes, commandes COD 58 Wilayas et catalogue VIP TADJ')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-sm bg-obsidian-950 border border-gold-500/25 text-xs text-gold-400 hover:bg-obsidian-800 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
            <span>{t('admin.dashboard.refresh', 'Actualiser')}</span>
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 rounded-sm bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider transition-colors shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('admin.dashboard.new_product', 'Nouveau Produit')}</span>
          </Link>
        </div>
      </div>

      {/* Urgent Pending Orders Attention Banner */}
      {kpis.pendingCount > 0 && (
        <div className="p-4 rounded-sm bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-amber-500/20 text-amber-400">
              <PhoneCall className="w-5 h-5 animate-pulse motion-reduce:animate-none" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                {kpis.pendingCount} {t('admin.orders.pending_call_count', "commande(s) en attente d'appel de validation")}
              </p>
              <p className="text-xs text-amber-300/80">
                {t('admin.dashboard.pending_desc', 'Appels de confirmation recommandés sous 2h pour respecter les délais de livraison 58 Wilayas.')}
              </p>
            </div>
          </div>
          <Link
            href="/admin/orders?status=pending"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-obsidian-950 text-xs font-bold uppercase tracking-wider shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <span>{t('admin.dashboard.process_queue', 'Traiter la file')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-90" />
          </Link>
        </div>
      )}

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-2">
          <div className="flex items-center justify-between text-obsidian-200">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t('admin.kpi.revenue', 'Chiffre d’Affaires')}
            </span>
            <div className="p-2 rounded-sm bg-gold-500/10 text-gold-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-gold-300 tracking-tight">
            {formatDZD(kpis.totalRevenue, { locale: language })}
          </div>
          <p className="text-xs text-obsidian-300">
            {t('admin.dashboard.kpi_revenue_note', 'Commandes confirmées, expédiées et livrées')}
          </p>
        </div>

        {/* Pending Orders */}
        <div className="p-5 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-2">
          <div className="flex items-center justify-between text-obsidian-200">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t('admin.kpi.pending_calls', 'En Attente d’Appel')}
            </span>
            <div className="p-2 rounded-sm bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-ivory flex items-center gap-2">
            <span>{kpis.pendingCount}</span>
            {kpis.pendingCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t('admin.dashboard.kpi_pending_badge', 'Action requise')}
              </span>
            )}
          </div>
          <p className="text-xs text-obsidian-300">
            {t('admin.dashboard.kpi_pending_note', 'À valider par téléphone avant expédition')}
          </p>
        </div>

        {/* Active Products */}
        <div className="p-5 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-2">
          <div className="flex items-center justify-between text-obsidian-200">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t('admin.kpi.active_products', 'Catalogue Actif')}
            </span>
            <div className="p-2 rounded-sm bg-blue-500/10 text-blue-400">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-ivory">
            {kpis.activeProductsCount}{' '}
            <span className="text-sm font-normal text-obsidian-200">
              / {kpis.totalProductsCount} {t('admin.dashboard.stock_articles', 'articles')}
            </span>
          </div>
          <p className="text-xs text-obsidian-300">
            {t('admin.dashboard.kpi_products_note', 'Prêt-à-porter, souliers et maroquinerie')}
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-2">
          <div className="flex items-center justify-between text-obsidian-200">
            <span className="text-xs font-medium uppercase tracking-wider">
              {t('admin.kpi.aov', 'Panier Moyen (AOV)')}
            </span>
            <div className="p-2 rounded-sm bg-emerald-500/10 text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-ivory tracking-tight">
            {formatDZD(kpis.aov, { locale: language })}
          </div>
          <p className="text-xs text-obsidian-300">
            {t('admin.dashboard.kpi_aov_note', 'Moyenne sur les commandes validées')}
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/products/new"
          className="p-4 rounded-sm bg-obsidian-950 border border-gold-500/15 hover:border-gold-500/40 transition-all flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-gold-500/10 text-gold-400 group-hover:bg-gold-500 group-hover:text-obsidian-950 transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ivory">
                {t('admin.dashboard.quick_add_title', 'Ajouter un Produit')}
              </p>
              <p className="text-xs text-obsidian-300">
                {t('admin.dashboard.quick_add_desc', 'Création costume, souliers, accessoires')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-obsidian-300 group-hover:text-gold-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-all" />
        </Link>

        <Link
          href="/admin/orders?status=pending"
          className="p-4 rounded-sm bg-obsidian-950 border border-gold-500/15 hover:border-gold-500/40 transition-all flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-obsidian-950 transition-colors">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ivory">
                {t('admin.dashboard.quick_phone_title', 'Validation Téléphonique')}
              </p>
              <p className="text-xs text-obsidian-300">
                {t('admin.dashboard.quick_phone_desc', 'File active des commandes COD')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-obsidian-300 group-hover:text-amber-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-all" />
        </Link>

        <Link
          href="/admin/settings"
          className="p-4 rounded-sm bg-obsidian-950 border border-gold-500/15 hover:border-gold-500/40 transition-all flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-obsidian-950 transition-colors">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ivory">
                {t('admin.dashboard.quick_rates_title', 'Tarifs 58 Wilayas')}
              </p>
              <p className="text-xs text-obsidian-300">
                {t('admin.dashboard.quick_rates_desc', 'Frais de livraison et seuil gratuit')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-obsidian-300 group-hover:text-purple-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 rtl:rotate-180 transition-all" />
        </Link>
      </div>

      {/* Main Split Section: Recent Orders & Catalog Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Feed (2 cols) */}
        <div className="lg:col-span-2 bg-obsidian-950 border border-gold-500/20 rounded-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gold-500/10 pb-3">
            <div>
              <h2 className="font-cinzel text-base font-bold text-ivory">
                {t('admin.dashboard.recent_orders_title', 'Dernières Commandes COD')}
              </h2>
              <p className="text-xs text-obsidian-300">
                {t('admin.dashboard.recent_orders_desc', 'Commandes reçues récemment via le storefront')}
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-gold-400 hover:text-gold-300 font-medium flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <span>{t('admin.dashboard.view_all', 'Voir tout')}</span>
              <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-obsidian-300 text-xs">
              {t('admin.dashboard.loading_orders', 'Chargement des commandes...')}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-obsidian-300 text-xs">
              {t('admin.dashboard.no_orders', 'Aucune commande enregistrée pour le moment.')}
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead>
                    <tr className="text-obsidian-200 border-b border-gold-500/10">
                      <th className="pb-2 font-medium text-start">{t('admin.dashboard.th_ref', 'Réf.')}</th>
                      <th className="pb-2 font-medium text-start">{t('admin.dashboard.th_customer', 'Client')}</th>
                      <th className="pb-2 font-medium text-start">{t('admin.dashboard.th_wilaya', 'Wilaya')}</th>
                      <th className="pb-2 font-medium text-start">{t('admin.dashboard.th_amount', 'Montant')}</th>
                      <th className="pb-2 font-medium text-start">{t('admin.dashboard.th_status', 'Statut')}</th>
                      <th className="pb-2 font-medium text-end">{t('admin.dashboard.th_action', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-500/5">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-obsidian-900/50 transition-colors">
                        <td className="py-3 font-mono font-medium text-gold-400">
                          {order.orderNumber}
                        </td>
                        <td className="py-3">
                          <div className="text-ivory font-medium">{order.customer.fullName}</div>
                          <div className="text-xs text-obsidian-300">{order.customer.phone}</div>
                        </td>
                        <td className="py-3 text-obsidian-300">{order.customer.wilaya}</td>
                        <td className="py-3 font-medium text-ivory font-serif">
                          {formatDZD(order.total, { locale: language })}
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                              order.status === 'pending' &&
                                'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                              order.status === 'confirmed' &&
                                'bg-blue-500/15 text-blue-400 border border-blue-500/30',
                              order.status === 'shipped' &&
                                'bg-purple-500/15 text-purple-400 border border-purple-500/30',
                              order.status === 'delivered' &&
                                'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                              order.status === 'cancelled' &&
                                'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            )}
                          >
                            {t(`status.${order.status}`, order.status)}
                          </span>
                        </td>
                        <td className="py-3 text-end">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs text-gold-400 hover:text-gold-300 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          >
                            {t('admin.orders.action.details', 'Détails')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-gold-500/10 space-y-3 pt-1">
                {recentOrders.map((order) => (
                  <div key={order.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-gold-400 text-xs">
                        {order.orderNumber}
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider',
                          order.status === 'pending' &&
                            'bg-amber-500/15 text-amber-400 border border-amber-500/30',
                          order.status === 'confirmed' &&
                            'bg-blue-500/15 text-blue-400 border border-blue-500/30',
                          order.status === 'shipped' &&
                            'bg-purple-500/15 text-purple-400 border border-purple-500/30',
                          order.status === 'delivered' &&
                            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
                          order.status === 'cancelled' &&
                            'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        )}
                      >
                        {t(`status.${order.status}`, order.status)}
                      </span>
                    </div>

                    <div className="flex items-start justify-between text-xs gap-2">
                      <div>
                        <div className="text-ivory font-medium">{order.customer.fullName}</div>
                        <div className="text-xs text-obsidian-200 font-sans tabular-nums mt-0.5">
                          {order.customer.phone} • {order.customer.wilaya}
                        </div>
                      </div>
                      <div className="text-end shrink-0">
                        <div className="font-serif font-bold text-gold-400 text-sm">
                          {formatDZD(order.total, { locale: language })}
                        </div>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs text-gold-400 hover:text-gold-300 font-medium inline-flex items-center gap-0.5 mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        >
                          <span>{t('admin.orders.action.details', 'Détails')}</span>
                          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Catalog Health & Stock Alerts (1 col) */}
        <div className="bg-obsidian-950 border border-gold-500/20 rounded-sm p-5 space-y-4">
          <div className="border-b border-gold-500/10 pb-3">
            <h2 className="font-cinzel text-base font-bold text-ivory">
              {t('admin.dashboard.stock_health_title', 'Santé du Stock')}
            </h2>
            <p className="text-xs text-obsidian-300">
              {t('admin.dashboard.stock_health_desc', 'Articles en stock critique ou rupture')}
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-8 text-center text-xs text-obsidian-300">
                {t('admin.dashboard.stock_health_loading', 'Analyse du catalogue...')}
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
                <PackageCheck className="w-8 h-8 text-emerald-400/50" />
                <span>{t('admin.dashboard.stock_optimal', 'Tous les stocks sont au niveau optimal')}</span>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-sm bg-obsidian-900 border border-gold-500/10 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-ivory truncate">{p.title}</p>
                    <p className="text-xs text-obsidian-200">{p.subcategory}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded text-xs font-semibold',
                        p.stockQuantity === 0
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      )}
                    >
                      {p.stockQuantity === 0
                        ? t('admin.dashboard.stock_out', 'Rupture')
                        : t('admin.dashboard.stock_remaining', '{count} restant(s)').replace('{count}', String(p.stockQuantity))}
                    </span>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-xs text-gold-400 hover:text-gold-300 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      {t('admin.dashboard.manage', 'Gérer')}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
