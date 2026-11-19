/**
 * VIP TADJ — Client-Side Free Media Upload Service & Google Drive Embed Guide
 * Direct unsigned uploads to Cloudinary without exposing backend secrets,
 * plus structured guidance for Google Drive image embedding.
 */

import {
  normalizeImageUrl,
  extractGoogleDriveId,
  isValidMediaUrl,
  isSafeSvgMarkup,
} from './url-normalizer';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation, formatTranslation } from '@/lib/i18n/locales';

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  error?: string;
  errorCode?: string;
  errorKey?: string;
  isConfigured?: boolean;
}

export interface GoogleDriveGuidanceStep {
  step: number;
  title: string;
  instruction: string;
  tip?: string;
}

/**
 * Step-by-step instructions for store administrators using free Google Drive image hosting.
 */
export const GOOGLE_DRIVE_UPLOAD_GUIDE: GoogleDriveGuidanceStep[] = [
  {
    step: 1,
    title: 'Importer la photo sur Google Drive',
    instruction: 'Accédez à votre espace Google Drive (drive.google.com) et téléversez la photo du produit.',
    tip: 'Utilisez une résolution minimale de 1200x1600 pour un rendu éditorial luxueux.',
  },
  {
    step: 2,
    title: 'Activer le partage public (Lecteur)',
    instruction:
      'Faites un clic droit sur l\'image > "Partager" > Dans "Accès général", sélectionnez "Tous les utilisateurs disposant du lien".',
    tip: 'Important : ne laissez pas l\'accès sur "Limité", sinon l\'image ne s\'affichera pas sur la boutique.',
  },
  {
    step: 3,
    title: 'Copier le lien de partage',
    instruction: 'Cliquez sur "Copier le lien" (format : https://drive.google.com/file/d/.../view?usp=sharing).',
  },
  {
    step: 4,
    title: 'Coller dans le formulaire VIP TADJ',
    instruction:
      'Collez le lien dans le champ "URL de l\'image". VIP TADJ le convertit automatiquement en flux haute performance direct.',
  },
];

const GOOGLE_DRIVE_UPLOAD_GUIDE_EN: GoogleDriveGuidanceStep[] = [
  {
    step: 1,
    title: 'Upload the photo to Google Drive',
    instruction: 'Open your Google Drive (drive.google.com) and upload the product photo.',
    tip: 'Use a minimum resolution of 1200x1600 for crisp luxury presentation.',
  },
  {
    step: 2,
    title: 'Enable public sharing (Viewer)',
    instruction:
      'Right-click the image > "Share" > Under "General access", select "Anyone with the link".',
    tip: 'Important: do not leave access as "Restricted", or the image will not display on the storefront.',
  },
  {
    step: 3,
    title: 'Copy the share link',
    instruction: 'Click "Copy link" (format: https://drive.google.com/file/d/.../view?usp=sharing).',
  },
  {
    step: 4,
    title: 'Paste in the VIP TADJ form',
    instruction:
      'Paste the link into the "Image URL" field. VIP TADJ automatically converts it into a direct high-speed stream.',
  },
];

const GOOGLE_DRIVE_UPLOAD_GUIDE_AR: GoogleDriveGuidanceStep[] = [
  {
    step: 1,
    title: 'رفع الصورة على Google Drive',
    instruction: 'ادخل إلى حسابك على Google Drive (https://drive.google.com) وارفع صورة المنتج.',
    tip: 'يفضّل استخدام صورة بدقة عالية (1200×1600 على الأقل) لظهور أنيق وواضح في المتجر.',
  },
  {
    step: 2,
    title: 'تفعيل المشاركة العامة (عارض)',
    instruction:
      'اضغط بالزر الأيمن على الصورة > "مشاركة" > في "إمكانية الوصول العامة" اختر "أي شخص لديه الرابط".',
    tip: 'مهم: لا تترك الصلاحية على "حصري"، وإلا فلن تظهر الصورة للزبائن في المتجر.',
  },
  {
    step: 3,
    title: 'نسخ رابط المشاركة',
    instruction: 'اضغط على "نسخ الرابط" (يكون بالشكل: https://drive.google.com/file/d/.../view?usp=sharing).',
  },
  {
    step: 4,
    title: 'لصق الرابط في نموذج VIP TADJ',
    instruction:
      'الصق الرابط في خانة "رابط الصورة". يقوم نظام VIP TADJ بتحويله تلقائياً إلى رابط مباشر سريع.',
  },
];

