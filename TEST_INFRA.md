# VIP TADJ — Automated Testing Infrastructure & Architecture Specification (`TEST_INFRA.md`)

**Target System**: VIP TADJ Luxury Men's E-Commerce Platform  
**Architecture Track**: Parallel E2E Testing Track (`F-TEST-01`, `F-VERIF-01`, `F-VERIF-02`)  
**Specification Version**: 1.0.0  
**Status**: APPROVED & ACTIVE  

---

## 1. Test Philosophy

VIP TADJ utilizes a rigorous, **opaque-box, requirement-driven, 4-tier automated testing methodology**. The testing infrastructure is designed to provide complete verification across all functional, boundary, integration, and user journey vectors without relying on implementation leakage or brittle internal component coupling.

### 1.1 Core Principles
1. **Opaque-Box & Requirement-Driven**:
   - Tests assert strictly observable behavior, accessible DOM roles, user interactions, and external data contracts defined in `PROJECT.md` and `ORIGINAL_REQUEST.md`.
   - Component internals, private methods, and non-contract state are never directly asserted.
2. **Zero-Config Dual-Mode Execution**:
   - The platform operates with a resilient dual-mode data layer (`IDataStore`).
   - In production, data operations persist to Firebase Firestore.
   - In testing and local CI environments, tests execute against an in-memory `mockDataProvider` populated with deterministic luxury menswear fixtures.
   - Zero live cloud credentials, third-party network requests, or billing credit cards are required to execute the full test suite.
3. **In-Process Speed & Headless Stability (Vitest + JSDOM)**:
   - Rather than relying on heavy full-browser runners (e.g. Playwright or Cypress) that require downloading 400MB+ browser binaries, binding to local HTTP network ports (`localhost:3000`), and risking flaky port collisions or socket timeouts in headless agent environments, VIP TADJ executes the entire 4-tier suite in-process via `vitest` + `jsdom`.
   - Node v24 native ESM, TypeScript, JSX/TSX, and Next.js path aliases (`@/*`) run with sub-second execution speeds.
4. **Deterministic Isolation**:
   - Every test is self-contained. Storage (`localStorage`), network mocks, and the in-memory data store are automatically purged and reset via `beforeEach` hooks in `tests/setup.ts`.
   - Tests are independent of execution order.

---

## 2. Feature Inventory & Test Matrix (31 Features)

Every feature in the VIP TADJ Master Feature Inventory is mapped across all 4 testing tiers.

