'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { OrderFilters, OrderDateFilter } from '@/components/admin/OrderFilters';
import { OrderTable } from '@/components/admin/OrderTable';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import { ShoppingBag, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';

function isSameCalendarDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isSameCalendarMonth(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth()
  );
}

interface OrdersManagementClientProps {
  initialOrders: Order[];
  initialStatus?: string;
}

export function OrdersManagementClient({
  initialOrders,
  initialStatus,
}: OrdersManagementClientProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Normalize initial tab status
  const paramStatus = searchParams?.get('status') || initialStatus || 'all';
  const validStatusList: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const defaultTab = validStatusList.includes(paramStatus as OrderStatus)
    ? (paramStatus as OrderStatus)
    : 'all';

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeStatus, setActiveStatus] = useState<'all' | OrderStatus>(defaultTab);
  const [dateFilter, setDateFilter] = useState<OrderDateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<number | 'all'>('all');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    order: Order | null;
    targetStatus?: OrderStatus;
  }>({
    isOpen: false,
    order: null,
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Compute live date range counts (today / this month / all)
  const dateCounts = useMemo<Record<OrderDateFilter, number>>(() => {
    const now = new Date();
    let today = 0;
    let thisMonth = 0;
    for (const o of orders) {
      if (activeStatus !== 'all' && o.status !== activeStatus) continue;
      const d = new Date(o.createdAt);
      if (isSameCalendarMonth(d, now)) {
        thisMonth += 1;
        if (isSameCalendarDay(d, now)) {
          today += 1;
        }
      }
    }
    const totalForScope = activeStatus === 'all'
      ? orders.length
      : orders.filter((o) => o.status === activeStatus).length;
    return {
      all: totalForScope,
      today,
      this_month: thisMonth,
    };
  }, [orders, activeStatus]);

  // Compute live tab counts (respecting active dateFilter)
  const counts = useMemo(() => {
    const res: Record<'all' | OrderStatus, number> = {
      all: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    const now = new Date();
    for (const o of orders) {
      if (dateFilter !== 'all') {
        const d = new Date(o.createdAt);
        if (dateFilter === 'today' && !isSameCalendarDay(d, now)) continue;
        if (dateFilter === 'this_month' && !isSameCalendarMonth(d, now)) continue;
      }
      res.all += 1;
      if (res[o.status] !== undefined) {
        res[o.status] += 1;
      }
    }
    return res;
  }, [orders, dateFilter]);

  // Multi-field filtered orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // 1. Status Filter
        if (activeStatus !== 'all' && order.status !== activeStatus) return false;

        // 2. Date Filter
        if (dateFilter !== 'all') {
          const d = new Date(order.createdAt);
          const now = new Date();
          if (dateFilter === 'today' && !isSameCalendarDay(d, now)) return false;
          if (dateFilter === 'this_month' && !isSameCalendarMonth(d, now)) return false;
        }

        // 3. Wilaya Filter
        if (wilayaFilter !== 'all' && order.customer.wilayaCode !== wilayaFilter) return false;

        // 4. Multi-field Search Token
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNumber = order.orderNumber?.toLowerCase().includes(q) ?? false;
          const matchName = order.customer?.fullName?.toLowerCase().includes(q) ?? false;
          const matchPhone = order.customer?.phone?.includes(q) ?? false;
          const wilayaObj = order.customer?.wilayaCode ? getWilayaByCode(order.customer.wilayaCode) : undefined;
          const communeObj =
            order.customer?.wilayaCode && order.customer?.commune
              ? findCommune(order.customer.wilayaCode, order.customer.commune)
              : undefined;
          const matchWilaya =
            (order.customer?.wilaya || '').toLowerCase().includes(q) ||
            (wilayaObj?.name || '').toLowerCase().includes(q) ||
            (wilayaObj?.nameAr || '').toLowerCase().includes(q);
          const matchCommune =
            (order.customer?.commune || '').toLowerCase().includes(q) ||
            (communeObj?.name || '').toLowerCase().includes(q) ||
            (communeObj?.nameAr || '').toLowerCase().includes(q);
          const isDesk = order.customer?.deliveryType === 'desk';
          const matchDelivery =
            (q === 'desk' || q === 'stop desk' || q === 'stopdesk' || q === 'مكتب')
              ? isDesk
              : (q === 'home' || q === 'domicile' || q === 'منزل')
              ? !isDesk
              : false;
          if (!matchNumber && !matchName && !matchPhone && !matchWilaya && !matchCommune && !matchDelivery) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return dateSort === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [orders, activeStatus, dateFilter, wilayaFilter, searchQuery, dateSort]);

  const isFiltered =
    activeStatus !== 'all' ||
    dateFilter !== 'all' ||
    wilayaFilter !== 'all' ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setActiveStatus('all');
    setDateFilter('all');
    setWilayaFilter('all');
    setSearchQuery('');
    setDateSort('newest');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      }
    } catch {
      // Fallback
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusModalSuccess = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    setNotification({
      type: 'success',
      message: t(
        'admin.orders.status_updated_toast',
        'Statut de la commande {orderNumber} mis à jour vers "{status}".'
      )
        .replace('{orderNumber}', updatedOrder.orderNumber)
        .replace('{status}', t(`status.${updatedOrder.status}`, updatedOrder.status)),
    });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleOpenStatusModal = (order: Order, defaultTarget?: OrderStatus) => {
    setModalState({
      isOpen: true,
      order,
      targetStatus: defaultTarget,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-obsidian-950 tracking-wider">
              {t('admin.orders.title', 'Gestion des Commandes')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gold-50 text-gold-700 font-mono text-xs font-bold border border-gold-500/40">
              {orders.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-obsidian-500 mt-1">
            {t('admin.orders.subtitle', 'Gestion du cycle de confirmation téléphonique, expédition Yalidine et encaissement COD.')}
          </p>
        </div>

        {counts.pending > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>
              <strong>{counts.pending}</strong> {t('admin.orders.pending_call_count', 'commande(s) en attente d\'appel de validation')}
            </span>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-obsidian-500 hover:text-obsidian-950 text-xs underline"
          >
            {t('common.close', 'Fermer')}
          </button>
        </div>
      )}

      {/* Filters & Status Tabs */}
      <OrderFilters
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        counts={counts}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        dateCounts={dateCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        wilayaFilter={wilayaFilter}
        onWilayaChange={setWilayaFilter}
        dateSort={dateSort}
        onDateSortChange={setDateSort}
        onReset={handleResetFilters}
        isFiltered={isFiltered}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Order Fulfillment Table */}
      <OrderTable
        orders={filteredOrders}
        onOpenStatusModal={handleOpenStatusModal}
        onResetFilters={handleResetFilters}
        isFiltered={isFiltered}
      />

      {/* Status Transition Modal */}
      <OrderStatusTransitionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, order: null })}
        order={modalState.order}
        initialTargetStatus={modalState.targetStatus}
        onSuccess={handleStatusModalSuccess}
      />
    </div>
  );
}
