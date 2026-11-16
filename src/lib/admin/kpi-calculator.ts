import { Order, Product } from '@/types';

export interface DashboardKPIs {
  totalRevenue: number;         // Confirmed + Shipped + Delivered orders sum
  pendingCount: number;         // Pending orders count requiring phone confirmation
  inFlightCount: number;        // Confirmed + Shipped orders
  aov: number;                  // Average Order Value in DZD (safe against divide-by-zero)
  activeProductsCount: number;  // In stock products count
  totalProductsCount: number;   // Total catalog items
  deliveredCount: number;
  cancelledCount: number;
  lowStockCount: number;        // Stock > 0 and <= 3
  outOfStockCount: number;      // Stock === 0 or !inStock
  totalOrdersCount: number;
}

export function computeAdminKPIs(orders: Order[] = [], products: Product[] = []): DashboardKPIs {
  const safeOrders = Array.isArray(orders)
    ? orders.filter((o): o is Order => Boolean(o && typeof o === 'object' && !Array.isArray(o)))
    : [];
  const safeProducts = Array.isArray(products)
    ? products.filter((p): p is Product => Boolean(p && typeof p === 'object' && !Array.isArray(p)))
    : [];

  const revenueOrders = safeOrders.filter((o) =>
    ['confirmed', 'shipped', 'delivered'].includes(o.status)
  );
  const totalRevenue = revenueOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const pendingOrders = safeOrders.filter((o) => o.status === 'pending');
  const pendingCount = pendingOrders.length;

  const inFlightOrders = safeOrders.filter((o) =>
    ['confirmed', 'shipped'].includes(o.status)
  );
  const inFlightCount = inFlightOrders.length;

  const aov =
    revenueOrders.length > 0 && totalRevenue > 0
      ? Math.round(totalRevenue / revenueOrders.length)
      : 0;

  const deliveredCount = safeOrders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = safeOrders.filter((o) => o.status === 'cancelled').length;

  const activeProducts = safeProducts.filter(
    (p) => Boolean(p.inStock) && Number(p.stockQuantity) > 0
  );
  const activeProductsCount = activeProducts.length;

  const lowStockCount = safeProducts.filter(
    (p) => Number(p.stockQuantity) > 0 && Number(p.stockQuantity) <= 3
  ).length;

  const outOfStockCount = safeProducts.filter(
    (p) => !p.inStock || Number(p.stockQuantity) <= 0
  ).length;

  return {
    totalRevenue: Number.isFinite(totalRevenue) ? totalRevenue : 0,
    pendingCount,
    inFlightCount,
    aov: Number.isFinite(aov) ? aov : 0,
    activeProductsCount,
    totalProductsCount: safeProducts.length,
    deliveredCount,
    cancelledCount,
    lowStockCount,
    outOfStockCount,
    totalOrdersCount: safeOrders.length,
  };
}
