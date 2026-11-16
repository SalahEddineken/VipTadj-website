# Project: VIP TADJ — Men's Luxury Fashion E-Commerce Platform

## Architecture
VIP TADJ is an ultra-luxurious, production-ready men's fashion e-commerce platform inspired by Zara (editorial elegance, minimalist aesthetic, bespoke tailoring imagery) and Kiabi.dz (Algerian market operations: direct Cash on Delivery, 58 Wilayas shipping tiers, telephone order validation).

### System Overview
- **Framework**: Next.js 14+ (App Router), React Server Components (RSC), TypeScript (`strict: true`), Tailwind CSS with luxury tokens (`gold`, `obsidian`, `ivory`, `sand`).
- **Typography**: Editorial serif headings (`Playfair Display` / `Cinzel`) paired with minimalist geometric sans-serif (`Inter` / `Plus Jakarta Sans`).
- **Data Layer**: Resilient dual-mode data provider (`IDataStore`). Automatically uses Firebase Firestore when credentials exist; seamlessly falls back to an in-memory mock seed provider for zero-config build/test reliability (`npm run build` always passes).
- **Free Media Storage**: Tri-tier free media pipeline: Cloudinary unsigned direct uploads (no secrets in browser), Google Drive link normalizer (`drive.google.com/uc?export=view&id=...`), and verified luxury menswear public CDN library.
- **Storefront (Persuade Mode)**: Editorial homepage, multi-page catalog, faceted category/size/price filtering, high-resolution product detail pages (PDP) with multi-angle galleries, persistent shopping cart drawer, and frictionless 1-page Algerian COD checkout.
- **Admin Management (Operate Mode)**: Isolated `/admin` routes with `AdminAuthGuard`, KPI metrics dashboard, product inventory & size matrix editor, free media uploader, store settings with 58 Wilaya shipping fees, and sales order fulfillment engine with 1-click telephone call and WhatsApp order confirmation.

```
                          ┌───────────────────────────┐
                          │    Next.js App Router     │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
     ┌───────────────────────┐                     ┌───────────────────────┐
     │  Customer Storefront  │                     │    Admin Dashboard    │
     │  - Home & Collections │                     │  - Auth Guard         │
     │  - Catalog & Filters  │                     │  - KPI Overview       │
     │  - Product Detail PDP │                     │  - Order Fulfillment  │
     │  - Cart & COD Checkout│                     │  - Product & Stock    │
     └───────────┬───────────┘                     │  - 58 Wilaya Settings │
                 │                                 └───────────┬───────────┘
                 │                                             │
                 └──────────────────────┬──────────────────────┘
                                        ▼
                         ┌─────────────────────────────┐
                         │   IDataStore Provider       │
                         │   (Firestore / Mock Seed)   │
                         └──────────────┬──────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    ▼                                       ▼
       ┌────────────────────────┐              ┌────────────────────────┐
       │   Firebase Firestore   │              │   Free Media Storage   │
       │   - products           │              │   - Cloudinary (Free)  │
       │   - categories         │              │   - Drive Embed Stream │
       │   - orders             │              │   - Unsplash / CDN     │
       │   - settings & admins  │              │                        │
       └────────────────────────┘              └────────────────────────┘
```

---

## Feature Inventory
Every feature identified during the Survey phase is mapped below with its assigned milestone.

