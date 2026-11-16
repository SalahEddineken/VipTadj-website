import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getDataStore } from '@/lib/data-provider';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';

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
  const dataStore = getDataStore();
  const initialOrders = await dataStore.getOrders();

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
