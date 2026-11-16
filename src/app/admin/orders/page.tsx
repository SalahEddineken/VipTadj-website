import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getDataStore } from '@/lib/data-provider';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';
import { Order } from '@/types';

export const metadata: Metadata = {
  title: 'Commandes | Administration VIP TADJ',
  description: 'Gestion et validation des commandes clients VIP TADJ.',
};

export const dynamic = 'force-dynamic';

interface OrdersPageProps {
  searchParams: {
    status?: string;
    search?: string;
  };
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
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
          Chargement des commandes VIP TADJ...
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
