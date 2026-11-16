'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Phone,
  User,
  MapPin,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import { CustomerShippingInfo, OrderItem } from '@/types';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { isValidAlgerianPhone } from '@/lib/utils/phoneUtils';
import { calculateDeliveryFee, calculateSubtotal, calculateTotal } from '@/lib/utils/deliveryUtils';
import { formatDZD } from '@/lib/utils/formatDZD';
import { useLanguage } from '@/lib/context/language-context';

interface FormState {
  fullName: string;
  phone: string;
  secondaryPhone: string;
  wilayaCode: number | null;
  commune: string;
  address: string;
  notes: string;
  deliveryType: 'home' | 'desk';
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  wilaya?: string;
  commune?: string;
  address?: string;
  general?: string;
}

function CheckoutLoading() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-ivory">
      <Loader2 className="w-8 h-8 animate-spin text-gold-600 mb-4" />
      <p className="text-sm text-charcoal-600 tracking-wider font-serif">
        {t('checkout.loading', 'Préparation de votre commande VIP TADJ...')}
      </p>
    </div>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDirectCheckout = searchParams.get('direct') === '1';
  const { language, t } = useLanguage();

  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    phone: '',
    secondaryPhone: '',
    wilayaCode: null,
    commune: '',
    address: '',
    notes: '',
    deliveryType: 'home',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // 1. Load Items: either express single item or full standard cart
  useEffect(() => {
    try {
      if (isDirectCheckout) {
        // Express checkout: loads strictly from sessionStorage to keep localStorage untouched
        const expressRaw = sessionStorage.getItem('vip_express_checkout');
        if (expressRaw) {
          const item = JSON.parse(expressRaw);
          setItems([item]);
        }
      } else {
        // Standard cart checkout
        const cartRaw = localStorage.getItem('vip_cart');
        if (cartRaw) {
          const cart = JSON.parse(cartRaw);
          if (Array.isArray(cart)) {
            setItems(cart);
          }
        }
      }
    } catch {
      // In-memory fallback
    } finally {
      setIsLoadingItems(false);
    }
  }, [isDirectCheckout]);

  // Financial calculations
  const subtotal = useMemo(() => calculateSubtotal(items), [items]);
  const freeShippingThreshold = 15000;

  const deliveryFee = useMemo(() => {
    return calculateDeliveryFee(
      subtotal,
      formData.wilayaCode,
      freeShippingThreshold,
      formData.deliveryType
    );
  }, [subtotal, formData.wilayaCode, freeShippingThreshold, formData.deliveryType]);

  const total = useMemo(() => {
    return calculateTotal(subtotal, deliveryFee);
  }, [subtotal, deliveryFee]);

  const selectedWilaya = useMemo(() => {
    return formData.wilayaCode ? getWilayaByCode(formData.wilayaCode) : null;
  }, [formData.wilayaCode]);

  // Handle generic form inputs
  const handleChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Comprehensive client validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      newErrors.fullName = t(
        'checkout.validation.name_required',
        'Veuillez renseigner un nom et prénom valides (au moins 3 caractères).'
      );
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t(
        'checkout.validation.phone_required',
        'Le numéro de téléphone mobile est requis.'
      );
    } else if (!isValidAlgerianPhone(formData.phone)) {
      newErrors.phone = t(
        'checkout.validation.phone_invalid',
        'Numéro algérien invalide. Veuillez saisir 10 chiffres (ex: 0555 12 34 56).'
      );
    }

    if (!formData.wilayaCode) {
      newErrors.wilaya = t(
        'checkout.validation.wilaya_required',
        'Veuillez sélectionner votre Wilaya de livraison (1 à 58).'
      );
    }

    if (!formData.commune.trim()) {
      newErrors.commune = t(
        'checkout.validation.commune_required',
        'La commune de livraison est obligatoire.'
      );
    }

    if (!formData.address.trim()) {
      newErrors.address = t(
        'checkout.validation.address_required',
        "L'adresse de livraison détaillée est obligatoire."
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError instanceof HTMLElement) {
        firstError.focus();
      }
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const shippingDossier: CustomerShippingInfo = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        wilayaCode: formData.wilayaCode!,
        wilaya: selectedWilaya?.name || '',
        commune: formData.commune.trim(),
        address: formData.address.trim(),
        deliveryType: formData.deliveryType,
      };

      if (formData.secondaryPhone.trim()) {
        shippingDossier.secondaryPhone = formData.secondaryPhone.trim();
      }
      if (formData.notes.trim()) {
        shippingDossier.notes = formData.notes.trim();
      }

      const orderPayload = {
        customer: shippingDossier,
        items,
        deliveryFee,
        subtotal,
        total,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || t('checkout.error.submit_failed', 'Erreur lors de la validation de votre commande.'));
      }

      const result = await response.json();
      const placedOrder = result.order || result;

      // Post-order storage cleanup
      if (isDirectCheckout) {
        sessionStorage.removeItem('vip_express_checkout');
      } else {
        localStorage.removeItem('vip_cart');
        window.dispatchEvent(new CustomEvent('vip-cart-updated'));
      }

      // Cache placed order in sessionStorage as resilience buffer
      try {
        if (placedOrder.id) {
          sessionStorage.setItem(`vip_last_order_${placedOrder.id}`, JSON.stringify(placedOrder));
        }
        if (placedOrder.orderNumber) {
          sessionStorage.setItem(`vip_last_order_${placedOrder.orderNumber}`, JSON.stringify(placedOrder));
        }
      } catch {
        // Ignore storage error
      }

      // Navigate to order confirmation
      const queryParam = isDirectCheckout ? '?direct=1' : '';
      router.push(`/checkout/success/${placedOrder.id || placedOrder.orderNumber}${queryParam}`);
    } catch (err: any) {
      setErrors({
        general: err.message || t('checkout.error.unexpected', 'Une erreur inattendue est survenue. Veuillez vérifier votre saisie.'),
      });
      setIsSubmitting(false);
    }
  };

  if (isLoadingItems) {
    return <CheckoutLoading />;
  }

  // Empty state handling
  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-ivory text-center">
        <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mb-6">
          <ShoppingBag className="w-8 h-8 text-bronze-500" />
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-light text-charcoal-900 mb-3 tracking-wide">
          {t('checkout.empty.title', 'Votre Panier est Vide')}
        </h1>
        <p className="text-sm text-charcoal-600 max-w-md mb-8">
          {t(
            'checkout.empty.desc',
            'Veuillez sélectionner au moins une création de notre catalogue avant de procéder à la commande.'
          )}
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-charcoal-900 text-ivory text-xs uppercase tracking-widest font-medium hover:bg-gold-700 transition-colors rounded-sm"
        >
          <span>{t('checkout.empty.cta', 'Explorer le Catalogue')}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-sand-50/50 min-h-screen py-8 md:py-12">
      <div className="luxury-container max-w-6xl mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <nav className="text-xs text-charcoal-500 mb-6 flex items-center gap-2">
          <Link href="/" className="hover:text-charcoal-900 transition-colors">
            {t('checkout.breadcrumb.home', 'Accueil')}
          </Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-charcoal-900 transition-colors">
            {t('checkout.breadcrumb.cart', 'Panier')}
          </Link>
          <span>/</span>
          <span className="text-charcoal-900 font-medium">
            {t('checkout.breadcrumb.checkout', 'Validation de Commande (COD)')}
          </span>
        </nav>

        {/* Cash On Delivery (COD) Trust Banner */}
        <div className="mb-8 p-4 md:p-5 bg-white border border-gold-600/30 shadow-sm rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center flex-shrink-0 text-gold-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal-900">
                {t('checkout.cod_banner.title', 'Paiement en espèces à la livraison (COD) • Aucun prépaiement par carte')}
              </h2>
              <p className="text-xs text-charcoal-600">
                {t('checkout.cod_banner.desc', 'Réglez en toute sérénité à la réception de votre colis. Commande 100% Sécurisée.')}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sand-100 rounded text-xs font-medium text-charcoal-700">
            <Lock className="w-3.5 h-3.5 text-gold-600" />
            <span>{t('checkout.trust.secure', 'Commande 100% Sécurisée')}</span>
          </div>
        </div>

        {/* Global Error Banner */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Main 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Order Form */}
          <div className="lg:col-span-7 bg-white p-4 sm:p-6 md:p-8 border border-sand-200 shadow-sm rounded-sm">
            <h1 className="font-serif text-xl sm:text-2xl font-light text-charcoal-900 mb-6 tracking-wide pb-3 border-b border-sand-200 text-start">
              {t('checkout.title', 'Finalisation de Commande')}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Contact Details */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-widest text-charcoal-500 font-semibold flex items-center gap-1.5 text-start">
                  <User className="w-3.5 h-3.5 text-bronze-600" />
                  <span>{t('checkout.section.contact', 'Coordonnées du Destinataire')}</span>
                </h3>

                {/* Full Name */}
                <div>
                  <label htmlFor="checkout-fullName" className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 text-start">
                    {t('checkout.field.full_name', 'Nom et Prénom *')}{' '}
                    <span aria-hidden="true" className="text-bronze-600 font-serif">*</span>
                  </label>
                  <input
                    id="checkout-fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    placeholder={t('checkout.field.full_name_ph', 'ex. Mohamed Benali')}
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? "checkout-fullName-error" : undefined}
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                      errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-sand-300 focus:border-gold-600'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm text-start`}
                  />
                  {errors.fullName && (
                    <p id="checkout-fullName-error" className="mt-1 text-xs text-red-600 text-start">{errors.fullName}</p>
                  )}
                </div>

                {/* Primary Phone */}
                <div>
                  <label htmlFor="checkout-phone" className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-start">
                    <span>
                      {t('checkout.field.phone', 'Téléphone mobile *')}{' '}
                      <span aria-hidden="true" className="text-bronze-600 font-serif">*</span>
                    </span>
                    <span className="text-xs text-charcoal-500 font-normal">
                      {t('checkout.field.phone_hint', 'Numéro joignable pour confirmation de la commande avant expédition.')}
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-sand-800 flex items-center gap-1 font-sans">
                      DZ
                    </span>
                    <input
                      id="checkout-phone"
                      type="tel"
                      dir="ltr"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder={t('checkout.field.phone_ph', '05 / 06 / 07 XX XX XX XX')}
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "checkout-phone-error" : undefined}
                      className={`w-full ps-10 pe-3.5 py-2.5 text-sm bg-white border ${
                        errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-sand-300 focus:border-gold-600'
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm font-sans tabular-nums text-start`}
                    />
                  </div>
                  {errors.phone && (
                    <p id="checkout-phone-error" className="mt-1 text-xs text-red-600 text-start">{errors.phone}</p>
                  )}
                </div>

                {/* Secondary Phone (Optional) */}
                <div>
                  <label htmlFor="checkout-secondaryPhone" className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-start">
                    <span>{t('checkout.field.phone2', 'Numéro secondaire (optionnel)')}</span>
                    <span className="text-xs text-charcoal-500 font-normal">
                      {t('checkout.field.phone2_ph', 'Autre numéro de contact')}
                    </span>
                  </label>
                  <input
                    id="checkout-secondaryPhone"
                    type="tel"
                    dir="ltr"
                    value={formData.secondaryPhone}
                    onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                    placeholder={t('checkout.field.phone2_ph', 'Autre numéro de contact')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-sand-300 focus:border-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm font-sans tabular-nums text-start"
                  />
                </div>
              </div>

              {/* Section 2: Destination Wilaya & Address */}
              <div className="space-y-4 pt-4 border-t border-sand-200">
                <h3 className="text-xs uppercase tracking-widest text-charcoal-500 font-semibold flex items-center gap-1.5 text-start">
                  <MapPin className="w-3.5 h-3.5 text-bronze-600" />
                  <span>{t('checkout.section.shipping', 'Adresse de Livraison en Algérie')}</span>
                </h3>

                {/* Algerian 58 Wilayas Selector Component */}
                <WilayaSelector
                  selectedWilayaCode={formData.wilayaCode}
                  deliveryType={formData.deliveryType}
                  cartSubtotal={subtotal}
                  freeShippingThreshold={freeShippingThreshold}
                  onSelectWilaya={(wilaya) => {
                    handleChange('wilayaCode', wilaya.code);
                  }}
                  onChangeDeliveryType={(type) => {
                    handleChange('deliveryType', type);
                  }}
                  error={errors.wilaya}
                />

                {/* Commune */}
                <div>
                  <label htmlFor="checkout-commune" className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 text-start">
                    {t('checkout.field.commune', 'Commune / Ville *')}{' '}
                    <span aria-hidden="true" className="text-bronze-600 font-serif">*</span>
                  </label>
                  <input
                    id="checkout-commune"
                    type="text"
                    value={formData.commune}
                    onChange={(e) => handleChange('commune', e.target.value)}
                    placeholder={t('checkout.field.commune_ph', 'ex. Hydra, Bab Ezzouar, Oran Centre...')}
                    aria-invalid={!!errors.commune}
                    aria-describedby={errors.commune ? "checkout-commune-error" : undefined}
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                      errors.commune ? 'border-red-500 focus:ring-red-500' : 'border-sand-300 focus:border-gold-600'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm text-start`}
                  />
                  {errors.commune && (
                    <p id="checkout-commune-error" className="mt-1 text-xs text-red-600 text-start">{errors.commune}</p>
                  )}
                </div>

                {/* Full Street Address */}
                <div>
                  <label htmlFor="checkout-address" className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 text-start">
                    {t('checkout.field.address', 'Adresse détaillée *')}{' '}
                    <span aria-hidden="true" className="text-bronze-600 font-serif">*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder={t('checkout.field.address_ph', 'Numéro, rue, bâtiment, quartier, repère visible...')}
                    aria-invalid={!!errors.address}
                    aria-describedby={errors.address ? "checkout-address-error" : undefined}
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
                      errors.address ? 'border-red-500 focus:ring-red-500' : 'border-sand-300 focus:border-gold-600'
                    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm resize-none text-start`}
                  />
                  {errors.address && (
                    <p id="checkout-address-error" className="mt-1 text-xs text-red-600 text-start">{errors.address}</p>
                  )}
                </div>

                {/* Delivery Notes (Optional) */}
                <div>
                  <label htmlFor="checkout-notes" className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 text-start">
                    {t('checkout.field.notes', 'Remarques pour le livreur (optionnel)')}
                  </label>
                  <input
                    id="checkout-notes"
                    type="text"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    placeholder={t('checkout.field.notes_ph', 'Instructions particulières, créneau horaire souhaité...')}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-sand-300 focus:border-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 transition-colors rounded-sm text-start"
                  />
                </div>
              </div>

              {/* Order Submission Button */}
              <div className="pt-6 border-t border-sand-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 sm:px-6 bg-charcoal-900 text-ivory text-xs uppercase tracking-wider sm:tracking-widest font-semibold hover:bg-gold-700 active:scale-[0.99] transition-all shadow-md disabled:bg-sand-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      <span>{t('checkout.submit.processing', 'Validation de votre commande...')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('checkout.submit.btn', 'Confirmer la commande')} ({formatDZD(total, { locale: language })})</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>

                <p className="mt-3 text-xs text-center text-charcoal-500">
                  {t(
                    'checkout.submit.reassurance',
                    "Un conseiller VIP TADJ vous contactera par téléphone pour confirmer votre commande avant l'expédition."
                  )}
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary & Financial Recap */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 border border-sand-200 shadow-sm rounded-sm">
              <h2 className="font-serif text-lg font-light text-charcoal-900 pb-3 mb-4 border-b border-sand-200 flex items-center justify-between">
                <span>{t('checkout.summary.title', 'Votre Commande')}</span>
                <span className="text-xs font-sans tabular-nums font-normal text-charcoal-500">
                  {items.length} {t('checkout.summary.items_count', 'article(s)')}
                </span>
              </h2>

              {/* Items List */}
              <div className="divide-y divide-sand-100 max-h-80 overflow-y-auto mb-4">
                {items.map((item, idx) => (
                  <div key={`${item.productId}-${item.selectedSize}-${idx}`} className="py-3 flex gap-3">
                    <div className="w-16 h-20 bg-sand-100 relative rounded-sm overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-medium text-charcoal-900 line-clamp-2 text-start">
                          {item.title}
                        </h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-charcoal-500">
                          <span className="px-1.5 py-0.5 bg-sand-100 rounded">
                            {t('checkout.summary.size_label', 'Taille :')} {item.selectedSize}
                          </span>
                          {item.selectedColor && (
                            <span className="px-1.5 py-0.5 bg-sand-100 rounded">
                              {t('checkout.summary.color_label', 'Couleur :')} {item.selectedColor}
                            </span>
                          )}
                          <span>
                            {t('checkout.summary.qty_label', 'Qté :')} {item.quantity}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-charcoal-900 text-start">
                        {formatDZD(item.price * item.quantity, { locale: language })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-2.5 pt-4 border-t border-sand-200 text-xs text-charcoal-600">
                <div className="flex justify-between">
                  <span>{t('checkout.summary.subtotal', 'Sous-total articles')}</span>
                  <span className="font-medium text-charcoal-900">
                    {formatDZD(subtotal, { locale: language })}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    {t('checkout.summary.shipping', 'Livraison')} ({selectedWilaya?.name || (language === 'ar' ? 'الجزائر' : 'Algérie')} -{' '}
                    {formData.deliveryType === 'home'
                      ? t('checkout.delivery.home', 'À domicile')
                      : t('checkout.delivery.desk', 'Point Relais / Bureau')})
                  </span>
                  <span className="font-medium text-charcoal-900">
                    {deliveryFee === 0 ? (
                      <span className="text-green-700 font-semibold">{t('checkout.summary.free', 'Gratuit')}</span>
                    ) : (
                      formatDZD(deliveryFee, { locale: language })
                    )}
                  </span>
                </div>

                {subtotal >= freeShippingThreshold && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-green-600" />
                    <span>{t('cart.free_shipping_meter.qualified', 'Félicitations ! Livraison offerte sur 58 Wilayas.')}</span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 border-t border-sand-200 text-base text-charcoal-900 font-semibold">
                  <span className="font-serif">{t('checkout.summary.total_to_pay', 'Total à payer')}</span>
                  <span className="font-serif text-lg text-gold-700 font-bold">
                    {formatDZD(total, { locale: language })}
                  </span>
                </div>
              </div>
            </div>

            {/* Service & Guarantee Highlights */}
            <div className="bg-ivory/60 p-5 border border-sand-200 rounded-sm space-y-3 text-xs text-charcoal-600">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                <div className="text-start">
                  <strong className="text-charcoal-900 block font-medium">
                    {t('checkout.reassurance.cod_title', 'Paiement à la Réception')}
                  </strong>
                  {t('checkout.reassurance.cod_desc', "Vous ne payez qu'à la livraison physique de votre colis, après vérification.")}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
                <div className="text-start">
                  <strong className="text-charcoal-900 block font-medium">
                    {t('checkout.reassurance.phone_title', 'Confirmation Téléphonique')}
                  </strong>
                  {t('checkout.reassurance.phone_desc', 'Notre conciergerie vous appelle systématiquement avant toute expédition.')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
