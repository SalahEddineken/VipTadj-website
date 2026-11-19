'use client';

import React from 'react';
import { Ruler, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedSize } from '@/lib/i18n/catalog-translations';

export interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
  sizeInventory?: Record<string, number>;
  inStock: boolean;
  hasError?: boolean;
  onOpenSizeGuide?: () => void;
}

const ITALIAN_SIZES = new Set(['48', '50', '52', '54', '56']);
const ITALIAN_TO_STANDARD: Record<string, string> = {
  '48': 'S',
  '50': 'M',
  '52': 'L',
  '54': 'XL',
  '56': 'XXL',
};
const STANDARD_SIZES_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export function SizeSelector({
  sizes = [],
  selectedSize,
  onSelectSize,
  sizeInventory,
  inStock,
  hasError = false,
  onOpenSizeGuide,
}: SizeSelectorProps) {
  const { t, language } = useLanguage();

  const normalizedSizes = React.useMemo(() => {
    if (!sizes || sizes.length === 0) return [];
    const hasItalian = sizes.some((s) => ITALIAN_SIZES.has(s));
    if (!hasItalian) return sizes;

    const existingStandard = sizes.filter((s) => !ITALIAN_SIZES.has(s));
    let result: string[];
    if (existingStandard.length > 0) {
      result = existingStandard;
    } else {
      result = Array.from(new Set(sizes.map((s) => ITALIAN_TO_STANDARD[s] || s)));
    }

    return result.sort((a, b) => {
      const idxA = STANDARD_SIZES_ORDER.indexOf(a);
      const idxB = STANDARD_SIZES_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [sizes]);

  if (!normalizedSizes || normalizedSizes.length === 0) return null;

  const isSizeAvailable = (size: string) => {
    if (!inStock) return false;
    if (sizeInventory && Object.keys(sizeInventory).length > 0) {
      const direct = sizeInventory[size] ?? 0;
      if (direct > 0) return true;
      const reverseItalian = Object.entries(ITALIAN_TO_STANDARD).find(([_, std]) => std === size)?.[0];
      if (reverseItalian && (sizeInventory[reverseItalian] ?? 0) > 0) return true;
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-3 py-4 border-b border-sand-200">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-obsidian-950">
          {t('pdp.size.select_label', 'Sélectionner une taille :')}
        </span>
        {onOpenSizeGuide && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="flex items-center gap-1.5 text-xs text-gold-700 hover:text-gold-800 transition-colors uppercase tracking-wider font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{t('pdp.size.guide_btn', 'Guide des tailles')}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {normalizedSizes.map((size) => {
          const available = isSizeAvailable(size);
          const isSelected = selectedSize === size;

          return (
            <button
              key={size}
              type="button"
              disabled={!available}
              onClick={() => onSelectSize(size)}
              className={`min-w-[3rem] h-11 px-3 text-xs font-sans uppercase tracking-wider border transition-all flex flex-col items-center justify-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                isSelected
                  ? 'bg-obsidian-950 text-ivory border-obsidian-950 ring-1 ring-gold-500 shadow-sm font-semibold'
                  : available
                  ? 'bg-white text-obsidian-900 border-sand-300 hover:border-gold-500'
                  : 'bg-sand-100 text-neutral-400 border-sand-200 cursor-not-allowed line-through opacity-50'
              }`}
              aria-label={`${t('pdp.size.prefix', 'Taille')} ${getLocalizedSize(size, language)}${!available ? ` - ${t('pdp.size.out_of_stock', 'Épuisé')}` : ''}`}
              aria-pressed={isSelected}
            >
              <span>{getLocalizedSize(size, language)}</span>
              {!available && (
                <span className="text-xs no-underline tracking-tighter text-red-700 font-sans -mt-0.5">
                  {t('pdp.size.out_of_stock', 'Épuisé')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {hasError && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-sans mt-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {t(
              'pdp.size.required_alert',
              "Veuillez sélectionner votre taille avant d'ajouter au panier ou de commander."
            )}
          </span>
        </div>
      )}
    </div>
  );
}
