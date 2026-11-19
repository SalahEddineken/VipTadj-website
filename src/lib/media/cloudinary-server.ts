import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/types';

export interface CloudinaryAssetItem {
  publicId: string;
  resourceType: 'image' | 'video';
}

export interface CloudinaryDeletionResult {
  success: boolean;
  deleted: string[];
  notFound: string[];
  failed: string[];
  error?: string;
}

export interface ProductMediaCleanupResult {
  success: boolean;
  cloudinaryDeleted: string[];
  cloudinaryNotFound: string[];
  localDeleted: string[];
  skippedShared: string[];
}

/**
 * Extracts a Cloudinary asset (publicId and resourceType) from a URL or publicId identifier.
 * Returns null if the string is not hosted on Cloudinary or is an external/local URL.
 */
export function extractCloudinaryAsset(
  urlOrPublicId: string | null | undefined,
  defaultResourceType: 'image' | 'video' = 'image'
): CloudinaryAssetItem | null {
  if (!urlOrPublicId || typeof urlOrPublicId !== 'string') return null;
  const trimmed = urlOrPublicId.trim();
  if (!trimmed) return null;

  // Direct publicId without http/https protocol
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    // If it's a local filesystem or relative URL, it's not a Cloudinary identifier
    if (trimmed.startsWith('/') || trimmed.startsWith('uploads/') || trimmed.startsWith('./')) {
      return null;
    }
    const cleanPublicId = trimmed.replace(/\.[a-zA-Z0-9]+$/, '');
    return { publicId: cleanPublicId, resourceType: defaultResourceType };
  }

  // Parse URL to check if it's hosted on Cloudinary
  try {
    const parsed = new URL(trimmed);
    if (!parsed.hostname.includes('cloudinary.com')) return null;

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 3) return null;

    const resourceType: 'image' | 'video' = parts.includes('video') ? 'video' : 'image';
    const uploadIndex = parts.findIndex((p) =>
      ['upload', 'private', 'authenticated'].includes(p.toLowerCase())
    );
    if (uploadIndex === -1) return null;

    const afterUpload = parts.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((seg) => /^v\d+$/.test(seg));

    let pathSegments: string[];
    if (versionIndex !== -1) {
      pathSegments = afterUpload.slice(versionIndex + 1);
    } else {
      // Filter out Cloudinary signature (s--...--) and transform segments (e.g. c_limit,w_1200)
      const knownTransformPrefixes = /^(c|w|h|q|f|b|e|r|g|x|y|z|u|l|fl|dpr|ar|co|bo|so|eo|du)_[a-zA-Z0-9_:]+$/i;
      let startIdx = 0;
      for (let i = 0; i < afterUpload.length - 1; i++) {
        const seg = afterUpload[i];
        if (/^s--.+--$/.test(seg)) {
          startIdx = i + 1;
          continue;
        }
        if (seg.includes(',') || knownTransformPrefixes.test(seg)) {
          startIdx = i + 1;
        } else {
          break;
        }
      }
      pathSegments = afterUpload.slice(startIdx);
    }

    if (!pathSegments || pathSegments.length === 0) return null;
    const fullPathWithExt = pathSegments.join('/');
    const publicId = fullPathWithExt.replace(/\.[a-zA-Z0-9]+$/, '');

    return { publicId, resourceType };
  } catch {
    return null;
  }
}

/**
 * Permanently deletes a list of assets from Cloudinary and invalidates CDN cache to free storage.
 * Uses the Cloudinary Admin API in batch mode with graceful fallback to the signed Destroy API.
 */
