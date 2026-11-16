import React from 'react';
import { Metadata } from 'next';
import { getDataStore } from '@/lib/data-provider';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { CatalogClient } from '@/components/store/CatalogClient';
import { CatalogBanner } from '@/components/store/CatalogBanner';

export const metadata: Metadata = {
  title: 'Catalogue Complet | VIP TADJ | Haute Couture Masculine',
  description:
    'Explorez l\'ensemble du vestiaire masculin VIP TADJ : costumes deux et trois pièces en laine italienne, blazers en velours, souliers Richelieu patinés main et accessoires en soie.',
};

export default async function CatalogPage() {
  const dataStore = getDataStore();
  const products = await dataStore.getProducts();

  return (
    <StorefrontLayout>
      {/* Editorial Header Banner */}
      <CatalogBanner />

      {/* Interactive Catalog Experience */}
      <CatalogClient initialProducts={products} />
    </StorefrontLayout>
  );
}
