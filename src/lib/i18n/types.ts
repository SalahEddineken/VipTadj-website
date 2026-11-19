import type { fr } from './locales/fr';

export type SupportedLanguage = 'fr' | 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';
export type TranslationKey = keyof typeof fr;

export interface LanguageContextType {
  language: SupportedLanguage;
  direction: Direction;
  isRtl: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  dir: Direction;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'fr',
    name: 'Français',
    nativeName: 'Français',
    dir: 'ltr',
    flag: '🇫🇷',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr',
    flag: '🇬🇧',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    dir: 'rtl',
    flag: '🇩🇿',
  },
];
