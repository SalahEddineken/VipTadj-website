import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { productsFixture } from '../../fixtures';
import { Product } from '@/types';

describe('Tier 1: Storefront — Multi-Page Catalog & Faceted Filtering (F-SF-03)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: Category Filter (Clothing / Vêtements)
  // ==========================================
  it('filters catalog items strictly by categoryId: clothing (returns suits, blazers, shirts, coats)', async () => {
    const clothing = await mockDataProvider.getProducts({ categoryId: 'clothing' });
    expect(clothing.length).toBeGreaterThanOrEqual(7);
    clothing.forEach((product: Product) => {
      expect(product.categoryId).toBe('clothing');
      expect(product.categorySlug).toBe('vetements');
    });
  });

  // ==========================================
  // Test 2: Category Filter (Shoes / Chaussures)
  // ==========================================
  it('filters catalog items strictly by categoryId: shoes (returns Oxfords, Derbies, Loafers, Boots)', async () => {
    const shoes = await mockDataProvider.getProducts({ categoryId: 'shoes' });
    expect(shoes.length).toBeGreaterThanOrEqual(5);
    shoes.forEach((product: Product) => {
      expect(product.categoryId).toBe('shoes');
      expect(product.categorySlug).toBe('chaussures');
    });
  });

  // ==========================================
  // Test 3: Category Filter (Accessories / Accessoires)
  // ==========================================
  it('filters catalog items strictly by categoryId: accessories (returns Watches, Ties, Belts, Cufflinks)', async () => {
    const accessories = await mockDataProvider.getProducts({ categoryId: 'accessories' });
    expect(accessories.length).toBeGreaterThanOrEqual(5);
    accessories.forEach((product: Product) => {
      expect(product.categoryId).toBe('accessories');
      expect(product.categorySlug).toBe('accessoires');
    });
  });

  // ==========================================
  // Test 4: Subcategory Faceted Filtering
  // ==========================================
  it('filters catalog accurately by specific subcategory facets', async () => {
    const suits = await mockDataProvider.getProducts({ subcategory: 'costumes' });
    expect(suits.length).toBeGreaterThanOrEqual(2);
    suits.forEach((p) => expect(p.subcategory).toBe('costumes'));

    const blazers = await mockDataProvider.getProducts({ subcategory: 'blazers' });
    expect(blazers.length).toBeGreaterThanOrEqual(1);
    blazers.forEach((p) => expect(p.subcategory).toBe('blazers'));

    const richelieu = await mockDataProvider.getProducts({ subcategory: 'richelieu' });
    expect(richelieu.length).toBeGreaterThanOrEqual(1);
    richelieu.forEach((p) => expect(p.subcategory).toBe('richelieu'));
  });

  // ==========================================
  // Test 5: Size Matrix Filtering
  // ==========================================
  it('filters products by selected size availability', async () => {
    const allProducts = await mockDataProvider.getProducts();

    // Filter clothing available in size 50
    const size50Products = allProducts.filter((p) => p.sizes.includes('50'));
    expect(size50Products.length).toBeGreaterThanOrEqual(2);
    size50Products.forEach((p) => expect(p.sizes).toContain('50'));

    // Filter shoes available in size 42
    const size42Shoes = allProducts.filter((p) => p.categoryId === 'shoes' && p.sizes.includes('42'));
    expect(size42Shoes.length).toBeGreaterThanOrEqual(2);
    size42Shoes.forEach((p) => expect(p.sizes).toContain('42'));
  });

  // ==========================================
  // Test 6: Price Range Slider Filtering
  // ==========================================
  it('filters catalog items within minimum and maximum price boundaries', async () => {
    const budgetFiltered = await mockDataProvider.getProducts({
      minPrice: 15000,
      maxPrice: 35000,
    });

    expect(budgetFiltered.length).toBeGreaterThan(0);
    budgetFiltered.forEach((p) => {
      expect(p.price).toBeGreaterThanOrEqual(15000);
      expect(p.price).toBeLessThanOrEqual(35000);
    });
  });
});
