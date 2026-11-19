/**
 * VIP TADJ — Idempotent Catalog & Settings Seeder
 * Populates Firestore or in-memory mock store with categories, 18 products, and settings.
 */

import { IDataStore } from '@/lib/data-provider/interface';
import { SEED_CATEGORIES, SEED_PRODUCTS, DEFAULT_STORE_SETTINGS } from './seed-data';

export interface SeedResult {
  success: boolean;
  mode: 'firestore' | 'mock';
  categoriesCount: number;
  productsCount: number;
  settingsUpdated: boolean;
  message: string;
}

export async function runCatalogSeed(dataStore: IDataStore, force = true): Promise<SeedResult> {
  const mode = dataStore.mode;
  console.log(`[VIP TADJ SEED] Démarrage du peuplement en mode: ${mode.toUpperCase()} (force=${force})`);

  // 1. Seed or reinitialize catalog via dataStore abstraction
  const seedOutcome = await dataStore.seedCatalog(force);

  // 2. Initialize default store settings (Wilaya delivery fees)
  let settingsUpdated = false;
  try {
    const currentSettings = await dataStore.getSettings();
    if (!currentSettings || force || Object.keys(currentSettings.wilayaShippingFees || {}).length === 0) {
      await dataStore.updateSettings(DEFAULT_STORE_SETTINGS);
      settingsUpdated = true;
    }
  } catch (err) {
    console.warn('[VIP TADJ SEED] Avertissement lors de la mise à jour des paramètres du magasin:', err);
  }

  const isOutcomeSuccess = seedOutcome.success;
  const isIdempotentSkip = !force && !isOutcomeSuccess;
  const defaultSuccessMessage = `Catalogue VIP TADJ peuplé avec succès (${SEED_PRODUCTS.length} produits, ${SEED_CATEGORIES.length} catégories, 68 wilayas configurées).`;
  const defaultSkippedMessage = seedOutcome.message || 'Peuplement ignoré : le catalogue est déjà initialisé (utilisez force=true pour réinitialiser).';

  const result: SeedResult = {
    success: isOutcomeSuccess || isIdempotentSkip,
    mode,
    categoriesCount: isOutcomeSuccess ? SEED_CATEGORIES.length : 0,
    productsCount: isOutcomeSuccess ? (seedOutcome.count ?? SEED_PRODUCTS.length) : (seedOutcome.count ?? 0),
    settingsUpdated,
    message: isOutcomeSuccess ? (seedOutcome.message || defaultSuccessMessage) : defaultSkippedMessage,
  };

  if (isOutcomeSuccess || isIdempotentSkip) {
    console.log(`[VIP TADJ SEED] Terminé avec succès: ${result.message}`);
  } else {
    console.log(`[VIP TADJ SEED] Peuplement échoué: ${result.message}`);
  }
  return result;
}
