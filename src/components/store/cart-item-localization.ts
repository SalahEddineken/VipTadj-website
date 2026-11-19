import { SupportedLanguage } from '@/lib/i18n/types';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';

const SEED_FRENCH_TITLE_BY_ID: Record<string, string> = Object.fromEntries(
  SEED_PRODUCTS.map((p) => [p.id, p.title])
);

const HAS_ARABIC_REGEX = /[\u0600-\u06FF]/;

/**
 * Resolves a CartItem / OrderItem title for display in the active language:
 * - Preserves custom/pre-localized Arabic titles when language === 'ar'.
 * - Recovers canonical French title for known SEED_PRODUCTS when switching AR -> FR
 *   on pre-existing Arabic cart/order items.
 * - Delegates all other cases to getLocalizedProduct (handles FR -> AR, FR -> EN, AR -> EN).
 */
export function getLocalizedCartItemTitle(
  item: { productId?: string; title: string },
  language: SupportedLanguage
): string {
  const rawTitle = item.title || '';
  const hasArabic = HAS_ARABIC_REGEX.test(rawTitle);

  if (language === 'ar' && hasArabic) {
    return rawTitle;
  }

  if (language === 'fr' && hasArabic && item.productId && SEED_FRENCH_TITLE_BY_ID[item.productId]) {
    return SEED_FRENCH_TITLE_BY_ID[item.productId];
  }

  return getLocalizedProduct(
    { id: item.productId, title: rawTitle, description: '' },
    language
  ).title;
}
