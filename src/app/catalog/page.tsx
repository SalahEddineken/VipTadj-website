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
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://viptadj.store';
  const title = getTranslation(
    lang,
    'meta.catalog.title',
    'Catalogue Complet | VIP TADJ | Prêt-à-Porter Masculin & Souliers'
  );
  const description = getTranslation(
    lang,
    'meta.catalog.description',
    "Explorez l'ensemble du vestiaire masculin VIP TADJ : vestes, chemises, pantalons, souliers et accessoires."
  );

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/catalog`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/catalog`,
      type: 'website',
      images: ['/images/logo.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/logo.png'],
    },
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
