import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';

describe('Tier 3: Combinations — Stock Decrement & Restoration Lifecycle (stock-decrement-lifecycle.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Combination 1: Complete Fulfillment Lifecycle (Stock Stays Decremented)
  // ==========================================
  it('decrements stock upon order creation and maintains decremented stock across fulfillment lifecycle', async () => {
    const product = await mockDataProvider.getProductById('prod-001');
    const initialStock = product!.stockQuantity;
    const orderQty = 2;

    // 1. Order Placed
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Raïs M\'Bolhi',
        phone: '0550112233',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Hussein Dey',
        address: 'Rue Tripoli',
      },
      items: [
        {
          productId: product!.id,
          title: product!.title,
          slug: product!.slug,
          price: product!.price,
          quantity: orderQty,
          selectedSize: '50',
          image: product!.images[0].url,
        },
      ],
      deliveryFee: 0,
    });

    const stockAfterCreation = (await mockDataProvider.getProductById(product!.id))!.stockQuantity;
    expect(stockAfterCreation).toBe(initialStock - orderQty);

    // 2. Pending -> Confirmed
    await mockDataProvider.updateOrderStatus(order.id, 'confirmed', 'Validation téléphonique');
    const stockAfterConfirm = (await mockDataProvider.getProductById(product!.id))!.stockQuantity;
    expect(stockAfterConfirm).toBe(initialStock - orderQty);

    // 3. Confirmed -> Shipped
    await mockDataProvider.updateOrderStatus(order.id, 'shipped', 'Colis remis au livreur Yalidine');
    const stockAfterShip = (await mockDataProvider.getProductById(product!.id))!.stockQuantity;
    expect(stockAfterShip).toBe(initialStock - orderQty);

    // 4. Shipped -> Delivered
    await mockDataProvider.updateOrderStatus(order.id, 'delivered', 'Colis livré et payé en espèces');
    const stockAfterDelivered = (await mockDataProvider.getProductById(product!.id))!.stockQuantity;
    expect(stockAfterDelivered).toBe(initialStock - orderQty);
  });

  // ==========================================
  // Combination 2: Cancellation from Pending State Restores Stock
  // ==========================================
  it('restores stock immediately when a pending order is cancelled', async () => {
    const product = await mockDataProvider.getProductById('prod-002');
    const initialStock = product!.stockQuantity;

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Faouzi Ghoulam',
        phone: '0661223344',
        wilaya: 'Annaba',
        wilayaCode: 23,
        commune: 'El Bouni',
        address: 'Cité Seybouse',
      },
      items: [
        {
          productId: product!.id,
          title: product!.title,
          slug: product!.slug,
          price: product!.price,
          quantity: 3,
          selectedSize: '52',
          image: product!.images[0].url,
        },
      ],
      deliveryFee: 0,
    });

    expect((await mockDataProvider.getProductById(product!.id))!.stockQuantity).toBe(initialStock - 3);

    // Cancel order
    await mockDataProvider.updateOrderStatus(order.id, 'cancelled', 'Client a changé d\'avis avant confirmation');

    const restoredProduct = await mockDataProvider.getProductById(product!.id);
    expect(restoredProduct!.stockQuantity).toBe(initialStock);
    expect(restoredProduct!.inStock).toBe(true);
  });

  // ==========================================
  // Combination 3: Restoring Completely Sold-Out Item Flips inStock Flag
  // ==========================================
  it('restores sold-out item back to inStock=true when order for last units is cancelled', async () => {
    // 1. Create a luxury limited item with exactly 2 units
    const limited = await mockDataProvider.createProduct({
      title: 'Mocassins en Cuir Suédé Pátina',
      slug: 'mocassins-cuir-suede-patina',
      description: 'Mocassins à pampilles faits main.',
      price: 24000,
      categoryId: 'shoes',
      categorySlug: 'chaussures',
      subcategory: 'mocassins',
      images: [
        {
          id: 'moc-1',
          url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
          alt: 'Mocassins',
          isPrimary: true,
        },
      ],
      sizes: ['42', '43'],
      stockQuantity: 2,
      inStock: true,
      isFeatured: false,
      isNewArrival: true,
    });

    // 2. Buy both units -> Stock drops to 0, inStock flips to false
    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Carl Medjani',
        phone: '0770443322',
        wilaya: 'Oran',
        wilayaCode: 31,
        commune: 'Maraval',
        address: 'Rue de la Paix',
      },
      items: [
        {
          productId: limited.id,
          title: limited.title,
          slug: limited.slug,
          price: limited.price,
          quantity: 2,
          selectedSize: '42',
          image: limited.images[0].url,
        },
      ],
      deliveryFee: 0,
    });

    const depleted = await mockDataProvider.getProductById(limited.id);
    expect(depleted!.stockQuantity).toBe(0);
    expect(depleted!.inStock).toBe(false);

    // 3. Cancel order -> Stock restores to 2, inStock flips back to true
    await mockDataProvider.updateOrderStatus(order.id, 'cancelled', 'Numéro de téléphone erroné');

    const restored = await mockDataProvider.getProductById(limited.id);
    expect(restored!.stockQuantity).toBe(2);
    expect(restored!.inStock).toBe(true);
  });

  // ==========================================
  // Combination 4: Multi-Item Composite Order Cancellation
  // ==========================================
  it('restores stock across multiple products atomically when a composite order is cancelled', async () => {
    const p1 = await mockDataProvider.getProductById('prod-001');
    const p2 = await mockDataProvider.getProductById('prod-002');
    const p3 = await mockDataProvider.getProductById('prod-003');

    const init1 = p1!.stockQuantity;
    const init2 = p2!.stockQuantity;
    const init3 = p3!.stockQuantity;

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Yassine Brahimi',
        phone: '0551223344',
        wilaya: 'Constantine',
        wilayaCode: 25,
        commune: 'Ali Mendjeli',
        address: 'UV 5',
      },
      items: [
        { productId: p1!.id, title: p1!.title, slug: p1!.slug, price: p1!.price, quantity: 1, selectedSize: '50', image: p1!.images[0].url },
        { productId: p2!.id, title: p2!.title, slug: p2!.slug, price: p2!.price, quantity: 2, selectedSize: '52', image: p2!.images[0].url },
        { productId: p3!.id, title: p3!.title, slug: p3!.slug, price: p3!.price, quantity: 3, selectedSize: '41', image: p3!.images[0].url },
      ],
      deliveryFee: 0,
    });

    expect((await mockDataProvider.getProductById(p1!.id))!.stockQuantity).toBe(init1 - 1);
    expect((await mockDataProvider.getProductById(p2!.id))!.stockQuantity).toBe(init2 - 2);
    expect((await mockDataProvider.getProductById(p3!.id))!.stockQuantity).toBe(init3 - 3);

    // Cancel composite order
    await mockDataProvider.updateOrderStatus(order.id, 'cancelled', 'Client injoignable après 3 tentatives');

    expect((await mockDataProvider.getProductById(p1!.id))!.stockQuantity).toBe(init1);
    expect((await mockDataProvider.getProductById(p2!.id))!.stockQuantity).toBe(init2);
    expect((await mockDataProvider.getProductById(p3!.id))!.stockQuantity).toBe(init3);
  });

  // ==========================================
  // Combination 5: Idempotent Order Cancellation
  // ==========================================
  it('does not duplicate stock restoration if cancellation is triggered repeatedly', async () => {
    const product = await mockDataProvider.getProductById('prod-001');
    const initialStock = product!.stockQuantity;

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Adlène Guedioura',
        phone: '0660998811',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'El Mouradia',
        address: 'Rue des Fusillés',
      },
      items: [
        { productId: product!.id, title: product!.title, slug: product!.slug, price: product!.price, quantity: 1, selectedSize: '50', image: product!.images[0].url },
      ],
      deliveryFee: 0,
    });

    // First cancel -> Restores stock by 1
    await mockDataProvider.updateOrderStatus(order.id, 'cancelled', 'Première annulation');
    expect((await mockDataProvider.getProductById(product!.id))!.stockQuantity).toBe(initialStock);

    // Second cancel attempt on already cancelled order -> Must NOT increase stock again
    await mockDataProvider.updateOrderStatus(order.id, 'cancelled', 'Deuxième tentative d\'annulation');
    expect((await mockDataProvider.getProductById(product!.id))!.stockQuantity).toBe(initialStock);
  });
});
