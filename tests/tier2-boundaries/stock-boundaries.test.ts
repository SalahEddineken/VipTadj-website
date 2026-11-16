import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { Product } from '../fixtures/types';

describe('Tier 2: Boundary & Corner Cases — Stock Boundaries (stock-boundaries.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // 1. Zero Stock Product & InStock Flag
  // ==========================================
  it('identifies zero-stock items with inStock=false and excludes them from inStock queries', async () => {
    // Create an exclusive product with 0 stock
    const outOfStockProduct = await mockDataProvider.createProduct({
      title: 'Smoking Sur-Mesure Édition Limitée',
      slug: 'smoking-sur-mesure-edition-limitee',
      description: 'Smoking en satin de soie noir, pièce de collection numérotée.',
      price: 95000,
      categoryId: 'clothing',
      categorySlug: 'vetements',
      subcategory: 'costumes',
      images: [
        {
          id: 'smoking-1',
          url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
          alt: 'Smoking',
          isPrimary: true,
        },
      ],
      sizes: ['50', '52'],
      stockQuantity: 0,
      inStock: false,
      isFeatured: false,
      isNewArrival: false,
    });

    expect(outOfStockProduct.stockQuantity).toBe(0);
    expect(outOfStockProduct.inStock).toBe(false);

    // Query inStock: true should NOT include this product
    const inStockList = await mockDataProvider.getProducts({ inStock: true });
    expect(inStockList.some((p) => p.id === outOfStockProduct.id)).toBe(false);

    // Query inStock: false SHOULD include this product
    const outOfStockList = await mockDataProvider.getProducts({ inStock: false });
    expect(outOfStockList.some((p) => p.id === outOfStockProduct.id)).toBe(true);
  });

  // ==========================================
  // 2. Purchasing the Exact Last Available Item
  // ==========================================
  it('decrements stock from 1 to 0 and flips inStock to false when purchasing the last available unit', async () => {
    // Create product with exactly 1 unit in stock
    const lastItemProduct = await mockDataProvider.createProduct({
      title: 'Montre Tourbillon Or Blanc (Dernière Pièce)',
      slug: 'montre-tourbillon-or-blanc-derniere-piece',
      description: 'Dernière pièce disponible en boutique.',
      price: 250000,
      categoryId: 'accessories',
      categorySlug: 'accessoires',
      subcategory: 'montres',
      images: [
        {
          id: 'watch-last-1',
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
          alt: 'Montre Tourbillon',
          isPrimary: true,
        },
      ],
      sizes: ['Unique'],
      stockQuantity: 1,
      inStock: true,
      isFeatured: true,
      isNewArrival: false,
    });

    expect(lastItemProduct.stockQuantity).toBe(1);
    expect(lastItemProduct.inStock).toBe(true);

    // Place order for the exact 1 remaining unit
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Sofiane Feghouli',
        phone: '0550112233',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'El Biar',
        address: 'Boulevard Colonel Bougara',
      },
      items: [
        {
          productId: lastItemProduct.id,
          title: lastItemProduct.title,
          slug: lastItemProduct.slug,
          price: lastItemProduct.price,
          quantity: 1,
          selectedSize: 'Unique',
          image: lastItemProduct.images[0].url,
        },
      ],
      deliveryFee: 400,
    });

    expect(order.status).toBe('pending');

    // Verify stock is now 0 and inStock is false
    const updatedProduct = await mockDataProvider.getProductById(lastItemProduct.id);
    expect(updatedProduct).not.toBeNull();
    expect(updatedProduct!.stockQuantity).toBe(0);
    expect(updatedProduct!.inStock).toBe(false);
  });

  // ==========================================
  // 3. Stock Floor at Zero (Never Negative)
  // ==========================================
  it('ensures stock quantity is strictly floored at 0 and never becomes negative under over-order', async () => {
    const limitedProduct = await mockDataProvider.createProduct({
      title: 'Ceinture Cuir Pleine Fleur Boucle Or',
      slug: 'ceinture-cuir-pleine-fleur-boucle-or',
      description: 'Cuir italien pleine fleur.',
      price: 6500,
      categoryId: 'accessories',
      categorySlug: 'accessoires',
      subcategory: 'ceintures',
      images: [
        {
          id: 'belt-1',
          url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
          alt: 'Ceinture',
          isPrimary: true,
        },
      ],
      sizes: ['95'],
      stockQuantity: 2,
      inStock: true,
      isFeatured: false,
      isNewArrival: false,
    });

    // Attempt to order 5 units when only 2 exist
    await mockDataProvider.createOrder({
      customer: {
        fullName: 'Amine Gouiri',
        phone: '0661998877',
        wilaya: 'Oran',
        wilayaCode: 31,
        commune: 'Canastel',
        address: 'Résidence Bel Air',
      },
      items: [
        {
          productId: limitedProduct.id,
          title: limitedProduct.title,
          slug: limitedProduct.slug,
          price: limitedProduct.price,
          quantity: 5, // Exceeds available stock of 2
          selectedSize: '95',
          image: limitedProduct.images[0].url,
        },
      ],
      deliveryFee: 600,
    });

    const refreshed = await mockDataProvider.getProductById(limitedProduct.id);
    expect(refreshed!.stockQuantity).toBe(0);
    expect(refreshed!.stockQuantity).toBeGreaterThanOrEqual(0);
    expect(refreshed!.inStock).toBe(false);
  });

  // ==========================================
  // 4. Stock Restoration on Order Cancellation
  // ==========================================
  it('restores exact inventory and reactivates inStock flag when an order is cancelled', async () => {
    // Start with a known product
    const product = await mockDataProvider.getProductById('prod-001');
    const originalStock = product!.stockQuantity;

    // Create order for 3 units
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Riyad Mahrez',
        phone: '0770554433',
        wilaya: 'Tlemcen',
        wilayaCode: 13,
        commune: 'Mansourah',
        address: 'Cité El Wifaq',
      },
      items: [
        {
          productId: 'prod-001',
          title: product!.title,
          slug: product!.slug,
          price: product!.price,
          quantity: 3,
          selectedSize: '50',
          image: product!.images[0].url,
        },
      ],
      deliveryFee: 600,
    });

    // Check decremented stock
    const afterOrder = await mockDataProvider.getProductById('prod-001');
    expect(afterOrder!.stockQuantity).toBe(originalStock - 3);

    // Cancel order
    const cancelled = await mockDataProvider.updateOrderStatus(
      order.id,
      'cancelled',
      'Annulation par le client'
    );
    expect(cancelled.status).toBe('cancelled');

    // Check restored stock
    const afterCancel = await mockDataProvider.getProductById('prod-001');
    expect(afterCancel!.stockQuantity).toBe(originalStock);
    expect(afterCancel!.inStock).toBe(true);
  });

  // ==========================================
  // 5. Atomic Stock Decrement Across Multi-Item Order
  // ==========================================
  it('decrements stock atomically across multiple line items in a single composite order', async () => {
    const p1 = await mockDataProvider.getProductById('prod-001');
    const p2 = await mockDataProvider.getProductById('prod-002');
    const p3 = await mockDataProvider.getProductById('prod-003');

    const s1 = p1!.stockQuantity;
    const s2 = p2!.stockQuantity;
    const s3 = p3!.stockQuantity;

    const multiItemOrder = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Nabil Bentaleb',
        phone: '0555443322',
        wilaya: 'Sétif',
        wilayaCode: 19,
        commune: 'El Eulma',
        address: 'Rue Dubai',
      },
      items: [
        {
          productId: p1!.id,
          title: p1!.title,
          slug: p1!.slug,
          price: p1!.price,
          quantity: 2,
          selectedSize: '50',
          image: p1!.images[0].url,
        },
        {
          productId: p2!.id,
          title: p2!.title,
          slug: p2!.slug,
          price: p2!.price,
          quantity: 1,
          selectedSize: '52',
          image: p2!.images[0].url,
        },
        {
          productId: p3!.id,
          title: p3!.title,
          slug: p3!.slug,
          price: p3!.price,
          quantity: 3,
          selectedSize: '41',
          image: p3!.images[0].url,
        },
      ],
      deliveryFee: 600,
    });

    expect(multiItemOrder.items).toHaveLength(3);

    const post1 = await mockDataProvider.getProductById(p1!.id);
    const post2 = await mockDataProvider.getProductById(p2!.id);
    const post3 = await mockDataProvider.getProductById(p3!.id);

    expect(post1!.stockQuantity).toBe(s1 - 2);
    expect(post2!.stockQuantity).toBe(s2 - 1);
    expect(post3!.stockQuantity).toBe(s3 - 3);
  });

  // ==========================================
  // 6. Manual Stock Update via Admin with inStock Sync
  // ==========================================
  it('automatically keeps inStock synchronized when admin updates stockQuantity', async () => {
    // Admin sets stock to 0
    const updatedToZero = await mockDataProvider.updateProduct('prod-001', {
      stockQuantity: 0,
    });
    expect(updatedToZero.stockQuantity).toBe(0);
    expect(updatedToZero.inStock).toBe(false);

    // Admin replenishes stock to 10
    const replenished = await mockDataProvider.updateProduct('prod-001', {
      stockQuantity: 10,
    });
    expect(replenished.stockQuantity).toBe(10);
    expect(replenished.inStock).toBe(true);
  });
});
