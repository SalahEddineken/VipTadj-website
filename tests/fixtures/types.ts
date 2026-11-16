/**
 * VIP TADJ Test Domain Types & Interfaces
 * Authoritative contracts matching PROJECT.md lines 107-194.
 */

export type ProductCategoryType = 'clothing' | 'shoes' | 'accessories';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number; // In DZD (e.g. 48500 = 48,500 DA)
  compareAtPrice?: number;
  categoryId: ProductCategoryType;
  categorySlug: string; // 'vetements' | 'chaussures' | 'accessoires'
  subcategory: string; // 'costumes' | 'blazers' | 'chemises' | 'richelieu' | 'mocassins' | 'montres' | etc.
  images: ProductImage[];
  sizes: string[];
  stockQuantity: number;
  inStock: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  title: string;
  slug: string;
  price: number;
  quantity: number;
  selectedSize: string;
  image: string;
}

export interface CustomerShippingInfo {
  fullName: string;
  phone: string; // Algerian format: 05/06/07 + 8 digits
  wilaya: string;
  wilayaCode: number; // 1 to 58
  commune: string;
  address: string;
  notes?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerShippingInfo;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cod';
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WilayaDeliveryConfig {
  code: number;
  name: string;
  fee: number;
  deskFee?: number;
  zone: 'alger' | 'hauts-plateaux' | 'sud' | 'centre' | 'est' | 'ouest';
  estimatedDays: string;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  freeShippingThreshold: number; // e.g. 15,000 DA
  wilayaShippingFees: Record<number, { homeFee: number; deskFee: number; active: boolean }>;
  wilayasDelivery?: WilayaDeliveryConfig[];
}

export interface IDataStore {
  readonly mode: 'firestore' | 'mock';
  getProducts(filter?: any): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductById(id: string): Promise<Product | null>;
  createProduct(data: any): Promise<Product>;
  updateProduct(id: string, data: any): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;
  getOrders(filter?: any): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  createOrder(data: any): Promise<Order>;
  updateOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order>;
  getSettings(): Promise<StoreSettings>;
  updateSettings(data: any): Promise<StoreSettings>;
  seedCatalog(force?: boolean): Promise<{ success: boolean; count: number; message: string }>;
}
