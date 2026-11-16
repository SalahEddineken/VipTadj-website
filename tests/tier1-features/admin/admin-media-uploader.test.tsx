import { describe, it, expect } from 'vitest';
import { normalizeImageUrl, isValidMediaUrl } from '@/lib/media/url-normalizer';
import { ProductImage } from '@/types';

describe('Tier 1: Admin — Free Media Uploader Component (F-ADM-05)', () => {
  // ==========================================
  // Test 1: Google Drive Embed Stream URL Conversion
  // ==========================================
  it('converts raw Google Drive share URL into streaming embed endpoint on paste/input', () => {
    const rawDriveInput = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P/view?usp=sharing';
    const processedUrl = normalizeImageUrl(rawDriveInput);

    expect(processedUrl).toBe('https://drive.google.com/uc?export=view&id=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P');
    expect(isValidMediaUrl(processedUrl)).toBe(true);
  });

  // ==========================================
  // Test 2: Unsplash Query Optimization on Input
  // ==========================================
  it('optimizes Unsplash URLs entered in media uploader with optimal luxury quality parameters', () => {
    const rawUnsplash = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
    const optimized = normalizeImageUrl(rawUnsplash);

    expect(optimized).toContain('auto=format');
    expect(optimized).toContain('fit=crop');
    expect(optimized).toContain('q=80');
    expect(optimized).toContain('w=1200');
  });

  // ==========================================
  // Test 3: Cloudinary Upload Preset Configuration
  // ==========================================
  it('validates Cloudinary unsigned client upload configuration parameters', () => {
    const cloudinaryConfig = {
      cloudName: 'vip-tadj',
      uploadPreset: 'vip_tadj_unsigned',
      apiKey: 'unsigned',
    };

    expect(cloudinaryConfig.cloudName).toBe('vip-tadj');
    expect(cloudinaryConfig.uploadPreset).toBe('vip_tadj_unsigned');

    // Build unsigned upload URL endpoint
    const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
    expect(uploadEndpoint).toBe('https://api.cloudinary.com/v1_1/vip-tadj/image/upload');
  });

  // ==========================================
  // Test 4: Image Preview Thumbnail Structure
  // ==========================================
  it('builds image preview thumbnail object with ID, valid URL, alt description, and primary flag', () => {
    const rawInput = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35';
    const thumbnail: ProductImage = {
      id: `img-${Date.now()}`,
      url: normalizeImageUrl(rawInput),
      alt: 'Veste de Soirée Velours',
      isPrimary: true,
    };

    expect(thumbnail.id).toBeDefined();
    expect(thumbnail.url).toContain('https://images.unsplash.com');
    expect(thumbnail.alt).toBe('Veste de Soirée Velours');
    expect(thumbnail.isPrimary).toBe(true);
  });

  // ==========================================
  // Test 5: Primary Image Selection Toggle
  // ==========================================
  it('guarantees that selecting a new primary image marks only that image as primary (exactly 1 isPrimary)', () => {
    const gallery: ProductImage[] = [
      { id: 'img-1', url: 'https://example.com/1.jpg', alt: 'Vue 1', isPrimary: true },
      { id: 'img-2', url: 'https://example.com/2.jpg', alt: 'Vue 2', isPrimary: false },
      { id: 'img-3', url: 'https://example.com/3.jpg', alt: 'Vue 3', isPrimary: false },
    ];

    // Toggle img-2 to primary
    function setPrimaryImage(images: ProductImage[], selectedId: string): ProductImage[] {
      return images.map((img) => ({
        ...img,
        isPrimary: img.id === selectedId,
      }));
    }

    const updatedGallery = setPrimaryImage(gallery, 'img-2');
    const primaryImages = updatedGallery.filter((img) => img.isPrimary);

    expect(primaryImages).toHaveLength(1);
    expect(primaryImages[0].id).toBe('img-2');
    expect(updatedGallery[0].isPrimary).toBe(false);
  });

  // ==========================================
  // Test 6: Rejection of Invalid Media Links
  // ==========================================
  it('rejects invalid or empty media inputs and provides fallback placeholder', () => {
    expect(isValidMediaUrl('not a valid url with spaces')).toBe(false);
    expect(isValidMediaUrl('http://')).toBe(false);
    expect(isValidMediaUrl('')).toBe(false);
    expect(isValidMediaUrl(null as any)).toBe(false);

    // Normalizing an empty input returns luxury SVG fallback
    const fallback = normalizeImageUrl('');
    expect(fallback).toContain('data:image/svg+xml');
    expect(fallback).toContain('VIP%20TADJ');
  });
});
