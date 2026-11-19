'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, MessageSquare, PhoneCall } from 'lucide-react';
import { Order } from '@/types';
import { OrderSuccessView } from './OrderSuccessView';
import { useStoreSettings } from '@/lib/context/store-settings-context';
import { useLanguage } from '@/lib/context/language-context';
import { formatTranslation } from '@/lib/i18n/locales';
import { formatTelLink, normalizePhoneForWhatsApp } from '@/lib/utils/phoneUtils';

interface OrderSuccessFallbackProps {
  orderId: string;
  isDirectOrder?: boolean;
}

export function OrderSuccessFallback({ orderId }: OrderSuccessFallbackProps) {
  const { phone: storePhone, whatsappNumber } = useStoreSettings();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function recoverOrder() {
      // 1. Try to recover from sessionStorage
      try {
        const cached = sessionStorage.getItem(`vip_last_order_${orderId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.id === orderId || parsed.orderNumber === orderId)) {
            if (isMounted) {
              setOrder(parsed);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {
        // Continue to network lookup
      }

      // 2. Try fetching from API /api/orders/[id]
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order && isMounted) {
            setOrder(data.order);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to not-found view
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    recoverOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-gold-500/20 border-t-gold-500 animate-spin mb-4" />
        <h2 className="font-cinzel text-lg text-obsidian-900 dark:text-sand-100 font-semibold mb-1">
          {t('success.fallback.loading_title', 'Finalisation de votre commande')}
        </h2>
        <p className="text-xs text-neutral-500 font-sans tracking-wide">
          {t('success.fallback.loading_desc', 'Génération de votre dossier VIP TADJ...')}
        </p>
      </div>
    );
  }

  if (order) {
    return <OrderSuccessView order={order} />;
  }

  const waPhone = normalizePhoneForWhatsApp(whatsappNumber) || '213550000000';
  const encodedMsg = encodeURIComponent(
    formatTranslation(
      t(
        'success.fallback.whatsapp_msg',
        "Bonjour Maison VIP TADJ, j'ai validé ma commande référence {orderId} sur votre boutique et je souhaite la confirmer."
      ),
      { orderId }
    )
  );
  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodedMsg}`;

  const notFoundTemplate = t(
    'success.fallback.not_found_desc',
    'La référence {orderId} ne correspond à aucune commande active ou archivée.'
  );
  const [descBefore, descAfter] = notFoundTemplate.split('{orderId}');

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-sand-50/50 dark:bg-obsidian-900 border border-sand-300 dark:border-sand-800 p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl text-obsidian-900 dark:text-sand-100 font-bold">
            {t('success.fallback.not_found_title', 'Commande Introuvable')}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {descBefore}
            <span dir="ltr" className="font-mono font-semibold text-gold-600">{orderId}</span>
            {descAfter ?? ''}
          </p>
        </div>

        {/* VIP Customer Concierge Support */}
        <div className="bg-sand-100/60 dark:bg-obsidian-800/60 p-4 border border-sand-200 dark:border-sand-800 text-start text-xs space-y-2">
          <div className="font-semibold text-obsidian-900 dark:text-sand-200 uppercase tracking-wider text-[11px]">
            {t('success.fallback.support_title', 'Assistance Service Client VIP TADJ')}
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t(
              'success.fallback.support_desc',
              'Si vous venez de valider votre commande, votre conseiller est joignable directement :'
            )}
          </p>
          <div className="flex flex-col gap-2 pt-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                <span>
                  {t('success.whatsapp.btn', 'Confirmer sur WhatsApp')} (
                  <span dir="ltr" className="ltr-protect">{storePhone}</span>)
                </span>
              </a>
              <a
                href={formatTelLink(storePhone)}
                className="flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
              >
              <PhoneCall className="w-4 h-4" />
              <span>{t('success.fallback.call_concierge', 'Appeler le Service Client')}</span>
            </a>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/catalog"
            className="w-full py-3.5 px-6 bg-obsidian-900 dark:bg-sand-100 text-white dark:text-obsidian-900 font-sans uppercase tracking-[0.2em] text-xs font-semibold hover:bg-gold-600 dark:hover:bg-gold-500 transition-colors"
          >
            {t('not_found.cta_catalog', 'Explorer le Catalogue')}
          </Link>
          <Link
            href="/"
            className="w-full py-3 px-6 border border-sand-300 dark:border-sand-800 text-neutral-700 dark:text-neutral-300 font-sans uppercase tracking-[0.15em] text-xs hover:border-gold-500 transition-colors"
          >
            {t('success.action.back_home', "Retour à l'Accueil")}
          </Link>
        </div>
      </div>
    </div>
  );
}
