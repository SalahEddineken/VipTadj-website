'use client';

import React from 'react';
import { Product } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedCategoryName, getLocalizedProduct } from '@/lib/i18n/catalog-translations';

export interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const { language, t } = useLanguage();
  const localizedProduct = getLocalizedProduct(product, language);

  const categoryName = localizedProduct.categoryId
    ? getLocalizedCategoryName(localizedProduct.categoryId, language)
    : localizedProduct.categorySlug;

  const hasDiscount =
    localizedProduct.compareAtPrice && localizedProduct.compareAtPrice > localizedProduct.price;

  const savings = hasDiscount ? localizedProduct.compareAtPrice! - localizedProduct.price : 0;
  const discountPercent = hasDiscount
    ? Math.round((savings / localizedProduct.compareAtPrice!) * 100)
    : 0;

  const isAvailable = localizedProduct.inStock && localizedProduct.stockQuantity > 0;

  return (
    <div className="space-y-4 pb-6 border-b border-sand-200">
      {/* Category / Subcategory Micro-tag */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-700 font-sans font-medium">
          {categoryName} {localizedProduct.subcategory ? `• ${t(`subcategory.${localizedProduct.subcategory}`, localizedProduct.subcategory)}` : ''}
        </p>
        <span
          className={`text-xs tracking-wider uppercase px-2 py-0.5 font-medium ${
            isAvailable
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {isAvailable ? t('pdp.stock.in_stock', 'En Stock (58 Wilayas)') : t('pdp.stock.out_of_stock', 'Rupture de Stock')}
        </span>
      </div>

      {/* Product Title */}
      <h1 className="luxury-serif-title text-xl sm:text-2xl md:text-3xl lg:text-4xl text-obsidian-950 font-normal leading-snug md:leading-tight text-balance break-words">
        {localizedProduct.title}
      </h1>

      {/* Pricing Section */}
      <div className="flex items-baseline flex-wrap gap-3 pt-1">
        <span className="font-serif text-2xl md:text-3xl font-bold text-obsidian-950">
          {formatDZD(localizedProduct.price, { locale: language })}
        </span>

        {hasDiscount && (
          <>
            <span className="text-sm md:text-base text-neutral-500 line-through font-sans">
              {formatDZD(localizedProduct.compareAtPrice!, { locale: language })}
            </span>
            <span className="bg-sand-100 text-sand-800 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 border border-sand-300">
              -{discountPercent}%
            </span>
            <span className="text-xs text-gold-700 font-medium">
              ({t('badge.discount', 'Économisez')} {formatDZD(savings, { locale: language })})
            </span>
          </>
        )}
      </div>

      {/* COD Notice */}
      <div className="flex items-center gap-2 pt-2 text-xs text-neutral-600 font-sans">
        <ShieldCheck className="w-4 h-4 text-gold-700 flex-shrink-0" />
        <span>{t('pdp.cod_notice', 'Paiement en espèces à la livraison (COD) • Aucun paiement en ligne requis')}</span>
      </div>
    </div>
  );
}