| # | Feature ID | Feature Name | Tier 1 Coverage File | Tier 2 Boundary File | Tier 3 Combination | Tier 4 Scenario |
|---|------------|--------------|----------------------|----------------------|--------------------|-----------------|
| 1 | `F-FOUND-01` | Next.js & Tailwind Luxury Stack | `types.test.ts` | `edge-inputs.test.ts` | `admin-edit-storefront-pdp` | Journey 1 |
| 2 | `F-FOUND-02` | Domain Types & Interfaces | `types.test.ts` | `edge-inputs.test.ts` | `order-placement-admin-flow` | Journey 1, 3 |
| 3 | `F-FOUND-03` | Dual-Mode Data Provider | `data-provider.test.ts` | `stock-boundaries.test.ts` | `stock-decrement-lifecycle` | Journey 1, 3, 4 |
| 4 | `F-FOUND-04` | Free Media Storage Engine | `media-normalizer.test.ts` | `media-url-boundaries.test.ts` | `admin-edit-storefront-pdp` | Journey 4 |
| 5 | `F-FOUND-05` | 18-Item Realistic Seed Catalog | `seed-catalog.test.ts` | `pricing-boundaries.test.ts` | `catalog-search-sort` | Journey 1 |
| 6 | `F-FOUND-06` | Seeding API & Script | `seed-catalog.test.ts` | `edge-inputs.test.ts` | `data-provider.test.ts` | Journey 4 |
| 7 | `F-SF-01` | Luxury Storefront Design & Layout | `layout-navigation.test.tsx` | `edge-inputs.test.ts` | `cart-drawer.test.tsx` | Journey 1 |
| 8 | `F-SF-02` | Homepage Editorial Experience | `homepage.test.tsx` | `edge-inputs.test.ts` | `catalog-filters.test.tsx` | Journey 1 |
| 9 | `F-SF-03` | Multi-Page Catalog & Filtering | `catalog-filters.test.tsx` | `edge-inputs.test.ts` | `catalog-search-sort.test.tsx` | Journey 1 |
| 10 | `F-SF-04` | Catalog Search & Sorting | `catalog-search-sort.test.tsx` | `edge-inputs.test.ts` | `catalog-filters.test.tsx` | Journey 1 |
| 11 | `F-SF-05` | Product Detail Page (PDP) | `product-detail.test.tsx` | `stock-boundaries.test.ts` | `admin-edit-storefront-pdp` | Journey 1, 2 |
| 12 | `F-CART-01` | Shopping Cart State & Drawer | `cart-drawer.test.tsx` | `cart-boundaries.test.ts` | `cart-wilaya-shipping` | Journey 1 |
| 13 | `F-CART-02` | Shopping Cart Full Page | `cart-page.test.tsx` | `cart-boundaries.test.ts` | `free-shipping-wilaya-tier` | Journey 1 |
| 14 | `F-CHECK-01` | Algerian 58 Wilayas Selector | `wilayas-selector.test.tsx` | `wilaya-limits.test.ts` | `cart-wilaya-shipping` | Journey 1, 5 |
| 15 | `F-CHECK-02` | Algerian Direct COD Checkout Form | `checkout-form.test.tsx` | `phone-formats.test.ts` | `order-placement-admin-flow` | Journey 1, 2 |
| 16 | `F-CHECK-03` | Order Placement API | `order-placement-api.test.ts` | `edge-inputs.test.ts` | `stock-decrement-lifecycle` | Journey 1, 2 |
| 17 | `F-CHECK-04` | Order Confirmation & Telephone Notice | `order-confirmation.test.tsx` | `edge-inputs.test.ts` | `order-placement-admin-flow` | Journey 1, 2 |
| 18 | `F-ADM-01` | Admin Authentication & Guard | `admin-auth-guard.test.tsx` | `edge-inputs.test.ts` | `auth-session-multi-tab` | Journey 3, 4 |
| 19 | `F-ADM-02` | Admin Command Center & KPIs | `admin-dashboard-kpis.test.tsx` | `pricing-boundaries.test.ts` | `order-placement-admin-flow` | Journey 3 |
| 20 | `F-ADM-03` | Product Catalog Management Table | `admin-products-table.test.tsx` | `stock-boundaries.test.ts` | `admin-edit-storefront-pdp` | Journey 4 |
| 21 | `F-ADM-04` | Product Authoring & Size Matrix Form | `admin-product-form.test.tsx` | `stock-boundaries.test.ts` | `admin-edit-storefront-pdp` | Journey 4 |
| 22 | `F-ADM-05` | Free Media Uploader Component | `admin-media-uploader.test.tsx` | `media-url-boundaries.test.ts` | `admin-product-form.test.tsx` | Journey 4 |
| 23 | `F-ADM-06` | 58 Wilaya Delivery Fee Settings | `admin-settings.test.tsx` | `wilaya-limits.test.ts` | `cart-wilaya-shipping` | Journey 5 |
| 24 | `F-ORD-01` | Sales Orders Fulfillment Table | `admin-orders-table.test.tsx` | `edge-inputs.test.ts` | `order-placement-admin-flow` | Journey 3 |
| 25 | `F-ORD-02` | Order Details & Customer Dossier | `admin-order-detail.test.tsx` | `phone-formats.test.ts` | `order-placement-admin-flow` | Journey 3 |
| 26 | `F-ORD-03` | Order State Machine & Audit History | `order-state-machine.test.ts` | `edge-inputs.test.ts` | `stock-decrement-lifecycle` | Journey 3 |
| 27 | `F-ORD-04` | 1-Click Phone Call & WhatsApp Confirm | `admin-communication.test.ts` | `phone-formats.test.ts` | `order-state-machine.test.ts` | Journey 3 |
| 28 | `F-ORD-05` | Order Notification Sound Chimes | `admin-audio-chime.test.tsx` | `edge-inputs.test.ts` | `admin-dashboard-kpis` | Journey 3 |
| 29 | `F-TEST-01` | E2E Testing Infrastructure | `setup.ts`, runner configs | Test runners & harnesses | Cross-tier orchestration | All Journeys |
| 30 | `F-VERIF-01` | Full E2E Test Suite Validation | 100% Pass of Tier 1 | 100% Pass of Tier 2 | 100% Pass of Tier 3 | 100% Pass Tier 4 |
| 31 | `F-VERIF-02` | Adversarial Coverage Hardening | White-box stress assertions | Hostile fuzz vectors | Race condition stress | Adversarial suites |

---

## 3. Test Architecture & Directory Layout

### 3.1 Technology Stack
- **Test Runner**: Vitest `^2.1.8`
- **DOM Simulation**: JSDOM `^25.0.1`
- **Component Testing**: `@testing-library/react` `^16.1.0` + `@testing-library/user-event`
- **DOM Matchers**: `@testing-library/jest-dom` `^6.6.3`
- **Plugins**: `@vitejs/plugin-react` and `vite-tsconfig-paths` (resolving `@/*` to `./src/*`)

