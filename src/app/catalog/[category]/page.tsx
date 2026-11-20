import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { initialProducts } from '@/lib/seed/seed-data';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { CatalogClient } from '@/components/store/CatalogClient';
import { CategoryBanner } from '@/components/store/CategoryBanner';
import { getCategoryMeta, resolveCategoryId, isProductVisibleInShop } from '@/lib/utils/catalogUtils';
import { getServerLanguage } from '@/app/_utils/server-lang';
import { getTranslation } from '@/lib/i18n/locales';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const lang = getServerLanguage();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://viptadj.store';
  const meta = getCategoryMeta(params.category, lang);
  if (!meta) {
    return {
      title: getTranslation(lang, 'meta.category.fallback_title', 'Catalogue | VIP TADJ'),
    };
  }

  const title = `${meta.name} | ${getTranslation(lang, 'meta.category.title_suffix', 'VIP TADJ | Haute Couture Masculine')}`;
  const description = meta.description;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/catalog/${params.category}`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/catalog/${params.category}`,
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

export default async function CategoryCatalogPage({ params }: CategoryPageProps) {
  const lang = getServerLanguage();
  const meta = getCategoryMeta(params.category, lang);
  const categoryId = resolveCategoryId(params.category);

  if (!meta || !categoryId) {
    notFound();
  }

  let allProducts = initialProducts.filter(isProductVisibleInShop);
  try {
    const dataStore = getDataStore();
    const fetched = await dataStore.getProducts();
    if (fetched && fetched.length > 0) {
      allProducts = fetched.filter(isProductVisibleInShop);
    }
  } catch (error) {
    console.warn('[CategoryCatalogPage SSR] Using initialProducts fallback:', error);
  }

  return (
    <StorefrontLayout>
      {/* Category Editorial Hero Banner */}
      <CategoryBanner
        category={params.category}
        fallbackName={meta.name}
        fallbackSubtitle={meta.subtitle}
        fallbackDescription={meta.description}
      />

      {/* Interactive Catalog Component pre-locked to this category */}
      <CatalogClient
        initialProducts={allProducts}
        initialCategory={categoryId}
        isCategoryLocked={true}
      />
    </StorefrontLayout>
  );
}
