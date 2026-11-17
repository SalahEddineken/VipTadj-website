import {
  IDataStore,
  Product,
  Order,
  OrderStatus,
  StoreSettings,
} from '../fixtures/types';
import { productsFixture } from '../fixtures/products.fixture';
import { ordersFixture } from '../fixtures/orders.fixture';
import { settingsFixture } from '../fixtures/settings.fixture';

/**
 * Robust in-memory implementation of IDataStore for testing.
 * Operates on deep-cloned fixture data, with full search/filter capabilities,
 * stock decrement on order creation, stock restoration on cancellation,
 * and an explicit reset() method for test isolation.
 */
export class MockDataProvider implements IDataStore {
  public readonly mode: 'mock' = 'mock';

  private products: Product[] = [];
  private orders: Order[] = [];
  private settings: StoreSettings = { ...settingsFixture };

  constructor() {
    this.reset();
  }

  /**
   * Resets all in-memory collections to pristine fixture state.
   */
  public reset(): void {
    this.products = JSON.parse(JSON.stringify(productsFixture));
    this.orders = JSON.parse(JSON.stringify(ordersFixture));
    this.settings = JSON.parse(JSON.stringify(settingsFixture));
  }

  // ==========================================
  // Product Operations
  // ==========================================

  public async getProducts(filter?: {
    categoryId?: string;
    categorySlug?: string;
    subcategory?: string;
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'featured';
  }): Promise<Product[]> {
    let result = [...this.products];

    if (!filter) return result;

    if (filter.categoryId) {
      result = result.filter((p) => p.categoryId === filter.categoryId);
    }

    if (filter.categorySlug) {
      result = result.filter((p) => p.categorySlug === filter.categorySlug);
    }

    if (filter.subcategory) {
      result = result.filter((p) => p.subcategory.toLowerCase() === filter.subcategory!.toLowerCase());
    }

    if (filter.featured !== undefined) {
      result = result.filter((p) => p.isFeatured === filter.featured);
    }

    if (filter.inStock !== undefined) {
      result = result.filter((p) => p.inStock === filter.inStock);
    }

    if (filter.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filter.minPrice!);
    }

    if (filter.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filter.maxPrice!);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q)
      );
    }

    if (filter.sortBy) {
      switch (filter.sortBy) {
        case 'price-asc':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'featured':
          result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }

    return result;
  }

  public async getProductBySlug(slug: string): Promise<Product | null> {
    const found = this.products.find((p) => p.slug === slug);
    return found ? { ...found } : null;
  }

  public async getProductById(id: string): Promise<Product | null> {
    const found = this.products.find((p) => p.id === id);
    return found ? { ...found } : null;
  }

  public async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const id = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id,
      inStock: data.stockQuantity > 0,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    return { ...newProduct };
  }

  public async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Product not found with id: ${id}`);
    }

    const updated = {
      ...this.products[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    if (updated.stockQuantity !== undefined) {
      updated.inStock = updated.stockQuantity > 0;
    }

    this.products[index] = updated;
    return { ...updated };
  }

  public async deleteProduct(id: string): Promise<boolean> {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    return this.products.length < initialLen;
  }

  // ==========================================
  // Order Operations
  // ==========================================

  public async getOrders(filter?: {
    status?: OrderStatus;
    search?: string;
    wilayaCode?: number;
  }): Promise<Order[]> {
    let result = [...this.orders];

    if (!filter) return result;

    if (filter.status) {
      result = result.filter((o) => o.status === filter.status);
    }

    if (filter.wilayaCode) {
      result = result.filter((o) => o.customer.wilayaCode === filter.wilayaCode);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.customer.wilaya.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public async getOrderById(id: string): Promise<Order | null> {
    const found = this.orders.find((o) => o.id === id || o.orderNumber === id);
    return found ? { ...found } : null;
  }

  public async createOrder(data: {
    customer: Order['customer'];
    items: Order['items'];
    deliveryFee: number;
    subtotal?: number;
    total?: number;
  }): Promise<Order> {
    const subtotal = data.subtotal ?? data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = data.total ?? (subtotal + data.deliveryFee);
    const id = `ord-${Date.now()}`;
    const orderNumber = `VIP-2026-${String(this.orders.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id,
      orderNumber,
      customer: data.customer,
      items: data.items,
      subtotal,
      deliveryFee: data.deliveryFee,
      total,
      paymentMethod: 'cod',
      status: 'pending',
      stockDeducted: true,
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: 'Nouvelle commande créée (Paiement à la livraison)',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Decrement stock for ordered items (both sizeInventory and total stock)
    for (const item of data.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product) {
        if (product.sizeInventory && item.selectedSize && product.sizeInventory[item.selectedSize] !== undefined) {
          const currentSizeStock = Number(product.sizeInventory[item.selectedSize] || 0);
          product.sizeInventory[item.selectedSize] = Math.max(0, currentSizeStock - item.quantity);
          product.stockQuantity = Object.values(product.sizeInventory).reduce(
            (acc, val) => acc + Number(val || 0),
            0
          );
        } else {
          product.stockQuantity = Math.max(0, Number(product.stockQuantity || 0) - item.quantity);
        }
        product.inStock = product.stockQuantity > 0;
      }
    }

    this.orders.unshift(newOrder);
    return { ...newOrder };
  }

  public async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string
  ): Promise<Order> {
    const order = this.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) {
      throw new Error(`Order not found with id: ${id}`);
    }

    const previousStatus = order.status;
    const now = new Date().toISOString();

    order.status = status;
    order.updatedAt = now;
    order.statusHistory.push({
      status,
      timestamp: now,
      note: note || `Statut changé vers ${status}`,
      updatedBy,
    });

    // If order was cancelled, restore product stock
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = this.products.find((p) => p.id === item.productId);
        if (product) {
          if (product.sizeInventory && item.selectedSize && product.sizeInventory[item.selectedSize] !== undefined) {
            const currentSizeStock = Number(product.sizeInventory[item.selectedSize] || 0);
            product.sizeInventory[item.selectedSize] = currentSizeStock + item.quantity;
            product.stockQuantity = Object.values(product.sizeInventory).reduce(
              (acc, val) => acc + Number(val || 0),
              0
            );
          } else {
            product.stockQuantity = Number(product.stockQuantity || 0) + item.quantity;
          }
          product.inStock = product.stockQuantity > 0;
        }
      }
    }

    return { ...order };
  }

  // ==========================================
  // Settings Operations
  // ==========================================

  public async getSettings(): Promise<StoreSettings> {
    return { ...this.settings };
  }

  public async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    this.settings = {
      ...this.settings,
      ...data,
    };
    return { ...this.settings };
  }

  // ==========================================
  // Catalog Seeding
  // ==========================================

  public async seedCatalog(force: boolean = false): Promise<{ success: boolean; count: number; message: string }> {
    if (this.products.length > 0 && !force) {
      return {
        success: true,
        count: this.products.length,
        message: 'Catalog already seeded',
      };
    }

    this.reset();
    return {
      success: true,
      count: this.products.length,
      message: `Successfully seeded ${this.products.length} luxury products`,
    };
  }
}

/**
 * Singleton instance for shared mock data access during tests.
 */
export const mockDataProvider = new MockDataProvider();
