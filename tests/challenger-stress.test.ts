import { describe, it, expect } from 'vitest';
import {
  extractGoogleDriveId,
  normalizeGoogleDriveUrl,
  optimizeUnsplashUrl,
  optimizeCloudinaryUrl,
  getLuxuryPlaceholderSvg,
  normalizeImageUrl,
  isValidMediaUrl,
} from '@/lib/media/url-normalizer';
import { formatDZD, parseDZD } from '@/lib/utils/formatDZD';
import {
  SEED_PRODUCTS,
  SEED_CATEGORIES,
  ALGERIAN_WILAYAS,
  SEED_WILAYAS_DELIVERY,
  SEED_WILAYA_SHIPPING_FEES,
  DEFAULT_STORE_SETTINGS,
} from '@/lib/seed/seed-data';

describe('CHALLENGER 2 — ADVERSARIAL STRESS & EMPIRICAL VERIFICATION', () => {
  // =========================================================================
  // SECTION 1: URL NORMALIZER & MEDIA ENGINE
  // =========================================================================
  describe('Media URL Normalizer Robustness', () => {
    it('correctly blocks dangerous XSS and script protocols and returns SVG placeholder', () => {
      const maliciousPayloads = [
        'javascript:alert(1)',
        'javascript:void(0)',
        'JAVASCRIPT:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'data:text/javascript,alert(1)',
        'vbscript:msgbox("XSS")',
      ];

      for (const payload of maliciousPayloads) {
        const result = normalizeImageUrl(payload);
        expect(typeof result).toBe('string');
        expect(result.startsWith('data:image/svg+xml')).toBe(true);
      }
    });

    it('correctly extracts Google Drive IDs and normalizes standard share links', () => {
      const standardLinks = [
        {
          input: 'https://drive.google.com/file/d/1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7/view?usp=sharing',
          id: '1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7',
        },
        {
          input: 'https://drive.google.com/open?id=1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7',
          id: '1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7',
        },
        {
          input: 'https://drive.google.com/uc?id=1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7&export=download',
          id: '1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7',
        },
        {
          input: '1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7',
          id: '1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7',
        },
      ];

      for (const { input, id } of standardLinks) {
        expect(extractGoogleDriveId(input)).toBe(id);
        expect(normalizeImageUrl(input)).toBe(`https://drive.google.com/uc?export=view&id=${id}`);
      }
    });

    it('correctly applies Unsplash CDN query optimizations', () => {
      const unsplashUrl = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
      const optimized = optimizeUnsplashUrl(unsplashUrl, { width: 800, quality: 85, fit: 'cover' });
      expect(optimized).toContain('auto=format');
      expect(optimized).toContain('w=800');
      expect(optimized).toContain('q=85');
      expect(optimized).toContain('fit=cover');
    });

    it('correctly applies Cloudinary transform parameters', () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/viptadj/image/upload/v12345/suits/costume.jpg';
      const optimized = optimizeCloudinaryUrl(cloudinaryUrl, { width: 1000 });
      expect(optimized).toContain('/image/upload/f_auto,q_auto,w_1000,c_limit/');
    });

    it('handles non-string types safely when passed to normalizeImageUrl', () => {
      const nonStrings = [undefined, 12345 as any, {} as any, [] as any, true as any];
      for (const val of nonStrings) {
        const res = normalizeImageUrl(val);
        expect(res.startsWith('data:image/svg+xml')).toBe(true);
      }
    });

    // -----------------------------------------------------------------------
    // REMEDIATED AND VERIFIED DEFECTS IN url-normalizer.ts
    // -----------------------------------------------------------------------
    it('[FIX-URL-01] handles null or empty fallbackCategory gracefully without throwing TypeError', () => {
      let result: string | null = null;
      expect(() => {
        result = normalizeImageUrl('', { fallbackCategory: null as any });
      }).not.toThrow();

      expect(result).not.toBeNull();
      expect(result!.startsWith('data:image/svg+xml')).toBe(true);
      const decoded = decodeURIComponent(result!.replace('data:image/svg+xml;utf8,', ''));
      expect(decoded).toContain('[ GENERAL ]');
    });

    it('[FIX-URL-02] safely escapes XML entities in SVG data URI to produce valid, injection-safe markup', () => {
      const svgUri = getLuxuryPlaceholderSvg('Suits & Ties');
      const decodedSvg = decodeURIComponent(svgUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedSvg).toContain('[ SUITS &amp; TIES ]');
      expect(decodedSvg).not.toContain('[ SUITS & TIES ]');

      const xssSvgUri = getLuxuryPlaceholderSvg('</text><script>alert(1)</script><text>');
      const decodedXss = decodeURIComponent(xssSvgUri.replace('data:image/svg+xml;utf8,', ''));
      expect(decodedXss).toContain('&lt;/TEXT&gt;&lt;SCRIPT&gt;ALERT(1)&lt;/SCRIPT&gt;&lt;TEXT&gt;');
      expect(decodedXss).not.toContain('<script>');
    });

    it('[FIX-URL-03] blocks protocol-relative URLs (//evil.com) and falls back to luxury placeholder', () => {
      const protocolRelative = '//evil.com/phish.png';
      const result = normalizeImageUrl(protocolRelative);
      expect(result.startsWith('data:image/svg+xml')).toBe(true);
      expect(result).not.toBe('//evil.com/phish.png');
    });

    it('[FIX-URL-04] falls back to luxury SVG placeholder when given broken Google Drive folder links', () => {
      const folderUrl = 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p';
      const result = normalizeImageUrl(folderUrl);
      expect(result.startsWith('data:image/svg+xml')).toBe(true);
      expect(result).not.toBe(folderUrl);
    });
  });

  // =========================================================================
  // SECTION 2: FORMATDZD & PARSEDZD
  // =========================================================================
  describe('formatDZD and parseDZD Edge Case Resilience', () => {
    it('correctly formats standard and boundary numbers', () => {
      expect(formatDZD(18500)).toBe('18\u00A0500\u00A0DA');
      expect(formatDZD(0)).toBe('0\u00A0DA');
      expect(formatDZD(-0)).toBe('0\u00A0DA');
      expect(formatDZD(null)).toBe('0\u00A0DA');
      expect(formatDZD(undefined)).toBe('0\u00A0DA');
      expect(formatDZD(NaN)).toBe('0\u00A0DA');
      expect(formatDZD(-999999999)).toBe('-999\u00A0999\u00A0999\u00A0DA');
      expect(formatDZD(999999999)).toBe('999\u00A0999\u00A0999\u00A0DA');
      expect(formatDZD(18500.75)).toBe('18\u00A0501\u00A0DA');
      expect(formatDZD(18500.25)).toBe('18\u00A0500\u00A0DA');
      // Symmetric rounding: round half away from zero
      expect(formatDZD(-18500.5)).toBe('-18\u00A0501\u00A0DA');
      expect(formatDZD(-18500.51)).toBe('-18\u00A0501\u00A0DA');
    });

    it('handles formatDZD options properly', () => {
      expect(formatDZD(18500, { showCurrency: false })).toBe('18\u00A0500');
      expect(formatDZD(18500, { useNonBreakingSpace: false })).toBe('18 500 DA');
      expect(formatDZD(18500, { currencyCode: 'DZD' })).toBe('18\u00A0500\u00A0DZD');
    });

    it('correctly parses formatted strings in parseDZD', () => {
      expect(parseDZD('18 500 DA')).toBe(18500);
      expect(parseDZD('18\u00A0500 DA')).toBe(18500);
      expect(parseDZD('-18 500 DA')).toBe(-18500);
      expect(parseDZD('0 DA')).toBe(0);
      expect(parseDZD('')).toBe(0);
      expect(parseDZD('text')).toBe(0);
    });

    // -----------------------------------------------------------------------
    // HARDENED FORMATDZD AND PARSEDZD INTEGRITY
    // -----------------------------------------------------------------------
    it('[HARDENED] parseDZD safely handles numeric and non-string inputs without throwing', () => {
      expect(parseDZD(18500 as any)).toBe(18500);
      expect(parseDZD(-18500 as any)).toBe(-18500);
      expect(parseDZD(null as any)).toBe(0);
      expect(parseDZD(undefined as any)).toBe(0);
    });

    it('[HARDENED] formatDZD returns safe "0 DA" fallback on non-finite values', () => {
      const posInf = formatDZD(Infinity);
      const negInf = formatDZD(-Infinity);

      expect(posInf).toBe('0\u00A0DA');
      expect(negInf).toBe('0\u00A0DA');
    });
  });

  // =========================================================================
  // SECTION 3: 18-ITEM SEED CATALOG & 58 WILAYAS INTEGRITY
  // =========================================================================
  describe('Seed Catalog & 58 Wilayas Operational Dataset Verification', () => {
    it('contains products across exactly 3 categories', () => {
      expect(SEED_PRODUCTS.length).toBeGreaterThanOrEqual(18);
      expect(SEED_CATEGORIES.length).toBe(3);

      const categoryIds = SEED_CATEGORIES.map((c) => c.id).sort();
      expect(categoryIds).toEqual(['accessories', 'clothing', 'shoes']);

      const categorySlugs = SEED_CATEGORIES.map((c) => c.slug).sort();
      expect(categorySlugs).toEqual(['accessoires', 'chaussures', 'vetements']);
    });

    it('verifies strict uniqueness of product IDs, slugs, and SKUs', () => {
      const ids = SEED_PRODUCTS.map((p) => p.id);
      expect(new Set(ids).size).toBe(SEED_PRODUCTS.length);

      const slugs = SEED_PRODUCTS.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(SEED_PRODUCTS.length);

      const skus = SEED_PRODUCTS.map((p) => p.sku).filter(Boolean);
      expect(new Set(skus).size).toBe(SEED_PRODUCTS.length);
    });

    it('verifies all product prices are strictly positive integers with valid compareAtPrice', () => {
      for (const p of SEED_PRODUCTS) {
        expect(p.price).toBeGreaterThan(0);
        expect(Number.isInteger(p.price)).toBe(true);

        if (p.compareAtPrice !== undefined) {
          expect(p.compareAtPrice).toBeGreaterThan(p.price);
          expect(Number.isInteger(p.compareAtPrice)).toBe(true);
        }
      }
    });

    it('verifies each product has valid images with exactly one primary image', () => {
      for (const p of SEED_PRODUCTS) {
        expect(p.images.length).toBeGreaterThanOrEqual(1);

        const primaryImgs = p.images.filter((img) => img.isPrimary);
        expect(primaryImgs.length).toBe(1);

        const imgIds = p.images.map((img) => img.id);
        expect(new Set(imgIds).size).toBe(p.images.length);

        for (const img of p.images) {
          expect(img.url.startsWith('https://') || img.url.startsWith('http://')).toBe(true);
          expect(img.alt.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('verifies sizing matrices and inventory stock consistency', () => {
      for (const p of SEED_PRODUCTS) {
        expect(p.sizes.length).toBeGreaterThan(0);
        expect(p.stockQuantity).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(p.stockQuantity)).toBe(true);
        expect(p.inStock).toBe(p.stockQuantity > 0);

        if (p.categoryId === 'clothing') {
          expect(p.sizes.some((s) => ['S', 'M', 'L', '48', '50', '52'].includes(s))).toBe(true);
        } else if (p.categoryId === 'shoes') {
          expect(p.sizes.some((s) => ['39', '40', '41', '42'].includes(s))).toBe(true);
        }
      }
    });

    it('verifies all 68 Algerian Wilayas are accounted for strictly without duplicates or gaps', () => {
      expect(ALGERIAN_WILAYAS.length).toBe(68);

      const codes = ALGERIAN_WILAYAS.map((w) => w.code).sort((a, b) => a - b);
      for (let i = 0; i < 68; i++) {
        expect(codes[i]).toBe(i + 1);
      }

      // Verify delivery config and shipping fees have all 68 keys
      expect(SEED_WILAYAS_DELIVERY.length).toBe(68);
      expect(Object.keys(SEED_WILAYA_SHIPPING_FEES).length).toBe(68);
      for (let c = 1; c <= 68; c++) {
        const fee = SEED_WILAYA_SHIPPING_FEES[c];
        expect(fee).toBeDefined();
        expect(fee.homeFee).toBeGreaterThan(0);
        expect(fee.deskFee).toBeGreaterThan(0);
        expect(fee.active).toBe(true);
      }
    });

    it('verifies DEFAULT_STORE_SETTINGS integrity', () => {
      expect(DEFAULT_STORE_SETTINGS.storeName).toBe('VIP TADJ');
      expect(DEFAULT_STORE_SETTINGS.phone).toBeDefined();
      expect(DEFAULT_STORE_SETTINGS.email).toContain('@');
      expect(DEFAULT_STORE_SETTINGS.freeShippingThreshold).toBe(50000);
      expect(DEFAULT_STORE_SETTINGS.wilayasDelivery.length).toBe(68);
    });
  });
});
