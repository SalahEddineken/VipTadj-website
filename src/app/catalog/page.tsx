import React from 'react';
import { Metadata } from 'next';
import { getDataStore } from '@/lib/data-provider';
import { initialProducts } from '@/lib/seed/seed-data';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { CatalogClient } from '@/components/store/CatalogClient';
import { CatalogBanner } from '@/components/store/CatalogBanner';

export const metadata: Metadata = {
  title: 'Catalogue Complet | VIP TADJ | Haute Couture Masculine',
  description:
    'Explorez l\'ensemble du vestiaire masculin VIP TADJ : costumes deux et trois pièces en laine italienne, blazers en velours, souliers Richelieu patinés main et accessoires en soie.',
};

export default async function CatalogPage() {
  let products = initialProducts;
  try {
    const dataStore = getDataStore();
    const fetched = await dataStore.getProducts();
    if (fetched && fetched.length > 0) {
      products = fetched;
    }
  } catch (error) {
    console.warn('[CatalogPage SSR] Using initialProducts fallback:', error);
  }

  return (
    <StorefrontLayout>
      {/* Editorial Header Banner */}
      <CatalogBanner />

      {/* Interactive Catalog Experience */}
      <CatalogClient initialProducts={products} />
    </StorefrontLayout>
  );
}
