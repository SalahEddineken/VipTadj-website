'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedCategoryName, getLocalizedProduct } from '@/lib/i18n/catalog-translations';

export interface PDPBreadcrumbProps {
  product: Product;
}

export function PDPBreadcrumb({ product }: PDPBreadcrumbProps) {
  const { language, t } = useLanguage();
  const localizedProduct = getLocalizedProduct(product, language);

  const categoryName = localizedProduct.categoryId
    ? getLocalizedCategoryName(localizedProduct.categoryId, language)
    : localizedProduct.categorySlug;

  const categoryUrl = `/catalog?category=${localizedProduct.categoryId}`;

  return (
    <nav
      className="py-4 text-xs font-sans text-neutral-500 uppercase tracking-wider flex items-center flex-wrap gap-1.5"
      aria-label="Fil d'Ariane"
    >
      <Link href="/" className="hover:text-gold-600 transition-colors">
        {t('pdp.breadcrumb.home', 'Accueil')}
      </Link>
      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 rtl:rotate-180" />
      <Link href={categoryUrl} className="hover:text-gold-600 transition-colors">
        {categoryName}
      </Link>
      {localizedProduct.subcategory && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 rtl:rotate-180" />
          <Link
            href={`/catalog?category=${localizedProduct.categoryId}&subcategory=${localizedProduct.subcategory}`}
            className="hover:text-gold-600 transition-colors"
          >
            {t(`subcategory.${localizedProduct.subcategory}`, localizedProduct.subcategory)}
          </Link>
        </>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 rtl:rotate-180" />
      <span className="text-obsidian-950 font-medium truncate max-w-[180px] sm:max-w-xs md:max-w-md">
        {localizedProduct.title}
      </span>
    </nav>
  );
}
