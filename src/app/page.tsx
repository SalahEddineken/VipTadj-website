'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowRight,
  Award,
  Compass,
  Clock,
} from 'lucide-react';
import { formatDZD } from '@/lib/utils/formatDZD';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { ProductCard } from '@/components/store/ProductCard';
import { initialProducts, DEFAULT_STORE_SETTINGS } from '@/lib/seed/seed-data';
import { isProductVisibleInShop } from '@/lib/utils/catalogUtils';
import { useLanguage } from '@/lib/context/language-context';
import { HeroVideoConfig, Product, StoreSettings } from '@/types';

const UNIVERSES_CURATIONS = {
  clothing: {
    ar: ['تيشرتات وهوديز', 'جينز وبناطيل كاجوال', 'سترات وجواكت خفيفة'],
    en: ['T-Shirts & Hoodies', 'Jeans & Casual Pants', 'Jackets & Overshirts'],
    fr: ['T-shirts & Hoodies', 'Jeans & Pantalons Casual', 'Vestes & Blousons'],
  },
  shoes: {
    ar: ['سنيكرز عصرية', 'أحذية كاجوال مريحة', 'أحذية رياضية خفيفة'],
    en: ['Modern Sneakers', 'Casual Shoes', 'Comfort Everyday Walk'],
    fr: ['Sneakers Tendances', 'Chaussures Casual', 'Baskets Souples'],
  },
  accessories: {
    ar: ['قبعات وكابات', 'حقائب كتف ومحافظ', 'أحزمة وساعات كاجوال'],
    en: ['Caps & Headwear', 'Crossbody Bags & Wallets', 'Belts & Daily Watches'],
    fr: ['Casquettes & Bonnets', 'Sacs & Portefeuilles', 'Ceintures & Montres'],
  },
};

