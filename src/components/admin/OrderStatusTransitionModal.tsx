'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import {
  getAllowedTransitions,
  CANCELLATION_REASONS,
  STATUS_LABELS_FR,
  STATUS_CONFIG,
} from '@/lib/utils/orderStateMachine';
import { X, AlertTriangle, CheckCircle, Truck, PackageCheck, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';

export interface OrderStatusTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  initialTargetStatus?: OrderStatus;
  onSuccess: (updatedOrder: Order) => void;
}

export function OrderStatusTransitionModal({
  isOpen,
  onClose,
  order,
  initialTargetStatus,
  onSuccess,
}: OrderStatusTransitionModalProps) {
  const { t, language } = useLanguage();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [note, setNote] = useState('');
  const [cancellationReason, setCancellationReason] = useState('customer_unreachable');
  const [courier, setCourier] = useState('Yalidine Express');
  const [trackingCode, setTrackingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!order) return;
    const allowed = getAllowedTransitions(order.status);
    if (initialTargetStatus && allowed.includes(initialTargetStatus)) {
      setSelectedStatus(initialTargetStatus);
    } else if (allowed.length > 0) {
      // Pick first non-cancelled transition if available
      const forward = allowed.find((s) => s !== 'cancelled');
      setSelectedStatus(forward || allowed[0]);
    } else {
      setSelectedStatus('');
    }

    setNote('');
    setErrorMessage(null);
    setCancellationReason('customer_unreachable');
    setCourier(order.courier?.name || 'Yalidine Express');
    setTrackingCode(order.courier?.trackingCode || '');
  }, [order, initialTargetStatus, isOpen]);

  // Escape key handler for dialog accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !order) return null;

  const allowedTransitions = getAllowedTransitions(order.status);
  const isCancelling = selectedStatus === 'cancelled';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let finalNote = note.trim();
      if (isCancelling && !finalNote) {
        const found = CANCELLATION_REASONS.find((r) => r.code === cancellationReason);
        finalNote = found ? found.labelFr : 'Commande annulée';
      } else if (!finalNote) {
        if (selectedStatus === 'confirmed') finalNote = 'Commande validée par téléphone';
        else if (selectedStatus === 'shipped') finalNote = `Colis remis à ${courier}${trackingCode ? ` (${trackingCode})` : ''}`;
        else if (selectedStatus === 'delivered') finalNote = 'Colis livré et montant COD encaissé';
      }

      const payload = {
        status: selectedStatus,
        note: finalNote,
        updatedBy: 'Admin',
        ...(isCancelling ? { cancellationReason, reason: cancellationReason } : {}),
        ...(selectedStatus === 'shipped' ? { courier, trackingCode: trackingCode.trim() } : {}),
      };

      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour du statut.');
      }

      onSuccess(data.order);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur inattendue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-status-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-sm bg-obsidian-950 border border-gold-500/30 p-6 shadow-2xl z-10 text-ivory max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gold-500/15 pb-4 mb-5">
          <div>
            <h3 id="order-status-modal-title" className="font-cinzel text-lg font-bold text-gold-400">
              {t('admin.orders.modal_title', 'Modifier le statut de la commande')}
            </h3>
            <p className="text-xs text-obsidian-400 mt-0.5">
              {t('admin.orders.ref_prefix', 'Réf')} : <span className="font-mono text-ivory font-semibold">{order.orderNumber}</span> | {t('admin.dashboard.th_customer', 'Client')} : {order.customer.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sm text-obsidian-400 hover:text-ivory hover:bg-obsidian-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label={t('admin.orders.modal_close_aria', 'Fermer la boîte de dialogue')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-sm bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Status Choice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-obsidian-300 mb-2">
              {t('admin.orders.modal_target_status', 'Statut Cible')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {allowedTransitions.map((target) => {
                const isSelected = selectedStatus === target;
                const isTargetCancel = target === 'cancelled';

                return (
                  <button
                    type="button"
                    key={target}
                    onClick={() => setSelectedStatus(target)}
                    className={cn(
                      'flex items-center gap-2 p-3 min-h-[44px] rounded-sm border text-xs font-semibold text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                      isSelected
                        ? isTargetCancel
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-luxury-subtle'
                          : 'bg-gold-500/20 border-gold-500/50 text-gold-300 shadow-luxury-subtle'
                        : 'bg-obsidian-900 border-gold-500/15 text-obsidian-400 hover:text-ivory hover:bg-obsidian-850'
                    )}
                  >
                    {target === 'confirmed' && <CheckCircle className="w-4 h-4 text-blue-400" />}
                    {target === 'shipped' && <Truck className="w-4 h-4 text-purple-400" />}
                    {target === 'delivered' && <PackageCheck className="w-4 h-4 text-emerald-400" />}
                    {target === 'cancelled' && <XCircle className="w-4 h-4 text-rose-400" />}
                    <span>{t(`status.${target}`, STATUS_LABELS_FR[target])}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cancellation Warning & Reason Selector */}
          {isCancelling && (
            <div className="p-4 rounded-sm bg-rose-500/10 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('admin.orders.modal_cancel_warning', 'Attention : Annulation définitive et réintégration de stock')}</span>
              </div>
              <p className="text-xs text-obsidian-200 leading-relaxed">
                {t('admin.orders.modal_cancel_notice', 'L’annulation est un état terminal. Tous les articles de cette commande seront automatiquement réintégrés au stock du catalogue VIP TADJ.')}
              </p>

              <div>
                <label className="block text-xs font-semibold text-rose-300 mb-1">
                  {t('admin.orders.modal_cancel_reason_label', 'Motif d’annulation obligatoire')}
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-obsidian-900 border border-rose-500/30 text-ivory text-xs focus:outline-none focus:border-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  {CANCELLATION_REASONS.map((r) => (
                    <option key={r.code} value={r.code} className="bg-obsidian-900 text-ivory">
                      {t(`admin.orders.cancel_reason.${r.code}`, r.labelFr)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Shipping Fields: Courier and Tracking Code */}
          {selectedStatus === 'shipped' && (
            <div className="p-4 rounded-sm bg-purple-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                <Truck className="w-4 h-4" />
                <span>{t('admin.orders.modal_carrier_info', 'Informations du transporteur')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    {t('admin.orders.modal_carrier_select', 'Société de livraison')}
                  </label>
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-obsidian-900 border border-purple-500/30 text-ivory text-xs focus:outline-none focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  >
                    <option value="Yalidine Express">Yalidine Express</option>
                    <option value="ZR Express">ZR Express</option>
                    <option value="Procolis">Procolis</option>
                    <option value="Livraison Interne VIP TADJ">{t('admin.orders.internal_delivery', 'Livraison Interne VIP TADJ')}</option>
                    <option value="Autre">{t('admin.orders.other_carrier', 'Autre transporteur')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-purple-300 mb-1">
                    {t('admin.orders.modal_tracking_label', 'Numéro de suivi (Tracking)')}
                  </label>
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder={t('admin.orders.modal_tracking_ph', 'Ex: YAL-2026-987654')}
                    className="w-full px-3 py-2.5 min-h-[44px] rounded-sm bg-obsidian-900 border border-purple-500/30 text-ivory placeholder-obsidian-500 text-xs font-mono focus:outline-none focus:border-purple-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Administrative Note */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-obsidian-300 mb-1.5">
              {t('admin.orders.modal_audit_note', 'Note d’audit administrative')}{' '}
              {isCancelling ? `(${t('admin.orders.modal_audit_optional', 'facultative')})` : `(${t('admin.orders.modal_audit_optional', 'facultative')})`}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                isCancelling
                  ? t('admin.orders.modal_cancel_placeholder', "Précisions sur l'annulation...")
                  : selectedStatus === 'confirmed'
                  ? t('admin.orders.modal_confirmed_placeholder', 'Ex: Client joint par téléphone, confirmation de la taille 52.')
                  : t('admin.orders.modal_note_placeholder', 'Commentaire ou consigne pour l’équipe...')
              }
              className="w-full px-3 py-2 rounded-sm bg-obsidian-900 border border-gold-500/20 text-ivory placeholder-obsidian-500 text-xs focus:outline-none focus:border-gold-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gold-500/15">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 min-h-[44px] rounded-sm bg-obsidian-900 border border-gold-500/20 text-xs text-obsidian-300 hover:text-ivory hover:border-gold-500/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t('admin.orders.modal_cancel_btn', 'Annuler')}
            </button>

            <button
              type="submit"
              disabled={isLoading || !selectedStatus}
              className={cn(
                'px-5 py-2.5 min-h-[44px] rounded-sm text-xs font-bold transition-all inline-flex items-center gap-2 shadow-luxury-subtle disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                isCancelling
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-gold-500 hover:bg-gold-400 text-obsidian-950'
              )}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isCancelling
                  ? t('admin.orders.modal_confirm_cancel', 'Confirmer l’annulation')
                  : `${t('admin.orders.modal_confirm_advance', 'Valider')} : ${selectedStatus ? t(`status.${selectedStatus}`, STATUS_LABELS_FR[selectedStatus]) : ''}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