### 3.2 Directory Layout

```
g:\Websites\VIP TADJ\
├── TEST_INFRA.md                           # Master Test Architecture Specification
├── vitest.config.ts                        # Vitest Configuration (JSDOM, Globals, Aliases)
└── tests/
    ├── setup.ts                            # Polyfills (localStorage, matchMedia, Audio, next/navigation)
    ├── smoke.test.ts                       # Infrastructure & Fixture Integrity Smoke Suite
    ├── fixtures/                           # Deterministic luxury test datasets
    │   ├── products.fixture.ts             # 18-item luxury catalog (Suits, Blazers, Shoes, etc.)
    │   ├── orders.fixture.ts               # Realistic COD orders across all lifecycle statuses
    │   ├── wilayas.fixture.ts              # 58 Algerian Wilayas dataset with regional fee tiers
    │   └── settings.fixture.ts             # Store settings, DZD currency, free shipping threshold
    ├── helpers/                            # Test utilities & harnesses
    │   ├── mockDataProvider.ts             # In-memory IDataStore test harness with reset()
    │   ├── testUtils.ts                    # Algerian phone validator/formatter, formatDZD, order math
    │   └── renderWithProviders.tsx         # Context wrapper (Cart, Auth, Theme)
    │
    ├── tier1-features/                     # Tier 1: Core Feature Coverage (≥5 tests/feature)
    │   ├── foundation/                     # F-FOUND-01 .. F-FOUND-06
    │   ├── storefront/                     # F-SF-01 .. F-SF-05
    │   ├── cart/                           # F-CART-01, F-CART-02
    │   ├── checkout/                       # F-CHECK-01 .. F-CHECK-04
    │   └── admin/                          # F-ADM-01 .. F-ADM-06, F-ORD-01 .. F-ORD-05
    │
    ├── tier2-boundaries/                   # Tier 2: Boundary & Corner Cases (≥5 tests/domain)
    │   ├── edge-inputs.test.ts             # Boundary strings, extreme lengths, script injection
    │   ├── phone-formats.test.ts           # Algerian phone boundaries (05, 06, 07, +213, spaces)
    │   ├── wilaya-limits.test.ts           # Wilaya codes 1 to 58, out-of-range (0, 59, 99)
    │   ├── stock-boundaries.test.ts        # Zero stock, last item purchase, sold-out size disabling
    │   ├── cart-boundaries.test.ts         # Empty cart checkout attempt, negative quantities, 100+ items
    │   ├── pricing-boundaries.test.ts      # Free shipping threshold edges, 0 DA fees, DZD formats
    │   └── media-url-boundaries.test.ts    # Malformed URLs, non-Google Drive links, corrupted IDs
    │
    ├── tier3-combinations/                 # Tier 3: Cross-Feature Combinations (Pairwise)
    │   ├── cart-wilaya-shipping.test.ts    # Cart subtotal + 58 Wilaya delivery fee recalculation
    │   ├── admin-edit-storefront-pdp.test.ts # Admin product edit -> Storefront PDP reflection
    │   ├── order-placement-admin-flow.test.ts # Checkout order -> Admin table & COD state machine
    │   ├── stock-decrement-lifecycle.test.ts # Order placed -> Stock decrements -> Order cancelled -> Restored
    │   ├── free-shipping-wilaya-tier.test.ts # Subtotal qualifies for free shipping across regional tiers
    │   └── auth-session-multi-tab.test.ts  # Admin session expiry / login state across multiple views
    │
    └── tier4-scenarios/                    # Tier 4: Real-World Application Scenarios (Complete Journeys)
        ├── customer-discovery-to-checkout.test.tsx # Journey 1: Landing -> Browse -> Filter -> Cart -> Checkout -> WhatsApp
        ├── express-direct-checkout.test.tsx        # Journey 2: PDP "Commander directement" -> Instant order placed
        ├── admin-order-confirmation-lifecycle.test.ts # Journey 3: New order chime -> Call/WhatsApp -> Confirm -> Ship -> Delivered
        ├── catalog-replenishment-lifecycle.test.ts # Journey 4: Admin creates new suit -> Shows in storefront -> Customer buys -> Stock low
        └── wilaya-rate-reconfiguration-journey.test.ts # Journey 5: Admin updates Oran rate -> Shopper checks out with new fee
```

---

## 4. Real-World Application Scenarios (Tier 4)

VIP TADJ validates complete real-world customer and administrator journeys spanning multiple views and state transitions:

