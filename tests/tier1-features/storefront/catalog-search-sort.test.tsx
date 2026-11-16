import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { Product } from '@/types';

describe('Tier 1: Storefront — Catalog Search & Sorting (F-SF-04)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: Title Keyword Search
  // ==========================================
  it('searches products by title keyword with exact and partial matching', async () => {
    const results = await mockDataProvider.getProducts({ search: 'Costume' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    results.forEach((p) => {
      const match =
        p.title.toLowerCase().includes('costume') ||
        p.description.toLowerCase().includes('costume') ||
        p.subcategory.toLowerCase().includes('costume');
      expect(match).toBe(true);
    });
  });

  // ==========================================
  // Test 2: Description Keyword Search (Luxury Materials)
  // ==========================================
  it('searches products by material terms in description (laine, cuir, soie, cachemire)', async () => {
    const woolResults = await mockDataProvider.getProducts({ search: 'laine' });
    expect(woolResults.length).toBeGreaterThan(0);
    woolResults.forEach((p) => {
      const matches = p.title.toLowerCase().includes('laine') || p.description.toLowerCase().includes('laine');
      expect(matches).toBe(true);
    });
  });

  // ==========================================
  // Test 3: Case-Insensitive Search Handling
  // ==========================================
  it('handles search queries in uppercase, lowercase, and mixed case identically', async () => {
    const lowerResults = await mockDataProvider.getProducts({ search: 'blazer' });
    const upperResults = await mockDataProvider.getProducts({ search: 'BLAZER' });
    const mixedResults = await mockDataProvider.getProducts({ search: 'BlAzEr' });

    expect(lowerResults.length).toBeGreaterThan(0);
    expect(upperResults.length).toBe(lowerResults.length);
    expect(mixedResults.length).toBe(lowerResults.length);
  });

  // ==========================================
  // Test 4: Price Ascending Sorting (Low to High)
  // ==========================================
  it('sorts catalog items by price in ascending order (price-asc)', async () => {
    const sortedAsc = await mockDataProvider.getProducts({ sortBy: 'price-asc' });
    expect(sortedAsc.length).toBeGreaterThanOrEqual(18);

    for (let i = 0; i < sortedAsc.length - 1; i++) {
      expect(sortedAsc[i].price).toBeLessThanOrEqual(sortedAsc[i + 1].price);
    }
  });

  // ==========================================
  // Test 5: Price Descending Sorting (High to Low)
  // ==========================================
  it('sorts catalog items by price in descending order (price-desc)', async () => {
    const sortedDesc = await mockDataProvider.getProducts({ sortBy: 'price-desc' });
    expect(sortedDesc.length).toBeGreaterThanOrEqual(18);

    for (let i = 0; i < sortedDesc.length - 1; i++) {
      expect(sortedDesc[i].price).toBeGreaterThanOrEqual(sortedDesc[i + 1].price);
    }
  });

  // ==========================================
  // Test 6: Newest Arrivals Sorting
  // ==========================================
  it('sorts catalog items by creation date (newest first)', async () => {
    const sortedNewest = await mockDataProvider.getProducts({ sortBy: 'newest' });
    expect(sortedNewest.length).toBeGreaterThanOrEqual(18);

    for (let i = 0; i < sortedNewest.length - 1; i++) {
      const timeCurrent = new Date(sortedNewest[i].createdAt).getTime();
      const timeNext = new Date(sortedNewest[i + 1].createdAt).getTime();
      expect(timeCurrent).toBeGreaterThanOrEqual(timeNext);
    }
  });

  // ==========================================
  // Test 7: Zero Results Handling
  // ==========================================
  it('returns an empty array when search query matches no products in catalog', async () => {
    const noResults = await mockDataProvider.getProducts({ search: 'terme-inconnu-inexistant-12345' });
    expect(noResults).toHaveLength(0);
  });
});
