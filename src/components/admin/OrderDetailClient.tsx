'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderItemsTable } from '@/components/admin/OrderItemsTable';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import { formatDZD } from '@/lib/utils/formatDZD';
import {
  formatAlgerianPhone,
  formatTelLink,
  generateWhatsAppConfirmLink,
} from '@/lib/utils/contactUtils';
import {
  isTerminalStatus,
  STATUS_LABELS_FR,
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
  const [order, setOrder] = useState<Order>(initialOrder);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetStatus, setModalTargetStatus] = useState<OrderStatus | undefined>(undefined);

  const isTerminal = isTerminalStatus(order.status);

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
      return date.toLocaleDateString('fr-FR', {
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
      <div className="flex flex-col gap-4 pb-4 border-b border-gold-500/15">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-obsidian-300 hover:text-gold-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>Retour aux commandes</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-ivory tracking-wide">
              Commande {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} size="lg" />
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1-Click Dial */}
            <a
              href={formatTelLink(order.customer.phone)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-sm bg-obsidian-950 border border-gold-500/25 text-gold-400 hover:bg-gold-500/15 hover:border-gold-500/50 transition-colors text-xs font-semibold shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title="Appeler directement le client"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Appeler</span>
            </a>

            {/* 1-Click WhatsApp */}
            <a
              href={generateWhatsAppConfirmLink(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-semibold shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title="Ouvrir la confirmation pré-remplie dans WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            {/* Print Packing Slip */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') window.print();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-sm bg-obsidian-950 border border-gold-500/20 text-obsidian-300 hover:text-ivory hover:border-gold-500/40 transition-colors text-xs font-semibold shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              title="Imprimer le bon de commande / bordereau de livraison"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer</span>
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
            wilayaName={order.customer.wilaya}
          />

          {/* Chronological Audit History Trail */}
          <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 p-5 sm:p-6 shadow-luxury-subtle">
            <div className="flex items-center gap-2 pb-4 border-b border-gold-500/15 mb-6">
              <Clock className="w-5 h-5 text-gold-400" />
              <h3 className="font-cinzel text-base font-bold text-ivory">
                Journal d’Audit & Historique des Statuts
              </h3>
            </div>

            <div className="relative ps-6 space-y-6 before:absolute before:start-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gold-500/20">
              {order.statusHistory.map((item, idx) => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <div key={idx} className="relative group">
                    {/* Timeline bullet dot */}
                    <div
                      className={cn(
                        'absolute -start-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-obsidian-950 shadow-sm transition-transform group-hover:scale-125',
                        config?.dotClass || 'bg-gold-400'
                      )}
                    />

                    <div className="p-3.5 rounded-sm bg-obsidian-900/60 border border-gold-500/10 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={item.status} size="sm" pulsePending={false} />
                          {item.updatedBy && (
                            <span className="text-[11px] text-obsidian-400">
                              par <strong className="text-ivory">{item.updatedBy}</strong>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-sans tabular-nums text-obsidian-400">
                          {formatTimelineDate(item.timestamp)}
                        </span>
                      </div>

                      {item.note && (
                        <p className="text-xs text-obsidian-300 italic pt-1">
                          « {item.note} »
                        </p>
                      )}

                      {item.cancellationReason && (
                        <div className="text-[11px] text-rose-400 font-semibold">
                          Motif officiel : {item.cancellationReason}
                        </div>
                      )}

                      {item.trackingCode && (
                        <div className="text-[11px] font-mono text-purple-400 flex items-center gap-1.5 pt-1">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Suivi {item.courier || 'Yalidine'} : {item.trackingCode}</span>
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
          <div className="rounded-sm bg-obsidian-950 border border-gold-500/25 p-5 shadow-luxury-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gold-500/15">
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-ivory">
                Contrôleur de Statut
              </h3>
              <OrderStatusBadge status={order.status} size="sm" />
            </div>

            {isTerminal ? (
              <div className="p-4 rounded-sm bg-obsidian-900 border border-gold-500/15 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-obsidian-850 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-ivory">
                  Commande clôturée ({STATUS_LABELS_FR[order.status]})
                </div>
                <p className="text-[11px] text-obsidian-400 leading-relaxed">
                  Cette commande a atteint un état terminal définitif. Aucune modification de statut ultérieure n&apos;est permise.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-obsidian-400 leading-relaxed">
                  Passez la commande à l&apos;étape suivante du cycle de fulfillment COD :
                </p>

                {/* Primary Forward Step Trigger */}
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleOpenModal('confirmed')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-sm bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmer la commande (Appel validé)</span>
                  </button>
                )}

                {order.status === 'confirmed' && (
                  <button
                    onClick={() => handleOpenModal('shipped')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-sm bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Expédier le colis (Remettre à Yalidine)</span>
                  </button>
                )}

                {order.status === 'shipped' && (
                  <button
                    onClick={() => handleOpenModal('delivered')}
                    className="w-full py-2.5 px-4 min-h-[44px] rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-luxury-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Marquer comme livrée (Montant COD encaissé)</span>
                  </button>
                )}

                {/* Destructive Cancel Trigger */}
                <button
                  onClick={() => handleOpenModal('cancelled')}
                  className="w-full py-2 px-4 min-h-[44px] rounded-sm bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Annuler la commande (Restitution stock)</span>
                </button>
              </div>
            )}
          </div>

          {/* Customer Shipping Dossier Card */}
          <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 p-5 shadow-luxury-subtle space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gold-500/15">
              <User className="w-4 h-4 text-gold-400" />
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-ivory">
                Dossier Client & Livraison
              </h3>
            </div>

            {/* Customer Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-cinzel font-bold text-base">
                {order.customer.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ivory text-sm truncate">
                  {order.customer.fullName}
                </div>
                <div className="text-[11px] text-obsidian-400">Client Acheteur COD</div>
              </div>
            </div>

            {/* Contact Phones */}
            <div className="space-y-2 pt-2 border-t border-gold-500/10">
              <div className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-wider">
                Numéro Principal
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-sm bg-obsidian-900 border border-gold-500/15">
                <a
                  href={formatTelLink(order.customer.phone)}
                  className="font-sans tabular-nums text-xs font-semibold text-gold-300 hover:text-gold-200 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-gold-400" />
                  <span>{formatAlgerianPhone(order.customer.phone)}</span>
                </a>
                <button
                  onClick={() => handleCopyPhone(order.customer.phone)}
                  className="p-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-sm text-obsidian-400 hover:text-ivory transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  title="Copier le numéro"
                >
                  {copiedPhone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {order.customer.secondaryPhone && (
                <div>
                  <div className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-wider mt-2 mb-1">
                    Numéro Secondaire
                  </div>
                  <div className="p-2 rounded-sm bg-obsidian-900/60 border border-gold-500/10">
                    <a
                      href={formatTelLink(order.customer.secondaryPhone)}
                      className="font-sans tabular-nums text-xs text-obsidian-300 hover:text-gold-300 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                    >
                      <PhoneCall className="w-3 h-3 text-obsidian-400" />
                      <span>{formatAlgerianPhone(order.customer.secondaryPhone)}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Address Breakdown */}
            <div className="space-y-2 pt-2 border-t border-gold-500/10">
              <div className="text-[11px] font-semibold text-obsidian-400 uppercase tracking-wider">
                Adresse de Livraison
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-obsidian-300">
                  <span>Wilaya :</span>
                  <span className="font-semibold text-ivory">
                    {order.customer.wilayaCode} - {order.customer.wilaya}
                  </span>
                </div>
                <div className="flex items-center justify-between text-obsidian-300">
                  <span>Commune :</span>
                  <span className="font-semibold text-ivory">{order.customer.commune}</span>
                </div>
                <div className="pt-1 text-obsidian-300 leading-relaxed bg-obsidian-900/60 p-2.5 rounded-sm border border-gold-500/10">
                  <span className="block text-[10px] uppercase tracking-wider text-obsidian-500 mb-0.5">
                    Rue / Repère
                  </span>
                  {order.customer.address}
                </div>
              </div>
            </div>

            {/* Delivery Mode & Customer Notes */}
            <div className="space-y-2 pt-2 border-t border-gold-500/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-obsidian-400">Mode :</span>
                <span className="px-2 py-0.5 rounded-sm bg-gold-500/10 text-gold-400 border border-gold-500/30 text-[11px] font-semibold">
                  {order.customer.deliveryType === 'desk'
                    ? 'Point Relais / Stop Desk'
                    : 'Livraison à Domicile'}
                </span>
              </div>

              {order.customer.notes ? (
                <div className="p-3 rounded-sm bg-gold-500/5 border border-gold-500/20 text-xs">
                  <span className="block text-[10px] uppercase font-bold text-gold-400 tracking-wider mb-1">
                    Consigne Client :
                  </span>
                  <p className="text-obsidian-300 italic leading-relaxed">
                    « {order.customer.notes} »
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-obsidian-500 italic">
                  Aucune consigne particulière spécifiée par le client.
                </p>
              )}
            </div>
          </div>

          {/* Courier Logistics Card */}
          <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 p-5 shadow-luxury-subtle space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gold-500/15">
              <Truck className="w-4 h-4 text-purple-400" />
              <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-ivory">
                Logistique Transporteur
              </h3>
            </div>

            {order.courier?.trackingCode ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-400">Transporteur :</span>
                  <span className="font-semibold text-ivory">{order.courier.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-obsidian-400">N° de suivi :</span>
                  <span className="font-mono font-bold text-purple-400">
                    {order.courier.trackingCode}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-obsidian-400 leading-relaxed">
                Aucun numéro de suivi enregistré pour l&apos;instant. Le suivi sera saisi lors du passage au statut &quot;Expédiée&quot;.
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
