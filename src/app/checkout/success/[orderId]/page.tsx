import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { getDataStore } from '@/lib/data-provider';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { OrderConfirmationCartCleaner } from './OrderConfirmationCartCleaner';
import { OrderSuccessView } from './OrderSuccessView';
import { OrderSuccessFallback } from './OrderSuccessFallback';

export const dynamic = 'force-dynamic';

interface OrderSuccessPageProps {
  params: {
    orderId: string;
  };
  searchParams?: {
    direct?: string;
    express?: string;
  };
}

export default async function OrderSuccessPage({
  params,
  searchParams,
}: OrderSuccessPageProps) {
  const { orderId } = params;
  const isDirectOrder = searchParams?.direct === '1' || searchParams?.express === '1';

  const dataStore = getDataStore();
  const order = await dataStore.getOrderById(orderId);

  // If order is not found on SSR, delegate to smart client-side fallback/recovery
  if (!order) {
    return (
      <StorefrontLayout>
        <OrderConfirmationCartCleaner isDirectOrder={isDirectOrder} />
        <OrderSuccessFallback orderId={orderId} isDirectOrder={isDirectOrder} />
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      {/* Client-side cart cleaner: clears vip_cart ONLY if standard checkout */}
      <OrderConfirmationCartCleaner isDirectOrder={isDirectOrder} />
      <OrderSuccessView order={order} />
    </StorefrontLayout>
  );
}
