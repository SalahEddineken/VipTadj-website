import { describe, it, expect } from 'vitest';
import {
  normalizeImageUrl,
  extractGoogleDriveId,
  normalizeGoogleDriveUrl,
  optimizeUnsplashUrl,
  optimizeCloudinaryUrl,
  isValidMediaUrl,
  getLuxuryPlaceholderSvg,
} from '@/lib/media/url-normalizer';

describe('Tier 1: Foundation — Free Media Storage Engine (F-FOUND-04)', () => {
  // ==========================================
  // Test 1: Google Drive Share URL Normalization
  // ==========================================
  it('converts standard Google Drive share links into direct streaming embed endpoints', () => {
    const rawUrl = 'https://drive.google.com/file/d/1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q/view?usp=sharing';
    const normalized = normalizeImageUrl(rawUrl);

    expect(normalized).toBe('https://drive.google.com/uc?export=view&id=1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q');
  });

  // ==========================================
  // Test 2: Google Drive File ID Extraction
  // ==========================================
  it('extracts Google Drive ID accurately from various share formats and raw IDs', () => {
    const testCases = [
      { input: 'https://drive.google.com/file/d/abc-123_XYZ456/view', expected: 'abc-123_XYZ456' },
      { input: 'https://drive.google.com/open?id=abc-123_XYZ456', expected: 'abc-123_XYZ456' },
      { input: 'https://drive.google.com/uc?id=abc-123_XYZ456&export=download', expected: 'abc-123_XYZ456' },
      { input: '1XyZ-987abcDEF_ghijkl1234567', expected: '1XyZ-987abcDEF_ghijkl1234567' }, // valid raw id >= 25 chars
    ];

    testCases.forEach(({ input, expected }) => {
      expect(extractGoogleDriveId(input)).toBe(expected);
    });

    expect(extractGoogleDriveId('https://example.com/not-drive.png')).toBeNull();
  });

  // ==========================================
  // Test 3: Unsplash Query Optimization
  // ==========================================
  it('optimizes Unsplash CDN image URLs with responsive formatting and dimensions', () => {
    const rawUnsplash = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
    const optimized = optimizeUnsplashUrl(rawUnsplash, { width: 1000, quality: 85 });

    expect(optimized).toContain('auto=format');
    expect(optimized).toContain('fit=crop');
    expect(optimized).toContain('w=1000');
    expect(optimized).toContain('q=85');
  });

  // ==========================================
  // Test 4: Cloudinary Direct Upload Transformation Injection
  // ==========================================
  it('injects luxury optimization transforms into Cloudinary URLs without duplication', () => {
    const rawCloudinary = 'https://res.cloudinary.com/vip-tadj/image/upload/v1670000000/blazer.jpg';
    const optimized = optimizeCloudinaryUrl(rawCloudinary, { width: 1200 });

    expect(optimized).toBe(
      'https://res.cloudinary.com/vip-tadj/image/upload/f_auto,q_auto,w_1200,c_limit/v1670000000/blazer.jpg'
    );

    // If transforms are already present, does not double-inject
    const alreadyOptimized = 'https://res.cloudinary.com/vip-tadj/image/upload/f_auto,q_auto/v1670000000/blazer.jpg';
    expect(optimizeCloudinaryUrl(alreadyOptimized)).toBe(alreadyOptimized);
  });

  // ==========================================
  // Test 5: Fallback Luxury Placeholder Handling
  // ==========================================
  it('returns branded VIP TADJ SVG placeholder for null, empty, or undefined URLs', () => {
    const emptyResult = normalizeImageUrl('');
    const nullResult = normalizeImageUrl(null as any);
    const undefinedResult = normalizeImageUrl(undefined as any);

    [emptyResult, nullResult, undefinedResult].forEach((res) => {
      expect(res).toContain('data:image/svg+xml');
      expect(res).toContain('VIP%20TADJ');
    });

    const svgString = getLuxuryPlaceholderSvg('Maison VIP TADJ');
    expect(svgString).toContain('data:image/svg+xml');
    expect(svgString).toContain('%3Csvg');
    expect(svgString).toContain('VIP%20TADJ');
  });

  // ==========================================
  // Test 6: Media URL Validation
  // ==========================================
  it('identifies valid vs invalid media URLs', () => {
    expect(isValidMediaUrl('https://images.unsplash.com/photo-1594938298603-c8148c4dae35')).toBe(true);
    expect(isValidMediaUrl('https://res.cloudinary.com/vip/image/upload/suit.jpg')).toBe(true);
    expect(isValidMediaUrl('https://drive.google.com/file/d/123/view')).toBe(true);
    expect(isValidMediaUrl('/local/image.jpg')).toBe(true);
    expect(isValidMediaUrl('not-a-valid-url')).toBe(false);
    expect(isValidMediaUrl('')).toBe(false);
  });
});
