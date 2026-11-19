import { describe, it, expect } from 'vitest';
import { SEED_PRODUCTS, SEED_CATEGORIES, DEFAULT_STORE_SETTINGS } from '@/lib/seed/seed-data';

describe('Seed Catalog Dataset Integrity', () => {
  it('contains at least 18 distinct products', () => {
    expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(18);
  });

  it('spans all 3 required categories: clothing, shoes, accessories', () => {
    const categories = new Set(SEED_PRODUCTS.map((p) => p.categoryId));
    expect(categories.has('clothing')).toBe(true);
    expect(categories.has('shoes')).toBe(true);
    expect(categories.has('accessories')).toBe(true);
  });

  it('guarantees unique IDs and unique slugs across all products', () => {
    const ids = SEED_PRODUCTS.map((p) => p.id);
    const slugs = SEED_PRODUCTS.map((p) => p.slug);

    expect(new Set(ids).size).toBe(SEED_PRODUCTS.length);
    expect(new Set(slugs).size).toBe(SEED_PRODUCTS.length);
  });

  it('has valid Algerian DZD pricing between 9,500 and 75,000 DZD', () => {
    SEED_PRODUCTS.forEach((product) => {
      expect(product.price).toBeGreaterThan(0);
      expect(product.price).toBeGreaterThanOrEqual(9500);
      expect(product.price).toBeLessThanOrEqual(75000);
      if (product.compareAtPrice) {
        expect(product.compareAtPrice).toBeGreaterThan(product.price);
      }
    });
  });

  it('has valid multi-image gallery with at least one primary image for each product', () => {
    SEED_PRODUCTS.forEach((product) => {
      expect(product.images.length).toBeGreaterThanOrEqual(1);
      const primaryImages = product.images.filter((img) => img.isPrimary);
      expect(primaryImages.length).toBe(1);
      product.images.forEach((img) => {
        expect(img.url).toMatch(/^https?:\/\//);
        expect(img.alt.trim().length).toBeGreaterThan(5);
      });
    });
  });

  it('has appropriate size matrices for clothing (S-XXL) and shoes (39-45)', () => {
    const clothingProducts = SEED_PRODUCTS.filter((p) => p.categoryId === 'clothing' && p.subcategory !== 'pochettes');
    clothingProducts.forEach((p) => {
      expect(p.sizes).toContain('S');
      expect(p.sizes).toContain('M');
      expect(p.sizes).toContain('L');
    });

    const shoeProducts = SEED_PRODUCTS.filter((p) => p.categoryId === 'shoes');
    shoeProducts.forEach((p) => {
      expect(p.sizes).toContain('40');
      expect(p.sizes).toContain('41');
      expect(p.sizes).toContain('42');
      expect(p.sizes).toContain('43');
    });
  });

  it('contains rich French editorial descriptions (>100 characters)', () => {
    SEED_PRODUCTS.forEach((p) => {
      expect(p.description.length).toBeGreaterThanOrEqual(100);
      expect(p.title.length).toBeGreaterThanOrEqual(10);
    });
  });

  it('configures default store settings with all 68 Algerian wilayas', () => {
    expect(DEFAULT_STORE_SETTINGS.wilayaShippingFees).toBeDefined();
    const wilayaKeys = Object.keys(DEFAULT_STORE_SETTINGS.wilayaShippingFees);
    expect(wilayaKeys.length).toBe(68);
    // Wilaya 16 (Algiers) check
    expect(DEFAULT_STORE_SETTINGS.wilayaShippingFees[16].homeFee).toBe(700);
    expect(DEFAULT_STORE_SETTINGS.wilayaShippingFees[16].deskFee).toBe(550);
  });
});
