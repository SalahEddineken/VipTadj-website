import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';

interface DirectProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: DirectProductPageProps): Promise<Metadata> {
  const dataStore = getDataStore();
  const product = await dataStore.getProductBySlug(params.slug);

  if (!product) {
    return {
      title: 'Modèle Non Trouvé | VIP TADJ',
    };
  }

  return {
    title: `${product.title} | VIP TADJ — Haute Couture Masculine`,
    description: product.description,
  };
}

export default async function DirectProductDetailPage({
  params,
}: DirectProductPageProps) {
  const dataStore = getDataStore();
  const product = await dataStore.getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <StorefrontLayout>
      <ProductDetailPage product={product} />
    </StorefrontLayout>
  );
}
