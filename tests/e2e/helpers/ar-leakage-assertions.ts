import React, { ReactElement } from 'react';
import { expect, vi } from 'vitest';
import { fr, en, ar } from '@/lib/i18n/locales';
import { StoreSettingsProvider } from '@/lib/context/store-settings-context';
import {
  renderWithProviders,
  RenderWithProvidersOptions,
  RenderWithProvidersResult,
} from '../../helpers/renderWithProviders';
import { setupMockFetch, MockFetchOverrides, createMockOrder } from './e2eTestUtils';
import { Order, Product } from '@/types';

/**
 * Exact 21+ untranslated French strings explicitly called out in ORIGINAL_REQUEST.md § Context.
 * Every single one of these MUST be absent in AR mode (normalized for curly/straight apostrophes).
 */
export const CONTEXT_UNTRANSLATED_STRINGS: readonly string[] = [
  'Carillon actif',
  'commande en attente de confirmation',
  'Retour aux commandes',
  'Imprimer',
  'Appeler',
  'Commande VT-2026-2993',
  'CONTRÔLEUR DE STATUT',
  'Commande clôturée (Livrée)',
  'Articles Commandés (1)',
  'TOTAL',
  'QTÉ',
  'PRIX UNITAIRE',
  'TAILLE',
  'ARTICLE',
  'DOSSIER CLIENT & LIVRAISON',
  'NUMÉRO PRINCIPAL',
  'ADRESSE DE LIVRAISON',
  'RÉCAPITULATIF FINANCIER COD',
  'Sous-total articles',
  'Frais de livraison',
  'Total à Encaisser (COD)',
  "Journal d'Audit & Historique des Statuts",
] as const;

/**
 * Expanded list of forbidden French UI phrases across Storefront & Admin Portal.
 */
export const FORBIDDEN_FRENCH_UI_PHRASES: readonly string[] = [
  // Context strings
  ...CONTEXT_UNTRANSLATED_STRINGS,
  'Commande clôturée',
  'Articles Commandés',
  "Journal d'Audit",
  'Historique des Statuts',
  'Son coupé',
  'Notifications sonores',
  'Activer le carillon',
  'Couper le son',
  // Storefront core
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
  "Calculée à l'étape suivante",
  'Vêtements',
  'Chaussures',
  'Accessoires',
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
  "Adresse d'expédition",
  'Wilaya de livraison',
  'Épuisé',
  'Nouveau',
  'Sélection VIP',
  'Aperçu Rapide',
  'Voir la Fiche Complète',
  'Paiement en espèces à la livraison',
  'Commande 100% Sécurisée',
  'Mode de livraison',
  'Point Relais',
  'Stop Desk',
  'À Domicile',
  'Tapez le code',
  'Aucune wilaya trouvée',
  'Rechercher des produits',
  'Chargement de la collection',
  // Storefront gaps (Home, PDP, Cart, Checkout, Fallback, Error, 404)
  'Art Bottier Européen',
  'Les Détails du Gentilhomme',
  "Nos Engagements d'Excellence",
  'Activer le son',
  'Lecture',
  'Pause',
  "Fil d'Ariane",
  'Commande Introuvable',
  'Une interruption est survenue',
  'Page Introuvable',
  'Explorer le Catalogue',
  'Explorer la Collection',
  "Retour à l'Accueil",
  'Réessayer',
  'Effacer la commune',
  'Finalisation de votre commande',
  'Génération de votre dossier',
  'Assistance Service Client',
  'Appeler le Concierge Client',
  'Confirmer sur WhatsApp',
  'Aucun Modèle Trouvé',
  'Réinitialiser les Filtres',
  // Admin Portal gaps
  'Command Center Commercial',
  'Pilotage en direct des ventes',
  'Portail Administratif',
  'Actualiser',
  'Nouveau Produit',
  'Vérification sécurisée',
  'Redirection vers le portail',
  'Se connecter',
  'Administrateur',
  'Fermer',
  'Utiliser le compte de démonstration',
  'Collection Automne-Hiver',
  "L'Art du Vêtement & du Soulier",
  '0 DA (Offerte)',
  'pièce(s) au total',
  'Remise commerciale',
  'Paiement en espèces à la livraison au livreur',
  'Statut de la commande',
  'Catalogue Produits',
  'Ajouter un Produit',
  'Enregistrer',
  'Annuler',
] as const;

/**
 * Forbidden English UI phrases that must not leak when AR is selected.
 */