export async function deleteCloudinaryAssets(
  assets: Array<{ publicId: string; resourceType?: 'image' | 'video' }>
): Promise<CloudinaryDeletionResult> {
  const result: CloudinaryDeletionResult = {
    success: true,
    deleted: [],
    notFound: [],
    failed: [],
  };

  if (!assets || assets.length === 0) {
    return result;
  }

  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
      '[Cloudinary Deletion] Cloudinary server credentials missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET).'
    );
    return {
      ...result,
      success: false,
      error: 'Cloudinary credentials missing on server.',
    };
  }

  // Deduplicate items
  const uniqueItems = new Map<string, CloudinaryAssetItem>();
  for (const item of assets) {
    if (!item.publicId || !item.publicId.trim()) continue;
    const resourceType = item.resourceType || 'image';
    const key = `${resourceType}:${item.publicId.trim()}`;
    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, { publicId: item.publicId.trim(), resourceType });
    }
  }

  if (uniqueItems.size === 0) {
    return result;
  }

  // Group by resourceType ('image' vs 'video')
  const images = Array.from(uniqueItems.values()).filter((i) => i.resourceType === 'image');
  const videos = Array.from(uniqueItems.values()).filter((i) => i.resourceType === 'video');

  const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;

  const processBatch = async (
    items: CloudinaryAssetItem[],
    resourceType: 'image' | 'video'
  ) => {
    if (items.length === 0) return;

    // Batch chunk size for Cloudinary Admin API (max 100 per request)
    const chunkSize = 100;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const publicIds = chunk.map((c) => c.publicId);

      try {
        // 1. Try Cloudinary Admin API batch deletion
        const params = new URLSearchParams();
        params.append('invalidate', 'true');
        for (const pid of publicIds) {
          params.append('public_ids[]', pid);
        }

        const adminUrl = `https://api.cloudinary.com/v1_1/${cloudName}/resources/${resourceType}/upload?${params.toString()}`;
        const adminRes = await fetch(adminUrl, {
          method: 'DELETE',
          headers: {
            Authorization: authHeader,
          },
        });

        if (adminRes.ok) {
          const data = await adminRes.json();
          if (data && data.deleted) {
            for (const [pid, status] of Object.entries(data.deleted)) {
              if (status === 'deleted') {
                result.deleted.push(pid);
              } else if (status === 'not_found') {
                result.notFound.push(pid);
              } else {
                result.failed.push(pid);
              }
            }
            continue; // Successfully handled this chunk
          }
        }
      } catch (err) {
        console.warn(`[Cloudinary Admin API Batch Error for ${resourceType}]:`, err);
      }

      // 2. Fallback: Destroy API individual signed POST
      for (const item of chunk) {
        try {
          const timestamp = Math.floor(Date.now() / 1000);
          const toSign = `invalidate=true&public_id=${item.publicId}&timestamp=${timestamp}${apiSecret}`;
          const signature = crypto.createHash('sha1').update(toSign).digest('hex');

          const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
          const destroyRes = await fetch(destroyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              public_id: item.publicId,
              timestamp,
              api_key: apiKey,
              signature,
              invalidate: true,
            }),
          });

          if (destroyRes.ok) {
            const data = await destroyRes.json();
            if (data.result === 'ok') {
              result.deleted.push(item.publicId);
            } else if (data.result === 'not found') {
              result.notFound.push(item.publicId);
            } else {
              result.failed.push(item.publicId);
            }
          } else {
            result.failed.push(item.publicId);
          }
        } catch (destroyErr) {
          console.error(`[Cloudinary Destroy Fallback Error for ${item.publicId}]:`, destroyErr);
          result.failed.push(item.publicId);
        }
      }
    }
  };

  await Promise.all([processBatch(images, 'image'), processBatch(videos, 'video')]);

  return result;
}

/**
 * Safely removes a locally stored media file from public/uploads on disk.
 */
export async function deleteLocalUploadFile(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  let relativePath = '';
  if (trimmed.startsWith('/uploads/')) {
    relativePath = trimmed.replace(/^\//, '');
  } else if (trimmed.startsWith('uploads/')) {
    relativePath = trimmed;
  } else {
    return false;
  }

  try {
    const rootUploads = path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.resolve(process.cwd(), 'public', relativePath);

    // Prevent path traversal
    if (!fullPath.startsWith(rootUploads)) {
      console.warn(`[Local Media Cleanup] Directory traversal attempt blocked: ${trimmed}`);
      return false;
    }

    await fs.unlink(fullPath);
    return true;
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      console.warn(`[Local Media Cleanup Error for ${trimmed}]:`, err);
    }
    return false;
  }
}

/**
 * Automatically cleans up all Cloudinary assets and local uploads associated with a product.
 * Checks existing catalog products to avoid deleting any shared or re-used assets.
 */
