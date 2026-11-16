import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { formatDZD } from '../helpers/testUtils';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';

describe('Tier 3: Combinations — Admin Edit to Storefront PDP Reflection (admin-edit-storefront-pdp.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Combination 1: Admin Price Update Reflections on PDP
  // ==========================================
  it('reflects admin price adjustments immediately on storefront PDP lookup and formatted currency', async () => {
    // 1. Initial storefront state for prod-001
    const original = await mockDataProvider.getProductById('prod-001');
    expect(original!.price).toBe(48500);
    expect(formatDZD(original!.price)).toContain('48');

    // 2. Admin adjusts price to 52,000 DA with compareAtPrice 58,000 DA
    const updated = await mockDataProvider.updateProduct('prod-001', {
      price: 52000,
      compareAtPrice: 58000,
    });
    expect(updated.price).toBe(52000);

    // 3. Storefront PDP query by slug
    const pdpProduct = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
    expect(pdpProduct).not.toBeNull();
    expect(pdpProduct!.price).toBe(52000);
    expect(pdpProduct!.compareAtPrice).toBe(58000);

    // Formatted luxury display
    expect(formatDZD(pdpProduct!.price)).toContain('52');
    expect(formatDZD(pdpProduct!.price)).toContain('000');
  });

  // ==========================================
  // Combination 2: Admin Stock Depletion & Sold-Out PDP State
  // ==========================================
  it('synchronizes zero-stock updates from admin to storefront PDP out-of-stock badge', async () => {
    // 1. Initial in-stock product
    const product = await mockDataProvider.getProductById('prod-002');
    expect(product!.inStock).toBe(true);

    // 2. Admin marks stock to 0 (all sold out)
    await mockDataProvider.updateProduct('prod-002', {
      stockQuantity: 0,
    });

    // 3. Storefront PDP views product
    const pdpView = await mockDataProvider.getProductById('prod-002');
    expect(pdpView!.stockQuantity).toBe(0);
    expect(pdpView!.inStock).toBe(false);

    // Filter for storefront catalog
    const inStockCatalog = await mockDataProvider.getProducts({ inStock: true });
    expect(inStockCatalog.some((p) => p.id === 'prod-002')).toBe(false);
  });

  // ==========================================
  // Combination 3: Admin Size Matrix Reconfiguration
  // ==========================================
  it('updates available size choices on storefront PDP when admin edits product size matrix', async () => {
    const product = await mockDataProvider.getProductById('prod-001');
    expect(product!.sizes).toContain('48');
    expect(product!.sizes).toContain('50');

    // Admin restructures available sizes (e.g. only 50 and 52 remain in luxury stock)
    const newSizes = ['50', '52'];
    await mockDataProvider.updateProduct('prod-001', {
      sizes: newSizes,
    });

    // Storefront PDP checks available sizes
    const pdpProduct = await mockDataProvider.getProductById('prod-001');
    expect(pdpProduct!.sizes).toEqual(['50', '52']);
    expect(pdpProduct!.sizes).not.toContain('48');
    expect(pdpProduct!.sizes).not.toContain('54');
  });

  // ==========================================
  // Combination 4: Admin Slug Renaming & SEO Route Reflection
  // ==========================================
  it('retrieves updated product under new slug and invalidates old slug on storefront routing', async () => {
    const oldSlug = 'chemise-formelle-coton-egyptien';
    const newSlug = 'chemise-luxe-popeline-coton-giza-egyptien';

    // Verify initial lookup by old slug
    const initial = await mockDataProvider.getProductBySlug(oldSlug);
    expect(initial).not.toBeNull();
    const productId = initial!.id;

    // Admin updates slug & title
    await mockDataProvider.updateProduct(productId, {
      title: 'Chemise de Luxe en Popeline de Coton Giza Égyptien',
      slug: newSlug,
    });

    // Old slug query now returns null
    const oldQuery = await mockDataProvider.getProductBySlug(oldSlug);
    expect(oldQuery).toBeNull();

    // New slug query returns the updated product
    const newQuery = await mockDataProvider.getProductBySlug(newSlug);
    expect(newQuery).not.toBeNull();
    expect(newQuery!.id).toBe(productId);
    expect(newQuery!.title).toContain('Giza Égyptien');
  });

  // ==========================================
  // Combination 5: Admin Media Gallery Update & Normalizer Pipeline
  // ==========================================
  it('normalizes new media links uploaded by admin and feeds direct stream URLs to PDP gallery', async () => {
    const rawDriveLink = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view?usp=sharing';
    const normalizedExpected = 'https://drive.google.com/uc?export=view&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';

    // Admin attaches Google Drive embed image to product
    await mockDataProvider.updateProduct('prod-001', {
      images: [
        {
          id: 'drive-img-1',
          url: rawDriveLink,
          alt: 'Costume Vue Face Haute Définition',
          isPrimary: true,
        },
      ],
    });

    // Storefront PDP retrieves product and passes image to normalizer
    const pdpProduct = await mockDataProvider.getProductById('prod-001');
    expect(pdpProduct!.images).toHaveLength(1);

    const primaryImageUrl = pdpProduct!.images[0].url;
    const finalStreamUrl = normalizeImageUrl(primaryImageUrl);
    expect(finalStreamUrl).toBe(normalizedExpected);
  });
});
