import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import {
  normalizeImageUrl,
  isValidMediaUrl,
  isSafeSvgMarkup,
  isSafeSvgDataUri,
} from '@/lib/media/url-normalizer';
import {
  isSvgUploadFile,
  isAllowedMediaUploadFile,
  getNormalizedFileExtension,
  ALLOWED_MEDIA_EXTENSIONS,
  MIME_TO_ALLOWED_EXTENSION,
} from '@/lib/media/upload-service';
import { ProductImage } from '@/types';
import {
  resolveApiLanguage,
  buildApiErrorResponse,
  getApiLocalizedMessage,
} from '@/app/api/_utils/api-i18n';

class UnsafeSvgUploadError extends Error {
  constructor(message = 'Unsafe SVG upload rejected.') {
    super(message);
    this.name = 'UnsafeSvgUploadError';
  }
}

class UnsupportedMediaTypeError extends Error {
  constructor(message = 'Unsupported media file type.') {
    super(message);
    this.name = 'UnsupportedMediaTypeError';
  }
}

const ALLOWED_EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  mov: 'video/quicktime',
};

// Helper to determine clean, allowlisted file extension
function getFileExtension(file: File): string {
  if (file.type) {
    const mime = file.type.toLowerCase().split(';')[0].trim();
    const mapped = MIME_TO_ALLOWED_EXTENSION[mime];
    if (mapped) return mapped;
  }
  const ext = getNormalizedFileExtension(file);
  if (ext && ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  throw new UnsupportedMediaTypeError();
}

async function readFileBuffer(file: File): Promise<Buffer> {
  if (typeof file.arrayBuffer === 'function') {
    return Buffer.from(await file.arrayBuffer());
  }
  if (typeof FileReader !== 'undefined') {
    const ab = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error || new Error('Failed to read uploaded file.'));
      reader.readAsArrayBuffer(file);
    });
    return Buffer.from(ab);
  }
  return Buffer.from(await new Response(file).arrayBuffer());
}

async function assertSafeSvgFileBuffer(file: File, buffer: Buffer): Promise<void> {
  const mime = (file.type || '').toLowerCase().split(';')[0].trim();
  const rawExt = getNormalizedFileExtension(file);
  const isSvg = isSvgUploadFile(file) || rawExt === 'svg' || rawExt === 'svgz';
  if (!isSvg) {
    return;
  }
  if (
    rawExt === 'svgz' ||
    mime === 'application/gzip' ||
    mime === 'application/x-gzip' ||
    mime === 'application/x-gzip-compressed' ||
    (buffer.length >= 2 &&
      ((buffer[0] === 0x1f && buffer[1] === 0x8b) ||
        (buffer[0] === 0xff && buffer[1] === 0xfe) ||
        (buffer[0] === 0xfe && buffer[1] === 0xff)))
  ) {
    throw new UnsafeSvgUploadError();
  }
  const svgMarkup = buffer.toString('utf8');
  const svgDataUri = `data:image/svg+xml;base64,${buffer.toString('base64')}`;
  if (!isSafeSvgMarkup(svgMarkup) || !isSafeSvgDataUri(svgDataUri)) {
    throw new UnsafeSvgUploadError();
  }
}

// Helper to save a single file to server disk or Cloudinary
async function processUploadFile(
  file: File,
  alt: string,
  isPrimary: boolean,
  cloudName?: string,
  uploadPreset?: string
): Promise<ProductImage> {
  const uniqueId = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const isVideo = file.type?.startsWith('video/') || false;
  const bytes = await readFileBuffer(file);
  const buffer = Buffer.from(bytes);

  await assertSafeSvgFileBuffer(file, buffer);

  if (!isAllowedMediaUploadFile(file)) {
    throw new UnsupportedMediaTypeError();
  }

  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    throw new UnsupportedMediaTypeError();
  }

  // 1. Try Cloudinary if configured
  if (cloudName && uploadPreset) {
    try {
      const cldFormData = new FormData();
      cldFormData.append('file', file);
      cldFormData.append('upload_preset', uploadPreset);

      const endpoint = isVideo
        ? `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`
        : `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const cldRes = await fetch(endpoint, {
        method: 'POST',
        body: cldFormData,
      });

      if (cldRes.ok) {
        const cldData = await cldRes.json();
        let finalUrl = cldData.secure_url || cldData.url;
        if (isVideo && finalUrl && finalUrl.includes('/video/upload/')) {
          finalUrl = finalUrl.replace('/video/upload/', '/video/upload/q_auto:eco,w_1280,c_limit,vc_auto/');
        }

        return {
          id: uniqueId,
          url: finalUrl,
          alt: alt || file.name.replace(/\.[^/.]+$/, ''),
          isPrimary,
          publicId: cldData.public_id,
          width: cldData.width || (isVideo ? 1280 : 1200),
          height: cldData.height || (isVideo ? 720 : 1600),
        };
      }
    } catch (cldErr) {
      console.warn('[Cloudinary Direct Upload Failed, falling back to local disk]:', cldErr);
    }
  }

  // 2. Save directly to public/uploads directory on local server
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = getFileExtension(file);
    const safeBaseName = (file.name || 'produit')
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 30) || 'media';

    const filename = `${safeBaseName}-${uniqueId}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    return {
      id: uniqueId,
      url: relativeUrl,
      alt: alt || file.name.replace(/\.[^/.]+$/, ''),
      isPrimary,
      width: 1200,
      height: 1600,
    };
  } catch (diskErr) {
    console.warn('[Disk storage failed, falling back to Data URI]:', diskErr);

    // 3. Last-resort fallback: Base64 Data URI
    if (!isAllowedMediaUploadFile(file)) {
      throw new UnsupportedMediaTypeError();
    }
    const ext = getFileExtension(file);
    const mimeType = ALLOWED_EXTENSION_TO_MIME[ext];
    if (!mimeType) {
      throw new UnsupportedMediaTypeError();
    }
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    if (ext === 'svg' && !isSafeSvgDataUri(dataUri)) {
      throw new UnsafeSvgUploadError();
    }

    return {
      id: uniqueId,
      url: dataUri,
      alt: alt || file.name.replace(/\.[^/.]+$/, ''),
      isPrimary,
      width: 1200,
      height: 1600,
    };
  }
}