export const FORBIDDEN_ENGLISH_UI_PHRASES: readonly string[] = [
  'Order Dossier',
  'Status Controller',
  'Items Ordered',
  'Unit Price',
  'Delivery Address',
  'Tracking',
  'Out of stock',
  'Sold Out',
  'Add to Cart',
  'Proceed to Checkout',
  'All Wilayas',
  'Reset filters',
  'View all',
  'Order Summary',
  'Dashboard',
  'Back to orders',
  'Sign in',
  'Subtotal',
  'Delivery Fee',
  'Breadcrumb',
  'Loading',
  'Free shipping',
  'Cash on Delivery',
] as const;

/**
 * French & English month/weekday names (full and French standard abbreviations)
 * that must not appear in AR date displays.
 */
export const FRENCH_ENGLISH_DATE_NAMES_REGEX =
  /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv|févr|avr|juil|sept|oct|nov|déc|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b\.?/i;

/**
 * Standalone Latin tokens legitimately allowed inside AR UI & dictionaries
 * (brand name, acronyms, size codes, media/shipping codes).
 */
export const AR_LATIN_WHITELIST: ReadonlySet<string> = new Set([
  'VIP',
  'TADJ',
  'COD',
  'AOV',
  'SKU',
  'RFID',
  'PVD',
  'WebM',
  'URL',
  'HTTP',
  'HTTPS',
  'Google',
  'Drive',
  'Cloudinary',
  'Unsplash',
  'ZR',
  'YAL',
  'EU',
  'UK',
  'US',
  'DZ',
  'XS',
  'SM',
  'MD',
  'LG',
  'XL',
  'XXL',
  'XXXL',
  'XX',
  'AR',
  'FR',
  'EN',
]);

/**
 * Genuine file format extensions and metric units allowed case-insensitively.
 * Uppercase acronyms/codes (EN, US, EU, AR, FR, SM, MD, LG, XS, XL) are NOT here
 * so lowercase "en", "us", "eu", "ar", "fr" are NEVER whitelisted.
 */
export const AR_FORMAT_UNIT_CASE_INSENSITIVE: ReadonlySet<string> = new Set([
  'mp4',
  'webm',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'cm',
]);

export const LANGUAGE_SWITCHER_LATIN_NAMES: ReadonlySet<string> = new Set([
  'Français',
  'English',
]);

export interface ArabicAntiLeakageOptions {
  /** Allow native language names ('Français', 'English') in LanguageSelector/Header/Sidebar/lang.* */
  allowLanguageNames?: boolean;
  /** Allow un-interpolated {var} template placeholders (true ONLY when auditing raw ar.ts dictionary templates; default false) */
  allowTemplatePlaceholders?: boolean;
  /** Additional exact tokens (e.g. mock order numbers, SKU fragments, courier names) */
  extraWhitelist?: string[];
  /** Specific phrases to ignore if test fixture intentionally supplies a custom value */
  exceptions?: string[];
  /** Check against fr.ts / en.ts dictionary keys (default: true) */
  checkDictionary?: boolean;
  /** Reject French/English month and weekday names (default: true) */
  checkDates?: boolean;
  /** Require Arabic currency "د.ج" and forbid "DA" / "DZD" (default: false) */
  requireCurrency?: boolean;
}

