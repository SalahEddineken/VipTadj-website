import React from 'react';
import { Metadata } from 'next';
import { getDataStore } from '@/lib/data-provider';
import { initialProducts } from '@/lib/seed/seed-data';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { CatalogClient } from '@/components/store/CatalogClient';
import { getServerLanguage } from '@/app/_utils/server-lang';
import { getTranslation } from '@/lib/i18n/locales';
import { isProductVisibleInShop } from '@/lib/utils/catalogUtils';

export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLanguage();
  return {
    title: getTranslation(
      lang,
      'meta.catalog.title',
      'Catalogue Complet | VIP TADJ | Prêt-à-Porter Masculin & Souliers'
    ),
    description: getTranslation(
      lang,
      'meta.catalog.description',
      "Explorez l'ensemble du vestiaire masculin VIP TADJ : vestes, chemises, pantalons, souliers et accessoires."
    ),
  };
}

export default async function CatalogPage() {
  let products = initialProducts.filter(isProductVisibleInShop);
  try {
    const dataStore = getDataStore();
    const fetched = await dataStore.getProducts();
    if (fetched && fetched.length > 0) {
      products = fetched.filter(isProductVisibleInShop);
    }
  } catch (error) {
    console.warn('[CatalogPage SSR] Using initialProducts fallback:', error);
  }

  return (
    <StorefrontLayout>
      {/* Interactive Catalog Experience */}
      <CatalogClient initialProducts={products} />
    </StorefrontLayout>
  );
}
