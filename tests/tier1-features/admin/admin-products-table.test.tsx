import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { formatDZD } from '../../helpers/testUtils';
import { Product } from '@/types';

describe('Tier 1: Admin — Product Catalog Management Table (F-ADM-03)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: Product List Retrieval & Column Layout
  // ==========================================
  it('retrieves and displays products with title, category, price, thumbnail, and stock columns', async () => {
    const products = await mockDataProvider.getProducts();
    expect(products.length).toBeGreaterThanOrEqual(18);

    products.forEach((p: Product) => {
      expect(p.id).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.categorySlug).toMatch(/^(vetements|chaussures|accessoires)$/);
      expect(p.price).toBeGreaterThan(0);
      expect(p.images.length).toBeGreaterThan(0);
      expect(p.images[0].url).toBeTruthy();
    });
  });

  // ==========================================
  // Test 2: Algerian Dinar Price Formatting
  // ==========================================
  it('formats product table prices in DZD currency with DA suffix and thousands grouping', async () => {
    const products = await mockDataProvider.getProducts();
    const firstProduct = products[0];

    const formatted = formatDZD(firstProduct.price);
    expect(formatted).toMatch(/DA$/);
    expect(formatted).toContain('\u00A0');
  });

  // ==========================================
  // Test 3: Stock Matrix Inventory Summary
  // ==========================================
  it('displays accurate stock quantity summary and in-stock badges', async () => {
    const products = await mockDataProvider.getProducts();

    products.forEach((p) => {
      expect(typeof p.stockQuantity).toBe('number');
      expect(p.stockQuantity).toBeGreaterThanOrEqual(0);
      expect(typeof p.inStock).toBe('boolean');
      expect(p.inStock).toBe(p.stockQuantity > 0);
    });
  });

  // ==========================================
  // Test 4: Active / Draft (InStock) Toggle
  // ==========================================
  it('toggles product active/draft visibility by updating stockQuantity and inStock flag', async () => {
    const suit = await mockDataProvider.getProductById('prod-001');
    expect(suit).not.toBeNull();
    expect(suit?.inStock).toBe(true);

    // Toggle to draft (out of stock / deactivated)
    const deactivated = await mockDataProvider.updateProduct('prod-001', {
      stockQuantity: 0,
    });
    expect(deactivated.inStock).toBe(false);
    expect(deactivated.stockQuantity).toBe(0);

    // Verify persisted state
    const checkState = await mockDataProvider.getProductById('prod-001');
    expect(checkState?.inStock).toBe(false);

    // Toggle back to active
    const reactivated = await mockDataProvider.updateProduct('prod-001', {
      stockQuantity: 10,
    });
    expect(reactivated.inStock).toBe(true);
    expect(reactivated.stockQuantity).toBe(10);
  });

  // ==========================================
  // Test 5: Delete Product from Management Table
  // ==========================================
  it('deletes a product from the catalog table with confirmation', async () => {
    const initialProducts = await mockDataProvider.getProducts();
    const countBefore = initialProducts.length;

    const success = await mockDataProvider.deleteProduct('prod-001');
    expect(success).toBe(true);

    const postDeleteProducts = await mockDataProvider.getProducts();
    expect(postDeleteProducts).toHaveLength(countBefore - 1);

    const verifyGone = await mockDataProvider.getProductById('prod-001');
    expect(verifyGone).toBeNull();
  });

  // ==========================================
  // Test 6: Category Filter Tabs in Management View
  // ==========================================
  it('filters product table by category tabs (Tous, Vêtements, Chaussures, Accessoires)', async () => {
    const all = await mockDataProvider.getProducts();
    const clothingOnly = await mockDataProvider.getProducts({ categoryId: 'clothing' });
    const shoesOnly = await mockDataProvider.getProducts({ categoryId: 'shoes' });
    const accessoriesOnly = await mockDataProvider.getProducts({ categoryId: 'accessories' });

    expect(clothingOnly.length).toBeGreaterThan(0);
    expect(shoesOnly.length).toBeGreaterThan(0);
    expect(accessoriesOnly.length).toBeGreaterThan(0);
    expect(clothingOnly.length + shoesOnly.length + accessoriesOnly.length).toBe(all.length);
  });
});
