'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { Order } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import {
  formatAlgerianPhone,
  formatTelLink,
  generateWhatsAppConfirmLink,
} from '@/lib/utils/contactUtils';
import { useLanguage } from '@/lib/context/language-context';
import { useStoreSettings } from '@/lib/context/store-settings-context';
import { getLocalizedSize, getLocalizedColor } from '@/lib/i18n/catalog-translations';
import { getLocalizedCartItemTitle } from '@/components/store/cart-item-localization';
import { getStatusLabel, STATUS_CONFIG } from '@/lib/utils/orderStateMachine';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';

export interface OrderSuccessViewProps {
  order: Order;
}

export function OrderSuccessView({ order }: OrderSuccessViewProps) {
  const { language, t } = useLanguage();
  const { phone: storePhone, whatsappNumber } = useStoreSettings();

  const formattedPhone = formatAlgerianPhone(order.customer.phone);
  const telLink = formatTelLink(order.customer.phone);
  const whatsAppUrl = generateWhatsAppConfirmLink(order, whatsappNumber || undefined, language);

  const wilayaObj = order.customer.wilayaCode
    ? getWilayaByCode(order.customer.wilayaCode)
    : undefined;
  const communeObj =
    order.customer.wilayaCode && order.customer.commune
      ? findCommune(order.customer.wilayaCode, order.customer.commune)
      : undefined;

  const wilayaDisplay =
    language === 'ar'
      ? wilayaObj?.nameAr || order.customer.wilaya
      : wilayaObj?.name || order.customer.wilaya;
  const communeDisplay =
    language === 'ar'
      ? communeObj?.nameAr || order.customer.commune
      : communeObj?.name || order.customer.commune;

  return (
    <main className="min-h-screen bg-sand-50/30 py-10 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb */}
        <nav
          aria-label={t('pdp.breadcrumb.aria_label', "Fil d'Ariane")}
          className="flex items-center gap-2 text-xs uppercase tracking-widest text-neutral-500"
        >
          <Link href="/" className="hover:text-gold-700 transition-colors">
            {t('nav.home', 'Accueil')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <Link href="/catalog" className="hover:text-gold-700 transition-colors">
            {t('nav.catalog', 'Boutique')}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
          <span className="text-gold-700 font-medium">
            {t('success.breadcrumb', 'Confirmation')}
          </span>
        </nav>

        {/* Hero Confirmation Card */}
        <section className="bg-white border border-sand-200 p-6 sm:p-10 text-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />
          
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mb-6 animate-in fade-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h1 className="font-serif text-3xl sm:text-4xl text-obsidian-900 font-bold tracking-tight">
              {t('success.hero.title', 'Commande Enregistrée avec Succès')}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              {t('success.hero.thank_you', 'Merci pour votre commande')},{' '}
              <strong className="font-semibold text-obsidian-900">
                {order.customer.fullName}
              </strong>
              . {t('success.hero.dossier_notice', 'Votre dossier a été transmis à notre atelier de confection et à notre service logistique.')}
            </p>
          </div>

          {/* Badges Bar: Order Number, Status, Payment */}
          <div className="mt-8 pt-6 border-t border-sand-200 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-sans">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 uppercase tracking-wider">
                {t('success.hero.order_num', 'N° Commande :')}
              </span>
              <span dir="ltr" className="font-sans tabular-nums text-sm sm:text-base font-bold text-gold-700 bg-gold-500/10 px-3 py-1 border border-gold-500/20">
                {order.orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 uppercase tracking-wider">
                {t('success.hero.status_label', 'Statut :')}
              </span>
              <span
                className={`px-3 py-1 uppercase tracking-widest text-[11px] font-semibold border rounded-full ${
                  STATUS_CONFIG[order.status]?.badgeClass ||
                  'bg-amber-500/10 text-amber-700 border-amber-500/30'
                }`}
              >
                {getStatusLabel(order.status, language)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500 uppercase tracking-wider">
                {t('success.hero.payment_label', 'Paiement :')}
              </span>
              <span className="text-neutral-800 font-medium">
                {t('success.hero.cod_val', 'Espèces à la livraison (COD)')}
              </span>
            </div>
          </div>
        </section>

        {/* TELEPHONE NOTICE BANNER (Algerian COD Key Requirement) */}
        <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent bg-white p-6 sm:p-8 space-y-4 border border-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-full shrink-0">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-obsidian-900">
                {t('success.call_banner.title', 'Validation Téléphonique Prioritaire')}
              </h2>
              <p className="text-sm text-neutral-700 leading-relaxed">
                <strong>{t('success.call_banner.desc', 'Notre service client vous contactera par téléphone sous 2h pour confirmer votre commande avant expédition.')}</strong>{' '}
                {t('success.call_banner.tel_notice', 'Un conseiller Maison VIP TADJ vous contactera par téléphone dans les prochaines heures pour valider votre commande et confirmer votre disponibilité.')}
              </p>
              <p className="text-xs text-neutral-500">
                {t('checkout.cod_banner.title', 'Paiement en espèces à la livraison (COD) • Aucun prépaiement par carte')}
              </p>
            </div>
          </div>

          {/* Quick Action Dialing */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-sans">
            <a
              href={telLink}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-obsidian-900 text-white font-semibold tracking-wider sm:tracking-[0.15em] uppercase hover:bg-gold-700 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              {t('success.call_banner.verify_phone', 'Vérifier mon numéro')} (<span dir="ltr">{formattedPhone}</span>)
            </a>
            <span className="text-neutral-400 text-xs">{t('common.or', 'ou')}</span>
            <a
              href={formatTelLink(storePhone)}
              className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-gold-700 transition-colors underline underline-offset-4"
            >
              {t('success.call_banner.concierge_contact', 'Contacter notre conciergerie :')} <span dir="ltr">{storePhone}</span>
            </a>
          </div>
        </section>

        {/* 1-CLICK WHATSAPP CONCIERGE BANNER */}
        <section className="bg-emerald-50/50 border border-emerald-500/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1 text-center sm:text-start">
              <h3 className="font-serif text-lg font-bold text-obsidian-900">
                {t('success.whatsapp.title', 'Conciergerie WhatsApp VIP TADJ')}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600">
                {t('success.whatsapp.desc', 'Confirmez instantanément votre commande et votre créneau de livraison en 1 clic sur WhatsApp.')}
              </p>
            </div>
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs uppercase tracking-[0.15em] font-semibold transition-colors shadow-sm shrink-0 w-full sm:w-auto"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('success.whatsapp.btn', 'Confirmer sur WhatsApp')}</span>
            <ExternalLink className="w-3.5 h-3.5 ms-1" />
          </a>
        </section>

        {/* Two-Column Details Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Customer Dossier & Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Customer Shipping Dossier Recap */}
            <div className="bg-white border border-sand-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-sand-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-gold-600" />
                  <h3 className="font-serif text-base font-bold text-obsidian-900 uppercase tracking-wider">
                    {t('success.dossier.title', 'Dossier Client & Livraison')}
                  </h3>
                </div>
                <span className="text-[11px] font-sans tabular-nums text-neutral-400">
                  {t('error.ref_prefix', 'Réf :')} {order.id}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                    {t('success.dossier.recipient', 'Destinataire')}
                  </span>
                  <span className="font-semibold text-obsidian-900">
                    {order.customer.fullName}
                  </span>
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                    {t('success.dossier.phone', 'Téléphone de contact')}
                  </span>
                  <a
                    href={telLink}
                    dir="ltr"
                    className="font-sans tabular-nums font-medium text-gold-700 hover:underline ltr-protect inline-block"
                  >
                    {formattedPhone}
                  </a>
                  {order.customer.secondaryPhone && (
                    <div className="mt-1">
                      <a
                        href={formatTelLink(order.customer.secondaryPhone)}
                        dir="ltr"
                        className="font-sans tabular-nums text-xs text-neutral-600 hover:text-gold-700 hover:underline ltr-protect inline-block"
                      >
                        {formatAlgerianPhone(order.customer.secondaryPhone)}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                    {t('success.dossier.destination', 'Destination')}
                  </span>
                  <span className="text-obsidian-900">
                    {t('checkout.field.wilaya', 'Wilaya')} {order.customer.wilayaCode} - {wilayaDisplay}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {t('checkout.field.commune', 'Commune')} : {communeDisplay}
                  </span>
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                    {t('success.dossier.delivery_mode', 'Mode de distribution')}
                  </span>
                  <span className="text-obsidian-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-gold-600" />
                    {order.customer.deliveryType === 'desk'
                      ? t('checkout.delivery.desk', 'Point Relais / Bureau')
                      : t('checkout.delivery.home', 'À domicile')}
                  </span>
                </div>

                {order.customer.address ? (
                  <div className="sm:col-span-2">
                    <span className="block text-xs uppercase tracking-wider text-neutral-500 mb-1">
                      {t('success.dossier.detailed_address', 'Adresse détaillée')}
                    </span>
                    <span className="text-obsidian-900 leading-relaxed">
                      {order.customer.address}
                    </span>
                  </div>
                ) : null}

                {order.customer.notes && (
                  <div className="sm:col-span-2 bg-sand-50 p-3.5 border-s-2 border-gold-500 text-xs">
                    <span className="block font-semibold text-obsidian-900 mb-0.5">
                      {t('success.dossier.special_notes', 'Instructions particulières :')}
                    </span>
                    <p className="text-neutral-600 italic">
                      &laquo; {order.customer.notes} &raquo;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div className="bg-white border border-sand-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-sand-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-gold-600" />
                  <h3 className="font-serif text-base font-bold text-obsidian-900 uppercase tracking-wider">
                    {t('success.items.title', 'Articles Commandés')} ({order.items.reduce((s, it) => s + it.quantity, 0)})
                  </h3>
                </div>
                <span className="text-xs text-neutral-500 font-sans">
                  {t('success.items.unit_price', 'Prix Unitaire')}
                </span>
              </div>

              <div className="divide-y divide-sand-200">
                {order.items.map((item, idx) => {
                  const localizedTitle = getLocalizedCartItemTitle(item, language);
                  const localizedSize = getLocalizedSize(item.selectedSize, language);

                  return (
                    <div
                      key={`${item.productId}-${item.selectedSize}-${idx}`}
                      className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-20 bg-sand-100 overflow-hidden shrink-0 border border-sand-200">
                          <Image
                            src={item.image || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35'}
                            alt={localizedTitle}
                            fill
                            className="object-cover object-top"
                          />
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-serif text-sm font-semibold text-obsidian-900 line-clamp-2">
                            {localizedTitle}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span className="inline-block bg-sand-100 px-2 py-0.5 border border-sand-300 font-sans tabular-nums text-[11px]">
                              {t('success.items.size', 'Taille')} {localizedSize}
                            </span>
                            {item.selectedColor && (
                              <span className="inline-block bg-sand-100 px-2 py-0.5 border border-sand-300 text-[11px]">
                                {t('checkout.summary.color_label', 'Couleur :')} {getLocalizedColor(item.selectedColor, language)}
                              </span>
                            )}
                            <span>
                              {t('success.items.qty', 'Quantité :')}{' '}
                              <strong className="font-sans tabular-nums text-obsidian-900">
                                {item.quantity}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-end shrink-0">
                        <span className="font-serif text-sm font-bold text-obsidian-900">
                          {formatDZD(item.price * item.quantity, { locale: language })}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[11px] font-sans tabular-nums text-neutral-500">
                            ({formatDZD(item.price, { locale: language })} {t('success.items.per_unit', '/ unité')})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Financial Recap & CTAs (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Financial Recap Card */}
            <div className="bg-white border border-sand-200 p-6 space-y-6">
              <h3 className="font-serif text-base font-bold text-obsidian-900 uppercase tracking-wider border-b border-sand-200 pb-3">
                {t('success.recap.title', 'Récapitulatif Financier')}
              </h3>

              <div className="space-y-3 text-sm font-sans">
                <div className="flex justify-between items-center text-neutral-600">
                  <span>{t('success.recap.subtotal', 'Sous-total articles :')}</span>
                  <span className="font-sans tabular-nums text-obsidian-900 font-medium">
                    {formatDZD(order.subtotal, { locale: language })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-neutral-600">
                  <span>{t('success.recap.shipping', 'Frais de livraison')} ({wilayaDisplay}) :</span>
                  <span className="font-sans tabular-nums font-medium">
                    {order.deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-semibold">
                        {t('success.recap.free', 'Gratuit (Offerte)')}
                      </span>
                    ) : (
                      formatDZD(order.deliveryFee, { locale: language })
                    )}
                  </span>
                </div>

                {order.discount !== undefined && order.discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>{t('success.recap.discount', 'Remise privilège :')}</span>
                    <span className="font-sans tabular-nums font-medium">
                      -{formatDZD(order.discount, { locale: language })}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t border-sand-200 flex justify-between items-baseline">
                  <div>
                    <span className="block font-serif text-base font-bold text-obsidian-900">
                      {t('success.recap.total', 'Total à Payer :')}
                    </span>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider">
                      {t('success.recap.cod_note', 'À la réception en espèces')}
                    </span>
                  </div>
                  <span className="font-serif text-xl sm:text-2xl font-bold text-gold-700">
                    {formatDZD(order.total, { locale: language })}
                  </span>
                </div>
              </div>

              {/* Trust Pillars */}
              <div className="pt-4 border-t border-sand-200 space-y-3 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>{t('success.trust.inspect', 'Inspection du colis avant paiement')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>{t('success.trust.secure_delivery', 'Livraison sécurisée sous 24h à 72h')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-600 shrink-0" />
                  <span>{t('success.trust.support_7d', 'Service client disponible 7j/7')}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Link
                href="/catalog"
                className="w-full py-4 px-6 bg-obsidian-900 hover:bg-gold-700 text-white font-sans uppercase tracking-[0.2em] text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>{t('success.action.view_catalog', 'Poursuivre mes Achats')}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>

              <Link
                href="/"
                className="w-full py-3.5 px-6 border border-sand-300 hover:border-gold-500 text-neutral-700 font-sans uppercase tracking-[0.15em] text-xs text-center block transition-colors"
              >
                {t('success.action.back_home', 'Retour à l\'Accueil')}
              </Link>
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}
