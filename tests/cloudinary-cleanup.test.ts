import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractCloudinaryAsset,
  deleteProductMediaAssets,
  deleteCloudinaryAssets,
} from '@/lib/media/cloudinary-server';
import { Product } from '@/types';

describe('Cloudinary Asset Extraction & Cleanup System', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'dacr63k7l';
    process.env.CLOUDINARY_API_KEY = 'mock_key_123';
    process.env.CLOUDINARY_API_SECRET = 'mock_secret_456';
  });

  describe('extractCloudinaryAsset', () => {
    it('correctly extracts publicId and resourceType from standard Cloudinary URL', () => {
      const url =
        'https://res.cloudinary.com/dacr63k7l/image/upload/v1715694820/vip-tadj/products/costume-laine.jpg';
      const extracted = extractCloudinaryAsset(url);
      expect(extracted).toEqual({
        publicId: 'vip-tadj/products/costume-laine',
        resourceType: 'image',
      });
    });

    it('correctly extracts asset with transformation parameters and nested folder structure', () => {
      const url =
        'https://res.cloudinary.com/dacr63k7l/image/upload/c_scale,w_1200,f_auto,q_auto/v1715694820/vip-tadj/products/shoes/oxford-patine.png';
      const extracted = extractCloudinaryAsset(url);
      expect(extracted).toEqual({
        publicId: 'vip-tadj/products/shoes/oxford-patine',
        resourceType: 'image',
      });
    });

    it('correctly extracts asset without version tag', () => {
      const url =
        'https://res.cloudinary.com/dacr63k7l/image/upload/vip-tadj/products/ceinture-cuir.webp';
      const extracted = extractCloudinaryAsset(url);
      expect(extracted).toEqual({
        publicId: 'vip-tadj/products/ceinture-cuir',
        resourceType: 'image',
      });
    });

    it('identifies video resource type from Cloudinary video upload URL', () => {
      const url =
        'https://res.cloudinary.com/dacr63k7l/video/upload/q_auto:eco/v12345/vip-tadj/videos/suit-showcase.mp4';
      const extracted = extractCloudinaryAsset(url);
      expect(extracted).toEqual({
        publicId: 'vip-tadj/videos/suit-showcase',
        resourceType: 'video',
      });
    });

    it('treats pure publicId string as an asset identifier directly', () => {
      const extracted = extractCloudinaryAsset('vip-tadj/products/cravate-soie');
      expect(extracted).toEqual({
        publicId: 'vip-tadj/products/cravate-soie',
        resourceType: 'image',
      });
    });

    it('returns null for external non-Cloudinary URLs like Unsplash', () => {
      const url = 'https://images.unsplash.com/photo-1591047139829?auto=format';
      expect(extractCloudinaryAsset(url)).toBeNull();
    });

    it('returns null for local server upload paths', () => {
      expect(extractCloudinaryAsset('/uploads/products/local-item.jpg')).toBeNull();
      expect(extractCloudinaryAsset('uploads/item.png')).toBeNull();
    });
  });

  describe('deleteProductMediaAssets', () => {
    it('isolates exclusive assets for deletion while protecting shared assets used by other products', async () => {
      // Mock fetch for Cloudinary API
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          deleted: {
            'vip-tadj/products/exclusive-1': 'deleted',
            'vip-tadj/products/exclusive-2': 'deleted',
          },
        }),
      });
      global.fetch = fetchMock;

      const targetProduct: Product = {
        id: 'prod-target',
        title: 'Costume Laine Exclusif',
        slug: 'costume-laine-exclusif',
        description: 'Description de luxe pour homme VIP.',
        price: 55000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'costumes',
        primaryImage:
          'https://res.cloudinary.com/dacr63k7l/image/upload/v1/vip-tadj/products/exclusive-1.jpg',
        images: [
          {
            id: 'img-1',
            url: 'https://res.cloudinary.com/dacr63k7l/image/upload/v1/vip-tadj/products/exclusive-1.jpg',
            publicId: 'vip-tadj/products/exclusive-1',
            alt: 'Vue de face',
            isPrimary: true,
          },
          {
            id: 'img-2',
            url: 'https://res.cloudinary.com/dacr63k7l/image/upload/v1/vip-tadj/products/exclusive-2.jpg',
            publicId: 'vip-tadj/products/exclusive-2',
            alt: 'Vue dos',
            isPrimary: false,
          },
          {
            id: 'img-shared',
            url: 'https://res.cloudinary.com/dacr63k7l/image/upload/v1/vip-tadj/products/shared-asset.jpg',
            publicId: 'vip-tadj/products/shared-asset',
            alt: 'Matière partagée',
            isPrimary: false,
          },
        ],
        sizes: ['48', '50'],
        stockQuantity: 10,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const otherProduct: Product = {
        id: 'prod-other',
        title: 'Blazer Assorti',
        slug: 'blazer-assorti',
        description: 'Autre vêtement utilisant la même photo de tissu.',
        price: 32000,
        categoryId: 'clothing',
        categorySlug: 'vetements',
        subcategory: 'blazers',
        primaryImage:
          'https://res.cloudinary.com/dacr63k7l/image/upload/v1/vip-tadj/products/shared-asset.jpg',
        images: [
          {
            id: 'img-other-1',
            url: 'https://res.cloudinary.com/dacr63k7l/image/upload/v1/vip-tadj/products/shared-asset.jpg',
            publicId: 'vip-tadj/products/shared-asset',
            alt: 'Tissu partagé',
            isPrimary: true,
          },
        ],
        sizes: ['50'],
        stockQuantity: 5,
        inStock: true,
        isFeatured: false,
        isNewArrival: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await deleteProductMediaAssets(targetProduct, {
        allProducts: [targetProduct, otherProduct],
      });

      // The shared asset must NOT be deleted
      expect(result.skippedShared).toContain('vip-tadj/products/shared-asset');

      // The exclusive assets must be deleted
      expect(result.cloudinaryDeleted).toContain('vip-tadj/products/exclusive-1');
      expect(result.cloudinaryDeleted).toContain('vip-tadj/products/exclusive-2');
    });
  });
});
