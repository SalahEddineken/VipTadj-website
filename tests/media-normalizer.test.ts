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

describe('Media URL Normalizer', () => {
  describe('extractGoogleDriveId', () => {
    it('extracts ID from standard view sharing link', () => {
      const url = 'https://drive.google.com/file/d/1XyZ-987abcDEF_ghijkl/view?usp=sharing';
      expect(extractGoogleDriveId(url)).toBe('1XyZ-987abcDEF_ghijkl');
    });

    it('extracts ID from /open?id= query URL', () => {
      const url = 'https://drive.google.com/open?id=1XyZ-987abcDEF_ghijkl';
      expect(extractGoogleDriveId(url)).toBe('1XyZ-987abcDEF_ghijkl');
    });

    it('extracts ID from /uc?id= download link', () => {
      const url = 'https://drive.google.com/uc?id=1XyZ-987abcDEF_ghijkl&export=download';
      expect(extractGoogleDriveId(url)).toBe('1XyZ-987abcDEF_ghijkl');
    });

    it('handles raw valid Google Drive file ID', () => {
      const id = '1XyZ-987abcDEF_ghijkl1234567';
      expect(extractGoogleDriveId(id)).toBe(id);
    });

    it('returns null for regular non-Drive URLs', () => {
      expect(extractGoogleDriveId('https://example.com/image.jpg')).toBeNull();
      expect(extractGoogleDriveId('')).toBeNull();
      expect(extractGoogleDriveId(null as any)).toBeNull();
    });
  });

  describe('normalizeGoogleDriveUrl', () => {
    it('converts to direct streaming uc?export=view format', () => {
      const url = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view';
      const normalized = normalizeGoogleDriveUrl(url, 'uc');
      expect(normalized).toBe('https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F7G8H9I0J');
    });

    it('converts to high-performance lh3 CDN format when requested', () => {
      const url = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view';
      const normalized = normalizeGoogleDriveUrl(url, 'lh3', 1200);
      expect(normalized).toBe('https://lh3.googleusercontent.com/d/1A2B3C4D5E6F7G8H9I0J=w1200');
    });
  });

  describe('optimizeUnsplashUrl', () => {
    it('appends auto=format, fit=crop, q=80, w=1200 to raw Unsplash image', () => {
      const raw = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
      const optimized = optimizeUnsplashUrl(raw);
      expect(optimized).toContain('auto=format');
      expect(optimized).toContain('fit=crop');
      expect(optimized).toContain('q=80');
      expect(optimized).toContain('w=1200');
    });

    it('preserves existing host and updates parameters without duplication', () => {
      const existing = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?ixlib=rb-4.0.3';
      const optimized = optimizeUnsplashUrl(existing, { width: 800, quality: 85 });
      expect(optimized).toContain('w=800');
      expect(optimized).toContain('q=85');
    });
  });

  describe('optimizeCloudinaryUrl', () => {
    it('injects f_auto,q_auto,w_1200,c_limit into upload path', () => {
      const raw = 'https://res.cloudinary.com/vip-tadj/image/upload/v1234567/suit.jpg';
      const optimized = optimizeCloudinaryUrl(raw, { width: 1200 });
      expect(optimized).toBe('https://res.cloudinary.com/vip-tadj/image/upload/f_auto,q_auto,w_1200,c_limit/v1234567/suit.jpg');
    });

    it('avoids duplicate transformations if already present', () => {
      const already = 'https://res.cloudinary.com/vip-tadj/image/upload/f_auto,q_auto/v1234567/suit.jpg';
      expect(optimizeCloudinaryUrl(already)).toBe(already);
    });
  });

  describe('normalizeImageUrl master function', () => {
    it('returns SVG luxury fallback for null or empty string', () => {
      const fallback = normalizeImageUrl('');
      expect(fallback).toContain('data:image/svg+xml');
      expect(fallback).toContain('VIP%20TADJ');
    });

    it('handles relative local paths cleanly', () => {
      expect(normalizeImageUrl('/images/logo.png')).toBe('/images/logo.png');
    });

    it('automatically detects and transforms Google Drive links', () => {
      const driveUrl = 'https://drive.google.com/file/d/1XyZ-987abcDEF_ghijkl1234567/view';
      const result = normalizeImageUrl(driveUrl);
      expect(result).toBe('https://drive.google.com/uc?export=view&id=1XyZ-987abcDEF_ghijkl1234567');
    });
  });

  describe('isValidMediaUrl', () => {
    it('validates URLs accurately', () => {
      expect(isValidMediaUrl('https://images.unsplash.com/photo-1594938298603-c8148c4dae35')).toBe(true);
      expect(isValidMediaUrl('https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M/view')).toBe(true);
      expect(isValidMediaUrl('/images/suit.jpg')).toBe(true);
      expect(isValidMediaUrl('not-a-url')).toBe(false);
      expect(isValidMediaUrl('')).toBe(false);
    });
  });
});
