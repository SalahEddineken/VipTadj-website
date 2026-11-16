import { z } from 'zod';

export const wilayaShippingFeeItemSchema = z.object({
  homeFee: z.coerce.number().min(0, 'Le tarif à domicile doit être supérieur ou égal à 0 DA.'),
  deskFee: z.coerce.number().min(0, 'Le tarif point relais doit être supérieur ou égal à 0 DA.'),
  active: z.boolean().default(true),
});

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
  maintenanceMode: z.boolean().optional(),
});

export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
