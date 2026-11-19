'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderItemsTable } from '@/components/admin/OrderItemsTable';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import { useLanguage } from '@/lib/context/language-context';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';
import {
  formatAlgerianPhone,
  formatTelLink,
  generateWhatsAppConfirmLink,
} from '@/lib/utils/contactUtils';
import {
  isTerminalStatus,
  getStatusLabel,
  getCancellationReasonLabel,
  getLocalizedOrderNote,
  getLocalizedCourierName,
  STATUS_CONFIG,
} from '@/lib/utils/orderStateMachine';
import {
  ArrowLeft,
  PhoneCall,
  MessageCircle,
  Printer,
  Copy,
  Check,
  MapPin,
  User,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  FileText,
  Lock,
  ExternalLink,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface OrderDetailClientProps {
  initialOrder: Order;
}

export function OrderDetailClient({ initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetStatus, setModalTargetStatus] = useState<OrderStatus | undefined>(undefined);

  const isTerminal = isTerminalStatus(order.status);

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

  const localizeCourierName = (name: string) => getLocalizedCourierName(name, language);

  // Copy phone number to clipboard
  const handleCopyPhone = (phone: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleOpenModal = (target?: OrderStatus) => {
    setModalTargetStatus(target);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (updatedOrder: Order) => {
    setOrder(updatedOrder);
    router.refresh();
  };

  const formatTimelineDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const locale = language === 'ar' ? 'ar-DZ' : language === 'en' ? 'en-US' : 'fr-FR';
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar: Navigation, Reference, Status Badge, Quick Actions */}
      <div className="flex flex-col gap-4 pb-4 border-b border-obsidian-200">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-obsidian-500 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t('admin.order_detail.back_to_orders', 'Retour aux commandes')}</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-obsidian-950 tracking-wide">
              {t('admin.order_detail.heading_prefix', 'Commande')} <span dir="ltr">{order.orderNumber}</span>
            </h1>
            <OrderStatusBadge status={order.status} size="lg" />
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1-Click Dial */}
            <a
              href={formatTelLink(order.customer.phone)}
              className="ltr-protect inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-sm bg-gold-50 border border-gold-500/40 text-gold-700 hover:bg-gold-100 hover:border-gold-500 transition-colors text-xs font-semibold shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title={t('admin.order_detail.call_tooltip', 'Appeler directement le client')}
            >
              <span dir={language === 'ar' ? 'rtl' : 'ltr'} className="inline-flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{t('admin.order_detail.call_short', 'Appeler')}</span>
              </span>
            </a>

            {/* 1-Click WhatsApp */}
            <a
              href={generateWhatsAppConfirmLink(order, undefined, language)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title={t('admin.order_detail.whatsapp_tooltip', 'Ouvrir la confirmation pré-remplie dans WhatsApp')}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('admin.order_detail.whatsapp_btn', 'WhatsApp')}</span>
            </a>

            {/* Print Packing Slip */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-sm bg-white border border-obsidian-200 text-obsidian-700 hover:text-obsidian-950 hover:border-gold-500 transition-colors text-xs font-semibold shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title={t('admin.order_detail.print_tooltip', 'Imprimer le bon de commande / bordereau de livraison')}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('admin.order_detail.print_short', 'Imprimer')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Line Items, Financials & Audit History (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table & Financial Breakdown */}
          <OrderItemsTable
            items={order.items}
            subtotal={order.subtotal}
            deliveryFee={order.deliveryFee}
            discount={order.discount}
            total={order.total}
            wilayaName={localizedWilaya}
          />

          {/* Chronological Audit History Trail */}
          <div className="rounded-sm bg-white border border-obsidian-200 p-5 sm:p-6 shadow-luxury-subtle">
            <div className="flex items-center gap-2 pb-4 border-b border-obsidian-200 mb-6">
              <Clock className="w-5 h-5 text-gold-600" />
              <h3 className="font-cinzel text-base font-bold text-obsidian-950">
                {t('admin.order_detail.audit_title', 'Journal d’Audit & Historique des Statuts')}
              </h3>
            </div>

            <div className="relative ps-6 space-y-6 before:absolute before:start-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gold-500/30">
              {order.statusHistory.map((item, idx) => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <div key={idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div
                      className={cn(
                        'absolute -start-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125',
                        config?.dotClass || 'bg-gold-500'
                      )}
                    />

                    <div className="p-3.5 rounded-sm bg-ivory-100 border border-obsidian-200 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={item.status} size="sm" pulsePending={false} />
                          {item.updatedBy && (
                            <span className="text-[11px] text-obsidian-500">
                              {t('admin.order_detail.updated_by_prefix', 'par')}{' '}
                              <strong className="text-obsidian-950">
                                {item.updatedBy === 'Admin' ? t('admin.sidebar.role_admin', 'Admin') : item.updatedBy}
                              </strong>
                            </span>
                          )}
                        </div>
                        <span dir={language === 'ar' ? 'rtl' : 'ltr'} className="text-[11px] font-sans tabular-nums text-obsidian-500">
                          {formatTimelineDate(item.timestamp)}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-obsidian-700 italic pt-1">
                          &quot;{getLocalizedOrderNote(item.note, language)}&quot;
                        </p>
                      )}

                      {item.cancellationReason && (
                        <div className="text-[11px] text-rose-700 font-semibold">
                          {t('admin.order_detail.official_reason', 'Motif officiel :')} {getCancellationReasonLabel(item.cancellationReason, language)}
                        </div>
                      )}

                      {(item.trackingCode || item.courier) && (
                        <div className="text-[11px] font-mono text-purple-700 flex items-center gap-1.5 pt-1">
                          <Truck className="w-3.5 h-3.5" />
                          <span>
                            {t('admin.order_detail.tracking_prefix', 'Suivi')}{' '}
                            {localizeCourierName(item.courier || 'Yalidine')}
                            {item.trackingCode ? (
                              <>
                                {' : '}
                                <span dir="ltr">{item.trackingCode}</span>
                              </>
                            ) : null}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Dossier & State Machine Controller (1/3 width, sticky) */}
        <div className="space-y-6 lg:sticky lg:top-6">
          {/* State Machine Transition Controller Card */}
          <div className="rounded-sm bg-white border border-obsidian-200 p-5 shadow-luxury-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-obsidian-200">
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-obsidian-950">
                {t('admin.order_detail.status_controller_title', 'Contrôleur de Statut')}
              </h3>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>

            {isTerminal ? (
              <div className="p-4 rounded-sm bg-ivory-100 border border-obsidian-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-gold-50 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-700">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-obsidian-950">
                  {t('admin.order_detail.order_closed', 'Commande clôturée ({status})').replace('{status}', getStatusLabel(order.status, language))}
                </div>
                <p className="text-[11px] text-obsidian-500 leading-relaxed">
                  {t(
                    'admin.order_detail.terminal_notice',
                    "Cette commande a atteint un état terminal définitif. Aucune modification de statut ultérieure n'est permise."
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-obsidian-500 leading-relaxed">
                  {t('admin.order_detail.next_step_prompt', "Passez la commande à l'étape suivante du cycle de fulfillment COD :")}
                </p>

                {/* Primary Forward Step Trigger */}
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleOpenModal('confirmed')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('admin.order_detail.btn_confirm_call', 'Confirmer la commande (Appel validé)')}</span>
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleOpenModal('shipped')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-sm bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <Truck className="w-4 h-4" />
                    <span>{t('admin.order_detail.btn_ship_carrier', 'Expédier le colis (Remettre à Yalidine)')}</span>
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleOpenModal('delivered')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>{t('admin.order_detail.btn_mark_delivered', 'Marquer comme livrée (Montant COD encaissé)')}</span>
                  </button>
                )}

                {/* Destructive Cancel Trigger */}
                <button
                  onClick={() => handleOpenModal('cancelled')}
                  className="w-full py-2 px-4 min-h-[44px] rounded-sm bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{t('admin.order_detail.btn_cancel_restock', 'Annuler la commande (Restitution stock)')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Customer Shipping Dossier Card */}
          <div className="rounded-sm bg-white border border-obsidian-200 p-5 shadow-luxury-subtle space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-obsidian-200">
              <User className="w-4 h-4 text-gold-600" />
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-obsidian-950">
                {t('admin.order_detail.customer_dossier_title', 'Dossier Client & Livraison')}
              </h3>
            </div>

            {/* Customer Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-gold-50 border border-gold-500/40 flex items-center justify-center text-gold-700 font-cinzel font-bold text-base">
                {order.customer.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-obsidian-950 text-sm truncate">
                  {order.customer.fullName}
                </div>
                <div className="text-[11px] text-obsidian-500">
                  {t('admin.order_detail.cod_buyer_badge', 'Client Acheteur COD')}
                </div>
              </div>
            </div>

            {/* Contact Phones */}
            <div className="space-y-2 pt-2 border-t border-obsidian-100">
              <div className="text-[11px] font-semibold text-obsidian-500 uppercase tracking-wider">
                {t('admin.order_detail.primary_phone', 'Numéro Principal')}
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-sm bg-ivory-100 border border-obsidian-200">
                <a
                  href={formatTelLink(order.customer.phone)}
                  dir="ltr"
                  className="font-sans tabular-nums text-xs font-semibold text-gold-700 hover:text-gold-800 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-gold-600" />
                  <span dir="ltr">{formatAlgerianPhone(order.customer.phone)}</span>
                </a>
                <button
                  onClick={() => handleCopyPhone(order.customer.phone)}
                  className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-sm text-obsidian-400 hover:text-obsidian-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  title={t('admin.order_detail.copy_phone_title', 'Copier le numéro')}
                >
                  {copiedPhone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {order.customer.secondaryPhone && (
                <div>
                  <div className="text-[11px] font-semibold text-obsidian-500 uppercase tracking-wider mt-2 mb-1">
                    {t('admin.order_detail.secondary_phone', 'Numéro Secondaire')}
                  </div>
                  <div className="p-2 rounded-sm bg-ivory-100 border border-obsidian-200">
                    <a
                      href={formatTelLink(order.customer.secondaryPhone)}
                      dir="ltr"
                      className="font-sans tabular-nums text-xs text-obsidian-700 hover:text-gold-700 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                    >
                      <PhoneCall className="w-3 h-3 text-obsidian-400" />
                      <span dir="ltr">{formatAlgerianPhone(order.customer.secondaryPhone)}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address Breakdown */}
            <div className="space-y-2 pt-2 border-t border-obsidian-100">
              <div className="text-[11px] font-semibold text-obsidian-500 uppercase tracking-wider">
                {t('admin.order_detail.delivery_address_title', 'Adresse de Livraison')}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-obsidian-600">
                  <span>{t('admin.order_detail.wilaya_label', 'Wilaya :')}</span>
                  <span className="font-semibold text-obsidian-950">
                    {order.customer.wilayaCode} - {localizedWilaya}
                  </span>
                </div>
                <div className="flex items-center justify-between text-obsidian-600">
                  <span>{t('admin.order_detail.commune_label', 'Commune :')}</span>
                  <span className="font-semibold text-obsidian-950">{localizedCommune}</span>
                </div>
                <div className="pt-1 text-obsidian-700 leading-relaxed bg-ivory-100 p-2.5 rounded-sm border border-obsidian-200">
                  <span className="block text-[10px] uppercase tracking-wider text-obsidian-500 mb-0.5">
                    {t('admin.order_detail.street_landmark', 'Rue / Repère')}
                  </span>
                  {order.customer.address ||
                    (order.customer.deliveryType === 'desk'
                      ? t('admin.order_detail.stop_desk_no_addr', 'Point Relais / Stop Desk (Sans adresse)')
                      : t('admin.order_detail.not_provided', 'Non renseignée'))}
                </div>
              </div>
            </div>

            {/* Delivery Mode & Customer Notes */}
            <div className="space-y-2 pt-2 border-t border-obsidian-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-obsidian-500">{t('admin.order_detail.mode_label', 'Mode :')}</span>
                <span className="px-2 py-0.5 rounded-sm bg-gold-50 text-gold-700 border border-gold-500/30 text-[11px] font-semibold">
                  {order.customer.deliveryType === 'desk'
                    ? t('admin.order_detail.mode_desk', 'Point Relais / Stop Desk')
                    : t('admin.order_detail.mode_home', 'Livraison à Domicile')}
                </span>
              </div>

              {order.customer.notes ? (
                <div className="p-3 rounded-sm bg-gold-50 border border-gold-500/30 text-xs">
                  <span className="block text-[10px] uppercase font-bold text-gold-700 tracking-wider mb-1">
                    {t('admin.order_detail.customer_note_label', 'Consigne Client :')}
                  </span>
                  <p className="text-obsidian-700 italic leading-relaxed">
                    &quot;{order.customer.notes}&quot;
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-obsidian-400 italic">
                  {t('admin.order_detail.no_customer_notes', 'Aucune consigne particulière spécifiée par le client.')}
                </p>
              )}
            </div>
          </div>

          {/* Courier Logistics Card */}
          <div className="rounded-sm bg-white border border-obsidian-200 p-5 shadow-luxury-subtle space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-obsidian-200">
              <Truck className="w-4 h-4 text-purple-600" />
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-obsidian-950">
                {t('admin.order_detail.courier_logistics_title', 'Logistique Transporteur')}
              </h3>
            </div>

            {(order.courier?.name || order.courier?.trackingCode) ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-500">{t('admin.order_detail.courier_label', 'Transporteur :')}</span>
                  <span className="font-semibold text-obsidian-950">{localizeCourierName(order.courier.name)}</span>
                </div>
                {order.courier.trackingCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-obsidian-500">{t('admin.order_detail.tracking_number_label', 'N° de suivi :')}</span>
                    <span dir="ltr" className="font-mono font-bold text-purple-700">
                      {order.courier.trackingCode}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-obsidian-500 leading-relaxed">
                {t(
                  'admin.order_detail.no_tracking_yet',
                  'Aucun numéro de suivi enregistré pour l\'instant. Le suivi sera saisi lors du passage au statut "Expédiée".'
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* State Transition Modal */}
      <OrderStatusTransitionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={order}
        initialTargetStatus={modalTargetStatus}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
