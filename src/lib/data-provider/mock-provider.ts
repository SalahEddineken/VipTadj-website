import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilter,
  Category,
  Order,
  CreateOrderInput,
  OrderStatus,
  OrderFilter,
  StoreSettings,
  SeedResult,
  CancellationReason,
  OrderStatusHistoryItem,
} from '@/types';
import { IDataStore } from './interface';
import { initialProducts, initialCategories, initialSettings } from '@/lib/seed/seed-data';

const SLUG_ALIASES: Record<string, string> = {
  'costume-deux-pieces-laine-super-130s': 'costume-deux-pieces-laine-italienne',
  'costume-deux-pieces-laine-italienne': 'costume-deux-pieces-laine-super-130s',
  'richelieu-one-cut-cuir-veau': 'souliers-richelieu-one-cut',
  'souliers-richelieu-one-cut': 'richelieu-one-cut-cuir-veau',
  'cravate-soie-jacquard-sept-plis': 'cravate-soie-jacquard-bleu-imperial-or',
  'cravate-soie-jacquard-bleu-imperial-or': 'cravate-soie-jacquard-sept-plis',
};

function clone<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VT-${year}-${randomSuffix}`;
}

function getNodeFs() {
  if (typeof window !== 'undefined') return null;
  try {
    // eval require hides from webpack client bundle static analysis
    const req = eval('require');
    return {
      fs: req('fs'),
      path: req('path'),
    };
  } catch {
    return null;
  }
}

function loadPersistedOrders(): Order[] {
  const node = getNodeFs();
  if (!node) return [];
  try {
    const { fs, path } = node;
    const filePath = path.join(process.cwd(), '.data', 'mock-orders.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch {
    // Graceful fallback
  }
  return [];
}

function savePersistedOrders(orders: Order[]): void {
  if (process.env.NODE_ENV === 'test') return;
  const node = getNodeFs();
  if (!node) return;
  try {
    const { fs, path } = node;
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'mock-orders.json');
    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), 'utf-8');
  } catch {
    // Graceful fallback
  }
}

export class MockSeedDataProvider implements IDataStore {
  readonly mode = 'mock' as const;

  private products: Product[] = [];
  private categories: Category[] = [];
  private orders: Order[] = [];
  private settings: StoreSettings = clone(initialSettings);
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (!this.isInitialized) {
      this.products = clone(initialProducts);
      this.categories = clone(initialCategories);
      this.settings = clone(initialSettings);
      
      const sampleOrders = this.generateSampleOrders();
      const persisted = loadPersistedOrders();
      
      const seen = new Set<string>();
      const merged: Order[] = [];
      for (const o of persisted) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          merged.push(o);
        }
      }
      for (const o of sampleOrders) {
        if (!seen.has(o.id)) {
          seen.add(o.id);
          merged.push(o);
        }
      }
      this.orders = merged;
      this.isInitialized = true;
    }
  }

  private generateSampleOrders(): Order[] {
    const now = new Date();
    const isoNow = now.toISOString();
    return [
      {
        id: 'ord-001',
        orderNumber: 'VIP-2026-0001',
        customer: {
          fullName: 'Karim Benali',
          phone: '0550123456',
          wilaya: '16 - Alger',
          wilayaCode: 16,
          commune: 'Hydra',
          address: 'Rue des Pins, Bâtiment 4',
          deliveryType: 'home',
        },
        items: [
          {
            productId: 'prod-suit-01',
            title: 'Costume Deux Pièces en Laine Italienne Super 130s',
            slug: 'costume-deux-pieces-laine-italienne',
            price: 48500,
            quantity: 1,
            selectedSize: '50',
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
          },
        ],
        subtotal: 48500,
        deliveryFee: 400,
        total: 48900,
        paymentMethod: 'cod',
        status: 'pending',
        statusHistory: [
          {
            status: 'pending',
            timestamp: isoNow,
            note: 'Commande reçue via le storefront',
          },
        ],
        createdAt: isoNow,
        updatedAt: isoNow,
      },
    ];
  }

  // ================= PRODUCTS =================

  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    this.init();
    let result = clone(this.products);

    if (!filter) return result;

    if (filter.categoryId) {
      result = result.filter(
        (p) => p.categoryId === filter.categoryId || p.categorySlug === filter.categoryId
      );
    }
    if (filter.categorySlug) {
      result = result.filter((p) => p.categorySlug === filter.categorySlug);
    }
    if (filter.subcategory) {
      result = result.filter(
        (p) => p.subcategory.toLowerCase() === filter.subcategory?.toLowerCase()
      );
    }
    if (filter.inStock !== undefined) {
      result = result.filter((p) =>
        filter.inStock
          ? Boolean(p.inStock) && p.stockQuantity > 0
          : !p.inStock || p.stockQuantity <= 0
      );
    }
    if (filter.featured !== undefined) {
      result = result.filter((p) => p.isFeatured === filter.featured);
    }
    if (filter.newArrival !== undefined) {
      result = result.filter((p) => p.isNewArrival === filter.newArrival);
    }
    if (filter.minPrice !== undefined) {
      result = result.filter((p) => p.price >= (filter.minPrice ?? 0));
    }
    if (filter.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= (filter.maxPrice ?? Infinity));
    }
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.subcategory.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filter.sortBy) {
      switch (filter.sortBy) {
        case 'newest':
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'price-asc':
          result.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          result.sort((a, b) => b.price - a.price);
          break;
        case 'featured':
          result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
          break;
      }
    }

    if (filter.offset) {
      result = result.slice(filter.offset);
    }
    if (filter.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    this.init();
    let item = this.products.find((p) => p.slug === slug);
    if (!item && SLUG_ALIASES[slug]) {
      item = this.products.find((p) => p.slug === SLUG_ALIASES[slug]);
    }
    return item ? clone(item) : null;
  }

  async getProductById(id: string): Promise<Product | null> {
    this.init();
    const item = this.products.find((p) => p.id === id);
    return item ? clone(item) : null;
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    this.init();
    const now = new Date().toISOString();
    const id = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newProduct: Product = {
      ...clone(data),
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.products.unshift(newProduct);
    return clone(newProduct);
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    this.init();
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    const clonedData = clone(data);
    delete (clonedData as any).id;
    delete (clonedData as any).createdAt;

    const updated: Product = {
      ...this.products[index],
      ...clonedData,
      id: this.products[index].id,
      createdAt: this.products[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.products[index] = updated;
    return clone(updated);
  }

  async deleteProduct(id: string): Promise<boolean> {
    this.init();
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.products.splice(index, 1);
    return true;
  }

  // ================= CATEGORIES =================

  async getCategories(): Promise<Category[]> {
    this.init();
    return clone(this.categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    this.init();
    const cat = this.categories.find((c) => c.slug === slug || c.id === slug);
    return cat ? clone(cat) : null;
  }

  // ================= ORDERS =================

  async getOrders(filter?: OrderFilter): Promise<Order[]> {
    this.init();
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      const persisted = loadPersistedOrders();
      for (const p of persisted) {
        const idx = this.orders.findIndex((o) => o.id === p.id);
        if (idx === -1) {
          this.orders.unshift(p);
        } else {
          this.orders[idx] = p;
        }
      }
    }
    let result = clone(this.orders);

    if (!filter) return result;

    if (filter.status) {
      result = result.filter((o) => o.status === filter.status);
    }
    if (filter.wilayaCode) {
      result = result.filter((o) => o.customer.wilayaCode === filter.wilayaCode);
    }
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.customer.wilaya.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filter.offset) result = result.slice(filter.offset);
    if (filter.limit) result = result.slice(0, filter.limit);

    return result;
  }

  async getOrderById(id: string): Promise<Order | null> {
    this.init();
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
      const persisted = loadPersistedOrders();
      for (const p of persisted) {
        const idx = this.orders.findIndex((o) => o.id === p.id);
        if (idx === -1) {
          this.orders.unshift(p);
        } else {
          this.orders[idx] = p;
        }
      }
    }
    const order = this.orders.find((o) => o.id === id || o.orderNumber === id);
    return order ? clone(order) : null;
  }

  async createOrder(data: CreateOrderInput): Promise<Order> {
    this.init();
    const now = new Date().toISOString();
    const id = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const subtotal = data.items.reduce(
      (acc, item) => acc + Math.max(0, item.price) * Math.max(0, item.quantity),
      0
    );
    const deliveryFee = Math.max(0, data.deliveryFee ?? 0);
    const discount = Math.max(0, data.discount ?? 0);
    const total = Math.max(0, subtotal + deliveryFee - discount);

    const newOrder: Order = {
      id,
      orderNumber: generateOrderNumber(),
      customer: clone(data.customer),
      items: clone(data.items),
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod: 'cod',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: data.notes || 'Commande créée par le client',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Atomically decrement stock for ordered items
    for (const item of data.items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product) {
        product.stockQuantity = Math.max(0, product.stockQuantity - item.quantity);
        product.inStock = product.stockQuantity > 0;
      }
    }

    this.orders.unshift(newOrder);
    savePersistedOrders(this.orders);
    return clone(newOrder);
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
    cancellationReason?: CancellationReason | string
  ): Promise<Order> {
    this.init();

    const VALID_ORDER_STATUSES: readonly OrderStatus[] = [
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw new Error(
        `Statut (status) de commande invalide: "${status}". Valeurs autorisées: ${VALID_ORDER_STATUSES.join(', ')}`
      );
    }

    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Order with ID "${id}" not found.`);
    }

    const order = this.orders[index];
    const previousStatus = order.status;
    const now = new Date().toISOString();

    const historyEntry: OrderStatusHistoryItem = {
      status,
      timestamp: now,
      note,
      updatedBy,
      ...(cancellationReason ? { cancellationReason: cancellationReason as CancellationReason } : {}),
    };

    const updated: Order = {
      ...order,
      status,
      statusHistory: [...order.statusHistory, historyEntry],
      updatedAt: now,
    };

    this.orders[index] = updated;
    savePersistedOrders(this.orders);

    // If order is cancelled, restore stock for all items
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = this.products.find((p) => p.id === item.productId);
        if (product) {
          product.stockQuantity += item.quantity;
          product.inStock = product.stockQuantity > 0;
        }
      }
    }

    return clone(updated);
  }

  // ================= SETTINGS =================

  async getSettings(): Promise<StoreSettings> {
    this.init();
    return clone(this.settings);
  }

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    this.init();
    const clonedData = clone(data);

    const mergedWilayaShippingFees = clonedData.wilayaShippingFees
      ? {
          ...this.settings.wilayaShippingFees,
          ...clonedData.wilayaShippingFees,
        }
      : this.settings.wilayaShippingFees;

    this.settings = {
      ...this.settings,
      ...clonedData,
      wilayaShippingFees: mergedWilayaShippingFees,
      updatedAt: new Date().toISOString(),
    };
    return clone(this.settings);
  }

  // ================= SEEDING =================

  async seedCatalog(force = false): Promise<SeedResult> {
    if (this.isInitialized && this.products.length > 0 && !force) {
      return {
        success: false,
        count: 0,
        message: 'Le catalogue est déjà initialisé. Utilisez force=true pour réinitialiser.',
      };
    }

    this.products = clone(initialProducts);
    this.categories = clone(initialCategories);
    this.settings = clone(initialSettings);
    this.orders = this.generateSampleOrders();
    this.isInitialized = true;

    return {
      success: true,
      count: this.products.length,
      message: `Catalogue initialisé avec succès en mode Mock (${this.products.length} produits).`,
    };
  }
}
