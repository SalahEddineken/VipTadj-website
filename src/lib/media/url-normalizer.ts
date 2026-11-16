/**
 * VIP TADJ — Free Media URL Normalizer & Optimizer
 * Converts Google Drive share links, optimizes Unsplash CDN queries,
 * enhances Cloudinary delivery URLs, and supplies luxury SVG fallbacks.
 */

export interface ImageNormalizeOptions {
  width?: number;
  quality?: number;
  fit?: 'crop' | 'cover' | 'contain' | 'fill';
  googleDriveFormat?: 'uc' | 'lh3';
  fallbackCategory?: 'clothing' | 'shoes' | 'accessories' | 'general' | string | null;
}

/**
 * Safely escapes XML special characters to produce valid, injection-safe SVG markup.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validates whether a standalone string qualifies strictly as a genuine Google Drive file ID.
 * Standard Drive IDs are 25-55 character high-entropy alphanumeric strings with digits and letters.
 * Rejects lowercase hyphenated/underscored slug patterns (e.g. "invalid-path-without-protocol").
 */
function isConfirmedGoogleDriveId(id: string): boolean {
  if (!/^[a-zA-Z0-9_-]{25,55}$/.test(id)) return false;
  if (id.includes('/') || id.includes('.') || id.includes(' ')) return false;
  // Must contain both letters and digits
  if (!/[a-zA-Z]/.test(id) || !/\d/.test(id)) return false;
  // Reject lowercase hyphenated or underscored word slugs that lack uppercase characters
  if (/^[a-z0-9]+([-_][a-z0-9]+){2,}$/.test(id) && !/[A-Z]/.test(id)) {
    return false;
  }
  return true;
}

/**
 * Extracts Google Drive file ID from all standard sharing URL variants or confirmed raw IDs.
 */
export function extractGoogleDriveId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. Raw file ID (strictly confirmed 25-55 characters alphanumeric token)
  if (isConfirmedGoogleDriveId(trimmed)) {
    return trimmed;
  }

  // 2. /file/d/{id} (e.g. drive.google.com/file/d/1A2B3C.../view)
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  // 3. id query param (e.g. drive.google.com/open?id=1A2B3C or /uc?id=1A2B3C)
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // 4. fileId query param
  const fileIdMatch = trimmed.match(/[?&]fileId=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) return fileIdMatch[1];

  return null;
}

/**
 * Converts a Google Drive file ID or share link into a direct streaming image URL.
 */
export function normalizeGoogleDriveUrl(url: string, format: 'uc' | 'lh3' = 'uc', width = 1200): string {
  const fileId = extractGoogleDriveId(url);
  if (!fileId) return url;

  if (format === 'lh3') {
    return `https://lh3.googleusercontent.com/d/${fileId}=w${width}`;
  }
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Ensures optimal Imgix CDN query parameters for Unsplash images.
 */
export function optimizeUnsplashUrl(
  url: string,
  options: { width?: number; quality?: number; fit?: string } = {}
): string {
  try {
    const parsed = new URL(url);
    const width = options.width || 1200;
    const quality = options.quality || 80;
    const fit = options.fit || 'crop';

    parsed.searchParams.set('auto', 'format');
    parsed.searchParams.set('fit', fit);
    parsed.searchParams.set('q', quality.toString());
    parsed.searchParams.set('w', width.toString());

    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Injects automatic format, quality, and width transforms into Cloudinary URLs.
 */
export function optimizeCloudinaryUrl(url: string, options: { width?: number } = {}): string {
  const width = options.width || 1200;
  // If already transformed, don't duplicate
  if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/c_')) {
    return url;
  }
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`);
}

/**
 * Generates an inline, self-contained SVG Data URI with VIP TADJ luxury aesthetic.
 * Escapes XML entities and provides clean fallback when category is null, undefined, or empty.
 */
export function getLuxuryPlaceholderSvg(category?: string | null): string {
  const safeCategory = (typeof category === 'string' && category.trim()) ? category.trim() : 'general';
  const categoryLabel = escapeXml(safeCategory.toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="100%" height="100%">
  <defs>
    <linearGradient id="obsidianGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0C10"/>
      <stop offset="50%" stop-color="#14161D"/>
      <stop offset="100%" stop-color="#1F2421"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3E5AB"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#AA771C"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1000" fill="url(#obsidianGrad)"/>
  <rect x="28" y="28" width="744" height="944" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" opacity="0.6"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="url(#goldGrad)" stroke-width="0.75" opacity="0.3"/>
  <g transform="translate(400, 440) scale(1.6)" text-anchor="middle">
    <path d="M-20,10 L-25,-10 L-10,-2 L0,-16 L10,-2 L25,-10 L20,10 Z" fill="url(#goldGrad)" opacity="0.9"/>
    <circle cx="-25" cy="-12" r="2.5" fill="#F3E5AB"/>
    <circle cx="0" cy="-18" r="3" fill="#F3E5AB"/>
    <circle cx="25" cy="-12" r="2.5" fill="#F3E5AB"/>
  </g>
  <text x="400" y="520" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="28" font-weight="700" letter-spacing="8" fill="url(#goldGrad)">VIP TADJ</text>
  <text x="400" y="550" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="400" letter-spacing="6" fill="#D4AF37" opacity="0.8">HAUTE ÉLÉGANCE MASCULINE</text>
  <text x="400" y="585" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="300" letter-spacing="3" fill="#A0A0A0">[ ${categoryLabel} ]</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Master image normalizer: automatically detects source type and applies optimal transform.
 */
export function normalizeImageUrl(
  rawUrl: string | undefined | null,
  options: ImageNormalizeOptions = {}
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return getLuxuryPlaceholderSvg(options.fallbackCategory);
  }

  const trimmed = rawUrl.trim();

  // 1. Data URIs or local relative paths (/images/...), excluding protocol-relative URLs (//)
  if (
    trimmed.startsWith('data:image/') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//')) ||
    trimmed.startsWith('./')
  ) {
    return trimmed;
  }

  // 2. Google Drive links or IDs
  const isGoogleDriveDomain = trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com');
  const driveId = extractGoogleDriveId(trimmed);

  if (driveId) {
    return normalizeGoogleDriveUrl(trimmed, options.googleDriveFormat || 'uc', options.width || 1200);
  }

  // If explicitly a Google Drive domain URL but file ID extraction failed (e.g. folder, broken link),
  // return luxury placeholder instead of falling through to raw non-image HTTP URL
  if (isGoogleDriveDomain) {
    return getLuxuryPlaceholderSvg(options.fallbackCategory);
  }

  // 3. Unsplash CDN links
  if (trimmed.includes('images.unsplash.com')) {
    return optimizeUnsplashUrl(trimmed, {
      width: options.width || 1200,
      quality: options.quality || 80,
      fit: options.fit || 'crop',
    });
  }

  // 4. Cloudinary links
  if (trimmed.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(trimmed, { width: options.width || 1200 });
  }

  // 5. Standard HTTP/HTTPS URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Fallback if unrecognizable
  return getLuxuryPlaceholderSvg(options.fallbackCategory);
}

/**
 * Validates whether a provided string represents an acceptable media URL.
 */
export function isValidMediaUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // 1. Data URIs and local relative paths (exclude protocol-relative //)
  if (
    trimmed.startsWith('data:image/') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  ) {
    return true;
  }

  // 2. Confirmed Google Drive ID or Drive link
  if (extractGoogleDriveId(trimmed) !== null) {
    return true;
  }

  // 3. Absolute URL with parsable syntax
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}
