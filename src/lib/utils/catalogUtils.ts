import { Product, Category } from '@/types';
import { SupportedLanguage } from '@/lib/i18n/types';
import {
  getLocalizedCategory,
  getLocalizedSubcategory,
  getLocalizedColor,
  getLocalizedSize,
  PRODUCT_TRANSLATIONS,
  SUBCATEGORY_TRANSLATIONS,
  CATEGORY_TRANSLATIONS,
  normalizeCategoryKey,
} from '@/lib/i18n/catalog-translations';

export interface CategoryMeta {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  heroImage: string;
}

export const CATEGORY_DEFINITIONS: Record<string, CategoryMeta> = {
  clothing: {
    id: 'clothing',
    slug: 'vetements',
    name: 'Vêtements',
    subtitle: 'Vestes, Chemises & Prêt-à-Porter',
    description:
      'L\'art du vestiaire masculin contemporain. Des matières nobles sélectionnées avec soin, des coupes modernes et des finitions d\'une distinction souveraine.',
    heroImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=1600',
  },
  shoes: {
    id: 'shoes',
    slug: 'chaussures',
    name: 'Chaussures',
    subtitle: 'Souliers de Maître Bottier & Richelieus',
    description:
      'Façonnés dans des cuirs pleine fleur d\'Italie et d\'Espagne. Montages Goodyear et cousu Blake, patines appliquées à la main pour une cambrure d\'une tenue irréprochable.',
    heroImage: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=1600',
  },
  accessories: {
    id: 'accessories',
    slug: 'accessoires',
    name: 'Accessoires',
    subtitle: 'Soie Jacquard, Maroquinerie & Horlogerie',
    description:
      'Le raffinement des détails qui couronne la silhouette masculine : cravates sept plis en soie, ceintures bombées en cuir véritable et boutons de manchette dorés.',
    heroImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1600',
  },
};

export const CATEGORY_SLUG_MAP: Record<string, string> = {
  vetements: 'clothing',
  clothing: 'clothing',
  chaussures: 'shoes',
  shoes: 'shoes',
  accessoires: 'accessories',
  accessories: 'accessories',
};

export function resolveCategoryId(slugOrId: string): string | null {
  if (!slugOrId || typeof slugOrId !== 'string') return null;
  const normalized = slugOrId.toLowerCase().trim();
  return CATEGORY_SLUG_MAP[normalized] || null;
}

export function getCategoryMeta(
  slugOrId: string,
  language: SupportedLanguage = 'fr'
): CategoryMeta | null {
  if (!slugOrId || typeof slugOrId !== 'string') return null;
  const categoryId = resolveCategoryId(slugOrId);
  if (!categoryId) return null;
  const base = CATEGORY_DEFINITIONS[categoryId];
  if (!base) return null;

  if (language === 'fr') {
    return base;
  }

  const localized = getLocalizedCategory(categoryId, language);
  if (!localized) {
    return base;
  }

  return {
    ...base,
    name: localized.name,
    subtitle: localized.subtitle,
    description: localized.description,
  };
}

export function getLocalizedSubcategories(
  categoryId: string,
  language: SupportedLanguage = 'fr'
): { id: string; label: string }[] {
  if (!categoryId || typeof categoryId !== 'string') return [];
  const resolved = resolveCategoryId(categoryId) || categoryId;
  const list = SUBCATEGORIES_BY_CATEGORY[resolved] || [];
  if (language === 'fr') {
    return list;
  }
  return list.map((item) => ({
    id: item.id,
    label: getLocalizedSubcategory(item.id, language),
  }));
}

export {
  getLocalizedCategory,
  getLocalizedSubcategory,
  getLocalizedColor,
  getLocalizedSize,
};

export const SUBCATEGORIES_BY_CATEGORY: Record<string, { id: string; label: string }[]> = {
  clothing: [
    { id: 'vestes', label: 'Vestes & Blousons' },
    { id: 'blazers', label: 'Blazers' },
    { id: 'chemises', label: 'Chemises' },
    { id: 'manteaux', label: 'Manteaux' },
    { id: 'pantalons', label: 'Pantalons' },
    { id: 'tricots', label: 'Tricots & Maille' },
  ],
  shoes: [
    { id: 'richelieus', label: 'Richelieus' },
    { id: 'oxfords', label: 'Oxfords' },
    { id: 'derbies', label: 'Derbies' },
    { id: 'mocassins', label: 'Mocassins' },
    { id: 'bottines', label: 'Bottines' },
    { id: 'boucles', label: 'Double Boucle' },
    { id: 'sneakers', label: 'Baskets de Luxe' },
  ],
  accessories: [
    { id: 'montres', label: 'Montres' },
    { id: 'cravates', label: 'Cravates' },
    { id: 'ceintures', label: 'Ceintures' },
    { id: 'boutons-de-manchette', label: 'Boutons de manchette' },
    { id: 'pochettes', label: 'Pochettes' },
    { id: 'maroquinerie', label: 'Maroquinerie' },
  ],
};

