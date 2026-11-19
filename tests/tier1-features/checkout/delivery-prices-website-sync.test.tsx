import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { screen, renderHook } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import { calculateDeliveryFee } from '@/lib/utils/deliveryUtils';
import { MockSeedDataProvider } from '@/lib/data-provider/mock-provider';
import { POST as ordersPost } from '@/app/api/orders/route';
import { NextRequest } from 'next/server';
import { getDataStore } from '@/lib/data-provider';
import { useCart, CartProvider } from '@/lib/context/cart-context';
import { StoreSettingsProvider } from '@/lib/context/store-settings-context';

describe('Delivery Prices Website Synchronization', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  describe('WilayaSelector with Custom Fees & Baladiyat Overrides', () => {
    it('displays updated custom homeFee and deskFee when customFees are provided', () => {
      // Custom rate for Alger (16): Home 850 DA, Desk 450 DA (default is 400 DA / 250 DA)
      const customFees = {
        16: { homeFee: 850, deskFee: 450, active: true },
      };

      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={5000}
          freeShippingThreshold={15000}
          customFees={customFees}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'fr' }
      );

      // Home delivery card should display 850 DA
      expect(screen.getByText(/850/)).toBeInTheDocument();
      // Desk delivery card should display 450 DA
      expect(screen.getByText(/450/)).toBeInTheDocument();
    });

    it('displays commune-specific shipping fee override when baladiya is selected', () => {
      const customFees = {
        16: { homeFee: 850, deskFee: 450, active: true },
      };
      const communeFees = {
        '16:Hydra': { homeFee: 300, deskFee: 200, active: true },
      };

      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={5000}
          freeShippingThreshold={15000}
          customFees={customFees}
          communeFees={communeFees}
          selectedCommune="Hydra"
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'fr' }
      );

      // Should display commune override: 300 DA home, 200 DA desk
      expect(screen.getByText(/300/)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    it('falls back to standard catalog rates when no custom overrides exist', () => {
      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={16}
          deliveryType="home"
          cartSubtotal={5000}
          freeShippingThreshold={15000}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'fr' }
      );

      // Default for Alger: 700 DA home, 550 DA desk (Yalidine rate)
      expect(screen.getByText(/700/)).toBeInTheDocument();
      expect(screen.getByText(/550/)).toBeInTheDocument();
    });
  });

  describe('calculateDeliveryFee with dynamic settings', () => {
    it('applies custom fees and free shipping threshold dynamically', () => {
      const customFees = {
        31: { homeFee: 700, deskFee: 400, active: true },
      };

      // Below threshold (threshold set to 20,000 DA)
      const feeHome = calculateDeliveryFee(10000, 31, 20000, 'home', customFees);
      expect(feeHome).toBe(700);

      const feeDesk = calculateDeliveryFee(10000, 31, 20000, 'desk', customFees);
      expect(feeDesk).toBe(400);

      // At or above threshold -> 0 DA
      const feeFree = calculateDeliveryFee(20000, 31, 20000, 'home', customFees);
      expect(feeFree).toBe(0);
    });
  });

  describe('MockSeedDataProvider Settings Persistence', () => {
    it('persists and retrieves updated store settings', async () => {
      const provider = new MockSeedDataProvider();
      const initial = await provider.getSettings();

      const updated = await provider.updateSettings({
        freeShippingThreshold: 25000,
        wilayaShippingFees: {
          ...initial.wilayaShippingFees,
          16: { homeFee: 990, deskFee: 550, active: true },
        },
      });

      expect(updated.freeShippingThreshold).toBe(25000);
      expect(updated.wilayaShippingFees[16].homeFee).toBe(990);

      // Verify that getSettings returns the updated values
      const fetched = await provider.getSettings();
      expect(fetched.freeShippingThreshold).toBe(25000);
      expect(fetched.wilayaShippingFees[16].homeFee).toBe(990);
    });
  });

  describe('POST /api/orders enforcement of dynamic delivery fees', () => {
    it('calculates delivery fee using active store settings when order is submitted without explicit fee', async () => {
      const store = getDataStore();
      const current = await store.getSettings();

      try {
        // Configure Oran (31) with custom fee 770 DA and threshold 50,000 DA
        await store.updateSettings({
          freeShippingThreshold: 50000,
          wilayaShippingFees: {
            ...current.wilayaShippingFees,
            31: { homeFee: 770, deskFee: 420, active: true },
          },
        });

        const orderBody = {
          customer: {
            fullName: 'Mohamed Brahimi',
            phone: '0555123456',
            wilaya: 'Oran',
            wilayaCode: 31,
            commune: 'Es Senia',
            address: 'Rue Principale',
            deliveryType: 'home',
          },
          items: [
            {
              productId: 'prod-suit-01',
              title: 'Costume Deux Pièces en Laine Italienne Super 130s',
              slug: 'costume-deux-pieces-laine-italienne',
              price: 15000,
              quantity: 1,
              selectedSize: '50',
            },
          ],
        };

        const req = new NextRequest('http://localhost:3000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderBody),
        });

        const res = await ordersPost(req);
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.success).toBe(true);
        // Delivery fee should reflect the active 770 DA price set in admin settings
        expect(data.order.deliveryFee).toBe(770);
        expect(data.order.total).toBe(15000 + 770);
      } finally {
        await store.updateSettings(current);
      }
    });
  });

  describe('CartProvider freeShippingThreshold dynamic sync', () => {
    it('adapts freeShippingThreshold from StoreSettingsProvider', async () => {
      // Mock fetch for /api/settings to return a custom threshold of 28,000 DA
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/settings')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              settings: {
                freeShippingThreshold: 28000,
              },
            }),
          });
        }
        return originalFetch(url);
      });

      try {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <StoreSettingsProvider>
            <CartProvider>{children}</CartProvider>
          </StoreSettingsProvider>
        );

        const { result } = renderHook(() => useCart(), { wrapper });

        // Wait for settings to be loaded into context
        await vi.waitFor(() => {
          expect(result.current.freeShippingThreshold).toBe(28000);
        });

        expect(result.current.freeShippingThreshold).toBe(28000);
      } finally {
        global.fetch = originalFetch;
      }
    });
  });
});
