/**
 * VIP TADJ — Client-Side Free Media Upload Service & Google Drive Embed Guide
 * Direct unsigned uploads to Cloudinary without exposing backend secrets,
 * plus structured guidance for Google Drive image embedding.
 */

import { normalizeImageUrl, extractGoogleDriveId } from './url-normalizer';

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

  if (!cloudName || !uploadPreset) {
    return {
      success: false,
      isConfigured: false,
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
          error: errDetail,
          isConfigured: true,
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
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
export function inspectMediaInput(rawUrl: string): {
  isValid: boolean;
  mediaType: 'google-drive' | 'cloudinary' | 'unsplash' | 'direct' | 'invalid';
  normalizedUrl: string;
  message: string;
} {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      mediaType: 'invalid',
      normalizedUrl: normalizeImageUrl(trimmed),
      message: 'Veuillez saisir une URL valide.',
    };
  }

  const driveId = extractGoogleDriveId(trimmed);
  if (driveId) {
    return {
      isValid: true,
      mediaType: 'google-drive',
      normalizedUrl: normalizeImageUrl(trimmed),
      message: `Lien Google Drive valide détecté (ID: ${driveId.slice(0, 8)}...).`,
    };
  }

  if (trimmed.includes('res.cloudinary.com')) {
    return {
      isValid: true,
      mediaType: 'cloudinary',
      normalizedUrl: normalizeImageUrl(trimmed),
      message: 'Image hébergée sur Cloudinary.',
    };
  }

  if (trimmed.includes('images.unsplash.com')) {
    return {
      isValid: true,
      mediaType: 'unsplash',
      normalizedUrl: normalizeImageUrl(trimmed),
      message: 'Image haute résolution Unsplash optimisée.',
    };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return {
      isValid: true,
      mediaType: 'direct',
      normalizedUrl: trimmed,
      message: 'Lien direct HTTP/HTTPS valide.',
    };
  }

  return {
    isValid: false,
    mediaType: 'invalid',
    normalizedUrl: normalizeImageUrl(trimmed),
    message: 'Format d\'URL non reconnu. Utilisez un lien Google Drive, Cloudinary ou une URL d\'image.',
  };
}
