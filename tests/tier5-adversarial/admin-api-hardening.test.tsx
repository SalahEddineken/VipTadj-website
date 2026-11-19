import React from 'react';
import fs from 'fs/promises';
import path from 'path';
import { gzipSync } from 'zlib';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminLayout from '@/app/admin/layout';
import { OrderStatusTransitionModal } from '@/components/admin/OrderStatusTransitionModal';
import { OrderDetailClient } from '@/components/admin/OrderDetailClient';
import { AdminMediaUpload } from '@/components/admin/AdminMediaUpload';
import { ProductForm } from '@/components/admin/ProductForm';
import { ProductsManagementClient } from '@/components/admin/ProductsManagementClient';
import AdminSettingsPage from '@/app/admin/settings/page';
import { PATCH as statusPatchAPI } from '@/app/api/orders/[id]/status/route';
import { POST as ordersPostAPI, GET as ordersGetAPI } from '@/app/api/orders/route';
import { POST as productsPostAPI } from '@/app/api/products/route';
import { PATCH as productPatchAPI } from '@/app/api/products/[id]/route';
import { POST as mediaUploadAPI } from '@/app/api/media/upload/route';
import { PUT as settingsPutAPI } from '@/app/api/settings/route';
import { getDataStore } from '@/lib/data-provider';
import {
  extractGoogleDriveId,
  getLuxuryPlaceholderSvg,
  isSafeSvgDataUri,
  isSafeSvgMarkup,
  isValidMediaUrl,
  normalizeImageUrl,
} from '@/lib/media/url-normalizer';
import {
  inspectMediaInput,
  uploadToCloudinary,
  validateUploadedSvgFile,
} from '@/lib/media/upload-service';
import { getLocalizedOrderNote } from '@/lib/utils/orderStateMachine';
import { COLOR_TRANSLATIONS, getLocalizedColor } from '@/lib/i18n/catalog-translations';
import { SEED_PRODUCTS } from '@/lib/seed/seed-data';
import { fr, en, ar } from '@/lib/i18n/locales';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { createMockOrder } from '../e2e/helpers/e2eTestUtils';
import {
  assertZeroFrenchOrEnglishLeakage,
  setupExtendedE2EFetch,
} from '../e2e/helpers/ar-leakage-assertions';

