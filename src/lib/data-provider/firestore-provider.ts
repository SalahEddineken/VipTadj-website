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
import { IDataStore, UpdateOrderData } from './interface';
import { getDb } from '@/lib/firebase/client';
import { initialProducts, initialCategories, initialSettings } from '@/lib/seed/seed-data';
import {
  PRODUCT_TRANSLATIONS,
  SUBCATEGORY_TRANSLATIONS,
} from '@/lib/i18n/catalog-translations';
import { getWilayaByCode } from '@/lib/data/wilayas';
import { findCommune } from '@/lib/data/communes';
import { normalizeProductSizes } from '@/lib/utils/catalogUtils';

function normalizeProviderSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

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

/**
 * Recursively removes all `undefined` properties from an object or array.
 * Firebase Firestore throws an error ("Unsupported field value: undefined")
 * whenever any property in a document payload is `undefined`.
 */
export function removeUndefined<T>(data: T): T {
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  if (data instanceof Date || data instanceof Timestamp) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => removeUndefined(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (val !== undefined) {
      result[key] = removeUndefined(val);
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
    if (filter?.status !== undefined) {
      constraints.push(where('status', '==', filter.status));
    }
    if (filter?.isActive !== undefined) {
      constraints.push(where('isActive', '==', filter.isActive));
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
      const term = normalizeProviderSearch(filter.search.trim());
      items = items.filter((p) => {
        const prodTrans = PRODUCT_TRANSLATIONS[p.id];
        const subTrans = p.subcategory
          ? SUBCATEGORY_TRANSLATIONS[p.subcategory.toLowerCase().trim()]
          : undefined;

        const fields: (string | undefined)[] = [
          p.title,
          p.description,
          p.subcategory,
          p.titleAr,
          p.titleEn,
          p.descriptionAr,
          p.descriptionEn,
          p.subtitleAr,
          p.subtitleEn,
          p.materialsAr,
          p.materialsEn,
          ...(Array.isArray(p.tags) ? p.tags : []),
          prodTrans?.en?.title,
          prodTrans?.en?.description,
          prodTrans?.ar?.title,
          prodTrans?.ar?.description,
          subTrans?.fr,
          subTrans?.en,
          subTrans?.ar,
        ];

        return fields.some((f) => f && normalizeProviderSearch(f).includes(term));
      });
    }

    return items.map(normalizeProductSizes);
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const db = this.getDatabase();
    const q = query(collection(db, 'products'), where('slug', '==', slug), fsLimit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return normalizeProductSizes({ ...sanitizeDoc<Product>(docSnap.data()), id: docSnap.id });
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = this.getDatabase();
    const docRef = doc(db, 'products', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return normalizeProductSizes({ ...sanitizeDoc<Product>(snap.data()), id: snap.id });
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

    await setDoc(newDocRef, removeUndefined(newProduct));
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

    await updateDoc(docRef, removeUndefined(updates));
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
      const term = normalizeProviderSearch(filter.search.trim());
      orders = orders.filter((o) => {
        const wilayaObj = o.customer?.wilayaCode
          ? getWilayaByCode(o.customer.wilayaCode)
          : undefined;
        const communeObj =
          o.customer?.wilayaCode && o.customer?.commune
            ? findCommune(o.customer.wilayaCode, o.customer.commune)
            : undefined;
        const fields: (string | undefined)[] = [
          o.orderNumber,
          o.customer?.fullName,
          o.customer?.phone,
          o.customer?.secondaryPhone,
          o.customer?.wilaya,
          o.customer?.commune,
          wilayaObj?.name,
          wilayaObj?.nameAr,
          communeObj?.name,
          communeObj?.nameAr,
        ];
        return fields.some((f) => f && normalizeProviderSearch(f).includes(term));
      });
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
      stockDeducted: true,
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

    const batch = writeBatch(db);
    batch.set(newDocRef, removeUndefined(newOrder));

    // Atomically decrement stock for ordered items in Firestore
    for (const item of data.items) {
      try {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentTotal = Number(productData.stockQuantity || 0);
          const updates: Record<string, any> = {
            updatedAt: now,
          };

          if (productData.sizeInventory && item.selectedSize && productData.sizeInventory[item.selectedSize] !== undefined) {
            const currentSizeInv = { ...productData.sizeInventory };
            const currentSizeStock = Number(currentSizeInv[item.selectedSize] || 0);
            currentSizeInv[item.selectedSize] = Math.max(0, currentSizeStock - item.quantity);
            const calculatedTotal = Object.values(currentSizeInv).reduce(
              (acc: number, val: any) => acc + Number(val || 0),
              0
            );
            updates.sizeInventory = currentSizeInv;
            updates.stockQuantity = calculatedTotal;
            updates.inStock = calculatedTotal > 0;
          } else {
            const newTotal = Math.max(0, currentTotal - item.quantity);
            updates.stockQuantity = newTotal;
            updates.inStock = newTotal > 0;
          }

          batch.update(productRef, removeUndefined(updates));
        }
      } catch (err) {
        console.error(`[VIP TADJ Firestore] Failed to decrement stock for product ${item.productId}:`, err);
      }
    }

    await batch.commit();
    return newOrder;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
    cancellationReason?: CancellationReason | string,
    logistics?: { courier?: string; trackingCode?: string }
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
    const courierName = logistics?.courier?.trim() || undefined;
    const trackingCode = logistics?.trackingCode?.trim() || undefined;

    const newHistoryItem: OrderStatusHistoryItem = {
      status,
      timestamp: now,
      note,
      updatedBy,
      ...(cancellationReason ? { cancellationReason: cancellationReason as CancellationReason } : {}),
      ...(courierName ? { courier: courierName } : {}),
      ...(trackingCode ? { trackingCode } : {}),
    };

    const updatedHistory = [...(orderData.statusHistory || []), newHistoryItem];
    const updatedCourier =
      courierName || trackingCode
        ? {
            ...(orderData.courier || {}),
            name: courierName || orderData.courier?.name || 'Yalidine Express',
            ...(trackingCode ? { trackingCode } : {}),
          }
        : orderData.courier;

    await updateDoc(docRef, removeUndefined({
      status,
      ...(updatedCourier ? { courier: updatedCourier } : {}),
      statusHistory: updatedHistory,
      updatedAt: now,
    }));

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
            const updates: Record<string, any> = {
              updatedAt: now,
            };

            if (productData.sizeInventory && item.selectedSize && productData.sizeInventory[item.selectedSize] !== undefined) {
              const currentSizeInv = { ...productData.sizeInventory };
              const currentSizeStock = Number(currentSizeInv[item.selectedSize] || 0);
              currentSizeInv[item.selectedSize] = currentSizeStock + item.quantity;
              const calculatedTotal = Object.values(currentSizeInv).reduce(
                (acc: number, val: any) => acc + Number(val || 0),
                0
              );
              updates.sizeInventory = currentSizeInv;
              updates.stockQuantity = calculatedTotal;
              updates.inStock = calculatedTotal > 0;
            } else {
              const newStock = currentStock + item.quantity;
              updates.stockQuantity = newStock;
              updates.inStock = newStock > 0;
            }

            batch.update(productRef, removeUndefined(updates));
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
      ...(updatedCourier ? { courier: updatedCourier } : {}),
      statusHistory: updatedHistory,
      updatedAt: now,
    };
  }

  async deleteOrder(id: string): Promise<boolean> {
    const db = this.getDatabase();
    const docRef = doc(db, 'orders', id);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      await deleteDoc(docRef);
      return true;
    }

    // Fallback: search by orderNumber
    const q = query(collection(db, 'orders'), where('orderNumber', '==', id), fsLimit(1));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      await deleteDoc(querySnap.docs[0].ref);
      return true;
    }

    return false;
  }

  async updateOrder(id: string, data: UpdateOrderData): Promise<Order> {
    const db = this.getDatabase();
    let docRef = doc(db, 'orders', id);
    let snap = await getDoc(docRef);

    if (!snap.exists()) {
      // Fallback: search by orderNumber
      const q = query(collection(db, 'orders'), where('orderNumber', '==', id), fsLimit(1));
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        throw new Error(`Order with ID "${id}" not found.`);
      }
      docRef = querySnap.docs[0].ref;
      snap = querySnap.docs[0];
    }

    const orderData = sanitizeDoc<Order>(snap.data());
    const now = new Date().toISOString();

    const items = data.items || orderData.items;
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const deliveryFee = data.deliveryFee !== undefined ? data.deliveryFee : orderData.deliveryFee;
    const discount = data.discount !== undefined ? data.discount : (orderData.discount || 0);
    const total = subtotal + deliveryFee - discount;

    const customer = data.customer ? { ...orderData.customer, ...data.customer } : orderData.customer;

    const historyEntry: OrderStatusHistoryItem = {
      status: orderData.status,
      timestamp: now,
      note: data.note || "Mise à jour des articles de la commande par l'administrateur",
      updatedBy: data.updatedBy || 'Admin',
    };

    const updatedHistory = [...(orderData.statusHistory || []), historyEntry];

    const updates = removeUndefined({
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      customer,
      adminNotes: data.adminNotes !== undefined ? data.adminNotes : orderData.adminNotes,
      statusHistory: updatedHistory,
      updatedAt: now,
    });

    await updateDoc(docRef, updates);

    return {
      ...orderData,
      id: docRef.id,
      ...updates,
    };
  }

  // ================= SETTINGS =================

  async getSettings(): Promise<StoreSettings> {
    const db = this.getDatabase();
    const docRef = doc(db, 'settings', 'store');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      await setDoc(docRef, removeUndefined(initialSettings));
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

    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, removeUndefined(updates));
    } else {
      await setDoc(docRef, removeUndefined({ ...initialSettings, ...updates }));
    }
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
      batch.set(catRef, removeUndefined(cat));
    }

    // Seed Settings
    const settingsRef = doc(db, 'settings', 'store');
    batch.set(settingsRef, removeUndefined(initialSettings));

    // Seed Products
    for (const prod of initialProducts) {
      const prodRef = doc(db, 'products', prod.id);
      batch.set(prodRef, removeUndefined(prod));
    }

    await batch.commit();

    return {
      success: true,
      count: initialProducts.length,
      message: `Database successfully seeded with ${initialProducts.length} items.`,
    };
  }
}
