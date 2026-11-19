import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fr, en, ar, getTranslation, formatTranslation } from '@/lib/i18n/locales';
import {
  CATEGORY_TRANSLATIONS,
  PRODUCT_TRANSLATIONS,
  SUBCATEGORY_TRANSLATIONS,
  COLOR_TRANSLATIONS,
  getLocalizedProduct,
  getLocalizedCategoryName,
  getLocalizedCategory,
  getLocalizedSubcategory,
  getLocalizedColor,
  getLocalizedSize,
} from '@/lib/i18n/catalog-translations';
import * as colorUtils from '@/lib/utils/colorUtils';
import {
  SUBCATEGORIES_BY_CATEGORY,
  filterProducts,
  DEFAULT_FILTER_STATE,
} from '@/lib/utils/catalogUtils';
import {
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_WILAYAS_DELIVERY,
} from '@/lib/seed/seed-data';
import * as wilayasModule from '@/lib/data/wilayas';
import {
  ALGERIAN_68_WILAYAS,
  ALGERIAN_COMMUNES,
  getWilayaByCode,
  getCommunesByWilaya,
  searchWilayas,
  searchCommunes,
} from '@/lib/data/wilayas';
import { formatDZD } from '@/lib/utils/formatDZD';
import { Product, ProductCategoryType } from '@/types';
import {
  checkArabicStringAntiLeakage,
  FRENCH_ENGLISH_DATE_NAMES_REGEX,
} from './helpers/ar-leakage-assertions';

const SRC_ROOT = path.resolve(process.cwd(), 'src');

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function stripCommentsForScan(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[ \t])\/\/[^\n]*/gm, '$1 ');
}

function extractStaticTranslationKeysFromSrc(): Map<string, string[]> {
  const files = collectSourceFiles(SRC_ROOT);
  const keyLocations = new Map<string, string[]>();
  const tCallRegex = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g;
  const getTransRegex = /\bgetTranslation\(\s*[^,]+,\s*['"]([a-zA-Z0-9_.-]+)['"]/g;

  for (const file of files) {
    const rawContent = fs.readFileSync(file, 'utf-8');
    const content = stripCommentsForScan(rawContent);
    const rel = path.relative(process.cwd(), file);
    for (const regex of [tCallRegex, getTransRegex]) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const key = match[1];
        if (key.endsWith('.')) continue;
        const list = keyLocations.get(key) || [];
        list.push(rel);
        keyLocations.set(key, list);
      }
    }
  }
  return keyLocations;
}

function getAllBaseColors(): Array<{ hex: string; name: string }> {
  const exported = (colorUtils as Record<string, unknown>).COLOR_PALETTE_BASE;
  if (Array.isArray(exported) && exported.length > 0) {
    return exported as Array<{ hex: string; name: string }>;
  }

  // Fallback parse from source if COLOR_PALETTE_BASE is not yet exported
  const colorFile = fs.readFileSync(
    path.join(SRC_ROOT, 'lib/utils/colorUtils.ts'),
    'utf-8'
  );
  const blockMatch = colorFile.match(/const COLOR_PALETTE_BASE[^=]*=\s*\[([\s\S]*?)\];/);
  const block = blockMatch ? blockMatch[1] : colorFile;
  const entryRegex = /\{\s*hex:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*\}/g;
  const parsed: Array<{ hex: string; name: string }> = [];
  let match: RegExpExecArray | null;
  while ((match = entryRegex.exec(block)) !== null) {
    parsed.push({ hex: match[1], name: match[2] });
  }
  return parsed;
}

function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{([A-Za-z0-9_]+)\}/g) || [];
  return [...new Set(matches)].sort();
}

