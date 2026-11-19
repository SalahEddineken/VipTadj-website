'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '@/lib/context/language-context';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n/types';

export interface LanguageSelectorProps {
  variant?: 'header' | 'pills' | 'admin' | 'minimal';
  className?: string;
}

export function LanguageSelector({
  variant = 'header',
  className = '',
}: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentOption =
    SUPPORTED_LANGUAGES.find((opt) => opt.code === language) ||
    SUPPORTED_LANGUAGES[0];

  // 1. PILLS VARIANT (Mobile Drawer, Announcement, Checkout)
  if (variant === 'pills') {
    return (
      <div
        className={`inline-flex items-center rounded-none border border-gold-500/30 bg-obsidian-900/60 p-0.5 ${className}`}
        role="group"
        aria-label={t('lang.selector.label', 'Sélectionner la langue')}
      >
        {SUPPORTED_LANGUAGES.map((opt) => {
          const isActive = language === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              onClick={() => setLanguage(opt.code)}
              aria-pressed={isActive}
              className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                isActive
                  ? 'bg-gold-500 text-obsidian-950 shadow-sm font-bold'
                  : 'text-sand-300 hover:text-gold-400 hover:bg-obsidian-800'
              }`}
            >
              <span className="inline-block">{opt.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // 2. MINIMAL VARIANT (Footer)
  if (variant === 'minimal') {
    return (
      <div
        className={`flex items-center gap-3 text-xs ${className}`}
        role="group"
        aria-label={t('lang.selector.label', 'Sélectionner la langue')}
      >
        <Globe className="w-3.5 h-3.5 text-gold-500/80 flex-shrink-0" />
        <div className="flex items-center gap-2">
          {SUPPORTED_LANGUAGES.map((opt, index) => {
            const isActive = language === opt.code;
            return (
              <React.Fragment key={opt.code}>
                {index > 0 && <span className="text-neutral-600">|</span>}
                <button
                  type="button"
                  onClick={() => setLanguage(opt.code)}
                  aria-pressed={isActive}
                  className={`min-h-[44px] inline-flex items-center py-2 px-1.5 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                    isActive
                      ? 'text-gold-400 font-bold underline underline-offset-4 decoration-gold-500/60'
                      : 'text-neutral-400 hover:text-ivory'
                  }`}
                >
                  {opt.nativeName}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. ADMIN VARIANT (Admin Sidebar & Top Bar)
  if (variant === 'admin') {
    return (
      <div
        ref={containerRef}
        className={`relative inline-block text-start ${className}`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={t('lang.selector.label', 'Sélectionner la langue')}
          className="flex items-center gap-2 px-2.5 py-1.5 min-h-[44px] text-xs font-medium text-obsidian-800 bg-white border border-obsidian-200 rounded hover:border-gold-500/60 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <Globe className="w-3.5 h-3.5 text-gold-600" />
          <span className="font-semibold uppercase tracking-wider">
            {currentOption.code.toUpperCase()}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-obsidian-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label={t('lang.selector.label', 'Sélectionner la langue')}
            className="absolute bottom-full mb-1.5 start-0 z-50 min-w-[140px] bg-white border border-obsidian-200 rounded shadow-xl py-1"
          >
            {SUPPORTED_LANGUAGES.map((opt) => {
              const isActive = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    setLanguage(opt.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-start transition-colors ${
                    isActive
                      ? 'bg-gold-50 text-gold-800 font-semibold'
                      : 'text-obsidian-700 hover:bg-ivory-100 hover:text-obsidian-950'
                  }`}
                >
                  <span>{opt.nativeName}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-gold-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 4. HEADER VARIANT (Storefront Header)
  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-start ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('lang.selector.label', 'Sélectionner la langue')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] text-xs uppercase tracking-wider font-semibold text-obsidian-800 hover:text-gold-700 border border-transparent hover:border-gold-500/30 transition-all rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        <Globe className="w-4 h-4 text-gold-700 flex-shrink-0" />
        <span className="font-sans font-semibold text-xs tracking-wider">{currentOption.code.toUpperCase()}</span>
        <ChevronDown
          className={`w-3 h-3 text-obsidian-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={t('lang.selector.label', 'Sélectionner la langue')}
          className="absolute top-full mt-1.5 end-0 z-50 min-w-[160px] bg-ivory border border-gold-500/30 shadow-luxury-card py-1.5 animate-fade-in"
        >
          {SUPPORTED_LANGUAGES.map((opt) => {
            const isActive = language === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setLanguage(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 text-xs text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  isActive
                    ? 'bg-gold-500/10 text-gold-700 font-bold'
                    : 'text-obsidian-800 hover:bg-gold-50 hover:text-gold-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 text-[11px] font-sans font-semibold tracking-wider text-sand-800 uppercase">
                    {opt.code.toUpperCase()}
                  </span>
                  <span>{opt.nativeName}</span>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-gold-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
