import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { ProductImage } from '@/types';

// Helper to determine clean file extension
function getFileExtension(file: File): string {
  if (file.type) {
    const sub = file.type.split('/')[1]?.toLowerCase();
    if (sub === 'jpeg' || sub === 'jpg') return 'jpg';
    if (sub === 'png') return 'png';
    if (sub === 'webp') return 'webp';
    if (sub === 'gif') return 'gif';
    if (sub === 'svg+xml') return 'svg';
  }
  if (file.name && file.name.includes('.')) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && /^[a-z0-9]+$/.test(ext)) return ext;
  }
  return 'jpg';
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

  // 1. Try Cloudinary if configured
  if (cloudName && uploadPreset) {
    try {
      const cldFormData = new FormData();
      cldFormData.append('file', file);
      cldFormData.append('upload_preset', uploadPreset);

      const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cldFormData,
      });

      if (cldRes.ok) {
        const cldData = await cldRes.json();
        return {
          id: uniqueId,
          url: cldData.secure_url || cldData.url,
          alt: alt || file.name.replace(/\.[^/.]+$/, ''),
          isPrimary,
          publicId: cldData.public_id,
          width: cldData.width || 1200,
          height: cldData.height || 1600,
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
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
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

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
  try {
    const contentType = req.headers.get('content-type') || '';

    // Case 1: JSON payload with URL
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const rawUrl = body.url;

      if (!rawUrl || typeof rawUrl !== 'string') {
        return NextResponse.json(
          { success: false, error: "Une URL d'image valide est requise." },
          { status: 400 }
        );
      }

      const normalizedUrl = normalizeImageUrl(rawUrl);
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      return NextResponse.json({
        success: true,
        image: {
          id,
          url: normalizedUrl,
          alt: body.alt || 'Photographie produit VIP TADJ',
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
        return NextResponse.json(
          { success: false, error: 'Aucun fichier média reçu.' },
          { status: 400 }
        );
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
        image: uploadedImages[0],
        images: uploadedImages,
        count: uploadedImages.length,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Type de contenu non supporté.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[API Media Upload Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors du téléversement du média.' },
      { status: 500 }
    );
  }
}
