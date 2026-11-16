import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { initialProducts } from '@/lib/seed/seed-data';
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
  let product = null;
  try {
    const dataStore = getDataStore();
    product = await dataStore.getProductBySlug(params.slug);
  } catch {
    product = initialProducts.find((p) => p.slug === params.slug) || null;
  }
  if (!product) {
    product = initialProducts.find((p) => p.slug === params.slug) || null;
  }

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
  let product = null;
  try {
    const dataStore = getDataStore();
    product = await dataStore.getProductBySlug(params.slug);
  } catch {
    product = initialProducts.find((p) => p.slug === params.slug) || null;
  }
  if (!product) {
    product = initialProducts.find((p) => p.slug === params.slug) || null;
  }

  if (!product) {
    notFound();
  }

  return (
    <StorefrontLayout>
      <ProductDetailPage product={product} />
    </StorefrontLayout>
  );
}
