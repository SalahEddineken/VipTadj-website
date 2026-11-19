import Link from 'next/link';
import { Compass, Home, ShoppingBag } from 'lucide-react';
import { getServerLanguage } from '@/app/_utils/server-lang';
import { getTranslation } from '@/lib/i18n/locales';

export default function NotFound() {
  const lang = getServerLanguage();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-obsidian-950 text-ivory">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Crest / Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 mx-auto shadow-gold-sm">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        {/* Status code */}
        <div className="space-y-2">
          <p className="font-cinzel text-5xl sm:text-6xl font-bold tracking-widest text-gold-400">
            404
          </p>
          <h1 className="font-cinzel text-xl sm:text-2xl font-semibold text-ivory tracking-wide">
            {getTranslation(lang, 'not_found.title', 'Page Introuvable')}
          </h1>
          <p className="text-sm text-obsidian-300 max-w-sm mx-auto leading-relaxed">
            {getTranslation(
              lang,
              'not_found.desc',
              "La pièce d'exception que vous recherchez semble introuvable ou a été déplacée dans notre catalogue."
            )}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/catalog"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-gold-sm hover:shadow-gold-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{getTranslation(lang, 'not_found.cta_catalog', 'Explorer le Catalogue')}</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-obsidian-900 hover:bg-obsidian-850 border border-gold-500/30 text-gold-400 hover:text-ivory font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>{getTranslation(lang, 'nav.home', 'Accueil')}</span>
          </Link>
        </div>

        {/* Subtitle brand accent */}
        <div className="pt-6 border-t border-gold-500/10">
          <p className="font-cinzel text-xs tracking-widest text-gold-500/60 uppercase">
            {getTranslation(lang, 'not_found.brand_footer', 'VIP TADJ — Haute Élégance Masculine')}
          </p>
        </div>
      </div>
    </div>
  );
}
