import { vi } from 'vitest';
import { CartItem } from '@/lib/context/cart-context';
import { Order, CustomerShippingInfo } from '@/types';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';

export interface MockFetchOverrides {
  settings?: any;
  orderResponse?: any;
  ordersList?: any[];
}

/**
 * Configures global.fetch mock for E2E scenarios supporting Next.js API routes:
 * - GET /api/settings
 * - POST /api/orders
 * - GET /api/orders
 */
export function setupMockFetch(overrides?: MockFetchOverrides): ReturnType<typeof vi.fn> {
  const defaultSettings = {
    success: true,
    settings: {
      storeName: 'VIP TADJ',
      tagline: 'Haute Confection Masculine',
      freeShippingThreshold: 15000,
      wilayaShippingFees: {
        16: { homeFee: 400, deskFee: 250, active: true },
        31: { homeFee: 600, deskFee: 350, active: true },
        25: { homeFee: 650, deskFee: 400, active: true },
        19: { homeFee: 600, deskFee: 350, active: true },
        30: { homeFee: 900, deskFee: 500, active: true },
      },
    },
  };

  const defaultOrderResponse = {
    success: true,
    order: {
      id: 'ord-e2e-test-01',
      orderNumber: 'VIP-2026-8888',
      status: 'pending',
      total: 48500,
      createdAt: new Date().toISOString(),
      customer: {
        fullName: 'ياسين براهيمي',
        phone: '0555123456',
        wilaya: '16 - Alger',
        wilayaCode: 16,
        commune: 'حيدرة',
        address: 'شارع الشهداء رقم 14',
      },
    },
  };

  const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('/api/settings')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(overrides?.settings || defaultSettings),
      } as Response);
    }

    if (url.includes('/api/orders')) {
      if (init?.method === 'POST') {
        let requestBody: any = {};
        try {
          if (init.body && typeof init.body === 'string') {
            requestBody = JSON.parse(init.body);
          }
        } catch {
          // Ignore json parse error in test
        }

        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve(
              overrides?.orderResponse || {
                ...defaultOrderResponse,
                order: {
                  ...defaultOrderResponse.order,
                  customer: requestBody.customer || defaultOrderResponse.order.customer,
                  total: requestBody.total || defaultOrderResponse.order.total,
                },
              }
            ),
        } as Response);
      }

      // GET /api/orders
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, orders: overrides?.ordersList || [] }),
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    } as Response);
  });

  global.fetch = fetchMock;
  return fetchMock;
}

/**
 * Standard Algerian test customer profile for COD checkout
 */
export const MOCK_ALGERIAN_CUSTOMER: CustomerShippingInfo = {
  fullName: 'ياسين براهيمي',
  phone: '0555123456',
  secondaryPhone: '0770987654',
  wilaya: '16 - Alger',
  wilayaCode: 16,
  commune: 'حيدرة',
  address: 'شارع الشهداء رقم 14',
  notes: 'الاتصال قبل التوصيل بنصف ساعة',
};

/**
 * Generates a mock CartItem from seed data or custom properties
 */
export function createMockCartItem(overrides?: Partial<CartItem>): CartItem {
  const seed = SEED_PRODUCTS[0];
  return {
    productId: seed.id,
    title: seed.title,
    slug: seed.slug,
    price: seed.price,
    quantity: 1,
    selectedSize: seed.sizes?.[0] || '50',
    selectedColor: seed.colors?.[0]?.name || 'Bleu Nuit',
    image: seed.images?.[0]?.url || '',
    ...overrides,
  };
}

/**
 * Generates a full mock Order for admin lifecycle testing
 */
export function createMockOrder(overrides?: Partial<Order>): Order {
  const cartItem = createMockCartItem();
  return {
    id: 'ord-lifecycle-test-01',
    orderNumber: 'VIP-2026-7777',
    customer: { ...MOCK_ALGERIAN_CUSTOMER },
    items: [cartItem],
    subtotal: 48500,
    deliveryFee: 400,
    total: 48900,
    status: 'pending',
    paymentMethod: 'cod',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: 'Commande reçue',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
