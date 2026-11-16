'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { useLanguage } from '@/lib/context/language-context';
import { formatDZD } from '@/lib/utils/formatDZD';
import { getLocalizedSize, getLocalizedColor } from '@/lib/i18n/catalog-translations';

export interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function CartDrawer({ isOpen: controlledIsOpen, onClose: controlledOnClose }: CartDrawerProps) {
  const cart = useCart();
  const { language, t } = useLanguage();

  const isControlled = controlledIsOpen !== undefined;
  const activeIsOpen = isControlled ? controlledIsOpen : cart.isOpen;
  const handleClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      cart.closeCart();
    }
  }, [controlledOnClose, cart]);

  // Body scroll lock
  useEffect(() => {
    if (activeIsOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeIsOpen]);

  // Escape key listener
  useEffect(() => {
    if (!activeIsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIsOpen, handleClose]);

  if (!activeIsOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cart.drawer.title', "Panier d'achats")}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-obsidian-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside className="fixed inset-y-0 end-0 max-w-md w-full bg-ivory shadow-2xl border-s border-sand-200 z-50 flex flex-col justify-between transition-transform duration-300 animate-in slide-in-from-right rtl:slide-in-from-left">
        {/* Header */}
        <div className="p-5 border-b border-sand-200 flex items-center justify-between bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-700" />
            <h2 className="font-serif text-lg tracking-wide uppercase font-semibold text-obsidian-950">
              {t('cart.drawer.title', "Panier d'achats")} ({cart.itemCount})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close', 'Fermer le panier')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full text-obsidian-600 hover:text-obsidian-950 hover:bg-sand-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Meter */}
        <div className="bg-sand-100/70 border-b border-sand-200 px-5 py-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-obsidian-800">
              <Truck className="w-3.5 h-3.5 text-gold-700" />
              {cart.isFreeShipping ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-gold-700 shrink-0" />
                  <span>{t('cart.free_shipping_meter.qualified', 'Félicitations ! Livraison offerte sur 58 Wilayas.')}</span>
                </>
              ) : (
                t('cart.free_shipping_meter.progress', 'Plus que {remaining} pour la livraison gratuite !')
                  .replace('{remaining}', formatDZD(cart.amountRemaining, { locale: language }))
              )}
            </span>
            <span className="font-semibold text-gold-800 font-sans tabular-nums">{cart.progressPercentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-sand-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-600 transition-all duration-500 rounded-full"
              style={{ width: `${cart.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center text-sand-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-lg font-medium text-obsidian-900">
                  {t('cart.drawer.empty', 'Votre panier est vide')}
                </p>
                <p className="text-xs text-obsidian-600 max-w-xs">
                  {t('cart.drawer.empty_desc', "Explorez nos collections sartoriales pour sélectionner vos pièces d'exception.")}
                </p>
              </div>
              <Link
                href="/catalog"
                onClick={handleClose}
                className="btn-luxury-gold text-xs px-6 py-2.5 uppercase tracking-wider font-medium"
              >
                {t('cart.drawer.empty_action', 'Découvrir la Collection')}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-sand-100 space-y-4">
              {cart.items.map((item) => {
                const lineId = item.id || `${item.productId}-${item.selectedSize}`;
                return (
                  <li key={lineId} className="pt-4 first:pt-0 flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-24 bg-sand-100 flex-shrink-0 overflow-hidden border border-sand-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
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

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={item.slug ? `/product/${item.slug}` : '/catalog'}
                            onClick={handleClose}
                            className="font-medium text-sm text-obsidian-900 hover:text-gold-700 line-clamp-2 transition-colors"
                          >
                            {item.title}
                          </Link>
                          <button
                            type="button"
                            onClick={() => cart.removeItem(item.id || item.productId, item.selectedSize, item.selectedColor)}
                            aria-label={`${t('cart.item.remove', 'Supprimer')} ${item.title}`}
                            className="text-obsidian-600 hover:text-red-600 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-xs text-obsidian-600 flex flex-wrap items-center gap-2">
                          <span className="bg-sand-100 px-2 py-0.5 rounded text-xs font-medium text-obsidian-800">
                            {t('cart.item.size', 'Taille :')}{' '}
                            <span>{getLocalizedSize(item.selectedSize, language)}</span>
                          </span>
                          {item.selectedColor && (
                            <span className="bg-sand-100 px-2 py-0.5 rounded text-xs font-medium text-obsidian-800">
                              {t('cart.item.color', 'Couleur :')}{' '}
                              <span>{getLocalizedColor(item.selectedColor, language) || item.selectedColor}</span>
                            </span>
                          )}
                          <span className="font-sans tabular-nums">{formatDZD(item.price, { locale: language })}</span>
                        </div>
                      </div>

                      {/* Stepper & Line Total */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-sand-300 rounded bg-white">
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
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-sand-100 text-obsidian-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-obsidian-950 font-sans tabular-nums">
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
                            disabled={item.quantity >= 99}
                            aria-label={t('cart.item.qty_increase', 'Augmenter la quantité')}
                            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-sand-100 text-obsidian-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-serif font-semibold text-sm text-obsidian-950">
                          {formatDZD(item.price * item.quantity, { locale: language })}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="p-5 border-t border-sand-200 bg-white/90 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-sand-800 uppercase tracking-wider">
                {t('cart.subtotal', 'Sous-total')}
              </span>
              <span className="font-serif text-lg font-bold text-obsidian-950">
                {formatDZD(cart.subtotal, { locale: language })}
              </span>
            </div>

            <p className="text-xs text-obsidian-600 text-center flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {t('cart.summary.cod_badge', 'Paiement à la livraison (COD) • Vérification à réception')}
            </p>

            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={handleClose}
                className="btn-luxury-gold w-full text-center py-3.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {t('cart.checkout_btn', 'Passer la commande')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              <Link
                href="/cart"
                onClick={handleClose}
                className="w-full text-center block py-2.5 text-xs font-medium uppercase tracking-wider text-obsidian-700 hover:text-gold-700 transition-colors"
              >
                {t('cart.view_cart_btn', 'Voir le panier détaillé')}
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
