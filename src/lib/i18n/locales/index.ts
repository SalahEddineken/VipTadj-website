import { SupportedLanguage } from '../types';
import { fr } from './fr';
import { en } from './en';
import { ar } from './ar';

export const dictionaries: Record<SupportedLanguage, Record<string, string>> = {
  fr,
  en,
  ar,
};

export function getTranslation(
  lang: SupportedLanguage,
  key: string,
  fallback?: string
): string {
  if (!key || typeof key !== 'string') {
    return fallback !== undefined ? fallback : '';
  }

  const dict = dictionaries[lang] || dictionaries.fr;
  if (dict && Object.prototype.hasOwnProperty.call(dict, key)) {
    return dict[key];
  }

  // Fallback to French if missing in target language
  if (dictionaries.fr && Object.prototype.hasOwnProperty.call(dictionaries.fr, key)) {
    return dictionaries.fr[key];
  }

  return fallback !== undefined ? fallback : key;
}

export function formatTranslation(
  template: string,
  variables: Record<string, string | number> = {}
): string {
  return template.replace(/\{(\w+)\}/g, (_, varName) => {
    return variables && Object.prototype.hasOwnProperty.call(variables, varName)
      ? String(variables[varName])
      : `{${varName}}`;
  });
}

export { fr, en, ar };
