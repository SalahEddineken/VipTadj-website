import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { getDataStore } from '@/lib/data-provider';
import { NextRequest } from 'next/server';
import { POST as createOrderApi } from '@/app/api/orders/route';
import { Product } from '@/types';
import { renderWithProviders } from './helpers/renderWithProviders';
import { AddToCartSection } from '@/components/store/pdp/AddToCartSection';

describe('Size Matrix & Stock Management (size-inventory-stock-management.test.ts)', () => {
  const store = getDataStore();

  const createShoesProduct = async (): Promise<Product> => {
    return await store.createProduct({
      title: 'Richelieus en Cuir Box-Calf Pleine Fleur',
      slug: 'richelieus-cuir-box-calf-pleine-fleur',
      description: 'Souliers habillés classiques.',
      price: 32000,
      categoryId: 'shoes',
      categorySlug: 'chaussures',
      subcategory: 'richelieu',
      images: [
        {
          id: 'shoe-1',
          url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
          alt: 'Richelieus',
          isPrimary: true,
        },
      ],
      sizes: ['39', '40', '41', '42', '43', '44', '45'],
      sizeInventory: {
        '39': 1,
        '40': 10,
        '41': 4,
        '42': 5,
        '43': 3,
        '44': 2,
        '45': 1,
      },
      stockQuantity: 26,
      inStock: true,
      isFeatured: true,
      isNewArrival: false,
    });
  };

  it('correctly decrements size inventory and total stock when an order is created', async () => {
    const product = await createShoesProduct();
    expect(product.stockQuantity).toBe(26);
    expect(product.sizeInventory?.['39']).toBe(1);

    // Order 1 unit of size 39
    const order = await store.createOrder({
      customer: {
        fullName: 'Karim Ziani',
        phone: '0555123456',
        wilaya: 'Alger',
        wilayaCode: 16,
        commune: 'Hydra',
        address: 'Rue Diderot',
      },
      items: [
        {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          quantity: 1,
          selectedSize: '39',
          image: product.images[0].url,
        },
      ],
      deliveryFee: 600,
    });

    const updatedProduct = await store.getProductById(product.id);
    expect(updatedProduct).not.toBeNull();
    // Size 39 should drop from 1 to 0
    expect(updatedProduct!.sizeInventory?.['39']).toBe(0);
    // Total stock should drop from 26 to 25
    expect(updatedProduct!.stockQuantity).toBe(25);
    expect(updatedProduct!.inStock).toBe(true);

    // Cancel the order -> stock should be restored to 1 for size 39 and 26 total
    await store.updateOrderStatus(order.id, 'cancelled', 'Annulation client');
    const restoredProduct = await store.getProductById(product.id);
    expect(restoredProduct!.sizeInventory?.['39']).toBe(1);
    expect(restoredProduct!.stockQuantity).toBe(26);
  });

  it('rejects an order via API if requested quantity exceeds available stock for the selected size', async () => {
    const product = await createShoesProduct();
    expect(product.sizeInventory?.['39']).toBe(1);

    // Attempt to order 2 units of size 39 when only 1 is in stock
    const payload = {
      customer: {
        fullName: 'Amine Slimani',
        phone: '0550112233',
        wilaya: '16 - Alger',
        wilayaCode: 16,
        commune: 'Kouba',
        address: 'Rue de la Liberté',
        deliveryType: 'home',
      },
      items: [
        {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          quantity: 2, // Exceeds size 39 stock of 1!
          selectedSize: '39',
          image: product.images[0].url,
        },
      ],
      deliveryFee: 600,
    };

    const req = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await createOrderApi(req);
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('OUT_OF_STOCK');
    expect(body.error).toContain('Stock insuffisant');
    expect(body.error).toContain('39');
    expect(body.availableStock).toBe(1);

    // Verify stock was NOT decremented
    const untouched = await store.getProductById(product.id);
    expect(untouched!.sizeInventory?.['39']).toBe(1);
    expect(untouched!.stockQuantity).toBe(26);
  });

  it('allows order when requested quantity is within size stock', async () => {
    const product = await createShoesProduct();

    // Order 5 units of size 40 (which has 10 available)
    const payload = {
      customer: {
        fullName: 'Riyad Mahrez',
        phone: '0550998877',
        wilaya: '16 - Alger',
        wilayaCode: 16,
        commune: 'El Biar',
        address: 'Avenue de l’Indépendance',
        deliveryType: 'home',
      },
      items: [
        {
          productId: product.id,
          title: product.title,
          slug: product.slug,
          price: product.price,
          quantity: 5,
          selectedSize: '40',
          image: product.images[0].url,
        },
      ],
      deliveryFee: 600,
    };

    const req = new NextRequest('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await createOrderApi(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);

    const productAfter = await store.getProductById(product.id);
    // Size 40 drops from 10 to 5
    expect(productAfter!.sizeInventory?.['40']).toBe(5);
    // Total stock drops from 26 to 21
    expect(productAfter!.stockQuantity).toBe(21);
  });

  it('prevents customer from increasing quantity above size stock in AddToCartSection', async () => {
    const product = await createShoesProduct();
    // Size 39 has only 1 available unit
    renderWithProviders(
      <AddToCartSection
        product={product}
        selectedSize="39"
        onValidateSize={() => true}
      />,
      { language: 'fr' }
    );

    // Initial quantity is 1
    expect(screen.getByText('1')).toBeInTheDocument();

    // Available stock indicator shows 1
    expect(screen.getByText(/1.*exemplaires disponibles/i)).toBeInTheDocument();

    // Plus button should be DISABLED because stock is 1 and quantity is 1
    const plusBtn = screen.getByRole('button', { name: /augmenter/i });
    expect(plusBtn).toBeDisabled();

    // Clicking plus should NOT change quantity
    fireEvent.click(plusBtn);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('disables Add to Cart when a size with 0 stock is selected', async () => {
    const product = await createShoesProduct();
    // Product with size 38 having 0 stock
    const oosSizeProduct = {
      ...product,
      sizeInventory: {
        ...product.sizeInventory,
        '38': 0,
      },
    };

    renderWithProviders(
      <AddToCartSection
        product={oosSizeProduct}
        selectedSize="38"
        onValidateSize={() => true}
      />,
      { language: 'fr' }
    );

    // Should indicate size is out of stock (appears in badge and disabled button)
    const outOfStockBadges = screen.getAllByText(/épuisée/i);
    expect(outOfStockBadges.length).toBeGreaterThanOrEqual(1);

    // Add to Cart button should be disabled
    const addBtn = screen.getByRole('button', { name: /taille épuisée/i });
    expect(addBtn).toBeDisabled();
  });
});
