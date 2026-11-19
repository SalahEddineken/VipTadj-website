'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { OrderItem } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { useLanguage } from '@/lib/context/language-context';
import { getLocalizedProduct, getLocalizedColor, getLocalizedSize } from '@/lib/i18n/catalog-translations';
import { ALGERIAN_68_WILAYAS } from '@/lib/data/wilayas';
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
  const { language, t } = useLanguage();
  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);

  const localizedWilayaName = React.useMemo(() => {
    if (!wilayaName) return '';
    if (language !== 'ar') return wilayaName;
    const norm = wilayaName.trim().toLowerCase();
    const match = ALGERIAN_68_WILAYAS.find(
      (w) => w.name.toLowerCase() === norm || `${w.code} - ${w.name}`.toLowerCase() === norm
    );
    return match?.nameAr || wilayaName;
  }, [wilayaName, language]);

  return (
    <div className="space-y-6">
      {/* Items Section */}
      <div className="rounded-sm bg-white border border-obsidian-200 p-5 sm:p-6 shadow-luxury-subtle">
        <div className="flex items-center justify-between pb-4 border-b border-obsidian-200 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-600" />
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-obsidian-950">
              {t('admin.order_detail.items_title', 'Articles Commandés ({count})').replace('{count}', String(items.length))}
            </h3>
          </div>
          <span className="text-xs text-obsidian-500">
            {t('admin.order_detail.pieces_total', '{count} pièce(s) au total').replace('{count}', String(totalPieces))}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="border-b border-obsidian-200 text-xs uppercase tracking-wider text-obsidian-600">
                <th className="py-2.5 px-3 text-start">{t('admin.order_detail.th_item', 'Article')}</th>
                <th className="py-2.5 px-3 text-start">{t('admin.order_detail.th_size', 'Taille')}</th>
                <th className="py-2.5 px-3 text-end">{t('admin.order_detail.th_unit_price', 'Prix Unitaire')}</th>
                <th className="py-2.5 px-3 text-center">{t('admin.order_detail.th_qty', 'Qté')}</th>
                <th className="py-2.5 px-3 text-end">{t('admin.order_detail.th_total', 'Total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-100 text-xs sm:text-sm">
              {items.map((item, idx) => {
                const lineTotal = item.price * item.quantity;
                const normalizedImg = normalizeImageUrl(item.image, { width: 120, language });
                const localizedItem = getLocalizedProduct(item, language);
                const localizedSize = getLocalizedSize(item.selectedSize, language);
                const localizedColor = item.selectedColor ? getLocalizedColor(item.selectedColor, language) : '';

                return (
                  <tr key={`${item.productId}-${item.selectedSize}-${idx}`} className="group hover:bg-ivory-100/70">
                    {/* Thumbnail & Title */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-sm overflow-hidden bg-ivory-100 border border-obsidian-200 flex-shrink-0">
                          {normalizedImg ? (
                            <Image
                              src={normalizedImg}
                              alt={localizedItem.title}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-obsidian-400 font-cinzel text-xs">
                              VIP
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            target="_blank"
                            className="font-medium text-obsidian-950 hover:text-gold-700 transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                          >
                            <span>{localizedItem.title}</span>
                            <ExternalLink className="w-3 h-3 text-obsidian-400 group-hover:text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity rtl:-scale-x-100" />
                          </Link>
                          {item.selectedColor && (
                            <div className="text-xs text-obsidian-500 mt-0.5">
                              {t('admin.order_detail.color_label', 'Couleur :')} {localizedColor}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Selected Size Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-800 font-sans tabular-nums text-xs font-semibold">
                        {localizedSize.toLowerCase().includes('unique') || localizedSize.startsWith('مقاس')
                          ? localizedSize
                          : t('admin.order_detail.size_badge', 'Taille {size}').replace('{size}', localizedSize)}
                      </span>
                    </td>

                    {/* Unit Price */}
                    <td className="py-3 px-3 text-end font-sans tabular-nums text-obsidian-600 whitespace-nowrap">
                      {formatDZD(item.price, { locale: language })}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 text-center font-bold text-obsidian-950 font-sans tabular-nums">
                      x{item.quantity}
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-3 text-end font-serif font-bold text-obsidian-950 whitespace-nowrap">
                      {formatDZD(lineTotal, { locale: language })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Breakdown Card */}
      <div className="rounded-sm bg-white border border-obsidian-200 p-5 sm:p-6 shadow-luxury-subtle">
        <div className="flex items-center gap-2 pb-3 border-b border-obsidian-200 mb-4">
          <Tag className="w-4 h-4 text-gold-600" />
          <h4 className="font-cinzel text-sm font-bold uppercase tracking-wider text-obsidian-950">
            {t('admin.order_detail.cod_summary_title', 'Récapitulatif Financier COD')}
          </h4>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-obsidian-600">
            <span>{t('admin.order_detail.subtotal', 'Sous-total articles :')}</span>
            <span className="font-sans tabular-nums font-medium text-obsidian-950">
              {formatDZD(subtotal, { locale: language })}
            </span>
          </div>

          {/* Delivery Fee */}
          <div className="flex items-center justify-between text-obsidian-600">
            <span>
              {t('admin.order_detail.delivery_fee', 'Frais de livraison')}
              {localizedWilayaName ? ` (${localizedWilayaName})` : ''} :
            </span>
            <span className="font-sans tabular-nums font-medium text-obsidian-950">
              {deliveryFee === 0 ? (
                <span className="text-emerald-700 font-semibold">
                  {t('admin.order_detail.free_delivery_badge', '0 DA (Offerte)')}
                </span>
              ) : (
                formatDZD(deliveryFee, { locale: language })
              )}
            </span>
          </div>

          {/* Discount if present */}
          {discount > 0 && (
            <div className="flex items-center justify-between text-rose-700">
              <span>{t('admin.order_detail.commercial_discount', 'Remise commerciale :')}</span>
              <span dir="ltr" className="font-sans tabular-nums font-medium">
                - {formatDZD(discount, { locale: language })}
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-3 border-t border-obsidian-200 flex items-baseline justify-between">
            <div>
              <div className="font-cinzel text-base font-bold text-obsidian-950">
                {t('admin.order_detail.total_cod_collect', 'Total à Encaisser (COD) :')}
              </div>
              <div className="text-xs text-obsidian-500 mt-0.5">
                {t('admin.order_detail.cod_cash_courier_note', 'Paiement en espèces à la livraison au livreur')}
              </div>
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-gold-700">
              {formatDZD(total, { locale: language })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
