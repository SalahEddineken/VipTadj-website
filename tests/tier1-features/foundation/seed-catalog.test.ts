import { describe, it, expect, beforeEach } from 'vitest';
import { SEED_PRODUCTS, SEED_CATEGORIES, DEFAULT_STORE_SETTINGS } from '@/lib/seed/seed-data';
import { runCatalogSeed } from '@/lib/seed/seed-runner';
import { MockSeedDataProvider } from '@/lib/data-provider/mock-provider';
import { formatDZD } from '@/lib/utils/formatDZD';

describe('Tier 1: Foundation — Realistic Seed Catalog & Seed Runner (F-FOUND-05, F-FOUND-06)', () => {
  let mockProvider: MockSeedDataProvider;

  beforeEach(() => {
    mockProvider = new MockSeedDataProvider();
  });

  // ==========================================
  // Test 1: Luxury Menswear Products
  // ==========================================
  it('contains curated luxury menswear seed items', () => {
    expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(18);
    // Slugs and IDs must be completely unique
    const ids = new Set(SEED_PRODUCTS.map((p) => p.id));
    const slugs = new Set(SEED_PRODUCTS.map((p) => p.slug));
    expect(ids.size).toBe(SEED_PRODUCTS.length);
    expect(slugs.size).toBe(SEED_PRODUCTS.length);
  });

  // ==========================================
  // Test 2: Category Distribution
  // ==========================================
  it('distributes items across the 3 core luxury categories: clothing, shoes, accessories', () => {
    const clothing = SEED_PRODUCTS.filter((p) => p.categoryId === 'clothing');
    const shoes = SEED_PRODUCTS.filter((p) => p.categoryId === 'shoes');
    const accessories = SEED_PRODUCTS.filter((p) => p.categoryId === 'accessories');

    expect(clothing.length).toBeGreaterThanOrEqual(7);
    expect(shoes.length).toBeGreaterThanOrEqual(5);
    expect(accessories.length).toBeGreaterThanOrEqual(6);

    expect(SEED_CATEGORIES).toHaveLength(3);
    const categorySlugs = SEED_CATEGORIES.map((c) => c.slug);
    expect(categorySlugs).toContain('vetements');
    expect(categorySlugs).toContain('chaussures');
    expect(categorySlugs).toContain('accessoires');
  });

  // ==========================================
  // Test 3: Realistic Algerian DZD Pricing
  // ==========================================
  it('features realistic luxury DZD prices between 9,500 DA and 75,000 DA', () => {
    SEED_PRODUCTS.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(9500);
      expect(p.price).toBeLessThanOrEqual(75000);

      const formatted = formatDZD(p.price);
      expect(formatted).toMatch(/DA$/);
      expect(formatted).toContain('\u00A0'); // non-breaking space
    });
  });

  // ==========================================
  // Test 4: Inventory & In-Stock Flags
  // ==========================================
  it('sets inStock to true with positive stock quantities for all seed products', () => {
    SEED_PRODUCTS.forEach((p) => {
      expect(p.inStock).toBe(true);
      expect(p.stockQuantity).toBeGreaterThan(0);
      expect(p.sizes.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Test 5: Seed Runner Idempotency
  // ==========================================
  it('executes seed initialization idempotently without creating duplicate products', async () => {
    // First run
    const result1 = await runCatalogSeed(mockProvider, true);
    expect(result1.success).toBe(true);
    expect(result1.productsCount).toBe(SEED_PRODUCTS.length);

    const products1 = await mockProvider.getProducts();
    expect(products1).toHaveLength(SEED_PRODUCTS.length);

    // Second run with force: false (idempotent skip or re-verify)
    const result2 = await runCatalogSeed(mockProvider, false);
    expect(result2.success).toBe(true);

    const products2 = await mockProvider.getProducts();
    expect(products2).toHaveLength(SEED_PRODUCTS.length);
  });

  // ==========================================
  // Test 6: Default Store Settings Seeding
  // ==========================================
  it('seeds default store settings with all 58 Wilaya shipping tariffs and threshold', async () => {
    await runCatalogSeed(mockProvider, true);
    const settings = await mockProvider.getSettings();

    expect(settings.storeName).toBe('VIP TADJ');
    expect(settings.freeShippingThreshold).toBe(DEFAULT_STORE_SETTINGS.freeShippingThreshold);
    expect(Object.keys(settings.wilayaShippingFees)).toHaveLength(58);
    // Alger delivery fee checks
    expect(settings.wilayaShippingFees[16].homeFee).toBe(400);
    expect(settings.wilayaShippingFees[16].deskFee).toBe(250);
  });
});