function normalizeTextForLeakage(raw: string): string {
  return raw
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripAllowedNonUiPatterns(text: string, allowTemplatePlaceholders = false): string {
  let result = text;
  if (allowTemplatePlaceholders) {
    // Template placeholders like {count}, {amount}, {days} (only stripped when auditing raw dictionary templates)
    result = result.replace(/\{[A-Za-z0-9_]+\}/g, ' ');
  }
  return (
    result
      // URLs & static asset paths (e.g. /videos/hero-loop.webm)
      .replace(/https?:\/\/[^\s"'<>]+/gi, ' ')
      .replace(/\/(?:videos|images)\/[A-Za-z0-9._/-]+/gi, ' ')
      // Emails (e.g. admin@viptadj.dz, contact@viptadj.dz)
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, ' ')
      // Order numbers, tracking IDs, product IDs, SKUs, error codes
      .replace(/\b(?:VT|VIP|YAL|ZR|ERR|ORD|PROD)-[A-Z0-9-]+\b/g, ' ')
      .replace(/\b(?:ord|prod|usr|cat|sub)-[a-z0-9-]+\b/g, ' ')
      // Phone numbers (+213..., 05 / 06 / 07 XX XX XX XX)
      .replace(/\+?213[\d\s()-]{6,}/g, ' ')
      .replace(/05\s*\/\s*06\s*\/\s*07[\sX\d]+/gi, ' ')
  );
}

/**
 * Extracts text content preserving spaces across adjacent DOM text nodes so
 * adjacent elements (e.g. <span>AR</span><span>VIP</span>) never fuse into "ARVIP".
 */
function extractSpacedVisibleText(container: HTMLElement): string {
  if (typeof document === 'undefined') {
    return container.textContent || '';
  }
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const parentTag = node.parentElement?.tagName;
    if (parentTag === 'SCRIPT' || parentTag === 'STYLE') continue;
    const val = node.nodeValue?.trim();
    if (val) parts.push(val);
  }
  return parts.join(' ');
}

/**
 * Checks a single string (such as an AR dictionary entry, localized catalog title,
 * or DOM attribute) for non-whitelisted Latin words, French accented letters, or
 * forbidden French/English UI phrases. Returns an array of violation descriptions.
 */
export function checkArabicStringAntiLeakage(
  value: string,
  options: ArabicAntiLeakageOptions = {}
): string[] {
  const violations: string[] = [];
  if (!value || !value.trim()) {
    return violations;
  }

  const normalized = normalizeTextForLeakage(value);
  const exceptions = new Set((options.exceptions || []).map(normalizeTextForLeakage));
  const extraSet = new Set(options.extraWhitelist || []);

  // 1. Check French/English date names
  if (options.checkDates !== false) {
    const dateMatch = normalized.match(FRENCH_ENGLISH_DATE_NAMES_REGEX);
    if (dateMatch && !exceptions.has(dateMatch[0])) {
      violations.push(`French/English date token "${dateMatch[0]}" found in "${normalized}"`);
    }
  }

  // 1b. Guard against un-interpolated {var} template placeholders in rendered DOM
  if (!options.allowTemplatePlaceholders) {
    const leakedPlaceholder = normalized.match(/\{[A-Za-z0-9_]+\}/);
    if (leakedPlaceholder && !exceptions.has(leakedPlaceholder[0])) {
      violations.push(
        `Un-interpolated template placeholder "${leakedPlaceholder[0]}" detected in "${normalized}"`
      );
    }
  }

  // 2. Strip allowed non-UI patterns (emails, URLs, order codes, phone patterns; {vars} only if allowTemplatePlaceholders)
  const stripped = stripAllowedNonUiPatterns(normalized, options.allowTemplatePlaceholders === true);

  // 3. Detect accented French characters (except 'Français' when allowLanguageNames is true)
  const withoutLangNames = options.allowLanguageNames
    ? stripped.replace(/\bFrançais\b/g, ' ').replace(/\bEnglish\b/g, ' ')
    : stripped;

  if (/[éèêëàâäîïôöùûüçÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ]/.test(withoutLangNames)) {
    violations.push(`French accented character detected in "${normalized}"`);
  }

  // 4. Scan all Latin words (>= 2 chars, including alphanumeric tokens like MP4) against the strict whitelist
  const latinTokens = (withoutLangNames.match(/[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ0-9]*/g) || []).filter(
    (t) => t.length >= 2
  );
  for (const token of latinTokens) {
    if (
      AR_LATIN_WHITELIST.has(token) ||
      AR_FORMAT_UNIT_CASE_INSENSITIVE.has(token.toLowerCase()) ||
      extraSet.has(token) ||
      exceptions.has(token) ||
      (options.allowLanguageNames && LANGUAGE_SWITCHER_LATIN_NAMES.has(token))
    ) {
      continue;
    }
    violations.push(`Non-whitelisted Latin token "${token}" detected in "${normalized}"`);
  }

  // 4b. Detect numeric + French/English time/length units (e.g., 24h, 48h, 2j, 3 hrs, 85 cm) or "(cm)"
  const unitLeak = withoutLangNames.match(
    /(?<!\p{L})\d+(?:[.,]\d+)?\s*(?:h|hr|hrs|j|cm)(?!\p{L})|\(\s*cm\s*\)/iu
  );
  if (unitLeak && !exceptions.has(unitLeak[0])) {
    violations.push(`Unlocalized French/English unit "${unitLeak[0]}" detected in "${normalized}"`);
  }

  return violations;
}

/**
 * Collects user-visible DOM attributes (placeholder, aria-label, title, alt, button value).
 */
export function collectVisibleAttributeStrings(container: HTMLElement): string[] {
  const attrs: string[] = [];
  const elements = container.querySelectorAll(
    '[placeholder], [aria-label], [title], img[alt], input[type="submit"], input[type="button"]'
  );

  elements.forEach((el) => {
    for (const attrName of ['placeholder', 'aria-label', 'title', 'alt']) {
      const val = el.getAttribute(attrName);
      if (val && val.trim()) {
        attrs.push(val);
      }
    }
    if (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'button') && el.value) {
      attrs.push(el.value);
    }
  });

  return attrs;
}