describe('E2E 06 — Algerian Arabic (ar) Dictionary, Catalog & Location Parity', () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE — Locale Dictionary Parity & Static t() Scan
  // =========================================================================
  describe('Tier 1A: Locale Dictionary Parity (fr / en / ar) & Static t() Keys', () => {
    it('maintains 100% key parity and zero empty values across fr, en, and ar', () => {
      const frKeys = Object.keys(fr).sort();
      const enKeys = Object.keys(en).sort();
      const arKeys = Object.keys(ar).sort();

      expect(frKeys.length).toBeGreaterThan(600);
      expect(enKeys).toEqual(frKeys);
      expect(arKeys).toEqual(frKeys);

      const emptyValues: string[] = [];
      for (const key of frKeys) {
        if (!fr[key] || !fr[key].trim()) emptyValues.push(`fr.${key}`);
        if (!en[key] || !en[key].trim()) emptyValues.push(`en.${key}`);
        if (!ar[key] || !ar[key].trim()) emptyValues.push(`ar.${key}`);
      }
      expect(emptyValues, `Empty dictionary values found: ${emptyValues.join(', ')}`).toEqual([]);
    });

    it('preserves identical {var} placeholder variables across fr, en, and ar for every key', () => {
      const mismatched: string[] = [];
      for (const key of Object.keys(fr)) {
        const frVars = extractPlaceholders(fr[key]);
        const enVars = extractPlaceholders(en[key] || '');
        const arVars = extractPlaceholders(ar[key] || '');

        if (JSON.stringify(frVars) !== JSON.stringify(enVars)) {
          mismatched.push(`${key} (en=${enVars.join(',')} vs fr=${frVars.join(',')})`);
        }
        if (JSON.stringify(frVars) !== JSON.stringify(arVars)) {
          mismatched.push(`${key} (ar=${arVars.join(',')} vs fr=${frVars.join(',')})`);
        }
      }
      expect(
        mismatched,
        `Placeholder variable mismatches across locales:\n${mismatched.join('\n')}`
      ).toEqual([]);
    });

    it('has zero non-whitelisted Latin/French words or accented letters in any ar dictionary entry', () => {
      const violations: string[] = [];
      for (const [key, val] of Object.entries(ar)) {
        const isLanguageSwitcherName = key === 'lang.fr' || key === 'lang.en';
        const issues = checkArabicStringAntiLeakage(val, {
          allowLanguageNames: isLanguageSwitcherName,
          allowTemplatePlaceholders: true,
          checkDates: true,
        });
        if (issues.length > 0) {
          violations.push(`${key}: ${issues.join('; ')}`);
        }
      }
      expect(
        violations,
        `Latin/French leakage in ar.ts:\n${violations.join('\n')}`
      ).toEqual([]);
    });

    it('resolves getTranslation("ar", key) cleanly for every key in fr without falling back to French', () => {
      const formatUniversalKeys = new Set([
        'common.brand',
        'footer.brand',
        'admin.login.email_ph',
        'announcement.phone',
        'checkout.field.phone_ph',
        'home.story.stat1.val',
        'home.story.stat2.val',
        'lang.ar',
        'lang.en',
        'lang.fr',
      ]);
      const leaked: string[] = [];

      for (const key of Object.keys(fr)) {
        const resolved = getTranslation('ar', key);
        expect(resolved.trim().length).toBeGreaterThan(0);

        if (formatUniversalKeys.has(key) || fr[key] === 'VIP TADJ' || /^[\d\s+%./()-]+$/.test(resolved)) {
          continue;
        }
        if (resolved === fr[key]) {
          leaked.push(`${key}="${resolved}"`);
        }
        if (!/[\u0600-\u06FF]/.test(resolved)) {
          leaked.push(`${key} missing Arabic script: "${resolved}"`);
        }
      }

      expect(leaked, `Keys falling back to French or lacking Arabic script:\n${leaked.join('\n')}`).toEqual([]);
    });

    it('ensures 100% of static t("key") calls across src/ exist in fr, en, and ar', () => {
      const discovered = extractStaticTranslationKeysFromSrc();
      expect(discovered.size).toBeGreaterThan(450);

      const missing: string[] = [];
      for (const [key, files] of discovered.entries()) {
        if (!(key in fr) || !(key in en) || !(key in ar)) {
          missing.push(
            `${key} (missing in: ${[
              !(key in fr) ? 'fr' : '',
              !(key in en) ? 'en' : '',
              !(key in ar) ? 'ar' : '',
            ]
              .filter(Boolean)
              .join(',')}; used in ${files[0]})`
          );
        }
      }

      expect(
        missing,
        `Missing static translation keys used in src/:\n${missing.join('\n')}`
      ).toEqual([]);
    });

    it('maintains consistent 68-wilaya counts across locales without stale 58-wilaya references', () => {
      expect(ar['pdp.trust.delivery']).toContain('68');
      expect(fr['pdp.trust.delivery']).toContain('68');
      expect(en['pdp.trust.delivery']).toContain('68');
      expect(ar['pdp.trust.delivery']).not.toContain('58');
      expect(en['pdp.trust.delivery']).not.toContain('58');
    });
  });

  // =========================================================================
  // TIER 1B: Built-in Catalog, Color, Subcategory, Category & Location Parity
  // =========================================================================
  describe('Tier 1B: Built-in Catalog, Colors (115), Subcategories (20), Wilayas (68), Communes (1534)', () => {
    it('translates 100% of COLOR_PALETTE_BASE (all 115 colors) into Arabic with zero leakage', () => {
      const palette = getAllBaseColors();
      expect(palette).toHaveLength(115);

      const missingOrLeaked: string[] = [];
      for (const { hex, name } of palette) {
        const resolvedName = colorUtils.getColorNameFromHex(hex);
        expect(resolvedName).toBe(name);

        const arColor = getLocalizedColor(name, 'ar');
        if (!arColor || arColor === name || !/[\u0600-\u06FF]/.test(arColor)) {
          missingOrLeaked.push(`${name} (${hex}) -> "${arColor}"`);
          continue;
        }
        const issues = checkArabicStringAntiLeakage(arColor);
        if (issues.length > 0) {
          missingOrLeaked.push(`${name} -> ${issues.join('; ')}`);
        }
      }

      expect(
        missingOrLeaked,
        `Untranslated or leaked colors (${missingOrLeaked.length}/115):\n${missingOrLeaked.slice(0, 20).join('\n')}`
      ).toEqual([]);
    });

    it('translates 100% of SEED_PRODUCTS (30 products) into Arabic with zero French/English leakage', () => {
      expect(SEED_PRODUCTS).toHaveLength(30);
      expect(Object.keys(PRODUCT_TRANSLATIONS).length).toBeGreaterThanOrEqual(30);

      const failures: string[] = [];
      for (const product of SEED_PRODUCTS) {
        const localized = getLocalizedProduct(product, 'ar');
        if (!localized.title || localized.title === product.title || !/[\u0600-\u06FF]/.test(localized.title)) {
          failures.push(`${product.id}: title not localized ("${localized.title}")`);
        }
        if (
          !localized.description ||
          localized.description === product.description ||
          !/[\u0600-\u06FF]/.test(localized.description)
        ) {
          failures.push(`${product.id}: description not localized`);
        }
        const titleIssues = checkArabicStringAntiLeakage(localized.title);
        const descIssues = checkArabicStringAntiLeakage(localized.description);
        if (titleIssues.length > 0) failures.push(`${product.id} title: ${titleIssues.join('; ')}`);
        if (descIssues.length > 0) failures.push(`${product.id} desc: ${descIssues.join('; ')}`);
      }

      expect(failures, `Product Arabic localization failures:\n${failures.join('\n')}`).toEqual([]);
    });

    it('translates all 20 canonical subcategories across SUBCATEGORY_TRANSLATIONS and locales.*.subcategory.*', () => {
      const canonicalIds = new Set<string>([
        ...Object.values(SUBCATEGORIES_BY_CATEGORY).flatMap((list) => list.map((s) => s.id)),
        'costumes',
      ]);
      expect(canonicalIds.size).toBeGreaterThanOrEqual(20);

      const failures: string[] = [];
      for (const subId of canonicalIds) {
        const arSub = getLocalizedSubcategory(subId, 'ar');
        if (!arSub || arSub === subId || !/[\u0600-\u06FF]/.test(arSub)) {
          failures.push(`SUBCATEGORY_TRANSLATIONS missing/untranslated for "${subId}": "${arSub}"`);
        } else {
          const issues = checkArabicStringAntiLeakage(arSub);
          if (issues.length > 0) failures.push(`sub ${subId}: ${issues.join('; ')}`);
        }

        const localeKey = `subcategory.${subId}`;
        if (!(localeKey in fr) || !(localeKey in en) || !(localeKey in ar)) {
          failures.push(`Missing locale key "${localeKey}" in fr/en/ar`);
        } else {
          const localeIssues = checkArabicStringAntiLeakage(ar[localeKey]);
          if (localeIssues.length > 0 || !/[\u0600-\u06FF]/.test(ar[localeKey])) {
            failures.push(`Invalid ar["${localeKey}"]: "${ar[localeKey]}"`);
          }
        }
      }

      // Also verify every entry in SUBCATEGORY_TRANSLATIONS is clean in AR
      for (const [id, entry] of Object.entries(SUBCATEGORY_TRANSLATIONS)) {
        if (!entry.ar || !/[\u0600-\u06FF]/.test(entry.ar)) {
          failures.push(`SUBCATEGORY_TRANSLATIONS[${id}].ar invalid`);
        } else {
          const entryIssues = checkArabicStringAntiLeakage(entry.ar);
          if (entryIssues.length > 0) {
            failures.push(`SUBCATEGORY_TRANSLATIONS[${id}].ar: ${entryIssues.join('; ')}`);
          }
        }
      }

      expect(failures, `Subcategory parity failures:\n${failures.join('\n')}`).toEqual([]);
    });

    it('provides complete Arabic localization on SEED_CATEGORIES (nameAr/descriptionAr) and CATEGORY_TRANSLATIONS', () => {
      expect(SEED_CATEGORIES).toHaveLength(3);
      const failures: string[] = [];

      for (const cat of SEED_CATEGORIES) {
        const catRecord = cat as unknown as Record<string, unknown>;
        const nameAr = typeof catRecord.nameAr === 'string' ? catRecord.nameAr : '';
        const descAr = typeof catRecord.descriptionAr === 'string' ? catRecord.descriptionAr : '';

        if (!nameAr || !/[\u0600-\u06FF]/.test(nameAr)) {
          failures.push(`SEED_CATEGORIES["${cat.id}"] missing Arabic nameAr`);
        } else {
          const issues = checkArabicStringAntiLeakage(nameAr);
          if (issues.length > 0) failures.push(`SEED_CATEGORIES["${cat.id}"].nameAr: ${issues.join('; ')}`);
        }

        if (!descAr || !/[\u0600-\u06FF]/.test(descAr)) {
          failures.push(`SEED_CATEGORIES["${cat.id}"] missing Arabic descriptionAr`);
        } else {
          const issues = checkArabicStringAntiLeakage(descAr);
          if (issues.length > 0) failures.push(`SEED_CATEGORIES["${cat.id}"].descriptionAr: ${issues.join('; ')}`);
        }

        const catTrans = getLocalizedCategory(cat.id, 'ar');
        if (!catTrans || !/[\u0600-\u06FF]/.test(catTrans.name) || !/[\u0600-\u06FF]/.test(catTrans.description)) {
          failures.push(`CATEGORY_TRANSLATIONS["${cat.id}"].ar incomplete`);
        }
      }

      expect(failures, `Category Arabic parity failures:\n${failures.join('\n')}`).toEqual([]);
    });

    it('has valid Arabic names for all 68 Wilayas, 68 delivery entries, and 1,534 Communes', () => {
      expect(ALGERIAN_68_WILAYAS).toHaveLength(68);
      expect(SEED_WILAYAS_DELIVERY).toHaveLength(68);
      expect(ALGERIAN_COMMUNES).toHaveLength(1534);

      const wilayaIssues: string[] = [];
      for (let i = 0; i < 68; i++) {
        const code = i + 1;
        const w = getWilayaByCode(code);
        if (!w || !w.nameAr || !/[\u0600-\u06FF]/.test(w.nameAr)) {
          wilayaIssues.push(`Wilaya ${code} missing Arabic nameAr`);
        } else {
          const issues = checkArabicStringAntiLeakage(w.nameAr);
          if (issues.length > 0) wilayaIssues.push(`Wilaya ${code}: ${issues.join('; ')}`);
        }

        const seedW = SEED_WILAYAS_DELIVERY[i];
        if (!seedW || !seedW.nameAr || !/[\u0600-\u06FF]/.test(seedW.nameAr)) {
          wilayaIssues.push(`SEED_WILAYAS_DELIVERY[${i}] missing Arabic nameAr`);
        } else {
          const seedIssues = checkArabicStringAntiLeakage(seedW.nameAr);
          if (seedIssues.length > 0) wilayaIssues.push(`SEED_WILAYAS_DELIVERY[${i}]: ${seedIssues.join('; ')}`);
        }
      }
      expect(wilayaIssues).toEqual([]);

      const communeIssues: string[] = [];
      for (const c of ALGERIAN_COMMUNES) {
        if (!c.nameAr || !/[\u0600-\u06FF]/.test(c.nameAr)) {
          communeIssues.push(`Commune ${c.wilayaCode}/${c.name} missing nameAr`);
          continue;
        }
        if (/[A-Za-zÀ-ÖØ-öø-ÿ]{2,}/.test(c.nameAr)) {
          communeIssues.push(`Commune ${c.wilayaCode}/${c.name} has Latin chars in nameAr: "${c.nameAr}"`);
        }
      }
      expect(communeIssues).toEqual([]);
    });

    it('localizes delivery estimatedDays in AR via formatEstimatedDays and formats currency with د.ج', () => {
      const formatEstimatedDays = (wilayasModule as Record<string, unknown>).formatEstimatedDays as
        | ((days: string, lang: 'fr' | 'en' | 'ar') => string)
        | undefined;

      expect(
        typeof formatEstimatedDays,
        'Expected formatEstimatedDays(days, language) helper to be exported from @/lib/data/wilayas'
      ).toBe('function');

      if (typeof formatEstimatedDays === 'function') {
        const samples = Array.from(new Set(ALGERIAN_68_WILAYAS.map((w) => w.estimatedDays)));
        for (const raw of samples) {
          const arDays = formatEstimatedDays(raw, 'ar');
          expect(arDays).toMatch(/[\u0600-\u06FF]/);
          expect(checkArabicStringAntiLeakage(arDays)).toEqual([]);
          expect(arDays).not.toMatch(/\b(jours|jour|days|day|h)\b/i);
        }
      }

      const formatted = formatDZD(48500, { locale: 'ar' });
      expect(formatted).toMatch(/^48[\s\u00A0]500[\s\u00A0]د\.ج$/);
      expect(formatted).not.toMatch(/DA|DZD/);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('protects getTranslation("ar", ...) against prototype keys and empty/unknown keys', () => {
      const protoKeys = ['toString', '__proto__', 'constructor', 'valueOf', 'hasOwnProperty'];
      for (const key of protoKeys) {
        const res = getTranslation('ar', key, 'بديل آمن');
        expect(res).toBe('بديل آمن');
        expect(typeof res).toBe('string');
      }
      expect(getTranslation('ar', '', 'بديل')).toBe('بديل');
      expect(getTranslation('ar', 'totally.unknown.key.123', 'غير معروف')).toBe('غير معروف');
      expect(formatTranslation(ar['cart.count.single'], { count: 1 })).toContain('1');
    });

    it('handles color & size edge cases (empty, unknown, case-insensitive, Taille Unique)', () => {
      expect(getLocalizedColor('', 'ar')).toBe('');
      expect(getLocalizedColor('Couleur Inexistante XYZ', 'ar')).toBe('Couleur Inexistante XYZ');
      expect(getLocalizedColor('noir profond', 'ar')).toMatch(/[\u0600-\u06FF]/);
      expect(getLocalizedColor('NOIR PROFOND', 'ar')).toMatch(/[\u0600-\u06FF]/);

      expect(getLocalizedSize('Taille Unique', 'ar')).toBe('مقاس موحد');
      expect(getLocalizedSize('taille unique', 'ar')).toBe('مقاس موحد');
      expect(getLocalizedSize('One Size', 'ar')).toBe('مقاس موحد');
      expect(getLocalizedSize('48', 'ar')).toBe('48');
      expect(getLocalizedSize('XL', 'ar')).toBe('XL');
    });

    it('handles wilaya & commune boundaries (0, 1, 58, 68, 69) and guarantees >=1 commune per wilaya', () => {
      expect(getWilayaByCode(0)).toBeUndefined();
      expect(getWilayaByCode(69)).toBeUndefined();

      const w1 = getWilayaByCode(1);
      const w58 = getWilayaByCode(58);
      const w68 = getWilayaByCode(68);
      expect(w1?.nameAr).toBe('أدرار');
      expect(w58?.nameAr).toMatch(/المنيعة/);
      expect(w68?.nameAr).toMatch(/بوسعادة/);

      for (let code = 1; code <= 68; code++) {
        const communes = getCommunesByWilaya(code);
        expect(communes.length, `Wilaya ${code} has 0 communes`).toBeGreaterThan(0);
      }
    });

    it('handles formatDZD boundary numbers cleanly in AR mode', () => {
      expect(formatDZD(0, { locale: 'ar' })).toBe('0\u00A0د.ج');
      expect(formatDZD(-500, { locale: 'ar' })).toBe('-500\u00A0د.ج');
      expect(formatDZD(999, { locale: 'ar' })).toBe('999\u00A0د.ج');
      expect(formatDZD(15000, { locale: 'ar' })).toBe('15\u00A0000\u00A0د.ج');
      expect(formatDZD(1250000, { locale: 'ar' })).toBe('1\u00A0250\u00A0000\u00A0د.ج');
      expect(formatDZD(Number.NaN, { locale: 'ar' })).toBe('0\u00A0د.ج');
      expect(formatDZD(Number.POSITIVE_INFINITY, { locale: 'ar' })).toBe('0\u00A0د.ج');
    });

    it('handles getLocalizedProduct for fr, ar, unknown IDs, and custom titleAr/descriptionAr fields', () => {
      const sample = SEED_PRODUCTS[0];
      const frCopy = getLocalizedProduct(sample, 'fr');
      expect(frCopy.title).toBe(sample.title);

      const customProduct = {
        ...sample,
        id: 'prod-custom-runtime-ar',
        title: 'Veste Personnalisée',
        description: 'Description française personnalisée',
        titleAr: 'سترة مخصصة فاخرة',
        descriptionAr: 'وصف عربي مخصص لمنتج جديد مضاف من لوحة التحكم',
      } as Product & { titleAr: string; descriptionAr: string };

      const arCustom = getLocalizedProduct(customProduct, 'ar');
      expect(arCustom.title).toBe('سترة مخصصة فاخرة');
      expect(arCustom.description).toBe('وصف عربي مخصص لمنتج جديد مضاف من لوحة التحكم');
    });

    it('handles formatTranslation missing, extra, numeric-zero, and empty variables cleanly in AR', () => {
      const countTemplate = ar['cart.count.single'];
      expect(formatTranslation(countTemplate, { count: 0 })).toContain('0');
      expect(formatTranslation(countTemplate, { count: 1, extraUnused: 'ignored' })).toContain('1');
      expect(formatTranslation('{a} — {b}', { a: '', b: 'الجزائر' })).toBe(' — الجزائر');
      expect(formatTranslation('{count} / {count}', { count: 5 })).toBe('5 / 5');
      expect(formatTranslation('{missingVar}', {})).toBe('{missingVar}');
    });

    it('handles getTranslation("ar", ...) whitespace, template, and RTL Arabic punctuation boundaries', () => {
      expect(getTranslation('ar', '   ', 'بديل آمن')).toBe('بديل آمن');
      expect(getTranslation('ar', 'pdp.error.max_stock_reached')).toContain('{existing}');
      expect(getTranslation('ar', 'pdp.error.max_stock_reached')).toContain('{available}');
      expect(getTranslation('ar', 'checkout.cod_banner.title')).toMatch(/[\u0600-\u06FF]/);
      expect(getTranslation('ar', 'admin.orders.orders_count')).toContain('{count}');
    });

    it('verifies dynamic status.*, status.desc.*, and cancel_reason.* keys across fr, en, and ar', () => {
      const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      for (const status of statuses) {
        for (const prefix of ['status', 'status.desc']) {
          const key = `${prefix}.${status}`;
          expect(fr[key]?.trim().length, `Missing fr.${key}`).toBeGreaterThan(0);
          expect(en[key]?.trim().length, `Missing en.${key}`).toBeGreaterThan(0);
          expect(ar[key]?.trim().length, `Missing ar.${key}`).toBeGreaterThan(0);
          expect(ar[key]).toMatch(/[\u0600-\u06FF]/);
          expect(checkArabicStringAntiLeakage(ar[key])).toEqual([]);
        }
      }

      const cancelKeys = Object.keys(fr).filter((k) => k.startsWith('admin.orders.cancel_reason.'));
      expect(cancelKeys.length).toBeGreaterThanOrEqual(7);
      for (const key of cancelKeys) {
        expect(en[key]?.trim().length).toBeGreaterThan(0);
        expect(ar[key]?.trim().length).toBeGreaterThan(0);
        expect(ar[key]).toMatch(/[\u0600-\u06FF]/);
        expect(checkArabicStringAntiLeakage(ar[key])).toEqual([]);
      }
    });

    it('strips // and /* */ comments in static scanner while preserving https:// strings and multiline t() calls', () => {
      const sample = `
        // t('commented.out.line')
        /* t('commented.out.block') */
        const url = 'https://images.unsplash.com/photo-1';
        const label = t(
          'nav.home'
        );
      `;
      const stripped = stripCommentsForScan(sample);
      expect(stripped).not.toContain('commented.out.line');
      expect(stripped).not.toContain('commented.out.block');
      expect(stripped).toContain('https://images.unsplash.com/photo-1');
      expect(stripped).toContain("'nav.home'");
    });

    it('enforces case-sensitive acronym whitelist and un-interpolated {var} guard in anti-leakage helper', () => {
      expect(checkArabicStringAntiLeakage('توصيل عبر EN أو US أو EU')).toEqual([]);
      expect(checkArabicStringAntiLeakage('صيغة mp4 و WebM بحجم cm')).toEqual([]);
      expect(checkArabicStringAntiLeakage('en cours').length).toBeGreaterThan(0);
      expect(checkArabicStringAntiLeakage('Contact us').length).toBeGreaterThan(0);
      expect(checkArabicStringAntiLeakage('عدد {count} طلبيات').length).toBeGreaterThan(0);
      expect(
        checkArabicStringAntiLeakage('عدد {count} طلبيات', { allowTemplatePlaceholders: true })
      ).toEqual([]);
    });

    it('handles getLocalizedCategory, getLocalizedSubcategory, and formatEstimatedDays boundaries cleanly', () => {
      expect(getLocalizedCategory('', 'ar')).toBeNull();
      expect(getLocalizedCategory('unknown-category', 'ar')).toBeNull();
      expect(getLocalizedCategory('clothing', 'ar')?.name).toBe('ملابس وأزياء');
      expect(getLocalizedCategory('CLOTHING', 'ar')?.name).toBe('ملابس وأزياء');

      expect(getLocalizedSubcategory('', 'ar')).toBe('');
      expect(getLocalizedSubcategory('COSTUMES', 'ar')).toBe(SUBCATEGORY_TRANSLATIONS.costumes.ar);
      expect(getLocalizedSubcategory('unknown-sub-slug', 'ar')).toBe('unknown-sub-slug');

      const formatEstimatedDays = (wilayasModule as Record<string, unknown>).formatEstimatedDays as
        | ((days: string, lang: 'fr' | 'en' | 'ar') => string)
        | undefined;
      expect(typeof formatEstimatedDays).toBe('function');
      if (typeof formatEstimatedDays === 'function') {
        expect(formatEstimatedDays('', 'ar')).toBe('');
        expect(formatEstimatedDays('24h', 'ar')).toBe('24 ساعة');
        expect(formatEstimatedDays('3 à 5 jours', 'ar')).toBe('3 - 5 أيام');
        expect(formatEstimatedDays('1 jour', 'ar')).toBe('يوم واحد');
        expect(formatEstimatedDays('مخصصة', 'ar')).toBe('مخصصة');
      }
    });
  });

  // =========================================================================
  // TIER 3: PAIRWISE CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Pairwise Cross-Feature Combinations', () => {
    it('supports Arabic search queries in filterProducts combined with category, price, and stock filters', () => {
      const safariMatches = filterProducts(SEED_PRODUCTS, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'سفاري',
        category: 'clothing',
        inStockOnly: true,
      });
      expect(safariMatches.length).toBeGreaterThan(0);
      expect(safariMatches.some((p) => p.id === 'prod-suit-01')).toBe(true);

      const shoeMatches = filterProducts(SEED_PRODUCTS, {
        ...DEFAULT_FILTER_STATE,
        searchQuery: 'ريشليو',
        category: 'shoes',
        maxPrice: 100000,
      });
      expect(shoeMatches.length).toBeGreaterThan(0);
    });

    it('combines Category × Subcategory × Size × formatDZD cleanly across all 3 categories in AR', () => {
      const categories: ProductCategoryType[] = ['clothing', 'shoes', 'accessories'];
      for (const cat of categories) {
        const catName = getLocalizedCategoryName(cat, 'ar');
        expect(catName).toMatch(/[\u0600-\u06FF]/);
        expect(checkArabicStringAntiLeakage(catName)).toEqual([]);

        const subs = SUBCATEGORIES_BY_CATEGORY[cat];
        expect(subs.length).toBeGreaterThan(0);
        for (const sub of subs) {
          const arSub = getLocalizedSubcategory(sub.id, 'ar');
          expect(arSub).toMatch(/[\u0600-\u06FF]/);
          expect(checkArabicStringAntiLeakage(arSub)).toEqual([]);
        }
      }

      expect(formatDZD(25000, { locale: 'ar' })).toContain('د.ج');
      expect(getLocalizedSize('Taille Unique', 'ar')).toBe('مقاس موحد');
    });

    it('supports Arabic, French, and numeric code queries in searchWilayas and searchCommunes', () => {
      const algerAr = searchWilayas('الجزائر');
      expect(algerAr.some((w) => w.code === 16)).toBe(true);

      const oranAr = searchWilayas('وهران');
      expect(oranAr.some((w) => w.code === 31)).toBe(true);

      const code16 = searchWilayas('16');
      expect(code16.some((w) => w.code === 16)).toBe(true);

      const hydraCommunes = searchCommunes(16, 'حيدرة');
      expect(hydraCommunes.length).toBeGreaterThan(0);
      expect(hydraCommunes[0].nameAr).toMatch(/[\u0600-\u06FF]/);

      const chelghoumCommunes = searchCommunes(43, 'شلغوم العيد');
      expect(chelghoumCommunes.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD END-TO-END DATA SWEEP SCENARIO
  // =========================================================================
  describe('Tier 4: Full Catalog & Logistics Arabic Integrity Sweep', () => {
    it('renders every Seed Product × Sizes × Colors × Category × Subcategory × 68 Wilayas in AR with zero French/English leakage', () => {
      const failures: string[] = [];

      for (const product of SEED_PRODUCTS) {
        const locProd = getLocalizedProduct(product, 'ar');
        const locCat = getLocalizedCategoryName(product.categoryId, 'ar');
        const locSub = getLocalizedSubcategory(product.subcategory, 'ar');
        const locPrice = formatDZD(product.price, { locale: 'ar' });

        if (!/[\u0600-\u06FF]/.test(locProd.title)) failures.push(`${product.id}: title`);
        if (!/[\u0600-\u06FF]/.test(locCat)) failures.push(`${product.id}: category`);
        if (!/[\u0600-\u06FF]/.test(locSub)) failures.push(`${product.id}: subcategory`);
        if (!locPrice.includes('د.ج')) failures.push(`${product.id}: price`);

        for (const size of product.sizes) {
          const locSize = getLocalizedSize(size, 'ar');
          if (/Taille Unique|One Size/i.test(locSize)) {
            failures.push(`${product.id}: unlocalized size ${locSize}`);
          }
        }

        for (const col of product.colors || []) {
          const locColor = getLocalizedColor(col.name, 'ar');
          if (!/[\u0600-\u06FF]/.test(locColor) || locColor === col.name) {
            failures.push(`${product.id}: color "${col.name}" -> "${locColor}"`);
          }
          const colorIssues = checkArabicStringAntiLeakage(locColor);
          if (colorIssues.length > 0) {
            failures.push(`${product.id}: color ${col.name}: ${colorIssues.join('; ')}`);
          }
        }
      }

      for (const wilaya of ALGERIAN_68_WILAYAS) {
        if (!wilaya.nameAr || !/[\u0600-\u06FF]/.test(wilaya.nameAr) || FRENCH_ENGLISH_DATE_NAMES_REGEX.test(wilaya.nameAr)) {
          failures.push(`Wilaya ${wilaya.code} invalid AR name: ${wilaya.nameAr}`);
        }
      }

      expect(
        failures,
        `Full sweep detected ${failures.length} localization gap(s):\n${failures.slice(0, 25).join('\n')}`
      ).toEqual([]);
    });
  });
});