describe('Tier 5 Adversarial — Admin Portal, API, Validations, Media & Parity Hardening', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'vip_tadj_lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    delete (globalThis as Record<string, unknown>).__vipTadjDataStore;
    const store = getDataStore();
    await store.seedCatalog(true);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 7. OrderStatusTransitionModal >1000-char note interpolation & x-lang header
  // =========================================================================
  it('interpolates data.errorParams ({max} -> 1000) and sends x-lang header in OrderStatusTransitionModal across ar/fr/en', async () => {
    for (const lang of ['ar', 'fr', 'en'] as const) {
      const observedHeaders: Record<string, string>[] = [];
      global.fetch = vi.fn().mockImplementation(async (input, init) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const headers = (init?.headers || {}) as Record<string, string>;
        observedHeaders.push(headers);
        const req = new NextRequest(`http://localhost:3000${url}`, {
          method: init?.method || 'PATCH',
          headers: new Headers(headers),
          body: init?.body as BodyInit,
        });
        const idMatch = url.match(/\/api\/orders\/([^/]+)\/status/);
        return statusPatchAPI(req, { params: { id: idMatch?.[1] || 'ord-001' } });
      });

      const order = createMockOrder({ id: 'ord-001', status: 'pending' });
      const { container, unmount } = renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          onClose={vi.fn()}
          order={order}
          initialTargetStatus="confirmed"
          onSuccess={vi.fn()}
        />,
        { language: lang, includeAdmin: true }
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      fireEvent.change(textarea, { target: { value: 'a'.repeat(1001) } });

      const submitBtn = Array.from(container.querySelectorAll('button[type="submit"]'))[0] as HTMLButtonElement;
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(container.textContent).toContain('1000');
      });
      expect(container.textContent).not.toContain('{max}');
      expect(observedHeaders.some((h) => h['x-lang'] === lang)).toBe(true);
      unmount();
    }
  });

  // =========================================================================
  // 8. PATCH /api/orders/[id]/status localized notes + courier/trackingCode persistence
  // =========================================================================
  it('persists courier & trackingCode and emits localized audit notes (zero French leakage in AR OrderDetailClient)', async () => {
    // 1. Confirmed without note in AR
    const confirmReq = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
      body: JSON.stringify({ status: 'confirmed' }),
    });
    const confirmRes = await statusPatchAPI(confirmReq, { params: { id: 'ord-001' } });
    expect(confirmRes.status).toBe(200);
    const confirmData = await confirmRes.json();
    const confirmEntry = confirmData.order.statusHistory.at(-1);
    expect(confirmEntry.note).not.toMatch(/Statut changé/i);
    expect(confirmEntry.note).toContain('مؤكدة');

    // 2. Shipped without note + with courier & trackingCode in AR
    const shipReq = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
      body: JSON.stringify({
        status: 'shipped',
        courier: 'ZR Express',
        trackingCode: 'ZR-2026-999',
      }),
    });
    const shipRes = await statusPatchAPI(shipReq, { params: { id: 'ord-001' } });
    expect(shipRes.status).toBe(200);
    const shipData = await shipRes.json();
    expect(shipData.order.courier?.name).toBe('ZR Express');
    expect(shipData.order.courier?.trackingCode).toBe('ZR-2026-999');
    const shipEntry = shipData.order.statusHistory.at(-1);
    expect(shipEntry.courier).toBe('ZR Express');
    expect(shipEntry.trackingCode).toBe('ZR-2026-999');
    expect(shipEntry.note).not.toMatch(/Statut changé/i);

    // 3. Render OrderDetailClient in AR with shipped order (Arabic customer profile to verify strict zero leakage)
    const arShippedOrder = {
      ...shipData.order,
      customer: {
        ...shipData.order.customer,
        fullName: 'ياسين براهيمي',
        address: 'شارع الصنوبر، عمارة 4',
      },
    };
    const detail = renderWithProviders(
      <OrderDetailClient initialOrder={arShippedOrder} />,
      { language: 'ar', includeAdmin: true }
    );
    expect(detail.container.textContent).toContain('ZR-2026-999');
    expect(detail.container.textContent).toContain('ZR إكسبريس');
    expect(detail.container.textContent).not.toContain('Statut changé');
    assertZeroFrenchOrEnglishLeakage(detail.container, {
      requireCurrency: true,
      extraWhitelist: ['system'],
    });
    detail.unmount();

    // 4. Cancelled with cancellationReason and no note in AR + legacy FR note translation
    const store = getDataStore();
    await store.seedCatalog(true);
    const cancelReq = new NextRequest('http://localhost:3000/api/orders/ord-001/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
      body: JSON.stringify({
        status: 'cancelled',
        cancellationReason: 'customer_unreachable',
      }),
    });
    const cancelRes = await statusPatchAPI(cancelReq, { params: { id: 'ord-001' } });
    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.order.statusHistory.at(-1).note).not.toMatch(/Motif\s*:/i);

    const arCancelledOrder = {
      ...cancelData.order,
      customer: {
        ...cancelData.order.customer,
        fullName: 'ياسين براهيمي',
        address: 'شارع الصنوبر، عمارة 4',
      },
    };
    const cancelDetail = renderWithProviders(
      <OrderDetailClient initialOrder={arCancelledOrder} />,
      { language: 'ar', includeAdmin: true }
    );
    expect(cancelDetail.container.textContent).not.toContain('Motif :');
    assertZeroFrenchOrEnglishLeakage(cancelDetail.container, {
      requireCurrency: true,
      extraWhitelist: ['system'],
    });
    cancelDetail.unmount();

    // Legacy French stored notes must also translate cleanly in AR/EN via getLocalizedOrderNote
    expect(getLocalizedOrderNote('Statut changé vers confirmed', 'ar')).toBe('تم تغيير الحالة إلى مؤكدة');
    expect(getLocalizedOrderNote('Statut changé vers shipped', 'en')).toBe('Status changed to Shipped');
    expect(getLocalizedOrderNote('Motif : customer_unreachable', 'ar')).toBe(
      `السبب: ${ar['admin.orders.cancel_reason.customer_unreachable']}`
    );
  });

  // =========================================================================
  // 9. Media URL security & SVG fallback language
  // =========================================================================
  it('blocks dangerous protocols in isValidMediaUrl, AdminMediaUpload, and POST /api/media/upload, and localizes SVG fallback', async () => {
    const malicious = [
      'javascript:alert(1)',
      'javascript:void(0)',
      'vbscript:msgbox(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://example.com/file.jpg',
      'not-a-valid-url',
      '',
    ];
    for (const bad of malicious) {
      expect(isValidMediaUrl(bad)).toBe(false);
    }
    expect(isValidMediaUrl('https://images.unsplash.com/photo-1594938298603-c8148c4dae35')).toBe(true);
    expect(isValidMediaUrl('/images/suit.jpg')).toBe(true);
    expect(isValidMediaUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);

    // AdminMediaUpload URL tab rejection
    const onChangeSpy = vi.fn();
    const { container } = renderWithProviders(
      <AdminMediaUpload images={[]} onChange={onChangeSpy} category="clothing" />,
      { language: 'ar', includeAdmin: true }
    );
    const urlTabBtn = within(container).getByRole('button', {
      name: new RegExp(ar['admin.media.tab_url']),
    });
    fireEvent.click(urlTabBtn);

    const urlInput = container.querySelector('input[type="url"]') as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'javascript:alert(1)' } });
    const addBtn = within(container).getByRole('button', {
      name: new RegExp(ar['admin.media.add_to_gallery']),
    });
    fireEvent.click(addBtn);

    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(container.textContent).toContain(ar['media.inspect.invalid']);

    // POST /api/media/upload rejects invalid URL with 400 UPLOAD_INVALID_URL
    for (const badUrl of ['not-a-valid-url', 'javascript:alert(1)']) {
      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: badUrl }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
      expect(data.error).toBe(ar['api.error.upload_invalid_url']);
    }

    // SVG fallback in AR must NOT contain French tagline
    const svgUri = normalizeImageUrl('', { fallbackCategory: 'clothing', language: 'ar' });
    const decodedSvg = decodeURIComponent(svgUri.replace('data:image/svg+xml;utf8,', ''));
    expect(decodedSvg).not.toContain('HAUTE ÉLÉGANCE MASCULINE');
    expect(decodedSvg).toContain('أناقة رجالية راقية');
  });

  // =========================================================================
  // 10. ProductForm costPrice UX + POST / PATCH /api/products parity
  // =========================================================================
  it('shows field-level costPrice error in ProductForm and enforces POST/PATCH parity with specific errorKey', async () => {
    const baseProd = SEED_PRODUCTS[0];

    // 1. ProductForm costPrice = 0 renders visible error message & rose border
    const { container } = renderWithProviders(
      <ProductForm mode="edit" initialData={{ ...baseProd, costPrice: 1000 }} />,
      { language: 'ar', includeAdmin: true }
    );
    const costInput = container.querySelector(
      `input[placeholder="${ar['admin.product_form.ph_cost_price']}"]`
    ) as HTMLInputElement;
    expect(costInput).toBeTruthy();
    fireEvent.change(costInput, { target: { value: '0' } });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(container.textContent).toContain(ar['validation.product.cost_price_positive']);
    });
    expect(costInput.className).toContain('border-rose-500');

    // 2. POST and PATCH both reject costPrice: null and costPrice: -10 with field-specific errorKey
    const validBody = {
      title: 'Costume Laine Vierge Test',
      slug: 'costume-laine-vierge-test',
      description: 'Description détaillée pour test de validation.',
      price: 45000,
      categoryId: 'clothing',
      subcategory: 'vestes',
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
          alt: 'Suit',
          isPrimary: true,
        },
      ],
      stockQuantity: 5,
    };

    for (const invalidCost of [null, -10, 0]) {
      const postReq = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ ...validBody, costPrice: invalidCost }),
      });
      const postRes = await productsPostAPI(postReq);
      expect(postRes.status).toBe(400);
      const postData = await postRes.json();
      expect(postData.errorKey).toBe('validation.product.cost_price_positive');
      expect(postData.errorKeys?.costPrice).toBe('validation.product.cost_price_positive');

      const patchReq = new NextRequest(`http://localhost:3000/api/products/${baseProd.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ costPrice: invalidCost }),
      });
      const patchRes = await productPatchAPI(patchReq, { params: { id: baseProd.id } });
      expect(patchRes.status).toBe(400);
      const patchData = await patchRes.json();
      expect(patchData.errorKey).toBe('validation.product.cost_price_positive');
      expect(patchData.errorKeys?.costPrice).toBe('validation.product.cost_price_positive');
    }
  });

  // =========================================================================
  // 11. POST /api/orders wilayaCode validation + GET /api/orders Arabic search
  // =========================================================================
  it('rejects boolean/float/array wilayaCode in POST /api/orders and matches Arabic wilaya/commune in GET /api/orders', async () => {
    const baseOrderPayload = {
      customer: {
        fullName: 'Amine Boudiaf',
        phone: '0555123456',
        wilayaCode: 16,
        wilaya: '16 - Alger',
        commune: 'Hydra',
        deliveryType: 'home',
      },
      items: [
        {
          productId: SEED_PRODUCTS[0].id,
          title: SEED_PRODUCTS[0].title,
          slug: SEED_PRODUCTS[0].slug,
          price: SEED_PRODUCTS[0].price,
          quantity: 1,
          selectedSize: '50',
          image: SEED_PRODUCTS[0].images[0].url,
        },
      ],
      deliveryFee: 400,
    };

    for (const badCode of [true, false, [], [16], 16.5, '   ', 0, 69]) {
      const req = new NextRequest('http://localhost:3000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({
          ...baseOrderPayload,
          customer: { ...baseOrderPayload.customer, wilayaCode: badCode },
        }),
      });
      const res = await ordersPostAPI(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('CHECKOUT_WILAYA_REQUIRED');
    }

    // Arabic wilaya search ('الجزائر') and commune search ('حيدرة')
    const wilayaReq = new NextRequest(
      `http://localhost:3000/api/orders?search=${encodeURIComponent('الجزائر')}`
    );
    const wilayaRes = await ordersGetAPI(wilayaReq);
    expect(wilayaRes.status).toBe(200);
    const wilayaData = await wilayaRes.json();
    expect(wilayaData.orders.length).toBeGreaterThanOrEqual(1);
    expect(wilayaData.orders.some((o: { id: string }) => o.id === 'ord-001')).toBe(true);

    const communeReq = new NextRequest(
      `http://localhost:3000/api/orders?search=${encodeURIComponent('حيدرة')}`
    );
    const communeRes = await ordersGetAPI(communeReq);
    expect(communeRes.status).toBe(200);
    const communeData = await communeRes.json();
    expect(communeData.orders.length).toBeGreaterThanOrEqual(1);
    expect(communeData.orders.some((o: { id: string }) => o.id === 'ord-001')).toBe(true);
  });

  // =========================================================================
  // 12. AdminLayout mobile pending badge aria-label + mobile drawer role="dialog" + Escape
  // =========================================================================
  it('exposes aria-label on AdminLayout mobile pending badge and closes role="dialog" mobile drawer on Escape', async () => {
    setupExtendedE2EFetch({
      ordersList: [createMockOrder({ id: 'ord-pend-1', status: 'pending' })],
    });

    const { container } = renderWithProviders(
      <AdminLayout>
        <div>محتوى</div>
      </AdminLayout>,
      {
        language: 'ar',
        includeAdmin: true,
        navigation: { pathname: '/admin' },
      }
    );

    const pendingLink = await waitFor(() => {
      const links = Array.from(
        container.querySelectorAll('a[href="/admin/orders?status=pending"]')
      );
      expect(links.length).toBeGreaterThanOrEqual(2);
      return links[0];
    });

    expect(pendingLink.getAttribute('aria-label')).toBe(
      ar['admin.layout.pending_orders_single'].replace('{count}', '1')
    );

    const menuBtn = within(container).getByRole('button', { name: ar['common.menu'] });
    fireEvent.click(menuBtn);

    const drawer = await within(container).findByRole('dialog');
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(drawer.getAttribute('aria-label')).toBe(ar['admin.nav.menu']);

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(within(container).queryByRole('dialog')).toBeNull();
    });
  });

  // =========================================================================
  // 13. PUT /api/settings heroVideo validation error keys + Cognac AR roundtrip
  // =========================================================================
  it('maps heroVideo validation errors to specific localized keys and preserves Cognac vs Marron Cognac AR roundtrip', async () => {
    const req = new NextRequest('http://localhost:3000/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
      body: JSON.stringify({
        heroVideo: {
          enabled: true,
          overlayOpacity: 200,
          playbackRate: 5.0,
        },
      }),
    });
    const res = await settingsPutAPI(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errorKeys?.['heroVideo.overlayOpacity']).toBe('validation.settings.hero_overlay_range');
    expect(data.errorKeys?.['heroVideo.playbackRate']).toBe('validation.settings.hero_playback_range');
    expect(data.error).toBe(ar['validation.settings.hero_overlay_range']);

    // Zero AR collisions in COLOR_TRANSLATIONS
    const byAr = new Map<string, string[]>();
    for (const [k, v] of Object.entries(COLOR_TRANSLATIONS)) {
      const list = byAr.get(v.ar) || [];
      list.push(k);
      byAr.set(v.ar, list);
    }
    const collisions = Array.from(byAr.entries()).filter(([, keys]) => keys.length > 1);
    expect(collisions).toEqual([]);

    // Exact roundtrip for Cognac vs Marron Cognac
    const cognacAr = getLocalizedColor('Cognac', 'ar');
    const marronCognacAr = getLocalizedColor('Marron Cognac', 'ar');
    expect(cognacAr).not.toBe(marronCognacAr);
    expect(getLocalizedColor(cognacAr, 'fr')).toBe('Cognac');
    expect(getLocalizedColor(marronCognacAr, 'fr')).toBe('Marron Cognac');
  });

  // =========================================================================
  // 14. OrderStatusTransitionModal shipped courier localization & cross-lang notes
  // =========================================================================
  it('localizes shipped couriers in AR OrderStatusTransitionModal, submits canonical updatedBy, and translates FR/EN shipped notes cleanly', async () => {
    let capturedBody: Record<string, unknown> | null = null;
    const onSuccessSpy = vi.fn();

    global.fetch = vi.fn().mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (typeof init?.body === 'string') {
        capturedBody = JSON.parse(init.body);
      }
      const req = new NextRequest(`http://localhost:3000${url}`, {
        method: init?.method || 'PATCH',
        headers: new Headers((init?.headers || {}) as Record<string, string>),
        body: init?.body as BodyInit,
      });
      return statusPatchAPI(req, { params: { id: 'ord-001' } });
    });

    // Advance ord-001 to confirmed first so shipped transition is legal
    const store = getDataStore();
    await store.updateOrderStatus('ord-001', 'confirmed', 'تمت الموافقة');
    const confirmedOrder = await store.getOrderById('ord-001');
    expect(confirmedOrder).toBeTruthy();
    const arConfirmedOrder = {
      ...confirmedOrder!,
      customer: {
        ...confirmedOrder!.customer,
        fullName: 'ياسين براهيمي',
        address: 'شارع الصنوبر، عمارة 4',
      },
    };

    const modal = renderWithProviders(
      <OrderStatusTransitionModal
        isOpen={true}
        onClose={vi.fn()}
        order={arConfirmedOrder}
        initialTargetStatus="shipped"
        onSuccess={onSuccessSpy}
      />,
      { language: 'ar', includeAdmin: true }
    );

    // Zero English courier <option> labels in AR mode
    const optionTexts = Array.from(modal.container.querySelectorAll('select option')).map(
      (opt) => opt.textContent || ''
    );
    expect(optionTexts).toEqual([
      'ياليدين إكسبريس',
      'ZR إكسبريس',
      'بروكوليس',
      ar['admin.orders.internal_delivery'],
      ar['admin.orders.other_carrier'],
    ]);
    expect(optionTexts.join(' ')).not.toMatch(/Yalidine|Procolis/);

    // Strict zero leakage without any courier extraWhitelist
    assertZeroFrenchOrEnglishLeakage(modal.container);

    // Fill tracking code and submit
    const trackingInput = modal.container.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(trackingInput, { target: { value: 'YAL-2026-999' } });
    const submitBtn = modal.container.querySelector('button[type="submit"]') as HTMLButtonElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onSuccessSpy).toHaveBeenCalledTimes(1);
    });

    expect(capturedBody).toBeTruthy();
    expect(capturedBody!.updatedBy).toBe('Admin');
    expect(capturedBody!.courier).toBe('Yalidine Express');
    expect(capturedBody!.note).toBe('تم تسليم الطرد إلى ياليدين إكسبريس (YAL-2026-999)');

    const updatedOrder = onSuccessSpy.mock.calls[0][0];
    modal.unmount();

    // Render resulting shipped order in OrderDetailClient AR (with Arabic customer profile)
    const arOrder = {
      ...updatedOrder,
      customer: {
        ...updatedOrder.customer,
        fullName: 'ياسين براهيمي',
        address: 'شارع الصنوبر، عمارة 4',
      },
    };
    const detail = renderWithProviders(<OrderDetailClient initialOrder={arOrder} />, {
      language: 'ar',
      includeAdmin: true,
    });
    expect(detail.container.textContent).toContain('ياليدين إكسبريس');
    expect(detail.container.textContent).toContain('YAL-2026-999');
    expect(detail.container.textContent).toContain(ar['admin.sidebar.role_admin']);
    assertZeroFrenchOrEnglishLeakage(detail.container, {
      requireCurrency: true,
      extraWhitelist: ['system'],
    });
    detail.unmount();

    // Cross-language getLocalizedOrderNote translations for shipped notes
    expect(getLocalizedOrderNote('Colis remis à Yalidine Express (YAL-2026-999)', 'ar')).toBe(
      'تم تسليم الطرد إلى ياليدين إكسبريس (YAL-2026-999)'
    );
    expect(getLocalizedOrderNote('Parcel handed to Procolis (PRO-777)', 'ar')).toBe(
      'تم تسليم الطرد إلى بروكوليس (PRO-777)'
    );
    expect(getLocalizedOrderNote('تم تسليم الطرد إلى ياليدين إكسبريس (YAL-2026-999)', 'fr')).toBe(
      'Colis remis à Yalidine Express (YAL-2026-999)'
    );
    expect(getLocalizedOrderNote('Colis remis à ZR Express', 'en')).toBe(
      'Parcel handed to ZR Express'
    );
  });

  // =========================================================================
  // 15. SVG Data URI (;utf8, & XSS), Google Drive folder URL, and upload parity
  // =========================================================================
  it('accepts safe ;utf8, SVG Data URIs while rejecting SVG XSS and Google Drive folder URLs consistently with /api/media/upload', async () => {
    const safeSvgAr = getLuxuryPlaceholderSvg('clothing', 'ar');
    const safeSvgCharset = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"></svg>')}`;
    expect(isValidMediaUrl(safeSvgAr)).toBe(true);
    expect(isValidMediaUrl(safeSvgCharset)).toBe(true);

    const xssPayloads = [
      'data:image/svg+xml,<svg onload="alert(1)">',
      'data:image/svg+xml;utf8,%3Csvg%20onload%3D%22alert(1)%22%3E',
      'data:image/svg+xml;utf8,<svg><script>alert(1)</script></svg>',
      'https://drive.google.com/drive/folders/1A2B3C4D5E6F',
      'https://drive.google.com/drive/u/0/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    ];
    for (const bad of xssPayloads) {
      expect(isValidMediaUrl(bad)).toBe(false);
    }

    // Valid SVG placeholder passes POST /api/media/upload with 200
    const validReq = new NextRequest('http://localhost:3000/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
      body: JSON.stringify({ url: safeSvgAr }),
    });
    const validRes = await mediaUploadAPI(validReq);
    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.success).toBe(true);
    expect(validData.image?.url).toBe(safeSvgAr);

    // Unsafe SVG XSS and Google Drive folder URL both fail POST /api/media/upload with 400 UPLOAD_INVALID_URL
    for (const bad of [
      'data:image/svg+xml,<svg onload="alert(1)">',
      'https://drive.google.com/drive/folders/1A2B3C4D5E6F',
    ]) {
      const badReq = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: bad }),
      });
      const badRes = await mediaUploadAPI(badReq);
      expect(badRes.status).toBe(400);
      const badData = await badRes.json();
      expect(badData.errorCode).toBe('UPLOAD_INVALID_URL');
      expect(badData.error).toBe(ar['api.error.upload_invalid_url']);
    }
  });

  // =========================================================================
  // 16. prod-shoes-01 subcategory uniqueness & x-lang headers on admin fetches
  // =========================================================================
  it('renders zero duplicate subcategory options for prod-shoes-01 and sends x-lang header on admin fetch calls', async () => {
    const shoes01 = SEED_PRODUCTS.find((p) => p.id === 'prod-shoes-01');
    expect(shoes01).toBeTruthy();

    // Edit form with prod-shoes-01 (and legacy 'richelieu' variant) must have unique subcategory options
    for (const variant of [shoes01!, { ...shoes01!, subcategory: 'richelieu' }]) {
      const formRender = renderWithProviders(
        <ProductForm mode="edit" initialData={variant} />,
        { language: 'ar', includeAdmin: true }
      );
      const subSelect = Array.from(formRender.container.querySelectorAll('select')).find((sel) =>
        Array.from(sel.options).some((opt) => opt.value === 'richelieus' || opt.value === 'oxfords')
      ) as HTMLSelectElement | undefined;
      expect(subSelect).toBeTruthy();
      const optionLabels = Array.from(subSelect!.options).map((o) => o.textContent || '');
      expect(new Set(optionLabels).size).toBe(optionLabels.length);
      expect(optionLabels.filter((l) => l === 'أحذية ريشليو')).toHaveLength(1);
      formRender.unmount();
    }

    // Track x-lang headers across ProductForm, ProductsManagementClient, and AdminSettingsPage
    const capturedRequests: Array<{ url: string; method: string; xLang: string | null }> = [];
    global.fetch = vi.fn().mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || 'GET').toUpperCase();
      const headers = new Headers(init?.headers as HeadersInit | undefined);
      capturedRequests.push({ url, method, xLang: headers.get('x-lang') });

      if (url.includes('/api/media/upload')) {
        return new Response(
          JSON.stringify({
            success: true,
            image: { id: 'img-new', url: '/uploads/test.jpg', alt: 'Test', isPrimary: true },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('/api/settings')) {
        return new Response(
          JSON.stringify({
            success: true,
            settings: {
              storeName: 'VIP TADJ',
              tagline: 'Haute Couture',
              phone: '0550000000',
              whatsappNumber: '0550000000',
              email: 'contact@viptadj.dz',
              address: 'Alger',
              freeShippingThreshold: 15000,
              wilayaShippingFees: {},
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ success: true, product: shoes01 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // 1. ProductForm submit -> PUT /api/products/:id with x-lang: ar
    const editForm = renderWithProviders(
      <ProductForm mode="edit" initialData={shoes01!} />,
      { language: 'ar', includeAdmin: true }
    );
    fireEvent.click(editForm.container.querySelector('button[type="submit"]')!);
    await waitFor(() => {
      expect(
        capturedRequests.some((r) => r.url.includes(`/api/products/${shoes01!.id}`) && r.method === 'PUT' && r.xLang === 'ar')
      ).toBe(true);
    });
    editForm.unmount();

    // 2. ProductsManagementClient toggle -> PATCH /api/products/:id with x-lang: ar
    const prodMgmt = renderWithProviders(
      <ProductsManagementClient initialProducts={[shoes01!]} />,
      { language: 'ar', includeAdmin: true }
    );
    const toggleBtn = prodMgmt.container.querySelector('button[dir="ltr"]') as HTMLButtonElement;
    expect(toggleBtn).toBeTruthy();
    fireEvent.click(toggleBtn);
    await waitFor(() => {
      expect(
        capturedRequests.some((r) => r.url.includes(`/api/products/${shoes01!.id}`) && r.method === 'PATCH' && r.xLang === 'ar')
      ).toBe(true);
    });
    prodMgmt.unmount();

    // 3. AdminSettingsPage mount + save -> GET & PUT /api/settings with x-lang: ar
    const settingsPage = renderWithProviders(<AdminSettingsPage />, {
      language: 'ar',
      includeAdmin: true,
    });
    await waitFor(() => {
      expect(
        capturedRequests.some((r) => r.url.includes('/api/settings') && r.method === 'GET' && r.xLang === 'ar')
      ).toBe(true);
    });
    const saveBtn = await waitFor(() => {
      const btn = Array.from(settingsPage.container.querySelectorAll('button')).find((b) =>
        (b.textContent || '').includes(ar['admin.settings.save'])
      );
      expect(btn).toBeTruthy();
      return btn!;
    });
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(
        capturedRequests.some((r) => r.url.includes('/api/settings') && r.method === 'PUT' && r.xLang === 'ar')
      ).toBe(true);
    });
    settingsPage.unmount();

    // 4. AdminMediaUpload file upload -> POST /api/media/upload with x-lang: ar
    const mediaUpload = renderWithProviders(
      <AdminMediaUpload images={[]} onChange={vi.fn()} category="clothing" />,
      { language: 'ar', includeAdmin: true }
    );
    const fileInput = mediaUpload.container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    const smallFile = new File(['fake-jpeg-bytes'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [smallFile] } });
    await waitFor(() => {
      expect(
        capturedRequests.some((r) => r.url.includes('/api/media/upload') && r.method === 'POST' && r.xLang === 'ar')
      ).toBe(true);
    });
    mediaUpload.unmount();
  });

  // =========================================================================
  // 17. SVG SMIL & XML-entity XSS rejection, scoped Drive ID, & inspectMediaInput parity
  // =========================================================================
  it('blocks SMIL and XML/HTML-entity obfuscated SVG XSS, scopes extractGoogleDriveId, and aligns inspectMediaInput with isValidMediaUrl', async () => {
    const smilAndEntityPayloads = [
      'data:image/svg+xml;utf8,<svg><set attributeName="onbegin" to="alert(1)"/></svg>',
      'data:image/svg+xml;utf8,<svg><a href="jav&#x61;script:alert(1)">x</a></svg>',
      'data:image/svg+xml;utf8,<svg onload&#x3d;"alert(1)">',
      'data:image/svg+xml;utf8,<svg><a href="jav&#97script:alert(1)">x</a></svg>',
      'data:image/svg+xml;utf8,<svg><a href="javascript&colon;alert(1)">x</a></svg>',
      'data:image/svg+xml;utf8,<svg><a href="jav&#x09;ascript:alert(1)">x</a></svg>',
      'data:image/svg+xml;utf8,<svg><animateTransform attributeName="href" to="javascript:alert(1)"/></svg>',
      'data:image/svg+xml;utf8,<svg><animateMotion path="M0,0"/></svg>',
      'data:image/svg+xml;utf8,<svg>&lt;script&gt;alert(1)&lt;/script&gt;</svg>',
    ];

    for (const payload of smilAndEntityPayloads) {
      expect(isValidMediaUrl(payload)).toBe(false);
      expect(inspectMediaInput(payload, 'ar').isValid).toBe(false);
      expect(normalizeImageUrl(payload, { language: 'ar' })).toBe(
        getLuxuryPlaceholderSvg(undefined, 'ar')
      );
    }

    // POST /api/media/upload must reject all three core adversarial payloads with 400 UPLOAD_INVALID_URL
    for (const payload of smilAndEntityPayloads.slice(0, 3)) {
      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: payload }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
      expect(data.error).toBe(ar['api.error.upload_invalid_url']);
    }

    // Non-Google URLs with ?id= must NOT be hijacked into Google Drive URLs
    const thirdPartyUrl = 'https://cdn.example.com/photo.jpg?id=123456';
    expect(extractGoogleDriveId(thirdPartyUrl)).toBeNull();
    expect(normalizeImageUrl(thirdPartyUrl)).toBe(thirdPartyUrl);
    const inspectedThirdParty = inspectMediaInput(thirdPartyUrl, 'ar');
    expect(inspectedThirdParty.isValid).toBe(true);
    expect(inspectedThirdParty.mediaType).toBe('direct');
    expect(inspectedThirdParty.normalizedUrl).toBe(thirdPartyUrl);

    // Google Drive folder URL with ?id= query param must be rejected consistently
    const folderWithId =
      'https://drive.google.com/drive/folders/1A2B3C?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    expect(extractGoogleDriveId(folderWithId)).toBeNull();
    expect(isValidMediaUrl(folderWithId)).toBe(false);
    expect(inspectMediaInput(folderWithId, 'ar').isValid).toBe(false);

    // Safe SVG Data URI, local relative path, and uppercase DATA:IMAGE/PNG preserve & validate consistently
    const safeSvgAr = getLuxuryPlaceholderSvg('clothing', 'ar');
    expect(isValidMediaUrl(safeSvgAr)).toBe(true);
    expect(normalizeImageUrl(safeSvgAr, { fallbackCategory: 'clothing', language: 'ar' })).toBe(safeSvgAr);
    expect(inspectMediaInput(safeSvgAr, 'ar').isValid).toBe(true);

    expect(inspectMediaInput('/images/hero.jpg', 'ar').isValid).toBe(true);
    expect(inspectMediaInput('/images/hero.jpg', 'ar').mediaType).toBe('direct');

    const uppercasePng = 'DATA:IMAGE/PNG;base64,iVBORw0KGgo=';
    expect(isValidMediaUrl(uppercasePng)).toBe(true);
    expect(normalizeImageUrl(uppercasePng)).toBe(uppercasePng);
    expect(inspectMediaInput(uppercasePng, 'ar').isValid).toBe(true);
  });

  // =========================================================================
  // 18. OrderStatusTransitionModal legacy courier alias normalization
  // =========================================================================
  it('normalizes legacy Internal, Yalidine, and Other courier names in OrderStatusTransitionModal', async () => {
    const cases = [
      { legacy: 'Internal', canonical: 'Livraison Interne VIP TADJ' },
      { legacy: 'Yalidine', canonical: 'Yalidine Express' },
      { legacy: 'Other', canonical: 'Autre' },
    ] as const;

    for (const { legacy, canonical } of cases) {
      let submittedCourier: string | undefined;
      global.fetch = vi.fn().mockImplementation(async (_input, init) => {
        if (typeof init?.body === 'string') {
          submittedCourier = JSON.parse(init.body).courier;
        }
        return new Response(
          JSON.stringify({
            success: true,
            order: createMockOrder({ id: 'ord-legacy', status: 'shipped', courier: { name: canonical } }),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      const order = createMockOrder({
        id: 'ord-legacy',
        status: 'confirmed',
        courier: { name: legacy, trackingCode: 'TRK-01' },
      });

      const onSuccess = vi.fn();
      const { container, unmount } = renderWithProviders(
        <OrderStatusTransitionModal
          isOpen={true}
          onClose={vi.fn()}
          order={order}
          initialTargetStatus="shipped"
          onSuccess={onSuccess}
        />,
        { language: 'ar', includeAdmin: true }
      );

      const selectEl = container.querySelector('select') as HTMLSelectElement;
      expect(selectEl).toBeTruthy();
      expect(selectEl.value).toBe(canonical);

      fireEvent.click(container.querySelector('button[type="submit"]')!);
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
      expect(submittedCourier).toBe(canonical);
      unmount();
    }
  });

  // =========================================================================
  // 19. Round 4 SVG XSS (percent/space-split base64, <use>/<image>/<style>,
  //     null-byte/&equals; obfuscation) & /drive/folders?id= rejection
  // =========================================================================
  it('blocks percent-encoded/whitespace-split base64 SVG XSS, <use>/<image>/<style> gadgets, null-byte/&equals; obfuscation, and /drive/folders?id= across all media entrypoints', async () => {
    const rawB64Xss = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>',
      'utf8'
    ).toString('base64');
    const spaceSplitB64 = `data:image/svg+xml;base64,${rawB64Xss.slice(0, 10)}%20${rawB64Xss.slice(10)}`;
    const nestedUseB64 =
      'PHN2ZyBpZD0ieCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+';

    const bypassVectors: string[] = [
      // 1. Percent-encoded & %20-split base64 SVG XSS + malformed base64
      'data:image/svg+xml;base64,%50%48%4E%32%5A%79%42%76%62%6D%78%76%59%57%51%39%49%6D%46%73%5A%58%4A%30%4B%44%45%70%49%6A%34%38%4C%33%4E%32%5A%7A%34%3D',
      spaceSplitB64,
      'data:image/svg+xml;base64,!!!invalid!!!',
      'data:image/svg+xml;base64,%ZZ',
      // 2. <use>, <image>, <feImage>, <animateColor>, <discard>, and data:/javascript: href/xlink:href
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><use href="data:image/svg+xml;base64,${nestedUseB64}#x"/></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="data:image/svg+xml;base64,${nestedUseB64}#x"/></svg>`,
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml;utf8,<svg onload=alert(1)/>"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><feImage href="data:image/png;base64,iVBORw0KGgo="/></svg>',
      'data:image/svg+xml;utf8,<svg><animateColor attributeName="fill" from="red" to="blue"/></svg>',
      'data:image/svg+xml;utf8,<svg><discard begin="1s"/></svg>',
      'data:image/svg+xml;utf8,<svg><a href="data:text/html,<script>alert(1)</script>">x</a></svg>',
      // 3. <style> CSS @import, hex escapes, and url(data:...)
      'data:image/svg+xml;utf8,<svg><style>@import url("https://evil.example/x.css");</style></svg>',
      'data:image/svg+xml;utf8,<svg><style>a{background:url(\\6a avascript:alert(1))}</style></svg>',
      'data:image/svg+xml;utf8,<svg><rect style="background:url(data:image/svg+xml;utf8,<svg/>)"/></svg>',
      // 4. Null-byte / control-char obfuscation and &equals; / &lpar; / &sol; named entities
      'data:image/svg+xml;utf8,<svg onload\x00="alert(1)">',
      'data:image/svg+xml;utf8,<sc\x00ript>alert(1)</script>',
      'data:image/svg+xml;utf8,<svg onload&equals;"alert(1)">',
      'data:image/svg+xml;utf8,<svg><a href="javascript&colon;alert&lpar;1&rpar;&semi;">x</a></svg>',
      // 5. Google Drive /drive/folders?id=... without trailing slash
      'https://drive.google.com/drive/folders?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    ];

    expect(
      extractGoogleDriveId(
        'https://drive.google.com/drive/folders?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
      )
    ).toBeNull();

    const expectedFallback = getLuxuryPlaceholderSvg(undefined, 'ar');

    for (const vector of bypassVectors) {
      expect(isValidMediaUrl(vector), `isValidMediaUrl should reject: ${vector}`).toBe(false);
      expect(inspectMediaInput(vector, 'ar').isValid, `inspectMediaInput should reject: ${vector}`).toBe(false);
      expect(
        normalizeImageUrl(vector, { language: 'ar' }),
        `normalizeImageUrl should fallback to placeholder: ${vector}`
      ).toBe(expectedFallback);

      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: vector }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status, `POST /api/media/upload should return 400 for: ${vector}`).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
    }

    // Safe multiline UTF-8 SVG and safe base64 SVG continue to pass consistently
    const multilineSafeSvg =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg">\n<rect width="10" height="10" fill="#D4AF37"/>\n</svg>';
    const safeB64Svg = `data:image/svg+xml;base64,${Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
      'utf8'
    ).toString('base64')}`;

    for (const safe of [multilineSafeSvg, safeB64Svg, getLuxuryPlaceholderSvg('clothing', 'ar')]) {
      expect(isValidMediaUrl(safe)).toBe(true);
      expect(inspectMediaInput(safe, 'ar').isValid).toBe(true);
      expect(normalizeImageUrl(safe, { language: 'ar' })).toBe(safe);

      const okReq = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: safe }),
      });
      const okRes = await mediaUploadAPI(okReq);
      expect(okRes.status).toBe(200);
    }
  });

  // =========================================================================
  // 20. Round 5 SVG XSS (XML namespace prefixes, xl:href, CSS comments in url(),
  //     <?xml-stylesheet?> PI, \x0c+\x00 separator, &bsol; entity) & MIME parity
  // =========================================================================
  it('blocks XML-namespaced SVG XSS, custom namespace href, CSS-commented url(), XML PIs, \\x0c+\\x00/bsol obfuscation, and non-allowlisted data:image/* MIMEs across all media entrypoints', async () => {
    const nestedUseB64 =
      'PHN2ZyBpZD0ieCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+';

    const round5Vectors: string[] = [
      // 1. XML namespace-prefixed dangerous tags
      'data:image/svg+xml;utf8,<s:svg xmlns:s="http://www.w3.org/2000/svg"><s:script>alert(1)</s:script></s:svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:h="http://www.w3.org/1999/xhtml"><h:script>alert(1)</h:script></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:h="http://www.w3.org/1999/xhtml"><h:iframe src="https://evil.example"/></svg>',
      'data:image/svg+xml;utf8,<s:svg xmlns:s="http://www.w3.org/2000/svg"><s:style>rect{fill:red}</s:style></s:svg>',
      // 2. Custom XML namespace prefix on href/src & namespaced <use>
      `data:image/svg+xml;utf8,<s:svg xmlns:s="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink"><s:use xl:href="data:image/svg+xml;base64,${nestedUseB64}#x"/></s:svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xl="http://www.w3.org/1999/xlink"><a xl:href="data:image/svg+xml;base64,${nestedUseB64}#x"><rect width="10" height="10"/></a></svg>`,
      // 3. CSS comments inside url(...) on presentation attributes & XML Processing Instructions
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect filter="url(/*x*/'data:image/svg+xml;base64,${nestedUseB64}#x')"/></svg>`,
      'data:image/svg+xml;utf8,<?xml-stylesheet type="text/xsl" href="https://evil.example/x.xsl"?><svg xmlns="http://www.w3.org/2000/svg"/>',
      // 4. Control-char word boundary (\x0c + \x00) & &bsol; CSS escape entity
      'data:image/svg+xml;utf8,<svg\fon\x00load="alert(1)">',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect style="background:url(&bsol;6a avascript:alert(1))"/></svg>',
      // 5. Non-allowlisted data:image/* MIME types
      'data:image/html,<script>alert(1)</script>',
      'data:image/svg,<svg onload=alert(1)>',
    ];

    const expectedFallback = getLuxuryPlaceholderSvg(undefined, 'ar');

    for (const vector of round5Vectors) {
      expect(isValidMediaUrl(vector), `isValidMediaUrl should reject: ${vector}`).toBe(false);
      const inspected = inspectMediaInput(vector, 'ar');
      expect(inspected.isValid, `inspectMediaInput should reject: ${vector}`).toBe(false);
      expect(inspected.normalizedUrl).toBe(expectedFallback);
      expect(
        normalizeImageUrl(vector, { language: 'ar' }),
        `normalizeImageUrl should fallback to placeholder: ${vector}`
      ).toBe(expectedFallback);

      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: vector }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status, `POST /api/media/upload should return 400 for: ${vector}`).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
    }

    // Standard <?xml version="1.0"?> declaration on an otherwise safe SVG remains valid
    const xmlDeclSafeSvg =
      'data:image/svg+xml;utf8,<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" fill="#D4AF37"/></svg>';
    expect(isValidMediaUrl(xmlDeclSafeSvg)).toBe(true);
    expect(inspectMediaInput(xmlDeclSafeSvg, 'ar').isValid).toBe(true);
    expect(normalizeImageUrl(xmlDeclSafeSvg, { language: 'ar' })).toBe(xmlDeclSafeSvg);
  });

  // =========================================================================
  // 21. Round 6 SVG XSS (forgiving percent-decoding, CSS escapes, &quot; in style=,
  //     utf-7 charset, <h:link>) & ./ relative path parity
  // =========================================================================
  it('blocks forgiving-percent, CSS-escape, quot-split style=, utf-7 charset, and <h:link> SVG XSS while aligning ./ relative paths and preserving safe 100% SVGs', async () => {
    const nestedUseB64 =
      'PHN2ZyBpZD0ieCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+';

    const round6Vectors: string[] = [
      // 1. Forgiving percent-decoding with bare % (width="100%", 100%) and invalid UTF-8 (%FF)
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%">%3Cscript%3Ealert(1)%3C/script%3E</svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" onload%3D"alert(1)"></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><text>100%</text><a href="%6a%61%76%61%73%63%72%69%70%74:alert(1)">x</a></svg>',
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect width="100%" filter="url(%27data:image/svg+xml;base64,${nestedUseB64}#x%27)"/></svg>`,
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg">%FF%3Cscript%3Ealert(1)%3C/script%3E</svg>',
      // 2. CSS hex escapes on presentation attributes & &quot;-split style= attributes
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect filter="\\75rl(\\64 ata:image/svg+xml;base64,${nestedUseB64}#x)"/></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect filter="&#x5c;75rl(&#x5c;64 ata:image/svg+xml;base64,${nestedUseB64}#x)"/></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect style="font-family:&quot;a&quot;; background:&#x5c;75rl(&#x5c;64 ata:image/svg+xml;base64,${nestedUseB64}#x)"/></svg>`,
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><rect style="font-family:&quot;a&quot;; width:&#x65;xpression(alert(1))"/></svg>',
      // 3. Non-UTF-8 charset smuggling & XHTML <h:link rel="stylesheet">
      'data:image/svg+xml;charset=utf-7,+ADw-svg+AD4-+ADw-script+AD4-alert(1)+ADw-/script+AD4-+ADw-/svg+AD4-',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><h:link xmlns:h="http://www.w3.org/1999/xhtml" rel="stylesheet" href="https://evil.example/x.css"/></svg>',
      // 4. Unsafe local path traversal
      './../secret.jpg',
      './',
    ];

    const expectedFallback = getLuxuryPlaceholderSvg(undefined, 'ar');

    for (const vector of round6Vectors) {
      expect(isValidMediaUrl(vector), `isValidMediaUrl should reject: ${vector}`).toBe(false);
      const inspected = inspectMediaInput(vector, 'ar');
      expect(inspected.isValid, `inspectMediaInput should reject: ${vector}`).toBe(false);
      expect(inspected.normalizedUrl).toBe(expectedFallback);
      expect(
        normalizeImageUrl(vector, { language: 'ar' }),
        `normalizeImageUrl should fallback to placeholder: ${vector}`
      ).toBe(expectedFallback);

      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: vector }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status, `POST /api/media/upload should return 400 for: ${vector}`).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
    }

    // Safe SVG with width="100%" / height="100%", safe SVG with font-family & url(#obsidianGrad), and ./uploads/test.jpg pass consistently
    const safeInputs = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="#000"/></svg>',
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="obsidianGrad"/></defs><rect fill="url(#obsidianGrad)" style="font-family:&quot;Cairo&quot;, sans-serif"/></svg>',
      './uploads/test.jpg',
    ];

    for (const safe of safeInputs) {
      expect(isValidMediaUrl(safe), `isValidMediaUrl should accept: ${safe}`).toBe(true);
      const inspected = inspectMediaInput(safe, 'ar');
      expect(inspected.isValid, `inspectMediaInput should accept: ${safe}`).toBe(true);
      expect(inspected.mediaType).toBe('direct');
      expect(inspected.normalizedUrl).toBe(safe);
      expect(normalizeImageUrl(safe, { language: 'ar' })).toBe(safe);

      const okReq = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: safe }),
      });
      const okRes = await mediaUploadAPI(okReq);
      expect(okRes.status, `POST /api/media/upload should return 200 for: ${safe}`).toBe(200);
      const okData = await okRes.json();
      expect(okData.success).toBe(true);
      expect(okData.image?.url).toBe(safe);
    }
  });

  // =========================================================================
  // 22. Round 7 SVG XSS (tab/LF/CR/entity/raw-tab in data: URIs, <h:meta>/<meta>)
  //     & local-path hardening (/\\ and percent-encoded .. traversal)
  // =========================================================================
  it('blocks tab/LF/CR-split data: SVG/XHTML/XML URIs, <meta>/<h:meta> refresh gadgets, /\\ protocol-relative paths, and %2e%2e traversal while preserving safe SVGs and local paths', async () => {
    const nestedSvgB64 =
      'PHN2ZyBpZD0ieCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+';
    const nestedXhtmlB64 =
      'PHNjcmlwdCB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+YWxlcnQoMSk8L3NjcmlwdD4=';

    const round7Vectors: string[] = [
      // 1. Tab / LF / CR / &tab; / raw \t inside data: SVG, XHTML, and XML URIs in <a href=...>
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&#x09;ta:image/svg+xml;base64,${nestedSvgB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&#x0a;ta:image/svg+xml;base64,${nestedSvgB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&#x0d;ta:image/svg+xml;base64,${nestedSvgB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&tab;ta:image/svg+xml;base64,${nestedSvgB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da\tta:image/svg+xml;base64,${nestedSvgB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&#x09;ta:application/xhtml+xml;base64,${nestedXhtmlB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&#x09;ta:text/xml;base64,${nestedSvgB64}">x</a></svg>`,
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><a href="da&#x09;ta:application/xml;base64,${nestedSvgB64}">x</a></svg>`,
      // 2. XHTML <h:meta> and HTML <meta> refresh gadgets
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><h:meta xmlns:h="http://www.w3.org/1999/xhtml" http-equiv="refresh" content="0;url=data:image/svg+xml;base64,${nestedSvgB64}"/></svg>`,
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"><meta http-equiv="refresh" content="0;url=https://evil.example"/></svg>',
      // 3. Local path protocol-relative backslash (/\\) and percent-encoded .. traversal
      '/\\evil.com/x.jpg',
      './uploads/%2e%2e/secret.jpg',
      './uploads/.%2e/secret.jpg',
      '/uploads/%2E./secret.jpg',
      '/uploads/%2e%2e%5csecret.jpg',
    ];

    const expectedFallback = getLuxuryPlaceholderSvg(undefined, 'ar');

    for (const vector of round7Vectors) {
      expect(isValidMediaUrl(vector), `isValidMediaUrl should reject: ${vector}`).toBe(false);
      const inspected = inspectMediaInput(vector, 'ar');
      expect(inspected.isValid, `inspectMediaInput should reject: ${vector}`).toBe(false);
      expect(inspected.normalizedUrl).toBe(expectedFallback);
      expect(
        normalizeImageUrl(vector, { language: 'ar' }),
        `normalizeImageUrl should fallback to placeholder: ${vector}`
      ).toBe(expectedFallback);

      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: vector }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status, `POST /api/media/upload should return 400 for: ${vector}`).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
    }

    // Safe SVGs (including width="100%", fill="url(#obsidianGrad)", style="font-family:&quot;Cairo&quot;, sans-serif",
    // <metadata>, and getLuxuryPlaceholderSvg) plus ./uploads/test.jpg and /uploads/test.jpg pass consistently
    const safeInputs = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><linearGradient id="obsidianGrad"/></defs><metadata>VIP TADJ</metadata><rect width="100%" height="100%" fill="url(#obsidianGrad)" style="font-family:&quot;Cairo&quot;, sans-serif"/></svg>',
      getLuxuryPlaceholderSvg('clothing', 'ar'),
      './uploads/test.jpg',
      '/uploads/test.jpg',
    ];

    for (const safe of safeInputs) {
      expect(isValidMediaUrl(safe), `isValidMediaUrl should accept: ${safe}`).toBe(true);
      const inspected = inspectMediaInput(safe, 'ar');
      expect(inspected.isValid, `inspectMediaInput should accept: ${safe}`).toBe(true);
      expect(inspected.mediaType).toBe('direct');
      expect(inspected.normalizedUrl).toBe(safe);
      expect(normalizeImageUrl(safe, { language: 'ar' })).toBe(safe);

      const okReq = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: safe }),
      });
      const okRes = await mediaUploadAPI(okReq);
      expect(okRes.status, `POST /api/media/upload should return 200 for: ${safe}`).toBe(200);
      const okData = await okRes.json();
      expect(okData.success).toBe(true);
      expect(okData.image?.url).toBe(safe);
    }
  });

  // =========================================================================
  // 23. Round 8 XML DTD SVG XSS & Multipart FormData SVG Upload Hardening
  // =========================================================================
  it('blocks XML DTD SVG XSS (DOCTYPE/ENTITY/ATTLIST/ELEMENT/NOTATION) across all URL entrypoints and validates multipart FormData SVG uploads', async () => {
    const nestedSvgB64 =
      'PHN2ZyBpZD0ieCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+';

    const dtdVectors: string[] = [
      // 1. Round 8 <!ENTITY> javascript: scheme split
      'data:image/svg+xml;utf8,<!DOCTYPE svg [<!ENTITY a "javas"><!ENTITY b "cript:alert(1)">]><svg xmlns="http://www.w3.org/2000/svg"><a href="&a;&b;">click</a></svg>',
      // 2. Round 8 <!ENTITY> data:image/svg+xml;base64 scheme split
      `data:image/svg+xml;utf8,<!DOCTYPE svg [<!ENTITY a "da"><!ENTITY b "ta:image/svg+xml;base64,${nestedSvgB64}">]><svg xmlns="http://www.w3.org/2000/svg"><a href="&a;&b;">click</a></svg>`,
      // 3. Round 8 <!ATTLIST> default onload attribute injection
      'data:image/svg+xml;utf8,<!DOCTYPE svg [<!ATTLIST svg onload CDATA "alert(1)">]><svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>',
      // 4. Additional DTD declarations & obfuscations (<!ELEMENT>, <!NOTATION>, null-byte <!DOCTYPE, entity-encoded <!DOCTYPE, base64 DTD)
      'data:image/svg+xml;utf8,<!DOCTYPE svg [<!ELEMENT svg ANY>]><svg xmlns="http://www.w3.org/2000/svg"/>',
      'data:image/svg+xml;utf8,<!DOCTYPE svg [<!NOTATION x SYSTEM "http://evil.example/x">]><svg xmlns="http://www.w3.org/2000/svg"/>',
      'data:image/svg+xml;utf8,<!\x00DOCTYPE\x00svg [<!ENTITY a "x">]><svg xmlns="http://www.w3.org/2000/svg"/>',
      'data:image/svg+xml;utf8,%3C!DOCTYPE%20svg%20%5B%3C!ATTLIST%20svg%20onload%20CDATA%20%22alert(1)%22%3E%5D%3E%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%2F%3E',
      `data:image/svg+xml;base64,${Buffer.from(
        '<!DOCTYPE svg [<!ATTLIST svg onload CDATA "alert(1)">]><svg xmlns="http://www.w3.org/2000/svg"/>',
        'utf8'
      ).toString('base64')}`,
    ];

    const expectedFallback = getLuxuryPlaceholderSvg(undefined, 'ar');

    for (const vector of dtdVectors) {
      expect(isValidMediaUrl(vector), `isValidMediaUrl should reject DTD: ${vector}`).toBe(false);
      const inspected = inspectMediaInput(vector, 'ar');
      expect(inspected.isValid, `inspectMediaInput should reject DTD: ${vector}`).toBe(false);
      expect(inspected.normalizedUrl).toBe(expectedFallback);
      expect(
        normalizeImageUrl(vector, { language: 'ar' }),
        `normalizeImageUrl should fallback to placeholder: ${vector}`
      ).toBe(expectedFallback);

      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: vector }),
      });
      const res = await mediaUploadAPI(req);
      expect(res.status, `POST /api/media/upload should return 400 for DTD: ${vector}`).toBe(400);
      const data = await res.json();
      expect(data.errorCode).toBe('UPLOAD_INVALID_URL');
    }

    // Safe SVGs remain accepted across all 4 entrypoints
    const safeSvgs = [
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><linearGradient id="obsidianGrad"/></defs><metadata>VIP TADJ</metadata><rect width="100%" height="100%" fill="url(#obsidianGrad)" style="font-family:&quot;Cairo&quot;, sans-serif"/></svg>',
      getLuxuryPlaceholderSvg('clothing', 'ar'),
    ];
    for (const safe of safeSvgs) {
      expect(isValidMediaUrl(safe)).toBe(true);
      expect(inspectMediaInput(safe, 'ar').isValid).toBe(true);
      expect(normalizeImageUrl(safe, { language: 'ar' })).toBe(safe);
      const okReq = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lang': 'ar' },
        body: JSON.stringify({ url: safe }),
      });
      const okRes = await mediaUploadAPI(okReq);
      expect(okRes.status).toBe(200);
    }

    // Multipart FormData SVG file upload rejection for malicious SVG (<script>, onload, <!DOCTYPE)
    const createMultipartRequest = (
      files: Array<{ name: string; type: string; content: string }>,
      fields: Record<string, string> = {}
    ) => {
      const formData = new FormData();
      for (const [k, v] of Object.entries(fields)) {
        formData.append(k, v);
      }
      for (const f of files) {
        formData.append('file', new File([f.content], f.name, { type: f.type }));
      }
      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: {
          'x-lang': 'ar',
        },
      });
      // In Vitest jsdom, NextRequest (Undici) and jsdom FormData/File constructors differ;
      // provide the jsdom FormData directly to req.formData() so route.ts exercises real File inspection.
      vi.spyOn(req, 'formData').mockResolvedValue(formData);
      return req;
    };

    const maliciousSvgSpecs = [
      {
        name: 'xss-script.svg',
        type: 'image/svg+xml',
        content: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      },
      {
        name: 'xss-onload.svg',
        type: 'image/svg+xml',
        content: '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect width="10" height="10"/></svg>',
      },
      {
        name: 'xss-dtd.svg',
        type: 'image/svg+xml',
        content:
          '<!DOCTYPE svg [<!ENTITY a "javas"><!ENTITY b "cript:alert(1)">]><svg xmlns="http://www.w3.org/2000/svg"><a href="&a;&b;">x</a></svg>',
      },
      // Extension .svg with spoofed non-SVG MIME must also be validated & rejected
      {
        name: 'spoofed.svg',
        type: 'image/png',
        content: '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>',
      },
    ];

    for (const badSpec of maliciousSvgSpecs) {
      const uploadReq = createMultipartRequest([badSpec]);
      const uploadRes = await mediaUploadAPI(uploadReq);
      expect(uploadRes.status, `Multipart upload should reject ${badSpec.name}`).toBe(400);
      const uploadData = await uploadRes.json();
      expect(uploadData.success).toBe(false);
      expect(uploadData.errorCode).toBe('UPLOAD_UNSAFE_SVG');
      expect(uploadData.error).toBe(ar['api.error.upload_failed']);

      const badFile = new File([badSpec.content], badSpec.name, { type: badSpec.type });
      const cldResult = await uploadToCloudinary(badFile);
      expect(cldResult.success).toBe(false);
      expect(cldResult.errorCode).toBe('UPLOAD_UNSAFE_SVG');
    }

    // Multipart FormData SVG file upload acceptance for safe SVG
    const safeSvgMarkup =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs><linearGradient id="obsidianGrad"/></defs><metadata>VIP TADJ</metadata><rect width="100%" height="100%" fill="url(#obsidianGrad)" style="font-family:&quot;Cairo&quot;, sans-serif"/></svg>';
    const safeReq = createMultipartRequest(
      [{ name: 'safe-luxury-badge.svg', type: 'image/svg+xml', content: safeSvgMarkup }],
      { alt: 'VIP TADJ Badge' }
    );
    const createdDiskPaths: string[] = [];
    try {
      const safeRes = await mediaUploadAPI(safeReq);
      expect(safeRes.status).toBe(200);
      const safeData = await safeRes.json();
      expect(safeData.success).toBe(true);
      expect(safeData.image?.url).toBeTruthy();
      if (typeof safeData.image?.url === 'string' && safeData.image.url.startsWith('/uploads/')) {
        createdDiskPaths.push(path.join(process.cwd(), 'public', safeData.image.url));
      }
    } finally {
      for (const diskPath of createdDiskPaths) {
        try {
          await fs.unlink(diskPath);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  });

  // =========================================================================
  // 24. Round 9 Media Security Hardening (.svgz gzip, active-content uploads,
  //     and strict URL protocol/hostname checks in normalizeImageUrl & inspectMediaInput)
  // =========================================================================
  it('blocks gzipped .svgz, active-content uploads (.html/.xhtml/.xml), and CDN substring/subdomain XSS in normalizeImageUrl and inspectMediaInput', async () => {
    const createMultipartUploadReq = (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const req = new NextRequest('http://localhost:3000/api/media/upload', {
        method: 'POST',
        headers: { 'x-lang': 'ar' },
      });
      vi.spyOn(req, 'formData').mockResolvedValue(formData);
      return req;
    };

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const uploadsBefore = new Set(await fs.readdir(uploadDir));
    const createdDiskPaths: string[] = [];

    try {
      // 1. Bug 1: Gzipped malicious SVG (.svgz & .svg with gzip magic bytes)
      const gzippedEvilSvg = gzipSync(
        Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', 'utf8')
      );
      expect(isSafeSvgMarkup(gzippedEvilSvg.toString('utf8'))).toBe(false);
      expect(isSafeSvgMarkup('not-an-svg-at-all')).toBe(false);
      expect(
        isSafeSvgDataUri(`data:image/svg+xml;base64,${gzippedEvilSvg.toString('base64')}`)
      ).toBe(false);

      const svgzCases = [
        { name: 'evil.svgz', type: 'image/svg+xml' },
        { name: 'evil.svgz', type: 'application/gzip' },
        { name: 'evil.svgz', type: '' },
        { name: 'evil-gzip.svg', type: 'image/svg+xml' },
      ];

      for (const spec of svgzCases) {
        const file = new File([gzippedEvilSvg], spec.name, { type: spec.type });
        expect(await validateUploadedSvgFile(file), `validateUploadedSvgFile(${spec.name}, ${spec.type})`).toBe(false);

        const cldRes = await uploadToCloudinary(file);
        expect(cldRes.success).toBe(false);
        expect(cldRes.errorCode).toBe('UPLOAD_UNSAFE_SVG');

        const apiRes = await mediaUploadAPI(createMultipartUploadReq(file));
        expect(apiRes.status, `POST /api/media/upload(${spec.name}, ${spec.type})`).toBe(400);
        const apiData = await apiRes.json();
        expect(apiData.success).toBe(false);
        expect(apiData.errorCode).toBe('UPLOAD_UNSAFE_SVG');
        expect(apiData.error).toBe(ar['api.error.upload_failed']);
      }

      // 2. Bug 2: Active-content uploads (.html, .xhtml, .xml, .js, spoofed MIME)
      const activeContentCases = [
        { name: 'xss.html', type: 'text/html', content: '<script>alert(1)</script>' },
        {
          name: 'xss.xhtml',
          type: 'application/xhtml+xml',
          content: '<html xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></html>',
        },
        {
          name: 'xss.xml',
          type: 'text/xml',
          content: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
        },
        { name: 'xss-spoof.html', type: 'image/jpeg', content: '<script>alert(1)</script>' },
        { name: 'xss-mime.jpg', type: 'text/html', content: '<script>alert(1)</script>' },
        { name: 'payload.js', type: 'application/javascript', content: 'alert(1);' },
      ];

      for (const spec of activeContentCases) {
        const file = new File([spec.content], spec.name, { type: spec.type });
        const cldRes = await uploadToCloudinary(file);
        expect(cldRes.success).toBe(false);
        expect(cldRes.errorCode).toBe('UPLOAD_UNSUPPORTED_TYPE');

        const apiRes = await mediaUploadAPI(createMultipartUploadReq(file));
        expect(apiRes.status, `POST /api/media/upload should reject ${spec.name}`).toBe(400);
        const apiData = await apiRes.json();
        expect(apiData.success).toBe(false);
        expect(apiData.errorCode).toBe('UPLOAD_UNSUPPORTED_TYPE');
        expect(apiData.error).toBe(ar['api.error.upload_failed']);
      }

      // Verify zero files were written to public/uploads/ by any rejected upload
      const uploadsAfter = await fs.readdir(uploadDir);
      expect(uploadsAfter.filter((f) => !uploadsBefore.has(f))).toEqual([]);

      // 3. Bug 3: normalizeImageUrl() protocol + exact CDN hostname checks
      const expectedArPlaceholder = getLuxuryPlaceholderSvg(undefined, 'ar');
      const maliciousCdnSubstrings = [
        "javascript:alert('res.cloudinary.com')",
        "javascript:alert('images.unsplash.com')?auto=format&fit=crop",
        "data:text/html,<script>alert('res.cloudinary.com')</script>",
      ];
      for (const bad of maliciousCdnSubstrings) {
        expect(isValidMediaUrl(bad)).toBe(false);
        expect(inspectMediaInput(bad, 'ar').isValid).toBe(false);
        expect(normalizeImageUrl(bad, { language: 'ar' })).toBe(expectedArPlaceholder);
      }

      const thirdPartyWithCloudinaryQuery =
        'https://evil.example/?x=res.cloudinary.com/image/upload/foo.jpg';
      expect(normalizeImageUrl(thirdPartyWithCloudinaryQuery, { language: 'ar' })).toBe(
        thirdPartyWithCloudinaryQuery
      );
      expect(normalizeImageUrl(thirdPartyWithCloudinaryQuery, { language: 'ar' })).not.toContain(
        'f_auto,q_auto'
      );

      // inspectMediaInput subdomain spoofing must NOT classify as cloudinary or unsplash
      const spoofedCloudinary = 'https://res.cloudinary.com.evil.com/image/upload/x.jpg';
      const spoofedUnsplash = 'https://images.unsplash.com.evil.com/photo-123';
      expect(inspectMediaInput(spoofedCloudinary, 'ar').mediaType).toBe('direct');
      expect(normalizeImageUrl(spoofedCloudinary)).toBe(spoofedCloudinary);
      expect(inspectMediaInput(spoofedUnsplash, 'ar').mediaType).toBe('direct');
      expect(normalizeImageUrl(spoofedUnsplash)).toBe(spoofedUnsplash);

      // 4. Positive checks: real Cloudinary, Unsplash, local, and safe SVG URLs
      const realCloudinary = 'https://res.cloudinary.com/viptadj/image/upload/v123/suit.jpg';
      const realUnsplash = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
      const safeLocal = '/images/suit.jpg';
      const safeSvgAr = getLuxuryPlaceholderSvg('clothing', 'ar');

      expect(inspectMediaInput(realCloudinary, 'ar').mediaType).toBe('cloudinary');
      expect(normalizeImageUrl(realCloudinary)).toBe(
        'https://res.cloudinary.com/viptadj/image/upload/f_auto,q_auto,w_1200,c_limit/v123/suit.jpg'
      );

      expect(inspectMediaInput(realUnsplash, 'ar').mediaType).toBe('unsplash');
      expect(normalizeImageUrl(realUnsplash)).toContain('https://images.unsplash.com/');
      expect(normalizeImageUrl(realUnsplash)).toContain('auto=format');

      expect(inspectMediaInput(safeLocal, 'ar').mediaType).toBe('direct');
      expect(normalizeImageUrl(safeLocal)).toBe(safeLocal);

      expect(inspectMediaInput(safeSvgAr, 'ar').isValid).toBe(true);
      expect(normalizeImageUrl(safeSvgAr, { fallbackCategory: 'clothing', language: 'ar' })).toBe(
        safeSvgAr
      );
    } finally {
      for (const diskPath of createdDiskPaths) {
        try {
          await fs.unlink(diskPath);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  });
});
