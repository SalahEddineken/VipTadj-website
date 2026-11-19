'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Palette,
  Camera,
  UploadCloud,
  ImageIcon,
  Loader2,
  Shirt,
  Footprints,
  Watch,
  X,
  Link2,
} from 'lucide-react';
import { Product, ProductCategoryType, ProductImage, ProductColor } from '@/types';
import { formatDZD } from '@/lib/utils/formatDZD';
import { generateSlug, calculateTotalStock, validateProductForm } from '@/lib/validations/product';
import { AdminMediaUpload } from './AdminMediaUpload';
import { compressImageFile } from '@/lib/media/client-image-compressor';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { getColorNameFromHex, extractDominantColorFromFile } from '@/lib/utils/colorUtils';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';
import { formatTranslation } from '@/lib/i18n/locales';
import {
  getLocalizedProduct,
  getLocalizedCategoryName,
  getLocalizedSubcategory,
  getLocalizedColor,
  getLocalizedSize,
} from '@/lib/i18n/catalog-translations';
import { SUBCATEGORIES_BY_CATEGORY, getLocalizedSubcategories } from '@/lib/utils/catalogUtils';

export interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: Product | null;
}

const CATEGORY_SLUG_MAP: Record<ProductCategoryType, string> = {
  clothing: 'vetements',
  shoes: 'chaussures',
  accessories: 'accessoires',
};

const SUBCATEGORY_ALIASES: Record<string, string> = {
  richelieu: 'richelieus',
};

function normalizeSubcategoryForCategory(
  rawSub: string | undefined,
  cat: ProductCategoryType
): string {
  const list = SUBCATEGORIES_BY_CATEGORY[cat] || [];
  if (!rawSub || !rawSub.trim()) return list[0]?.id || '';
  const trimmed = rawSub.trim();
  const lower = trimmed.toLowerCase();
  const aliased = SUBCATEGORY_ALIASES[lower] || lower;
  const matched = list.find((s) => s.id.toLowerCase() === aliased);
  return matched ? matched.id : trimmed;
}

// Size Presets
const CLOTHING_STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

