'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { Product } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { useLanguage } from '@/lib/context/language-context';
import {
  getLocalizedProduct,
  getLocalizedCategoryName,
  getLocalizedSubcategory,
  getLocalizedColor,
} from '@/lib/i18n/catalog-translations';

export interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  priority?: boolean;
}

export function ProductCard({ product, onQuickView, priority = false }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const { language, t } = useLanguage();

  const localizedProduct = getLocalizedProduct(product, language);

  const primaryImage =
    product.images?.find((img) => img.isPrimary) ||
    product.images?.[0] || {
      id: 'placeholder',
      url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      alt: localizedProduct.title,
    };

  const secondaryImage =
    product.images?.find((img) => !img.isPrimary) || product.images?.[1];

  const colorMatchedImage = activeColor
    ? product.colors?.find((c) => c.name === activeColor)?.imageUrl
      ? {
        url: product.colors.find((c) => c.name === activeColor)!.imageUrl!,
        alt: `${localizedProduct.title} - ${activeColor}`,
      }
      : product.images?.find(
        (img) =>
          img.color &&
          activeColor &&
          img.color.toLowerCase() === activeColor.toLowerCase()
      )
    : null;

  const displayImage =
    colorMatchedImage || (isHovered && secondaryImage ? secondaryImage : primaryImage);

  const resolvedImageUrl = normalizeImageUrl(displayImage.url, {
    width: 600,
    quality: 85,
    fallbackCategory: product.categoryId,
  });

  const productUrl = `/catalog/${product.categorySlug || 'clothing'}/${product.slug}`;

  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
      ((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100
    )
    : 0;

  const isOutOfStock = !product.inStock || product.stockQuantity <= 0;

  const categoryTag =
    (product.subcategory ? getLocalizedSubcategory(product.subcategory, language) : null) ||
    (product.categorySlug ? getLocalizedCategoryName(product.categorySlug, language) : null) ||
    product.subcategory ||
    product.categorySlug;

  return (
    <div
      className="group relative flex flex-col bg-white border border-sand-200 shadow-luxury-subtle hover:shadow-luxury-card transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand-100">
        <Link href={productUrl} className="block w-full h-full">
          <img
            src={resolvedImageUrl}
            alt={displayImage.alt || localizedProduct.title}
            className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
              isHovered ? 'scale-105' : 'scale-100'
            } ${isOutOfStock ? 'grayscale opacity-75' : ''}`}
            loading={priority ? 'eager' : 'lazy'}
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5 z-10">
          {isOutOfStock ? (
            <span className="bg-neutral-800 text-neutral-200 text-[11px] uppercase tracking-wider px-2 py-0.5">
              {t('badge.out_of_stock', 'Épuisé')}
            </span>
          ) : hasDiscount ? (
            <span className="bg-sand-100 text-sand-800 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 border border-sand-300">
              <span dir="ltr">-{discountPercent}%</span>
            </span>
          ) : product.isNewArrival ? (
            <span className="bg-obsidian-950 text-ivory text-[11px] uppercase tracking-[0.2em] font-medium px-2 py-0.5 shadow-sm">
              {t('badge.new', 'Nouveau')}
            </span>
          ) : product.isFeatured ? (
            <span className="bg-gold-500 text-obsidian-950 text-[11px] uppercase tracking-[0.2em] font-semibold px-2 py-0.5 shadow-sm">
              {t('badge.vip_selection', 'Sélection VIP')}
            </span>
          ) : null}
        </div>

        {/* Quick View Button on Hover & Keyboard Focus */}
        {onQuickView && (
          <div className="absolute inset-x-3 bottom-3 hidden lg:flex justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product);
              }}
              className="w-full bg-ivory/95 hover:bg-white text-obsidian-950 py-2.5 px-4 text-xs tracking-[0.2em] uppercase font-semibold border border-sand-300 shadow-md backdrop-blur-sm transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t('catalog.quick_view', 'Aperçu Rapide')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Subcategory Tag */}
          <p className="text-xs uppercase tracking-[0.2em] text-sand-800 font-sans mb-1 text-start">
            {categoryTag}
          </p>

          {/* Product Title */}
          <Link
            href={productUrl}
            className="block text-sm font-serif font-medium text-obsidian-950 hover:text-gold-700 transition-colors line-clamp-2 min-h-[2.5rem] text-start"
          >
            {localizedProduct.title}
          </Link>
        </div>

        <div className="pt-3 border-t border-sand-100 mt-2">
          {/* Price Block */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-serif font-semibold text-base text-obsidian-950">
              {formatDZD(product.price, { locale: language })}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-500 line-through font-sans">
                {formatDZD(product.compareAtPrice!, { locale: language })}
              </span>
            )}
          </div>

          {/* Color Swatches Preview */}
          {Array.isArray(product.colors) && product.colors.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs uppercase tracking-wider text-sand-800 font-sans font-medium">
                {t('catalog.quick_view.color_label', 'Coloris :')}
              </span>
              <div className="flex items-center gap-1.5">
                {product.colors.map((c) => {
                  const isSelected = activeColor === c.name;
                  const localizedColorName = getLocalizedColor(c.name, language) || c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveColor(c.name);
                      }}
                      onMouseEnter={() => setActiveColor(c.name)}
                      className="w-7 h-7 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-transform"
                      aria-label={`${t('catalog.quick_view.color_label', 'Coloris :')} ${localizedColorName}`}
                      title={localizedColorName}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full border transition-transform block ${
                          isSelected
                            ? 'ring-1 ring-gold-600 scale-125 border-gold-600'
                            : 'border-sand-300 hover:scale-125'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