| # | Feature ID | Feature Name | Description | Milestone | Source |
|---|------------|--------------|-------------|-----------|--------|
| 1 | F-FOUND-01 | Next.js & Tailwind Luxury Stack | Configure Next.js App Router, Tailwind luxury tokens, typography, and strict TypeScript. | M1 | Survey 3 |
| 2 | F-FOUND-02 | Domain Types & Interfaces | Complete TypeScript models for products, variants, categories, orders, customers, and settings. | M1 | Survey 1, 2, 3 |
| 3 | F-FOUND-03 | Dual-Mode Data Provider | `IDataStore` abstraction with `FirestoreDataProvider` and zero-config `MockSeedDataProvider`. | M1 | Survey 3 |
| 4 | F-FOUND-04 | Free Media Storage Engine | Cloudinary unsigned client upload helper, Google Drive URL converter, and public CDN asset catalog. | M1 | Survey 2, 3 |
| 5 | F-FOUND-05 | 18-Item Realistic Seed Catalog | Seed catalog (Suits, Blazers, Shirts, Footwear, Accessories) with active Unsplash CDN images and DZD pricing. | M1 | Survey 3 |
| 6 | F-FOUND-06 | Seeding API & Script | `/api/seed` endpoint and automated seed initialization for database population. | M1 | Survey 3 |
| 7 | F-SF-01 | Luxury Storefront Design & Layout | Sticky navigation header with announcement bar, mobile bottom bar, and luxury footer. | M2 | Survey 1 |
| 8 | F-SF-02 | Homepage Editorial Experience | Hero editorial banner, curated collection cards, tabbed new arrivals, craftsmanship story, trust badges. | M2 | Survey 1 |
| 9 | F-SF-03 | Multi-Page Catalog & Filtering | Multi-page catalog (`/catalog`, `/catalog/[category]`) with category, subcategory, size, and price filters. | M2 | Survey 1 |
| 10 | F-SF-04 | Catalog Search & Sorting | Real-time search by keyword and sorting by newest, price asc, price desc. | M2 | Survey 1 |
| 11 | F-SF-05 | Product Detail Page (PDP) | Multi-angle image gallery with zoom, price, sizes, stock indicators, and fabric/care accordions. | M2 | Survey 1 |
| 12 | F-CART-01 | Shopping Cart State & Drawer | Persistent cart drawer (`CartContext`/localStorage) with quantity increment/decrement/remove and subtotal. | M3 | Survey 1 |
| 13 | F-CART-02 | Shopping Cart Full Page | Full `/cart` review page with item summaries, free shipping progress bar, and checkout trigger. | M3 | Survey 1 |
| 14 | F-CHECK-01 | Algerian 58 Wilayas Selector | Searchable 58 Wilayas dropdown with 4 regional shipping fee tiers and estimated delivery times. | M3 | Survey 1 |
| 15 | F-CHECK-02 | Algerian Direct COD Checkout Form | Streamlined 1-page checkout for customer name, Algerian phone (`05/06/07`), wilaya, commune, address. | M3 | Survey 1 |
| 16 | F-CHECK-03 | Order Placement API | `/api/orders` endpoint validating submissions and writing `pending` orders to Firestore/data store. | M3 | Survey 1, 3 |
| 17 | F-CHECK-04 | Order Confirmation & Telephone Notice | Post-purchase confirmation page with Order ID, customer recap, and direct WhatsApp support link. | M3 | Survey 1 |
| 18 | F-ADM-01 | Admin Authentication & Guard | Dedicated `/admin/login` and `AdminAuthGuard` shielding `/admin/*` routes from unauthorized access. | M4 | Survey 2 |
| 19 | F-ADM-02 | Admin Command Center & KPIs | `/admin` dashboard overview: Total Revenue (DZD), Pending orders alert, fulfillment in flight, AOV. | M4 | Survey 2 |
| 20 | F-ADM-03 | Product Catalog Management Table | `/admin/products` list with image thumbnails, price, stock matrix summary, active/draft toggles, delete. | M4 | Survey 2 |
| 21 | F-ADM-04 | Product Authoring & Size Matrix Form | `/admin/products/new` and `/admin/products/[id]` supporting clothing (S-XXL) and shoe (39-45) stock matrices. | M4 | Survey 2 |
| 22 | F-ADM-05 | Free Media Uploader Component | Drag-and-drop uploader supporting Cloudinary direct upload, Google Drive embed links, and image gallery. | M4 | Survey 2, 3 |
| 23 | F-ADM-06 | 58 Wilaya Delivery Fee Settings | `/admin/settings` interface to configure home/desk delivery fees across all 58 Algerian wilayas. | M4 | Survey 2 |
| 24 | F-ORD-01 | Sales Orders Fulfillment Table | `/admin/orders` table with status tabs (All, Pending, Confirmed, Shipped, Completed, Cancelled) & search. | M5 | Survey 2 |
| 25 | F-ORD-02 | Order Details & Customer Dossier | `/admin/orders/[id]` detailed inspection of items, customer contact, delivery wilaya, and total breakdown. | M5 | Survey 2 |
| 26 | F-ORD-03 | Order State Machine & Audit History | Status transition logic with cancellation reasons, timestamps, and chronological audit log. | M5 | Survey 2 |
| 27 | F-ORD-04 | 1-Click Phone Call & WhatsApp Confirm | Direct `tel:+213...` dialer and WhatsApp link with pre-composed order confirmation message. | M5 | Survey 2 |
| 28 | F-ORD-05 | Order Notification Sound Chimes | Audio alert and visual indicator for new incoming orders requiring telephone validation. | M5 | Survey 2 |
| 29 | F-TEST-01 | E2E Testing Infrastructure | Standalone automated testing runner, mock harnesses, and Tier 1-4 test suites. | E2E Track | Architecture |
| 30 | F-VERIF-01 | Full E2E Test Suite Validation | 100% pass of automated E2E tests (Tiers 1-4) across catalog, cart, checkout, and admin flows. | M6 (Final) | Acceptance |
| 31 | F-VERIF-02 | Adversarial Coverage Hardening | Tier 5 adversarial stress testing, boundary analysis, and white-box coverage hardening. | M6 (Final) | Acceptance |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Foundation, Data Layer & Media Service | Setup Next.js, Tailwind luxury tokens, domain types, resilient dual-mode data provider (Firestore + mock), free media storage engine, and 18-item seed catalog + seed runner. | None | DONE |
| M2 | VIP TADJ Customer Storefront | Global storefront layout (header, mobile drawer, footer), editorial home page, multi-page catalog with category filtering (`vetements`, `chaussures`, `accessoires`), search/sort, and Product Detail Pages (PDP) with high-res gallery and accordions. | M1 | DONE |
| M3 | Shopping Cart & Algerian Direct COD Checkout | Persistent cart drawer & `/cart` page, 58 Algerian Wilayas selector with dynamic shipping fees, streamlined 1-page COD checkout (`/checkout`), order placement API, and order confirmation screen with WhatsApp link. | M1, M2 | DONE |
| M4 | Admin Management Dashboard & Catalog Operations | Isolated `/admin` routes, `AdminAuthGuard`, dashboard KPI metrics, product catalog management table, product authoring form with size inventory matrix, free media uploader, and store settings. | M1 | DONE |
| M5 | Admin Sales Order Confirmation & Fulfillment Lifecycle | `/admin/orders` table, `/admin/orders/[id]` detail view, COD status state machine (`pending` -> `confirmed` -> `shipped` -> `completed` / `cancelled`), audit history log, 1-click phone call and WhatsApp confirmation link generator, and audio notifications. | M1, M3, M4 | DONE |
| M6 | Final Verification, E2E Test Pass & Adversarial Hardening | Phase 1: Pass 100% of E2E test suite (Tiers 1-4). Phase 2: Adversarial coverage hardening (Tier 5) with 40-assertion stress-tests, white-box audit, and production build verification. | M1, M2, M3, M4, M5, TEST_READY | DONE |