export function getGoogleDriveUploadGuide(
  language: SupportedLanguage = 'fr'
): GoogleDriveGuidanceStep[] {
  if (language === 'ar') return GOOGLE_DRIVE_UPLOAD_GUIDE_AR;
  if (language === 'en') return GOOGLE_DRIVE_UPLOAD_GUIDE_EN;
  return GOOGLE_DRIVE_UPLOAD_GUIDE;
}

export const ALLOWED_MEDIA_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'avif',
  'svg',
  'mp4',
  'webm',
  'ogg',
  'mov',
]);

export const MIME_TO_ALLOWED_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
  'image/svg': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogg',
  'video/quicktime': 'mov',
};

const GZIP_MIME_TYPES = new Set([
  'application/gzip',
  'application/x-gzip',
  'application/x-gzip-compressed',
]);

export function getNormalizedFileExtension(file: Blob): string | null {
  const maybeFile = file as File;
  const rawName = typeof maybeFile.name === 'string' ? maybeFile.name.trim().replace(/\.+$/, '') : '';
  const dotIdx = rawName.lastIndexOf('.');
  if (dotIdx > 0 && dotIdx < rawName.length - 1) {
    return rawName.slice(dotIdx + 1).toLowerCase();
  }
  return null;
}

/**
 * Checks whether an uploaded File/Blob is an SVG (or compressed SVGZ) by MIME type or filename extension.
 */
export function isSvgUploadFile(file: Blob): boolean {
  const mime = (file.type || '').toLowerCase().split(';')[0].trim();
  if (mime === 'image/svg+xml' || mime === 'image/svg') {
    return true;
  }
  const ext = getNormalizedFileExtension(file);
  return ext === 'svg' || ext === 'svgz';
}

/**
 * Enforces the explicit image/video MIME and extension allowlist for uploaded media files.
 */
export function isAllowedMediaUploadFile(file: Blob): boolean {
  const mime = (file.type || '').toLowerCase().split(';')[0].trim();
  const nameExt = getNormalizedFileExtension(file);

  if (nameExt !== null && !ALLOWED_MEDIA_EXTENSIONS.has(nameExt)) {
    return false;
  }

  if (mime && !Object.prototype.hasOwnProperty.call(MIME_TO_ALLOWED_EXTENSION, mime)) {
    return false;
  }

  if (!mime && nameExt === null) {
    return false;
  }

  if (mime && nameExt !== null) {
    const expectedExt = MIME_TO_ALLOWED_EXTENSION[mime];
    const normalizedNameExt = nameExt === 'jpeg' ? 'jpg' : nameExt;
    if (expectedExt !== normalizedNameExt) {
      const isExpectedSvg = expectedExt === 'svg';
      const isNameSvg = normalizedNameExt === 'svg';
      const isExpectedVideo = mime.startsWith('video/');
      const isNameVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(normalizedNameExt);
      if (isExpectedSvg !== isNameSvg || isExpectedVideo !== isNameVideo) {
        return false;
      }
    }
  }

  return true;
}

async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  if (typeof Response !== 'undefined') {
    return new Uint8Array(await new Response(blob).arrayBuffer());
  }
  if (typeof FileReader !== 'undefined') {
    const ab = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error || new Error('Failed to read uploaded SVG file.'));
      reader.readAsArrayBuffer(blob);
    });
    return new Uint8Array(ab);
  }
  const text = await blob.text();
  return new TextEncoder().encode(text);
}

