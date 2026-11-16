import { WilayaDeliveryConfig } from '@/types';

export interface AlgerianWilaya extends WilayaDeliveryConfig {
  fee: number;
  deskFee: number;
  zone: string;
}

export const ALGERIAN_58_WILAYAS: AlgerianWilaya[] = [
  { code: 1, name: 'Adrar', nameAr: 'أدرار', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 2, name: 'Chlef', nameAr: 'الشلف', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 3, name: 'Laghouat', nameAr: 'الأغواط', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 4, name: 'Oum El Bouaghi', nameAr: 'أم البواقي', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 5, name: 'Batna', nameAr: 'باتنة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 6, name: 'Béjaïa', nameAr: 'بجاية', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 7, name: 'Biskra', nameAr: 'بسكرة', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 8, name: 'Béchar', nameAr: 'بشار', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 9, name: 'Blida', nameAr: 'البليدة', fee: 500, homeDeliveryFee: 500, deskFee: 300, zone: 'centre', estimatedDays: '24h', isAvailable: true },
  { code: 10, name: 'Bouira', nameAr: 'البويرة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 11, name: 'Tamanrasset', nameAr: 'تمنراست', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 12, name: 'Tébessa', nameAr: 'تبسة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 13, name: 'Tlemcen', nameAr: 'تلمسان', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 14, name: 'Tiaret', nameAr: 'تيارت', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 15, name: 'Tizi Ouzou', nameAr: 'تيزي وزو', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 16, name: 'Alger', nameAr: 'الجزائر', fee: 400, homeDeliveryFee: 400, deskFee: 250, zone: 'alger', estimatedDays: '24h', isAvailable: true },
  { code: 17, name: 'Djelfa', nameAr: 'الجلفة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 18, name: 'Jijel', nameAr: 'جيجل', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 19, name: 'Sétif', nameAr: 'سطيف', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 20, name: 'Saïda', nameAr: 'سعيدة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 21, name: 'Skikda', nameAr: 'سكيكدة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 22, name: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 23, name: 'Annaba', nameAr: 'عنابة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 24, name: 'Guelma', nameAr: 'قالمة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 25, name: 'Constantine', nameAr: 'قسنطينة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 26, name: 'Médéa', nameAr: 'المدية', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 27, name: 'Mostaganem', nameAr: 'مستغانم', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 28, name: "M'Sila", nameAr: 'المسيلة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 29, name: 'Mascara', nameAr: 'معسكر', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 30, name: 'Ouargla', nameAr: 'ورقلة', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 31, name: 'Oran', nameAr: 'وهران', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 32, name: 'El Bayadh', nameAr: 'البيض', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 33, name: 'Illizi', nameAr: 'إيليزي', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 34, name: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 35, name: 'Boumerdès', nameAr: 'بومرداس', fee: 500, homeDeliveryFee: 500, deskFee: 300, zone: 'centre', estimatedDays: '24h', isAvailable: true },
  { code: 36, name: 'El Tarf', nameAr: 'الطارف', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 37, name: 'Tindouf', nameAr: 'تندوف', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 38, name: 'Tissemsilt', nameAr: 'تيسمسيلت', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 39, name: 'El Oued', nameAr: 'الوادي', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 40, name: 'Khenchela', nameAr: 'خنشلة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 41, name: 'Souk Ahras', nameAr: 'سوق أهراس', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 42, name: 'Tipaza', nameAr: 'تيبازة', fee: 500, homeDeliveryFee: 500, deskFee: 300, zone: 'centre', estimatedDays: '24h', isAvailable: true },
  { code: 43, name: 'Mila', nameAr: 'ميلة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'est', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 44, name: 'Aïn Defla', nameAr: 'عين الدفلى', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'centre', estimatedDays: '24h - 48h', isAvailable: true },
  { code: 45, name: 'Naâma', nameAr: 'النعامة', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'hauts-plateaux', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 46, name: 'Aïn Témouchent', nameAr: 'عين تموشنت', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 47, name: 'Ghardaïa', nameAr: 'غرداية', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 48, name: 'Relizane', nameAr: 'غليزان', fee: 600, homeDeliveryFee: 600, deskFee: 350, zone: 'ouest', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 49, name: 'Timimoun', nameAr: 'تيميمون', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 50, name: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 51, name: 'Ouled Djellal', nameAr: 'أولاد جلال', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 52, name: 'Béni Abbès', nameAr: 'بني عباس', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
  { code: 53, name: 'In Salah', nameAr: 'عين صالح', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 54, name: 'In Guezzam', nameAr: 'عين قزام', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 55, name: 'Touggourt', nameAr: 'تقرت', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 56, name: 'Djanet', nameAr: 'جانت', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '96h - 120h', isAvailable: true },
  { code: 57, name: "El M'Ghair", nameAr: 'المغير', fee: 900, homeDeliveryFee: 900, deskFee: 500, zone: 'sud', estimatedDays: '48h - 72h', isAvailable: true },
  { code: 58, name: 'El Meniaa', nameAr: 'المنيعة', fee: 900, homeDeliveryFee: 900, deskFee: 600, zone: 'sud', estimatedDays: '72h - 96h', isAvailable: true },
];

export function getWilayaByCode(code: number): AlgerianWilaya | undefined {
  return ALGERIAN_58_WILAYAS.find((w) => w.code === code);
}

export function getWilayaFee(code: number, deliveryType: 'home' | 'desk' = 'home'): number {
  const wilaya = getWilayaByCode(code);
  if (!wilaya) return 600; // Standard national fallback: 600 DA
  return deliveryType === 'desk' ? (wilaya.deskFee ?? 350) : (wilaya.fee ?? wilaya.homeDeliveryFee ?? 600);
}

export function searchWilayas(query: string): AlgerianWilaya[] {
  if (!query || !query.trim()) return ALGERIAN_58_WILAYAS;
  const q = query.trim().toLowerCase();

  // Numeric code search
  const asNumber = parseInt(q, 10);
  if (!isNaN(asNumber) && asNumber >= 1 && asNumber <= 58) {
    const match = ALGERIAN_58_WILAYAS.filter((w) => w.code === asNumber || w.code.toString().startsWith(q));
    if (match.length > 0) return match;
  }

  // Accent folding helper
  const fold = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const foldedQuery = fold(q);

  return ALGERIAN_58_WILAYAS.filter((w) => {
    const foldedName = fold(w.name);
    const matchesFrench = foldedName.includes(foldedQuery);
    const matchesArabic = w.nameAr ? w.nameAr.includes(q) : false;
    const matchesCode = w.code.toString().includes(q);
    return matchesFrench || matchesArabic || matchesCode;
  });
}
