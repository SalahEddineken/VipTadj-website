'use client';

import React, { useState } from 'react';
import { Product, ProductColor } from '@/types';
import { PDPBreadcrumb } from './PDPBreadcrumb';
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import { ColorSelector } from './ColorSelector';
import { SizeSelector } from './SizeSelector';
import { AddToCartSection } from './AddToCartSection';
import { TrustPillarsBar } from './TrustPillarsBar';
import { SizeGuideModal } from './SizeGuideModal';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { normalizeProductSizes } from '@/lib/utils/catalogUtils';

export interface ProductDetailPageProps {
  product: Product;
}

export function ProductDetailPage({ product }: ProductDetailPageProps) {
  const { language } = useLanguage();
  const localizedProduct = normalizeProductSizes(getLocalizedProduct(product, language));

  // If product only has 1 size (e.g. 'Unique' or 'Taille Unique'), select it by default
  const defaultSize =
    localizedProduct.sizes && localizedProduct.sizes.length === 1 ? localizedProduct.sizes[0] : null;

  // Default color: prefer first in-stock color or first available color
  const defaultColor =
    localizedProduct.colors && localizedProduct.colors.length > 0
      ? localizedProduct.colors.find((c) => c.inStock) || localizedProduct.colors[0]
      : null;

  const [selectedSize, setSelectedSize] = useState<string | null>(defaultSize);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(defaultColor);
  const [hasSizeError, setHasSizeError] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const handleSelectSize = (size: string) => {
    setSelectedSize(size);
    setHasSizeError(false);
  };

  const handleValidateSize = (): boolean => {
    if (localizedProduct.sizes && localizedProduct.sizes.length > 0 && !selectedSize) {
      setHasSizeError(true);
      return false;
    }
    setHasSizeError(false);
    return true;
  };

  return (
    <div className="luxury-container py-6 md:py-10">
      {/* Breadcrumb */}
      <PDPBreadcrumb product={localizedProduct} />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 pt-4 items-start">
        {/* Left Column: Gallery (7 cols on lg) */}
        <div className="lg:col-span-7">
          <ProductGallery
            images={localizedProduct.images}
            title={localizedProduct.title}
            categoryId={localizedProduct.categoryId}
            selectedColor={selectedColor}
            colors={localizedProduct.colors}
          />
        </div>

        {/* Right Column: Information & Purchase Actions (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="sticky top-28 space-y-6 divide-y divide-sand-200/80 [&>*:not(:first-child)]:pt-6">
            {/* Header & Pricing */}
            <ProductInfo product={localizedProduct} />

            {/* Color Selector */}
            {localizedProduct.colors && localizedProduct.colors.length > 0 && (
              <ColorSelector
                colors={localizedProduct.colors}
                selectedColor={selectedColor}
                onSelectColor={(col) => setSelectedColor(col)}
              />
            )}

            {/* Size Selector */}
            <SizeSelector
              sizes={localizedProduct.sizes}
              selectedSize={selectedSize}
              onSelectSize={handleSelectSize}
              sizeInventory={localizedProduct.sizeInventory}
              inStock={localizedProduct.inStock}
              hasError={hasSizeError}
              onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            />

            {/* Add to Cart & Express Direct Checkout */}
            <AddToCartSection
              product={localizedProduct}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              onValidateSize={handleValidateSize}
            />

            {/* Algerian Delivery & Trust Pillars */}
            <TrustPillarsBar />
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={localizedProduct.categoryId}
      />
    </div>
  );
}
