import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fsLimit,
  writeBatch,
  Timestamp,
  Firestore,
} from 'firebase/firestore';
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
import { VALID_ORDER_STATUSES } from '@/lib/utils/orderStateMachine';
import { IDataStore } from './interface';
import { getDb } from '@/lib/firebase/client';
import { initialProducts, initialCategories, initialSettings } from '@/lib/seed/seed-data';

/**
 * Sanitizes Firestore objects to plain JSON and converts Firestore Timestamps to ISO strings.
 */
function sanitizeDoc<T>(data: any): T {
  if (!data || typeof data !== 'object') return data;

  const result: any = Array.isArray(data) ? [] : {};

  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val instanceof Timestamp) {
      result[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object') {
      result[key] = sanitizeDoc(val);
    } else {
      result[key] = val;
    }
  }

  return result as T;
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VT-${year}-${randomSuffix}`;
}

export class FirestoreDataProvider implements IDataStore {
  readonly mode = 'firestore' as const;

  private getDatabase(): Firestore {
    const db = getDb();
    if (!db) {
      throw new Error(
        '[VIP TADJ Firestore] Database instance unavailable. Verify Firebase environment variables.'
      );
    }
    return db;
  }

  // ================= PRODUCTS =================

  async getProducts(filter?: ProductFilter): Promise<Product[]> {
    const db = this.getDatabase();
    const productsRef = collection(db, 'products');

    const constraints: any[] = [];

    if (filter?.categoryId) {
      constraints.push(where('categoryId', '==', filter.categoryId));
    }
    if (filter?.categorySlug) {
      constraints.push(where('categorySlug', '==', filter.categorySlug));
    }
    if (filter?.subcategory) {
      constraints.push(where('subcategory', '==', filter.subcategory));
    }
    if (filter?.featured !== undefined) {
      constraints.push(where('isFeatured', '==', filter.featured));
    }
    if (filter?.inStock !== undefined) {
      constraints.push(where('inStock', '==', filter.inStock));
    }

    if (filter?.sortBy) {
      switch (filter.sortBy) {
        case 'newest':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'price-asc':
          constraints.push(orderBy('price', 'asc'));
          break;
        case 'price-desc':
          constraints.push(orderBy('price', 'desc'));
          break;
      }
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    if (filter?.limit) {
      constraints.push(fsLimit(filter.limit));
    }

    const q = query(productsRef, ...constraints);
    const snap = await getDocs(q);

    let items = snap.docs.map((d) => ({
      ...sanitizeDoc<Product>(d.data()),
      id: d.id,
    }));

    if (filter?.search?.trim()) {
      const term = filter.search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.title?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.subcategory?.toLowerCase().includes(term)
      );
    }

    return items;
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const db = this.getDatabase();
    const q = query(collection(db, 'products'), where('slug', '==', slug), fsLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { ...sanitizeDoc<Product>(docSnap.data()), id: docSnap.id };
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = this.getDatabase();
    const docRef = doc(db, 'products', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...sanitizeDoc<Product>(snap.data()), id: snap.id };
  }

  async createProduct(data: CreateProductInput): Promise<Product> {
    const db = this.getDatabase();
    const now = new Date().toISOString();
    const colRef = collection(db, 'products');
    const newDocRef = doc(colRef);

    const newProduct: Product = {
      ...data,
      id: newDocRef.id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(newDocRef, newProduct);
    return newProduct;
  }

  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const db = this.getDatabase();
    const docRef = doc(db, 'products', id);
    const now = new Date().toISOString();

    const updates = {
      ...data,
      updatedAt: now,
    };

    await updateDoc(docRef, updates);
    const updated = await this.getProductById(id);
    if (!updated) {
      throw new Error(`Failed to retrieve product "${id}" after update.`);
    }
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const db = this.getDatabase();
    const docRef = doc(db, 'products', id);
    await deleteDoc(docRef);
    return true;
  }

  // ================= CATEGORIES =================

  async getCategories(): Promise<Category[]> {
    const db = this.getDatabase();
    const q = query(collection(db, 'categories'), orderBy('displayOrder', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      ...sanitizeDoc<Category>(d.data()),
      id: d.id,
    }));
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const db = this.getDatabase();
    const q = query(collection(db, 'categories'), where('slug', '==', slug), fsLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...sanitizeDoc<Category>(snap.docs[0].data()), id: snap.docs[0].id };
  }

  // ================= ORDERS =================

  async getOrders(filter?: OrderFilter): Promise<Order[]> {
    const db = this.getDatabase();
    const constraints: any[] = [];

    if (filter?.status) {
      constraints.push(where('status', '==', filter.status));
    }
    if (filter?.wilayaCode) {
      constraints.push(where('customer.wilayaCode', '==', filter.wilayaCode));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filter?.limit) {
      constraints.push(fsLimit(filter.limit));
    }

    const q = query(collection(db, 'orders'), ...constraints);
    const snap = await getDocs(q);

    let orders = snap.docs.map((d) => ({
      ...sanitizeDoc<Order>(d.data()),
      id: d.id,
    }));

    if (filter?.search?.trim()) {
      const term = filter.search.toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(term) ||
          o.customer?.fullName?.toLowerCase().includes(term) ||
          o.customer?.phone?.includes(term) ||
          o.customer?.wilaya?.toLowerCase().includes(term)
      );
    }

    return orders;
  }

  async getOrderById(id: string): Promise<Order | null> {
    const db = this.getDatabase();
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...sanitizeDoc<Order>(snap.data()), id: snap.id };
    }

    // Fallback: search by orderNumber
    const q = query(collection(db, 'orders'), where('orderNumber', '==', id), fsLimit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return { ...sanitizeDoc<Order>(querySnap.docs[0].data()), id: querySnap.docs[0].id };
    }

    return null;
  }

  async createOrder(data: CreateOrderInput): Promise<Order> {
    const db = this.getDatabase();
    const now = new Date().toISOString();
    const newDocRef = doc(collection(db, 'orders'));

    const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = data.discount ?? 0;
    const total = subtotal + data.deliveryFee - discount;

    const newOrder: Order = {
      id: newDocRef.id,
      orderNumber: generateOrderNumber(),
      customer: data.customer,
      items: data.items,
      subtotal,
      deliveryFee: data.deliveryFee,
      discount,
      total,
      paymentMethod: 'cod',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          timestamp: now,
          note: data.notes || 'Commande passée depuis le storefront',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(newDocRef, newOrder);
    return newOrder;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
    cancellationReason?: CancellationReason | string
  ): Promise<Order> {
    if (!VALID_ORDER_STATUSES.includes(status)) {
      throw new Error(
        `Statut (status) de commande invalide: "${status}". Valeurs autorisées: ${VALID_ORDER_STATUSES.join(', ')}`
      );
    }

    const db = this.getDatabase();
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error(`Order with ID "${id}" not found.`);
    }

    const orderData = sanitizeDoc<Order>(snap.data());
    const previousStatus = orderData.status;
    const now = new Date().toISOString();

    const newHistoryItem: OrderStatusHistoryItem = {
      status,
      timestamp: now,
      note,
      updatedBy,
      ...(cancellationReason ? { cancellationReason: cancellationReason as CancellationReason } : {}),
    };

    const updatedHistory = [...(orderData.statusHistory || []), newHistoryItem];

    await updateDoc(docRef, {
      status,
      statusHistory: updatedHistory,
      updatedAt: now,
    });

    // If order is cancelled, restore stock for all items
    if (status === 'cancelled' && previousStatus !== 'cancelled' && orderData.items?.length) {
      const batch = writeBatch(db);
      for (const item of orderData.items) {
        try {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            const currentStock = Number(productData.stockQuantity || 0);
            const newStock = currentStock + item.quantity;
            batch.update(productRef, {
              stockQuantity: newStock,
              inStock: newStock > 0,
              updatedAt: now,
            });
          }
        } catch (err) {
          console.error(`[VIP TADJ Firestore] Failed to restore stock for product ${item.productId}:`, err);
        }
      }
      await batch.commit();
    }

    return {
      ...orderData,
      id: snap.id,
      status,
      statusHistory: updatedHistory,
      updatedAt: now,
    };
  }

  // ================= SETTINGS =================

  async getSettings(): Promise<StoreSettings> {
    const db = this.getDatabase();
    const docRef = doc(db, 'settings', 'store');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      await setDoc(docRef, initialSettings);
      return initialSettings;
    }

    return sanitizeDoc<StoreSettings>(snap.data());
  }

  async updateSettings(data: Partial<StoreSettings>): Promise<StoreSettings> {
    const db = this.getDatabase();
    const docRef = doc(db, 'settings', 'store');
    const now = new Date().toISOString();

    const updates = {
      ...data,
      updatedAt: now,
    };

    await setDoc(docRef, updates, { merge: true });
    return this.getSettings();
  }

  // ================= SEEDING =================

  async seedCatalog(force = false): Promise<SeedResult> {
    const db = this.getDatabase();
    const productsSnap = await getDocs(query(collection(db, 'products'), fsLimit(1)));

    if (!productsSnap.empty && !force) {
      return {
        success: false,
        count: 0,
        message: 'Database is already populated. Pass force=true to re-seed.',
      };
    }

    const batch = writeBatch(db);

    // Seed Categories
    for (const cat of initialCategories) {
      const catRef = doc(db, 'categories', cat.id);
      batch.set(catRef, cat);
    }

    // Seed Settings
    const settingsRef = doc(db, 'settings', 'store');
    batch.set(settingsRef, initialSettings);

    // Seed Products
    for (const prod of initialProducts) {
      const prodRef = doc(db, 'products', prod.id);
      batch.set(prodRef, prod);
    }

    await batch.commit();

    return {
      success: true,
      count: initialProducts.length,
      message: `Database successfully seeded with ${initialProducts.length} items.`,
    };
  }
}