/**
 * Validates that an uploaded File/Blob is safe: non-SVG files pass through;
 * SVG files (by MIME or .svg/.svgz extension) must not be gzip-compressed and must pass `isSafeSvgMarkup()`.
 */
export async function validateUploadedSvgFile(file: Blob): Promise<boolean> {
  if (!isSvgUploadFile(file)) {
    return true;
  }
  const mime = (file.type || '').toLowerCase().split(';')[0].trim();
  const ext = getNormalizedFileExtension(file);
  if (ext === 'svgz' || GZIP_MIME_TYPES.has(mime)) {
    return false;
  }
  try {
    const bytes = await readBlobBytes(file);
    if (
      bytes.length >= 2 &&
      ((bytes[0] === 0x1f && bytes[1] === 0x8b) ||
        (bytes[0] === 0xff && bytes[1] === 0xfe) ||
        (bytes[0] === 0xfe && bytes[1] === 0xff))
    ) {
      return false;
    }
    const svgMarkup = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return isSafeSvgMarkup(svgMarkup);
  } catch {
    return false;
  }
}

/**
 * Checks whether client-side Cloudinary credentials are present in environment.
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  return Boolean(cloudName && uploadPreset);
}

/**
 * Executes a client-side unsigned upload to Cloudinary.
 * Requires zero backend API secrets; uses public upload preset.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  onProgress?: (progress: UploadProgressEvent) => void
): Promise<UploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!(await validateUploadedSvgFile(file))) {
    return {
      success: false,
      isConfigured: Boolean(cloudName && uploadPreset),
      errorCode: 'UPLOAD_UNSAFE_SVG',
      errorKey: 'api.error.upload_failed',
      error: 'Le fichier SVG contient du contenu non sécurisé ou invalide.',
    };
  }

  if (!isAllowedMediaUploadFile(file)) {
    return {
      success: false,
      isConfigured: Boolean(cloudName && uploadPreset),
      errorCode: 'UPLOAD_UNSUPPORTED_TYPE',
      errorKey: 'api.error.upload_failed',
      error: 'Type de fichier média non supporté.',
    };
  }

  if (!cloudName || !uploadPreset) {
    return {
      success: false,
      isConfigured: false,
      errorCode: 'CLOUDINARY_NOT_CONFIGURED',
      errorKey: 'media.upload.error.cloudinary_not_configured',
      error:
        'Cloudinary n\'est pas encore configuré (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ou NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET manquant). Utilisez le téléversement via lien public Google Drive ou les photos de la bibliothèque VIP TADJ.',
    };
  }

  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'vip-tadj/products');
    formData.append('tags', 'vip-tadj,product');

    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    xhr.open('POST', endpoint);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress({ loaded: event.loaded, total: event.total, percent });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          const secureUrl = res.secure_url || res.url;
          resolve({
            success: true,
            url: secureUrl,
            secureUrl,
            publicId: res.public_id,
            format: res.format,
            width: res.width,
            height: res.height,
            isConfigured: true,
          });
        } catch {
          resolve({
            success: false,
            errorCode: 'CLOUDINARY_INVALID_RESPONSE',
            errorKey: 'media.upload.error.cloudinary_invalid_response',
            error: 'Erreur lors du décodage de la réponse Cloudinary.',
            isConfigured: true,
          });
        }
      } else {
        let errDetail = 'Échec de l\'envoi Cloudinary.';
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error?.message) errDetail = errRes.error.message;
        } catch {
          // ignore parse error
        }
        resolve({
          success: false,
          errorCode: 'CLOUDINARY_UPLOAD_FAILED',
          errorKey: 'media.upload.error.cloudinary_upload_failed',
          error: errDetail,
          isConfigured: true,
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        errorCode: 'NETWORK_ERROR',
        errorKey: 'media.upload.error.network',
        error: 'Erreur réseau lors du téléversement de l\'image.',
        isConfigured: true,
      });
    };

    xhr.send(formData);
  });
}

/**
 * Validates a media URL input and returns normalized output + diagnostic details.
 */
