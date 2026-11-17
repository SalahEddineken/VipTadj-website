'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Link as LinkIcon,
  Sparkles,
  HelpCircle,
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  ExternalLink,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { ProductImage, ProductCategoryType } from '@/types';
import { normalizeImageUrl, isValidMediaUrl } from '@/lib/media/url-normalizer';
import { CURATED_MENSWEAR_ASSETS, CuratedAsset } from '@/lib/media/curated-assets';
import { GOOGLE_DRIVE_UPLOAD_GUIDE } from '@/lib/media/upload-service';
import { compressImageFile } from '@/lib/media/client-image-compressor';
import { cn } from '@/lib/utils/cn';

export interface AdminMediaUploadProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
  category?: ProductCategoryType;
  error?: string;
}

export function AdminMediaUpload({
  images = [],
  onChange,
  maxImages = 8,
  disabled = false,
  category = 'clothing',
  error,
}: AdminMediaUploadProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'library' | 'guide'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<ProductCategoryType | 'all'>(category || 'all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Helper to maintain single isPrimary invariant
  const enforceSinglePrimary = (list: ProductImage[]): ProductImage[] => {
    if (list.length === 0) return [];
    const hasPrimary = list.some((img) => img.isPrimary);
    if (!hasPrimary) {
      return list.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));
    }
    // If multiple primary, keep only the first marked one
    let primaryFound = false;
    return list.map((img) => {
      if (img.isPrimary && !primaryFound) {
        primaryFound = true;
        return { ...img, isPrimary: true };
      }
      return { ...img, isPrimary: false };
    });
  };

  const setPrimaryImage = (targetId: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === targetId,
    }));
    onChange(updated);
  };

  const removeImage = (targetId: string) => {
    const remaining = images.filter((img) => img.id !== targetId);
    onChange(enforceSinglePrimary(remaining));
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  const updateAltText = (id: string, newAlt: string) => {
    const updated = images.map((img) => (img.id === id ? { ...img, alt: newAlt } : img));
    onChange(updated);
  };

  // Add from URL input
  const handleAddUrl = () => {
    setUrlError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError('Veuillez saisir une URL ou un lien Google Drive.');
      return;
    }

    if (!isValidMediaUrl(trimmed)) {
      setUrlError('URL invalide ou non supportée. Utilisez un lien Google Drive, Cloudinary ou image direct.');
      return;
    }

    if (images.length >= maxImages) {
      setUrlError(`Nombre maximum d'images atteint (${maxImages}).`);
      return;
    }

    const normalized = normalizeImageUrl(trimmed);
    const newImage: ProductImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: normalized,
      alt: altInput.trim() || 'Photographie produit VIP TADJ',
      isPrimary: images.length === 0,
    };

    onChange(enforceSinglePrimary([...images, newImage]));
    setUrlInput('');
    setAltInput('');
  };

  // Process files (from file dialog or drop)
  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesToUpload = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (filesToUpload.length === 0) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        alert(`Nombre maximum d'images atteint (${maxImages}).`);
        return;
      }

      const filesToProcess = filesToUpload.slice(0, remainingSlots);
      setIsUploading(true);

      try {
        const newImages: ProductImage[] = [];

        for (let i = 0; i < filesToProcess.length; i++) {
          const rawFile = filesToProcess[i];
          setUploadStatus(
            filesToProcess.length > 1
              ? `Traitement et optimisation (${i + 1}/${filesToProcess.length})...`
              : 'Optimisation de la photo pour affichage haute définition...'
          );

          // Compress large camera photos in the browser (e.g. 12MB down to ~300KB)
          const compressedFile = await compressImageFile(rawFile, {
            maxWidth: 1600,
            maxHeight: 2000,
            quality: 0.85,
          });

          const formData = new FormData();
          formData.append('file', compressedFile);
          formData.append('alt', altInput.trim() || rawFile.name.replace(/\.[^/.]+$/, ''));
          formData.append('isPrimary', images.length === 0 && i === 0 ? 'true' : 'false');

          setUploadStatus(
            filesToProcess.length > 1
              ? `Téléversement (${i + 1}/${filesToProcess.length})...`
              : 'Téléversement en cours sur le serveur VIP TADJ...'
          );

          const res = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.image) {
            newImages.push(data.image);
          } else {
            console.error('Upload error:', data.error);
            alert(data.error || `Erreur lors du téléversement de ${rawFile.name}.`);
          }
        }

        if (newImages.length > 0) {
          onChange(enforceSinglePrimary([...images, ...newImages]));
        }
      } catch (err: any) {
        console.error('Upload failed:', err);
        alert('Échec de la communication avec le serveur média.');
      } finally {
        setIsUploading(false);
        setUploadStatus(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
    },
    [maxImages, images, altInput, onChange]
  );

  // Add from File Upload input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading || images.length >= maxImages) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processFiles(e.dataTransfer.files);
      }
    },
    [disabled, isUploading, images.length, maxImages, processFiles]
  );

  // Add from Curated Library
  const handleAddCurated = (asset: CuratedAsset) => {
    if (images.length >= maxImages) {
      alert(`Nombre maximum d'images atteint (${maxImages}).`);
      return;
    }

    if (images.some((img) => img.url === asset.url)) {
      return;
    }

    const newImage: ProductImage = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: asset.url,
      alt: asset.alt || asset.title,
      isPrimary: images.length === 0,
    };

    onChange(enforceSinglePrimary([...images, newImage]));
  };

  const filteredAssets = CURATED_MENSWEAR_ASSETS.filter((asset) => {
    if (libraryFilter === 'all') return true;
    return asset.category === libraryFilter;
  });

  return (
    <div className="space-y-4">
      {/* Hidden file inputs for PC / Phone */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        disabled={disabled || isUploading || images.length >= maxImages}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        disabled={disabled || isUploading || images.length >= maxImages}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-semibold text-gold-400 uppercase tracking-wider">
            Galerie de Photos du Produit ({images.length}/{maxImages})
          </label>
          <p className="text-[11px] text-obsidian-400">
            Téléversez vos photos directement depuis votre ordinateur ou smartphone.
          </p>
        </div>

        {/* Quick action button always visible */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading || images.length >= maxImages}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 self-start sm:self-auto shadow-sm"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Téléversement...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Choisir photo (PC / Téléphone)</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gold-500/15 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            activeTab === 'upload'
              ? 'bg-gold-500 text-obsidian-950 font-semibold'
              : 'text-obsidian-300 hover:text-ivory hover:bg-obsidian-900'
          )}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Téléverser depuis l&apos;appareil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            activeTab === 'url'
              ? 'bg-gold-500 text-obsidian-950 font-semibold'
              : 'text-obsidian-300 hover:text-ivory hover:bg-obsidian-900'
          )}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Coller un lien (Drive / CDN)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            activeTab === 'library'
              ? 'bg-gold-500 text-obsidian-950 font-semibold'
              : 'text-obsidian-300 hover:text-ivory hover:bg-obsidian-900'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bibliothèque Prestige ({CURATED_MENSWEAR_ASSETS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guide')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-auto',
            activeTab === 'guide'
              ? 'bg-obsidian-800 text-gold-400 border border-gold-500/30'
              : 'text-obsidian-400 hover:text-gold-300'
          )}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Guide Google Drive</span>
        </button>
      </div>

      {/* Tab 1: Upload (with Drag & Drop + Camera) */}
      {activeTab === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'p-6 sm:p-8 rounded-xl border-2 border-dashed transition-all text-center space-y-4',
            isDragging
              ? 'border-gold-400 bg-gold-500/10 scale-[1.01]'
              : 'border-gold-500/30 bg-obsidian-950/70 hover:border-gold-500/50'
          )}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-gold-400" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-ivory">
              {isDragging
                ? 'Relâchez les images pour les téléverser immédiatement'
                : 'Glissez-déposez vos photos ou choisissez depuis votre appareil'}
            </p>
            <p className="text-xs text-obsidian-400">
              Compatible PC (Windows, Mac) et Téléphones (Android, iPhone) • PNG, JPG, WEBP
            </p>
            {uploadStatus && (
              <p className="text-xs text-gold-400 font-medium animate-pulse pt-2">
                {uploadStatus}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading || images.length >= maxImages}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-md cursor-pointer"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isUploading ? 'Téléversement...' : 'Parcourir les fichiers'}</span>
            </button>

            {/* Direct Camera Button (especially useful on mobile phones) */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={disabled || isUploading || images.length >= maxImages}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-obsidian-900 hover:bg-obsidian-800 border border-gold-500/30 text-gold-400 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Prendre une photo</span>
            </button>
          </div>

          <p className="text-[11px] text-obsidian-500">
            Sélection multiple autorisée (jusqu&apos;à {maxImages} photos par produit). Compression intelligente intégrée pour un chargement instantané.
          </p>
        </div>
      )}

      {/* Tab 2: URL / Google Drive */}
      {activeTab === 'url' && (
        <div className="p-4 rounded-xl bg-obsidian-950 border border-gold-500/20 space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-obsidian-300">
              Lien direct de l&apos;image ou lien de partage Google Drive
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://drive.google.com/file/d/... ou https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-xs placeholder:text-obsidian-600 focus:outline-none focus:border-gold-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-obsidian-300">
              Description alternative (Alt pour SEO & Accessibilité)
            </label>
            <input
              type="text"
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              placeholder="Ex : Veste de costume en velours noir col châle"
              className="w-full px-3.5 py-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-xs placeholder:text-obsidian-600 focus:outline-none focus:border-gold-500 transition-all"
            />
          </div>

          {urlError && <p className="text-xs text-rose-400">{urlError}</p>}

          <button
            type="button"
            onClick={handleAddUrl}
            disabled={disabled || images.length >= maxImages}
            className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Ajouter à la galerie
          </button>
        </div>
      )}

      {/* Tab 3: Curated Library */}
      {activeTab === 'library' && (
        <div className="p-4 rounded-xl bg-obsidian-950 border border-gold-500/20 space-y-3">
          <div className="flex items-center gap-2">
            {(['all', 'clothing', 'shoes', 'accessories'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setLibraryFilter(cat)}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                  libraryFilter === cat
                    ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 font-semibold'
                    : 'text-obsidian-400 hover:text-ivory'
                )}
              >
                {cat === 'all'
                  ? 'Tous'
                  : cat === 'clothing'
                  ? 'Vêtements'
                  : cat === 'shoes'
                  ? 'Chaussures'
                  : 'Accessoires'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
            {filteredAssets.map((asset) => {
              const isSelected = images.some((img) => img.url === asset.url);
              return (
                <div
                  key={asset.id}
                  onClick={() => !isSelected && handleAddCurated(asset)}
                  className={cn(
                    'relative rounded-lg overflow-hidden border transition-all cursor-pointer group bg-obsidian-900',
                    isSelected
                      ? 'border-emerald-500/50 opacity-60 cursor-not-allowed'
                      : 'border-gold-500/20 hover:border-gold-500'
                  )}
                >
                  <div className="relative aspect-[3/4] w-full">
                    <img
                      src={asset.url}
                      alt={asset.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-1.5 bg-obsidian-950/90 text-[10px]">
                    <p className="text-ivory font-medium truncate">{asset.title}</p>
                    <p className="text-obsidian-400 truncate">{asset.subcategory}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-emerald-500 text-obsidian-950">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Guide Google Drive */}
      {activeTab === 'guide' && (
        <div className="p-4 rounded-xl bg-obsidian-950 border border-gold-500/20 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-gold-500/15 pb-2">
            <h4 className="font-semibold text-gold-400 font-cinzel">
              Hébergement Gratuit Google Drive : Guide d&apos;intégration
            </h4>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-[11px]"
            >
              <span>Ouvrir Google Drive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GOOGLE_DRIVE_UPLOAD_GUIDE.map((step) => (
              <div key={step.step} className="p-3 rounded-lg bg-obsidian-900 border border-gold-500/10 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gold-500/20 text-gold-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {step.step}
                  </span>
                  <span className="font-medium text-ivory">{step.title}</span>
                </div>
                <p className="text-obsidian-300 text-[11px] leading-relaxed">{step.instruction}</p>
                {step.tip && <p className="text-amber-400/90 text-[10px] italic">Astuce : {step.tip}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gallery Thumbnail Grid */}
      {images.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-obsidian-300">
            Photos associées au produit ({images.length}/{maxImages}) :
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                className={cn(
                  'relative rounded-xl overflow-hidden border bg-obsidian-950 flex flex-col group transition-all',
                  img.isPrimary ? 'border-gold-500 ring-1 ring-gold-500 shadow-luxury-subtle' : 'border-gold-500/20'
                )}
              >
                {/* Image display */}
                <div className="relative aspect-[3/4] w-full bg-obsidian-900">
                  <img
                    src={img.url}
                    alt={img.alt || 'Visuel produit'}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge or Action */}
                  {img.isPrimary ? (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gold-500 text-obsidian-950 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 fill-obsidian-950" />
                      <span>Photo Principale</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(img.id)}
                      className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-obsidian-900/90 hover:bg-gold-500 hover:text-obsidian-950 text-gold-400 text-[10px] font-semibold border border-gold-500/30 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      Définir principale
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-obsidian-900/90 hover:bg-rose-500 text-obsidian-300 hover:text-white opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all border border-obsidian-700 hover:border-rose-500 cursor-pointer"
                    title="Supprimer cette photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Alt & Reorder Footer */}
                <div className="p-2 space-y-1.5 bg-obsidian-900 border-t border-gold-500/10">
                  <input
                    type="text"
                    value={img.alt}
                    onChange={(e) => updateAltText(img.id, e.target.value)}
                    placeholder="Description alt..."
                    className="w-full px-2 py-1 rounded bg-obsidian-950 border border-gold-500/20 text-ivory text-[10px] focus:outline-none focus:border-gold-500"
                  />
                  <div className="flex items-center justify-between text-[10px] text-obsidian-400">
                    <span className="font-mono">#{idx + 1} {img.url.startsWith('/uploads/') ? '(Fichier local)' : ''}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'left')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Déplacer vers la gauche"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 'right')}
                        disabled={idx === images.length - 1}
                        className="p-1 rounded hover:bg-obsidian-800 disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Déplacer vers la droite"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
