import { Product, Category } from '@/types';
import { SupportedLanguage } from '@/lib/i18n/types';
import {
  getLocalizedCategory,
  getLocalizedSubcategory,
  getLocalizedColor,
  getLocalizedSize,
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
    subtitle: 'Costumes, Blazers & Confection Sartoriale',
    description:
      'L\'art du sur-mesure et de la coupe d\'apparat. Des laines vierges d\'exception Super 130s, des boutonnières façon tailleur et des finitions semi-entoilées d\'une distinction souveraine.',
    heroImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1600',
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
    { id: 'costumes', label: 'Costumes' },
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
    { id: 'montres', label: 'Horlogerie' },
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

/**
 * Pure client-side filtering function matching server and data-provider logic.
 */
export function filterProducts(products: Product[], filters: CatalogFilterState): Product[] {
  let result = [...products];

  // 1. Search Query (Title, Description, Subcategory, Materials, Tags)
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter((p) => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchSub = p.subcategory.toLowerCase().includes(q);
      const matchMaterials = p.materials ? p.materials.toLowerCase().includes(q) : false;
      const matchTags = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchSub || matchMaterials || matchTags;
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
