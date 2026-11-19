/**
 * VIP TADJ — Free Media URL Normalizer & Optimizer
 * Converts Google Drive share links, optimizes Unsplash CDN queries,
 * enhances Cloudinary delivery URLs, and supplies luxury SVG fallbacks.
 */

import type { SupportedLanguage } from '@/lib/i18n/types';
import { getLocalizedCategoryName } from '@/lib/i18n/catalog-translations';

export interface ImageNormalizeOptions {
  width?: number;
  quality?: number;
  fit?: 'crop' | 'cover' | 'contain' | 'fill';
  googleDriveFormat?: 'uc' | 'lh3';
  fallbackCategory?: 'clothing' | 'shoes' | 'accessories' | 'general' | string | null;
  language?: SupportedLanguage;
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
 * Checks whether a URL hostname belongs strictly to Google Drive / Docs.
 */
function isGoogleDriveHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === 'drive.google.com' || lower === 'docs.google.com';
}

/**
 * Extracts Google Drive file ID from standard Google Drive sharing URLs or confirmed raw IDs.
 * Scopes URL matching strictly to drive.google.com / docs.google.com non-folder routes so
 * third-party URLs containing ?id=... are never hijacked.
 */
export function extractGoogleDriveId(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Raw file ID (strictly confirmed 25-55 characters alphanumeric token)
  if (isConfirmedGoogleDriveId(trimmed)) {
    return trimmed;
  }

  // 2. Parse as HTTP/HTTPS URL and restrict to drive.google.com / docs.google.com non-folder routes
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    if (!isGoogleDriveHostname(parsed.hostname)) {
      return null;
    }
    if (/\/folders(?:\/|$)/i.test(parsed.pathname)) {
      return null;
    }

    // /file/d/{id} (e.g. drive.google.com/file/d/1A2B3C.../view)
    const fileDMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch && fileDMatch[1]) {
      return fileDMatch[1];
    }

    // id or fileId query param (e.g. drive.google.com/open?id=1A2B3C or /uc?id=1A2B3C)
    const idParam = parsed.searchParams.get('id') || parsed.searchParams.get('fileId');
    if (idParam && /^[a-zA-Z0-9_-]+$/.test(idParam)) {
      return idParam;
    }

    return null;
  } catch {
    return null;
  }
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
export function getLuxuryPlaceholderSvg(
  category?: string | null,
  language?: SupportedLanguage
): string {
  const safeCategory = (typeof category === 'string' && category.trim()) ? category.trim() : 'general';
  const lowerCat = safeCategory.toLowerCase();

  let displayCategory = safeCategory.toUpperCase();
  if (language) {
    if (lowerCat === 'general') {
      displayCategory = language === 'ar' ? 'عام' : language === 'en' ? 'GENERAL' : 'GÉNÉRAL';
    } else if (
      lowerCat === 'clothing' ||
      lowerCat === 'vetements' ||
      lowerCat === 'shoes' ||
      lowerCat === 'chaussures' ||
      lowerCat === 'accessories' ||
      lowerCat === 'accessoires'
    ) {
      const localized = getLocalizedCategoryName(lowerCat, language);
      displayCategory = language === 'ar' ? localized : localized.toUpperCase();
    }
  }

  const categoryLabel = escapeXml(displayCategory);
  const tagline =
    language === 'ar'
      ? 'أناقة رجالية راقية'
      : language === 'en'
      ? 'HAUTE MENSWEAR'
      : 'HAUTE ÉLÉGANCE MASCULINE';
  const taglineFont =
    language === 'ar'
      ? `'Cairo', 'Tajawal', 'Noto Sans Arabic', sans-serif`
      : `'Plus Jakarta Sans', sans-serif`;
  const taglineSpacing = language === 'ar' ? '0' : '6';
  const catSpacing = language === 'ar' ? '0' : '3';

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
  <text x="400" y="550" text-anchor="middle" font-family="${taglineFont}" font-size="12" font-weight="400" letter-spacing="${taglineSpacing}" fill="#D4AF37" opacity="0.8">${tagline}</text>
  <text x="400" y="585" text-anchor="middle" font-family="${taglineFont}" font-size="10" font-weight="300" letter-spacing="${catSpacing}" fill="#A0A0A0">[ ${categoryLabel} ]</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const ALLOWED_DATA_IMAGE_URI_RE =
  /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml|avif|bmp|ico)(?:\s*;\s*(?:charset\s*=\s*(?:"utf-?8"|'utf-?8'|utf-?8)|utf-?8))?(?:\s*;\s*base64)?\s*,(.+)$/is;

