/**
 * VIP TADJ — Standalone CLI Database Seeder
 * Run with: npm run seed
 */

import fs from 'fs';
import path from 'path';

// Automatically load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    });
  }
} catch {
  // Ignore env read issues
}

async function main() {
  const { getDataStore } = await import('../src/lib/data-provider');
  const { runCatalogSeed } = await import('../src/lib/seed/seed-runner');

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