export async function deleteProductMediaAssets(
  product: Product,
  options: { allProducts?: Product[] } = {}
): Promise<ProductMediaCleanupResult> {
  const result: ProductMediaCleanupResult = {
    success: true,
    cloudinaryDeleted: [],
    cloudinaryNotFound: [],
    localDeleted: [],
    skippedShared: [],
  };

  if (!product) return result;

  // 1. Gather all assets from the target product
  const targetCloudinaryAssets = new Map<string, CloudinaryAssetItem>();
  const targetLocalUrls = new Set<string>();

  const registerMedia = (urlOrId?: string, explicitPublicId?: string) => {
    if (explicitPublicId && explicitPublicId.trim()) {
      const isVid = typeof urlOrId === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(urlOrId);
      const key = `${isVid ? 'video' : 'image'}:${explicitPublicId.trim()}`;
      targetCloudinaryAssets.set(key, {
        publicId: explicitPublicId.trim(),
        resourceType: isVid ? 'video' : 'image',
      });
    }

    if (urlOrId && typeof urlOrId === 'string') {
      const trimmed = urlOrId.trim();
      const cld = extractCloudinaryAsset(trimmed);
      if (cld) {
        const key = `${cld.resourceType}:${cld.publicId}`;
        if (!targetCloudinaryAssets.has(key)) {
          targetCloudinaryAssets.set(key, cld);
        }
      } else if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
        targetLocalUrls.add(trimmed);
      }
    }
  };

  // Primary image
  registerMedia(product.primaryImage);

  // Gallery images
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      registerMedia(img.url, img.publicId);
    }
  }

  // Variant color photos
  if (Array.isArray(product.colors)) {
    for (const col of product.colors) {
      if (col.imageUrl) {
        registerMedia(col.imageUrl);
      }
    }
  }

  // 2. Identify media still in use by other products
  const otherProducts = (options.allProducts || []).filter((p) => p.id !== product.id);
  const inUseCloudinaryKeys = new Set<string>();
  const inUseLocalUrls = new Set<string>();

  for (const other of otherProducts) {
    const checkMedia = (urlOrId?: string, explicitPublicId?: string) => {
      if (explicitPublicId && explicitPublicId.trim()) {
        const isVid = typeof urlOrId === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(urlOrId);
        inUseCloudinaryKeys.add(`${isVid ? 'video' : 'image'}:${explicitPublicId.trim()}`);
      }
      if (urlOrId && typeof urlOrId === 'string') {
        const trimmed = urlOrId.trim();
        const cld = extractCloudinaryAsset(trimmed);
        if (cld) {
          inUseCloudinaryKeys.add(`${cld.resourceType}:${cld.publicId}`);
        } else if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
          inUseLocalUrls.add(trimmed);
        }
      }
    };

    checkMedia(other.primaryImage);
    if (Array.isArray(other.images)) {
      for (const img of other.images) {
        checkMedia(img.url, img.publicId);
      }
    }
    if (Array.isArray(other.colors)) {
      for (const col of other.colors) {
        if (col.imageUrl) checkMedia(col.imageUrl);
      }
    }
  }

  // 3. Filter out any assets that are shared with other products
  const assetsToDelete: CloudinaryAssetItem[] = [];
  for (const [key, asset] of targetCloudinaryAssets.entries()) {
    if (inUseCloudinaryKeys.has(key)) {
      result.skippedShared.push(asset.publicId);
    } else {
      assetsToDelete.push(asset);
    }
  }

  const localUrlsToDelete: string[] = [];
  for (const url of targetLocalUrls) {
    if (inUseLocalUrls.has(url)) {
      result.skippedShared.push(url);
    } else {
      localUrlsToDelete.push(url);
    }
  }

  // 4. Delete unshared Cloudinary assets
  if (assetsToDelete.length > 0) {
    try {
      const cldRes = await deleteCloudinaryAssets(assetsToDelete);
      result.cloudinaryDeleted.push(...cldRes.deleted);
      result.cloudinaryNotFound.push(...cldRes.notFound);
      if (!cldRes.success) {
        result.success = false;
      }
    } catch (cldErr) {
      console.error('[Product Cloudinary Assets Cleanup Error]:', cldErr);
      result.success = false;
    }
  }

  // 5. Delete unshared local upload files
  for (const localUrl of localUrlsToDelete) {
    const unlinked = await deleteLocalUploadFile(localUrl);
    if (unlinked) {
      result.localDeleted.push(localUrl);
    }
  }

  return result;
}