export function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const initialLocalized = initialData ? getLocalizedProduct(initialData, language) : null;

  // Form State
  const [title, setTitle] = useState(initialLocalized?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugLocked, setIsSlugLocked] = useState(mode === 'create');
  const [subtitle, setSubtitle] = useState(initialLocalized?.subtitle || '');
  const [description, setDescription] = useState(initialLocalized?.description || '');
  const [shortDescription, setShortDescription] = useState(initialLocalized?.shortDescription || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const materials = initialLocalized?.materials || '';
  const careInstructions = initialLocalized?.careInstructions || '';
  const fit = initialData?.fit || '';

  // Categorization
  const [categoryId, setCategoryId] = useState<ProductCategoryType>(
    initialData?.categoryId || 'clothing'
  );
  const [subcategory, setSubcategory] = useState(() =>
    normalizeSubcategoryForCategory(
      initialData?.subcategory,
      initialData?.categoryId || 'clothing'
    )
  );

  // Pricing
  const [price, setPrice] = useState<number | ''>(initialData?.price ?? '');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>(
    initialData?.compareAtPrice ?? ''
  );
  const [costPrice, setCostPrice] = useState<number | ''>(initialData?.costPrice ?? '');

  // Size Matrix & Stock
  const [sizeInventory, setSizeInventory] = useState<Record<string, number>>(() => {
    const isClothing = (initialData?.categoryId || 'clothing') === 'clothing';
    const tailorToStandard: Record<string, string> = {
      '48': 'S',
      '50': 'M',
      '52': 'L',
      '54': 'XL',
      '56': 'XXL',
    };

    if (initialData?.sizeInventory && Object.keys(initialData.sizeInventory).length > 0) {
      if (isClothing) {
        const raw = { ...initialData.sizeInventory };
        const hasTailor = Object.keys(raw).some((k) => tailorToStandard[k]);
        if (hasTailor) {
          const migrated: Record<string, number> = {};
          CLOTHING_STANDARD_SIZES.forEach((s) => {
            if (raw[s] !== undefined) migrated[s] = raw[s];
          });
          Object.entries(raw).forEach(([k, qty]) => {
            const mapped = tailorToStandard[k];
            if (mapped) {
              migrated[mapped] = (migrated[mapped] ?? 0) + qty;
            } else if (!tailorToStandard[k]) {
              migrated[k] = qty;
            }
          });
          return migrated;
        }
      }
      return { ...initialData.sizeInventory };
    }
    // If initialData has sizes but no sizeInventory
    if (initialData?.sizes && initialData.sizes.length > 0) {
      const cleanedSizes = isClothing
        ? Array.from(new Set(initialData.sizes.map((s) => tailorToStandard[s] || s)))
        : initialData.sizes;
      const initMap: Record<string, number> = {};
      const perSize = Math.max(1, Math.floor((initialData.stockQuantity || 10) / cleanedSizes.length));
      cleanedSizes.forEach((s) => {
        initMap[s] = perSize;
      });
      return initMap;
    }
    // Default matrix for clothing (international standard)
    return { S: 2, M: 4, L: 4, XL: 2, XXL: 1 };
  });

  // Images & Colors
  const [images, setImages] = useState<ProductImage[]>(initialData?.images || []);
  const [colors, setColors] = useState<ProductColor[]>(() =>
    (initialData?.colors || []).map((c) => ({
      ...c,
      name: getLocalizedColor(c.name, language),
    }))
  );
  const [uploadingColorIdx, setUploadingColorIdx] = useState<number | null>(null);
  const [targetColorIdxForUpload, setTargetColorIdxForUpload] = useState<number | null>(null);
  const [urlInputOpenIdx, setUrlInputOpenIdx] = useState<number | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);
  const fallbackSlugIdRef = useRef<string>(
    Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(1, 5).padEnd(4, 'x')
  );

  const handleColorFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetColorIdxForUpload === null) return;

    const cIdx = targetColorIdxForUpload;
    setUploadingColorIdx(cIdx);

    try {
      // Auto-extract dominant color from the uploaded photo
      const dominant = await extractDominantColorFromFile(file);

      const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 2000, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append(
        'alt',
        `${title || 'VIP TADJ'} - ${
          getLocalizedColor(dominant?.name || colors[cIdx]?.name || '', language) ||
          t('admin.product_form.color_photo_btn', 'Photo')
        }`
      );

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'x-lang': language,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image) {
        const next = [...colors];
        next[cIdx].imageUrl = data.image.url;

        // Auto-assign hex and color name from the photo if detected
        if (dominant) {
          next[cIdx].hex = dominant.hex;
          const currentName = next[cIdx].name;
          if (!currentName || currentName.startsWith('Coloris') || currentName.includes('Nouveau Coloris')) {
            next[cIdx].name = getLocalizedColor(dominant.name, language);
          }
        }

        setColors(next);

        // Also add to product gallery if not already present
        if (!images.some((img) => img.url === data.image.url)) {
          setImages((prev) => [...prev, data.image]);
        }
      } else {
        alert(
          data.errorKey
            ? t(data.errorKey, data.error)
            : language === 'fr' && data.error
            ? data.error
            : t('admin.product_form.color_upload_error', 'Erreur lors du téléversement pour ce coloris.')
        );
      }
    } catch (err) {
      console.error('Failed to upload color image:', err);
      alert(t('admin.product_form.color_upload_failed', 'Échec du téléversement de la photo de ce coloris.'));
    } finally {
      setUploadingColorIdx(null);
      setTargetColorIdxForUpload(null);
      if (colorFileInputRef.current) colorFileInputRef.current.value = '';
    }
  };

  // Flags
  const [inStock, setInStock] = useState<boolean>(initialData?.inStock ?? true);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState<boolean>(initialData?.isNewArrival ?? true);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(initialData?.isBestSeller ?? false);

  // Submission & Validation States
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const computeAutoSlug = (rawTitle: string): string => {
    const trimmed = rawTitle.trim();
    if (!trimmed) return '';
    const fromTitle = generateSlug(trimmed);
    if (fromTitle.length >= 3) return fromTitle;
    const fromSku = generateSlug(sku);
    if (fromSku.length >= 3) return fromSku;
    return `${categoryId}-${fallbackSlugIdRef.current}`;
  };

  // Auto-generate slug when title changes if locked
  useEffect(() => {
    if (mode === 'create' && isSlugLocked) {
      setSlug(computeAutoSlug(title));
    } else if (isSlugLocked && title.trim()) {
      setSlug(computeAutoSlug(title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, sku, categoryId, isSlugLocked, mode]);

  // Adjust subcategory when category changes
  const handleCategoryChange = (newCat: ProductCategoryType) => {
    setCategoryId(newCat);
    const available = SUBCATEGORIES_BY_CATEGORY[newCat];
    if (available && available.length > 0) {
      setSubcategory(available[0].id);
    }
    // Set default size matrix for new category
    if (newCat === 'clothing') {
      setSizeInventory({ S: 2, M: 4, L: 4, XL: 2, XXL: 1 });
    } else if (newCat === 'shoes') {
      setSizeInventory({ '39': 1, '40': 2, '41': 4, '42': 5, '43': 3, '44': 2, '45': 1 });
    } else {
      setSizeInventory({ 'Taille Unique': 10 });
    }
  };

  // Aggregate stock computation
  const totalStock = useMemo(() => calculateTotalStock(sizeInventory), [sizeInventory]);

  const handleSizeStockChange = (sizeKey: string, delta: number) => {
    setSizeInventory((prev) => {
      const current = prev[sizeKey] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [sizeKey]: next };
    });
  };

  const setExactSizeStock = (sizeKey: string, value: number) => {
    setSizeInventory((prev) => ({
      ...prev,
      [sizeKey]: Math.max(0, value),
    }));
  };

  // Pricing calculations
  const discountPercent = useMemo(() => {
    if (
      typeof price === 'number' &&
      typeof compareAtPrice === 'number' &&
      compareAtPrice > price &&
      price > 0
    ) {
      return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
    }
    return null;
  }, [price, compareAtPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);

    // Compute active sizes with qty > 0
    const activeSizes = Object.entries(sizeInventory)
      .filter(([_, qty]) => qty > 0)
      .map(([size]) => size);

    const isNonFrEdit = mode === 'edit' && language !== 'fr';

    const baseTitle =
      isNonFrEdit && initialData?.title
        ? title.trim()
          ? initialData.title
          : ''
        : title.trim();
    const baseSubtitle = isNonFrEdit ? initialData?.subtitle : subtitle.trim() || undefined;
    const baseDescription =
      isNonFrEdit && initialData?.description
        ? description.trim()
          ? initialData.description
          : ''
        : description.trim();
    const baseShortDescription = isNonFrEdit
      ? initialData?.shortDescription
      : shortDescription.trim() || undefined;
    const baseMaterials = isNonFrEdit ? initialData?.materials : materials.trim() || undefined;
    const baseCare = isNonFrEdit
      ? initialData?.careInstructions
      : careInstructions.trim() || undefined;

    const normalizedColors =
      colors.length > 0
        ? colors.map((c) => ({
            ...c,
            name: getLocalizedColor(c.name, 'fr'),
          }))
        : undefined;

    const payload = {
      title: baseTitle,
      ...(language === 'ar'
        ? title.trim()
          ? { titleAr: title.trim() }
          : {}
        : initialData?.titleAr
        ? { titleAr: initialData.titleAr }
        : {}),
      ...(language === 'en'
        ? title.trim()
          ? { titleEn: title.trim() }
          : {}
        : initialData?.titleEn
        ? { titleEn: initialData.titleEn }
        : {}),
      slug: slug.trim(),
      subtitle: baseSubtitle,
      ...(language === 'ar'
        ? subtitle.trim()
          ? { subtitleAr: subtitle.trim() }
          : {}
        : initialData?.subtitleAr
        ? { subtitleAr: initialData.subtitleAr }
        : {}),
      ...(language === 'en'
        ? subtitle.trim()
          ? { subtitleEn: subtitle.trim() }
          : {}
        : initialData?.subtitleEn
        ? { subtitleEn: initialData.subtitleEn }
        : {}),
      description: baseDescription,
      ...(language === 'ar'
        ? description.trim()
          ? { descriptionAr: description.trim() }
          : {}
        : initialData?.descriptionAr
        ? { descriptionAr: initialData.descriptionAr }
        : {}),
      ...(language === 'en'
        ? description.trim()
          ? { descriptionEn: description.trim() }
          : {}
        : initialData?.descriptionEn
        ? { descriptionEn: initialData.descriptionEn }
        : {}),
      shortDescription: baseShortDescription,
      ...(language === 'ar'
        ? shortDescription.trim()
          ? { shortDescriptionAr: shortDescription.trim() }
          : {}
        : initialData?.shortDescriptionAr
        ? { shortDescriptionAr: initialData.shortDescriptionAr }
        : {}),
      ...(language === 'en'
        ? shortDescription.trim()
          ? { shortDescriptionEn: shortDescription.trim() }
          : {}
        : initialData?.shortDescriptionEn
        ? { shortDescriptionEn: initialData.shortDescriptionEn }
        : {}),
      price: price === '' ? 0 : Number(price),
      compareAtPrice:
        compareAtPrice === '' || Number(compareAtPrice) <= 0 ? null : Number(compareAtPrice),
      costPrice: costPrice === '' ? undefined : Number(costPrice),
      categoryId,
      categorySlug: CATEGORY_SLUG_MAP[categoryId],
      subcategory,
      images,
      sizes: activeSizes.length > 0 ? activeSizes : Object.keys(sizeInventory),
      sizeInventory,
      colors: normalizedColors,
      stockQuantity: totalStock,
      inStock: totalStock > 0 && inStock,
      status: inStock ? 'active' : 'draft',
      isActive: inStock,
      isFeatured,
      isNewArrival,
      isBestSeller,
      sku: sku.trim() || undefined,
      materials: baseMaterials,
      ...(language === 'ar'
        ? materials.trim()
          ? { materialsAr: materials.trim() }
          : {}
        : initialData?.materialsAr
        ? { materialsAr: initialData.materialsAr }
        : {}),
      ...(language === 'en'
        ? materials.trim()
          ? { materialsEn: materials.trim() }
          : {}
        : initialData?.materialsEn
        ? { materialsEn: initialData.materialsEn }
        : {}),
      careInstructions: baseCare,
      ...(language === 'ar'
        ? careInstructions.trim()
          ? { careInstructionsAr: careInstructions.trim() }
          : {}
        : initialData?.careInstructionsAr
        ? { careInstructionsAr: initialData.careInstructionsAr }
        : {}),
      ...(language === 'en'
        ? careInstructions.trim()
          ? { careInstructionsEn: careInstructions.trim() }
          : {}
        : initialData?.careInstructionsEn
        ? { careInstructionsEn: initialData.careInstructionsEn }
        : {}),
      fit: fit.trim() || undefined,
    };

    const validation = validateProductForm(payload, language);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSubmitError(
        t('admin.product_form.validation_banner', 'Veuillez corriger les champs en rouge avant de valider.')
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/products' : `/api/products/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-lang': language,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(
          data.errorKey
            ? t(data.errorKey, data.error)
            : language === 'fr' && data.error
            ? data.error
            : t('admin.product_form.save_error', "Une erreur est survenue lors de l'enregistrement.")
        );
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(
        mode === 'create'
          ? t('admin.product_form.created_toast', 'Produit créé avec succès ! Redirection en cours...')
          : t('admin.product_form.updated_toast', 'Produit mis à jour avec succès !')
      );

      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error('Submit failed:', err);
      setSubmitError(t('admin.product_form.connect_error', 'Échec de connexion au serveur.'));
      setSubmitting(false);
    }
  };

  const localizedSubs = getLocalizedSubcategories(categoryId, language);
  const currentSubLabel = subcategory ? getLocalizedSubcategory(subcategory, language) : '';
  const hasCurrentSub = localizedSubs.some(
    (s) => s.id === subcategory || (currentSubLabel && s.label === currentSubLabel)
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-obsidian-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg bg-white border border-obsidian-200 text-gold-700 hover:bg-ivory-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-obsidian-950">
              {mode === 'create'
                ? t('admin.product_form.title_create', 'Nouveau Produit de Luxe')
                : formatTranslation(t('admin.product_form.title_edit', 'Éditer : {title}'), {
                    title: initialData ? getLocalizedProduct(initialData, language).title : '',
                  })}
            </h1>
            <p className="text-xs text-obsidian-500">
              {mode === 'create'
                ? t('admin.product_form.sub_create', "Ajout d'une pièce exclusive au catalogue VIP TADJ")
                : t('admin.product_form.sub_edit', 'Mise à jour des prix, photographies et stocks par taille')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-lg bg-white border border-obsidian-200 text-xs text-obsidian-700 hover:text-obsidian-950 transition-colors"
          >
            {t('admin.product_form.btn_cancel', 'Annuler')}
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
                <span>{t('admin.product_form.saving', 'Enregistrement...')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>
                  {mode === 'create'
                    ? t('admin.product_form.btn_publish', 'Publier le Produit')
                    : t('admin.product_form.btn_save', 'Enregistrer les Modifications')}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* SECTION 1: Informations Générales */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-700 border-b border-obsidian-100 pb-2">
          {t('admin.product_form.sec1', '1. Informations Générales & Présentation')}
        </h2>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
            {t('admin.product_form.label_title', 'Titre du Produit *')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('admin.product_form.ph_title', 'Ex : Veste Saharienne en Coton & Lin Naturel')}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg bg-white border text-obsidian-950 text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all',
              errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-obsidian-200'
            )}
          />
          {errors.title && <p className="text-xs text-rose-600">{errors.title}</p>}
        </div>

        {/* Slug Generator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.product_form.label_slug', 'Identifiant URL (Slug) *')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className="text-[11px] text-gold-700 hover:text-gold-800 flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {isSlugLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>
                  {isSlugLocked
                    ? t('admin.product_form.slug_locked', 'Verrouillé (Auto)')
                    : t('admin.product_form.slug_manual', 'Manuel')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSlug(computeAutoSlug(title))}
                className="text-[11px] text-obsidian-600 hover:text-obsidian-950 flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t('admin.product_form.slug_regenerate', 'Régénérer')}</span>
              </button>
            </div>
          </div>
          <div
            dir="ltr"
            className="flex items-center rounded-sm bg-ivory-100 border border-obsidian-200 overflow-hidden px-3 py-2 text-xs text-obsidian-500 font-mono"
          >
            <span className="shrink-0 select-none">https://viptadj.dz/product/</span>
            <input
              type="text"
              value={slug}
              readOnly={isSlugLocked}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-transparent text-gold-700 font-medium focus:outline-none px-1"
            />
          </div>
          {errors.slug && <p className="text-xs text-rose-600">{errors.slug}</p>}
        </div>
      </div>

      {/* SECTION 2: Catégorisation Dynamique */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-700 border-b border-obsidian-100 pb-2">
          {t('admin.product_form.sec2', '2. Catégorie & Rayon')}
        </h2>

        {/* Category Radio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'clothing' as const,
              label: getLocalizedCategoryName('clothing', language),
              sub: t('admin.product_form.cat_clothing_sub', 'Vestes, Chemises, Pantalons, Manteaux'),
              icon: Shirt,
            },
            {
              id: 'shoes' as const,
              label: getLocalizedCategoryName('shoes', language),
              sub: t('admin.product_form.cat_shoes_sub', 'Richelieus, Oxfords, Bottines, Cuir'),
              icon: Footprints,
            },
            {
              id: 'accessories' as const,
              label: getLocalizedCategoryName('accessories', language),
              sub: t('admin.product_form.cat_accessories_sub', 'Cravates, Ceintures, Horlogerie'),
              icon: Watch,
            },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as ProductCategoryType)}
                className={cn(
                  'p-4 rounded-xl border text-start transition-all flex flex-col justify-between',
                  categoryId === cat.id
                    ? 'bg-gold-50 border-gold-500 ring-1 ring-gold-500 text-gold-900 shadow-luxury-subtle'
                    : 'bg-ivory-100/70 border-obsidian-200 text-obsidian-600 hover:border-gold-500/50'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-6 h-6 text-gold-600" />
                  {categoryId === cat.id && (
                    <span className="w-2 h-2 rounded-full bg-gold-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-obsidian-950">{cat.label}</p>
                  <p className="text-[11px] text-obsidian-500 mt-0.5">{cat.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Tarification en Dinars Algériens (DZD / DA) */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-700 border-b border-obsidian-100 pb-2">
          {t('admin.product_form.sec3', '3. Tarification en Dinars Algériens (DZD)')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Selling Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                {t('admin.product_form.label_price', 'Prix de Vente (DA) *')}
              </label>
              {typeof price === 'number' && price > 0 && (
                <span className="text-xs font-serif font-bold text-gold-700">
                  {formatDZD(price, { locale: language })}
                </span>
              )}
            </div>
            <input
              type="number"
              min={1}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder={t('admin.product_form.ph_price', 'Ex : 48500')}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg bg-white border text-obsidian-950 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500',
                errors.price ? 'border-rose-500 ring-1 ring-rose-500' : 'border-obsidian-200'
              )}
            />
            {errors.price && <p className="text-xs text-rose-600">{errors.price}</p>}
          </div>

          {/* Compare At Price (Strike-through) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                {t('admin.product_form.label_compare_price', "Prix d'origine barré (DA)")}
              </label>
              {discountPercent !== null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  -{discountPercent}%
                </span>
              )}
            </div>
            <input
              type="number"
              min={0}
              step={1}
              value={compareAtPrice}
              onChange={(e) =>
                setCompareAtPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              placeholder={t('admin.product_form.ph_compare_price', 'Ex : 55000')}
              className={cn(
                'w-full px-4 py-2.5 rounded-lg bg-white border text-obsidian-950 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500',
                errors.compareAtPrice ? 'border-rose-500 ring-1 ring-rose-500' : 'border-obsidian-200'
              )}
            />
            {errors.compareAtPrice && (
              <p className="text-xs text-rose-600">{errors.compareAtPrice}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Matrice de Tailles & Gestion des Stocks */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-100 pb-2">
          <div>
            <h2 className="font-cinzel text-base font-bold text-gold-700">
              {t('admin.product_form.sec4', '4. Gestion des Stocks & Tailles')}
            </h2>
            <p className="text-xs text-obsidian-500">
              {t(
                'admin.product_form.stock_desc',
                'Gérez les disponibilités réelles par taille. Les tailles à 0 apparaîtront grisées sur la boutique.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                totalStock > 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {totalStock > 0
                ? formatTranslation(t('admin.product_form.total_stock_badge', 'Stock Total : {count} unités'), {
                    count: totalStock,
                  })
                : t('pdp.stock.out_of_stock', 'Rupture de Stock')}
            </span>
          </div>
        </div>

        {/* Dynamic Size Steppers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(sizeInventory).map(([sizeKey, qty]) => (
            <div
              key={sizeKey}
              className={cn(
                'p-3 rounded-xl border text-center space-y-2 transition-all',
                qty > 0
                  ? 'bg-ivory-100 border-obsidian-200'
                  : 'bg-obsidian-50 border-obsidian-200 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-obsidian-950">
                  {getLocalizedSize(sizeKey, language)}
                </span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono',
                    qty > 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
                  )}
                >
                  {qty > 0
                    ? formatTranslation(t('admin.product_form.size_in_stock', '{count} en stock'), { count: qty })
                    : t('admin.product_form.size_out', 'Épuisé')}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSizeStockChange(sizeKey, -1)}
                  disabled={qty <= 0}
                  className="w-7 h-7 rounded bg-white hover:bg-ivory-200 text-gold-700 disabled:opacity-30 flex items-center justify-center text-sm font-bold border border-obsidian-200"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setExactSizeStock(sizeKey, parseInt(e.target.value || '0', 10))}
                  className="w-12 text-center py-1 rounded bg-white border border-obsidian-200 text-obsidian-950 text-xs font-mono focus:outline-none focus:border-gold-500"
                />
                <button
                  type="button"
                  onClick={() => handleSizeStockChange(sizeKey, 1)}
                  className="w-7 h-7 rounded bg-white hover:bg-ivory-200 text-gold-700 flex items-center justify-center text-sm font-bold border border-obsidian-200"
                >
                  +
                </button>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center justify-center gap-1 pt-1">
                {[0, 2, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setExactSizeStock(sizeKey, preset)}
                    className="px-1 py-0.5 rounded text-[9px] bg-white border border-obsidian-200 text-obsidian-600 hover:text-gold-700 hover:bg-gold-50"
                  >
                    {preset === 0 ? '0' : `+${preset}`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4b: Gestion des Coloris & Variantes */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-obsidian-100 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold-600" />
            <h2 className="font-cinzel text-base font-bold text-gold-700">
              {t('admin.product_form.sec4b_colors', '4b. Coloris Disponibles & Photos Associées')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              const defaultHex = '#111111';
              setColors((prev) => [
                ...prev,
                {
                  name: getLocalizedColor(getColorNameFromHex(defaultHex), language),
                  hex: defaultHex,
                  inStock: true,
                  imageUrl: '',
                },
              ]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-50 border border-gold-500/40 text-gold-800 text-xs font-medium hover:bg-gold-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('admin.product_form.btn_add_color', 'Ajouter un Coloris')}</span>
          </button>
        </div>

        <p className="text-xs text-obsidian-500">
          {t(
            'admin.product_form.colors_desc',
            "Définissez les coloris disponibles (ex: Noir Ébène, Marron Cognac). Lorsqu'un client clique sur un coloris, la photo principale s'adapte automatiquement."
          )}
        </p>

        {/* Quick Presets for Shoes and Clothing */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          <span className="text-[11px] text-obsidian-500 font-medium">
            {t('admin.product_form.quick_presets_label', 'Modèles rapides :')}
          </span>
          <button
            type="button"
            onClick={() => {
              setColors([
                {
                  name: getLocalizedColor('Marron Cognac', language),
                  hex: '#8B4513',
                  inStock: true,
                  imageUrl: images[0]?.url || 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
                },
                {
                  name: getLocalizedColor('Noir Ébène', language),
                  hex: '#111111',
                  inStock: true,
                  imageUrl: images[1]?.url || 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
                },
              ]);
            }}
            className="px-2.5 py-1 text-[11px] rounded bg-ivory-100 border border-obsidian-200 text-gold-800 hover:bg-gold-50 transition-colors"
          >
            👞 {t('admin.product_form.preset_shoes_duo', 'Duo Souliers : Marron & Noir')}
          </button>
          <button
            type="button"
            onClick={() => {
              setColors([
                {
                  name: getLocalizedColor('Noir Profond', language),
                  hex: '#111111',
                  inStock: true,
                  imageUrl: images[0]?.url || '',
                },
                {
                  name: getLocalizedColor('Bleu Nuit', language),
                  hex: '#1B2A4A',
                  inStock: true,
                  imageUrl: images[1]?.url || '',
                },
                {
                  name: getLocalizedColor('Gris Anthracite', language),
                  hex: '#36454F',
                  inStock: true,
                  imageUrl: images[2]?.url || '',
                },
              ]);
            }}
            className="px-2.5 py-1 text-[11px] rounded bg-ivory-100 border border-obsidian-200 text-gold-800 hover:bg-gold-50 transition-colors"
          >
            👔 {t('admin.product_form.preset_clothing_trio', 'Trio Couleurs : Noir, Bleu & Gris')}
          </button>
        </div>

        {/* Hidden input for color photo uploads */}
        <input
          ref={colorFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleColorFileUpload}
          className="hidden"
        />

        {colors.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-obsidian-200 rounded-xl text-obsidian-500 text-xs">
            {t(
              'admin.product_form.no_colors',
              'Aucun coloris configuré pour ce produit. Cliquez sur "Ajouter un Coloris" ou utilisez un modèle rapide.'
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {colors.map((colorItem, cIdx) => (
              <div
                key={cIdx}
                className="p-3.5 rounded-xl bg-ivory-100 border border-obsidian-200 flex flex-col gap-2.5"
              >
                {/* Header Row: Color swatch, Name, Stock toggle, Delete */}
                <div className="flex items-center justify-between gap-2.5 w-full">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Visual Color Swatch */}
                    <div
                      className="w-7 h-7 rounded-md border border-obsidian-300 overflow-hidden shrink-0 shadow-sm relative cursor-pointer"
                      style={{ backgroundColor: colorItem.hex }}
                      title={formatTranslation(
                        t('admin.product_form.color_swatch_title', 'Couleur : {hex} (Cliquer pour changer)'),
                        { hex: colorItem.hex }
                      )}
                    >
                      <input
                        type="color"
                        value={colorItem.hex}
                        onChange={(e) => {
                          const newHex = e.target.value;
                          const autoName = getLocalizedColor(getColorNameFromHex(newHex), language);
                          const next = [...colors];
                          next[cIdx].hex = newHex;
                          next[cIdx].name = autoName;
                          setColors(next);
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </div>

                    {/* Name input with Auto-Naming Button */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                      <input
                        type="text"
                        value={colorItem.name}
                        placeholder={t('admin.product_form.color_name_ph', 'Nom du coloris (ex: Noir Profond)')}
                        onChange={(e) => {
                          const next = [...colors];
                          next[cIdx].name = e.target.value;
                          setColors(next);
                        }}
                        className="flex-1 min-w-[100px] px-2.5 py-1.5 text-xs rounded bg-white border border-obsidian-200 text-obsidian-950 placeholder-obsidian-400 focus:outline-none focus:border-gold-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const autoName = getLocalizedColor(getColorNameFromHex(colorItem.hex), language);
                          const next = [...colors];
                          next[cIdx].name = autoName;
                          setColors(next);
                        }}
                        title={formatTranslation(
                          t('admin.product_form.color_auto_title', 'Détecter automatiquement le nom : {name}'),
                          { name: getLocalizedColor(getColorNameFromHex(colorItem.hex), language) }
                        )}
                        className="px-2 py-1.5 rounded bg-gold-50 hover:bg-gold-100 text-gold-700 hover:text-gold-800 border border-gold-500/40 transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('admin.product_form.color_auto_btn', 'Auto')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-obsidian-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={colorItem.inStock}
                        onChange={(e) => {
                          const next = [...colors];
                          next[cIdx].inStock = e.target.checked;
                          setColors(next);
                        }}
                        className="w-3.5 h-3.5 accent-gold-500 rounded"
                      />
                      <span className="text-[11px] hidden sm:inline">
                        {t('admin.product_form.color_in_stock', 'En stock')}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setColors(colors.filter((_, idx) => idx !== cIdx));
                      }}
                      className="p-1.5 rounded hover:bg-rose-50 text-obsidian-400 hover:text-rose-600 transition-colors"
                      aria-label={`${t('admin.product_form.color_delete_title', 'Supprimer ce coloris')} ${getLocalizedColor(colorItem.name, language)}`.trim()}
                      title={t('admin.product_form.color_delete_title', 'Supprimer ce coloris')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Photo Association Row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t border-obsidian-200 w-full">
                  {/* Thumbnail preview if an image is assigned */}
                  {colorItem.imageUrl && (
                    <div className="w-8 h-8 rounded border border-obsidian-200 overflow-hidden shrink-0 bg-white">
                      <img
                        src={normalizeImageUrl(colorItem.imageUrl, {
                          fallbackCategory: categoryId,
                          language,
                        })}
                        alt={getLocalizedColor(colorItem.name, language)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Dropdown to pick from existing gallery images */}
                  {images.length > 0 ? (
                    <select
                      value={colorItem.imageUrl || ''}
                      onChange={(e) => {
                        const next = [...colors];
                        next[cIdx].imageUrl = e.target.value;
                        setColors(next);
                      }}
                      className="flex-1 min-w-[140px] px-2 py-1.5 text-xs rounded bg-white border border-obsidian-200 text-obsidian-950 focus:outline-none focus:border-gold-500 truncate"
                      title={t('admin.product_form.color_photo_pick', 'Sélectionner une photo de la galerie...')}
                    >
                      <option value="">
                        {colorItem.imageUrl
                          ? t('admin.product_form.color_photo_detach', '-- Retirer la photo --')
                          : t('admin.product_form.color_photo_pick', 'Sélectionner une photo de la galerie...')}
                      </option>
                      {images.map((img, iIdx) => (
                        <option key={img.id || iIdx} value={img.url}>
                          {`${t('admin.product_form.color_photo_btn', 'Photo')} #${iIdx + 1}${img.isPrimary ? ' ★' : ''}${
                            img.alt && (language !== 'ar' || /[\u0600-\u06FF]/.test(img.alt))
                              ? ` - ${img.alt.slice(0, 25)}`
                              : ''
                          }`}
                        </option>
                      ))}
                      {colorItem.imageUrl && !images.some((img) => img.url === colorItem.imageUrl) && (
                        <option value={colorItem.imageUrl}>
                          {t('admin.product_form.color_photo_custom', 'Photo personnalisée (Téléversée / Externe)')}
                        </option>
                      )}
                    </select>
                  ) : (
                    <span className="text-[11px] text-obsidian-500 flex-1 truncate">
                      {colorItem.imageUrl
                        ? t('admin.product_form.color_photo_linked', 'Photo personnalisée liée')
                        : t('admin.product_form.color_no_gallery', 'Aucune photo dans la galerie (Section 5)')}
                    </span>
                  )}

                  {/* Button to choose from PC / Mobile */}
                  <button
                    type="button"
                    onClick={() => {
                      setTargetColorIdxForUpload(cIdx);
                      colorFileInputRef.current?.click();
                    }}
                    disabled={uploadingColorIdx === cIdx}
                    className="px-2.5 py-1.5 rounded bg-white hover:bg-gold-50 border border-obsidian-200 text-gold-700 text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    title={t('admin.product_form.color_photo_upload_title', 'Téléverser une photo pour ce coloris')}
                  >
                    {uploadingColorIdx === cIdx ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>{t('admin.product_form.color_photo_btn', 'Photo')}</span>
                  </button>

                  {/* Direct URL toggle button */}
                  <button
                    type="button"
                    onClick={() => setUrlInputOpenIdx(urlInputOpenIdx === cIdx ? null : cIdx)}
                    className={cn(
                      'p-1.5 rounded border text-xs flex items-center justify-center shrink-0 transition-colors',
                      urlInputOpenIdx === cIdx
                        ? 'bg-gold-50 border-gold-500 text-gold-700'
                        : 'bg-white border-obsidian-200 text-obsidian-500 hover:text-gold-700'
                    )}
                    title={t('admin.product_form.color_url_title', "Saisir ou modifier l'URL manuellement")}
                    aria-label={t('admin.product_form.color_url_title', "Saisir ou modifier l'URL manuellement")}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove photo button if an image is assigned */}
                  {colorItem.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...colors];
                        next[cIdx].imageUrl = '';
                        setColors(next);
                      }}
                      className="p-1.5 rounded hover:bg-rose-50 text-obsidian-400 hover:text-rose-600 transition-colors shrink-0"
                      title={t('admin.product_form.color_detach_title', 'Détacher la photo de ce coloris')}
                      aria-label={t('admin.product_form.color_detach_title', 'Détacher la photo de ce coloris')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Optional manual URL input (revealed only if user clicks the Link button) */}
                {urlInputOpenIdx === cIdx && (
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      dir="ltr"
                      value={colorItem.imageUrl || ''}
                      placeholder={t('admin.product_form.color_url_ph', "URL directe de l'image (https://...)")}
                      onChange={(e) => {
                        const next = [...colors];
                        next[cIdx].imageUrl = e.target.value;
                        setColors(next);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs rounded bg-white border border-obsidian-200 text-obsidian-950 placeholder-obsidian-400 focus:outline-none focus:border-gold-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setUrlInputOpenIdx(null)}
                      className="px-2 py-1 text-[10px] rounded bg-white border border-obsidian-200 text-obsidian-600 hover:text-obsidian-950"
                    >
                      {t('common.close', 'Fermer')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: Gestion des Visuels & Galerie d'Images */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-700 border-b border-obsidian-100 pb-2">
          {t('admin.product_form.sec5', '5. Photographies & Coloris')}
        </h2>

        <AdminMediaUpload
          images={images}
          onChange={setImages}
          category={categoryId}
          error={errors.images}
        />
      </div>

      {/* SECTION 6: Visibilité & Badges */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-4">
        <h2 className="font-cinzel text-base font-bold text-gold-700 border-b border-obsidian-100 pb-2">
          {t('admin.product_form.sec6', '6. Visibilité & Badges')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* In Stock Active */}
          <label className="p-3 rounded-xl bg-ivory-100 border border-obsidian-200 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-obsidian-950">
                {t('admin.product_form.vis_active_title', 'Article Actif')}
              </p>
              <p className="text-[10px] text-obsidian-500">
                {t('admin.product_form.vis_active_desc', 'Visible sur le catalogue')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>

          {/* Featured */}
          <label className="p-3 rounded-xl bg-ivory-100 border border-obsidian-200 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-obsidian-950">
                {t('admin.product_form.vis_featured_title', 'Sélection Prestige')}
              </p>
              <p className="text-[10px] text-obsidian-500">
                {t('admin.product_form.vis_featured_desc', 'Mis en vedette accueil')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>

          {/* New Arrival */}
          <label className="p-3 rounded-xl bg-ivory-100 border border-obsidian-200 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-obsidian-950">
                {t('admin.product_form.vis_new_title', 'Nouveauté')}
              </p>
              <p className="text-[10px] text-obsidian-500">
                {t('admin.product_form.vis_new_desc', "Badge 'Nouveau' doré")}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>

          {/* Best Seller */}
          <label className="p-3 rounded-xl bg-ivory-100 border border-obsidian-200 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-obsidian-950">
                {t('admin.product_form.vis_bestseller_title', 'Best-Seller')}
              </p>
              <p className="text-[10px] text-obsidian-500">
                {t('admin.product_form.vis_bestseller_desc', 'Pièce la plus prisée')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-obsidian-200">
        <Link
          href="/admin/products"
          className="px-4 py-2 rounded-lg bg-white border border-obsidian-200 text-xs text-obsidian-700 hover:text-obsidian-950 transition-colors"
        >
          {t('admin.product_form.btn_cancel', 'Annuler')}
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50"
        >
          {submitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
              <span>{t('admin.product_form.saving', 'Enregistrement...')}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>
                {mode === 'create'
                  ? t('admin.product_form.btn_publish', 'Publier le Produit')
                  : t('admin.product_form.btn_save', 'Enregistrer les Modifications')}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
