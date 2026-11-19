import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data-provider';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';
import { LANGUAGE_COOKIE_NAME } from '@/lib/context/language-context';
import { getTranslation } from '@/lib/i18n/locales';
import { SupportedLanguage } from '@/lib/i18n/types';
import { Order } from '@/types';

function getServerLanguage(): SupportedLanguage {
  const rawLang = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
  return rawLang === 'en' || rawLang === 'ar' || rawLang === 'fr' ? rawLang : 'ar';
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLanguage();
  return {
    title: getTranslation(lang, 'admin.meta.orders_title', 'Commandes | Administration VIP TADJ'),
    description: getTranslation(lang, 'admin.meta.orders_desc', 'Gestion et validation des commandes clients VIP TADJ.'),
  };
}

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  searchParams: {
    status?: string;
    search?: string;
  };
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const lang = getServerLanguage();
  let initialOrders: Order[] = [];
  try {
    const dataStore = getDataStore();
    initialOrders = await dataStore.getOrders();
  } catch (error) {
    console.error('[AdminOrdersPage SSR] Non-fatal error loading initial orders:', error);
  }

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-obsidian-400 font-cinzel">
          {getTranslation(lang, 'admin.orders.loading_ssr', 'Chargement des commandes VIP TADJ...')}
        </div>
      }
    >
      <OrdersManagementClient
        initialOrders={initialOrders}
        initialStatus={searchParams?.status}
      />
    </Suspense>
  );
}
