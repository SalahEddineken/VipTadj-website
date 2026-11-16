import React from 'react';
import { Product } from '@/types';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  onQuickView?: (product: Product) => void;
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, onQuickView, columns = 3 }: ProductGridProps) {
  const gridClasses = {
    2: 'grid grid-cols-1 sm:grid-cols-2 gap-6',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  }[columns];

  return (
    <div className={gridClasses}>
      {products.map((product, idx) => (
        <ProductCard
          key={product.id || product.slug}
          product={product}
          onQuickView={onQuickView}
          priority={idx < 4}
        />
      ))}
    </div>
  );
}
