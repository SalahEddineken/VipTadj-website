import { expect } from 'vitest';
import { fr, ar, en } from '@/lib/i18n/locales';

/**
 * Forbidden French UI keywords that must NEVER appear when Arabic or English is selected.
 */
export const FORBIDDEN_FRENCH_UI_KEYWORDS: readonly string[] = [
  'Panier',
  'Mon Panier',
  'Accueil',
  'Filtres',
  'Créations',
  'Création',
  'Sous-total',
  'Récapitulatif',
  'Livraison estimée',
  'Livraison gratuite',
  'Livraison offerte',
  'Calculée à l\'étape suivante',
  'Vêtements',
  'Chaussures',
  'Accessoires',
  'Taille',
  'Tailles disponibles',
  'Couleur',
  'Coloris',
  'Supprimer',
  'Vider le panier',
  'Continuer mes achats',
  'Procéder au paiement',
  'Commander directement',
  'Ajouter au panier',
  'Destinataire',
  'Nom et Prénom',
  'Téléphone mobile',
  'Adresse de livraison',
  'Adresse d\'expédition',
  'Wilaya de livraison',
  'Épuisé',
  'Nouveau',
  'Sélection VIP',
  'Aperçu Rapide',
  'Voir la Fiche Complète',
  'Paiement en espèces à la livraison',
  'Commande 100% Sécurisée',
  'Articles commandés',
  'Mode de livraison',
  'Point Relais',
  'Stop Desk',
  'À Domicile',
  'Tapez le code',
  'Aucune wilaya trouvée',
  'Rechercher des produits',
  'Chargement de la collection',
  'Command Center Commercial',
  'Pilotage en direct des ventes',
  'Portail Administratif',
  'Actualiser',
  'Nouveau Produit',
] as const;

export interface ZeroFrenchLeakageOptions {
  exceptions?: string[];
  checkDictionary?: boolean;
}

/**
 * Asserts that the rendered container contains zero French fallback strings.
 */
export function assertZeroFrenchLeakage(
  container: HTMLElement,
  targetLang: 'ar' | 'en' = 'ar',
  options: ZeroFrenchLeakageOptions = {}
): void {
  const text = container.textContent || '';
  const exceptions = options.exceptions || [];

  // 1. Check against known hardcoded French UI keywords
  for (const keyword of FORBIDDEN_FRENCH_UI_KEYWORDS) {
    if (exceptions.includes(keyword)) {
      continue;
    }
    // Match whole word or phrase boundary
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|["'([{>])${escaped}($|\\s|["')\\]}<,.!?:;])`, 'i');
    if (regex.test(text)) {
      throw new Error(
        `Forbidden French UI keyword "${keyword}" detected in rendered ${targetLang.toUpperCase()} DOM content!`
      );
    }
  }

  // 2. Check against dictionary strings from fr.ts where ar/en has a distinct translation
  if (options.checkDictionary !== false) {
    const targetDict = targetLang === 'ar' ? ar : en;
    const differingFrEntries = Object.entries(fr).filter(([key, frVal]) => {
      const targetVal = targetDict[key as keyof typeof targetDict];
      return (
        frVal &&
        targetVal &&
        frVal !== targetVal &&
        frVal.trim().length > 4 &&
        !/^\d+$/.test(frVal) &&
        !['VIP TADJ', 'COD', 'DZ', 'DZD', 'Super 130s', '130s'].some((brand) => frVal.includes(brand)) &&
        !exceptions.includes(frVal)
      );
    });

    for (const [key, frVal] of differingFrEntries) {
      if (text.includes(frVal)) {
        throw new Error(
          `Untranslated French dictionary string detected in ${targetLang.toUpperCase()} view! Key: "${key}", Value: "${frVal}"`
        );
      }
    }
  }

  // 3. If target is Arabic, assert presence of Arabic unicode glyphs
  if (targetLang === 'ar') {
    expect(
      text,
      'Expected Arabic text content (Unicode [\\u0600-\\u06FF]) to be present in Arabic view'
    ).toMatch(/[\u0600-\u06FF]+/);
  }
}

/**
 * Asserts document root attributes and typography alignment for Arabic RTL.
 */
export function assertArabicRTLDocument(): void {
  expect(document.documentElement.getAttribute('dir')).toBe('rtl');
  expect(document.documentElement.getAttribute('lang')).toBe('ar');
  expect(document.documentElement.classList.contains('rtl')).toBe(true);
}

/**
 * Asserts document root attributes for any given language and direction.
 */
export function assertDocumentDirection(
  expectedDir: 'rtl' | 'ltr',
  expectedLang: 'ar' | 'fr' | 'en'
): void {
  expect(document.documentElement.getAttribute('dir')).toBe(expectedDir);
  expect(document.documentElement.getAttribute('lang')).toBe(expectedLang);
  if (expectedDir === 'rtl') {
    expect(document.documentElement.classList.contains('rtl')).toBe(true);
  }
}

/**
 * Asserts that currency amounts in Arabic format strictly end with "د.ج" and use 0-9 numerals.
 */
export function assertArabicCurrencyDisplay(container: HTMLElement): void {
  const text = container.textContent || '';
  // Must match Western digits followed by د.ج
  expect(text, 'Expected formatted currency with "د.ج" suffix and Western numerals').toMatch(
    /\d+[\s\u00A0]*د\.ج/
  );
  // Must NOT contain French "DA" or English "DZD" in currency pattern
  expect(text, 'Forbidden French "DA" currency suffix in Arabic view').not.toMatch(/\b\d+[\s\u00A0]*DA\b/);
  expect(text, 'Forbidden English "DZD" currency suffix in Arabic view').not.toMatch(/\b\d+[\s\u00A0]*DZD\b/);
}

/**
 * Asserts that an input element or link is properly isolated with LTR styling in an RTL document.
 */
export function assertLtrPhoneIsolation(element: HTMLElement): void {
  const dir = element.getAttribute('dir');
  const className = element.className || '';
  const hasLtrDir = dir === 'ltr';
  const hasLtrProtectClass = className.includes('ltr-protect');

  expect(
    hasLtrDir || hasLtrProtectClass,
    `Element should have dir="ltr" or "ltr-protect" class for phone/numeric isolation, but received dir="${dir}", class="${className}"`
  ).toBe(true);
}