/**
 * Asserts zero French or English month/day names appear in rendered container (text + visible attributes).
 */
export function assertNoFrenchOrEnglishDates(container: HTMLElement): void {
  const text = normalizeTextForLeakage(extractSpacedVisibleText(container));
  const attrValues = collectVisibleAttributeStrings(container).map(normalizeTextForLeakage);
  const surfaces = [text, ...attrValues].filter(Boolean);

  for (const surface of surfaces) {
    const match = surface.match(FRENCH_ENGLISH_DATE_NAMES_REGEX);
    if (match) {
      throw new Error(
        `Forbidden French/English month or weekday name "${match[0]}" found in AR date output: "${surface.slice(0, 200)}"`
      );
    }
  }
}

/**
 * Strictly asserts Arabic currency formatting ("د.ج" with Western numerals)
 * and forbids French "DA" or English "DZD" currency labels across text and attributes.
 */
export function assertArabicCurrencyDisplayStrict(container: HTMLElement): void {
  const text = normalizeTextForLeakage(extractSpacedVisibleText(container));
  const attrValues = collectVisibleAttributeStrings(container).map(normalizeTextForLeakage);
  const surfaces = [text, ...attrValues].filter(Boolean);

  expect(
    text,
    'Expected Arabic currency suffix "د.ج" with Western numerals (0-9)'
  ).toMatch(/\d[\d\s]*د\.ج/);

  for (const surface of surfaces) {
    const currencyLeak = surface.match(/(?<!\p{L})(DA|DZD)(?!\p{L})/u);
    if (currencyLeak) {
      throw new Error(
        `Forbidden "${currencyLeak[1]}" currency label found in AR view: "${surface.slice(0, 200)}"`
      );
    }
  }
}

/**
 * Comprehensive, zero-fallback Arabic anti-leakage assertion for rendered DOM containers.
 * Inspects both textContent AND user-visible attributes (placeholder, aria-label, title, alt).
 */
