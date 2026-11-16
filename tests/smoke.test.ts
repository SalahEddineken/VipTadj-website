import { describe, it, expect, beforeEach } from 'vitest';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { localStorageMock } from './setup';
import {
  productsFixture,
  wilayasFixture,
  ordersFixture,
  settingsFixture,
  getWilayaByCode,
  getWilayaFee,
} from './fixtures';
import { mockDataProvider } from './helpers/mockDataProvider';
import {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  formatDZD,
  parseDZD,
  calculateSubtotal,
  calculateDeliveryFee,
  calculateTotal,
  generateWhatsAppConfirmLink,
} from './helpers/testUtils';

describe('VIP TADJ Test Infrastructure — Smoke Suite', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // 1. Environment & Setup Mocks
  // ==========================================
  describe('Environment & Setup Mocks (tests/setup.ts)', () => {
    it('provides functional localStorage mock', () => {
      localStorageMock.setItem('vip_cart', JSON.stringify([{ id: 'p1', qty: 2 }]));
      expect(localStorageMock.getItem('vip_cart')).toBe(JSON.stringify([{ id: 'p1', qty: 2 }]));
      expect(localStorageMock.length).toBe(1);

      localStorageMock.removeItem('vip_cart');
      expect(localStorageMock.getItem('vip_cart')).toBeNull();

      localStorageMock.setItem('k1', 'v1');
      localStorageMock.setItem('k2', 'v2');
      expect(localStorageMock.length).toBe(2);
      localStorageMock.clear();
      expect(localStorageMock.length).toBe(0);
    });

    it('provides matchMedia mock for responsive layout breakpoints', () => {
      const mql = window.matchMedia('(min-width: 1024px)');
      expect(mql).toBeDefined();
      expect(mql.matches).toBe(false);
      expect(typeof mql.addEventListener).toBe('function');
    });

    it('provides Audio mock for incoming order sound alerts (F-ORD-05)', async () => {
      expect(window.Audio).toBeDefined();
      const chime = new Audio('/sounds/order-chime.mp3');
      expect(chime.src).toBe('/sounds/order-chime.mp3');
      await expect(chime.play()).resolves.toBeUndefined();
      expect(chime.play).toHaveBeenCalledTimes(1);
    });

    it('provides Next.js App Router navigation mocks', () => {
      const router = useRouter();
      const pathname = usePathname();
      const searchParams = useSearchParams();

      expect(router.push).toBeDefined();
      router.push('/checkout');
      expect(router.push).toHaveBeenCalledWith('/checkout');
      expect(pathname).toBe('/');
      expect(searchParams.get('test')).toBeNull();
    });
  });

  // ==========================================
  // 2. Fixtures Integrity
  // ==========================================
  describe('Deterministic Fixtures Integrity (tests/fixtures/)', () => {
    it('loads 18 luxury menswear items across clothing, shoes, accessories', () => {
      expect(productsFixture).toHaveLength(18);

      const clothing = productsFixture.filter((p) => p.categoryId === 'clothing');
      const shoes = productsFixture.filter((p) => p.categoryId === 'shoes');
      const accessories = productsFixture.filter((p) => p.categoryId === 'accessories');

      expect(clothing.length).toBe(8);
      expect(shoes.length).toBe(5);
      expect(accessories.length).toBe(5);

      // Verify all products have positive DZD prices, valid sizes, and images
      for (const p of productsFixture) {
        expect(p.price).toBeGreaterThan(0);
        expect(p.sizes.length).toBeGreaterThan(0);
        expect(p.images.length).toBeGreaterThan(0);
        expect(p.images[0].url).toContain('https://images.unsplash.com');
        expect(p.stockQuantity).toBeGreaterThan(0);
        expect(p.inStock).toBe(true);
      }
    });

    it('contains all 58 Algerian Wilayas in exact numerical sequence', () => {
      expect(wilayasFixture).toHaveLength(58);

      // Check codes 1 to 58
      wilayasFixture.forEach((w, index) => {
        expect(w.code).toBe(index + 1);
        expect(w.name).toBeTruthy();
        expect(w.fee).toBeGreaterThan(0);
      });

      // Check regional tier benchmarks: Alger (400 DA), Oran (600 DA), Adrar (900 DA)
      expect(getWilayaFee(16)).toBe(400); // Alger
      expect(getWilayaFee(31)).toBe(600); // Oran
      expect(getWilayaFee(1)).toBe(900); // Adrar
      expect(getWilayaByCode(25)?.name).toBe('Constantine');
    });

    it('contains realistic COD orders covering all lifecycle statuses', () => {
      expect(ordersFixture.length).toBeGreaterThanOrEqual(5);

      const statuses = ordersFixture.map((o) => o.status);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('confirmed');
      expect(statuses).toContain('shipped');
      expect(statuses).toContain('delivered');
      expect(statuses).toContain('cancelled');

      // Check that all orders use paymentMethod: 'cod' and valid Algerian phones
      for (const order of ordersFixture) {
        expect(order.paymentMethod).toBe('cod');
        expect(isValidAlgerianPhone(order.customer.phone)).toBe(true);
        expect(order.subtotal + order.deliveryFee).toBe(order.total);
        expect(order.items.length).toBeGreaterThan(0);
        expect(order.statusHistory.length).toBeGreaterThan(0);
      }
    });

    it('contains store settings with DZD currency and free shipping threshold', () => {
      expect(settingsFixture.storeName).toBe('VIP TADJ');
      expect(settingsFixture.currency).toBe('DZD');
      expect(settingsFixture.currencySymbol).toBe('DA');
      expect(settingsFixture.freeShippingThreshold).toBe(15000);
      expect(Object.keys(settingsFixture.wilayaShippingFees)).toHaveLength(58);
      expect(settingsFixture.wilayaShippingFees[16].homeFee).toBe(400);
    });
  });

  // ==========================================
  // 3. Mock Data Provider (IDataStore)
  // ==========================================
  describe('In-Memory Data Provider (tests/helpers/mockDataProvider.ts)', () => {
    it('operates in mock mode and retrieves all products', async () => {
      expect(mockDataProvider.mode).toBe('mock');
      const products = await mockDataProvider.getProducts();
      expect(products).toHaveLength(18);
    });

    it('filters products by category, search query, and price range', async () => {
      const suits = await mockDataProvider.getProducts({ subcategory: 'costumes' });
      expect(suits.length).toBeGreaterThanOrEqual(2);

      const searchResults = await mockDataProvider.getProducts({ search: 'laine' });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.every((p) => p.title.toLowerCase().includes('laine') || p.description.toLowerCase().includes('laine'))).toBe(true);

      const affordable = await mockDataProvider.getProducts({ maxPrice: 15000 });
      expect(affordable.every((p) => p.price <= 15000)).toBe(true);
    });

    it('retrieves products by slug and ID', async () => {
      const product = await mockDataProvider.getProductBySlug('costume-deux-pieces-laine-super-130s');
      expect(product).not.toBeNull();
      expect(product?.title).toBe('Costume Deux Pièces en Laine Super 130s');

      const byId = await mockDataProvider.getProductById('prod-001');
      expect(byId?.slug).toBe('costume-deux-pieces-laine-super-130s');

      const missing = await mockDataProvider.getProductBySlug('non-existent-slug');
      expect(missing).toBeNull();
    });

    it('creates, updates, and deletes products', async () => {
      const created = await mockDataProvider.createProduct({
        title: 'Veste de Soirée en Velours Palatin',
        slug: 'veste-soiree-velours-palatin',
        description: 'Veste de soirée en velours de coton bordeaux.',
        price: 39000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'blazers',
        images: [{ id: 'test-img', url: 'https://example.com/veste.jpg', alt: 'Veste', isPrimary: true }],
        sizes: ['48', '50'],
        stockQuantity: 4,
        inStock: true,
        isFeatured: false,
        isNewArrival: true,
      });

      expect(created.id).toBeDefined();
      expect(created.title).toBe('Veste de Soirée en Velours Palatin');

      const updated = await mockDataProvider.updateProduct(created.id, { price: 42000, stockQuantity: 0 });
      expect(updated.price).toBe(42000);
      expect(updated.inStock).toBe(false);

      const deleted = await mockDataProvider.deleteProduct(created.id);
      expect(deleted).toBe(true);

      const checkGone = await mockDataProvider.getProductById(created.id);
      expect(checkGone).toBeNull();
    });

    it('creates new order, generates order number, and decrements stock', async () => {
      const suitBefore = await mockDataProvider.getProductById('prod-001');
      const initialStock = suitBefore!.stockQuantity;

      const newOrder = await mockDataProvider.createOrder({
        customer: {
          fullName: 'Tarek Ziani',
          phone: '0555998877',
          wilaya: 'Alger',
          wilayaCode: 16,
          commune: 'Bab Ezzouar',
          address: 'Cité 5 Juillet, Bâtiment 12',
        },
        items: [
          {
            productId: 'prod-001',
            title: suitBefore!.title,
            slug: suitBefore!.slug,
            price: suitBefore!.price,
            quantity: 2,
            selectedSize: '50',
            image: suitBefore!.images[0].url,
          },
        ],
        deliveryFee: 400,
      });

      expect(newOrder.id).toBeDefined();
      expect(newOrder.orderNumber).toContain('VIP-2026-');
      expect(newOrder.status).toBe('pending');
      expect(newOrder.total).toBe(suitBefore!.price * 2 + 400);

      // Verify stock was decremented
      const suitAfter = await mockDataProvider.getProductById('prod-001');
      expect(suitAfter!.stockQuantity).toBe(initialStock - 2);
    });

    it('updates order status and restores stock on cancellation', async () => {
      const order = await mockDataProvider.getOrderById('ord-001');
      expect(order).not.toBeNull();

      const suitBefore = await mockDataProvider.getProductById('prod-001');
      const stockBeforeCancel = suitBefore!.stockQuantity;

      const cancelledOrder = await mockDataProvider.updateOrderStatus(
        'ord-001',
        'cancelled',
        'Client non joignable',
        'Admin Mehdi'
      );

      expect(cancelledOrder.status).toBe('cancelled');
      expect(cancelledOrder.statusHistory[cancelledOrder.statusHistory.length - 1].note).toBe('Client non joignable');

      // Verify stock was restored
      const suitAfter = await mockDataProvider.getProductById('prod-001');
      expect(suitAfter!.stockQuantity).toBe(stockBeforeCancel + 1);
    });

    it('resets data cleanly back to pristine fixture state', async () => {
      // Mutate by deleting a product
      await mockDataProvider.deleteProduct('prod-001');
      let products = await mockDataProvider.getProducts();
      expect(products).toHaveLength(17);

      // Reset
      mockDataProvider.reset();
      products = await mockDataProvider.getProducts();
      expect(products).toHaveLength(18);
      expect(products.find((p) => p.id === 'prod-001')).toBeDefined();
    });
  });

  // ==========================================
  // 4. Test Utilities & Helpers
  // ==========================================
  describe('Test Utilities & Helpers (tests/helpers/testUtils.ts)', () => {
    it('accurately validates Algerian mobile phone numbers', () => {
      // Valid local formats
      expect(isValidAlgerianPhone('0550123456')).toBe(true); // Ooredoo
      expect(isValidAlgerianPhone('0661234567')).toBe(true); // Mobilis
      expect(isValidAlgerianPhone('0770987654')).toBe(true); // Djezzy
      expect(isValidAlgerianPhone('05 50 12 34 56')).toBe(true); // Spaced
      expect(isValidAlgerianPhone('05-50-12-34-56')).toBe(true); // Hyphenated

      // Valid international formats
      expect(isValidAlgerianPhone('+213550123456')).toBe(true);
      expect(isValidAlgerianPhone('+213 661 23 45 67')).toBe(true);
      expect(isValidAlgerianPhone('00213770987654')).toBe(true);

      // Invalid formats
      expect(isValidAlgerianPhone('021123456')).toBe(false); // Landline (not mobile COD)
      expect(isValidAlgerianPhone('0850123456')).toBe(false); // Invalid operator prefix
      expect(isValidAlgerianPhone('055012345')).toBe(false); // Too short (9 digits)
      expect(isValidAlgerianPhone('05501234567')).toBe(false); // Too long (11 digits)
      expect(isValidAlgerianPhone('abcdefghij')).toBe(false); // Non-numeric
      expect(isValidAlgerianPhone('')).toBe(false); // Empty
    });

    it('formats phone numbers into local display and RFC tel: links', () => {
      expect(formatAlgerianPhone('0550123456')).toBe('0550 12 34 56');
      expect(formatAlgerianPhone('+213550123456')).toBe('0550 12 34 56');

      expect(formatTelLink('0550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('+213661234567')).toBe('tel:+213661234567');
    });

    it('formats and parses Algerian Dinar currency amounts', () => {
      expect(formatDZD(48500)).toContain('48');
      expect(formatDZD(48500)).toContain('500');
      expect(formatDZD(48500)).toContain('DA');

      expect(parseDZD('48 500 DA')).toBe(48500);
      expect(parseDZD('12500DA')).toBe(12500);
      expect(parseDZD('')).toBe(0);
    });

    it('calculates subtotals, free shipping eligibility, and order totals', () => {
      const items = [
        { price: 12500, quantity: 1 },
        { price: 8500, quantity: 2 },
      ];
      const subtotal = calculateSubtotal(items);
      expect(subtotal).toBe(29500);

      // Subtotal (29,500 DA) >= free shipping threshold (15,000 DA) -> 0 DA delivery fee
      expect(calculateDeliveryFee(subtotal, 16, 15000)).toBe(0);
      expect(calculateDeliveryFee(subtotal, 31, 15000)).toBe(0);

      // Subtotal under threshold -> standard wilaya fee
      expect(calculateDeliveryFee(10000, 16, 15000)).toBe(400); // Alger
      expect(calculateDeliveryFee(10000, 31, 15000)).toBe(600); // Oran
      expect(calculateDeliveryFee(10000, 1, 15000)).toBe(900); // Adrar

      expect(calculateTotal(10000, 400)).toBe(10400);
      expect(calculateTotal(10000, 400, 1000)).toBe(9400);
    });

    it('generates pre-composed WhatsApp confirmation link', () => {
      const order = ordersFixture[0];
      const waLink = generateWhatsAppConfirmLink(order);

      expect(waLink).toContain('https://wa.me/213550123456?text=');
      expect(waLink).toContain(encodeURIComponent(order.orderNumber));
      expect(waLink).toContain(encodeURIComponent(order.customer.fullName));
      expect(waLink).toContain(encodeURIComponent('VIP TADJ'));
    });
  });
});
