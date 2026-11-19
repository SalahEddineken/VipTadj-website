'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Truck, Building2, Sparkles, MapPin } from 'lucide-react';
import { WilayaDeliveryConfig, CommuneShippingFeeOverride } from '@/types';
import { getWilayaByCode, searchWilayas, formatEstimatedDays } from '@/lib/data/wilayas';
import { getCommuneOverride } from '@/lib/utils/deliveryUtils';
import { useStoreSettings } from '@/lib/context/store-settings-context';
import { formatDZD } from '@/lib/utils/formatDZD';
import { useLanguage } from '@/lib/context/language-context';
import { formatTranslation } from '@/lib/i18n/locales';

export interface WilayaSelectorProps {
  selectedWilayaCode: number | null;
  deliveryType: 'home' | 'desk';
  cartSubtotal: number;
  freeShippingThreshold?: number;
  customFees?: Record<number, { homeFee: number; deskFee: number; active: boolean }>;
  communeFees?: Record<string, CommuneShippingFeeOverride>;
  selectedCommune?: string;
  onSelectWilaya: (wilaya: WilayaDeliveryConfig) => void;
  onChangeDeliveryType: (type: 'home' | 'desk') => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  hideFreeShippingProgress?: boolean;
}

export function WilayaSelector({
  selectedWilayaCode,
  deliveryType,
  cartSubtotal,
  freeShippingThreshold,
  customFees,
  communeFees,
  selectedCommune,
  onSelectWilaya,
  onChangeDeliveryType,
  error,
  disabled = false,
  className = '',
  children,
  hideFreeShippingProgress = false,
}: WilayaSelectorProps) {
  const { language, t } = useLanguage();
  const { settings } = useStoreSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const effectiveThreshold = freeShippingThreshold ?? settings?.freeShippingThreshold ?? 15000;
  const effectiveCustomFees = customFees ?? settings?.wilayaShippingFees;
  const effectiveCommuneFees = communeFees ?? settings?.communeShippingFees;

  const selectedWilaya = useMemo(() => {
    return selectedWilayaCode ? getWilayaByCode(selectedWilayaCode) : null;
  }, [selectedWilayaCode]);

  const { homeFee, deskFee, isAvailable } = useMemo(() => {
    if (!selectedWilaya) {
      return { homeFee: 800, deskFee: 650, isAvailable: true };
    }
    const code = selectedWilaya.code;
    const customCfg = effectiveCustomFees?.[code];
    let hFee = customCfg?.homeFee ?? selectedWilaya.homeDeliveryFee ?? selectedWilaya.fee ?? 800;
    let dFee = customCfg?.deskFee ?? selectedWilaya.deskFee ?? 650;
    const active = customCfg?.active !== false;

    if (effectiveCommuneFees && selectedCommune) {
      const cOverride = getCommuneOverride(code, selectedCommune, effectiveCommuneFees);
      if (cOverride && cOverride.active !== false) {
        if (cOverride.homeFee !== undefined) hFee = cOverride.homeFee;
        if (cOverride.deskFee !== undefined) dFee = cOverride.deskFee;
      }
    }

    return { homeFee: hFee, deskFee: dFee, isAvailable: active };
  }, [selectedWilaya, effectiveCustomFees, effectiveCommuneFees, selectedCommune]);

  const filteredWilayas = useMemo(() => {
    return searchWilayas(searchQuery);
  }, [searchQuery]);

  const isFreeShipping = cartSubtotal >= effectiveThreshold;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = (wilaya: WilayaDeliveryConfig) => {
    const customCfg = effectiveCustomFees?.[wilaya.code];
    const enriched: WilayaDeliveryConfig = {
      ...wilaya,
      homeDeliveryFee: customCfg?.homeFee ?? wilaya.homeDeliveryFee,
      deskDeliveryFee: customCfg?.deskFee ?? wilaya.deskDeliveryFee,
      fee: customCfg?.homeFee ?? wilaya.fee,
      isAvailable: customCfg?.active !== false,
    };
    onSelectWilaya(enriched);
    setIsOpen(false);
  };

  return (
    <div className={`space-y-4 ${className}`} ref={dropdownRef}>
      {/* 1. Wilaya Selection Dropdown */}
      <div className="relative">
        <label className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium mb-1.5 text-start">
          {t('checkout.wilaya.label', 'Wilaya de livraison')} <span className="text-bronze-600 font-serif">*</span>
        </label>

        <button
          type="button"
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`${t('checkout.wilaya.label', 'Wilaya de livraison')}${selectedWilaya ? `: ${selectedWilaya.code} ${language === 'ar' ? (selectedWilaya.nameAr || selectedWilaya.name) : selectedWilaya.name}` : ` - ${t('checkout.field.wilaya_select', 'Sélectionnez votre wilaya (1 à 68)...')}`}`}
          className={`w-full flex items-center justify-between px-3.5 py-3 text-start bg-white border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${error
              ? 'border-red-500 focus:ring-1 focus:ring-red-500'
              : isOpen
                ? 'border-gold-600 ring-1 ring-gold-600/30'
                : 'border-sand-300 hover:border-gold-500'
            } ${disabled ? 'bg-sand-100 cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <MapPin className="w-4 h-4 text-bronze-500 flex-shrink-0" />
            {selectedWilaya ? (
              <span className="font-medium text-charcoal-900 truncate">
                <span className="font-sans tabular-nums text-bronze-700 font-semibold me-1.5">
                  {String(selectedWilaya.code).padStart(2, '0')}
                </span>
                {language === 'ar' ? (
                  selectedWilaya.nameAr || selectedWilaya.name
                ) : language === 'en' ? (
                  selectedWilaya.name
                ) : (
                  <>
                    {selectedWilaya.name}
                    {selectedWilaya.nameAr && (
                      <span className="ms-1.5 text-xs text-charcoal-600 font-arabic">
                        ({selectedWilaya.nameAr})
                      </span>
                    )}
                  </>
                )}
              </span>
            ) : (
              <span className="text-charcoal-600 text-sm">
                {t('checkout.field.wilaya_select', 'Sélectionnez votre wilaya (1 à 68)...')}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-charcoal-600 transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-gold-600' : ''
              }`}
          />
        </button>

        {error && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1" role="alert">
            {error}
          </p>
        )}

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-sand-200 shadow-2xl rounded-sm overflow-hidden animate-fadeIn">
            {/* Search Input Box */}
            <div className="p-2.5 bg-sand-50 border-b border-sand-200 sticky top-0 z-10">
              <div className="relative">
                <Search className="w-4 h-4 text-charcoal-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('checkout.wilaya.search_ph', 'Tapez le code (ex: 16) ou nom (ex: Alger, الجزائر)...')}
                  className="w-full ps-9 pe-3 py-2 text-xs bg-white border border-sand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 text-charcoal-900"
                />
              </div>
            </div>

            {/* List of 68 Wilayas */}
            <div className="max-h-60 overflow-y-auto divide-y divide-sand-100">
              {filteredWilayas.length > 0 ? (
                filteredWilayas.map((wilaya) => {
                  const isSelected = selectedWilaya?.code === wilaya.code;
                  return (
                    <button
                      key={wilaya.code}
                      type="button"
                      onClick={() => handleSelect(wilaya)}
                      className={`w-full px-3.5 py-2.5 min-h-[44px] flex items-center justify-between text-start hover:bg-ivory/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${isSelected ? 'bg-gold-50/60 font-medium' : ''
                        }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="font-sans tabular-nums text-xs font-semibold px-1.5 py-0.5 rounded bg-sand-200 text-charcoal-800">
                          {String(wilaya.code).padStart(2, '0')}
                        </span>
                        {language === 'ar' ? (
                          <span className="text-sm text-charcoal-900 truncate font-arabic">
                            {wilaya.nameAr || wilaya.name}
                          </span>
                        ) : language === 'en' ? (
                          <span className="text-sm text-charcoal-900 truncate">
                            {wilaya.name}
                          </span>
                        ) : (
                          <>
                            <span className="text-sm text-charcoal-900 truncate">
                              {wilaya.name}
                            </span>
                            {wilaya.nameAr && (
                              <span className="ms-1.5 text-xs text-charcoal-600 font-arabic">
                                {wilaya.nameAr}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-end">
                        <span className="text-xs text-charcoal-500">
                          {formatEstimatedDays(wilaya.estimatedDays, language)}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-gold-600" />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-charcoal-400">
                  {formatTranslation(
                    t('checkout.wilaya.empty', 'Aucune wilaya trouvée pour “{query}”'),
                    { query: searchQuery }
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Embedded elements (e.g. CommuneSelector) positioned above Delivery Mode */}
      {children}

      {/* 2. Delivery Mode: Home vs Stop Desk (shown after commune when embedded with children) */}
      {selectedWilaya && (!children || Boolean(selectedCommune && selectedCommune.trim())) && (
        <div className="space-y-2 pt-2 animate-fadeIn">
          <label className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium">
            {t('checkout.wilaya.mode_label', 'Mode de livraison')}
          </label>

          <div
            role="radiogroup"
            aria-label={t('checkout.wilaya.mode_label', 'Mode de livraison')}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {/* Card 1: Stop Desk Delivery */}
            <button
              type="button"
              role="radio"
              aria-checked={deliveryType === 'desk'}
              onClick={() => onChangeDeliveryType('desk')}
              className={`p-3.5 border text-start flex flex-col justify-between transition-all rounded-sm ${deliveryType === 'desk'
                  ? 'border-gold-600 bg-gold-50/20 ring-1 ring-gold-600/30'
                  : 'border-sand-300 hover:border-gold-400 bg-white'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-bronze-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-900">
                    {t('checkout.delivery.desk', 'Point Relais / Bureau')}
                  </span>
                </div>
                {deliveryType === 'desk' && (
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-600 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-charcoal-500 mb-2">
                {formatTranslation(
                  t('checkout.wilaya.desk_est', 'Retrait au bureau du transporteur ({days})'),
                  { days: formatEstimatedDays(selectedWilaya.estimatedDays, language) }
                )}
              </p>
              <div className="text-sm font-semibold">
                {isFreeShipping ? (
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('checkout.wilaya.free_badge', 'Gratuit (Offert)')}
                  </span>
                ) : (
                  <span className="text-charcoal-900">{formatDZD(deskFee, { locale: language })}</span>
                )}
              </div>
            </button>

            {/* Card 2: Home Delivery */}
            <button
              type="button"
              role="radio"
              aria-checked={deliveryType === 'home'}
              onClick={() => onChangeDeliveryType('home')}
              className={`p-3.5 border text-start flex flex-col justify-between transition-all rounded-sm ${deliveryType === 'home'
                  ? 'border-gold-600 bg-gold-50/20 ring-1 ring-gold-600/30'
                  : 'border-sand-300 hover:border-gold-400 bg-white'
                }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-bronze-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-900">
                    {t('checkout.delivery.home', 'À domicile')}
                  </span>
                </div>
                {deliveryType === 'home' && (
                  <div className="w-3.5 h-3.5 rounded-full bg-gold-600 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-charcoal-500 mb-2">
                {formatTranslation(
                  t('checkout.wilaya.home_est', 'Livraison express à votre porte ({days})'),
                  { days: formatEstimatedDays(selectedWilaya.estimatedDays, language) }
                )}
              </p>
              <div className="text-sm font-semibold">
                {isFreeShipping ? (
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t('checkout.wilaya.free_badge', 'Gratuit (Offert)')}
                  </span>
                ) : (
                  <span className="text-charcoal-900">{formatDZD(homeFee, { locale: language })}</span>
                )}
              </div>
            </button>
          </div>

          {/* Free Shipping Notification / Progress */}
          {!hideFreeShippingProgress && (
            isFreeShipping ? (
              <div className="p-2.5 bg-green-50 border border-green-200 rounded-sm flex items-center gap-2 text-xs text-green-800">
                <Sparkles className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>
                  {formatTranslation(
                    t('checkout.wilaya.free_qualified', 'Livraison offerte ! Votre panier dépasse {amount}.'),
                    { amount: formatDZD(effectiveThreshold, { locale: language }) }
                  )}
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-ivory border border-sand-200 rounded-sm text-xs text-charcoal-600 flex items-center justify-between">
                <span>
                  {formatTranslation(
                    t('checkout.wilaya.free_threshold_hint', "Livraison gratuite dès {amount} d'achats"),
                    { amount: formatDZD(effectiveThreshold, { locale: language }) }
                  )}
                </span>
                <span className="text-xs text-bronze-600 font-medium">
                  {formatTranslation(
                    t('checkout.wilaya.free_remaining', 'Encore {amount}'),
                    { amount: formatDZD(effectiveThreshold - cartSubtotal, { locale: language }) }
                  )}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