export function assertZeroFrenchOrEnglishLeakage(
  container: HTMLElement,
  options: ArabicAntiLeakageOptions = {}
): void {
  const rawText = extractSpacedVisibleText(container);
  const text = normalizeTextForLeakage(rawText);
  const attrValues = collectVisibleAttributeStrings(container).map(normalizeTextForLeakage);
  const combinedInspectables = [text, ...attrValues].filter(Boolean);
  const strippedInspectables = combinedInspectables
    .map((s) => normalizeTextForLeakage(stripAllowedNonUiPatterns(s, options.allowTemplatePlaceholders === true)))
    .filter(Boolean);
  const exceptions = new Set((options.exceptions || []).map(normalizeTextForLeakage));
  const exceptionsLower = new Set(Array.from(exceptions).map((e) => e.toLowerCase()));

  // 1. Arabic Unicode script MUST be present
  expect(
    text,
    'Expected Arabic Unicode script ([\\u0600-\\u06FF]) in AR rendered DOM'
  ).toMatch(/[\u0600-\u06FF]+/);

  // 2. Check forbidden French UI phrases (including all ORIGINAL_REQUEST Context strings)
  for (const phrase of FORBIDDEN_FRENCH_UI_PHRASES) {
    const normPhrase = normalizeTextForLeakage(phrase);
    if (exceptions.has(normPhrase)) continue;

    const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
    for (const surface of combinedInspectables) {
      if (regex.test(surface)) {
        throw new Error(
          `Forbidden French UI phrase "${phrase}" detected in AR DOM: "${surface.slice(0, 220)}"`
        );
      }
    }
  }

  // 3. Check forbidden English UI phrases (word-boundary matched)
  for (const phrase of FORBIDDEN_ENGLISH_UI_PHRASES) {
    const normPhrase = normalizeTextForLeakage(phrase);
    if (exceptions.has(normPhrase)) continue;
    const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    for (const surface of combinedInspectables) {
      if (regex.test(surface)) {
        throw new Error(
          `Forbidden English UI phrase "${phrase}" detected in AR DOM: "${surface.slice(0, 220)}"`
        );
      }
    }
  }

  // 4. Check short standalone French/English tokens case-insensitively (across stripped inspectables)
  for (const surface of strippedInspectables) {
    const shortLeak = surface.match(/\b(ou|Menu|Voir|Tout|Tri|Nom|Qté|ID)\b(?:\s*:)?/i);
    if (shortLeak && !exceptionsLower.has(shortLeak[0].toLowerCase())) {
      throw new Error(
        `Short French/English UI token "${shortLeak[0]}" leaked in AR DOM: "${surface.slice(0, 220)}"`
      );
    }
  }

  // 5. Check dates
  if (options.checkDates !== false) {
    for (const surface of combinedInspectables) {
      const dateMatch = surface.match(FRENCH_ENGLISH_DATE_NAMES_REGEX);
      if (dateMatch && !exceptions.has(dateMatch[0])) {
        throw new Error(
          `Forbidden French/English month/weekday name "${dateMatch[0]}" detected in AR DOM: "${surface.slice(0, 220)}"`
        );
      }
    }
  }

  // 6. Strict non-whitelisted Latin token, {var} placeholder & accented French character scan
  for (const surface of combinedInspectables) {
    const tokenViolations = checkArabicStringAntiLeakage(surface, options);
    if (tokenViolations.length > 0) {
      throw new Error(
        `Arabic anti-leakage violation(s): ${tokenViolations.slice(0, 3).join(' | ')}`
      );
    }
  }

  // 7. Cross-check against fr.ts and en.ts dictionary strings across BOTH text and attributes, case-insensitively
  if (options.checkDictionary !== false) {
    for (const [key, frVal] of Object.entries(fr)) {
      const arVal = ar[key];
      const normFr = normalizeTextForLeakage(frVal);
      if (
        !normFr ||
        !arVal ||
        normFr === normalizeTextForLeakage(arVal) ||
        normFr.length < 4 ||
        /^\d+$/.test(normFr) ||
        normFr === 'VIP TADJ' ||
        normFr.includes('{') ||
        (options.allowLanguageNames && normFr === 'Français') ||
        exceptionsLower.has(normFr.toLowerCase())
      ) {
        continue;
      }
      const normFrLower = normFr.toLowerCase();
      if (normFr.length <= 5) {
        const escaped = normFr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
        if (strippedInspectables.some((surface) => re.test(surface))) {
          throw new Error(
            `Untranslated French dictionary string (${key}="${frVal}") found in AR DOM`
          );
        }
      } else if (strippedInspectables.some((surface) => surface.toLowerCase().includes(normFrLower))) {
        throw new Error(
          `Untranslated French dictionary string (${key}="${frVal}") found in AR DOM`
        );
      }
    }

    for (const [key, enVal] of Object.entries(en)) {
      const arVal = ar[key];
      const normEn = normalizeTextForLeakage(enVal);
      if (
        !normEn ||
        !arVal ||
        normEn === normalizeTextForLeakage(arVal) ||
        normEn.length < 4 ||
        /^\d+$/.test(normEn) ||
        normEn === 'VIP TADJ' ||
        normEn.includes('{') ||
        (options.allowLanguageNames && normEn === 'English') ||
        exceptionsLower.has(normEn.toLowerCase())
      ) {
        continue;
      }
      const normEnLower = normEn.toLowerCase();
      if (normEn.length <= 5) {
        const escaped = normEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(?<!\\p{L})${escaped}(?!\\p{L})`, 'iu');
        if (strippedInspectables.some((surface) => re.test(surface))) {
          throw new Error(
            `Untranslated English dictionary string (${key}="${enVal}") found in AR DOM`
          );
        }
      } else if (strippedInspectables.some((surface) => surface.toLowerCase().includes(normEnLower))) {
        throw new Error(
          `Untranslated English dictionary string (${key}="${enVal}") found in AR DOM`
        );
      }
    }
  }

  // 8. Optional strict currency check
  if (options.requireCurrency) {
    assertArabicCurrencyDisplayStrict(container);
  }
}

export interface ExtendedMockFetchOptions extends MockFetchOverrides {
  orderById?: Record<string, Order | null>;
  productsList?: Product[];
  statusUpdateResult?: { ok: boolean; status?: number; body?: unknown };
  settingsSaveResult?: { ok: boolean; status?: number; body?: unknown };
  mediaUploadResult?: { ok: boolean; status?: number; body?: unknown };
}

/**
 * Extended fetch mock supporting all Storefront & Admin API endpoints:
 * - GET/PUT /api/settings
 * - GET/POST /api/orders
 * - GET /api/orders/:id
 * - PATCH /api/orders/:id/status
 * - GET/POST /api/products & PUT/PATCH/DELETE /api/products/:id
 * - POST /api/media/upload
 */
export function setupExtendedE2EFetch(options: ExtendedMockFetchOptions = {}): ReturnType<typeof vi.fn> {
  const baseFetch = setupMockFetch(options);

  const extendedMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

    if (url.includes('/api/settings') && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
      if (options.settingsSaveResult) {
        return Promise.resolve({
          ok: options.settingsSaveResult.ok,
          status: options.settingsSaveResult.status || (options.settingsSaveResult.ok ? 200 : 400),
          json: () => Promise.resolve(options.settingsSaveResult!.body),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, settings: options.settings?.settings || {} }),
      } as Response);
    }

    if (/\/api\/orders\/[^/]+\/status/.test(url) && method === 'PATCH') {
      if (options.statusUpdateResult) {
        return Promise.resolve({
          ok: options.statusUpdateResult.ok,
          status: options.statusUpdateResult.status || (options.statusUpdateResult.ok ? 200 : 400),
          json: () => Promise.resolve(options.statusUpdateResult!.body),
        } as Response);
      }
      let body: Record<string, unknown> = {};
      try {
        if (typeof init?.body === 'string') body = JSON.parse(init.body);
      } catch {
        // ignore
      }
      const orderMatch = url.match(/\/api\/orders\/([^/]+)\/status/);
      const orderId = orderMatch ? decodeURIComponent(orderMatch[1]) : 'ord-mock';
      const existing = options.orderById?.[orderId] || createMockOrder({ id: orderId });
      const updatedOrder: Order = {
        ...existing,
        status: (body.status as Order['status']) || existing.status,
        updatedAt: new Date().toISOString(),
        statusHistory: [
          ...(existing.statusHistory || []),
          {
            status: (body.status as Order['status']) || existing.status,
            timestamp: new Date().toISOString(),
            note: typeof body.note === 'string' ? body.note : undefined,
            cancellationReason: body.cancellationReason as Order['statusHistory'][number]['cancellationReason'],
            trackingCode: typeof body.trackingCode === 'string' ? body.trackingCode : undefined,
            courier: typeof body.courier === 'string' ? body.courier : undefined,
            updatedBy: 'direction@viptadj.dz',
          },
        ],
      };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, order: updatedOrder }),
      } as Response);
    }

    const singleOrderMatch = url.match(/\/api\/orders\/([^/?]+)(?:\?.*)?$/);
    if (singleOrderMatch && method === 'GET') {
      const orderId = decodeURIComponent(singleOrderMatch[1]);
      if (options.orderById && orderId in options.orderById) {
        const found = options.orderById[orderId];
        if (!found) {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ success: false, error: 'Order not found', errorCode: 'ORDER_NOT_FOUND' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, order: found }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ success: false, error: 'Order not found', errorCode: 'ORDER_NOT_FOUND' }),
      } as Response);
    }

    if (url.includes('/api/products')) {
      if (method === 'GET') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true, products: options.productsList || [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: method === 'POST' ? 201 : 200,
        json: () => Promise.resolve({ success: true, product: options.productsList?.[0] || null }),
      } as Response);
    }

    if (url.includes('/api/media/upload')) {
      if (options.mediaUploadResult) {
        return Promise.resolve({
          ok: options.mediaUploadResult.ok,
          status: options.mediaUploadResult.status || 200,
          json: () => Promise.resolve(options.mediaUploadResult!.body),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            success: true,
            image: {
              id: 'img-uploaded-1',
              url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
              alt: 'VIP TADJ',
              isPrimary: false,
            },
          }),
      } as Response);
    }

    return baseFetch(input, init);
  });

  global.fetch = extendedMock;
  return extendedMock;
}

/**
 * Renders storefront UI wrapped in LanguageProvider, CartProvider, AND StoreSettingsProvider.
 */
export function renderStorefrontWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderWithProvidersResult {
  return renderWithProviders(
    React.createElement(StoreSettingsProvider, null, ui),
    options
  );
}
