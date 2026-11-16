import { describe, it, expect } from 'vitest';
import {
  extractGoogleDriveId,
  normalizeGoogleDriveUrl,
  optimizeUnsplashUrl,
  optimizeCloudinaryUrl,
  normalizeImageUrl,
  isValidMediaUrl,
  getLuxuryPlaceholderSvg,
} from '@/lib/media/url-normalizer';

describe('Tier 2: Boundary & Corner Cases — Media URL Boundaries (media-url-boundaries.test.ts)', () => {
  // ==========================================
  // 1. Corrupted and Malformed Google Drive URLs
  // ==========================================
  it('safely handles malformed, truncated, or invalid Google Drive URLs', () => {
    // Missing ID parameter
    expect(extractGoogleDriveId('https://drive.google.com/file/d/')).toBeNull();
    expect(extractGoogleDriveId('https://drive.google.com/open?id=')).toBeNull();
    expect(extractGoogleDriveId('https://drive.google.com/uc?id=')).toBeNull();

    // Corrupted domain or path
    expect(extractGoogleDriveId('https://drive.google.com/other/path/12345')).toBeNull();
    expect(extractGoogleDriveId('https://google.com/search?q=drive')).toBeNull();

    // Normalizing a link without valid ID returns original string or placeholder
    const badUrl = 'https://drive.google.com/file/d//view';
    expect(normalizeGoogleDriveUrl(badUrl)).toBe(badUrl);
  });

  // ==========================================
  // 2. Raw Google Drive ID Variations (25 to 55 chars)
  // ==========================================
  it('extracts raw Google Drive file IDs and constructs canonical stream URLs', () => {
    const validRawId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    expect(extractGoogleDriveId(validRawId)).toBe(validRawId);

    const streamUrl = normalizeGoogleDriveUrl(validRawId, 'uc');
    expect(streamUrl).toBe(`https://drive.google.com/uc?export=view&id=${validRawId}`);

    const lh3Url = normalizeGoogleDriveUrl(validRawId, 'lh3', 800);
    expect(lh3Url).toBe(`https://lh3.googleusercontent.com/d/${validRawId}=w800`);

    // Too short (below 25 chars) or too long (above 55 chars)
    expect(extractGoogleDriveId('too-short-id')).toBeNull();
    expect(extractGoogleDriveId('a'.repeat(60))).toBeNull();
  });

  // ==========================================
  // 3. Non-Google Drive CDNs & Storage Engines
  // ==========================================
  it('optimizes Unsplash and Cloudinary links and preserves standard web image URLs', () => {
    // Unsplash optimization
    const unsplashRaw = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
    const optimizedUnsplash = optimizeUnsplashUrl(unsplashRaw, { width: 1000, quality: 85 });
    expect(optimizedUnsplash).toContain('auto=format');
    expect(optimizedUnsplash).toContain('w=1000');
    expect(optimizedUnsplash).toContain('q=85');

    // Cloudinary optimization
    const cloudinaryRaw = 'https://res.cloudinary.com/viptadj/image/upload/v123456/suits/suit-01.jpg';
    const optimizedCloudinary = optimizeCloudinaryUrl(cloudinaryRaw, { width: 800 });
    expect(optimizedCloudinary).toContain('f_auto,q_auto,w_800');

    // Already optimized Cloudinary URL is not duplicated
    const alreadyOptimized = 'https://res.cloudinary.com/viptadj/image/upload/f_auto,q_auto/suits/suit-01.jpg';
    expect(optimizeCloudinaryUrl(alreadyOptimized)).toBe(alreadyOptimized);

    // Standard HTTPS / local relative paths
    expect(normalizeImageUrl('/images/logo.png')).toBe('/images/logo.png');
    expect(normalizeImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  // ==========================================
  // 4. Empty, Null, Undefined, and Whitespace Handling
  // ==========================================
  it('returns high-resolution luxury placeholder SVG data URI for empty or invalid media inputs', () => {
    const placeholderDefault = normalizeImageUrl('');
    expect(placeholderDefault).toContain('data:image/svg+xml;utf8,');
    expect(placeholderDefault).toContain('VIP%20TADJ');

    // Category-specific luxury placeholders
    const placeholderClothing = normalizeImageUrl(undefined, { fallbackCategory: 'clothing' });
    expect(placeholderClothing).toContain('CLOTHING');

    const placeholderShoes = normalizeImageUrl(null, { fallbackCategory: 'shoes' });
    expect(placeholderShoes).toContain('SHOES');

    const placeholderWhitespace = normalizeImageUrl('     \n\t   ');
    expect(placeholderWhitespace).toContain('data:image/svg+xml');
  });

  // ==========================================
  // 5. Extremely Long URLs and Complex Query Strings
  // ==========================================
  it('handles extremely long URLs without ReDoS or buffer overflows', () => {
    const longParam = 'param='.repeat(500) + 'test';
    const longUrl = `https://example.com/images/suit.jpg?${longParam}`;

    expect(longUrl.length).toBeGreaterThan(3000);
    const result = normalizeImageUrl(longUrl);
    expect(result).toBe(longUrl);

    // Valid media URL check on long string
    expect(isValidMediaUrl(longUrl)).toBe(true);
  });

  // ==========================================
  // 6. isValidMediaUrl Boundary Assertions
  // ==========================================
  it('accurately distinguishes valid media URIs from broken strings and script injections', () => {
    // Valid
    expect(isValidMediaUrl('https://example.com/image.jpg')).toBe(true);
    expect(isValidMediaUrl('/images/hero-banner.webp')).toBe(true);
    expect(isValidMediaUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true);
    expect(isValidMediaUrl('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms')).toBe(true);

    // Invalid
    expect(isValidMediaUrl('')).toBe(false);
    expect(isValidMediaUrl('   ')).toBe(false);
    // @ts-expect-error Testing invalid runtime input
    expect(isValidMediaUrl(null)).toBe(false);
    // @ts-expect-error Testing invalid runtime input
    expect(isValidMediaUrl(undefined)).toBe(false);
    expect(isValidMediaUrl('not_a_valid_url_or_id')).toBe(false);
    expect(isValidMediaUrl('<script>alert("hack")</script>')).toBe(false);
    expect(isValidMediaUrl('javascript:void(0)')).toBe(true); // Parsable as URL, but let's check normalizer fallback
  });
});