*Parallel Track*:
- **E2E Testing Track**: Verified and complete. Automated test suites across all 5 tiers (Smoke, Tier 1, Tier 2, Tier 3, Tier 4, Tier 5) and Challenger suites covering all 31 features in the Feature Inventory, with 65 test files, 703 passing tests, 0 failures, and clean production build. Published in `TEST_READY.md`.

### Final Verification & Quality Metrics (M6)
- **Feature Inventory Compliance**: 31 / 31 features (100%) fully implemented and verified.
- **Full Workspace Test Suite**: `npx vitest run` -> **65 test files passed (65)**, **703 tests passed (703)**, 0 failures, exit code 0.
- **Tier 5 Adversarial Suite**: `tests/tier5-adversarial-hardening.test.ts` -> **40 tests passed (40)** covering Suites A through E.
- **Challenger Adversarial Suites**: 16 test files (378 tests) including `tests/challenger-m6-2.test.ts` (16 tests) independently confirming state machine, idempotency, and media security.
- **Next.js Production Build**: `npm run build` -> **Exit code 0**, 17 static routes, 8 dynamic routes, shared JS bundle 87.2 kB.
- **Zero-Config Execution**: Headless execution with automatic in-memory mock provider fallback when Firebase credentials are unset.

---

## Interface Contracts