function isSafeLocalMediaPath(trimmed: string): boolean {
  if (/[\x00-\x1f\x7f]/.test(trimmed)) return false;
  const decoded = forgivingPercentDecode(trimmed);
  if (/[\x00-\x1f\x7f]/.test(decoded)) return false;
  const dotDotSegmentRe = /(?:^|[\\/])\.\.(?:[\\/?#]|$)/;
  if (dotDotSegmentRe.test(trimmed) || dotDotSegmentRe.test(decoded)) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
    return trimmed.length > 1;
  }
  if (trimmed.startsWith('./') && !trimmed.startsWith('.//') && !trimmed.startsWith('./\\')) {
    return trimmed.length > 2;
  }
  return false;
}

/**
 * Master image normalizer: automatically detects source type and applies optimal transform.
 */
export function normalizeImageUrl(
  rawUrl: string | undefined | null,
  options: ImageNormalizeOptions = {}
): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return getLuxuryPlaceholderSvg(options.fallbackCategory, options.language);
  }

  const trimmed = rawUrl.trim();

  // 1. Data URIs or local relative paths (/images/...), excluding protocol-relative URLs (//)
  if (trimmed.toLowerCase().startsWith('data:image/')) {
    if (!ALLOWED_DATA_IMAGE_URI_RE.test(trimmed)) {
      return getLuxuryPlaceholderSvg(options.fallbackCategory, options.language);
    }
    if (trimmed.toLowerCase().startsWith('data:image/svg+xml') && !isSafeSvgDataUri(trimmed)) {
      return getLuxuryPlaceholderSvg(options.fallbackCategory, options.language);
    }
    return trimmed;
  }
  if (isSafeLocalMediaPath(trimmed)) {
    return trimmed;
  }

  // 2. Confirmed raw Google Drive ID
  if (isConfirmedGoogleDriveId(trimmed)) {
    return normalizeGoogleDriveUrl(trimmed, options.googleDriveFormat || 'uc', options.width || 1200);
  }

  // 3. Parse HTTP/HTTPS URL strictly before any CDN host matching
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return getLuxuryPlaceholderSvg(options.fallbackCategory, options.language);
  }

  if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
    return getLuxuryPlaceholderSvg(options.fallbackCategory, options.language);
  }

  const lowerHost = parsed.hostname.toLowerCase();

  // 3a. Google Drive links
  if (isGoogleDriveHostname(lowerHost)) {
    const driveId = extractGoogleDriveId(trimmed);
    if (driveId) {
      return normalizeGoogleDriveUrl(trimmed, options.googleDriveFormat || 'uc', options.width || 1200);
    }
    return getLuxuryPlaceholderSvg(options.fallbackCategory, options.language);
  }

  // 3b. Unsplash CDN links (exact hostname match)
  if (lowerHost === 'images.unsplash.com') {
    return optimizeUnsplashUrl(trimmed, {
      width: options.width || 1200,
      quality: options.quality || 80,
      fit: options.fit || 'crop',
    });
  }

  // 3c. Cloudinary links (exact hostname match)
  if (lowerHost === 'res.cloudinary.com') {
    return optimizeCloudinaryUrl(trimmed, { width: options.width || 1200 });
  }

  // 3d. Standard HTTP/HTTPS URLs
  return trimmed;
}

const SVG_NAMED_ENTITY_MAP: Record<string, string> = {
  colon: ':',
  tab: '\t',
  newline: '\n',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  amp: '&',
  equals: '=',
  sol: '/',
  lpar: '(',
  rpar: ')',
  semi: ';',
  comma: ',',
  bsol: '\\',
};

const SVG_NAMED_ENTITY_REGEX = new RegExp(
  `&(${Object.keys(SVG_NAMED_ENTITY_MAP).join('|')});`,
  'gi'
);

/**
 * Iteratively decodes XML/HTML numeric, hex, and common named character entities
 * so obfuscated XSS payloads cannot bypass SVG Data URI inspection.
 */
