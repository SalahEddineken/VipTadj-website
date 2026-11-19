'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error('[VIP TADJ Application Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-obsidian-950 text-ivory">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Warning Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 mx-auto">
          <AlertTriangle className="w-10 h-10" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="font-cinzel text-xl sm:text-2xl font-semibold text-ivory tracking-wide">
            {t('error.title', 'Une interruption est survenue')}
          </h1>
          <p className="text-sm text-obsidian-300 max-w-sm mx-auto leading-relaxed">
            {t(
              'error.desc',
              "Nous n'avons pas pu charger cette page. Veuillez réessayer ou revenir à l'accueil de la boutique."
            )}
          </p>
          {error.digest && (
            <p className="text-[10px] text-obsidian-500 font-mono">
              {t('error.ref_prefix', 'Réf :')} {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-gold-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('error.retry', 'Réessayer')}</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 border border-gold-500/30 text-gold-400 hover:text-ivory font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{t('nav.home', 'Accueil')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
