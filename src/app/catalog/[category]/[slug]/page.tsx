import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { initialProducts } from '@/lib/seed/seed-data';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { getServerLanguage } from '@/app/_utils/server-lang';
import { getTranslation } from '@/lib/i18n/locales';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { isProductVisibleInShop } from '@/lib/utils/catalogUtils';

interface PDPPageProps {
  params: {
    category: string;
    slug: string;
  };
}

async function resolveProductBySlug(slug: string) {
  let product = null;
  try {
    const dataStore = getDataStore();
    product = await dataStore.getProductBySlug(slug);
  } catch {
    product = initialProducts.find((p) => p.slug === slug) || null;
  }
  if (!product) {
    product = initialProducts.find((p) => p.slug === slug) || null;
  }
  return product;
}

export async function generateMetadata({
  params,
}: PDPPageProps): Promise<Metadata> {
  const lang = getServerLanguage();
  const product = await resolveProductBySlug(params.slug);

  if (!product || !isProductVisibleInShop(product)) {
    return {
      title: getTranslation(lang, 'meta.product.not_found', 'Modèle Non Trouvé | VIP TADJ'),
    };
  }

  const localized = getLocalizedProduct(product, lang);
  return {
    title: `${localized.title} | ${getTranslation(lang, 'meta.product.title_suffix', 'VIP TADJ — Haute Couture Masculine')}`,
    description: localized.description,
  };
}

export default async function CatalogProductDetailPage({ params }: PDPPageProps) {
  const product = await resolveProductBySlug(params.slug);

  if (!product || !isProductVisibleInShop(product)) {
    notFound();
  }

  return (
    <StorefrontLayout>
      <ProductDetailPage product={product} />
    </StorefrontLayout>
  );
}
