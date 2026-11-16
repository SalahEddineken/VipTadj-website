import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { OrderDetailClient } from '@/components/admin/OrderDetailClient';
import { Package, ArrowLeft } from 'lucide-react';

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const store = getDataStore();
  const order = await store.getOrderById(params.id);

  if (!order) {
    return {
      title: 'Commande introuvable | VIP TADJ Admin',
    };
  }

  return {
    title: `Commande ${order.orderNumber} | VIP TADJ Admin`,
    description: `Dossier de commande pour le client ${order.customer.fullName}.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const store = getDataStore();
  const order = await store.getOrderById(params.id);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="rounded-2xl bg-obsidian-950 border border-gold-500/20 p-10 shadow-luxury-subtle">
          <div className="w-16 h-16 rounded-2xl bg-obsidian-900 border border-gold-500/30 flex items-center justify-center mx-auto mb-4 text-gold-400">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="font-cinzel text-xl font-bold text-ivory mb-2">
            Commande Introuvable
          </h2>
          <p className="text-sm text-obsidian-400 mb-6">
            La référence de commande « {params.id} » n&apos;existe pas ou a été supprimée du système.
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500 text-obsidian-950 font-bold text-xs hover:bg-gold-400 transition-colors shadow-luxury-subtle"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la liste des commandes</span>
          </Link>
        </div>
      </div>
    );
  }

  return <OrderDetailClient initialOrder={order} />;
}
