import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { render, screen, fireEvent } from '@testing-library/react';

// Domain modules under test
import {
  productSchema,
  productImageSchema,
  validateProductForm,
  calculateTotalStock,
  generateSlug,
} from '@/lib/validations/product';
import {
  updateStoreSettingsSchema,
  wilayaShippingFeeItemSchema,
} from '@/lib/validations/settings';
import {
  calculateDeliveryFee,
  calculateSubtotal,
  calculateTotal,
  DEFAULT_FREE_SHIPPING_THRESHOLD,
} from '@/lib/utils/deliveryUtils';
import {
  extractGoogleDriveId,
  normalizeGoogleDriveUrl,
  normalizeImageUrl,
  isValidMediaUrl,
  getLuxuryPlaceholderSvg,
} from '@/lib/media/url-normalizer';
import { SizeSelector } from '@/components/store/pdp/SizeSelector';
import { POST as createProductAPI, GET as getProductsAPI } from '@/app/api/products/route';
import {
  GET as getProductByIdAPI,
  PUT as updateProductAPI,
  DELETE as deleteProductAPI,
} from '@/app/api/products/[id]/route';
import { GET as getSettingsAPI, PUT as updateSettingsAPI } from '@/app/api/settings/route';
import { getDataStore } from '@/lib/data-provider';
import { mockDataProvider } from './helpers/mockDataProvider';
import { ALGERIAN_58_WILAYAS } from '@/lib/data/wilayas';
import { Product, ProductImage } from '@/types';

