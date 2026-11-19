'use client';

import React from 'react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { formatDZD } from '@/lib/utils/formatDZD';
import { formatTelLink, generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';
import { getLocalizedProduct, getLocalizedSize } from '@/lib/i18n/catalog-translations';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';
import {
  Eye,
  PhoneCall,
  MessageCircle,
  Clock,
  MapPin,
  Package,
  ArrowRight,
  AlertCircle,
  Truck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';

export interface OrderTableProps {
  orders: Order[];
  onOpenStatusModal?: (order: Order, defaultTarget?: OrderStatus) => void;
  onResetFilters?: () => void;
  isFiltered?: boolean;
}

export function OrderTable({
  orders,
  onOpenStatusModal,
  onResetFilters,
  isFiltered,
}: OrderTableProps) {
  const { language, t } = useLanguage();

  // Format dates according to active locale
  const formatOrderDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const isToday = new Date().toDateString() === date.toDateString();
      const locale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';
      const timeStr = date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dateStr = date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      return { isToday, display: `${dateStr} ${timeStr}` };
    } catch {
      return { isToday: false, display: isoString };
    }
  };

  const totalDZDRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  if (orders.length === 0) {
    return (
      <div className="rounded-sm bg-white border border-obsidian-200 p-12 text-center shadow-luxury-subtle">
        <div className="w-14 h-14 rounded-sm bg-gold-50 border border-gold-500/30 flex items-center justify-center mx-auto mb-4 text-gold-600">
          <Package className="w-7 h-7" />
        </div>
        <h3 className="font-cinzel text-lg font-bold text-obsidian-950 mb-2">
          {t('admin.orders.empty_title', 'Aucune commande trouvée')}
        </h3>
        <p className="text-sm text-obsidian-500 max-w-md mx-auto mb-6">
          {isFiltered
            ? t('admin.orders.empty_filtered', 'Aucune commande ne correspond aux filtres de recherche sélectionnés. Modifiez vos critères ou réinitialisez les filtres.')
            : t('admin.orders.empty_desc', 'Aucune commande enregistrée pour le moment. Les commandes passées depuis la boutique apparaîtront ici.')}
        </p>
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-sm bg-gold-50 text-gold-800 border border-gold-500/40 hover:bg-gold-100 transition-colors text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {t('admin.orders.reset_filters', 'Réinitialiser les filtres')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="block md:table w-full text-start border-collapse">
          <thead className="hidden md:table-header-group bg-ivory-100 border-b border-obsidian-200 text-xs uppercase tracking-wider text-obsidian-600 font-semibold select-none">
            <tr>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_ref', 'Réf. Commande')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_customer', 'Client & Tél.')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_items', 'Articles & Tailles')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_amount', 'Montant COD')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_status', 'Statut')}</th>
              <th className="py-3.5 px-4 text-end">{t('admin.orders.th_actions', 'Actions Rapides')}</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group divide-y divide-obsidian-100 text-xs sm:text-sm">
            {orders.map((order) => {
              const { isToday, display: dateDisplay } = formatOrderDate(order.createdAt);
              const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
              const primaryItem = order.items[0];
              const wilayaObj = order.customer.wilayaCode ? getWilayaByCode(order.customer.wilayaCode) : undefined;
              const communeObj =
                order.customer.wilayaCode && order.customer.commune
                  ? findCommune(order.customer.wilayaCode, order.customer.commune)
                  : undefined;
              const localizedWilaya =
                language === 'ar'
                  ? wilayaObj?.nameAr || order.customer.wilaya
                  : wilayaObj?.name || order.customer.wilaya;
              const localizedCommune =
                language === 'ar'
                  ? communeObj?.nameAr || order.customer.commune
                  : communeObj?.name || order.customer.commune;

              return (
                <tr
                  key={order.id}
                  className="block md:table-row p-4 md:p-0 hover:bg-ivory-100/70 transition-colors group space-y-3 md:space-y-0"
                >
                  {/* Reference & Date (+ mobile status badge) */}
                  <td className="flex items-center justify-between md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-gold-700 hover:text-gold-800 transition-colors inline-flex items-center gap-1.5 text-sm md:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                      >
                        <span dir="ltr">{order.orderNumber}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-obsidian-500">
                        <Clock className="w-3.5 h-3.5 text-obsidian-400" />
                        <span>{dateDisplay}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-sm bg-gold-50 border border-gold-500/30 text-gold-700 font-bold text-xs uppercase tracking-wider">
                            {t('admin.orders.today', 'Aujourd’hui')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="md:hidden">
                      <OrderStatusBadge status={order.status} size="sm" />
                    </div>
                  </td>

                  {/* Customer Information (Clean hierarchy, no nested box) */}
                  <td className="block md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div className="space-y-1">
                      <div className="font-medium text-obsidian-950 text-sm">{order.customer.fullName}</div>
                      <div className="flex items-center gap-2">
                        <a
                          href={formatTelLink(order.customer.phone)}
                          dir="ltr"
                          className="font-sans tabular-nums text-xs text-gold-700 md:text-obsidian-700 hover:text-gold-700 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                          title={t('admin.orders.action_call_title', 'Appeler le client')}
                        >
                          <PhoneCall className="w-3 h-3 text-gold-600" />
                          <span dir="ltr">{order.customer.phone}</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-obsidian-500">
                        <MapPin className="w-3 h-3 text-obsidian-400 shrink-0" />
                        <span className="truncate max-w-[260px] md:max-w-[180px]">
                          {order.customer.wilayaCode} - {localizedWilaya} ({localizedCommune})
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Items Breakdown */}
                  <td className="block md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div className="font-medium text-obsidian-950 text-xs sm:text-sm">
                      {t('admin.orders.items_count', '{count} article(s)').replace('{count}', String(itemsCount))}
                    </div>
                    {primaryItem && (
                      <div className="mt-1 text-xs text-obsidian-500 line-clamp-1 max-w-[260px] md:max-w-[220px]">
                        {getLocalizedProduct(primaryItem, language).title}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-800 font-sans tabular-nums text-xs"
                        >
                          {getLocalizedSize(item.selectedSize, language)} (x{item.quantity})
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs text-obsidian-500 font-medium">
                          {t('admin.orders.more_items', '+{count} autres').replace('{count}', String(order.items.length - 3))}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total COD Amount */}
                  <td className="flex items-center justify-between md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div>
                      <div className="font-serif font-bold text-obsidian-950 text-base whitespace-nowrap">
                        {formatDZD(order.total, { locale: language })}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-gold-50 border border-gold-500/30 text-xs text-gold-700 uppercase tracking-wider font-semibold">
                        {t('admin.orders.cod_cash', 'COD Espèces')}
                      </div>
                    </div>
                  </td>

                  {/* Lifecycle Status Badge (desktop) */}
                  <td className="hidden md:table-cell py-4 px-4 align-top">
                    <OrderStatusBadge status={order.status} size="sm" />
                    {order.courier?.trackingCode && (
                      <div className="mt-1.5 text-xs font-mono text-obsidian-600 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-purple-600" />
                        <span dir="ltr">{order.courier.trackingCode}</span>
                      </div>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="block md:table-cell pt-2 md:pt-4 pb-0 md:pb-4 px-0 md:px-4 align-top md:text-end border-t border-obsidian-100 md:border-none">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Inspect Order Details */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-700 hover:text-obsidian-950 hover:border-gold-500 hover:bg-ivory-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        title={t('admin.orders.action.details', 'Consulter le dossier de commande')}
                        aria-label={t('admin.orders.action.details', 'Inspecter la commande')}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* 1-Click Phone Call */}
                      <a
                        href={formatTelLink(order.customer.phone)}
                        dir="ltr"
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-gold-50 border border-gold-500/30 text-gold-700 hover:bg-gold-100 hover:border-gold-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        title={t('admin.orders.action_call_title', 'Appeler immédiatement le client')}
                        aria-label={t('admin.orders.action_call_title', 'Appeler le client')}
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>

                      {/* 1-Click WhatsApp Concierge */}
                      <a
                        href={generateWhatsAppConfirmLink(order, undefined, language)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        title={t('admin.orders.action_whatsapp_title', 'Envoyer message de confirmation WhatsApp')}
                        aria-label={t('admin.orders.action_whatsapp_title', 'Envoyer confirmation WhatsApp')}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      {/* Status Transition Trigger Modal */}
                      {onOpenStatusModal && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => onOpenStatusModal(order)}
                          className={cn(
                            'px-2.5 py-1.5 min-h-[44px] rounded-sm border text-xs font-semibold transition-all inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                            order.status === 'pending'
                              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              : order.status === 'confirmed'
                              ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          )}
                          title={t('admin.orders.action_advance_title', 'Faire avancer le statut')}
                          aria-label={t('admin.orders.action_advance_title', 'Modifier le statut')}
                        >
                          {order.status === 'pending' && (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="inline">{t('admin.orders.action.validate', 'Valider')}</span>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <>
                              <Truck className="w-3.5 h-3.5" />
                              <span className="inline">{t('admin.orders.action.ship', 'Expédier')}</span>
                            </>
                          )}
                          {order.status === 'shipped' && (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span className="inline">{t('admin.orders.action.deliver', 'Livrer')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Financial Recap & Order Count */}
      <div className="p-4 bg-ivory-100 border-t border-obsidian-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-obsidian-600">
        <div className="flex items-center gap-2">
          <span>{t('admin.orders.orders_count', '{count} commande(s)').replace('{count}', String(orders.length))}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>{t('admin.orders.total_display_value', 'Valeur totale affichée :')}</span>
          <span className="font-serif font-bold text-gold-700 text-sm">
            {formatDZD(orders.reduce((sum, o) => sum + o.total, 0), { locale: language })}
          </span>
        </div>
      </div>
    </div>
  );
}
