'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ZoomIn, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ProductImage, ProductColor } from '@/types';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { useLanguage } from '@/lib/context/language-context';

export interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
  categoryId?: string;
  selectedColor?: ProductColor | string | null;
}

export function ProductGallery({ images, title, categoryId, selectedColor }: ProductGalleryProps) {
  const { t } = useLanguage();
  const safeImages = useMemo(() => {
    return images && images.length > 0 ? images : [
      {
        id: 'default',
        url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
        alt: title,
        isPrimary: true,
      },
    ];
  }, [images, title]);

  // Primary image starts first
  const primaryIdx = safeImages.findIndex((img) => img.isPrimary);
  const initialIdx = primaryIdx >= 0 ? primaryIdx : 0;

  const [activeIdx, setActiveIdx] = useState(initialIdx);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const activeImage = safeImages[activeIdx] || safeImages[0];

  const heroUrl = normalizeImageUrl(activeImage.url, {
    width: 1200,
    quality: 90,
    fallbackCategory: categoryId,
  });

  // Switch active gallery image when color selection changes
  useEffect(() => {
    if (!selectedColor) return;
    const colorName = typeof selectedColor === 'string' ? selectedColor : selectedColor.name;
    const colorImageUrl =
      typeof selectedColor === 'object' && selectedColor ? selectedColor.imageUrl : undefined;

    // 1. Try matching image by exact color property
    let matchIdx = safeImages.findIndex(
      (img) => img.color && colorName && img.color.toLowerCase() === colorName.toLowerCase()
    );

    // 2. Try matching by direct imageUrl
    if (matchIdx === -1 && colorImageUrl) {
      matchIdx = safeImages.findIndex((img) => img.url === colorImageUrl);
    }

    // 3. Try matching by alt text containing color name
    if (matchIdx === -1 && colorName) {
      matchIdx = safeImages.findIndex((img) =>
        img.alt && img.alt.toLowerCase().includes(colorName.toLowerCase())
      );
    }

    if (matchIdx >= 0) {
      setActiveIdx(matchIdx);
    }
  }, [selectedColor, safeImages]);

  // Handle keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        setActiveIdx((prev) => (prev + 1) % safeImages.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, safeImages.length]);

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnail strip */}
      {safeImages.length > 1 && (
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none flex-shrink-0">
          {safeImages.map((img, idx) => {
            const thumbUrl = normalizeImageUrl(img.url, {
              width: 200,
              quality: 75,
              fallbackCategory: categoryId,
            });
            const isActive = idx === activeIdx;

            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`relative w-16 h-20 md:w-20 md:h-24 bg-sand-100 overflow-hidden border transition-all flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 ${
                  isActive
                    ? 'ring-2 ring-gold-500 border-gold-500'
                    : 'border-sand-200 hover:border-gold-300 opacity-70 hover:opacity-100'
                }`}
                aria-label={`${t('pdp.gallery.view_img', "Afficher l'image")} ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={img.alt || `${title} vignette ${idx + 1}`}
                  className="w-full h-full object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Hero Shot */}
      <div className="relative flex-1 aspect-[3/4] bg-sand-100 border border-sand-200 overflow-hidden shadow-luxury-subtle group">
        <img
          src={heroUrl}
          alt={activeImage.alt || title}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Magnify / Lightbox trigger */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          className="absolute top-4 end-4 p-2.5 bg-ivory/90 hover:bg-white text-obsidian-900 border border-sand-300 shadow-sm backdrop-blur-sm transition-colors rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          aria-label={t('pdp.gallery.zoom', "Agrandir l'image")}
        >
          <ZoomIn className="w-4 h-4 text-gold-700" />
        </button>

        {/* Image Counter indicator */}
        {safeImages.length > 1 && (
          <div className="absolute bottom-4 start-4 px-2.5 py-1 bg-obsidian-950/80 backdrop-blur-sm text-ivory text-xs tracking-widest font-sans tabular-nums uppercase">
            {activeIdx + 1} / {safeImages.length}
          </div>
        )}
      </div>

      {/* Lightbox / Zoom Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-obsidian-950/95 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 end-6 p-3 text-ivory hover:text-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 z-10"
            aria-label={t('pdp.gallery.close_zoom', 'Fermer la vue agrandie')}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous image */}
          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActiveIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length)
              }
              className="absolute start-4 top-1/2 -translate-y-1/2 p-3 text-ivory hover:text-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 z-10"
              aria-label={t('pdp.gallery.prev_img', 'Image précédente')}
            >
              <ChevronLeft className="w-8 h-8 rtl:rotate-180" />
            </button>
          )}

          {/* Main Fullscreen Image */}
          <div className="max-w-4xl max-h-[85vh] relative flex items-center justify-center">
            <img
              src={normalizeImageUrl(activeImage.url, { width: 1600, quality: 95 })}
              alt={activeImage.alt || title}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>

          {/* Next image */}
          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActiveIdx((prev) => (prev + 1) % safeImages.length)
              }
              className="absolute end-4 top-1/2 -translate-y-1/2 p-3 text-ivory hover:text-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 z-10"
              aria-label={t('pdp.gallery.next_img', 'Image suivante')}
            >
              <ChevronRight className="w-8 h-8 rtl:rotate-180" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
