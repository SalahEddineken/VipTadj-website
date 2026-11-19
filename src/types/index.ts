// ==========================================
// VIP TADJ — Master Domain Models & Contracts
// Authoritative models matching PROJECT.md, SCOPE.md, and SYNTHESIS.md
// ==========================================

// 1. PRODUCTS & CATALOG MODELS

export type ProductCategoryType = 'clothing' | 'shoes' | 'accessories';

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  publicId?: string; // Cloudinary identifier if hosted on Cloudinary
  width?: number;
  height?: number;
  color?: string; // Color name or tag linked to this image
}

export interface ProductColor {
  name: string;      // e.g. "Noir Profond", "Bleu Nuit", "Camel Sauvage"
  hex: string;       // e.g. "#111111", "#1A2B4C", "#C19A6B"
  inStock: boolean;
  imageUrl?: string; // Direct image URL representing this color
}

export interface ProductSizeStock {
  size: string;      // e.g. "48", "50", "42", "S", "M", "Taille Unique"
  stock: number;     // Available units
  skuModifier?: string;
}

export interface Product {
  id: string;
  title: string;                 // e.g. "Costume Deux Pièces en Laine Italienne Super 130s"
  titleAr?: string;
  titleEn?: string;
  slug: string;                  // e.g. "costume-deux-pieces-laine-italienne"
  subtitle?: string;             // e.g. "Édition Limitée Sartoriale"
  subtitleAr?: string;
  subtitleEn?: string;
  description: string;           // Rich French editorial description
  descriptionAr?: string;
  descriptionEn?: string;
  shortDescription?: string;     // Excerpt for quick-view and summary cards
  shortDescriptionAr?: string;
  shortDescriptionEn?: string;
  price: number;                 // Integer in DZD (e.g. 48500 = 48,500 DA)
  compareAtPrice?: number;       // Original strike-through price in DZD
  costPrice?: number;            // Admin cost price for margin calculation
  categoryId: ProductCategoryType;
  categorySlug: string;          // "vetements" | "chaussures" | "accessoires"
  subcategory: string;           // e.g. "costumes", "blazers", "chemises", "richelieu", "mocassins", "montres"
  images: ProductImage[];
  primaryImage?: string;         // Fast accessor to primary cover image URL
  sizes: string[];               // e.g. ["S", "M", "L", "XL", "XXL"] or ["39", "40", "41", "42"]
  sizeInventory?: Record<string, number>; // Size-to-stock mapping: { "S": 4, "M": 2, "L": 0 }
  colors?: ProductColor[];
  materials?: string;            // e.g. "100% Laine Vierge Lanificio Cerruti Super 130s"
  materialsAr?: string;
  materialsEn?: string;
  careInstructions?: string;     // e.g. "Nettoyage à sec par un spécialiste uniquement"
  careInstructionsAr?: string;
  careInstructionsEn?: string;
  fit?: 'Slim Fit' | 'Classic Fit' | 'Tailored Fit' | 'Relaxed Fit' | string;
  sku?: string;                  // e.g. "VIP-SUIT-001"
  stockQuantity: number;         // Total aggregate inventory units
  inStock: boolean;              // True if stockQuantity > 0
  status?: 'active' | 'draft' | 'archived'; // Product publication status: 'active' (visible) | 'draft' (hidden)
  isActive?: boolean;            // Master activation switch
  isFeatured: boolean;           // Displayed in homepage Hero / Curated selection
  isNewArrival: boolean;         // Displays "Nouvelle Collection" badge
  isBestSeller?: boolean;        // Displays "Best-Seller" badge
  tags?: string[];
  createdAt: string;             // ISO-8601 string (e.g. "2026-11-13T10:00:00.000Z")
  updatedAt: string;             // ISO-8601 string
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateProductInput = Partial<CreateProductInput>;

export interface ProductFilter {
  categoryId?: ProductCategoryType | string;
  categorySlug?: string;
  subcategory?: string;
  inStock?: boolean;
  status?: 'active' | 'draft' | 'archived';
  isActive?: boolean;
  featured?: boolean;
  newArrival?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'featured';
  limit?: number;
  offset?: number;
}

// 2. CATEGORIES

export interface SubCategory {
  id: string;
  name: string;        // e.g. "Costumes & Smokings"
  nameAr?: string;
  nameEn?: string;
  slug: string;        // e.g. "costumes"
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
}

export interface Category {
  id: ProductCategoryType | string; // 'clothing' | 'shoes' | 'accessories'
  name: string;            // "Vêtements", "Chaussures", "Accessoires"
  nameEn?: string;         // "Clothing", "Footwear", "Accessories"
  nameAr?: string;         // "ملابس وأزياء", "أحذية", "إكسسوارات"
  subtitle?: string;
  subtitleAr?: string;
  subtitleEn?: string;
  slug: string;            // "vetements", "chaussures", "accessoires"
  description: string;
  descriptionAr?: string;
  descriptionEn?: string;
  image?: string;          // Catalog preview image URL
  bannerImage?: string;    // High-res editorial banner URL
  displayOrder?: number;
  subcategories?: SubCategory[];
  itemCount?: number;
  isActive?: boolean;
}

// 3. ORDERS & ALGERIAN COD CHECKOUT

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export type CancellationReason =
  | 'CUSTOMER_CANCELLED'
  | 'UNREACHABLE_AFTER_CALLS'
  | 'DUPLICATE_ORDER'
  | 'FAKE_ORDER'
  | 'OUT_OF_STOCK'
  | 'DELIVERY_REFUSED'
  | 'OTHER';

export interface OrderItem {
  productId: string;
  title: string;
  slug: string;
  price: number;           // Unit price in DZD
  quantity: number;
  selectedSize: string;    // e.g. "50", "42", "L"
  selectedColor?: string;
  image: string;           // Image thumbnail URL
  maxStock?: number;       // Maximum available stock at selection time
}

export interface CustomerShippingInfo {
  fullName: string;
  phone: string;           // Algerian format: 05XX / 06XX / 07XX (10 digits)
  secondaryPhone?: string; // Optional backup phone number
  wilaya: string;          // e.g. "16 - Alger" or "Alger"
  wilayaCode: number;      // Official Algerian Wilaya number: 1 to 58
  commune: string;         // e.g. "Hydra", "Sidi M'Hamed", "Oran Centre"
  address?: string;        // Full street address or landmark (optional for home delivery, omitted for desk)
  notes?: string;          // Delivery instructions (e.g. "Appeler avant d'arriver")
  deliveryType?: 'home' | 'desk'; // Home delivery vs Stop Desk pickup
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;       // ISO-8601 string
  note?: string;           // Administrative comment
  updatedBy?: string;      // Admin email or "system" / "customer"
  cancellationReason?: CancellationReason;
  trackingCode?: string;   // Courier tracking number (e.g. Yalidine)
  courier?: string;        // Courier name
}

export interface Order {
  id: string;              // Unique database ID
  orderNumber: string;     // Human-facing reference: e.g. "VT-2026-1042"
  customer: CustomerShippingInfo;
  items: OrderItem[];
  subtotal: number;        // Total items price in DZD
  deliveryFee: number;     // Wilaya delivery fee in DZD
  discount?: number;       // Discount in DZD (if applicable)
  total: number;           // Final total payable on delivery: subtotal + deliveryFee - discount
  paymentMethod: 'cod';    // Cash on Delivery ("Paiement à la livraison")
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  courier?: {
    name: 'Yalidine' | 'ZR Express' | 'Procolis' | 'Internal' | 'Other' | string;
    trackingCode?: string;
    trackingUrl?: string;
  };
  adminNotes?: string;
  stockDeducted?: boolean; // True if inventory has been decremented for this order
  createdAt: string;       // ISO-8601 string
  updatedAt: string;       // ISO-8601 string
}

export interface CreateOrderInput {
  customer: CustomerShippingInfo;
  items: OrderItem[];
  deliveryFee: number;
  discount?: number;
  notes?: string;
}

export interface OrderFilter {
  status?: OrderStatus;
  search?: string;         // Matches customer name, phone, orderNumber, wilaya
  wilayaCode?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// 4. STORE SETTINGS & 68 WILAYAS CONFIGURATION

export interface AlgerianCommune {
  name: string;            // French name: "Hydra", "Oran Centre"
  nameAr: string;          // Arabic name: "حيدرة", "وهران المركز"
  wilayaCode: number;      // 1 to 68
  postalCode?: string;     // e.g. "16035"
  daira?: string;          // e.g. "Bir Mourad Raïs"
}

export interface WilayaDeliveryConfig {
  code: number;            // 1 to 68
  name: string;            // French name: "Alger", "Oran", "Constantine"
  nameAr?: string;         // Arabic name: "الجزائر", "وهران", "قسنطينة"
  fee?: number;            // Standard / Home fee in DZD
  homeDeliveryFee: number; // Fee in DZD (e.g. 400 DA)
  deskDeliveryFee?: number;// Stop Desk fee in DZD (e.g. 250 DA)
  zone?: string;           // e.g. "alger", "hauts-plateaux", "sud", "nord"
  estimatedDays: string;   // e.g. "24h - 48h"
  isAvailable: boolean;
}

export interface HeroVideoConfig {
  enabled: boolean;
  videoUrl: string;
  posterUrl?: string;
  overlayOpacity?: number; // 0 - 100 percentage
  playbackRate?: number;   // 0.25 - 2.0 speed multiplier (default 1.0)
}

export interface FeaturedSectionConfig {
  enabled: boolean;
  title?: string;          // French title: "Créations Emblématiques"
  titleAr?: string;        // Arabic title: "تشكيلاتنا المختارة"
  titleEn?: string;        // English title: "Curated Collections"
  productIds?: string[];   // Explicit ordered list of product IDs to display
}

export interface CommuneShippingFeeOverride {
  homeFee?: number;
  deskFee?: number;
  active?: boolean;
}

export interface StoreSettings {
  id?: string;
  storeName: string;       // "VIP TADJ"
  tagline?: string;        // "Haute Élégance Masculine"
  phone: string;           // Customer service phone: "+213 550 12 34 56"
  email: string;           // "contact@viptadj.dz"
  whatsappNumber?: string; // Direct WhatsApp contact
  address?: string;        // Boutique address: "Hydra, Alger, Algérie"
  currency: string;        // "DZD"
  currencySymbol: string;  // "DA"
  freeShippingThreshold?: number; // e.g. 30000 (Free shipping above 30,000 DA)
  announcementBar?: {
    enabled: boolean;
    text: string;          // "Livraison Express 68 Wilayas | Paiement à la réception"
    link?: string;
  };
  heroVideo?: HeroVideoConfig;
  featuredSection?: FeaturedSectionConfig;
  orderNotificationAudio?: boolean; // Audio chime for incoming orders
  wilayasDelivery: WilayaDeliveryConfig[]; // Full 68 Wilayas configuration
  wilayaShippingFees: Record<number, { homeFee: number; deskFee: number; active: boolean }>;
  communeShippingFees?: Record<string, CommuneShippingFeeOverride>; // Keyed by "${wilayaCode}:${commune.name}"
  maintenanceMode?: boolean;
  updatedAt?: string;
}

// 5. ADMIN AUTHENTICATION

export type AdminRole = 'superadmin' | 'admin';

export interface AdminUser {
  id: string;              // Firebase Auth UID
  email: string;
  displayName?: string;
  displayNameAr?: string;
  displayNameEn?: string;
  role: AdminRole;
  isActive?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

// 6. SEED & UTILITY RESULTS

export interface SeedResult {
  success: boolean;
  count: number;
  message: string;
}
