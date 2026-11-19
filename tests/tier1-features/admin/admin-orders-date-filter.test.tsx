import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrdersManagementClient } from '@/components/admin/OrdersManagementClient';
import { LanguageProvider } from '@/lib/context/language-context';
import { Order } from '@/types';

function createMockOrder(id: string, dateStr: string, status: Order['status'] = 'confirmed'): Order {
  return {
    id,
    orderNumber: `VT-2026-${id}`,
    customer: {
      fullName: `Client ${id}`,
      phone: '0555000000',
      wilaya: 'Alger',
      wilayaCode: 16,
      commune: 'Alger Centre',
      address: 'Rue Didouche',
    },
    items: [],
    subtotal: 10000,
    shippingFee: 400,
    total: 10400,
    deliveryType: 'home',
    status,
    createdAt: dateStr,
    updatedAt: dateStr,
    statusHistory: [],
  };
}

describe('Admin Orders Date Filter (Today, This Month, All)', () => {
  const now = new Date();
  const todayISO = now.toISOString();

  // Create an order from earlier this month
  const pastDay = new Date(now.getFullYear(), now.getMonth(), 1, 10, 0, 0);
  const pastDayISO = pastDay.toISOString();

  // Create an order from last year / old month
  const lastYearISO = new Date(now.getFullYear() - 1, 5, 15, 10, 0, 0).toISOString();

  const mockOrders: Order[] = [
    createMockOrder('today-1', todayISO, 'delivered'),
    createMockOrder('month-1', pastDayISO, 'confirmed'),
    createMockOrder('old-1', lastYearISO, 'delivered'),
  ];

  it('renders date filter tabs (Today, This Month, All) and filters accurately', () => {
    render(
      <LanguageProvider defaultLanguage="ar">
        <OrdersManagementClient initialOrders={mockOrders} />
      </LanguageProvider>
    );

    // Initial state: 'All' is active, all 3 orders should be visible
    expect(screen.getByText('VT-2026-today-1')).toBeDefined();
    expect(screen.getByText('VT-2026-month-1')).toBeDefined();
    expect(screen.getByText('VT-2026-old-1')).toBeDefined();

    // Click 'اليوم' (Today) tab
    const todayBtn = screen.getByRole('button', { name: /اليوم/ });
    fireEvent.click(todayBtn);

    // Only today's order is visible
    expect(screen.getByText('VT-2026-today-1')).toBeDefined();
    expect(screen.queryByText('VT-2026-old-1')).toBeNull();

    // Click 'هذا الشهر' (This Month) tab
    const monthBtn = screen.getByRole('button', { name: /هذا الشهر/ });
    fireEvent.click(monthBtn);

    // Both today and earlier this month are visible, but not last year
    expect(screen.getByText('VT-2026-today-1')).toBeDefined();
    expect(screen.getByText('VT-2026-month-1')).toBeDefined();
    expect(screen.queryByText('VT-2026-old-1')).toBeNull();

    // Click 'الكل' (All) tab
    const allDateBtns = screen.getAllByRole('button', { name: /الكل/ });
    // Click the date filter 'الكل' button (last one)
    fireEvent.click(allDateBtns[allDateBtns.length - 1]);

    // All orders visible again
    expect(screen.getByText('VT-2026-today-1')).toBeDefined();
    expect(screen.getByText('VT-2026-month-1')).toBeDefined();
    expect(screen.getByText('VT-2026-old-1')).toBeDefined();
  });
});
