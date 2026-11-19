import { z } from 'zod';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/locales';

export const wilayaShippingFeeItemSchema = z.object({
  homeFee: z.coerce.number().min(0, 'Le tarif à domicile doit être supérieur ou égal à 0 DA.'),
  deskFee: z.coerce.number().min(0, 'Le tarif point relais doit être supérieur ou égal à 0 DA.'),
  active: z.boolean().default(true),
});

export const communeShippingFeeItemSchema = z.object({
  homeFee: z.coerce.number().min(0, 'Le tarif à domicile doit être supérieur ou égal à 0 DA.').optional(),
  deskFee: z.coerce.number().min(0, 'Le tarif point relais doit être supérieur ou égal à 0 DA.').optional(),
  active: z.boolean().optional(),
});

export const heroVideoSchema = z.object({
  enabled: z.boolean().default(true),
  videoUrl: z.string().optional().default('/videos/20261117_170900.mp4'),
  posterUrl: z.string().optional().default(''),
  overlayOpacity: z.coerce.number().min(0).max(100).default(65),
  playbackRate: z.coerce.number().min(0.25).max(2.0).default(1.0),
}).optional();

export const featuredSectionSchema = z.object({
  enabled: z.boolean().default(true),
  title: z.string().optional(),
  titleAr: z.string().optional(),
  titleEn: z.string().optional(),
  productIds: z.array(z.string()).optional(),
}).optional();

export const updateStoreSettingsSchema = z.object({
  storeName: z.string().min(2, 'Le nom de la boutique est obligatoire.').optional(),
  tagline: z.string().optional(),
  phone: z.string().min(9, 'Numéro de téléphone requis.').optional(),
  email: z.string().email('Adresse email valide requise.').optional(),
  whatsappNumber: z.string().optional(),
  address: z.string().min(5, 'Adresse requise.').optional(),
  currency: z.string().default('DZD').optional(),
  currencySymbol: z.string().default('DA').optional(),
  freeShippingThreshold: z.coerce.number().min(0, 'Le seuil de gratuité doit être positif ou nul.').optional(),
  wilayaShippingFees: z.record(z.coerce.number(), wilayaShippingFeeItemSchema).optional(),
  communeShippingFees: z.record(z.string(), communeShippingFeeItemSchema).optional(),
  heroVideo: heroVideoSchema,
  featuredSection: featuredSectionSchema,
  maintenanceMode: z.boolean().optional(),
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;

export function getSettingsValidationError(
  issue: z.ZodIssue,
  language: SupportedLanguage = 'fr'
): { errorCode: string; errorKey: string; message: string } {
  const field = issue.path[0] ? String(issue.path[0]) : 'general';
  const subField = issue.path[2] ? String(issue.path[2]) : '';

  let errorCode = 'INVALID_SETTINGS';
  let errorKey = 'api.error.invalid_settings';

  if (field === 'wilayaShippingFees' || field === 'communeShippingFees') {
    if (subField === 'deskFee') {
      errorCode = 'SETTINGS_DESK_FEE_MIN';
      errorKey = 'validation.settings.desk_fee_min';
    } else if (subField === 'homeFee') {
      errorCode = 'SETTINGS_HOME_FEE_MIN';
      errorKey = 'validation.settings.home_fee_min';
    }
  } else if (field === 'storeName') {
    errorCode = 'SETTINGS_STORE_NAME_REQUIRED';
    errorKey = 'validation.settings.store_name_required';
  } else if (field === 'phone') {
    errorCode = 'SETTINGS_PHONE_REQUIRED';
    errorKey = 'validation.settings.phone_required';
  } else if (field === 'email') {
    errorCode = 'SETTINGS_EMAIL_INVALID';
    errorKey = 'validation.settings.email_invalid';
  } else if (field === 'address') {
    errorCode = 'SETTINGS_ADDRESS_REQUIRED';
    errorKey = 'validation.settings.address_required';
  } else if (field === 'freeShippingThreshold') {
    errorCode = 'SETTINGS_THRESHOLD_MIN';
    errorKey = 'validation.settings.threshold_min';
  } else if (field === 'heroVideo') {
    const heroSubField = issue.path[1] ? String(issue.path[1]) : '';
    if (heroSubField === 'overlayOpacity') {
      errorCode = 'SETTINGS_HERO_OVERLAY_RANGE';
      errorKey = 'validation.settings.hero_overlay_range';
    } else if (heroSubField === 'playbackRate') {
      errorCode = 'SETTINGS_HERO_PLAYBACK_RANGE';
      errorKey = 'validation.settings.hero_playback_range';
    } else if (heroSubField === 'videoUrl') {
      errorCode = 'SETTINGS_HERO_VIDEO_URL';
      errorKey = 'validation.settings.hero_video_url';
    } else if (heroSubField === 'posterUrl') {
      errorCode = 'SETTINGS_HERO_POSTER_URL';
      errorKey = 'validation.settings.hero_poster_url';
    }
  }

  return {
    errorCode,
    errorKey,
    message: getTranslation(language, errorKey, issue.message),
  };
}

export function validateStoreSettings(
  data: unknown,
  language?: SupportedLanguage
): {
  valid: boolean;
  error?: string;
  errorCode?: string;
  errorKey?: string;
  errors?: Record<string, string>;
  errorKeys?: Record<string, string>;
  issues?: z.ZodIssue[];
  data?: UpdateStoreSettingsInput;
} {
  const result = updateStoreSettingsSchema.safeParse(data);
  if (!result.success) {
    const firstMapped = getSettingsValidationError(result.error.issues[0], language || 'fr');
    const errors: Record<string, string> = {};
    const errorKeys: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || 'general';
      const mapped = getSettingsValidationError(issue, language || 'fr');
      if (!errors[key]) {
        errors[key] = language ? mapped.message : issue.message;
        errorKeys[key] = mapped.errorKey;
      }
    }
    return {
      valid: false,
      error: language ? firstMapped.message : result.error.issues[0]?.message,
      errorCode: firstMapped.errorCode,
      errorKey: firstMapped.errorKey,
      errors,
      errorKeys,
      issues: result.error.issues,
    };
  }
  return { valid: true, data: result.data };
}
