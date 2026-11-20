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

interface DirectProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: DirectProductPageProps): Promise<Metadata> {
  const lang = getServerLanguage();
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

  if (!product || !isProductVisibleInShop(product)) {
    return {
      title: getTranslation(lang, 'meta.product.not_found', 'Modèle Non Trouvé | VIP TADJ'),
    };
  }

  const localized = getLocalizedProduct(product, lang);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://viptadj.store';
  const firstImageUrl = product.images && product.images.length > 0 ? product.images[0].url : '/images/logo.png';

  return {
    title: `${localized.title} | ${getTranslation(lang, 'meta.product.title_suffix', 'VIP TADJ — Haute Couture Masculine')}`,
    description: localized.description,
    openGraph: {
      title: `${localized.title} | VIP TADJ`,
      description: localized.description,
      url: `${siteUrl}/product/${product.slug}`,
      images: [{ url: firstImageUrl }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${localized.title} | VIP TADJ`,
      description: localized.description,
      images: [firstImageUrl],
    },
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

  if (!product || !isProductVisibleInShop(product)) {
    notFound();
  }

  const lang = getServerLanguage();
  const localized = getLocalizedProduct(product, lang);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localized.title,
    description: localized.description,
    image: product.images.map((img) => img.url),
    sku: product.id,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'DZD',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'VIP TADJ',
      },
    },
  };

  return (
    <StorefrontLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailPage product={product} />
    </StorefrontLayout>
  );
}
