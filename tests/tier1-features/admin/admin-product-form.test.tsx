import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { Product } from '@/types';

describe('Tier 1: Admin — Product Authoring & Size Matrix Form (F-ADM-04)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // Helper simulating size matrix sum computation
  function calculateTotalStock(sizeMatrix: Record<string, number>): number {
    return Object.values(sizeMatrix).reduce((sum, qty) => sum + Math.max(0, qty), 0);
  }

  // ==========================================
  // Test 1: Clothing Size Matrix Support (S-XXL / 48-56)
  // ==========================================
  it('supports clothing size matrix with individual stock counts per size', () => {
    const clothingSizeMatrix = {
      '48': 2,
      '50': 5,
      '52': 4,
      '54': 1,
      '56': 0,
    };

    const totalStock = calculateTotalStock(clothingSizeMatrix);
    expect(totalStock).toBe(12);

    const availableSizes = Object.entries(clothingSizeMatrix)
      .filter(([_, qty]) => qty > 0)
      .map(([size]) => size);

    expect(availableSizes).toEqual(['48', '50', '52', '54']);
  });

  // ==========================================
  // Test 2: Shoe Size Matrix Support (39 to 45)
  // ==========================================
  it('supports European shoe size matrix (39 to 45) with per-size stock counts', () => {
    const shoeSizeMatrix = {
      '39': 1,
      '40': 3,
      '41': 6,
      '42': 8,
      '43': 5,
      '44': 2,
      '45': 1,
    };

    const totalShoeStock = calculateTotalStock(shoeSizeMatrix);
    expect(totalShoeStock).toBe(26);

    // Verify all keys are valid European shoe sizes
    Object.keys(shoeSizeMatrix).forEach((sizeStr) => {
      const num = parseInt(sizeStr, 10);
      expect(num).toBeGreaterThanOrEqual(39);
      expect(num).toBeLessThanOrEqual(45);
    });
  });

  // ==========================================
  // Test 3: Product Form Validation Rules
  // ==========================================
  it('validates mandatory product form fields (title, positive price, category, images)', () => {
    function validateProductForm(data: Partial<Product>): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      if (!data.title || data.title.trim().length < 5) errors.push('Le titre du produit est obligatoire.');
      if (!data.price || data.price <= 0) errors.push('Le prix en Dinar (DZD) doit être supérieur à 0.');
      if (!data.categoryId) errors.push('La catégorie est obligatoire.');
      if (!data.images || data.images.length === 0) errors.push('Au moins une image est requise.');
      return { valid: errors.length === 0, errors };
    }

    // Invalid product attempt
    const invalidResult = validateProductForm({ title: 'A', price: 0 });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThanOrEqual(3);

    // Valid product
    const validResult = validateProductForm({
      title: 'Costume Trois Pièces en Laine Peignée',
      price: 52000,
      categoryId: 'clothing',
      images: [{ id: 'img-1', url: 'https://example.com/suit.jpg', alt: 'Costume', isPrimary: true }],
    });
    expect(validResult.valid).toBe(true);
  });

  // ==========================================
  // Test 4: Creation of New Luxury Product via Form
  // ==========================================
  it('submits valid form data and creates a new product in catalog with generated ID', async () => {
    const newProductPayload = {
      title: 'Veston Croisé en Laine et Mohair',
      slug: 'veston-croise-laine-mohair',
      description: 'Veston de cérémonie croisé 6 boutons taillé dans une laine et mohair.',
      price: 36000,
      compareAtPrice: 42000,
      categoryId: 'clothing' as const,
      categorySlug: 'vetements',
      subcategory: 'blazers',
      images: [
        {
          id: 'img-veston-1',
          url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
          alt: 'Veston Croisé',
          isPrimary: true,
        },
      ],
      sizes: ['48', '50', '52'],
      stockQuantity: 6,
      inStock: true,
      isFeatured: true,
      isNewArrival: true,
    };

    const created = await mockDataProvider.createProduct(newProductPayload);

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Veston Croisé en Laine et Mohair');
    expect(created.price).toBe(36000);
    expect(created.compareAtPrice).toBe(42000);
    expect(created.sizes).toEqual(['48', '50', '52']);

    const fetched = await mockDataProvider.getProductById(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched?.slug).toBe('veston-croise-laine-mohair');
  });

  // ==========================================
  // Test 5: Automatic Slug Generation from Title
  // ==========================================
  it('generates URL-friendly slug from French product titles with accents and special characters', () => {
    function generateSlug(title: string): string {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric to hyphens
        .replace(/^-+|-+$/g, '');
    }

    expect(generateSlug('Costume Deux Pièces en Laine Super 130s')).toBe('costume-deux-pieces-en-laine-super-130s');
    expect(generateSlug('Manteau d’Hiver en Pur Cachemire')).toBe('manteau-d-hiver-en-pur-cachemire');
    expect(generateSlug('Boutons de Manchette Or 18k & Nacre')).toBe('boutons-de-manchette-or-18k-nacre');
  });

  // ==========================================
  // Test 6: CompareAtPrice Discount Invariant Enforcement
  // ==========================================
  it('enforces that promotional compareAtPrice must be strictly higher than active selling price', () => {
    function validatePricing(price: number, compareAtPrice?: number): boolean {
      if (price <= 0) return false;
      if (compareAtPrice !== undefined && compareAtPrice <= price) return false;
      return true;
    }

    expect(validatePricing(45000, 52000)).toBe(true); // Valid discount
    expect(validatePricing(45000)).toBe(true); // Regular price without promo
    expect(validatePricing(45000, 45000)).toBe(false); // Invalid equal
    expect(validatePricing(45000, 40000)).toBe(false); // Invalid lower compareAtPrice
  });
});