export const STANDARD_SIZES: Record<string, string[]> = {
  clothing: ['48', '50', '52', '54', '56'],
  shoes: ['39', '40', '41', '42', '43', '44', '45'],
  accessories: ['Taille Unique'],
};

export type CatalogSortOption = 'newest' | 'price-asc' | 'price-desc' | 'featured';

export interface CatalogFilterState {
  searchQuery: string;
  category: string; // 'all' | 'clothing' | 'shoes' | 'accessories'
  subcategory: string; // 'all' | specific
  selectedSizes: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  sortBy: CatalogSortOption;
}

export const DEFAULT_FILTER_STATE: CatalogFilterState = {
  searchQuery: '',
  category: 'all',
  subcategory: 'all',
  selectedSizes: [],
  minPrice: 0,
  maxPrice: 150000,
  inStockOnly: false,
  sortBy: 'featured',
};

function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

/**
 * Evaluates whether a product is active and visible in the public customer storefront.
 * When the status of a product is OFF (draft, inactive, or toggled off in admin),
 * it is completely hidden from the shop.
 */
export function isProductVisibleInShop(p: Product | null | undefined): boolean {
  if (!p) return false;
  if (p.status === 'draft' || p.status === 'archived') return false;
  if (p.isActive === false) return false;
  if (p.inStock === false && p.status !== 'active') return false;
  return true;
}

/**
 * Pure client-side filtering function matching server and data-provider logic.
 * Supports French, English, and Arabic (with Arabic letter normalization) without RegExp overhead.
 */
export function filterProducts(
  products: Product[],
  filters: CatalogFilterState,
  language?: SupportedLanguage
): Product[] {
  // Always hide products whose status is off from storefront catalog and search
  let result = products.filter(isProductVisibleInShop);
  void language;

  // 1. Search Query (Direct fields, *Ar/*En fields, translations, subcategories, categories, colors)
  if (filters.searchQuery.trim()) {
    const q = normalizeSearchText(filters.searchQuery.trim());
    result = result.filter((p) => {
      const candidates: (string | undefined)[] = [
        p.title,
        p.description,
        p.subtitle,
        p.shortDescription,
        p.subcategory,
        p.materials,
        p.titleAr,
        p.titleEn,
        p.descriptionAr,
        p.descriptionEn,
        p.subtitleAr,
        p.subtitleEn,
        p.shortDescriptionAr,
        p.shortDescriptionEn,
        p.materialsAr,
        p.materialsEn,
      ];

      if (Array.isArray(p.tags)) {
        for (const tag of p.tags) {
          candidates.push(tag);
        }
      }

      const prodTrans = PRODUCT_TRANSLATIONS[p.id];
      if (prodTrans) {
        candidates.push(
          prodTrans.en?.title,
          prodTrans.en?.description,
          prodTrans.en?.subtitle,
          prodTrans.en?.materials,
          prodTrans.ar?.title,
          prodTrans.ar?.description,
          prodTrans.ar?.subtitle,
          prodTrans.ar?.materials
        );
      }

      const subKey = p.subcategory ? p.subcategory.toLowerCase().trim() : '';
      const subTrans = SUBCATEGORY_TRANSLATIONS[subKey];
      if (subTrans) {
        candidates.push(subTrans.fr, subTrans.en, subTrans.ar);
      }

      const catTrans = CATEGORY_TRANSLATIONS[normalizeCategoryKey(p.categoryId)];
      if (catTrans) {
        candidates.push(catTrans.fr?.name, catTrans.en?.name, catTrans.ar?.name);
      }

      if (Array.isArray(p.colors)) {
        for (const c of p.colors) {
          if (c?.name) {
            candidates.push(
              c.name,
              getLocalizedColor(c.name, 'en'),
              getLocalizedColor(c.name, 'ar')
            );
          }
        }
      }

      return candidates.some((field) => field && normalizeSearchText(field).includes(q));
    });
  }

  // 2. Category Filter
  if (filters.category && filters.category !== 'all') {
    const targetId = resolveCategoryId(filters.category) || filters.category;
    result = result.filter((p) => p.categoryId === targetId || p.categorySlug === filters.category);
  }

  // 3. Subcategory Filter
  if (filters.subcategory && filters.subcategory !== 'all') {
    const sub = filters.subcategory.toLowerCase().trim();
    result = result.filter((p) => p.subcategory.toLowerCase() === sub);
  }

  // 4. Size Filter (OR matching for multiple selected sizes)
  if (filters.selectedSizes.length > 0) {
    result = result.filter((p) => {
      if (!Array.isArray(p.sizes) || p.sizes.length === 0) return false;
      return filters.selectedSizes.some((s) => p.sizes.includes(s));
    });
  }

  // 5. Price Range
  if (filters.minPrice > 0) {
    result = result.filter((p) => p.price >= filters.minPrice);
  }
  if (filters.maxPrice < 150000) {
    result = result.filter((p) => p.price <= filters.maxPrice);
  }

  // 6. In-Stock Only
  if (filters.inStockOnly) {
    result = result.filter((p) => p.inStock && p.stockQuantity > 0);
  }

  // 7. Sorting
  switch (filters.sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'featured':
    default:
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
      break;
  }

  return result;
}
