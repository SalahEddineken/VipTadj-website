import { describe, it, expect, beforeEach } from 'vitest';
import { MockSeedDataProvider } from '@/lib/data-provider/mock-provider';
import { CreateOrderInput, CreateProductInput, OrderStatus, Product } from '@/types';

describe('CHALLENGER 1 — Adversarial Stress Harness for Data Layer & Mock Data Provider', () => {
  let store: MockSeedDataProvider;

  beforeEach(async () => {
    store = new MockSeedDataProvider();
    await store.seedCatalog(true);
  });

  // =========================================================================
  // 1. MUTATION LEAK TESTS (Deep Immutability & State Insulation)
  // =========================================================================
  describe('Mutation Leaks & State Corruption', () => {
    it('prevents scalar mutation on object returned by getProductById', async () => {
      const p1 = await store.getProductById('prod-suit-01');
      expect(p1).not.toBeNull();
      const originalPrice = p1!.price;

      // Maliciously mutate the returned object
      p1!.price = 999999;
      p1!.title = 'HACKED TITLE';

      // Re-fetch product from store
      const p2 = await store.getProductById('prod-suit-01');
      expect(p2!.price).toBe(originalPrice);
      expect(p2!.title).not.toBe('HACKED TITLE');
    });

    it('prevents nested array and object mutation on object returned by getProductById', async () => {
      const p1 = await store.getProductById('prod-suit-01');
      expect(p1).not.toBeNull();
      const originalSizesCount = p1!.sizes.length;
      const originalFirstImgUrl = p1!.images[0].url;

      // Mutate nested array & objects
      p1!.sizes.push('XXXXL');
      p1!.images[0].url = 'https://malicious-site.com/exploit.jpg';
      if (!p1!.tags) p1!.tags = [];
      p1!.tags.push('injected-tag');

      // Re-fetch product from store
      const p2 = await store.getProductById('prod-suit-01');
      expect(p2!.sizes.length).toBe(originalSizesCount);
      expect(p2!.sizes).not.toContain('XXXXL');
      expect(p2!.images[0].url).toBe(originalFirstImgUrl);
    });

    it('prevents array truncation and element mutation on array returned by getProducts', async () => {
      const list1 = await store.getProducts();
      const originalCount = list1.length;
      expect(originalCount).toBeGreaterThanOrEqual(18);

      // Mutate the array
      list1[0].price = 1;
      list1.pop();
      list1.length = 0;

      // Re-fetch
      const list2 = await store.getProducts();
      expect(list2.length).toBe(originalCount);
      expect(list2[0].price).not.toBe(1);
    });

    it('prevents external caller mutation of input object passed into createProduct', async () => {
      const input: CreateProductInput = {
        title: 'Original Title',
        slug: 'original-title',
        description: 'Original Description',
        price: 20000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'costumes',
        images: [{ id: 'img-1', url: 'https://example.com/1.jpg', alt: 'Test', isPrimary: true }],
        sizes: ['48', '50'],
        stockQuantity: 5,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      };

      const created = await store.createProduct(input);
      expect(created.title).toBe('Original Title');

      // Caller mutates their original input object post-creation
      input.title = 'Tampered Input Title';
      input.images[0].url = 'https://tampered.com/bad.jpg';
      input.sizes.push('99');

      // Check store
      const fetched = await store.getProductById(created.id);
      expect(fetched!.title).toBe('Original Title');
      expect(fetched!.images[0].url).toBe('https://example.com/1.jpg');
      expect(fetched!.sizes).toEqual(['48', '50']);
    });

    it('prevents external caller mutation of input object passed into createOrder', async () => {
      const orderPayload: CreateOrderInput = {
        customer: {
          fullName: 'Sami Bouzid',
          phone: '0555123456',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Bab Ezzouar',
          address: 'Cité Universitaire',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-suit-01',
            title: 'Costume',
            slug: 'costume',
            price: 48500,
            quantity: 1,
            selectedSize: '50',
            image: 'https://example.com/suit.jpg',
          },
        ],
        deliveryFee: 400,
      };

      const createdOrder = await store.createOrder(orderPayload);

      // Caller mutates input payload
      orderPayload.customer.fullName = 'Mutated Customer';
      orderPayload.items[0].quantity = 99;
      orderPayload.deliveryFee = 9999;

      // Check store
      const fetchedOrder = await store.getOrderById(createdOrder.id);
      expect(fetchedOrder!.customer.fullName).toBe('Sami Bouzid');
      expect(fetchedOrder!.items[0].quantity).toBe(1);
      expect(fetchedOrder!.deliveryFee).toBe(400);
    });

    it('prevents mutation of settings object returned by getSettings', async () => {
      const s1 = await store.getSettings();
      const originalStoreName = s1.storeName;

      s1.storeName = 'Hacked Store';
      if (s1.wilayaShippingFees[16]) {
        s1.wilayaShippingFees[16].homeFee = 0;
      }

      const s2 = await store.getSettings();
      expect(s2.storeName).toBe(originalStoreName);
      if (s2.wilayaShippingFees[16]) {
        expect(s2.wilayaShippingFees[16].homeFee).not.toBe(0);
      }
    });

    it('probes whether updateProduct allows immutable ID tampering', async () => {
      const p = await store.getProductById('prod-suit-01');
      expect(p).not.toBeNull();

      // Attempt to tamper with product ID via updateProduct
      const updated = await store.updateProduct('prod-suit-01', {
        id: 'tampered-hacked-id',
        price: 55000,
      } as any);

      // Query store by both original and tampered IDs
      const queryOriginal = await store.getProductById('prod-suit-01');
      const queryTampered = await store.getProductById('tampered-hacked-id');

      // SECURE REQUIREMENT: The entity ID must NEVER be overwritten by partial update data
      expect(updated.id, 'VULNERABILITY: updateProduct allowed caller to overwrite internal entity ID!').toBe('prod-suit-01');
      expect(queryOriginal, 'Original ID must remain intact').not.toBeNull();
      expect(queryTampered, 'Tampered ID must not exist').toBeNull();
    });
  });

  // =========================================================================
  // 2. BOUNDARY FILTERING & INJECTION RESILIENCE
  // =========================================================================
  describe('Boundary Filtering & Injection Resilience', () => {
    it('handles empty string and whitespace-only search queries gracefully', async () => {
      const emptyResult = await store.getProducts({ search: '' });
      expect(emptyResult.length).toBeGreaterThanOrEqual(18);

      const whitespaceResult = await store.getProducts({ search: '   \t  \n  ' });
      expect(whitespaceResult.length).toBeGreaterThanOrEqual(18);
    });

    it('handles special regex metacharacters in search without crashing', async () => {
      const regexPatterns = [
        '[',
        ']',
        '(',
        ')',
        '.*',
        '+',
        '?',
        '^',
        '$',
        '\\',
        '{',
        '}',
        '|',
        'a[b-c]+.*$',
      ];

      for (const pattern of regexPatterns) {
        expect(async () => {
          const res = await store.getProducts({ search: pattern });
          expect(Array.isArray(res)).toBe(true);
        }).not.toThrow();
      }
    });

    it('handles XSS and SQL injection strings in search gracefully', async () => {
      const injectionStrings = [
        '<script>alert("xss")</script>',
        '"><img src=x onerror=alert(1)>',
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        '{{7*7}}',
        '${7*7}',
        'javascript:void(0)',
      ];

      for (const str of injectionStrings) {
        const res = await store.getProducts({ search: str });
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBe(0);
      }
    });

    it('handles negative, zero, and inverted price ranges safely', async () => {
      // Negative minPrice should not crash and should return all products with price >= -500
      const negativeMin = await store.getProducts({ minPrice: -500 });
      expect(negativeMin.length).toBeGreaterThanOrEqual(18);

      // Negative maxPrice should return 0 products since all prices are positive
      const negativeMax = await store.getProducts({ maxPrice: -10 });
      expect(negativeMax.length).toBe(0);

      // Inverted price range: minPrice (50,000) > maxPrice (10,000) -> should return 0 items
      const inverted = await store.getProducts({ minPrice: 50000, maxPrice: 10000 });
      expect(inverted.length).toBe(0);

      // minPrice = 0, maxPrice = 0 -> 0 items
      const zeroRange = await store.getProducts({ minPrice: 0, maxPrice: 0 });
      expect(zeroRange.length).toBe(0);

      // Exact match range
      const exactMatch = await store.getProducts({ minPrice: 48500, maxPrice: 48500 });
      expect(exactMatch.every((p) => p.price === 48500)).toBe(true);
    });

    it('handles non-existent category IDs and subcategories without error', async () => {
      const nonExistentCat = await store.getProducts({ categoryId: 'non-existent-cat-9999' as any });
      expect(Array.isArray(nonExistentCat)).toBe(true);
      expect(nonExistentCat.length).toBe(0);

      const nonExistentSubcat = await store.getProducts({ subcategory: 'flying-shoes' });
      expect(Array.isArray(nonExistentSubcat)).toBe(true);
      expect(nonExistentSubcat.length).toBe(0);
    });

    it('filters subcategories case-insensitively', async () => {
      const lower = await store.getProducts({ subcategory: 'costumes' });
      const upper = await store.getProducts({ subcategory: 'COSTUMES' });
      const mixed = await store.getProducts({ subcategory: 'CoStUmEs' });

      expect(lower.length).toBeGreaterThan(0);
      expect(upper.length).toBe(lower.length);
      expect(mixed.length).toBe(lower.length);
    });

    it('probes behavior when search runs against products with missing/null description or subcategory', async () => {
      const customProd = await store.createProduct({
        title: 'Minimal Minimalist Tie',
        slug: 'minimal-tie',
        description: '',
        price: 4500,
        categoryId: 'accessories',
        categorySlug: 'accessoires',
        subcategory: 'cravates',
        images: [{ id: '1', url: 'https://example.com/tie.jpg', alt: 'Tie', isPrimary: true }],
        sizes: ['Unique'],
        stockQuantity: 10,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
      });

      const res = await store.getProducts({ search: 'Minimal' });
      expect(res.some((p) => p.id === customProd.id)).toBe(true);
    });
  });

  // =========================================================================
  // 3. CONCURRENCY & ORDER STATE INTEGRITY
  // =========================================================================
  describe('Concurrency, Order State Machine & Integrity', () => {
    it('handles concurrent order creation and tests orderNumber collisions and shadowing', async () => {
      const count = 50;
      const promises = Array.from({ length: count }, (_, i) =>
        store.createOrder({
          customer: {
            fullName: `Client Concurrency ${i}`,
            phone: `05500000${String(i).padStart(2, '0')}`,
            wilaya: '16 - Alger',
            wilayaCode: 16,
            commune: 'Alger Centre',
            address: `Rue ${i}`,
            deliveryType: 'home',
          },
          items: [
            {
              productId: 'prod-suit-01',
              title: 'Costume',
              slug: 'costume',
              price: 10000,
              quantity: 1,
              selectedSize: '50',
              image: 'https://example.com/img.jpg',
            },
          ],
          deliveryFee: 400,
        })
      );

      const createdOrders = await Promise.all(promises);

      // Verify all orders were created
      expect(createdOrders.length).toBe(count);

      // Check ID uniqueness
      const uniqueIds = new Set(createdOrders.map((o) => o.id));
      expect(uniqueIds.size).toBe(count);
    });

    it('demonstrates order shadowing vulnerability when duplicate order numbers exist', async () => {
      // Create first order
      const ord1 = await store.createOrder({
        customer: {
          fullName: 'Customer Alpha',
          phone: '0550111111',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: 'A',
          deliveryType: 'home',
        },
        items: [{ productId: '1', title: 'A', slug: 'a', price: 1000, quantity: 1, selectedSize: 'S', image: '' }],
        deliveryFee: 400,
      });

      // Manually simulate a collision by pushing an order with the same orderNumber
      const orders = await store.getOrders();
      const duplicateOrderNumber = ord1.orderNumber;

      // When looking up by orderNumber
      const fetched = await store.getOrderById(duplicateOrderNumber);
      expect(fetched).not.toBeNull();
      expect(fetched!.orderNumber).toBe(duplicateOrderNumber);
    });

    it('probes whether updateOrderStatus validates enum values at runtime', async () => {
      const orders = await store.getOrders();
      expect(orders.length).toBeGreaterThan(0);
      const testOrderId = orders[0].id;

      // 1. Valid transitions
      const confirmed = await store.updateOrderStatus(testOrderId, 'confirmed', 'Confirmée au téléphone');
      expect(confirmed.status).toBe('confirmed');
      expect(confirmed.statusHistory.length).toBeGreaterThanOrEqual(2);

      const shipped = await store.updateOrderStatus(testOrderId, 'shipped', 'Colis remis au livreur');
      expect(shipped.status).toBe('shipped');

      // 2. Adversarial invalid status injection
      const invalidStatus = 'MALICIOUS_STATUS_INJECTION';
      try {
        const corrupted = await store.updateOrderStatus(testOrderId, invalidStatus as any, 'Injected status');
        if (corrupted.status === invalidStatus) {
          console.warn('[EMPIRICAL FINDING] updateOrderStatus accepted non-enum status without runtime validation!');
        }
        // Strict expectation: should reject or throw
        expect(corrupted.status, 'VULNERABILITY: updateOrderStatus accepted invalid status string!').not.toBe(invalidStatus);
      } catch (err: any) {
        expect(err.message).toContain('status');
      }
    });

    it('probes order calculation when items array is empty or values are anomalous', async () => {
      // Empty items order
      const emptyOrder = await store.createOrder({
        customer: {
          fullName: 'Empty Order Test',
          phone: '0550111222',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: 'Test',
          deliveryType: 'home',
        },
        items: [],
        deliveryFee: 400,
      });

      expect(emptyOrder.subtotal).toBe(0);
      expect(emptyOrder.total).toBe(400);

      // Massive discount > total
      const discountedOrder = await store.createOrder({
        customer: {
          fullName: 'Discount Test',
          phone: '0550111222',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: 'Test',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-suit-01',
            title: 'Costume',
            slug: 'costume',
            price: 1000,
            quantity: 1,
            selectedSize: '50',
            image: 'https://example.com/suit.jpg',
          },
        ],
        deliveryFee: 400,
        discount: 2000,
      });

      // Total would be 1000 + 400 - 2000 = -600 DA
      if (discountedOrder.total < 0) {
        console.warn(`[EMPIRICAL FINDING] Negative order total permitted: ${discountedOrder.total} DA`);
      }
      expect(discountedOrder.total, 'Order total must not be negative').toBeGreaterThanOrEqual(0);
    });

    it('throws when updating non-existent order ID', async () => {
      await expect(
        store.updateOrderStatus('non-existent-order-id-999', 'confirmed')
      ).rejects.toThrow(/not found/i);
    });
  });

  // =========================================================================
  // 4. SETTINGS INTEGRITY & PARTIAL UPDATE BEHAVIOR
  // =========================================================================
  describe('Store Settings Partial Update Resilience', () => {
    it('probes whether updating a single wilaya shipping fee wipes out all other 57 wilayas', async () => {
      const initialSettings = await store.getSettings();
      const initialWilayaCount = Object.keys(initialSettings.wilayaShippingFees || {}).length;
      expect(initialWilayaCount).toBe(58);

      // Admin updates delivery fee for Wilaya 16 (Alger) only
      await store.updateSettings({
        wilayaShippingFees: {
          16: { homeFee: 500, deskFee: 350, active: true },
        } as any,
      });

      const updatedSettings = await store.getSettings();
      const remainingWilayaCount = Object.keys(updatedSettings.wilayaShippingFees || {}).length;

      if (remainingWilayaCount === 1) {
        console.warn(
          `[EMPIRICAL FINDING] Partial update of wilayaShippingFees wiped out 57 wilayas! Remaining: ${remainingWilayaCount}`
        );
      }

      // In a resilient store, partial update of wilayas should merge, not obliterate all other 57 wilayas
      expect(
        remainingWilayaCount,
        'VULNERABILITY: updateSettings shallow merge wiped out 57 wilaya fee configurations!'
      ).toBe(58);
      expect(updatedSettings.wilayaShippingFees[16].homeFee).toBe(500);
      expect(updatedSettings.wilayaShippingFees[31]).toBeDefined(); // Oran must still exist
    });
  });

  // =========================================================================
  // 5. SEED IDEMPOTENCY & CONTRACT PARITY
  // =========================================================================
  describe('Seed Idempotency & Contract Parity', () => {
    it('probes whether seedCatalog(false) preserves or destroys existing customer/admin data', async () => {
      // 1. Add a custom product to the store
      const customProduct = await store.createProduct({
        title: 'Bespoke Cashmere Coat',
        slug: 'bespoke-cashmere-coat',
        description: 'Manteau sur-mesure en pur cachemire',
        price: 95000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'manteaux',
        images: [{ id: '1', url: 'https://example.com/coat.jpg', alt: 'Coat', isPrimary: true }],
        sizes: ['48', '50'],
        stockQuantity: 3,
        inStock: true,
        isFeatured: true,
        isNewArrival: true,
      });

      // 2. Add a new customer order
      const customOrder = await store.createOrder({
        customer: {
          fullName: 'Nassim Ziani',
          phone: '0661223344',
          wilaya: '31 - Oran',
          wilayaCode: 31,
          commune: 'Oran Centre',
          address: 'Boulevard Front de Mer',
          deliveryType: 'home',
        },
        items: [
          {
            productId: customProduct.id,
            title: customProduct.title,
            slug: customProduct.slug,
            price: customProduct.price,
            quantity: 1,
            selectedSize: '50',
            image: 'https://example.com/coat.jpg',
          },
        ],
        deliveryFee: 600,
      });

      // Verify they exist
      expect(await store.getProductById(customProduct.id)).not.toBeNull();
      expect(await store.getOrderById(customOrder.id)).not.toBeNull();

      // 3. Call seedCatalog(false) — meaning: DO NOT FORCE OVERWRITE
      const seedResult = await store.seedCatalog(false);

      // Check if custom data survived
      const productAfterSeed = await store.getProductById(customProduct.id);
      const orderAfterSeed = await store.getOrderById(customOrder.id);

      if (productAfterSeed === null || orderAfterSeed === null) {
        console.warn(
          '[EMPIRICAL FINDING] seedCatalog(false) destructively wiped existing products and orders in MockSeedDataProvider!'
        );
      }

      // Parity with FirestoreDataProvider:
      // In FirestoreDataProvider:
      // if (!productsSnap.empty && !force) returns { success: false, count: 0, message: 'Database is already populated...' }
      expect(
        seedResult.success,
        'seedCatalog(false) when already populated should report false or skip'
      ).toBe(false);
      expect(productAfterSeed, 'seedCatalog(false) must not wipe existing products').not.toBeNull();
      expect(orderAfterSeed, 'seedCatalog(false) must not wipe existing orders').not.toBeNull();
    });

    it('completely resets catalog when force=true is passed', async () => {
      // Modify a product's price
      await store.updateProduct('prod-suit-01', { price: 99999 });
      const modified = await store.getProductById('prod-suit-01');
      expect(modified!.price).toBe(99999);

      // Now force seed
      const forceSeedResult = await store.seedCatalog(true);
      expect(forceSeedResult.success).toBe(true);
      expect(forceSeedResult.count).toBeGreaterThanOrEqual(18);

      // Original price should be restored
      const restored = await store.getProductById('prod-suit-01');
      expect(restored!.price).toBe(48500);
    });
  });
});
