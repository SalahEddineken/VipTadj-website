import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderFilters } from '@/components/admin/OrderFilters';
import { OrderTable } from '@/components/admin/OrderTable';
import { OrderItemsTable } from '@/components/admin/OrderItemsTable';
import { ordersFixture } from '../../fixtures/orders.fixture';
import { Order } from '@/types';

describe('Admin Orders UI Components (F-ORD-01 & F-ORD-02)', () => {
  const sampleOrder: Order = ordersFixture[0];

  describe('OrderStatusBadge', () => {
    it('renders correct French label for each order status', () => {
      const { rerender } = render(<OrderStatusBadge status="pending" />);
      expect(screen.getByText('En attente')).toBeDefined();

      rerender(<OrderStatusBadge status="confirmed" />);
      expect(screen.getByText('Confirmée')).toBeDefined();

      rerender(<OrderStatusBadge status="shipped" />);
      expect(screen.getByText('Expédiée')).toBeDefined();

      rerender(<OrderStatusBadge status="delivered" />);
      expect(screen.getByText('Livrée')).toBeDefined();

      rerender(<OrderStatusBadge status="cancelled" />);
      expect(screen.getByText('Annulée')).toBeDefined();
    });

    it('applies luxury styling tokens and size classes', () => {
      const { container } = render(<OrderStatusBadge status="pending" size="lg" />);
      const badge = container.querySelector('span');
      expect(badge?.className).toContain('bg-amber-50');
      expect(badge?.className).toContain('text-amber-800');
      expect(badge?.className).toContain('border-amber-200');
      expect(badge?.className).toContain('text-sm');
    });
  });

  describe('OrderFilters', () => {
    const mockCounts = {
      all: 10,
      pending: 3,
      confirmed: 2,
      shipped: 2,
      delivered: 2,
      cancelled: 1,
    };

    it('renders all 6 status tabs with real-time counts', () => {
      render(
        <OrderFilters
          activeStatus="all"
          onStatusChange={vi.fn()}
          counts={mockCounts}
          searchQuery=""
          onSearchChange={vi.fn()}
          wilayaFilter="all"
          onWilayaChange={vi.fn()}
          dateSort="newest"
          onDateSortChange={vi.fn()}
          onReset={vi.fn()}
          isFiltered={false}
        />
      );

      expect(screen.getByText('Toutes')).toBeDefined();
      expect(screen.getByText('En attente')).toBeDefined();
      expect(screen.getByText('Confirmées')).toBeDefined();
      expect(screen.getByText('Expédiées')).toBeDefined();
      expect(screen.getByText('Livrées')).toBeDefined();
      expect(screen.getByText('Annulées')).toBeDefined();
      expect(screen.getByText('10')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });

    it('triggers onStatusChange when a tab is clicked', () => {
      const onStatusChange = vi.fn();
      render(
        <OrderFilters
          activeStatus="all"
          onStatusChange={onStatusChange}
          counts={mockCounts}
          searchQuery=""
          onSearchChange={vi.fn()}
          wilayaFilter="all"
          onWilayaChange={vi.fn()}
          dateSort="newest"
          onDateSortChange={vi.fn()}
          onReset={vi.fn()}
          isFiltered={false}
        />
      );

      fireEvent.click(screen.getByText('En attente'));
      expect(onStatusChange).toHaveBeenCalledWith('pending');
    });

    it('triggers onSearchChange when typing in the search input', () => {
      const onSearchChange = vi.fn();
      render(
        <OrderFilters
          activeStatus="all"
          onStatusChange={vi.fn()}
          counts={mockCounts}
          searchQuery=""
          onSearchChange={onSearchChange}
          wilayaFilter="all"
          onWilayaChange={vi.fn()}
          dateSort="newest"
          onDateSortChange={vi.fn()}
          onReset={vi.fn()}
          isFiltered={false}
        />
      );

      const input = screen.getByPlaceholderText(/Rechercher par réf/i);
      fireEvent.change(input, { target: { value: 'Karim' } });
      expect(onSearchChange).toHaveBeenCalledWith('Karim');
    });

    it('renders reset button when isFiltered is true and calls onReset', () => {
      const onReset = vi.fn();
      render(
        <OrderFilters
          activeStatus="pending"
          onStatusChange={vi.fn()}
          counts={mockCounts}
          searchQuery="test"
          onSearchChange={vi.fn()}
          wilayaFilter={16}
          onWilayaChange={vi.fn()}
          dateSort="newest"
          onDateSortChange={vi.fn()}
          onReset={onReset}
          isFiltered={true}
        />
      );

      const resetBtn = screen.getByText('Réinitialiser');
      expect(resetBtn).toBeDefined();
      fireEvent.click(resetBtn);
      expect(onReset).toHaveBeenCalled();
    });
  });

  describe('OrderTable', () => {
    it('renders orders table with customer details, phone, and total COD', () => {
      render(<OrderTable orders={[sampleOrder]} />);

      expect(screen.getByText(sampleOrder.orderNumber)).toBeDefined();
      expect(screen.getByText(sampleOrder.customer.fullName)).toBeDefined();
      expect(screen.getByText(sampleOrder.customer.phone)).toBeDefined();
    });

    it('renders RFC-compliant tel: link and WhatsApp link', () => {
      const { container } = render(<OrderTable orders={[sampleOrder]} />);

      const telLink = container.querySelector('a[href^="tel:+213"]');
      expect(telLink).not.toBeNull();
      expect(telLink?.getAttribute('href')).toContain('tel:+213');

      const waLink = container.querySelector('a[href^="https://wa.me/213"]');
      expect(waLink).not.toBeNull();
    });

    it('renders empty state when orders array is empty', () => {
      render(<OrderTable orders={[]} isFiltered={true} onResetFilters={vi.fn()} />);
      expect(screen.getByText('Aucune commande trouvée')).toBeDefined();
      expect(screen.getByText('Réinitialiser les filtres')).toBeDefined();
    });
  });

  describe('OrderItemsTable', () => {
    it('renders line items with quantities, prices, size badges, and financial breakdown', () => {
      render(
        <OrderItemsTable
          items={sampleOrder.items}
          subtotal={sampleOrder.subtotal}
          deliveryFee={sampleOrder.deliveryFee}
          total={sampleOrder.total}
          wilayaName={sampleOrder.customer.wilaya}
        />
      );

      expect(screen.getByText(sampleOrder.items[0].title)).toBeDefined();
      expect(screen.getByText(`Taille ${sampleOrder.items[0].selectedSize}`)).toBeDefined();
      expect(screen.getByText('Récapitulatif Financier COD')).toBeDefined();
    });
  });
});
