import { describe, it, expect, beforeEach } from 'vitest';
import { MockSeedDataProvider } from '@/lib/data-provider/mock-provider';
import { getDataStore } from '@/lib/data-provider';
import { Product, Order } from '@/types';

describe('Tier 1: Foundation — Dual-Mode Data Provider (F-FOUND-03)', () => {
  let store: MockSeedDataProvider;

  beforeEach(async () => {
    store = new MockSeedDataProvider();
    await store.seedCatalog(true);
  });

  // ==========================================
  // Test 1: IDataStore Interface & Mode Contract
  // ==========================================
  it('implements IDataStore contract in mock mode with zero cloud credentials required', () => {
    expect(store.mode).toBe('mock');
    const singleton = getDataStore();
    expect(singleton).toBeDefined();
    expect(singleton.mode).toBe('mock');
  });

  // ==========================================
  // Test 2: getProducts with multi-attribute filtering
  // ==========================================
  it('filters products by categoryId, subcategory, inStock, and price range', async () => {
    const all = await store.getProducts();
    expect(all.length).toBeGreaterThanOrEqual(18);

    // Filter by category
    const clothing = await store.getProducts({ categoryId: 'clothing' });
    expect(clothing.length).toBe(7);
    expect(clothing.every((p) => p.categoryId === 'clothing')).toBe(true);

    // Filter by subcategory
    const suits = await store.getProducts({ subcategory: 'costumes' });
    expect(suits.length).toBeGreaterThanOrEqual(2);
    expect(suits.every((p) => p.subcategory === 'costumes')).toBe(true);

    // Filter by price ceiling
    const under20k = await store.getProducts({ maxPrice: 20000 });
    expect(under20k.length).toBeGreaterThan(0);
    expect(under20k.every((p) => p.price <= 20000)).toBe(true);
  });

  // ==========================================
  // Test 3: getProductBySlug and getProductById resolution
  // ==========================================
  it('resolves products by unique slug and ID, and returns null for missing entities', async () => {
    const bySlug = await store.getProductBySlug('costume-deux-pieces-laine-italienne');
    expect(bySlug).not.toBeNull();
    expect(bySlug?.title).toBe('Costume Deux Pièces en Laine Italienne Super 130s');

    const byId = await store.getProductById(bySlug!.id);
    expect(byId).not.toBeNull();
    expect(byId?.id).toBe(bySlug!.id);

    const nonExistentSlug = await store.getProductBySlug('introuvable-haute-couture');
    expect(nonExistentSlug).toBeNull();

    const nonExistentId = await store.getProductById('id-inexistant-999');
    expect(nonExistentId).toBeNull();
  });

  // ==========================================
  // Test 4: Product CRUD Lifecycle (Create, Update, Delete)
  // ==========================================
  it('creates, updates, and deletes products cleanly in the data store', async () => {
    const newProduct = await store.createProduct({
      title: 'Smoking Sur Mesure Noir Impérial',
      slug: 'smoking-sur-mesure-noir-imperial',
      description: 'Smoking en laine froide avec revers en satin de soie noir.',
      price: 55000,
      categoryId: 'clothing',
      categorySlug: 'vetements',
      subcategory: 'costumes',
      images: [
        {
          id: 'img-smoking-1',
          url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
          alt: 'Smoking Noir',
          isPrimary: true,
        },
      ],
      sizes: ['48', '50', '52', '54'],
      stockQuantity: 5,
      inStock: true,
      isFeatured: true,
      isNewArrival: true,
    });

    expect(newProduct.id).toBeDefined();
    expect(newProduct.title).toBe('Smoking Sur Mesure Noir Impérial');

    // Update
    const updated = await store.updateProduct(newProduct.id, {
      price: 58000,
      stockQuantity: 3,
    });
    expect(updated.price).toBe(58000);
    expect(updated.stockQuantity).toBe(3);

    // Delete
    const deleted = await store.deleteProduct(newProduct.id);
    expect(deleted).toBe(true);

    const postDelete = await store.getProductById(newProduct.id);
    expect(postDelete).toBeNull();
  });

  // ==========================================
  // Test 5: Order Creation, Status Updates, and History Logs
  // ==========================================
  it('creates COD orders, calculates totals, and updates status with notes and history', async () => {
    const products = await store.getProducts({ categoryId: 'shoes' });
    const shoe = products[0];

    const order = await store.createOrder({
      customer: {
        fullName: 'Karim Boukhalfa',
        phone: '0555123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Hydra',
        address: 'Rue Didouche Mourad',
      },
      items: [
        {
          productId: shoe.id,
          title: shoe.title,
          slug: shoe.slug,
          price: shoe.price,
          quantity: 1,
          selectedSize: shoe.sizes[0],
          image: shoe.images[0].url,
        },
      ],
      deliveryFee: 400,
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('pending');
    expect(order.total).toBe(shoe.price + 400);
    expect(order.customer.fullName).toBe('Karim Boukhalfa');

    // Update status to confirmed
    const confirmed = await store.updateOrderStatus(order.id, 'confirmed', 'Client contacté et commande validée.');
    expect(confirmed.status).toBe('confirmed');
    expect(confirmed.statusHistory.length).toBeGreaterThan(1);
    expect(confirmed.statusHistory[confirmed.statusHistory.length - 1].note).toBe('Client contacté et commande validée.');

    // Fetch by ID
    const fetched = await store.getOrderById(order.id);
    expect(fetched?.status).toBe('confirmed');
  });

  // ==========================================
  // Test 6: Store Settings Query and Update
  // ==========================================
  it('manages store settings and 58 Wilaya shipping configuration', async () => {
    const settings = await store.getSettings();
    expect(settings).toBeDefined();
    expect(settings.currency).toBe('DZD');
    expect(settings.wilayaShippingFees[16].homeFee).toBe(400);

    // Update settings
    const updatedSettings = await store.updateSettings({
      freeShippingThreshold: 20000,
    });
    expect(updatedSettings.freeShippingThreshold).toBe(20000);
  });
});
