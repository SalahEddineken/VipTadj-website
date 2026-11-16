import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/lib/context/language-context';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { getTranslation, formatTranslation, fr, en, ar } from '@/lib/i18n/locales';

// Test consumer component
function TestConsumer() {
  const { language, direction, isRtl, setLanguage, t } = useLanguage();

  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <span data-testid="current-dir">{direction}</span>
      <span data-testid="is-rtl">{isRtl ? 'true' : 'false'}</span>
      <span data-testid="translated-title">{t('home.hero.title')}</span>
      <span data-testid="translated-fallback">{t('non.existent.key', 'Mon Fallback')}</span>
      <button onClick={() => setLanguage('ar')} data-testid="btn-set-ar">
        Set Arabic
      </button>
      <button onClick={() => setLanguage('en')} data-testid="btn-set-en">
        Set English
      </button>
      <button onClick={() => setLanguage('fr')} data-testid="btn-set-fr">
        Set French
      </button>
    </div>
  );
}

// Consumer rendered outside LanguageProvider
function BareConsumer() {
  const { language, direction, isRtl, t } = useLanguage();
  return (
    <div>
      <span data-testid="bare-lang">{language}</span>
      <span data-testid="bare-dir">{direction}</span>
      <span data-testid="bare-is-rtl">{isRtl ? 'true' : 'false'}</span>
      <span data-testid="bare-t">{t('nav.announcement.shipping')}</span>
      <span data-testid="bare-fallback">{t('missing.key', 'Def Value')}</span>
    </div>
  );
}

