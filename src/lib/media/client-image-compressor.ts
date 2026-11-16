/**
 * VIP TADJ — Client-Side Image Optimizer & Compressor
 * Automatically downsizes and compresses large camera photos from smartphones and PCs
 * before network transmission, guaranteeing sub-second uploads and optimal quality.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

/**
 * Compresses an image File using HTML5 Canvas in the browser.
 * Falls back safely to original file if compression is unsupported or fails.
 */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // If not running in browser, return original
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  // Only compress raster photographic formats (skip SVG, GIF animations, etc.)
  if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
    return file;
  }

  // If already small (< 250KB), no need to compress
  if (file.size < 250 * 1024) {
    return file;
  }

  const maxWidth = options.maxWidth || 1600;
  const maxHeight = options.maxHeight || 2000;
  const quality = options.quality ?? 0.85;
  const targetMimeType = options.mimeType || 'image/jpeg';

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // If dimensions are within bounds and file isn't huge, keep original
      if (width <= maxWidth && height <= maxHeight && file.size < 800 * 1024) {
        resolve(file);
        return;
      }

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background for JPEGs (in case PNG with transparency is converted)
      if (targetMimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compression didn't save space or failed, use original
            resolve(file);
            return;
          }

          // Build clean filename with appropriate extension
          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const ext = targetMimeType === 'image/webp' ? 'webp' : 'jpg';
          const newFileName = `${originalName}.${ext}`;

          const compressedFile = new File([blob], newFileName, {
            type: targetMimeType,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        targetMimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
