'use client';

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export interface ZeroResultsProps {
  onReset: () => void;
  query?: string;
}

export function ZeroResults({ onReset, query }: ZeroResultsProps) {
  const { t } = useLanguage();

  return (
    <div className="py-20 px-4 text-center max-w-lg mx-auto flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center text-gold-600 mb-6 border border-sand-300">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="luxury-serif-title text-2xl text-obsidian-950 mb-3">
        {t('catalog.zero_results.title', 'Aucun Modèle Trouvé')}
      </h3>
      {query ? (
        <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-sans mb-8">
          {t('catalog.zero_results.desc_query', 'Aucun résultat trouvé pour')}{' '}
          <span className="font-semibold text-obsidian-900">{query}</span>
        </p>
      ) : (
        <p className="text-xs md:text-sm text-neutral-600 leading-relaxed font-sans mb-8">
          {t(
            'catalog.zero_results.desc',
            'Aucune création ne correspond à vos critères de recherche actuels.'
          )}
        </p>
      )}
      <button
        type="button"
        onClick={onReset}
        className="btn-luxury-primary flex items-center justify-center gap-2 text-xs uppercase tracking-wider sm:tracking-[0.2em] px-4 sm:px-8 py-3.5"
      >
        <RotateCcw className="w-3.5 h-3.5 rtl:rotate-180" />
        <span>{t('catalog.zero_results.reset', 'Réinitialiser les Filtres')}</span>
      </button>
    </div>
  );
}
