import { AlgerianCommune } from '@/types';
import rawCommunes from './communes.json';

export const ALGERIAN_COMMUNES: AlgerianCommune[] = rawCommunes as AlgerianCommune[];

// Pre-indexed map for instant O(1) lookup by wilaya code
const communesByWilayaCache: Record<number, AlgerianCommune[]> = {};

for (const commune of ALGERIAN_COMMUNES) {
  if (!communesByWilayaCache[commune.wilayaCode]) {
    communesByWilayaCache[commune.wilayaCode] = [];
  }
  communesByWilayaCache[commune.wilayaCode].push(commune);
}

/**
 * Returns all baladiyat (communes) belonging to a specific wilaya code (1 to 68).
 */
export function getCommunesByWilaya(wilayaCode: number): AlgerianCommune[] {
  return communesByWilayaCache[wilayaCode] || [];
}

/**
 * Accent-folding and Arabic-normalization utility for robust search in French / Arabic.
 */
function foldSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

/**
 * Searches baladiyat (communes) for a given wilaya by French name, Arabic name, or postal code.
 */
export function searchCommunes(wilayaCode: number, query: string): AlgerianCommune[] {
  const communes = getCommunesByWilaya(wilayaCode);
  if (!query || !query.trim()) {
    return communes;
  }

  const trimmedQuery = query.trim();
  const foldedQuery = foldSearchTerm(trimmedQuery);

  return communes.filter((c) => {
    const foldedName = foldSearchTerm(c.name);
    const matchesFrench = foldedName.includes(foldedQuery);
    const matchesArabic = c.nameAr ? foldSearchTerm(c.nameAr).includes(foldedQuery) : false;
    const matchesPostal = c.postalCode ? c.postalCode.includes(trimmedQuery) : false;
    return matchesFrench || matchesArabic || matchesPostal;
  });
}

/**
 * Finds a specific commune within a wilaya by its exact or partial name (French or Arabic).
 */
export function findCommune(wilayaCode: number, nameOrNameAr: string): AlgerianCommune | undefined {
  const communes = getCommunesByWilaya(wilayaCode);
  if (!nameOrNameAr || !nameOrNameAr.trim()) return undefined;

  const folded = foldSearchTerm(nameOrNameAr.trim());
  return communes.find(
    (c) =>
      foldSearchTerm(c.name) === folded ||
      (c.nameAr && foldSearchTerm(c.nameAr) === folded)
  );
}

/**
 * Returns all communes across all 68 wilayas.
 */
export function getAllCommunes(): AlgerianCommune[] {
  return ALGERIAN_COMMUNES;
}
