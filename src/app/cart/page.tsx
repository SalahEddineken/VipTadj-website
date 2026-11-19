'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { StorefrontLayout } from '@/components/store/StorefrontLayout';
import { useCart } from '@/lib/context/cart-context';
import { formatDZD } from '@/lib/utils/formatDZD';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedColor, getLocalizedSize } from '@/lib/i18n/catalog-translations';
import { getLocalizedCartItemTitle } from '@/components/store/cart-item-localization';

export default function CartPage() {
  const cart = useCart();
  const { language, t } = useLanguage();

  if (!cart.isHydrated) {
    return (
      <StorefrontLayout>
        <div className="luxury-container py-24 flex-1 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="luxury-container py-8 md:py-14 space-y-8 flex-1">
        {/* Breadcrumb */}
        <nav
          aria-label={t('pdp.breadcrumb.aria_label', "Fil d'Ariane")}
          className="text-xs uppercase tracking-[0.2em] text-obsidian-600 flex items-center gap-2"
        >
          <Link href="/" className="hover:text-gold-700 transition-colors">
            {t('cart.breadcrumb.home', 'Accueil')}
          </Link>
          <span>/</span>
          <span className="text-obsidian-950 font-semibold">{t('cart.breadcrumb.cart', 'Panier')}</span>
        </nav>

        {/* Page Title */}
        <div className="border-b border-sand-200 pb-6 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
          <div>
            <h1 className="luxury-cinzel-title text-2xl sm:text-3xl md:text-4xl text-obsidian-950 text-balance text-start">
              {t('cart.page.title', 'Mon Panier')}
            </h1>
            {cart.itemCount > 0 && (
              <p className="text-xs text-obsidian-600 font-sans tracking-wider uppercase mt-1 text-start">
                {cart.itemCount > 1
                  ? t('cart.count.plural', '{count} articles d\'exception').replace('{count}', String(cart.itemCount))
                  : t('cart.count.single', '{count} article d\'exception').replace('{count}', String(cart.itemCount))}
              </p>
            )}
          </div>

          <Link
            href="/catalog"
            className="text-xs uppercase tracking-[0.2em] text-sand-800 hover:text-gold-700 font-medium inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto min-h-[44px] py-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            {t('cart.action.continue_shopping', 'Continuer mes achats')}
          </Link>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="bg-sand-100/80 border border-sand-200 p-4 md:p-5 rounded-none space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
            <span className="flex items-center gap-2 font-medium text-obsidian-800">
              <Truck className="w-4 h-4 text-gold-700 flex-shrink-0" />
              {cart.isFreeShipping ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  <span>{t('cart.shipping_meter.qualified', 'Félicitations ! Vous bénéficiez de la livraison offerte sur les 68 Wilayas.')}</span>
                </span>
              ) : (
                <span>
                  {t('cart.shipping_meter.remaining', 'Plus que {remaining} pour débloquer la livraison gratuite !').replace(
                    '{remaining}',
                    formatDZD(cart.amountRemaining, { locale: language })
                  )}
                </span>
              )}
            </span>
            <span dir="ltr" className="font-semibold text-gold-800 font-sans tabular-nums">{cart.progressPercentage}%</span>
          </div>
          <div className="h-2 w-full bg-sand-200 overflow-hidden">
            <div
              className="h-full bg-gold-600 transition-all duration-500"
              style={{ width: `${cart.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Empty State */}
        {cart.items.length === 0 ? (
          <div className="py-20 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-full bg-sand-100 flex items-center justify-center mx-auto text-sand-400">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="luxury-cinzel-title text-2xl text-obsidian-950">
                {t('cart.empty.title', 'Votre panier est actuellement vide')}
              </h2>
              <p className="text-sm text-sand-800 font-sans">
                {t(
                  'cart.empty.desc',
                  'Explorez nos collections de vêtements d\'exception, souliers en cuir et accessoires élégants pour composer votre vestiaire idéal.'
                )}
              </p>
            </div>
            <Link
              href="/catalog"
              className="btn-luxury-gold inline-flex items-center gap-2 px-8 py-3.5 text-xs font-semibold uppercase tracking-wider"
            >
              {t('cart.empty.cta', 'Découvrir la Collection')}
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          /* 2-Column Responsive Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left 8 Cols: Line Items */}
            <div className="lg:col-span-8 space-y-6">
              <div className="border border-sand-200 bg-white/70 overflow-hidden">
                <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 bg-sand-100/60 border-b border-sand-200 text-xs uppercase tracking-wider text-sand-800 font-semibold">
                  <div className="col-span-5 text-start">{t('cart.table.product', 'Article')}</div>
                  <div className="col-span-2 text-center">{t('cart.table.unit_price', 'Prix Unitaire')}</div>
                  <div className="col-span-3 text-center">{t('cart.table.quantity', 'Quantité')}</div>
                  <div className="col-span-2 text-end">{t('cart.table.total', 'Total')}</div>
                </div>

                <ul className="divide-y divide-sand-200">
                  {cart.items.map((item) => {
                    const lineId = item.id || `${item.productId}-${item.selectedSize}`;
                    const localizedTitle = getLocalizedCartItemTitle(item, language);
                    const localizedSize = getLocalizedSize(item.selectedSize, language);
                    const localizedColorName = item.selectedColor
                      ? getLocalizedColor(item.selectedColor, language) || item.selectedColor
                      : null;

                    return (
                      <li
                        key={lineId}
                        className="p-4 md:p-6 flex flex-col md:grid md:grid-cols-12 gap-4 items-center"
                      >
                        {/* Article Info */}
                        <div className="w-full md:col-span-5 flex items-center gap-4">
                          <div className="relative w-20 h-24 bg-sand-100 flex-shrink-0 border border-sand-200 overflow-hidden">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={localizedTitle}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sand-400">
                                <ShoppingBag className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5 flex-1 min-w-0 text-start">
                            <Link
                              href={item.slug ? `/catalog/clothing/${item.slug}` : '/catalog'}
                              className="font-medium text-sm text-obsidian-900 hover:text-gold-700 transition-colors line-clamp-2"
                            >
                              {localizedTitle}
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-obsidian-600">
                              <span className="bg-sand-100 px-2.5 py-0.5 rounded text-xs font-medium text-obsidian-800">
                                {t('cart.item.size', 'Taille :')} {localizedSize}
                              </span>
                              {localizedColorName && (
                                <span className="bg-sand-100 px-2.5 py-0.5 rounded text-xs font-medium text-obsidian-800">
                                  {t('cart.item.color', 'Couleur :')} {localizedColorName}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => cart.removeItem(item.id || item.productId, item.selectedSize, item.selectedColor)}
                              className="text-xs text-obsidian-600 hover:text-red-600 transition-colors inline-flex items-center gap-1.5 py-2 md:hidden min-h-[44px]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {t('cart.item.remove', 'Supprimer')}
                            </button>
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div className="hidden md:block md:col-span-2 text-center text-xs font-medium text-obsidian-800 font-sans tabular-nums">
                          {formatDZD(item.price, { locale: language })}
                        </div>

                        {/* Quantity Stepper */}
                        <div className="w-full md:w-auto md:col-span-3 flex items-center justify-between md:justify-center">
                          <div className="flex items-center border border-sand-300 bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                cart.updateQuantity(
                                  item.id || item.productId,
                                  item.quantity - 1,
                                  item.selectedSize,
                                  item.selectedColor
                                )
                              }
                              aria-label={t('cart.item.qty_decrease', 'Diminuer la quantité')}
                              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-sand-100 text-obsidian-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 text-xs font-semibold text-obsidian-950 font-sans tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                cart.updateQuantity(
                                  item.id || item.productId,
                                  item.quantity + 1,
                                  item.selectedSize,
                                  item.selectedColor
                                )
                              }
                              disabled={item.quantity >= (typeof item.maxStock === 'number' ? item.maxStock : 99)}
                              aria-label={t('cart.item.qty_increase', 'Augmenter la quantité')}
                              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-sand-100 text-obsidian-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="md:hidden font-serif font-bold text-sm text-obsidian-950">
                            {formatDZD(item.price * item.quantity, { locale: language })}
                          </span>
                        </div>

                        {/* Line Total & Remove (Desktop) */}
                        <div className="hidden md:flex md:col-span-2 items-center justify-end gap-3 text-end">
                          <span className="font-serif font-bold text-sm text-obsidian-950">
                            {formatDZD(item.price * item.quantity, { locale: language })}
                          </span>
                          <button
                            type="button"
                            onClick={() => cart.removeItem(item.id || item.productId, item.selectedSize, item.selectedColor)}
                            aria-label={`${t('cart.item.remove', 'Supprimer')} ${localizedTitle}`}
                            className="text-obsidian-600 hover:text-red-600 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={cart.clearCart}
                  className="text-xs uppercase tracking-wider text-obsidian-600 hover:text-red-600 transition-colors inline-flex items-center gap-1.5 min-h-[44px] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                >
                  <RotateCcw className="w-3.5 h-3.5 rtl:rotate-180" />
                  {t('cart.action.clear', 'Vider le panier')}
                </button>

                <Link
                  href="/catalog"
                  className="text-xs uppercase tracking-wider text-obsidian-800 hover:text-gold-700 font-medium inline-flex items-center gap-1.5 transition-colors min-h-[44px] py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  {t('cart.action.continue_shopping', 'Continuer mes achats')}
                </Link>
              </div>
            </div>

            {/* Right 4 Cols: Order Summary Sticky Card */}
            <div className="lg:col-span-4 sticky top-28 space-y-6">
              <div className="bg-sand-50/90 border border-sand-200 p-6 md:p-8 space-y-6">
                <h2 className="luxury-cinzel-title text-lg text-obsidian-950 border-b border-sand-200 pb-4 text-start">
                  {t('cart.summary.title', 'Récapitulatif')}
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-sand-800 font-medium uppercase tracking-wider">
                      {t('cart.summary.subtotal', 'Sous-total articles')}
                    </span>
                    <span className="font-semibold text-obsidian-950 font-sans tabular-nums text-sm">
                      {formatDZD(cart.subtotal, { locale: language })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sand-800 font-medium uppercase tracking-wider">
                      {t('cart.summary.shipping', 'Livraison estimée')}
                    </span>
                    <span className="font-medium text-obsidian-800">
                      {cart.isFreeShipping ? (
                        <span className="text-emerald-700 font-bold uppercase tracking-wider">
                          {t('cart.summary.shipping_free', 'Gratuite')}
                        </span>
                      ) : (
                        <span className="text-sand-800">
                          {t('cart.summary.shipping_calculated_next', 'Calculée à l\'étape suivante')}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="border-t border-sand-200 pt-4 flex items-baseline justify-between">
                  <span className="luxury-cinzel-title text-sm uppercase tracking-wider text-obsidian-950">
                    {t('cart.summary.total', 'Total')}
                  </span>
                  <div className="text-end">
                    <span className="font-serif text-2xl font-bold text-obsidian-950">
                      {formatDZD(cart.subtotal, { locale: language })}
                    </span>
                    <p className="text-xs text-obsidian-600 font-sans tracking-normal mt-1">
                      {t('cart.summary.tax_note', 'TTC inclus • Paiement à la réception (COD)')}
                    </p>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="btn-luxury-gold w-full text-center py-4 text-xs font-semibold uppercase tracking-wider sm:tracking-[0.2em] flex items-center justify-center gap-2 shadow-luxury-gold"
                >
                  <span>{t('cart.summary.proceed', 'Procéder au paiement')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>

                {/* Trust Guarantees */}
                <div className="pt-4 border-t border-sand-200 space-y-3 text-xs text-sand-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>{t('cart.reassurance.cod', 'Paiement 100% en espèces à la livraison (COD)')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gold-700 flex-shrink-0" />
                    <span>{t('cart.reassurance.shipping', 'Expédition express 68 Wilayas sous 24h à 72h')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
}
