import { WilayaDeliveryConfig } from '@/types';
import type { SupportedLanguage } from '@/lib/i18n/types';
export {
  ALGERIAN_COMMUNES,
  getCommunesByWilaya,
  searchCommunes,
  findCommune,
  getAllCommunes,
} from './communes';

export interface AlgerianWilaya extends WilayaDeliveryConfig {
  fee: number;
  deskFee: number;
  zone: string;
}

export const ALGERIAN_68_WILAYAS: AlgerianWilaya[] = [
  { code: 1, name: 'Adrar', nameAr: 'أدرار', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 2, name: 'Chlef', nameAr: 'الشلف', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 3, name: 'Laghouat', nameAr: 'الأغواط', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 5, name: 'Batna', nameAr: 'باتنة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 6, name: 'Béjaïa', nameAr: 'بجاية', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'est', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 7, name: 'Biskra', nameAr: 'بسكرة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'sud', estimatedDays: '24h', isAvailable: true },
  { code: 8, name: 'Béchar', nameAr: 'بشار', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 9, name: 'Blida', nameAr: 'البليدة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 10, name: 'Bouira', nameAr: 'البويرة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 11, name: 'Tamanrasset', nameAr: 'تمنراست', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 12, name: 'Tébessa', nameAr: 'تبسة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 13, name: 'Tlemcen', nameAr: 'تلمسان', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 14, name: 'Tiaret', nameAr: 'تيارت', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 16, name: 'Alger', nameAr: 'الجزائر', fee: 700, homeDeliveryFee: 700, deskFee: 550, zone: 'alger', estimatedDays: '24h', isAvailable: true },
  { code: 17, name: 'Djelfa', nameAr: 'الجلفة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 18, name: 'Jijel', nameAr: 'جيجل', fee: 700, homeDeliveryFee: 700, deskFee: 550, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 19, name: 'Sétif', nameAr: 'سطيف', fee: 700, homeDeliveryFee: 700, deskFee: 550, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 20, name: 'Saïda', nameAr: 'سعيدة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 21, name: 'Skikda', nameAr: 'سكيكدة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 23, name: 'Annaba', nameAr: 'عنابة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 24, name: 'Guelma', nameAr: 'قالمة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 25, name: 'Constantine', nameAr: 'قسنطينة', fee: 700, homeDeliveryFee: 700, deskFee: 550, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 26, name: 'Médéa', nameAr: 'المدية', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 27, name: 'Mostaganem', nameAr: 'مستغانم', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 28, name: "M'Sila", nameAr: 'المسيلة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 29, name: 'Mascara', nameAr: 'معسكر', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 30, name: 'Ouargla', nameAr: 'ورقلة', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 31, name: 'Oran', nameAr: 'وهران', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 32, name: 'El Bayadh', nameAr: 'البيض', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 33, name: 'Illizi', nameAr: 'إيليزي', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '5 à 6 jours', isAvailable: true },
  { code: 34, name: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 35, name: 'Boumerdès', nameAr: 'بومرداس', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 36, name: 'El Tarf', nameAr: 'الطارف', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 37, name: 'Tindouf', nameAr: 'تندوف', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 39, name: 'El Oued', nameAr: 'الوادي', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '24h', isAvailable: true },
  { code: 40, name: 'Khenchela', nameAr: 'خنشلة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 42, name: 'Tipaza', nameAr: 'تيبازة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 43, name: 'Mila', nameAr: 'ميلة', fee: 590, homeDeliveryFee: 590, deskFee: 450, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 45, name: 'Naâma', nameAr: 'النعامة', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'hauts-plateaux', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 47, name: 'Ghardaïa', nameAr: 'غرداية', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 48, name: 'Relizane', nameAr: 'غليزان', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 49, name: 'Timimoun', nameAr: 'تيميمون', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '24h', isAvailable: true },
  { code: 52, name: 'Béni Abbès', nameAr: 'بني عباس', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 53, name: 'In Salah', nameAr: 'عين صالح', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '5 à 6 jours', isAvailable: true },
  { code: 54, name: 'In Guezzam', nameAr: 'عين قزام', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '5 à 6 jours', isAvailable: true },
  { code: 55, name: 'Touggourt', nameAr: 'تقرت', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 56, name: 'Djanet', nameAr: 'جانت', fee: 1650, homeDeliveryFee: 1650, deskFee: 1450, zone: 'sud', estimatedDays: '5 à 6 jours', isAvailable: true },
  { code: 57, name: "El M'Ghair", nameAr: 'المغير', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '24h', isAvailable: true },
  { code: 58, name: 'El Meniaa', nameAr: 'المنيعة', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 59, name: 'Aflou', nameAr: 'آفلو', fee: 1150, homeDeliveryFee: 1150, deskFee: 950, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 60, name: 'Barika', nameAr: 'بريكة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 61, name: 'El Kantara', nameAr: 'القنطرة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
  { code: 62, name: 'Bir El Ater', nameAr: 'بئر العاتر', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'est', estimatedDays: '24h', isAvailable: true },
  { code: 63, name: 'El Aricha', nameAr: 'العريشة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 64, name: 'Ksar Chellala', nameAr: 'قصر الشلالة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 65, name: 'Aïn Ouessara', nameAr: 'عين وسارة', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 66, name: 'Messaad', nameAr: 'مسعد', fee: 900, homeDeliveryFee: 900, deskFee: 750, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 67, name: 'Ksar El Boukhari', nameAr: 'قصر البخاري', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 68, name: 'Bou Saâda', nameAr: 'بوسعادة', fee: 800, homeDeliveryFee: 800, deskFee: 650, zone: 'hauts-plateaux', estimatedDays: '24h', isAvailable: true },
];

// Aliases for multi-explorer and backward compatibility
export const ALGERIAN_WILAYAS = ALGERIAN_68_WILAYAS;
export const ALGERIAN_58_WILAYAS = ALGERIAN_68_WILAYAS;

export function getWilayaByCode(code: number): AlgerianWilaya | undefined {
  return ALGERIAN_68_WILAYAS.find((w) => w.code === code);
}

export function getWilayaFee(code: number, deliveryType: 'home' | 'desk' = 'home'): number {
  const wilaya = getWilayaByCode(code);
  if (!wilaya) return 800;
  return deliveryType === 'desk' ? (wilaya.deskFee ?? 650) : (wilaya.fee ?? wilaya.homeDeliveryFee ?? 800);
}

export function searchWilayas(query: string): AlgerianWilaya[] {
  if (!query || !query.trim()) return ALGERIAN_68_WILAYAS;
  const q = query.trim().toLowerCase();

  // Numeric code search
  const asNumber = parseInt(q, 10);
  if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= 68) {
    const match = ALGERIAN_68_WILAYAS.filter((w) => w.code === asNumber || w.code.toString().startsWith(q));
    if (match.length > 0) return match;
  }

  // Accent & Arabic letter folding helper
  const fold = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');

  const foldedQuery = fold(q);

  return ALGERIAN_68_WILAYAS.filter((w) => {
    const foldedName = fold(w.name);
    const matchesFrench = foldedName.includes(foldedQuery);
    const matchesArabic = w.nameAr ? fold(w.nameAr).includes(foldedQuery) : false;
    const matchesCode = w.code.toString().includes(q);
    return matchesFrench || matchesArabic || matchesCode;
  });
}

/**
 * Formats estimated delivery delay strings ('24h', '24h - 48h', '24h à 48h', '3 à 5 jours', etc.)
 * into natural French, English, or Algerian Arabic at display time.
 */
export function formatEstimatedDays(
  days: string,
  language: SupportedLanguage = 'fr'
): string {
  if (!days || typeof days !== 'string') return '';
  const trimmed = days.trim();
  if (!trimmed || language === 'fr') {
    return trimmed;
  }

  // Hour range: "24h - 48h", "24h à 48h", "24 - 48h"
  const hourRangeMatch = trimmed.match(
    /^(\d+)\s*(?:h|heures?|hours?)?\s*(?:-|–|à|to)\s*(\d+)\s*(?:h|heures?|hours?)$/i
  );
  if (hourRangeMatch) {
    const [, a, b] = hourRangeMatch;
    return language === 'ar' ? `${a} - ${b} ساعة` : `${a}h - ${b}h`;
  }

  // Single hour: "24h"
  const singleHourMatch = trimmed.match(/^(\d+)\s*(?:h|heures?|hours?)$/i);
  if (singleHourMatch) {
    const [, n] = singleHourMatch;
    return language === 'ar' ? `${n} ساعة` : `${n}h`;
  }

  // Day range: "3 à 5 jours", "3 - 5 days"
  const dayRangeMatch = trimmed.match(
    /^(\d+)\s*(?:j|jours?|days?)?\s*(?:-|–|à|to)\s*(\d+)\s*(?:j|jours?|days?)$/i
  );
  if (dayRangeMatch) {
    const [, a, b] = dayRangeMatch;
    if (language === 'ar') {
      return Number(b) <= 10 ? `${a} - ${b} أيام` : `${a} - ${b} يوم`;
    }
    return `${a} - ${b} days`;
  }

  // Single day: "1 jour", "3 jours"
  const singleDayMatch = trimmed.match(/^(\d+)\s*(?:j|jours?|days?)$/i);
  if (singleDayMatch) {
    const [, n] = singleDayMatch;
    const count = Number(n);
    if (language === 'ar') {
      if (count === 1) return 'يوم واحد';
      if (count === 2) return 'يومان';
      return count <= 10 ? `${n} أيام` : `${n} يوم`;
    }
    return count === 1 ? '1 day' : `${n} days`;
  }

  return trimmed;
}