function decodeXmlHtmlEntities(input: string, preserveQuotes = false): string {
  let current = input;
  for (let pass = 0; pass < 5; pass++) {
    const next = current
      .replace(/&#x([0-9a-fA-F]+);?/gi, (_, hex) => {
        const code = parseInt(hex, 16);
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return '';
        if (preserveQuotes && (code === 34 || code === 39)) return ' ';
        try {
          return String.fromCodePoint(code);
        } catch {
          return '';
        }
      })
      .replace(/&#([0-9]+);?/g, (_, dec) => {
        const code = parseInt(dec, 10);
        if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return '';
        if (preserveQuotes && (code === 34 || code === 39)) return ' ';
        try {
          return String.fromCodePoint(code);
        } catch {
          return '';
        }
      })
      .replace(SVG_NAMED_ENTITY_REGEX, (match, name: string) => {
        const lower = name.toLowerCase();
        if (preserveQuotes && (lower === 'quot' || lower === 'apos')) return ' ';
        return SVG_NAMED_ENTITY_MAP[lower] ?? match;
      });
    if (next === current) break;
    current = next;
  }
  return current;
}

function tryDecodeUriComponent(input: string): string | null {
  try {
    return decodeURIComponent(input);
  } catch {
    return null;
  }
}

/**
 * WHATWG-style forgiving percent-decode: decodes valid %XX sequences
 * (UTF-8 multi-byte with Latin1 byte fallback for invalid UTF-8 like %FF)
 * while leaving bare '%' (such as width="100%") intact without throwing.
 */
function forgivingPercentDecode(input: string): string {
  if (!input.includes('%')) return input;
  let out = '';
  let i = 0;
  const len = input.length;

  while (i < len) {
    if (
      input.charCodeAt(i) === 37 &&
      i + 2 < len &&
      /^[0-9a-fA-F]{2}$/.test(input.slice(i + 1, i + 3))
    ) {
      const b1 = parseInt(input.slice(i + 1, i + 3), 16);
      if (b1 < 0x80) {
        out += String.fromCharCode(b1);
        i += 3;
        continue;
      }

      let expectedBytes = 0;
      if (b1 >= 0xc2 && b1 <= 0xdf) expectedBytes = 2;
      else if (b1 >= 0xe0 && b1 <= 0xef) expectedBytes = 3;
      else if (b1 >= 0xf0 && b1 <= 0xf4) expectedBytes = 4;

      if (expectedBytes > 0 && i + expectedBytes * 3 <= len) {
        const chunk = input.slice(i, i + expectedBytes * 3);
        if (/^(?:%[0-9a-fA-F]{2})+$/.test(chunk)) {
          try {
            out += decodeURIComponent(chunk);
            i += expectedBytes * 3;
            continue;
          } catch {
            // Invalid UTF-8 multi-byte sequence -> fall through to single-byte fallback
          }
        }
      }

      out += String.fromCharCode(b1);
      i += 3;
      continue;
    }

    out += input[i];
    i += 1;
  }

  return out;
}

/**
 * Decodes CSS backslash hex escapes (\\XXXXXX[whitespace]?) and non-hex escapes (\\<char>).
 */
function decodeCssEscapes(input: string): string {
  if (!input.includes('\\')) return input;
  return input.replace(
    /\\(?:([0-9a-fA-F]{1,6})(?:\r\n|[ \t\n\r\f])?|([^\da-fA-F\r\n\f]))/g,
    (_, hex: string | undefined, nonHex: string | undefined) => {
      if (hex !== undefined) {
        const code = parseInt(hex, 16);
        if (
          !Number.isFinite(code) ||
          code <= 0 ||
          code > 0x10ffff ||
          (code >= 0xd800 && code <= 0xdfff)
        ) {
          return '\uFFFD';
        }
        try {
          return String.fromCodePoint(code);
        } catch {
          return '\uFFFD';
        }
      }
      return nonHex ?? '';
    }
  );
}

