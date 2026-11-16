import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { CatalogClient } from '@/components/store/CatalogClient';
import { CategoryBanner } from '@/components/store/CategoryBanner';
import { getCategoryMeta, resolveCategoryId } from '@/lib/utils/catalogUtils';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const meta = getCategoryMeta(params.category);
  if (!meta) {
    return {
      title: 'Catalogue | VIP TADJ',
    };
  }

  return {
    title: `${meta.name} | VIP TADJ | Haute Couture Masculine`,
    description: meta.description,
  };
}

export default async function CategoryCatalogPage({ params }: CategoryPageProps) {
  const meta = getCategoryMeta(params.category);
  const categoryId = resolveCategoryId(params.category);

  if (!meta || !categoryId) {
    notFound();
  }

  const dataStore = getDataStore();
  const allProducts = await dataStore.getProducts();

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
