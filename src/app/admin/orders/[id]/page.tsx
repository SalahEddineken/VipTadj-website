import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data-provider';
import { OrderDetailClient } from '@/components/admin/OrderDetailClient';
import { LANGUAGE_COOKIE_NAME } from '@/lib/context/language-context';
import { getTranslation } from '@/lib/i18n/locales';
import { SupportedLanguage } from '@/lib/i18n/types';
import { Package, ArrowLeft } from 'lucide-react';
import { Order } from '@/types';

function getServerLanguage(): SupportedLanguage {
  const rawLang = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
  return rawLang === 'en' || rawLang === 'ar' || rawLang === 'fr' ? rawLang : 'ar';
}

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const lang = getServerLanguage();
  const store = getDataStore();
  const order = await store.getOrderById(params.id);

  if (!order) {
    return {
      title: getTranslation(lang, 'admin.meta.order_not_found_title', 'Commande introuvable | VIP TADJ Admin'),
    };
  }

  return {
    title: getTranslation(lang, 'admin.meta.order_detail_title', 'Commande {orderNumber} | VIP TADJ Admin').replace('{orderNumber}', order.orderNumber),
    description: getTranslation(lang, 'admin.meta.order_detail_desc', 'Dossier de commande pour le client {name}.').replace('{name}', order.customer.fullName),
  };
}

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const lang = getServerLanguage();
  let order: Order | null = null;
  try {
    const store = getDataStore();
    order = await store.getOrderById(params.id);
  } catch (error) {
    console.error('[AdminOrderDetailPage SSR] Non-fatal error loading order:', error);
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="rounded-2xl bg-obsidian-950 border border-gold-500/20 p-10 shadow-luxury-subtle">
          <div className="w-16 h-16 rounded-2xl bg-obsidian-900 border border-gold-500/30 flex items-center justify-center mx-auto mb-4 text-gold-400">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-cinzel text-xl font-bold text-ivory mb-2">
            {getTranslation(lang, 'admin.order_detail.not_found_title', 'Commande Introuvable')}
          </h2>
          <p className="text-sm text-obsidian-400 mb-6">
            {getTranslation(
              lang,
              'admin.order_detail.not_found_desc',
              "La référence de commande « {id} » n'existe pas ou a été supprimée du système."
            ).replace('{id}', params.id)}
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 font-bold text-xs hover:bg-gold-400 transition-colors shadow-luxury-subtle"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{getTranslation(lang, 'admin.order_detail.back_to_list', 'Retour à la liste des commandes')}</span>
          </Link>
        </div>
      </div>
    );
  }

  return <OrderDetailClient initialOrder={order} />;
}
