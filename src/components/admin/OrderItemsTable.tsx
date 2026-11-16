'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { OrderItem } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { ShoppingBag, Tag, ExternalLink } from 'lucide-react';

export interface OrderItemsTableProps {
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  wilayaName?: string;
}

export function OrderItemsTable({
  items,
  subtotal,
  deliveryFee,
  discount = 0,
  total,
  wilayaName,
}: OrderItemsTableProps) {
  return (
    <div className="space-y-6">
      {/* Items Section */}
      <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 p-5 sm:p-6 shadow-luxury-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-gold-500/15 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-400" />
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-ivory">
              Articles Commandés ({items.length})
            </h3>
          </div>
          <span className="text-xs text-obsidian-400">
            {items.reduce((sum, item) => sum + item.quantity, 0)} pièce(s) au total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-gold-500/10 text-xs uppercase tracking-wider text-obsidian-200">
                <th className="py-2.5 px-3 text-start">Article</th>
                <th className="py-2.5 px-3 text-start">Taille</th>
                <th className="py-2.5 px-3 text-end">Prix Unitaire</th>
                <th className="py-2.5 px-3 text-center">Qté</th>
                <th className="py-2.5 px-3 text-end">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-500/10 text-xs sm:text-sm">
              {items.map((item, idx) => {
                const lineTotal = item.price * item.quantity;
                const normalizedImg = normalizeImageUrl(item.image, { width: 120 });

                return (
                  <tr key={`${item.productId}-${item.selectedSize}-${idx}`} className="group hover:bg-obsidian-900/30">
                    {/* Thumbnail & Title */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-sm overflow-hidden bg-obsidian-900 border border-gold-500/20 flex-shrink-0">
                          {normalizedImg ? (
                            <Image
                              src={normalizedImg}
                              alt={item.title}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-obsidian-500 font-cinzel text-xs">
                              VIP
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            target="_blank"
                            className="font-medium text-ivory hover:text-gold-300 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                          >
                            <span>{item.title}</span>
                            <ExternalLink className="w-3 h-3 text-obsidian-400 group-hover:text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          {item.selectedColor && (
                            <div className="text-xs text-obsidian-300 mt-0.5">
                              Couleur : {item.selectedColor}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Selected Size Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-sm bg-obsidian-900 border border-gold-500/20 text-gold-300 font-sans tabular-nums text-xs font-semibold">
                        Taille {item.selectedSize}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-3 text-end font-sans tabular-nums text-obsidian-300 whitespace-nowrap">
                      {formatDZD(item.price)}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center font-bold text-ivory font-sans tabular-nums">
                      x{item.quantity}
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-3 text-end font-serif font-bold text-ivory whitespace-nowrap">
                      {formatDZD(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Breakdown Card */}
      <div className="rounded-sm bg-obsidian-950 border border-gold-500/20 p-5 sm:p-6 shadow-luxury-subtle">
        <div className="flex items-center gap-2 pb-3 border-b border-gold-500/15 mb-4">
          <Tag className="w-4 h-4 text-gold-400" />
          <h4 className="font-cinzel text-sm font-bold uppercase tracking-wider text-ivory">
            Récapitulatif Financier COD
          </h4>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-obsidian-300">
            <span>Sous-total articles :</span>
            <span className="font-sans tabular-nums font-medium text-ivory">{formatDZD(subtotal)}</span>
          </div>

          {/* Delivery Fee */}
          <div className="flex items-center justify-between text-obsidian-300">
            <span>
              Frais de livraison {wilayaName ? `(${wilayaName})` : ''} :
            </span>
            <span className="font-sans tabular-nums font-medium text-ivory">
              {deliveryFee === 0 ? (
                <span className="text-emerald-400 font-semibold">0 DA (Offerte)</span>
              ) : (
                formatDZD(deliveryFee)
              )}
            </span>
          </div>

          {/* Discount if present */}
          {discount > 0 && (
            <div className="flex items-center justify-between text-rose-300">
              <span>Remise commerciale :</span>
              <span className="font-sans tabular-nums font-medium">- {formatDZD(discount)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-3 border-t border-gold-500/15 flex items-baseline justify-between">
            <div>
              <div className="font-cinzel text-base font-bold text-ivory">
                Total à Encaisser (COD) :
              </div>
              <div className="text-xs text-obsidian-300 mt-0.5">
                Paiement en espèces à la livraison au livreur
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-gold-400">
              {formatDZD(total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
