import { describe, it, expect, beforeEach } from 'vitest';
import { MockSeedDataProvider } from '@/lib/data-provider/mock-provider';
import { getDataStore } from '@/lib/data-provider';
import { CreateOrderInput } from '@/types';

describe('Data Provider & Domain Contracts', () => {
  let store: MockSeedDataProvider;

  beforeEach(async () => {
    store = new MockSeedDataProvider();
    await store.seedCatalog(true);
  });

  describe('IDataStore Fallback Singleton', () => {
    it('returns an IDataStore instance matching mock mode when Firebase env vars are unset', () => {
      const defaultStore = getDataStore();
      expect(defaultStore).toBeDefined();
      expect(defaultStore.mode).toBe('mock');
    });
  });

  describe('Product Catalog Queries & Filtering', () => {
    it('returns the initial 18 seed products', async () => {
      const products = await store.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(18);
    });

    it('filters products by categoryId', async () => {
      const clothing = await store.getProducts({ categoryId: 'clothing' });
      expect(clothing.length).toBeGreaterThan(0);
      expect(clothing.every((p) => p.categoryId === 'clothing')).toBe(true);

      const shoes = await store.getProducts({ categoryId: 'shoes' });
      expect(shoes.length).toBeGreaterThan(0);
      expect(shoes.every((p) => p.categoryId === 'shoes')).toBe(true);
    });

    it('filters products by subcategory', async () => {
      const suits = await store.getProducts({ subcategory: 'costumes' });
      expect(suits.length).toBeGreaterThan(0);
      expect(suits.every((p) => p.subcategory === 'costumes')).toBe(true);
    });

    it('filters products by inStock and featured flags', async () => {
      const featured = await store.getProducts({ featured: true });
      expect(featured.every((p) => p.isFeatured === true)).toBe(true);

      const inStock = await store.getProducts({ inStock: true });
      expect(inStock.every((p) => p.inStock && p.stockQuantity > 0)).toBe(true);
    });

    it('searches products by keyword in title or description', async () => {
      const results = await store.getProducts({ search: 'laine' });
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (p) =>
            p.title.toLowerCase().includes('laine') ||
            p.description.toLowerCase().includes('laine')
        )
      ).toBe(true);
    });

    it('sorts products by price ascending and descending', async () => {
      const asc = await store.getProducts({ sortBy: 'price-asc' });
      for (let i = 0; i < asc.length - 1; i++) {
        expect(asc[i].price).toBeLessThanOrEqual(asc[i + 1].price);
      }

      const desc = await store.getProducts({ sortBy: 'price-desc' });
      for (let i = 0; i < desc.length - 1; i++) {
        expect(desc[i].price).toBeGreaterThanOrEqual(desc[i + 1].price);
      }
    });

    it('fetches a product by unique slug', async () => {
      const product = await store.getProductBySlug('costume-deux-pieces-laine-italienne');
      expect(product).not.toBeNull();
      expect(product?.slug).toBe('costume-deux-pieces-laine-italienne');
      expect(product?.price).toBe(48500);
    });

    it('returns null for non-existent product slug', async () => {
      const product = await store.getProductBySlug('non-existent-product-slug');
      expect(product).toBeNull();
    });
  });

  describe('Product CRUD Operations', () => {
    it('creates, updates, and deletes a product cleanly', async () => {
      const created = await store.createProduct({
        title: 'Blazer Test Sartorial',
        slug: 'blazer-test-sartorial',
        description: 'Blazer de test en flanelle de laine',
        price: 25000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'blazers',
        images: [{ id: 'img-1', url: 'https://example.com/test.jpg', alt: 'Test', isPrimary: true }],
        sizes: ['48', '50', '52'],
        stockQuantity: 10,
        inStock: true,
        isFeatured: false,
        isNewArrival: true,
        sku: 'VIP-TEST-001',
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Blazer Test Sartorial');

      // Update
      const updated = await store.updateProduct(created.id, { price: 27000 });
      expect(updated.price).toBe(27000);

      // Delete
      const deleted = await store.deleteProduct(created.id);
      expect(deleted).toBe(true);

      const check = await store.getProductById(created.id);
      expect(check).toBeNull();
    });
  });

  describe('Order Operations & Algerian COD Workflow', () => {
    it('creates an Algerian COD order with 58 wilayas metadata and pending status', async () => {
      const orderPayload: CreateOrderInput = {
        customer: {
          fullName: 'Ahmed Mansouri',
          phone: '0550998877',
          wilaya: '31 - Oran',
          wilayaCode: 31,
          commune: 'Es Sénia',
          address: 'Cité 200 Logements, Bloc C',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-shoes-01',
            title: 'Souliers Richelieu One-Cut en Veau Box',
            slug: 'souliers-richelieu-one-cut',
            price: 24500,
            quantity: 1,
            selectedSize: '42',
            image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
          },
        ],
        deliveryFee: 600,
      };

      const order = await store.createOrder(orderPayload);
      expect(order.id).toBeDefined();
      expect(order.orderNumber).toMatch(/^VT-\d{4}-\d{4}$/);
      expect(order.customer.wilayaCode).toBe(31);
      expect(order.subtotal).toBe(24500);
      expect(order.deliveryFee).toBe(600);
      expect(order.total).toBe(25100);
      expect(order.paymentMethod).toBe('cod');
      expect(order.status).toBe('pending');
      expect(order.statusHistory.length).toBe(1);
      expect(order.statusHistory[0].status).toBe('pending');
    });

    it('transitions order status with audit log trail', async () => {
      const orderPayload: CreateOrderInput = {
        customer: {
          fullName: 'Yacine Djebbar',
          phone: '0770112233',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Bab Ezzouar',
          address: 'Résidence El Qods',
        },
        items: [
          {
            productId: 'prod-acc-01',
            title: 'Ceinture Réversible Cuir Pleine Fleur',
            slug: 'ceinture-reversible-cuir',
            price: 16500,
            quantity: 1,
            selectedSize: '95cm',
            image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80',
          },
        ],
        deliveryFee: 400,
      };

      const created = await store.createOrder(orderPayload);
      const confirmed = await store.updateOrderStatus(
        created.id,
        'confirmed',
        'Client a confirmé par appel téléphonique',
        'admin@viptadj.dz'
      );

      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.statusHistory.length).toBe(2);
      expect(confirmed.statusHistory[1].status).toBe('confirmed');
      expect(confirmed.statusHistory[1].note).toBe('Client a confirmé par appel téléphonique');
    });
  });

  describe('Store Settings & 58 Wilayas Matrix', () => {
    it('returns store settings with all 58 Algerian wilayas configured', async () => {
      const settings = await store.getSettings();
      expect(settings.storeName).toBe('VIP TADJ');
      expect(settings.currency).toBe('DZD');
      expect(settings.wilayasDelivery.length).toBe(58);
      expect(settings.wilayasDelivery.find((w) => w.code === 16)?.homeDeliveryFee).toBe(400);
      expect(settings.wilayasDelivery.find((w) => w.code === 31)?.homeDeliveryFee).toBe(600);
    });

    it('updates store settings cleanly', async () => {
      const updated = await store.updateSettings({
        phone: '+213 550 99 99 99',
        freeShippingThreshold: 35000,
      });

      expect(updated.phone).toBe('+213 550 99 99 99');
      expect(updated.freeShippingThreshold).toBe(35000);
    });
  });
});
