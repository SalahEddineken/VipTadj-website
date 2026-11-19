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
} from '@/types';

export interface IDataStore {
  readonly mode: 'firestore' | 'mock';

  // Products
  getProducts(filter?: ProductFilter): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(data: CreateProductInput): Promise<Product>;
  updateProduct(id: string, data: UpdateProductInput): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;

  // Orders
  getOrders(filter?: OrderFilter): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(data: CreateOrderInput): Promise<Order>;
  updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
    cancellationReason?: CancellationReason | string,
    logistics?: { courier?: string; trackingCode?: string }
  ): Promise<Order>;

  // Settings
  getSettings(): Promise<StoreSettings>;
  updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings>;

  // Catalog Seeding
  seedCatalog(force?: boolean): Promise<SeedResult>;
}
