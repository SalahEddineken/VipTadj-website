'use client';

import React from 'react';
import Link from 'next/link';
import { Order, OrderStatus } from '@/types';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { formatDZD } from '@/lib/utils/formatDZD';
import { formatTelLink, generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';
import { getLocalizedSize } from '@/lib/i18n/catalog-translations';
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
      <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 p-12 text-center shadow-luxury-subtle">
        <div className="w-14 h-14 rounded-sm bg-obsidian-900 border border-gold-500/30 flex items-center justify-center mx-auto mb-4 text-gold-400">
          <Package className="w-7 h-7" />
        </div>
        <h3 className="font-cinzel text-lg font-bold text-ivory mb-2">
          {t('admin.orders.empty_title', 'Aucune commande trouvée')}
        </h3>
        <p className="text-sm text-obsidian-200 max-w-md mx-auto mb-6">
          {isFiltered
            ? t('admin.orders.empty_filtered', 'Aucune commande ne correspond aux filtres de recherche sélectionnés. Modifiez vos critères ou réinitialisez les filtres.')
            : t('admin.orders.empty_desc', 'Aucune commande enregistrée pour le moment. Les commandes passées depuis la boutique apparaîtront ici.')}
        </p>
        {isFiltered && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-sm bg-gold-500/15 text-gold-300 border border-gold-500/40 hover:bg-gold-500/25 transition-colors text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {t('admin.orders.reset_filters', 'Réinitialiser les filtres')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle overflow-hidden">
      <div className="overflow-x-auto">
        <table className="block md:table w-full text-start border-collapse">
          <thead className="hidden md:table-header-group bg-obsidian-900/80 border-b border-gold-500/15 text-xs uppercase tracking-wider text-obsidian-200 font-semibold select-none">
            <tr>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_ref', 'Réf. Commande')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_customer', 'Client & Tél.')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_items', 'Articles & Tailles')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_amount', 'Montant COD')}</th>
              <th className="py-3.5 px-4 text-start">{t('admin.orders.th_status', 'Statut')}</th>
              <th className="py-3.5 px-4 text-end">{t('admin.orders.th_actions', 'Actions Rapides')}</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group divide-y divide-gold-500/10 text-xs sm:text-sm">
            {orders.map((order) => {
              const { isToday, display: dateDisplay } = formatOrderDate(order.createdAt);
              const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
              const primaryItem = order.items[0];

              return (
                <tr
                  key={order.id}
                  className="block md:table-row p-4 md:p-0 hover:bg-obsidian-900/50 transition-colors group space-y-3 md:space-y-0"
                >
                  {/* Reference & Date (+ mobile status badge) */}
                  <td className="flex items-center justify-between md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-gold-400 hover:text-gold-300 transition-colors inline-flex items-center gap-1.5 text-sm md:text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                      >
                        <span>{order.orderNumber}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity rtl:rotate-180" />
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-obsidian-200">
                        <Clock className="w-3.5 h-3.5 text-obsidian-400" />
                        <span>{dateDisplay}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-sm bg-gold-500/15 text-gold-400 font-bold text-xs uppercase tracking-wider">
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
                      <div className="font-medium text-ivory text-sm">{order.customer.fullName}</div>
                      <div className="flex items-center gap-2">
                        <a
                          href={formatTelLink(order.customer.phone)}
                          className="font-sans tabular-nums text-xs text-gold-400 md:text-obsidian-200 hover:text-gold-400 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                          title={t('admin.orders.action_call_title', 'Appeler le client')}
                        >
                          <PhoneCall className="w-3 h-3 text-gold-400/80" />
                          <span>{order.customer.phone}</span>
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-obsidian-200">
                        <MapPin className="w-3 h-3 text-obsidian-400 shrink-0" />
                        <span className="truncate max-w-[260px] md:max-w-[180px]">
                          {order.customer.wilayaCode} - {order.customer.wilaya} ({order.customer.commune})
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Items Breakdown */}
                  <td className="block md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div className="font-medium text-ivory text-xs sm:text-sm">
                      {t('admin.orders.items_count', '{count} article(s)').replace('{count}', String(itemsCount))}
                    </div>
                    {primaryItem && (
                      <div className="mt-1 text-xs text-obsidian-200 line-clamp-1 max-w-[260px] md:max-w-[220px]">
                        {primaryItem.title}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-sm bg-obsidian-900 border border-gold-500/20 text-gold-300 font-sans tabular-nums text-xs"
                        >
                          {getLocalizedSize(item.selectedSize, language)} (x{item.quantity})
                        </span>
                      ))}
                      {order.items.length > 3 && (
                        <span className="text-xs text-obsidian-400 font-medium">
                          {t('admin.orders.more_items', '+{count} autres').replace('{count}', String(order.items.length - 3))}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total COD Amount */}
                  <td className="flex items-center justify-between md:table-cell py-0 md:py-4 px-0 md:px-4 align-top">
                    <div>
                      <div className="font-serif font-bold text-gold-400 md:text-ivory text-base whitespace-nowrap">
                        {formatDZD(order.total, { locale: language })}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-obsidian-900 border border-gold-500/15 text-xs text-gold-400/90 uppercase tracking-wider font-semibold">
                        {t('admin.orders.cod_cash', 'COD Espèces')}
                      </div>
                    </div>
                  </td>

                  {/* Lifecycle Status Badge (desktop) */}
                  <td className="hidden md:table-cell py-4 px-4 align-top">
                    <OrderStatusBadge status={order.status} size="sm" />
                    {order.courier?.trackingCode && (
                      <div className="mt-1.5 text-xs font-mono text-obsidian-200 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-purple-400" />
                        <span>{order.courier.trackingCode}</span>
                      </div>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="block md:table-cell pt-2 md:pt-4 pb-0 md:pb-4 px-0 md:px-4 align-top md:text-end border-t border-gold-500/10 md:border-none">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Inspect Order Details */}
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-obsidian-900 border border-gold-500/20 text-obsidian-200 hover:text-ivory hover:border-gold-500/40 hover:bg-obsidian-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        title={t('admin.orders.action.details', 'Consulter le dossier de commande')}
                        aria-label={t('admin.orders.action.details', 'Inspecter la commande')}
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {/* 1-Click Phone Call */}
                      <a
                        href={formatTelLink(order.customer.phone)}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-obsidian-900 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 hover:border-gold-500/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                        title={t('admin.orders.action_call_title', 'Appeler immédiatement le client')}
                        aria-label={t('admin.orders.action_call_title', 'Appeler le client')}
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>

                      {/* 1-Click WhatsApp Concierge */}
                      <a
                        href={generateWhatsAppConfirmLink(order)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
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
                              ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
                              : order.status === 'confirmed'
                              ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
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
      <div className="p-4 bg-obsidian-900/90 border-t border-gold-500/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-obsidian-200">
        <div className="flex items-center gap-2">
          <span>{t('admin.orders.items_count', '{count} commande(s)').replace('{count}', String(orders.length))}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>{t('admin.orders.total_display_value', 'Valeur totale affichée :')}</span>
          <span className="font-serif font-bold text-gold-400 text-sm">
            {formatDZD(orders.reduce((sum, o) => sum + o.total, 0), { locale: language })}
          </span>
        </div>
      </div>
    </div>
  );
}