export async function POST(req: NextRequest) {
  const lang = resolveApiLanguage(req);

  try {
    const contentType = req.headers.get('content-type') || '';

    // Case 1: JSON payload with URL
    if (contentType.includes('application/json')) {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return buildApiErrorResponse(lang, {
          status: 400,
          errorCode: 'INVALID_JSON',
          errorKey: 'api.error.invalid_json',
        });
      }

      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return buildApiErrorResponse(lang, {
          status: 400,
          errorCode: 'UPLOAD_INVALID_URL',
          errorKey: 'api.error.upload_invalid_url',
        });
      }
      const rawUrl = body.url;

      if (typeof rawUrl !== 'string' || !rawUrl.trim() || !isValidMediaUrl(rawUrl)) {
        return buildApiErrorResponse(lang, {
          status: 400,
          errorCode: 'UPLOAD_INVALID_URL',
          errorKey: 'api.error.upload_invalid_url',
        });
      }

      const normalizedUrl = normalizeImageUrl(rawUrl, { language: lang });
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      return NextResponse.json({
        success: true,
        image: {
          id,
          url: normalizedUrl,
          alt:
            body.alt ||
            getApiLocalizedMessage(lang, {
              fr: 'Photographie produit VIP TADJ',
              en: 'VIP TADJ product photography',
              ar: 'صورة منتج VIP TADJ',
            }),
          isPrimary: Boolean(body.isPrimary),
          width: 1200,
          height: 1600,
        },
      });
    }

    // Case 2: FormData payload with File or multiple Files
    let formData: FormData | null = null;
    try {
      formData = await req.formData();
    } catch {
      // Not form data
    }

    if (formData) {
      // Collect all files from 'file' or 'files'
      const rawFiles: File[] = [];
      const singleFile = formData.get('file');
      if (singleFile instanceof File && singleFile.size > 0) {
        rawFiles.push(singleFile);
      }

      const multiFiles = formData.getAll('files');
      for (const f of multiFiles) {
        if (f instanceof File && f.size > 0 && !rawFiles.includes(f)) {
          rawFiles.push(f);
        }
      }

      // Also check multiple entries under 'file'
      const allFileEntries = formData.getAll('file');
      for (const f of allFileEntries) {
        if (f instanceof File && f.size > 0 && !rawFiles.includes(f)) {
          rawFiles.push(f);
        }
      }

      if (rawFiles.length === 0) {
        return buildApiErrorResponse(lang, {
          status: 400,
          errorCode: 'UPLOAD_NO_FILE',
          errorKey: 'api.error.upload_no_file',
        });
      }

      // Pre-validate all uploaded files before writing any files to disk or Cloudinary
      for (const file of rawFiles) {
        const rawExt = getNormalizedFileExtension(file);
        const isSvg = isSvgUploadFile(file) || rawExt === 'svg' || rawExt === 'svgz';
        if (isSvg) {
          const buffer = await readFileBuffer(file);
          await assertSafeSvgFileBuffer(file, buffer);
        }
        if (!isAllowedMediaUploadFile(file)) {
          throw new UnsupportedMediaTypeError();
        }
        if (!isSvg) {
          const buffer = await readFileBuffer(file);
          if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
            throw new UnsupportedMediaTypeError();
          }
        }
      }

      const alt = (formData.get('alt') as string) || '';
      const isPrimary = formData.get('isPrimary') === 'true';

      // Check Cloudinary server credentials
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      const uploadedImages: ProductImage[] = [];

      for (let i = 0; i < rawFiles.length; i++) {
        const file = rawFiles[i];
        const primaryFlag = i === 0 ? isPrimary : false;
        const uploadedImg = await processUploadFile(file, alt, primaryFlag, cloudName, uploadPreset);
        uploadedImages.push(uploadedImg);
      }

      return NextResponse.json({
        success: true,
        url: uploadedImages[0]?.url,
        media: uploadedImages[0],
        image: uploadedImages[0],
        images: uploadedImages,
        count: uploadedImages.length,
      });
    }

    return buildApiErrorResponse(lang, {
      status: 400,
      errorCode: 'UPLOAD_FAILED',
      errorKey: 'api.error.upload_failed',
      frFallback: 'Type de contenu non supporté.',
    });
  } catch (error: any) {
    if (error instanceof UnsafeSvgUploadError) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'UPLOAD_UNSAFE_SVG',
        errorKey: 'api.error.upload_failed',
        frFallback: 'Le fichier SVG contient du contenu non sécurisé ou invalide.',
      });
    }
    if (error instanceof UnsupportedMediaTypeError) {
      return buildApiErrorResponse(lang, {
        status: 400,
        errorCode: 'UPLOAD_UNSUPPORTED_TYPE',
        errorKey: 'api.error.upload_failed',
        frFallback: 'Type de fichier média non supporté.',
      });
    }
    console.error('[API Media Upload Error]:', error);
    return buildApiErrorResponse(lang, {
      status: 500,
      errorCode: 'UPLOAD_FAILED',
      errorKey: 'api.error.upload_failed',
      frFallback: error?.message || 'Erreur lors du téléversement du média.',
    });
  }
}