export function inspectMediaInput(
  rawUrl: string,
  language: SupportedLanguage = 'fr'
): {
  isValid: boolean;
  mediaType: 'google-drive' | 'cloudinary' | 'unsplash' | 'direct' | 'invalid';
  normalizedUrl: string;
  message: string;
  messageKey: string;
  messageParams?: Record<string, string | number>;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    const messageKey = 'media.inspect.empty';
    return {
      isValid: false,
      mediaType: 'invalid',
      normalizedUrl: normalizeImageUrl(trimmed, { language }),
      message: getTranslation(language, messageKey, 'Veuillez saisir une URL valide.'),
      messageKey,
    };
  }

  // Align strictly with isValidMediaUrl(): rejects /folders/ Drive links, unsafe SVG Data URIs, and dangerous protocols
  if (!isValidMediaUrl(trimmed)) {
    const messageKey = 'media.inspect.invalid';
    return {
      isValid: false,
      mediaType: 'invalid',
      normalizedUrl: normalizeImageUrl(trimmed, { language }),
      message: getTranslation(
        language,
        messageKey,
        'Format d\'URL non reconnu. Utilisez un lien Google Drive, Cloudinary ou une URL d\'image.'
      ),
      messageKey,
    };
  }

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    const messageKey = 'media.inspect.google_drive';
    const messageParams = { id: driveId.slice(0, 8) };
    const template = getTranslation(
      language,
      messageKey,
      'Lien Google Drive valide détecté (ID : {id}...).'
    );
    return {
      isValid: true,
      mediaType: 'google-drive',
      normalizedUrl: normalizeImageUrl(trimmed, { language }),
      message: formatTranslation(template, messageParams),
      messageKey,
      messageParams,
    };
  }

  // Safe image Data URIs or valid local relative paths (/images/..., ./uploads/..., non-//, non-/\, non-./\)
  if (
    trimmed.toLowerCase().startsWith('data:image/') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) ||
    (trimmed.startsWith('./') && !trimmed.startsWith('.//') && !trimmed.startsWith('./\\'))
  ) {
    const messageKey = 'media.inspect.direct';
    return {
      isValid: true,
      mediaType: 'direct',
      normalizedUrl: normalizeImageUrl(trimmed, { language }),
      message: getTranslation(language, messageKey, 'Lien direct HTTP/HTTPS valide.'),
      messageKey,
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Unsupported protocol');
    }
    const lowerHost = parsed.hostname.toLowerCase();

    if (lowerHost === 'res.cloudinary.com') {
      const messageKey = 'media.inspect.cloudinary';
      return {
        isValid: true,
        mediaType: 'cloudinary',
        normalizedUrl: normalizeImageUrl(trimmed, { language }),
        message: getTranslation(language, messageKey, 'Image hébergée sur Cloudinary.'),
        messageKey,
      };
    }

    if (lowerHost === 'images.unsplash.com') {
      const messageKey = 'media.inspect.unsplash';
      return {
        isValid: true,
        mediaType: 'unsplash',
        normalizedUrl: normalizeImageUrl(trimmed, { language }),
        message: getTranslation(
          language,
          messageKey,
          'Image haute résolution Unsplash optimisée.'
        ),
        messageKey,
      };
    }

    if (parsed.hostname) {
      const messageKey = 'media.inspect.direct';
      return {
        isValid: true,
        mediaType: 'direct',
        normalizedUrl: normalizeImageUrl(trimmed, { language }),
        message: getTranslation(language, messageKey, 'Lien direct HTTP/HTTPS valide.'),
        messageKey,
      };
    }
  } catch {
    // Fall through to invalid
  }

  const messageKey = 'media.inspect.invalid';
  return {
    isValid: false,
    mediaType: 'invalid',
    normalizedUrl: normalizeImageUrl(trimmed, { language }),
    message: getTranslation(
      language,
      messageKey,
      'Format d\'URL non reconnu. Utilisez un lien Google Drive, Cloudinary ou une URL d\'image.'
    ),
    messageKey,
  };
}
