import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderEditModal } from '@/components/admin/OrderEditModal';
import { OrderItemsTable } from '@/components/admin/OrderItemsTable';
import { ordersFixture } from '../../fixtures/orders.fixture';
import { Order } from '@/types';

describe('Order Edit Feature (F-ORD-EDIT)', () => {
  const sampleOrder: Order = {
    ...ordersFixture[0],
    items: [
      {
        productId: 'prod-1',
        title: 'Pull Lacoste',
        slug: 'pull-lacoste',
        price: 6800,
        quantity: 2,
        selectedSize: 'M',
        selectedColor: 'Noir',
        image: 'https://images.unsplash.com/photo-1.jpg',
      },
      {
        productId: 'prod-2',
        title: 'Chemise Blanche',
        slug: 'chemise-blanche',
        price: 5000,
        quantity: 1,
        selectedSize: 'L',
        selectedColor: 'Blanc',
        image: 'https://images.unsplash.com/photo-2.jpg',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              products: [
                {
                  id: 'prod-3',
                  title: 'Costume Laine',
                  slug: 'costume-laine',
                  price: 45000,
                  sizes: ['48', '50', '52'],
                  colors: [{ name: 'Bleu', hex: '#0000ff', inStock: true }],
                  primaryImage: 'https://images.unsplash.com/photo-3.jpg',
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, order: sampleOrder }),
      });
    });
  });

  it('renders OrderItemsTable with edit items button when onEditItems is provided', () => {
    const handleEdit = vi.fn();
    render(
      <OrderItemsTable
        items={sampleOrder.items}
        subtotal={sampleOrder.subtotal}
        deliveryFee={sampleOrder.deliveryFee}
        total={sampleOrder.total}
        onEditItems={handleEdit}
      />
    );

    const editBtn = screen.getByRole('button', { name: /modifier les articles/i });
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('renders OrderEditModal with order items and handles quantity change and deletion', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <OrderEditModal
        isOpen={true}
        onClose={handleClose}
        order={sampleOrder}
        onSuccess={handleSuccess}
      />
    );

    // Check modal title and items
    expect(screen.getByText(/modifier les articles de la commande/i)).toBeDefined();
    expect(screen.getByText('Pull Lacoste')).toBeDefined();
    expect(screen.getByText('Chemise Blanche')).toBeDefined();

    // Check quantity of Pull Lacoste is 2
    expect(screen.getByText('2')).toBeDefined();

    // Increase quantity of Pull Lacoste
    const plusButtons = screen.getAllByTitle('Quantité');
    // Clicking plus on first item
    fireEvent.click(plusButtons[1]); // [minus0, plus0, minus1, plus1]
    expect(screen.getByText('3')).toBeDefined();

    // Delete second item
    const deleteButtons = screen.getAllByTitle('Supprimer');
    expect(deleteButtons.length).toBe(2);
    fireEvent.click(deleteButtons[1]);

    // Chemise Blanche should be removed
    expect(screen.queryByText('Chemise Blanche')).toBeNull();

    // Now only 1 item remains, delete button should be disabled
    const remainingDeleteButtons = screen.getAllByTitle('Supprimer');
    expect(remainingDeleteButtons[0]).toHaveProperty('disabled', true);
  });

  it('allows adding a new product from catalog to order', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    render(
      <OrderEditModal
        isOpen={true}
        onClose={handleClose}
        order={sampleOrder}
        onSuccess={handleSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Costume Laine/i)).toBeDefined();
    });

    // Select product
    const productSelect = screen.getByLabelText(/sélectionner un produit du catalogue/i) || screen.getByRole('combobox');
    fireEvent.change(productSelect, { target: { value: 'prod-3' } });

    // Click "Ajouter à la commande"
    const addBtn = screen.getByRole('button', { name: /ajouter à la commande/i });
    fireEvent.click(addBtn);

    // Costume Laine should now be in the items list
    expect(screen.getAllByText(/Costume Laine/i).length).toBeGreaterThan(0);
  });
});
