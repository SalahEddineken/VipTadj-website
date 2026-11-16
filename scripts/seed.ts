/**
 * VIP TADJ — Standalone CLI Database Seeder
 * Run with: npx tsx scripts/seed.ts
 */

import { getDataStore } from '../src/lib/data-provider';
import { runCatalogSeed } from '../src/lib/seed/seed-runner';

async function main() {
  console.log('====================================================');
  console.log('       VIP TADJ — SEED RUNNER HAUTE COUTURE         ');
  console.log('====================================================');

  try {
    const dataStore = getDataStore();
    console.log(`[INFO] Mode de stockage détecté : ${dataStore.mode.toUpperCase()}`);

    const result = await runCatalogSeed(dataStore, true);

    console.log('----------------------------------------------------');
    console.log(`✅ Succès : ${result.message}`);
    console.log(`📦 Catégories créées : ${result.categoriesCount}`);
    console.log(`👔 Produits insérés  : ${result.productsCount}`);
    console.log(`🚚 Wilayas configurées : 58`);
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Échec du peuplement VIP TADJ :', error);
    process.exit(1);
  }
}

main();