### 1. `src/types/index.ts` (Core Domain Model)
```typescript
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
  price: number;             // In DZD
  compareAtPrice?: number;
  categoryId: ProductCategoryType;
  categorySlug: string;
  subcategory: string;
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
  phone: string;
  wilaya: string;
  wilayaCode: number;
  commune: string;
  address: string;
  notes?: string;
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
  statusHistory: { status: OrderStatus; timestamp: string; note?: string; updatedBy?: string }[];
  createdAt: string;
  updatedAt: string;
}
```

### 2. `src/lib/data-provider/interface.ts` (Database Contract)
```typescript
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
  getSettings(): Promise<any>;
  updateSettings(data: any): Promise<any>;
  seedCatalog(force?: boolean): Promise<{ success: boolean; count: number; message: string }>;
}
```

### 3. `src/lib/media/url-normalizer.ts` (Media Contract)
```typescript
export function normalizeImageUrl(rawUrl: string): string;
// Converts Google Drive share URLs into direct embed stream endpoints,
// optimizes Unsplash CDN queries, and provides fallback image URLs.
```

### 4. `src/lib/utils/contactUtils.ts` (Customer Phone & WhatsApp Contract)
```typescript
export function formatTelLink(rawPhone: string): string;
export function generateWhatsAppConfirmLink(order: Order): string;
```

---

## Code Layout

```
g:\Websites\VIP TADJ\
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root luxury layout with typography & providers
│   │   ├── page.tsx                       # Homepage (Hero, collections, featured, story)
│   │   ├── globals.css                    # Tailwind directives & luxury styling tokens
│   │   ├── catalog/
│   │   │   ├── page.tsx                   # Multi-page catalog with filters
│   │   │   └── [category]/
│   │   │       ├── page.tsx               # Category listing (vetements/chaussures/accessoires)
│   │   │       └── [slug]/
│   │   │           └── page.tsx           # Product Detail Page (PDP)
│   │   ├── cart/
│   │   │   └── page.tsx                   # Full cart review page
│   │   ├── checkout/
│   │   │   ├── page.tsx                   # 1-page Algerian direct COD checkout
│   │   │   └── success/
│   │   │       └── [orderId]/
│   │   │           └── page.tsx           # Order confirmation & WhatsApp notice
│   │   ├── admin/
│   │   │   ├── layout.tsx                 # Protected admin shell layout
│   │   │   ├── page.tsx                   # Dashboard KPI metrics overview
│   │   │   ├── login/
│   │   │   │   └── page.tsx               # Admin login portal
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx               # Order fulfillment table & status filters
│   │   │   │   └── [orderId]/
│   │   │   │       └── page.tsx           # Order inspection & WhatsApp confirmation
│   │   │   ├── products/
│   │   │   │   ├── page.tsx               # Catalog management list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # New product & size matrix form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # Edit product form
│   │   │   └── settings/
│   │   │       └── page.tsx               # 58 Wilaya delivery fee settings
│   │   └── api/
│   │       ├── orders/route.ts            # Order submission and query API
│   │       ├── products/route.ts          # Product management API
│   │       ├── media/upload/route.ts      # Free media uploader proxy
│   │       └── seed/route.ts              # Catalog seeding API
│   ├── components/
│   │   ├── ui/                            # Buttons, Inputs, Modals, Badges, Tabs
│   │   ├── store/                         # Header, Footer, Hero, ProductCard, CartDrawer, WilayaSelector
│   │   └── admin/                         # AdminSidebar, OrderTable, ProductForm, AdminMediaUpload
│   ├── lib/
│   │   ├── firebase/                      # client.ts, config.ts
│   │   ├── data-provider/                 # interface.ts, firestore-provider.ts, mock-provider.ts, index.ts
│   │   ├── media/                         # upload-service.ts, url-normalizer.ts, curated-assets.ts
│   │   ├── seed/                          # seed-data.ts, seed-runner.ts
│   │   ├── context/                       # cart-context.tsx, auth-context.tsx
│   │   ├── utils/                         # cn, formatDZD, contactUtils.ts, orderStateMachine.ts
│   │   └── validations/                   # Zod schemas for checkout, products, settings
│   └── types/
│       └── index.ts                       # Master TypeScript contracts
├── firestore.rules                        # Declarative security rules
├── firestore.indexes.json                 # Firestore compound indexes
├── tailwind.config.ts                     # Luxury styling tokens
├── tsconfig.json                          # Strict TypeScript configuration
├── package.json
└── vitest.config.ts                       # Automated testing configuration
```
