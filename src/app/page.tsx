'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, Sparkles, ArrowRight, Award, Compass, Clock } from 'lucide-react';
import { formatDZD } from '@/lib/utils/formatDZD';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { initialProducts } from '@/lib/seed/seed-data';
import { useLanguage } from '@/lib/context/language-context';

export default function HomePage() {
  const { language, t } = useLanguage();

  const featuredProducts = initialProducts
    .filter((p) => p.isFeatured)
    .slice(0, 4);

  return (
    <StorefrontLayout>
      {/* 1. Hero Editorial Showcase */}
      <section className="relative bg-obsidian-950 text-ivory py-12 sm:py-20 md:py-36 border-b border-obsidian-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.12),transparent_50%)]" />
        <div className="luxury-container relative z-10 flex flex-col items-center text-center max-w-4xl">
          <h1 className="luxury-serif-title text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.15] md:leading-tight font-medium mb-4 text-ivory text-balance">
            {t('home.hero.title', "L'Art du Costume & du Soulier Masculin")}
          </h1>
          <p className="text-gold-400 text-sm md:text-base font-serif italic mb-4">
            {t('home.hero.season', 'Collection Automne-Hiver 2026')}
          </p>
          <p className="text-neutral-300 text-sm md:text-base font-sans max-w-2xl mb-10 leading-relaxed text-balance">
            {t(
              'home.hero.description',
              "Maison de haute confection à Alger. L'élégance sartoriale sans compromis pour l'homme d'influence."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/catalog" className="btn-luxury-gold flex items-center justify-center gap-2">
              <span>{t('home.hero.cta_catalog', 'Explorer le Catalogue')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <Link href="/catalog?category=clothing" className="btn-luxury-outline text-ivory border-neutral-700 hover:bg-neutral-800 text-center">
              {t('home.hero.cta_collection', 'Collection Sartoriale')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Pillars of Distinction (Algerian Reassurance) */}
      <section className="py-12 sm:py-16 bg-ivory border-b border-sand-200">
        <h2 className="sr-only">Nos Engagements d&apos;Excellence</h2>
        <div className="luxury-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          <div className="p-6 sm:p-8 border border-sand-200/80 bg-white/70 backdrop-blur-sm">
            <Truck className="w-8 h-8 text-gold-700 mb-4" />
            <h3 className="luxury-serif-title text-lg mb-2 text-obsidian-950">
              {t('home.pillars.wilayas.title', '58 Wilayas Algériennes')}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {t('home.pillars.wilayas.desc', 'Expédition express avec Yalidine & ZR Express. Frais fixes transparents dès 400 DA et confirmation téléphonique avant tout envoi.')}
            </p>
          </div>

          <div className="p-6 sm:p-8 border border-sand-200/80 bg-white/70 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-gold-700 mb-4" />
            <h3 className="luxury-serif-title text-lg mb-2 text-obsidian-950">
              {t('home.pillars.cod.title', 'Paiement à la Livraison (COD)')}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {t('home.pillars.cod.desc', 'Payez en espèces à la réception de votre colis. Aucune carte bancaire requise. Essayage et échange garantis sous 48h.')}
            </p>
          </div>

          <div className="p-6 sm:p-8 border border-sand-200/80 bg-white/70 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <Sparkles className="w-8 h-8 text-gold-700 mb-4" />
            <h3 className="luxury-serif-title text-lg mb-2 text-obsidian-950">
              {t('home.pillars.craft.title', 'Coupe & Finitions Haute Couture')}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {t('home.pillars.craft.desc', 'Confection semi-entoilée, boutonnières sartoriales, doublures soie et cuirs pleine fleur d\'Italie et d\'Espagne.')}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Universes Grid Showcase */}
      <section className="py-12 sm:py-16 md:py-20 bg-obsidian-950 text-ivory border-b border-obsidian-800">
        <div className="luxury-container">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <h2 className="luxury-serif-title text-2xl sm:text-3xl md:text-5xl text-ivory mb-4 text-balance">
              {t('home.universes.subtitle', 'Trois expressions de la distinction masculine absolue.')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Vêtements */}
            <Link
              href="/catalog/vetements"
              className="group relative aspect-[3/4] overflow-hidden bg-obsidian-950 shadow-luxury-card block"
            >
              <img
                src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1200"
                alt="Collection Costumes sur-mesure"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/90 via-obsidian-950/30 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-ivory">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-400 block mb-1">
                  Collection Maîtres Tailleurs
                </span>
                <h3 className="luxury-serif-title text-2xl text-ivory mb-2">
                  {t('home.universes.clothing.title', 'Costumes & Confection')}
                </h3>
                <p className="text-xs text-neutral-300 font-sans line-clamp-2 mb-3">
                  {t('home.universes.clothing.desc', 'Laines d\'exception, tombé impeccable et vestes demi-entoilées pour vos réceptions d\'apparat.')}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider group-hover:text-gold-300">
                  <span>{t('home.universes.discover', 'Découvrir')}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </span>
              </div>
            </Link>

            {/* Chaussures */}
            <Link
              href="/catalog/chaussures"
              className="group relative aspect-[3/4] overflow-hidden bg-obsidian-950 shadow-luxury-card block"
            >
              <img
                src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=1200"
                alt="Collection Souliers de prestige"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/90 via-obsidian-950/30 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-ivory">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-400 block mb-1">
                  Art Bottier Européen
                </span>
                <h3 className="luxury-serif-title text-2xl text-ivory mb-2">
                  {t('home.universes.shoes.title', 'Souliers & Richelieus')}
                </h3>
                <p className="text-xs text-neutral-300 font-sans line-clamp-2 mb-3">
                  {t('home.universes.shoes.desc', 'Cuirs pleine fleur patinés main, montages Goodyear et lignes racées de maître bottier.')}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider group-hover:text-gold-300">
                  <span>{t('home.universes.discover', 'Découvrir')}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </span>
              </div>
            </Link>

            {/* Accessoires */}
            <Link
              href="/catalog/accessoires"
              className="group relative aspect-[3/4] overflow-hidden bg-obsidian-950 shadow-luxury-card block"
            >
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200"
                alt="Collection Maroquinerie de prestige"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/90 via-obsidian-950/30 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 text-ivory">
                <span className="text-xs uppercase tracking-[0.3em] text-gold-400 block mb-1">
                  Les Détails du Gentilhomme
                </span>
                <h3 className="luxury-serif-title text-2xl text-ivory mb-2">
                  {t('home.universes.accessories.title', 'Maroquinerie & Soieries')}
                </h3>
                <p className="text-xs text-neutral-300 font-sans line-clamp-2 mb-3">
                  {t('home.universes.accessories.desc', 'Cravates en soie de Côme, ceintures bombées et boutons de manchette or & onyx.')}
                </p>
                <span className="inline-flex items-center gap-1.5 text-xs text-gold-400 font-semibold uppercase tracking-wider group-hover:text-gold-300">
                  <span>{t('home.universes.discover', 'Découvrir')}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Creations Showcase */}
      <section className="py-12 sm:py-16 md:py-20 bg-ivory border-b border-sand-200">
        <div className="luxury-container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="luxury-serif-title text-2xl sm:text-3xl md:text-4xl text-obsidian-950 text-balance">
                {t('home.featured.title', 'Créations Emblématiques')}
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs uppercase tracking-wider font-semibold text-gold-700 hover:text-gold-800 flex items-center gap-1.5 transition-colors self-start md:self-auto"
            >
              <span>{t('home.featured.view_all', 'Voir tout le catalogue')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Craftsmanship & Heritage Story */}
      <section className="py-12 sm:py-16 md:py-24 bg-white border-b border-sand-200">
        <div className="luxury-container grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="luxury-serif-title text-2xl sm:text-3xl md:text-4xl text-obsidian-950 mb-6 leading-tight text-balance">
              {t('home.story.title', "L'Excellence Sartoriale au Cœur d'Alger")}
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-6 font-sans">
              {t('home.story.p1', "Depuis sa fondation, la Maison VIP TADJ sublime la silhouette masculine par une sélection intransigeante d'étoffes nobles et une coupe millimétrée.")}
            </p>
            <p className="text-neutral-600 text-sm leading-relaxed mb-8 font-sans">
              {t('home.story.p2', "Chaque costume, blazer et soulier est rigoureusement sélectionné pour répondre aux attentes de l'homme algérien moderne : distinction, prestance et confort absolu.")}
            </p>

            <div className="pt-6 border-t border-sand-200 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="font-serif text-2xl md:text-3xl font-normal text-obsidian-950 block mb-1">
                  {t('home.story.stat1.val', '100%')}
                </span>
                <span className="text-xs uppercase tracking-wider text-sand-800 font-sans font-medium">
                  {t('home.story.stat1.label', 'Laine Vierge & Cuir')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl md:text-3xl font-normal text-obsidian-950 block mb-1">
                  {t('home.story.stat2.val', '58')}
                </span>
                <span className="text-xs uppercase tracking-wider text-sand-800 font-sans font-medium">
                  {t('home.story.stat2.label', 'Wilayas Desservies')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl md:text-3xl font-normal text-obsidian-950 block mb-1">
                  {t('home.story.stat3.val', '48h')}
                </span>
                <span className="text-xs uppercase tracking-wider text-sand-800 font-sans font-medium">
                  {t('home.story.stat3.label', 'Échange Garanti')}
                </span>
              </div>
            </div>
          </div>

          <div className="relative aspect-[4/3] bg-sand-100 overflow-hidden shadow-luxury-card border border-sand-200">
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200"
              alt="Atelier Sartorial VIP TADJ"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-obsidian-950/10" />
          </div>
        </div>
      </section>

      {/* 6. Infrastructure Status Notification */}
      <section className="sr-only" aria-label="VIP TADJ Core Infrastructure Status">
        <div className="luxury-container flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-neutral-600">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-obsidian-950 uppercase tracking-wider">
              VIP TADJ Core Infrastructure Status
            </span>
            <span className="hidden sm:inline text-neutral-400">|</span>
            <span className="hidden sm:inline">
              Catalogue &bull; Panier &bull; Checkout COD
            </span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 text-xs">
            <span>Exemple Format DZD : <strong className="text-obsidian-950 font-mono">{formatDZD(38500, { locale: language })}</strong></span>
            <span>Tarif Livraison Base : <strong className="text-obsidian-950 font-mono">{formatDZD(400, { locale: language })}</strong></span>
            <span>Seuil Franco : <strong className="text-obsidian-950 font-mono">{formatDZD(15000, { locale: language })}</strong></span>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