### Journey 1: Customer Discovery-to-Checkout
- **Flow**: Shopper arrives on homepage -> Views editorial hero and featured collections -> Navigates to `/catalog` -> Filters by category (`clothing`) and subcategory (`costumes`) -> Selects Italian Wool Suit -> Opens PDP -> Selects Size `50` -> Adds to cart -> Opens Cart Drawer -> Reviews line items -> Navigates to `/checkout` -> Selects Wilaya `16 - Alger` (Fee: 400 DA) -> Fills Algerian phone `0555123456` and address -> Submits COD order -> Redirects to confirmation screen with Order ID and pre-composed WhatsApp concierge link.

### Journey 2: Express Direct Checkout ("Commander directement")
- **Flow**: Shopper lands directly on a luxury Oxford Shoe PDP -> Selects Shoe Size `42` -> Clicks prominent "Commander directement" button -> Bypasses standard cart -> Lands on streamlined 1-page checkout -> Selects Wilaya `31 - Oran` (Fee: 600 DA) -> Enters shipping details -> Submits order -> Order is registered as `pending` with single item.

### Journey 3: Store Manager Fulfillment Lifecycle & Telephone Confirmation
- **Flow**: Store manager is on `/admin/orders` -> New COD order arrives triggering `Audio` alert chime -> Manager views pending counter increment -> Clicks order to inspect customer dossier -> Clicks `tel:+213...` dialer to call customer for confirmation -> Clicks WhatsApp confirmation link generator -> Transitions order status: `pending` -> `confirmed` -> Adds courier tracking (`Yalidine`) -> Transitions to `shipped` -> Parcel delivered -> Transitions to `delivered`.

### Journey 4: Catalog Replenishment & Stock Management
- **Flow**: Store manager logs in under `/admin/login` -> Passes `AdminAuthGuard` -> Navigates to `/admin/products/new` -> Authors new "Blazer en Lin et Soie" with DZD price 29,500 DA, uploads media embed link, and sets size matrix (`48: 3`, `50: 2`, `52: 1`, total `6`) -> Saves product -> Immediate reflection on `/catalog` -> Customer buys 2 units of Size `50` -> Inventory decrements to `0` for Size `50` -> Storefront PDP dynamically disables Size `50` with "Épuisé" badge while leaving `48` and `52` purchasable.

### Journey 5: Wilaya Shipping Rate Reconfiguration
- **Flow**: Store manager visits `/admin/settings` -> Modifies Oran (Wilaya 31) home delivery fee from 600 DA to 550 DA -> Updates free shipping threshold from 15,000 DA to 20,000 DA -> Saves settings -> Customer from Oran with 18,000 DA cart recalculates delivery fee (shows 550 DA instead of free) -> Customer adds 3,000 DA accessory (subtotal 21,000 DA) -> Shipping fee dynamically updates to `0 DA (Gratuit)`.

---

## 5. Coverage Thresholds

| Test Tier | Scope & Focus | Minimum Threshold |
|---|---|---|
| **Tier 1: Feature Coverage** | Core behavior for each function, contract, and component under valid inputs | **≥5 tests per feature** across all 31 features (≥155 total tests) |
| **Tier 2: Boundary & Corner Cases** | Edge inputs, boundary strings, extreme lengths, regex stress, limits | **≥5 tests per domain** (phones, wilayas, stock, prices, URLs, scripts) |
| **Tier 3: Cross-Feature Combinations** | Pairwise state transitions across cart, checkout, admin, inventory | **Pairwise state matrix** covering multi-module interactions |
| **Tier 4: Real-World Scenarios** | Complete synthetic end-to-end user journeys | **5 comprehensive full journeys** |
| **Tier 5: Adversarial Hardening** | Malformed payloads, race conditions, fuzz vectors, security boundaries | **100% pass of adversarial stress tests** in Milestone M6 |

---

## 6. Exact Execution Commands

```bash
# ==============================================================================
# VIP TADJ TEST RUNNER COMMAND REFERENCE
# ==============================================================================

# 1. Run complete automated test suite (all tiers)
npm test
# Equivalent direct Vitest command:
npx vitest run

# 2. Run Infrastructure Smoke Test
npx vitest run tests/smoke.test.ts

# 3. Run specific tiers independently
# Run Tier 1 (Feature Coverage)
npx vitest run tests/tier1-features/

# Run Tier 2 (Boundary & Corner Cases)
npx vitest run tests/tier2-boundaries/

# Run Tier 3 (Cross-Feature Combinations)
npx vitest run tests/tier3-combinations/

# Run Tier 4 (Real-World Scenarios)
npx vitest run tests/tier4-scenarios/

# 4. Interactive watch mode during development
npm run test:watch
# Equivalent direct command:
npx vitest

# 5. Generate coverage report
npx vitest run --coverage

# 6. Filter tests by title or keyword
npx vitest run -t "Algerian phone"
npx vitest run -t "Order State Machine"
npx vitest run -t "Wilaya"
npx vitest run -t "Smoke"
```
