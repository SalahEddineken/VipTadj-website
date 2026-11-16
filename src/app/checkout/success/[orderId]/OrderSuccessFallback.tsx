'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, MessageSquare, PhoneCall } from 'lucide-react';
import { Order } from '@/types';
import { OrderSuccessView } from './OrderSuccessView';

interface OrderSuccessFallbackProps {
  orderId: string;
  isDirectOrder?: boolean;
}

export function OrderSuccessFallback({ orderId, isDirectOrder }: OrderSuccessFallbackProps) {
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
          Finalisation de votre commande
        </h2>
        <p className="text-xs text-neutral-500 font-sans tracking-wide">
          Génération de votre dossier de confection VIP TADJ...
        </p>
      </div>
    );
  }

  if (order) {
    return <OrderSuccessView order={order} />;
  }

  const encodedMsg = encodeURIComponent(
    `Bonjour Maison VIP TADJ, j'ai validé ma commande référence ${orderId} sur votre boutique et je souhaite la confirmer.`
  );
  const whatsappUrl = `https://wa.me/213550000000?text=${encodedMsg}`;

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-20 px-4">
      <div className="max-w-md w-full bg-sand-50/50 dark:bg-obsidian-900 border border-sand-300 dark:border-sand-800 p-8 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl text-obsidian-900 dark:text-sand-100 font-bold">
            Commande Introuvable
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            La référence <span className="font-mono font-semibold text-gold-600">{orderId}</span> ne correspond à aucune commande active ou archivée.
          </p>
        </div>

        {/* VIP Customer Concierge Support */}
        <div className="bg-sand-100/60 dark:bg-obsidian-800/60 p-4 border border-sand-200 dark:border-sand-800 text-left text-xs space-y-2">
          <div className="font-semibold text-obsidian-900 dark:text-sand-200 uppercase tracking-wider text-[11px]">
            Assistance Service Client VIP TADJ
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Si vous venez de valider votre commande, votre conseiller est joignable directement :
          </p>
          <div className="flex flex-col gap-2 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Confirmer sur WhatsApp (+213 550 00 00 00)</span>
            </a>
            <a
              href="tel:+213550000000"
              className="flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Appeler le Concierge Client</span>
            </a>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/catalog"
            className="w-full py-3.5 px-6 bg-obsidian-900 dark:bg-sand-100 text-white dark:text-obsidian-900 font-sans uppercase tracking-[0.2em] text-xs font-semibold hover:bg-gold-600 dark:hover:bg-gold-500 transition-colors"
          >
            Explorer la Collection
          </Link>
          <Link
            href="/"
            className="w-full py-3 px-6 border border-sand-300 dark:border-sand-800 text-neutral-700 dark:text-neutral-300 font-sans uppercase tracking-[0.15em] text-xs hover:border-gold-500 transition-colors"
          >
            Retour à l&apos;Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
