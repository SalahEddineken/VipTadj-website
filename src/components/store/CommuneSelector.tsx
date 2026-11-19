'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, MapPin } from 'lucide-react';
import { getCommunesByWilaya, findCommune } from '@/lib/data/communes';
import { useLanguage } from '@/lib/context/language-context';

export interface CommuneSelectorProps {
  selectedWilayaCode: number | null;
  value: string;
  onChange: (commune: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function CommuneSelector({
  selectedWilayaCode,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
  id = 'checkout-commune',
}: CommuneSelectorProps) {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Available communes for the selected wilaya
  const availableCommunes = useMemo(() => {
    if (!selectedWilayaCode) return [];
    return getCommunesByWilaya(selectedWilayaCode);
  }, [selectedWilayaCode]);

  // Close dropdown when wilaya changes
  useEffect(() => {
    setIsOpen(false);
  }, [selectedWilayaCode]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCommune = (communeName: string) => {
    onChange(communeName);
    setIsOpen(false);
  };

  const resolvedDisplayValue = useMemo(() => {
    if (!value || !selectedWilayaCode) return value;
    const matched = findCommune(selectedWilayaCode, value);
    if (!matched) return value;
    return language === 'ar' ? (matched.nameAr || matched.name) : matched.name;
  }, [value, selectedWilayaCode, language]);

  const isWilayaSelected = !!selectedWilayaCode;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label
        htmlFor={id}
        className="block text-xs uppercase tracking-wider text-charcoal-700 font-medium text-start mb-1.5"
      >
        {t('checkout.field.commune', 'Commune / Baladiya *')}{' '}
        <span aria-hidden="true" className="text-bronze-600 font-serif">*</span>
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          onClick={() => isWilayaSelected && !disabled && setIsOpen((prev) => !prev)}
          disabled={disabled || !isWilayaSelected}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={`${id}-listbox`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full flex items-center justify-between px-3.5 py-3 text-start bg-white border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm ${
            error
              ? 'border-red-500 focus:ring-1 focus:ring-red-500'
              : isOpen
              ? 'border-gold-600 ring-1 ring-gold-600/30'
              : 'border-sand-300 hover:border-gold-500'
          } ${disabled || !isWilayaSelected ? 'bg-sand-100 cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <MapPin className="w-4 h-4 text-bronze-500 flex-shrink-0" />
            {resolvedDisplayValue ? (
              <span className="font-medium text-charcoal-900 truncate text-sm">
                {resolvedDisplayValue}
              </span>
            ) : (
              <span className="text-charcoal-600 text-sm truncate">
                {!isWilayaSelected
                  ? t('checkout.field.commune_pick_wilaya_first', 'Veuillez d\'abord sélectionner votre wilaya...')
                  : t('checkout.field.commune_ph', 'Sélectionnez votre commune...')}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-charcoal-600 flex-shrink-0 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-gold-600' : ''
            }`}
          />
        </button>

        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs text-red-600 text-start" role="alert">
            {error}
          </p>
        )}

        {/* Dropdown Menu */}
        {isOpen && isWilayaSelected && (
          <div
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-white border border-sand-200 shadow-2xl rounded-sm overflow-hidden animate-fadeIn"
          >
            {/* List of Baladiyat */}
            <div className="max-h-56 overflow-y-auto divide-y divide-sand-100">
              {availableCommunes.map((commune) => {
                const isSelected =
                  value.toLowerCase().trim() === commune.name.toLowerCase().trim() ||
                  (commune.nameAr && value.trim() === commune.nameAr.trim());

                const displayName =
                  language === 'ar'
                    ? commune.nameAr || commune.name
                    : language === 'en'
                    ? commune.name
                    : commune.nameAr
                    ? `${commune.name} (${commune.nameAr})`
                    : commune.name;

                const targetValue = language === 'ar' && commune.nameAr ? commune.nameAr : commune.name;

                return (
                  <button
                    key={`${commune.wilayaCode}-${commune.name}`}
                    type="button"
                    onClick={() => handleSelectCommune(targetValue)}
                    className={`w-full px-3.5 py-2.5 min-h-[40px] flex items-center justify-between text-start hover:bg-ivory/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                      isSelected ? 'bg-gold-50/60 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm text-charcoal-900 truncate">
                        {displayName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-end flex-shrink-0">
                      {commune.postalCode && (
                        <span className="text-[11px] font-mono text-charcoal-400">
                          {commune.postalCode}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-gold-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