describe('Tier 1: I18n Core Infrastructure — Language Switching & State Management', () => {
  const resetEnvironment = () => {
    localStorage.clear();
    document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  };

  beforeEach(() => {
    resetEnvironment();
  });

  afterEach(() => {
    resetEnvironment();
  });

  it('initializes with default French language, ltr direction, and translates keys', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('current-lang')).toHaveTextContent('fr');
    expect(screen.getByTestId('current-dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('false');
    expect(screen.getByTestId('translated-title')).toHaveTextContent("L'Art du Costume & du Soulier Masculin");
    expect(screen.getByTestId('translated-fallback')).toHaveTextContent('Mon Fallback');
    expect(document.documentElement.lang).toBe('fr');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('switches to Arabic, updates document attributes to RTL, and persists to localStorage', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('btn-set-ar'));
    });

    expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
    expect(screen.getByTestId('current-dir')).toHaveTextContent('rtl');
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('true');
    expect(screen.getByTestId('translated-title')).toHaveTextContent('فن البدلات الرجالية والأحذية الفاخرة');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem('vip_tadj_lang')).toBe('ar');
  });

  it('switches to English, updates document attributes to LTR, and translates correctly', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('btn-set-en'));
    });

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('current-dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('is-rtl')).toHaveTextContent('false');
    expect(screen.getByTestId('translated-title')).toHaveTextContent('The Art of Men’s Suits & Fine Shoes');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(localStorage.getItem('vip_tadj_lang')).toBe('en');
  });

  it('provides safe default fallback when useLanguage() is called outside LanguageProvider', () => {
    render(<BareConsumer />);

    expect(screen.getByTestId('bare-lang')).toHaveTextContent('fr');
    expect(screen.getByTestId('bare-dir')).toHaveTextContent('ltr');
    expect(screen.getByTestId('bare-is-rtl')).toHaveTextContent('false');
    expect(screen.getByTestId('bare-t')).toHaveTextContent('Livraison 58 Wilayas');
    expect(screen.getByTestId('bare-fallback')).toHaveTextContent('Def Value');
  });

  it('renders LanguageSelector header variant and allows interactive switching', () => {
    render(
      <LanguageProvider>
        <LanguageSelector variant="header" />
        <TestConsumer />
      </LanguageProvider>
    );

    // Initial button displays FR code
    const button = screen.getByRole('button', { name: /sélectionner la langue/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('FR');

    // Open dropdown
    act(() => {
      fireEvent.click(button);
    });

    // Check menu options
    const arOption = screen.getByRole('option', { name: /العربية/i });
    expect(arOption).toBeInTheDocument();

    act(() => {
      fireEvent.click(arOption);
    });

    // Should switch to Arabic
    expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem('vip_tadj_lang')).toBe('ar');
  });

  it('renders LanguageSelector pills variant and switches language on pill click', () => {
    render(
      <LanguageProvider>
        <LanguageSelector variant="pills" />
        <TestConsumer />
      </LanguageProvider>
    );

    const enPill = screen.getByRole('button', { name: 'English' });
    expect(enPill).toBeInTheDocument();

    act(() => {
      fireEvent.click(enPill);
    });

    expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
    expect(screen.getByTestId('current-dir')).toHaveTextContent('ltr');
  });

  it('renders LanguageSelector minimal variant and switches language', () => {
    render(
      <LanguageProvider>
        <LanguageSelector variant="minimal" />
        <TestConsumer />
      </LanguageProvider>
    );

    const arBtn = screen.getByRole('button', { name: /العربية/i });
    expect(arBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(arBtn);
    });

    expect(screen.getByTestId('current-lang')).toHaveTextContent('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  describe('Defensive Prototype Chain Property Lookup Protection', () => {
    it('safely handles prototype property names in getTranslation returning fallback or key', () => {
      // toString, __proto__, valueOf, constructor must not resolve to Object.prototype methods
      expect(getTranslation('fr', 'toString', 'fallback')).toBe('fallback');
      expect(getTranslation('fr', '__proto__', 'fallback')).toBe('fallback');
      expect(getTranslation('fr', 'valueOf', 'fallback')).toBe('fallback');
      expect(getTranslation('fr', 'constructor', 'fallback')).toBe('fallback');
      expect(getTranslation('fr', 'hasOwnProperty', 'fallback')).toBe('fallback');

      expect(getTranslation('ar', 'toString', 'fallback')).toBe('fallback');
      expect(getTranslation('ar', '__proto__', 'fallback')).toBe('fallback');
      expect(getTranslation('en', 'valueOf', 'fallback')).toBe('fallback');

      // Without fallback, returns the key itself as a string
      expect(getTranslation('fr', 'toString')).toBe('toString');
      expect(getTranslation('fr', '__proto__')).toBe('__proto__');

      // Invalid or falsy keys
      expect(getTranslation('fr', '', 'fallback')).toBe('fallback');
      expect(getTranslation('fr', null as any, 'fallback')).toBe('fallback');
      expect(getTranslation('fr', undefined as any, 'fallback')).toBe('fallback');
    });

    it('safely handles prototype property names in formatTranslation without leakage', () => {
      expect(formatTranslation('Hello {toString}', {})).toBe('Hello {toString}');
      expect(formatTranslation('Hello {__proto__}', {})).toBe('Hello {__proto__}');
      expect(formatTranslation('Hello {valueOf}', {})).toBe('Hello {valueOf}');
      expect(formatTranslation('Hello {name}', { name: 'VIP' })).toBe('Hello VIP');
    });

    it('renders prototype keys in React components without fatal crash', () => {
      function PrototypeComponent() {
        const { t } = useLanguage();
        return (
          <div>
            <span data-testid="proto-to-string">{t('toString', 'safe-string')}</span>
            <span data-testid="proto-proto">{t('__proto__', 'safe-proto')}</span>
          </div>
        );
      }

      render(
        <LanguageProvider>
          <PrototypeComponent />
        </LanguageProvider>
      );

      expect(screen.getByTestId('proto-to-string')).toHaveTextContent('safe-string');
      expect(screen.getByTestId('proto-proto')).toHaveTextContent('safe-proto');
    });

    it('guarantees 100% dictionary key parity across French, English, and Arabic', () => {
      const frKeys = Object.keys(fr).sort();
      const enKeys = Object.keys(en).sort();
      const arKeys = Object.keys(ar).sort();

      expect(frKeys.length).toBe(enKeys.length);
      expect(frKeys.length).toBe(arKeys.length);

      expect(enKeys).toEqual(frKeys);
      expect(arKeys).toEqual(frKeys);

      // Verify no empty string values
      frKeys.forEach((key) => {
        expect(fr[key].trim().length).toBeGreaterThan(0);
        expect(en[key].trim().length).toBeGreaterThan(0);
        expect(ar[key].trim().length).toBeGreaterThan(0);
      });
    });
  });
});
