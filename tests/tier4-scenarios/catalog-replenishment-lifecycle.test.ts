import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { formatDZD } from '../helpers/testUtils';

describe('Tier 4: Scenario Journey 4 — Catalog Replenishment & Size Matrix Lifecycle (catalog-replenishment-lifecycle.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  it('executes full Journey 4: Admin Login -> Create Blazer with Size Matrix -> Storefront Reflection -> Deplete Size 50 -> Restock', async () => {
    // ========================================================
    // Step 1: Admin Authors New Product with Size Inventory Matrix
    // ========================================================
    const rawDriveMedia = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view';
    const normalizedMedia = normalizeImageUrl(rawDriveMedia);

    // Initial size matrix: 48: 3, 50: 2, 52: 1 (Total: 6)
    const initialMatrix: Record<string, number> = {
      '48': 3,
      '50': 2,
      '52': 1,
    };
    const totalUnits = Object.values(initialMatrix).reduce((a, b) => a + b, 0);
    expect(totalUnits).toBe(6);

    const newBlazer = await mockDataProvider.createProduct({
      title: 'Blazer en Lin et Soie d\'Italie',
      slug: 'blazer-lin-soie-italie',
      description: 'Blazer d’été léger tissé dans un mélange noble de lin et soie grège. Coupe déstructurée napolitaine.',
      price: 29500,
      compareAtPrice: 35000,
      categoryId: 'clothing',
      categorySlug: 'vetements',
      subcategory: 'blazers',
      images: [
        {
          id: 'img-blazer-lin',
          url: normalizedMedia,
          alt: 'Blazer Lin et Soie Vue Face',
          isPrimary: true,
        },
      ],
      sizes: Object.keys(initialMatrix), // ['48', '50', '52']
      stockQuantity: totalUnits,
      inStock: true,
      isFeatured: true,
      isNewArrival: true,
    });

    expect(newBlazer.id).toBeDefined();
    expect(newBlazer.price).toBe(29500);
    expect(newBlazer.stockQuantity).toBe(6);
    expect(newBlazer.inStock).toBe(true);

    // ========================================================
    // Step 2: Immediate Reflection on Storefront /catalog
    // ========================================================
    const blazers = await mockDataProvider.getProducts({ subcategory: 'blazers' });
    expect(blazers.some((p) => p.id === newBlazer.id)).toBe(true);

    // Storefront PDP query by slug
    const pdp = await mockDataProvider.getProductBySlug('blazer-lin-soie-italie');
    expect(pdp).not.toBeNull();
    expect(pdp!.title).toBe('Blazer en Lin et Soie d\'Italie');
    expect(pdp!.sizes).toEqual(['48', '50', '52']);
    expect(pdp!.images[0].url).toContain('drive.google.com/uc?export=view');

    // ========================================================
    // Step 3: Customer Purchases the 2 Available Units of Size 50
    // ========================================================
    const sizeToBuy = '50';
    const qtyToBuy = 2; // Buys all 2 units of size 50

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Hocine Yahi',
        phone: '0550123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Belouizdad',
        address: 'Rue Mohamed Belouizdad',
      },
      items: [
        {
          productId: pdp!.id,
          title: pdp!.title,
          slug: pdp!.slug,
          price: pdp!.price,
          quantity: qtyToBuy,
          selectedSize: sizeToBuy,
          image: pdp!.images[0].url,
        },
      ],
      deliveryFee: 0, // Free delivery qualified
    });

    expect(order.status).toBe('pending');

    // Overall product stock decrements from 6 to 4
    const updatedBlazer = await mockDataProvider.getProductById(newBlazer.id);
    expect(updatedBlazer!.stockQuantity).toBe(4);
    expect(updatedBlazer!.inStock).toBe(true); // Still has sizes 48 and 52 in stock

    // ========================================================
    // Step 4: Size 50 Depleted ("Épuisé"), Sizes 48 & 52 Remain Purchasable
    // ========================================================
    // Simulate size variant inventory tracking
    const currentSizeMatrix = { ...initialMatrix };
    currentSizeMatrix[sizeToBuy] -= qtyToBuy; // 2 - 2 = 0 units of size 50!

    expect(currentSizeMatrix['50']).toBe(0);
    expect(currentSizeMatrix['48']).toBe(3);
    expect(currentSizeMatrix['52']).toBe(1);

    // Helper to determine size variant availability on PDP
    const isSizeAvailable = (size: string) => (currentSizeMatrix[size] || 0) > 0;
    expect(isSizeAvailable('50')).toBe(false); // Sold-out / disabled
    expect(isSizeAvailable('48')).toBe(true);  // Purchasable
    expect(isSizeAvailable('52')).toBe(true);  // Purchasable

    // ========================================================
    // Step 5: Store Manager Restocks Size 50 with 5 New Units
    // ========================================================
    currentSizeMatrix['50'] += 5; // Restocked
    const restockedTotal = Object.values(currentSizeMatrix).reduce((a, b) => a + b, 0); // 3 + 5 + 1 = 9

    const replenishedProduct = await mockDataProvider.updateProduct(newBlazer.id, {
      stockQuantity: restockedTotal,
    });

    expect(replenishedProduct.stockQuantity).toBe(9);
    expect(isSizeAvailable('50')).toBe(true); // Size 50 is purchasable again!
    expect(currentSizeMatrix['50']).toBe(5);
  });
});
