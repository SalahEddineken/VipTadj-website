import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { formatDZD } from '../../helpers/testUtils';
import { Product } from '@/types';

describe('Tier 1: Storefront — Product Detail Page (PDP) Experience (F-SF-05)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: PDP Data Resolution by Slug
  // ==========================================
  it('resolves complete product dossier by unique slug for PDP presentation', async () => {
    const product = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(product).not.toBeNull();
    expect(product?.title).toBe('Costume Deux Pièces en Laine Super 130s');
    expect(product?.price).toBe(48500);
    expect(product?.categoryId).toBe('clothing');
    expect(product?.categorySlug).toBe('vetements');
  });

  // ==========================================
  // Test 2: Multi-Angle High-Resolution Image Gallery
  // ==========================================
  it('provides multi-angle image gallery with primary hero shot and supplementary angles', async () => {
    const product = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(product?.images).toBeDefined();
    expect(product?.images.length).toBeGreaterThanOrEqual(2);

    const primaryImage = product?.images.find((img) => img.isPrimary);
    expect(primaryImage).toBeDefined();
    expect(primaryImage?.url).toContain('https://images.unsplash.com');
    expect(primaryImage?.alt).toBeTruthy();

    const detailImages = product?.images.filter((img) => !img.isPrimary);
    expect(detailImages?.length).toBeGreaterThanOrEqual(1);
  });

  // ==========================================
  // Test 3: Luxury Price & Savings Display
  // ==========================================
  it('formats active price in DZD and calculates discount savings when compareAtPrice is present', async () => {
    const product = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(product).not.toBeNull();

    const formattedPrice = formatDZD(product!.price);
    expect(formattedPrice).toBe('48\u00A0500\u00A0DA');

    if (product?.compareAtPrice) {
      expect(product.compareAtPrice).toBeGreaterThan(product.price);
      const savings = product.compareAtPrice - product.price;
      expect(savings).toBeGreaterThan(0);
      const formattedSavings = formatDZD(savings);
      expect(formattedSavings).toContain('DA');
    }
  });

  // ==========================================
  // Test 4: Size Matrix Selector
  // ==========================================
  it('exposes all purchasable sizes for customer selection', async () => {
    // Clothing suit sizes
    const suit = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(suit?.sizes).toEqual(['48', '50', '52', '54', '56']);

    // Footwear shoe sizes
    const shoe = await mockDataProvider.getProductBySlug('richelieu-one-cut-cuir-veau');
    expect(shoe?.sizes.length).toBeGreaterThanOrEqual(4);
    shoe?.sizes.forEach((s) => {
      const sizeNum = parseInt(s, 10);
      expect(sizeNum).toBeGreaterThanOrEqual(39);
      expect(sizeNum).toBeLessThanOrEqual(45);
    });
  });

  // ==========================================
  // Test 5: Stock Indicator & Inventory Status
  // ==========================================
  it('reports inStock status and available inventory count', async () => {
    const product = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(product?.inStock).toBe(true);
    expect(product?.stockQuantity).toBeGreaterThan(0);

    // Sold out product behavior
    await mockDataProvider.updateProduct(product!.id, {
      stockQuantity: 0,
      inStock: false,
    });

    const outOfStockProduct = await mockDataProvider.getProductById(product!.id);
    expect(outOfStockProduct?.inStock).toBe(false);
    expect(outOfStockProduct?.stockQuantity).toBe(0);
  });

  // ==========================================
  // Test 6: Fabric, Craftsmanship & Care Accordion Content
  // ==========================================
  it('contains detailed French editorial description of fabric, origin, and tailored construction', async () => {
    const product = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(product?.description).toContain('laine');
    expect(product?.description.length).toBeGreaterThanOrEqual(50);
  });
});
