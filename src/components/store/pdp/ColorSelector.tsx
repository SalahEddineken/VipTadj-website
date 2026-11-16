'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ProductColor } from '@/types';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedColor } from '@/lib/i18n/catalog-translations';

export interface ColorSelectorProps {
  colors?: ProductColor[];
  selectedColor: ProductColor | null;
  onSelectColor: (color: ProductColor) => void;
}

export function ColorSelector({
  colors,
  selectedColor,
  onSelectColor,
}: ColorSelectorProps) {
  const { language, t } = useLanguage();

  if (!colors || colors.length === 0) return null;

  const currentColorName = selectedColor?.name || colors[0]?.name || '';
  const localizedCurrentColor = getLocalizedColor(currentColorName, language) || currentColorName;

  return (
    <div className="py-4 border-b border-sand-200">
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs uppercase tracking-[0.2em] text-sand-700 font-semibold flex items-center gap-1.5 font-sans">
          <span>{t('pdp.color.label', 'Couleur :')}</span>
          <span className="text-obsidian-950 font-serif font-medium normal-case tracking-normal text-sm">
            {localizedCurrentColor}
          </span>
        </label>
        {selectedColor && !selectedColor.inStock && (
          <span className="text-xs text-red-600 font-sans tracking-wider uppercase font-medium bg-red-50 border border-red-200 px-2 py-0.5">
            {t('pdp.color.out_of_stock', 'Épuisé dans ce coloris')}
          </span>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label={t('pdp.color.select_aria', 'Sélectionnez un coloris')}
        className="flex flex-wrap items-center gap-3"
      >
        {colors.map((col) => {
          const isSelected = selectedColor?.name === col.name;
          const localizedColorName = getLocalizedColor(col.name, language) || col.name;
          const isLight =
            col.hex.toLowerCase() === '#ffffff' ||
            col.hex.toLowerCase() === '#fff' ||
            col.hex.toLowerCase() === '#f8f8f8' ||
            col.hex.toLowerCase() === '#f5f5f0';

          return (
            <button
              key={col.name}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${t('pdp.color.prefix', 'Coloris')} ${localizedColorName}${!col.inStock ? ` (${t('badge.out_of_stock', 'Épuisé')})` : ''}`}
              onClick={() => onSelectColor(col)}
              className={`group relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                !col.inStock ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full border transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-gold-600 ring-offset-2 ring-offset-ivory scale-110 shadow-sm border-gold-600'
                    : 'border-sand-300 group-hover:scale-105'
                } ${isLight ? 'border-sand-400' : ''}`}
                style={{ backgroundColor: col.hex }}
              />
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 absolute ${
                    isLight ? 'text-obsidian-900' : 'text-ivory'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