describe('CHALLENGER M4-2 — ADVERSARIAL STRESS & EMPIRICAL VERIFICATION', () => {
  beforeEach(async () => {
    mockDataProvider.reset();
    await getDataStore().seedCatalog(true);
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. PRODUCT AUTHORING VALIDATION BOUNDARIES (F-ADM-04)
  // =========================================================================
  describe('1. Product Authoring Validation Boundaries', () => {
    const validBaseProduct = {
      title: 'Costume Deux Pièces en Laine Super 130s',
      slug: 'costume-deux-pieces-en-laine-super-130s',
      description: 'Confection artisanale italienne en laine peignée d\'exception pour homme raffiné.',
      price: 45000,
      compareAtPrice: 58000,
      categoryId: 'clothing' as const,
      categorySlug: 'vetements',
      subcategory: 'costumes',
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
          alt: 'Costume Deux Pièces Laine',
          isPrimary: true,
        },
      ],
      sizes: ['48', '50', '52', '54'],
      sizeInventory: { '48': 2, '50': 4, '52': 3, '54': 1 },
      stockQuantity: 10,
      inStock: true,
      isFeatured: true,
      isNewArrival: true,
    };

    describe('1.1 Price Boundary & Type Invariants', () => {
      it('strictly rejects negative price values (-1, -45000)', () => {
        const negativePrices = [-1, -500, -45000];
        for (const neg of negativePrices) {
          const res = productSchema.safeParse({ ...validBaseProduct, price: neg });
          expect(res.success, `Expected price ${neg} to fail validation`).toBe(false);
          if (!res.success) {
            const priceIssue = res.error.issues.find((i) => i.path.includes('price'));
            expect(priceIssue).toBeDefined();
            expect(priceIssue?.message).toContain('supérieur à 0');
          }
        }
      });

      it('strictly rejects zero price (0 DA)', () => {
        const res = productSchema.safeParse({ ...validBaseProduct, price: 0 });
        expect(res.success).toBe(false);
        if (!res.success) {
          const priceIssue = res.error.issues.find((i) => i.path.includes('price'));
          expect(priceIssue).toBeDefined();
          expect(priceIssue?.message).toContain('supérieur à 0');
        }
      });

      it('strictly rejects non-integer prices (2499.50, 1200.99, 10.05 DA)', () => {
        const nonIntegers = [2499.50, 1200.99, 10.05, 45000.75];
        for (const flt of nonIntegers) {
          const res = productSchema.safeParse({ ...validBaseProduct, price: flt });
          expect(res.success, `Expected non-integer price ${flt} to fail validation`).toBe(false);
          if (!res.success) {
            const priceIssue = res.error.issues.find((i) => i.path.includes('price'));
            expect(priceIssue).toBeDefined();
            expect(priceIssue?.message).toContain('entier');
          }
        }
      });

      it('accepts valid positive integer prices', () => {
        const validPrices = [1, 500, 25000, 120000];
        for (const p of validPrices) {
          const res = productSchema.safeParse({
            ...validBaseProduct,
            price: p,
            compareAtPrice: p + 5000,
          });
          expect(res.success, `Expected positive integer price ${p} to pass`).toBe(true);
        }
      });
    });

    describe('1.2 CompareAtPrice Invariant Refinement', () => {
      it('strictly rejects compareAtPrice EQUAL to price (compareAtPrice == price)', () => {
        const payload = {
          ...validBaseProduct,
          price: 35000,
          compareAtPrice: 35000,
        };
        const res = productSchema.safeParse(payload);
        expect(res.success).toBe(false);
        if (!res.success) {
          const issue = res.error.issues.find((i) => i.path.includes('compareAtPrice'));
          expect(issue).toBeDefined();
          expect(issue?.message).toContain('strictement supérieur au prix de vente');
        }
      });

      it('strictly rejects compareAtPrice LOWER than price (compareAtPrice < price)', () => {
        const payload = {
          ...validBaseProduct,
          price: 35000,
          compareAtPrice: 28000,
        };
        const res = productSchema.safeParse(payload);
        expect(res.success).toBe(false);
        if (!res.success) {
          const issue = res.error.issues.find((i) => i.path.includes('compareAtPrice'));
          expect(issue).toBeDefined();
          expect(issue?.message).toContain('strictement supérieur au prix de vente');
        }
      });

      it('accepts compareAtPrice STRICTLY GREATER than price', () => {
        const payload = {
          ...validBaseProduct,
          price: 35000,
          compareAtPrice: 42000,
        };
        const res = productSchema.safeParse(payload);
        expect(res.success).toBe(true);
      });

      it('accepts optional / null / undefined compareAtPrice for non-discounted products', () => {
        const payloads = [
          { ...validBaseProduct, compareAtPrice: undefined },
          { ...validBaseProduct, compareAtPrice: null },
        ];
        for (const pl of payloads) {
          const res = productSchema.safeParse(pl);
          expect(res.success).toBe(true);
        }
      });
    });

    describe('1.3 Product Images Validation Invariants', () => {
      it('strictly rejects an empty images array ([])', () => {
        const payload = { ...validBaseProduct, images: [] };
        const res = productSchema.safeParse(payload);
        expect(res.success).toBe(false);
        if (!res.success) {
          const issue = res.error.issues.find((i) => i.path.includes('images'));
          expect(issue).toBeDefined();
          expect(issue?.message).toContain('Au moins une image');
        }
      });

      it('strictly rejects images with empty or missing URL', () => {
        const badImage = { id: 'img-1', url: '', alt: 'Image alt', isPrimary: true };
        const res = productImageSchema.safeParse(badImage);
        expect(res.success).toBe(false);
      });

      it('strictly rejects images with empty or missing alt description', () => {
        const badImage = { id: 'img-1', url: 'https://cdn.example.com/suit.jpg', alt: '', isPrimary: true };
        const res = productImageSchema.safeParse(badImage);
        expect(res.success).toBe(false);
      });
    });

    describe('1.4 Title & Description Length Boundaries', () => {
      it('strictly rejects titles with less than 5 characters', () => {
        const shortTitles = ['', 'A', 'Abc', 'Suit'];
        for (const title of shortTitles) {
          const res = productSchema.safeParse({ ...validBaseProduct, title });
          expect(res.success, `Expected title "${title}" to fail validation`).toBe(false);
          if (!res.success) {
            const issue = res.error.issues.find((i) => i.path.includes('title'));
            expect(issue).toBeDefined();
            expect(issue?.message).toContain('au moins 5 caractères');
          }
        }
      });

      it('accepts titles with exactly 5 or more characters', () => {
        const validTitles = ['Veste', 'Costume', 'Sneakers Cuir Blanc'];
        for (const title of validTitles) {
          const res = productSchema.safeParse({ ...validBaseProduct, title });
          expect(res.success, `Expected title "${title}" to pass validation`).toBe(true);
        }
      });

      it('strictly rejects descriptions with less than 10 characters', () => {
        const shortDescs = ['', 'Court', '123456789', 'Sept car'];
        for (const description of shortDescs) {
          const res = productSchema.safeParse({ ...validBaseProduct, description });
          expect(res.success, `Expected description "${description}" (len ${description.length}) to fail`).toBe(false);
          if (!res.success) {
            const issue = res.error.issues.find((i) => i.path.includes('description'));
            expect(issue).toBeDefined();
            expect(issue?.message).toContain('au moins 10 caractères');
          }
        }
      });
    });

    describe('1.5 French Slug Generation & Accents', () => {
      it('converts complex French titles with accents and punctuation into clean URL-safe slugs', () => {
        const cases = [
          {
            input: 'Costume Deux Pièces en Laine Super 130s',
            expected: 'costume-deux-pieces-en-laine-super-130s',
          },
          {
            input: 'Manteau d\'Hiver Élégant & Chaud — Édition Limitée 2026',
            expected: 'manteau-d-hiver-elegant-chaud-edition-limitee-2026',
          },
          {
            input: 'Mocassins en Cuir Pleine Fleur à Pampilles',
            expected: 'mocassins-en-cuir-pleine-fleur-a-pampilles',
          },
          {
            input: '  Boutons de Manchette Or 18k & Nacre   ',
            expected: 'boutons-de-manchette-or-18k-nacre',
          },
          {
            input: 'Sneakers @@@ Modernes --- Blanche !!!',
            expected: 'sneakers-modernes-blanche',
          },
        ];

        for (const c of cases) {
          expect(generateSlug(c.input)).toBe(c.expected);
        }
      });

      it('returns empty string when title is empty, null, or undefined', () => {
        expect(generateSlug('')).toBe('');
        expect(generateSlug(null as any)).toBe('');
        expect(generateSlug(undefined as any)).toBe('');
      });
    });

    describe('1.6 Category Enum & Subcategory Integrity', () => {
      it('strictly rejects unauthorized category strings', () => {
        const invalidCategories = ['furniture', 'watches', 'automotive', 'food'];
        for (const cat of invalidCategories) {
          const res = productSchema.safeParse({ ...validBaseProduct, categoryId: cat as any });
          expect(res.success, `Expected category "${cat}" to be rejected`).toBe(false);
        }
      });

      it('accepts authorized categories: clothing, shoes, accessories', () => {
        const validCategories = ['clothing', 'shoes', 'accessories'] as const;
        for (const cat of validCategories) {
          const res = productSchema.safeParse({ ...validBaseProduct, categoryId: cat });
          expect(res.success, `Expected category "${cat}" to be accepted`).toBe(true);
        }
      });
    });

    describe('1.7 calculateTotalStock Invariant Robustness', () => {
      it('computes correct sum for standard matrices', () => {
        expect(calculateTotalStock({ '48': 2, '50': 5, '52': 3 })).toBe(10);
      });

      it('gracefully handles empty, null, undefined, or non-object inputs', () => {
        expect(calculateTotalStock({})).toBe(0);
        expect(calculateTotalStock(null as any)).toBe(0);
        expect(calculateTotalStock(undefined as any)).toBe(0);
        expect(calculateTotalStock('not-an-object' as any)).toBe(0);
      });

      it('clamps negative stock entries to 0 without corrupting sum', () => {
        expect(calculateTotalStock({ '48': -5, '50': 4, '52': -10 })).toBe(4);
      });

      it('handles stringified numbers or non-numeric values gracefully', () => {
        expect(calculateTotalStock({ '48': '3' as any, '50': 'invalid' as any, '52': 2 })).toBe(5);
      });
    });
  });

  // =========================================================================
  // 2. DYNAMIC SIZE MATRIX EDGE CASES & STOREFRONT PDP (F-ADM-04)
  // =========================================================================
  describe('2. Dynamic Size Matrix Edge Cases & Storefront PDP', () => {
    describe('2.1 Clothing & Shoe Size Matrices with Zero Units', () => {
      it('evaluates total stock to 0 and inStock to false when all clothing sizes are 0', async () => {
        const zeroClothingMatrix = { '48': 0, '50': 0, '52': 0, '54': 0, '56': 0 };
        const total = calculateTotalStock(zeroClothingMatrix);
        expect(total).toBe(0);

        const newProductPayload = {
          title: 'Blazer Velours Nuit Épuisé',
          slug: 'blazer-velours-nuit-epuise',
          description: 'Veste de soirée en velours côtelé obsidian avec revers satin.',
          price: 28000,
          categoryId: 'clothing',
          subcategory: 'blazers',
          images: [
            {
              id: 'img-blazer',
              url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
              alt: 'Blazer Velours',
              isPrimary: true,
            },
          ],
          sizeInventory: zeroClothingMatrix,
        };

        const req = new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProductPayload),
        });

        const res = await createProductAPI(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.product.stockQuantity).toBe(0);
        expect(data.product.inStock).toBe(false);
      });

      it('evaluates total shoe stock to 0 when all shoe sizes (39-45) are 0', async () => {
        const zeroShoeMatrix = { '39': 0, '40': 0, '41': 0, '42': 0, '43': 0, '44': 0, '45': 0 };
        const total = calculateTotalStock(zeroShoeMatrix);
        expect(total).toBe(0);

        const newShoePayload = {
          title: 'Oxfords Cuir Noir Épuisées',
          slug: 'oxfords-cuir-noir-epuisees',
          description: 'Chaussures de ville haut de gamme en cuir de veau pleine fleur.',
          price: 22000,
          categoryId: 'shoes',
          subcategory: 'oxfords',
          images: [
            {
              id: 'img-shoe',
              url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
              alt: 'Oxfords Noir',
              isPrimary: true,
            },
          ],
          sizeInventory: zeroShoeMatrix,
        };

        const req = new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newShoePayload),
        });

        const res = await createProductAPI(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.product.stockQuantity).toBe(0);
        expect(data.product.inStock).toBe(false);
      });
    });

    describe('2.2 Partial Depletion & Stock Sum Consistency', () => {
      it('derives active sizes strictly matching sizes with quantity > 0', async () => {
        const partiallyDepletedMatrix = {
          '39': 0,
          '40': 2,
          '41': 0,
          '42': 5,
          '43': 0,
          '44': 1,
          '45': 0,
        };

        const totalStock = calculateTotalStock(partiallyDepletedMatrix);
        expect(totalStock).toBe(8);

        const newShoePayload = {
          title: 'Derbies Cuir Patiné Cognac',
          slug: 'derbies-cuir-patine-cognac',
          description: 'Derbies cousu Goodyear à patine artisanale cognac.',
          price: 24000,
          categoryId: 'shoes',
          subcategory: 'derbies',
          images: [
            {
              id: 'img-derby',
              url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
              alt: 'Derbies Cognac',
              isPrimary: true,
            },
          ],
          sizeInventory: partiallyDepletedMatrix,
        };

        const req = new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newShoePayload),
        });

        const res = await createProductAPI(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.product.stockQuantity).toBe(8);
        expect(data.product.inStock).toBe(true);
        expect(data.product.sizes).toEqual(['40', '42', '44']);
      });

      it('synchronizes stock and active sizes when updating existing product via PUT', async () => {
        // Retrieve an existing seeded product
        const store = getDataStore();
        const products = await store.getProducts();
        const targetProduct = products[0];
        expect(targetProduct).toBeDefined();

        const updatedMatrix = { '48': 0, '50': 3, '52': 0, '54': 0, '56': 1 };
        const req = new NextRequest(`http://localhost:3000/api/products/${targetProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sizeInventory: updatedMatrix,
          }),
        });

        const res = await updateProductAPI(req, { params: { id: targetProduct.id } });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.product.stockQuantity).toBe(4);
        expect(data.product.inStock).toBe(true);
        expect(data.product.sizes).toEqual(['50', '56']);
      });

      it('strictly rejects PUT update when compareAtPrice is equal or lower than price', async () => {
        const store = getDataStore();
        const products = await store.getProducts();
        const targetProduct = products[0];

        const req = new NextRequest(`http://localhost:3000/api/products/${targetProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            price: 50000,
            compareAtPrice: 40000, // Invalid: compareAtPrice lower than price
          }),
        });

        const res = await updateProductAPI(req, { params: { id: targetProduct.id } });
        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.success).toBe(false);
        expect(data.error).toContain('strictement supérieur au prix de vente');
      });
    });

    describe('2.3 Storefront PDP SizeSelector Component Depleted Size Disabling', () => {
      it('empirically disables depleted sizes (count 0) and displays "Épuisé" badge', () => {
        const onSelectSize = vi.fn();
        const allSizes = ['48', '50', '52', '54', '56'];
        const sizeInventory = {
          '48': 0, // Depleted
          '50': 3, // Available
          '52': 0, // Depleted
          '54': 2, // Available
          '56': 0, // Depleted
        };

        const { container } = render(
          <SizeSelector
            sizes={allSizes}
            selectedSize={null}
            onSelectSize={onSelectSize}
            sizeInventory={sizeInventory}
            inStock={true}
          />
        );

        // Find buttons for each size
        const btn48 = screen.getByRole('button', { name: /Taille 48/i });
        const btn50 = screen.getByRole('button', { name: /Taille 50/i });
        const btn52 = screen.getByRole('button', { name: /Taille 52/i });
        const btn54 = screen.getByRole('button', { name: /Taille 54/i });
        const btn56 = screen.getByRole('button', { name: /Taille 56/i });

        // Depleted buttons must be disabled and have line-through styling
        expect(btn48).toBeDisabled();
        expect(btn52).toBeDisabled();
        expect(btn56).toBeDisabled();
        expect(btn48.className).toContain('cursor-not-allowed');
        expect(btn48.className).toContain('line-through');

        // Available buttons must NOT be disabled
        expect(btn50).not.toBeDisabled();
        expect(btn54).not.toBeDisabled();

        // Clicking depleted size 48 must NOT trigger callback
        fireEvent.click(btn48);
        expect(onSelectSize).not.toHaveBeenCalled();

        // Clicking available size 50 MUST trigger callback
        fireEvent.click(btn50);
        expect(onSelectSize).toHaveBeenCalledWith('50');
      });

      it('disables ALL sizes when product inStock is false, even if inventory object exists', () => {
        const onSelectSize = vi.fn();
        const allSizes = ['39', '40', '41'];
        const sizeInventory = { '39': 5, '40': 2, '41': 1 };

        render(
          <SizeSelector
            sizes={allSizes}
            selectedSize={null}
            onSelectSize={onSelectSize}
            sizeInventory={sizeInventory}
            inStock={false} // Out of stock globally
          />
        );

        const btn39 = screen.getByRole('button', { name: /Taille 39/i });
        const btn40 = screen.getByRole('button', { name: /Taille 40/i });
        const btn41 = screen.getByRole('button', { name: /Taille 41/i });

        expect(btn39).toBeDisabled();
        expect(btn40).toBeDisabled();
        expect(btn41).toBeDisabled();

        fireEvent.click(btn39);
        expect(onSelectSize).not.toHaveBeenCalled();
      });

      it('renders null gracefully when sizes array is empty', () => {
        const { container } = render(
          <SizeSelector
            sizes={[]}
            selectedSize={null}
            onSelectSize={vi.fn()}
            inStock={true}
          />
        );
        expect(container.firstChild).toBeNull();
      });
    });
  });

  // =========================================================================
  // 3. 58 WILAYA DELIVERY FEE SETTINGS & FREE SHIPPING (F-ADM-06)
  // =========================================================================
  describe('3. 58 Wilaya Delivery Fee Settings & Free Shipping', () => {
    describe('3.1 Deep Merge Resilience (Partial Updates do NOT wipe out 57 wilayas)', () => {
      it('guarantees that updating Wilaya 16 does NOT wipe out the other 57 Algerian wilayas', async () => {
        // Step 1: Query initial settings via GET /api/settings
        const getRes1 = await getSettingsAPI();
        expect(getRes1.status).toBe(200);
        const initialData = await getRes1.json();
        const initialWilayaKeys = Object.keys(initialData.settings.wilayaShippingFees || {});
        expect(initialWilayaKeys.length).toBe(58);
        expect(initialData.settings.wilayaShippingFees[16]).toBeDefined();
        expect(initialData.settings.wilayaShippingFees[31]).toBeDefined(); // Oran
        expect(initialData.settings.wilayaShippingFees[25]).toBeDefined(); // Constantine
        expect(initialData.settings.wilayaShippingFees[58]).toBeDefined(); // El Meniaa

        // Step 2: PUT an update targeting ONLY Wilaya 16 (Alger)
        const partialUpdatePayload = {
          wilayaShippingFees: {
            16: {
              homeFee: 450,
              deskFee: 250,
              active: true,
            },
          },
        };

        const putReq = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partialUpdatePayload),
        });

        const putRes = await updateSettingsAPI(putReq);
        expect(putRes.status).toBe(200);
        const putData = await putRes.json();
        expect(putData.success).toBe(true);

        // Step 3: Verify the updated settings via GET /api/settings
        const getRes2 = await getSettingsAPI();
        expect(getRes2.status).toBe(200);
        const updatedData = await getRes2.json();
        const updatedFees = updatedData.settings.wilayaShippingFees;
        const updatedWilayaKeys = Object.keys(updatedFees || {});

        // CRITICAL INVARIANT: Count MUST be 58, NOT 1!
        expect(
          updatedWilayaKeys.length,
          `Adversarial failure: updating Wilaya 16 wiped out other wilayas! Count: ${updatedWilayaKeys.length}`
        ).toBe(58);

        // Wilaya 16 must have the new values
        expect(updatedFees[16].homeFee).toBe(450);
        expect(updatedFees[16].deskFee).toBe(250);

        // Other wilayas must still exist and maintain intact values
        expect(updatedFees[1]).toBeDefined();  // Adrar
        expect(updatedFees[31]).toBeDefined(); // Oran
        expect(updatedFees[58]).toBeDefined(); // El Meniaa
        expect(updatedFees[31].homeFee).toBeGreaterThan(0);
      });

      it('updates the wilayasDelivery array in tandem during settings update', async () => {
        const payload = {
          wilayaShippingFees: {
            31: {
              homeFee: 550,
              deskFee: 300,
              active: true,
            },
          },
        };

        const putReq = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const putRes = await updateSettingsAPI(putReq);
        const putData = await putRes.json();
        expect(putData.success).toBe(true);

        const deliveryList = putData.settings.wilayasDelivery;
        expect(Array.isArray(deliveryList)).toBe(true);
        expect(deliveryList.length).toBe(58);

        const oranItem = deliveryList.find((w: any) => w.code === 31);
        expect(oranItem).toBeDefined();
        expect(oranItem?.homeDeliveryFee).toBe(550);
        expect(oranItem?.deskFee).toBe(300);
      });
    });

    describe('3.2 Free Shipping Threshold Variations', () => {
      it('correctly waives delivery fee (returns 0 DA) at and above threshold', () => {
        const threshold = 15000;
        const wilayaCode = 16; // Alger

        // Below threshold: 14,999 DA
        const feeBelow = calculateDeliveryFee(14999, wilayaCode, threshold, 'home');
        expect(feeBelow).toBeGreaterThan(0);

        // Exactly at threshold: 15,000 DA
        const feeExact = calculateDeliveryFee(15000, wilayaCode, threshold, 'home');
        expect(feeExact).toBe(0);

        // Above threshold: 15,001 DA
        const feeAbove = calculateDeliveryFee(15001, wilayaCode, threshold, 'home');
        expect(feeAbove).toBe(0);
      });

      it('supports custom threshold values (e.g. 25,000 DA or 0 DA)', () => {
        const highThreshold = 25000;
        expect(calculateDeliveryFee(20000, 16, highThreshold, 'home')).toBeGreaterThan(0);
        expect(calculateDeliveryFee(25000, 16, highThreshold, 'home')).toBe(0);
        expect(calculateDeliveryFee(30000, 16, highThreshold, 'home')).toBe(0);

        // Zero threshold: ALL orders qualify for free delivery
        const zeroThreshold = 0;
        expect(calculateDeliveryFee(100, 16, zeroThreshold, 'home')).toBe(0);
        expect(calculateDeliveryFee(0, 16, zeroThreshold, 'home')).toBe(0);
      });
    });

    describe('3.3 Desk Delivery vs Home Delivery Across Wilayas', () => {
      it('differentiates home delivery fee from desk delivery fee (desk fee is cheaper)', () => {
        for (const code of [16, 31, 25, 9, 11]) {
          const homeFee = calculateDeliveryFee(5000, code, 15000, 'home');
          const deskFee = calculateDeliveryFee(5000, code, 15000, 'desk');
          expect(homeFee).toBeGreaterThan(0);
          expect(deskFee).toBeGreaterThan(0);
          expect(deskFee).toBeLessThan(homeFee);
        }
      });

      it('respects custom wilaya fee overrides when supplied to calculateDeliveryFee', () => {
        const customFees = {
          16: { homeFee: 300, deskFee: 150, active: true },
        };

        const home = calculateDeliveryFee(5000, 16, 15000, 'home', customFees);
        const desk = calculateDeliveryFee(5000, 16, 15000, 'desk', customFees);

        expect(home).toBe(300);
        expect(desk).toBe(150);
      });

      it('returns 0 DA when wilaya custom configuration has active: false', () => {
        const customFees = {
          16: { homeFee: 500, deskFee: 300, active: false },
        };
        const fee = calculateDeliveryFee(5000, 16, 15000, 'home', customFees);
        expect(fee).toBe(0);
      });
    });

    describe('3.4 Wilaya Code Boundaries & Settings Schema', () => {
      it('gracefully handles boundary codes (0, 59, negative, null, undefined) with default fallback', () => {
        expect(calculateDeliveryFee(5000, 0, 15000)).toBe(600);
        expect(calculateDeliveryFee(5000, 59, 15000)).toBe(600);
        expect(calculateDeliveryFee(5000, -1, 15000)).toBe(600);
        expect(calculateDeliveryFee(5000, null, 15000)).toBe(600);
        expect(calculateDeliveryFee(5000, undefined, 15000)).toBe(600);
      });

      it('strictly rejects negative delivery fees in settings validation schema', () => {
        const badFee = { homeFee: -100, deskFee: 300, active: true };
        const res = wilayaShippingFeeItemSchema.safeParse(badFee);
        expect(res.success).toBe(false);

        const badSettings = {
          freeShippingThreshold: -5000,
        };
        const resSettings = updateStoreSettingsSchema.safeParse(badSettings);
        expect(resSettings.success).toBe(false);
      });
    });
  });

  // =========================================================================
  // 4. MEDIA UPLOADER & GOOGLE DRIVE STREAMING CONVERSION (F-ADM-05)
  // =========================================================================
  describe('4. Media Uploader & Google Drive Streaming Conversion', () => {
    describe('4.1 Single isPrimary Invariant', () => {
      // Replicate the enforceSinglePrimary logic used by AdminMediaUpload
      const enforceSinglePrimary = (list: ProductImage[]): ProductImage[] => {
        if (list.length === 0) return [];
        const hasPrimary = list.some((img) => img.isPrimary);
        if (!hasPrimary) {
          return list.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));
        }
        let primaryFound = false;
        return list.map((img) => {
          if (img.isPrimary && !primaryFound) {
            primaryFound = true;
            return { ...img, isPrimary: true };
          }
          return { ...img, isPrimary: false };
        });
      };

      it('enforces that exactly one image is primary when none is marked', () => {
        const input: ProductImage[] = [
          { id: '1', url: 'https://cdn.example.com/1.jpg', alt: '1', isPrimary: false },
          { id: '2', url: 'https://cdn.example.com/2.jpg', alt: '2', isPrimary: false },
          { id: '3', url: 'https://cdn.example.com/3.jpg', alt: '3', isPrimary: false },
        ];

        const output = enforceSinglePrimary(input);
        const primaries = output.filter((img) => img.isPrimary);
        expect(primaries.length).toBe(1);
        expect(output[0].isPrimary).toBe(true);
        expect(output[1].isPrimary).toBe(false);
        expect(output[2].isPrimary).toBe(false);
      });

      it('enforces that ONLY ONE image is primary when multiple are marked true', () => {
        const input: ProductImage[] = [
          { id: '1', url: 'https://cdn.example.com/1.jpg', alt: '1', isPrimary: true },
          { id: '2', url: 'https://cdn.example.com/2.jpg', alt: '2', isPrimary: true },
          { id: '3', url: 'https://cdn.example.com/3.jpg', alt: '3', isPrimary: true },
        ];

        const output = enforceSinglePrimary(input);
        const primaries = output.filter((img) => img.isPrimary);
        expect(primaries.length).toBe(1);
        expect(output[0].isPrimary).toBe(true);
        expect(output[1].isPrimary).toBe(false);
        expect(output[2].isPrimary).toBe(false);
      });

      it('promotes the first remaining image when the primary image is removed', () => {
        const input: ProductImage[] = [
          { id: '1', url: 'https://cdn.example.com/1.jpg', alt: '1', isPrimary: true },
          { id: '2', url: 'https://cdn.example.com/2.jpg', alt: '2', isPrimary: false },
          { id: '3', url: 'https://cdn.example.com/3.jpg', alt: '3', isPrimary: false },
        ];

        // Simulate deleting image '1'
        const remaining = input.filter((img) => img.id !== '1');
        const output = enforceSinglePrimary(remaining);

        expect(output.length).toBe(2);
        const primaries = output.filter((img) => img.isPrimary);
        expect(primaries.length).toBe(1);
        expect(output[0].id).toBe('2');
        expect(output[0].isPrimary).toBe(true);
        expect(output[1].isPrimary).toBe(false);
      });

      it('returns empty array cleanly when all images are deleted', () => {
        expect(enforceSinglePrimary([])).toEqual([]);
      });
    });

    describe('4.2 Google Drive Streaming Conversion Robustness', () => {
      const validDriveId = '1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7';

      it('converts standard /file/d/{id}/view share links into direct export streaming endpoints', () => {
        const shareLink = `https://drive.google.com/file/d/${validDriveId}/view?usp=sharing`;
        const normalized = normalizeGoogleDriveUrl(shareLink, 'uc');
        expect(normalized).toBe(`https://drive.google.com/uc?export=view&id=${validDriveId}`);
      });

      it('converts /open?id={id} share links into streaming endpoints', () => {
        const openLink = `https://drive.google.com/open?id=${validDriveId}`;
        const normalized = normalizeGoogleDriveUrl(openLink, 'uc');
        expect(normalized).toBe(`https://drive.google.com/uc?export=view&id=${validDriveId}`);
      });

      it('converts /uc?id={id} links into direct streaming endpoints', () => {
        const ucLink = `https://drive.google.com/uc?id=${validDriveId}&export=download`;
        const normalized = normalizeGoogleDriveUrl(ucLink, 'uc');
        expect(normalized).toBe(`https://drive.google.com/uc?export=view&id=${validDriveId}`);
      });

      it('supports Google lh3 CDN format with custom width transforms', () => {
        const shareLink = `https://drive.google.com/file/d/${validDriveId}/view`;
        const normalized = normalizeGoogleDriveUrl(shareLink, 'lh3', 800);
        expect(normalized).toBe(`https://lh3.googleusercontent.com/d/${validDriveId}=w800`);
      });

      it('normalizes raw 33-character Google Drive alphanumeric IDs directly', () => {
        const normalized = normalizeImageUrl(validDriveId);
        expect(normalized).toBe(`https://drive.google.com/uc?export=view&id=${validDriveId}`);
      });
    });

    describe('4.3 Malformed, Dangerous & Nested Drive URLs', () => {
      it('returns luxury SVG placeholder when Google Drive URL is a folder link (not a file)', () => {
        const folderLink = 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456';
        const normalized = normalizeImageUrl(folderLink);
        expect(normalized.startsWith('data:image/svg+xml')).toBe(true);
      });

      it('returns luxury SVG placeholder when Google Drive URL is truncated or has missing file ID', () => {
        const malformedDriveUrls = [
          'https://drive.google.com/file/d/',
          'https://drive.google.com/file/d//view',
          'https://drive.google.com/open?id=',
          'https://drive.google.com/uc?id=',
          'https://docs.google.com/document/d/123/edit',
          'https://drive.google.com/drive/u/0/my-drive',
        ];

        for (const badUrl of malformedDriveUrls) {
          const res = normalizeImageUrl(badUrl);
          expect(res.startsWith('data:image/svg+xml'), `Expected ${badUrl} to fallback to SVG`).toBe(true);
        }
      });

      it('extracts token from /file/d/{token} links and constructs stream endpoint', () => {
        const driveUrl = 'https://drive.google.com/file/d/1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7/view';
        const res = normalizeImageUrl(driveUrl);
        expect(res).toBe('https://drive.google.com/uc?export=view&id=1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7');
      });

      it('blocks dangerous XSS payloads and script protocols', () => {
        const dangerous = [
          'javascript:alert(1)',
          'vbscript:msgbox("hello")',
          'data:text/html,<script>alert(1)</script>',
          '//malicious-domain.com/evil.jpg',
        ];

        for (const bad of dangerous) {
          const res = normalizeImageUrl(bad);
          expect(res.startsWith('data:image/svg+xml'), `Expected ${bad} to fallback to SVG`).toBe(true);
        }
      });

      it('does NOT falsely identify random lowercase slug strings as Google Drive IDs', () => {
        const randomSlugs = [
          'costume-deux-pieces-en-laine-italienne-super-130s',
          'chaussures-richelieu-cuir-noir-homme',
          'not-a-google-drive-id-slug-pattern',
        ];

        for (const slug of randomSlugs) {
          expect(extractGoogleDriveId(slug)).toBeNull();
        }
      });

      it('safely escapes XSS injection attempts inside SVG luxury placeholders', () => {
        const maliciousCategory = '"><script>alert("xss")</script><svg onload="alert(1)"';
        const svgUri = getLuxuryPlaceholderSvg(maliciousCategory);

        expect(svgUri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
        const decodedSvg = decodeURIComponent(svgUri);

        // Raw unsanitized <script> or unescaped quotes must NOT be present
        expect(decodedSvg).not.toContain('<script>');
        expect(decodedSvg).toContain('&lt;SCRIPT&gt;');
        expect(decodedSvg).toContain('&quot;');
      });
    });
  });

  // =========================================================================
  // 5. CATALOG LIFECYCLE & SETTINGS API ENDPOINT HARDENING (F-ADM-03, F-ADM-06)
  // =========================================================================
  describe('5. Catalog Lifecycle & Settings API Endpoint Hardening', () => {
      it('creates, queries, filters, updates, and deletes products cleanly through API routes', async () => {
        // Step 1: Create a bespoke accessory product
        const createPayload = {
          title: 'Ceinture Réversible Cuir Saffiano & Boucle Or',
          slug: 'ceinture-reversible-cuir-saffiano-boucle-or',
          description: 'Ceinture artisanale réversible confectionnée en cuir de veau Saffiano avec boucle dorée 18k.',
          price: 16500,
          compareAtPrice: 21000,
          categoryId: 'accessories',
          subcategory: 'ceintures',
          images: [
            {
              id: 'img-belt-1',
              url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc',
              alt: 'Ceinture Saffiano Or',
              isPrimary: true,
            },
          ],
          sizeInventory: { '85': 3, '90': 5, '95': 4, '100': 2 },
        };

        const postReq = new NextRequest('http://localhost:3000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createPayload),
        });

        const postRes = await createProductAPI(postReq);
        expect(postRes.status).toBe(201);
        const postData = await postRes.json();
        expect(postData.success).toBe(true);
        const createdId = postData.product.id;
        expect(createdId).toBeDefined();
        expect(postData.product.stockQuantity).toBe(14);
        expect(postData.product.categorySlug).toBe('accessoires'); // Auto-inferred

        // Step 2: Query by ID via GET /api/products/[id]
        const getByIdReq = new NextRequest(`http://localhost:3000/api/products/${createdId}`);
        const getByIdRes = await getProductByIdAPI(getByIdReq, { params: { id: createdId } });
        expect(getByIdRes.status).toBe(200);
        const getByIdData = await getByIdRes.json();
        expect(getByIdData.product.title).toBe(createPayload.title);

        // Step 3: Query catalog with filter matching category
        const filterReq = new NextRequest('http://localhost:3000/api/products?categoryId=accessories&search=Ceinture');
        const filterRes = await getProductsAPI(filterReq);
        expect(filterRes.status).toBe(200);
        const filterData = await filterRes.json();
        const found = filterData.products.some((p: any) => p.id === createdId);
        expect(found).toBe(true);

        // Step 4: Delete product via DELETE /api/products/[id]
        const delReq = new NextRequest(`http://localhost:3000/api/products/${createdId}`, { method: 'DELETE' });
        const delRes = await deleteProductAPI(delReq, { params: { id: createdId } });
        expect(delRes.status).toBe(200);
        const delData = await delRes.json();
        expect(delData.success).toBe(true);

        // Step 5: Verify product is no longer found (404)
        const verifyReq = new NextRequest(`http://localhost:3000/api/products/${createdId}`);
        const verifyRes = await getProductByIdAPI(verifyReq, { params: { id: createdId } });
        expect(verifyRes.status).toBe(404);
      });

      it('returns 404 when querying, updating, or deleting a non-existent product ID', async () => {
        const fakeId = 'non-existent-product-id-9999';

        const getReq = new NextRequest(`http://localhost:3000/api/products/${fakeId}`);
        const getRes = await getProductByIdAPI(getReq, { params: { id: fakeId } });
        expect(getRes.status).toBe(404);

        const putReq = new NextRequest(`http://localhost:3000/api/products/${fakeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: 30000 }),
        });
        const putRes = await updateProductAPI(putReq, { params: { id: fakeId } });
        expect(putRes.status).toBe(404);

        const delReq = new NextRequest(`http://localhost:3000/api/products/${fakeId}`, { method: 'DELETE' });
        const delRes = await deleteProductAPI(delReq, { params: { id: fakeId } });
        expect(delRes.status).toBe(404);
      });

      it('strictly rejects invalid store settings payloads (malformed email, short phone) via PUT /api/settings', async () => {
        const invalidSettings = {
          email: 'not-an-email-address',
          phone: '123', // Too short (min 9)
        };

        const putReq = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invalidSettings),
        });

        const putRes = await updateSettingsAPI(putReq);
        expect(putRes.status).toBe(400);
        const data = await putRes.json();
        expect(data.success).toBe(false);
        expect(data.errors).toBeDefined();
        expect(data.errors.email).toBeDefined();
        expect(data.errors.phone).toBeDefined();
      });

      it('supports toggling store maintenanceMode in settings and preserves existing wilayas', async () => {
        const togglePayload = {
          maintenanceMode: true,
        };

        const putReq = new NextRequest('http://localhost:3000/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(togglePayload),
        });

        const putRes = await updateSettingsAPI(putReq);
        expect(putRes.status).toBe(200);
        const putData = await putRes.json();
        expect(putData.success).toBe(true);
        expect(putData.settings.maintenanceMode).toBe(true);
        expect(Object.keys(putData.settings.wilayaShippingFees || {}).length).toBe(58);
      });
    });
  });