function decodeBase64Utf8(input: string): string | null {
  const cleaned = input.replace(/\s+/g, '');
  if (!cleaned) return null;
  const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  if (normalized.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    return null;
  }
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(normalized, 'base64').toString('utf8');
    }
    if (typeof atob === 'function') {
      const binary = atob(normalized);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates expanded SVG candidate strings against dangerous tags, XML DTDs,
 * processing instructions, event handlers, CSS gadgets, and dangerous URI schemes.
 */
function areSvgCandidatesSafe(baseCandidates: string[]): boolean {
  // Iteratively expand URI-decoded and XML/HTML-entity-decoded candidates
  const seen = new Set<string>(baseCandidates);
  const queue: string[] = [...baseCandidates];
  let head = 0;
  const MAX_CANDIDATES = 48;
  while (head < queue.length && seen.size < MAX_CANDIDATES) {
    const current = queue[head++];
    const entityDecoded = decodeXmlHtmlEntities(current, false);
    if (!seen.has(entityDecoded)) {
      seen.add(entityDecoded);
      queue.push(entityDecoded);
    }
    const entityDecodedPreserveQuotes = decodeXmlHtmlEntities(current, true);
    if (!seen.has(entityDecodedPreserveQuotes)) {
      seen.add(entityDecodedPreserveQuotes);
      queue.push(entityDecodedPreserveQuotes);
    }
    const uriDecoded = tryDecodeUriComponent(current);
    if (uriDecoded !== null && !seen.has(uriDecoded)) {
      seen.add(uriDecoded);
      queue.push(uriDecoded);
    }
    const forgivingDecoded = forgivingPercentDecode(current);
    if (!seen.has(forgivingDecoded)) {
      seen.add(forgivingDecoded);
      queue.push(forgivingDecoded);
    }
  }

  const dangerousTagRe =
    /<\s*(?:[a-z_][a-z0-9._-]*\s*:\s*)?(?:script|iframe|object|embed|foreignobject|set|animate|animatetransform|animatemotion|animatecolor|discard|use|image|feimage|style|link|meta)\b/i;
  const eventHandlerRe = /\bon[a-z]+\s*=/i;
  const dangerousHrefRe =
    /(?:^|[\s"'</])(?:[a-z_][a-z0-9._-]*\s*:\s*)?(?:href|src)\s*=\s*(?:["']\s*(?:javascript|vbscript|data)\s*:|(?:javascript|vbscript|data)\s*:)/i;
  const dangerousCssStyleRe =
    /\bstyle\s*=\s*["'][^"']*(?:@import|expression\s*\(|\\|(?:javascript|vbscript|data)\s*:)/i;
  const dangerousCssUrlRe =
    /url\s*\(\s*(?:["']?\s*(?:data|javascript|vbscript)\s*:|[^)]*\\)/i;
  const dangerousPiRe = /<\?\s*(?!xml(?:\s|\?>))/i;
  const dangerousDtdRe = /<!\s*(?:DOCTYPE|ENTITY|ATTLIST|ELEMENT|NOTATION)/i;
  const svgRootRe = /<(?:[a-z_][a-z0-9._-]*\s*:\s*)?svg(?:\s|\/|>)/i;
  let hasSvgRootElement = false;

  for (const content of seen) {
    if (/[\x00\uFFFD]/.test(content)) {
      return false;
    }
    if (svgRootRe.test(content)) {
      hasSvgRootElement = true;
    }
    const nullStripped = content
      .replace(/[\x0b\x0c]+/g, ' ')
      .replace(/[\x00-\x08\x0e-\x1f\x7f]+/g, '');
    const urlControlStripped = content.replace(/[\x00-\x1f\x7f]+/g, '');
    const cssNormalized = nullStripped.replace(/\/\*[\s\S]*?\*\//g, '');
    const cssControlStripped = cssNormalized.replace(/[\x00-\x1f\x7f]+/g, '');
    const cssUnescaped = decodeCssEscapes(cssNormalized)
      .replace(/[\x0b\x0c]+/g, ' ')
      .replace(/[\x00-\x08\x0e-\x1f\x7f\ufffd]+/g, '');
    const cssUnescapedControlStripped = cssUnescaped.replace(/[\x00-\x1f\x7f]+/g, '');
    const compact = content.replace(/[\x00-\x20\x7f]+/g, '');
    const cssCompact = cssNormalized.replace(/[\x00-\x20\x7f]+/g, '');
    const cssUnescapedCompact = cssUnescaped.replace(/[\x00-\x20\x7f]+/g, '');

    for (const wsVariant of [content, nullStripped, cssNormalized]) {
      if (dangerousPiRe.test(wsVariant)) {
        return false;
      }
    }

    for (const variant of [
      content,
      nullStripped,
      urlControlStripped,
      cssNormalized,
      cssControlStripped,
      cssUnescaped,
      cssUnescapedControlStripped,
      compact,
      cssCompact,
      cssUnescapedCompact,
    ]) {
      if (
        dangerousDtdRe.test(variant) ||
        dangerousTagRe.test(variant) ||
        eventHandlerRe.test(variant) ||
        dangerousHrefRe.test(variant) ||
        dangerousCssStyleRe.test(variant) ||
        dangerousCssUrlRe.test(variant) ||
        /@import\b/i.test(variant) ||
        /\bexpression\s*\(/i.test(variant) ||
        /\battributeName\s*=\s*(?:["']\s*on[a-z]+|on[a-z]+)/i.test(variant) ||
        (/\battributeName\s*=\s*(?:["']\s*(?:[a-z_][a-z0-9._-]*\s*:\s*)?href\s*["']|(?:[a-z_][a-z0-9._-]*\s*:\s*)?href\b)/i.test(
          variant
        ) &&
          /(?:javascript|vbscript|data):/i.test(compact)) ||
        /javascript\s*:/i.test(variant) ||
        /vbscript\s*:/i.test(variant) ||
        /data\s*:\s*(?:text\/html|image\/svg\+xml|application\/xhtml\+xml|(?:text|application)\/(?:xml|javascript|ecmascript|x-javascript))/i.test(
          variant
        )
      ) {
        return false;
      }
    }
  }

  return hasSvgRootElement;
}

/**
 * Validates raw SVG markup (e.g. from an uploaded .svg file) using the same safety rules
 * as SVG Data URIs.
 */
export function isSafeSvgMarkup(svgMarkup: string): boolean {
  if (!svgMarkup || typeof svgMarkup !== 'string' || !svgMarkup.trim()) {
    return false;
  }
  return areSvgCandidatesSafe([svgMarkup]);
}

/**
 * Validates that an SVG Data URI does not contain scripts, XML DTDs, event handlers,
 * SMIL triggers, dangerous embedding tags, CSS gadgets, or dangerous URI schemes.
 */
export function isSafeSvgDataUri(trimmed: string): boolean {
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx === -1) return false;
  const header = trimmed.slice(0, commaIdx).toLowerCase();
  const rawPayload = trimmed.slice(commaIdx + 1);
  if (!rawPayload.trim()) return false;

  const isBase64 = /;\s*base64\b/i.test(header);
  const baseCandidates: string[] = [rawPayload];
  const uriDecodedPayload = tryDecodeUriComponent(rawPayload);
  if (uriDecodedPayload !== null && uriDecodedPayload !== rawPayload) {
    baseCandidates.push(uriDecodedPayload);
  }
  if (!isBase64) {
    const forgivingRaw = forgivingPercentDecode(rawPayload);
    if (forgivingRaw !== rawPayload && forgivingRaw !== uriDecodedPayload) {
      baseCandidates.push(forgivingRaw);
    }
  }

  if (isBase64) {
    if (uriDecodedPayload === null) {
      return false;
    }
    const decodedRawB64 = decodeBase64Utf8(rawPayload);
    const decodedUriB64 = decodeBase64Utf8(uriDecodedPayload);
    if (decodedRawB64 === null && decodedUriB64 === null) {
      return false;
    }
    if (decodedRawB64 !== null) {
      baseCandidates.push(decodedRawB64);
    }
    if (decodedUriB64 !== null && decodedUriB64 !== decodedRawB64) {
      baseCandidates.push(decodedUriB64);
    }
  }

  return areSvgCandidatesSafe(baseCandidates);
}

/**
 * Validates whether a provided string represents an acceptable media URL.
 */
export function isValidMediaUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // 1. Safe image Data URIs (supports ;utf8, ;charset=utf-8, and ;base64; blocks SVG XSS)
  if (ALLOWED_DATA_IMAGE_URI_RE.test(trimmed)) {
    if (trimmed.toLowerCase().startsWith('data:image/svg+xml')) {
      return isSafeSvgDataUri(trimmed);
    }
    return true;
  }

  // 2. Local relative paths (safe /... or ./... excluding // and .. traversal)
  if (isSafeLocalMediaPath(trimmed)) {
    return true;
  }

  // 3. Confirmed raw Google Drive file ID
  if (isConfirmedGoogleDriveId(trimmed)) {
    return true;
  }

  // 4. Absolute HTTP/HTTPS URL with parsable syntax (blocks javascript:, vbscript:, data:text/html, ftp:, etc.)
  // Also rejects non-file Google Drive URLs (e.g. drive/folders... or URLs with no extractable file ID)
  try {
    const parsed = new URL(trimmed);
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
      return false;
    }
    if (isGoogleDriveHostname(parsed.hostname)) {
      if (/\/folders(?:\/|$)/i.test(parsed.pathname)) {
        return false;
      }
      return extractGoogleDriveId(trimmed) !== null;
    }
    return true;
  } catch {
    return false;
  }
}