export default function HomePage() {
  const { language, t } = useLanguage();
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>(() => initialProducts.filter(isProductVisibleInShop));
  const [heroVideo, setHeroVideo] = useState<HeroVideoConfig | undefined>(
    DEFAULT_STORE_SETTINGS.heroVideo
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [settingsRes, productsRes] = await Promise.allSettled([
          fetch('/api/settings').then((r) => r.json()),
          fetch('/api/products').then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (settingsRes.status === 'fulfilled' && settingsRes.value?.success && settingsRes.value?.settings) {
          const s: StoreSettings = settingsRes.value.settings;
          setStoreSettings(s);
          if (s.heroVideo) {
            setHeroVideo(s.heroVideo);
          }
        }

        if (productsRes.status === 'fulfilled' && productsRes.value?.success && Array.isArray(productsRes.value?.products)) {
          setProducts(productsRes.value.products.filter(isProductVisibleInShop));
        }
      } catch (err) {
        console.error('Failed to load home page dynamic data:', err);
      }
    };

    loadData();

    const handleSettingsUpdated = () => {
      loadData();
    };
    window.addEventListener('vip-settings-updated', handleSettingsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('vip-settings-updated', handleSettingsUpdated);
    };
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = heroVideo?.playbackRate ?? 1.0;
    }
  }, [heroVideo?.playbackRate, heroVideo?.videoUrl, heroVideo?.enabled]);

  const featuredConfig = storeSettings?.featuredSection;
  const isFeaturedEnabled = featuredConfig ? featuredConfig.enabled !== false : true;

  const featuredProducts = useMemo(() => {
    if (featuredConfig?.productIds && featuredConfig.productIds.length > 0) {
      const productMap = new Map<string, Product>();
      products.forEach((p) => productMap.set(p.id, p));
      const ordered = featuredConfig.productIds
        .map((id) => productMap.get(id))
        .filter((p): p is Product => Boolean(p) && isProductVisibleInShop(p));

      if (ordered.length > 0) {
        return ordered;
      }
    }

    const featuredList = products.filter((p) => isProductVisibleInShop(p) && p.isFeatured);
    if (featuredList.length > 0) {
      return featuredList.slice(0, 4);
    }
    return products.filter(isProductVisibleInShop).slice(0, 4);
  }, [featuredConfig, products]);

  const featuredTitle = useMemo(() => {
    if (language === 'ar') {
      return featuredConfig?.titleAr?.trim() || t('home.featured.title', 'تشكيلاتنا المختارة');
    }
    if (language === 'en') {
      return featuredConfig?.titleEn?.trim() || t('home.featured.title', 'Signature Creations');
    }
    return featuredConfig?.title?.trim() || t('home.featured.title', 'Créations Emblématiques');
  }, [language, featuredConfig, t]);

  return (
    <StorefrontLayout>
      {/* 1. Hero Editorial Showcase */}
      <section className="relative bg-obsidian-950 text-ivory min-h-[520px] sm:min-h-[600px] md:min-h-[720px] lg:min-h-[80vh] flex items-center justify-center py-16 sm:py-24 md:py-32 border-b border-obsidian-800 overflow-hidden">
        {/* Dynamic Looping Background Video */}
        {heroVideo?.enabled && heroVideo.videoUrl && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <video
              ref={videoRef}
              key={heroVideo.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              poster={heroVideo.posterUrl || undefined}
              onLoadedMetadata={(e) => {
                e.currentTarget.playbackRate = heroVideo?.playbackRate ?? 1.0;
              }}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105"
              aria-hidden="true"
            >
              <source
                src={heroVideo.videoUrl}
                type={heroVideo.videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'}
              />
            </video>
            {/* Dark luxury overlay with configurable opacity */}
            <div
              className="absolute inset-0 bg-obsidian-950 transition-opacity duration-300"
              style={{ opacity: (heroVideo.overlayOpacity ?? 65) / 100 }}
            />
            {/* Sartorial radial gold sheen & vertical gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.18),transparent_55%)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-transparent to-obsidian-950/70 pointer-events-none" />
          </div>
        )}

        {/* Fallback Static Gold Radial when Video is Disabled */}
        {(!heroVideo?.enabled || !heroVideo.videoUrl) && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.12),transparent_50%)]" />
        )}

        <div className="luxury-container relative z-10 flex flex-col items-center text-center max-w-4xl">
          <h1 className="luxury-serif-title text-2xl sm:text-3xl md:text-5xl lg:text-6xl leading-[1.15] md:leading-tight font-medium mb-3 text-ivory text-balance">
            {t('home.hero.title', "L'Art du Vêtement & du Soulier Masculin")}
          </h1>
          <p className="text-gold-400 text-xs sm:text-sm md:text-base font-serif italic mb-3">
            {t('home.hero.season', 'Collection Automne-Hiver 2026')}
          </p>
          <p className="text-neutral-300 text-xs sm:text-sm md:text-base font-sans max-w-2xl mb-8 leading-relaxed text-balance">
            {t(
              'home.hero.description',
              "Boutique de prêt-à-porter masculin d'exception à Chelghoum Laïd (Mila). Élégance contemporaine et distinction pour l'homme moderne."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/catalog" className="btn-luxury-gold flex items-center justify-center gap-2">
              <span>{t('home.hero.cta_catalog', 'Explorer le Catalogue')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <Link href="/catalog?category=clothing" className="btn-luxury-outline text-ivory border-neutral-700 hover:bg-neutral-800 text-center">
              {t('home.hero.cta_collection', 'Collection Vêtements')}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Pillars of Distinction (Algerian Reassurance) */}
      <section className="py-12 sm:py-16 bg-ivory border-b border-sand-200">
        <h2 className="sr-only">{t('home.pillars.sr_heading', "Nos Engagements d'Excellence")}</h2>
        <div className="luxury-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          <div className="p-6 sm:p-8 border border-sand-200/80 bg-white/70 backdrop-blur-sm">
            <Truck className="w-8 h-8 text-gold-700 mb-4" />
            <h3 className="luxury-serif-title text-lg mb-2 text-obsidian-950">
              {t('home.pillars.wilayas.title', '68 Wilayas Algériennes')}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {t('home.pillars.wilayas.desc', 'Expédition express avec Yalidine & ZR Express vers 68 wilayas. Tarifs transparents dès 450 DA (Stop-Desk) et 590 DA (Domicile) avec confirmation téléphonique avant tout envoi.')}
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
              {t('home.pillars.craft.title', 'Matières Nobles & Finitions Soignées')}
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed font-sans">
              {t('home.pillars.craft.desc', "Tissus d'Italie et d'Espagne, coupes contemporaines et finitions soignées pour un confort et un style impeccables.")}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Universes Showcase (Architectural Fashion Department Navigation) */}
      <section className="py-14 sm:py-20 bg-obsidian-950 text-ivory border-b border-obsidian-800">
        <div className="luxury-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b border-obsidian-800/80">
            <div>
              <h2 className="luxury-serif-title text-2xl sm:text-3xl md:text-4xl text-ivory tracking-tight">
                {t('home.universes.title', 'تشكيلات VIP TADJ')}
              </h2>
              <p className="text-neutral-400 text-xs sm:text-sm font-sans mt-2 max-w-xl">
                {t('home.universes.subtitle', 'ملابس وأحذية وإكسسوارات مريحة وعملية للاستخدام اليومي.')}
              </p>
            </div>
            <Link
              href="/catalog"
              className="text-xs uppercase tracking-wider font-semibold text-gold-400 hover:text-gold-300 flex items-center gap-1.5 transition-colors group self-start sm:self-auto"
            >
              <span>{t('home.universes.view_all', 'استكشف كافة التشكيلات')}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-obsidian-800 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-obsidian-800 bg-obsidian-900/40">
            {/* 1. Vêtements */}
            <Link
              href="/catalog/vetements"
              className="group p-8 sm:p-10 flex flex-col justify-between transition-colors duration-300 hover:bg-obsidian-900/90 relative overflow-hidden"
            >
              <div>
                <h3 className="luxury-serif-title text-2xl lg:text-3xl text-ivory group-hover:text-gold-300 transition-colors mb-3">
                  {t('home.universes.clothing.title', 'الملابس اليومية')}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans mb-6">
                  {t(
                    'home.universes.clothing.desc',
                    'تيشرتات قطنية، هوديز، قمصان وسراويل جينز بخامات مريحة تناسب نشاطك اليومي.'
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-sans mb-8">
                  {(
                    UNIVERSES_CURATIONS.clothing[
                      (language as 'ar' | 'en' | 'fr') || 'fr'
                    ] || UNIVERSES_CURATIONS.clothing.fr
                  ).map((item, idx, arr) => (
                    <React.Fragment key={item}>
                      <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
                        {item}
                      </span>
                      {idx < arr.length - 1 && (
                        <span className="text-obsidian-700 font-serif">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-obsidian-800/80 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gold-400 group-hover:text-gold-300 transition-colors">
                <span>{t('home.universes.clothing.cta', 'تسوق الملابس')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Chaussures */}
            <Link
              href="/catalog/chaussures"
              className="group p-8 sm:p-10 flex flex-col justify-between transition-colors duration-300 hover:bg-obsidian-900/90 relative overflow-hidden"
            >
              <div>
                <h3 className="luxury-serif-title text-2xl lg:text-3xl text-ivory group-hover:text-gold-300 transition-colors mb-3">
                  {t('home.universes.shoes.title', 'الأحذية والسنيكرز')}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans mb-6">
                  {t(
                    'home.universes.shoes.desc',
                    'سنيكرز عصرية وأحذية كاجوال خفيفة تمنحك أقصى درجات الراحة أثناء المشي طوال اليوم.'
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-sans mb-8">
                  {(
                    UNIVERSES_CURATIONS.shoes[
                      (language as 'ar' | 'en' | 'fr') || 'fr'
                    ] || UNIVERSES_CURATIONS.shoes.fr
                  ).map((item, idx, arr) => (
                    <React.Fragment key={item}>
                      <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
                        {item}
                      </span>
                      {idx < arr.length - 1 && (
                        <span className="text-obsidian-700 font-serif">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-obsidian-800/80 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gold-400 group-hover:text-gold-300 transition-colors">
                <span>{t('home.universes.shoes.cta', 'تسوق الأحذية')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Accessoires */}
            <Link
              href="/catalog/accessoires"
              className="group p-8 sm:p-10 flex flex-col justify-between transition-colors duration-300 hover:bg-obsidian-900/90 relative overflow-hidden"
            >
              <div>
                <h3 className="luxury-serif-title text-2xl lg:text-3xl text-ivory group-hover:text-gold-300 transition-colors mb-3">
                  {t('home.universes.accessories.title', 'الإكسسوارات والأساسيات')}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans mb-6">
                  {t(
                    'home.universes.accessories.desc',
                    'قبعات، حقائب كتف، محافظ وأحزمة عملية مصممة لتكمل مظهرك اليومي بكل بساطة.'
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-sans mb-8">
                  {(
                    UNIVERSES_CURATIONS.accessories[
                      (language as 'ar' | 'en' | 'fr') || 'fr'
                    ] || UNIVERSES_CURATIONS.accessories.fr
                  ).map((item, idx, arr) => (
                    <React.Fragment key={item}>
                      <span className="text-neutral-400 group-hover:text-neutral-200 transition-colors">
                        {item}
                      </span>
                      {idx < arr.length - 1 && (
                        <span className="text-obsidian-700 font-serif">•</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-obsidian-800/80 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gold-400 group-hover:text-gold-300 transition-colors">
                <span>{t('home.universes.accessories.cta', 'تسوق الإكسسوارات')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Featured Creations Showcase */}
      {isFeaturedEnabled && (
        <section className="py-12 sm:py-16 md:py-20 bg-ivory border-b border-sand-200">
          <div className="luxury-container">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <h2 className="luxury-serif-title text-2xl sm:text-3xl md:text-4xl text-obsidian-950 text-balance">
                  {featuredTitle}
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
      )}

      {/* 5. Craftsmanship & Heritage Story */}
      <section className="py-12 sm:py-16 md:py-24 bg-white border-b border-sand-200">
        <div className="luxury-container grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="luxury-serif-title text-2xl sm:text-3xl md:text-4xl text-obsidian-950 mb-6 leading-tight text-balance">
              {t('home.story.title', "L'Élégance Masculine au Cœur d'Algérie")}
            </h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-6 font-sans">
              {t('home.story.p1', "Depuis sa fondation, la Maison VIP TADJ sublime la silhouette masculine par une sélection intransigeante de vêtements d'exception et de souliers de prestige.")}
            </p>
            <p className="text-neutral-600 text-sm leading-relaxed mb-8 font-sans">
              {t('home.story.p2', "Chaque vêtement, veste et soulier est rigoureusement sélectionné pour répondre aux attentes de l'homme algérien moderne : distinction, prestance et confort absolu.")}
            </p>

            <div className="pt-6 border-t border-sand-200 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="font-serif text-2xl md:text-3xl font-normal text-obsidian-950 block mb-1">
                  {t('home.story.stat1.val', '100%')}
                </span>
                <span className="text-xs uppercase tracking-wider text-sand-800 font-sans font-medium">
                  {t('home.story.stat1.label', 'Matières Nobles & Cuir')}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl md:text-3xl font-normal text-obsidian-950 block mb-1">
                  {t('home.story.stat2.val', '68')}
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
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200"
              alt={t('home.story.image_alt', 'Boutique & Showroom VIP TADJ')}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-obsidian-950/10" />
          </div>
        </div>
      </section>

      {/* 6. Infrastructure Status Notification */}
      <section className="sr-only" aria-label={t('home.infra.aria_label', 'Statut de la boutique VIP TADJ')}>
        <div className="luxury-container flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-sans text-neutral-600">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-obsidian-950 uppercase tracking-wider">
              {language === 'fr' ? 'VIP TADJ Core Infrastructure Status' : t('home.infra.aria_label', 'Statut de la boutique VIP TADJ')}
            </span>
            <span className="hidden sm:inline text-neutral-400">|</span>
            <span className="hidden sm:inline">
              {t('home.infra.summary', 'Catalogue • Panier • Paiement COD')}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 text-xs">
            <span>
              {t('home.infra.example_dzd', 'Exemple Format DZD :')}{' '}
              <strong className="text-obsidian-950 font-mono">{formatDZD(38500, { locale: language })}</strong>
            </span>
            <span>
              {t('home.infra.base_rate', 'Tarif Livraison Base :')}{' '}
              <strong className="text-obsidian-950 font-mono">{formatDZD(400, { locale: language })}</strong>
            </span>
            <span>
              {t('home.infra.free_threshold', 'Seuil Franco :')}{' '}
              <strong className="text-obsidian-950 font-mono">{formatDZD(15000, { locale: language })}</strong>
            </span>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
}
