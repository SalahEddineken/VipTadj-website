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
import { cn } from '@/lib/utils/cn';

export interface ProductFormProps {
  mode: 'create' | 'edit';
  initialData?: Product | null;
}

const SUBCATEGORIES_BY_CATEGORY: Record<ProductCategoryType, { value: string; label: string }[]> = {
  clothing: [
    { value: 'costumes', label: 'Costumes & Smokings' },
    { value: 'blazers', label: 'Blazers & Vestes Sartoriales' },
    { value: 'chemises', label: 'Chemises Sur-Mesure' },
    { value: 'pantalons', label: 'Pantalons & Chinos Habillés' },
    { value: 'manteaux', label: 'Manteaux & Pardessus Laine' },
  ],
  shoes: [
    { value: 'richelieu', label: 'Richelieus & Brogues' },
    { value: 'oxfords', label: 'Oxfords Cuir Pleine Fleur' },
    { value: 'derbies', label: 'Derbies' },
    { value: 'mocassins', label: 'Mocassins & Loafers' },
    { value: 'bottines', label: 'Bottines & Chelsea Boots' },
    { value: 'sneakers', label: 'Sneakers Minimalistes Cuir' },
  ],
  accessories: [
    { value: 'cravates', label: 'Cravates & Nœuds Soie' },
    { value: 'ceintures', label: 'Ceintures Cuir Italien' },
    { value: 'montres', label: 'Montres & Horlogerie' },
    { value: 'boutons-manchette', label: 'Boutons de Manchette' },
    { value: 'maroquinerie', label: 'Portefeuilles & Mallettes' },
  ],
};

const CATEGORY_SLUG_MAP: Record<ProductCategoryType, string> = {
  clothing: 'vetements',
  shoes: 'chaussures',
  accessories: 'accessoires',
};

// Size Presets
const CLOTHING_STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const CLOTHING_TAILOR_SIZES = ['48', '50', '52', '54', '56'];
const SHOE_SIZES = ['39', '40', '41', '42', '43', '44', '45'];

export function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugLocked, setIsSlugLocked] = useState(mode === 'create');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [materials, setMaterials] = useState(initialData?.materials || '');
  const [careInstructions, setCareInstructions] = useState(initialData?.careInstructions || '');
  const [fit, setFit] = useState(initialData?.fit || 'Tailored Fit');

  // Categorization
  const [categoryId, setCategoryId] = useState<ProductCategoryType>(
    initialData?.categoryId || 'clothing'
  );
  const [subcategory, setSubcategory] = useState(
    initialData?.subcategory || SUBCATEGORIES_BY_CATEGORY['clothing'][0].value
  );

  // Pricing
  const [price, setPrice] = useState<number | ''>(initialData?.price ?? '');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>(
    initialData?.compareAtPrice ?? ''
  );
  const [costPrice, setCostPrice] = useState<number | ''>(initialData?.costPrice ?? '');

  // Size Matrix & Stock
  const [sizeInventory, setSizeInventory] = useState<Record<string, number>>(() => {
    if (initialData?.sizeInventory && Object.keys(initialData.sizeInventory).length > 0) {
      return { ...initialData.sizeInventory };
    }
    // If initialData has sizes but no sizeInventory
    if (initialData?.sizes && initialData.sizes.length > 0) {
      const initMap: Record<string, number> = {};
      const perSize = Math.max(1, Math.floor((initialData.stockQuantity || 10) / initialData.sizes.length));
      initialData.sizes.forEach((s) => {
        initMap[s] = perSize;
      });
      return initMap;
    }
    // Default matrix for clothing
    return { '48': 2, '50': 4, '52': 4, '54': 2, '56': 1 };
  });

  const [clothingSizeType, setClothingSizeType] = useState<'tailor' | 'standard'>('tailor');

  // Images & Colors
  const [images, setImages] = useState<ProductImage[]>(initialData?.images || []);
  const [colors, setColors] = useState<ProductColor[]>(initialData?.colors || []);
  const [uploadingColorIdx, setUploadingColorIdx] = useState<number | null>(null);
  const [targetColorIdxForUpload, setTargetColorIdxForUpload] = useState<number | null>(null);
  const [urlInputOpenIdx, setUrlInputOpenIdx] = useState<number | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  const handleColorFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || targetColorIdxForUpload === null) return;

    const cIdx = targetColorIdxForUpload;
    setUploadingColorIdx(cIdx);

    try {
      const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 2000, quality: 0.85 });
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('alt', `${title || 'Produit VIP TADJ'} - ${colors[cIdx]?.name || 'Coloris'}`);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.image) {
        const next = [...colors];
        next[cIdx].imageUrl = data.image.url;
        setColors(next);

        // Also add to product gallery if not already present
        if (!images.some((img) => img.url === data.image.url)) {
          setImages((prev) => [...prev, data.image]);
        }
      } else {
        alert(data.error || 'Erreur lors du téléversement pour ce coloris.');
      }
    } catch (err) {
      console.error('Failed to upload color image:', err);
      alert('Échec du téléversement de la photo de ce coloris.');
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

  // Auto-generate slug when title changes if locked
  useEffect(() => {
    if (isSlugLocked && title) {
      setSlug(generateSlug(title));
    }
  }, [title, isSlugLocked]);

  // Adjust subcategory when category changes
  const handleCategoryChange = (newCat: ProductCategoryType) => {
    setCategoryId(newCat);
    const available = SUBCATEGORIES_BY_CATEGORY[newCat];
    if (available && available.length > 0) {
      setSubcategory(available[0].value);
    }
    // Set default size matrix for new category
    if (newCat === 'clothing') {
      setSizeInventory({ '48': 2, '50': 4, '52': 4, '54': 2, '56': 1 });
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

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim(),
      shortDescription: shortDescription.trim() || undefined,
      price: price === '' ? 0 : Number(price),
      compareAtPrice: compareAtPrice === '' ? undefined : Number(compareAtPrice),
      costPrice: costPrice === '' ? undefined : Number(costPrice),
      categoryId,
      categorySlug: CATEGORY_SLUG_MAP[categoryId],
      subcategory,
      images,
      sizes: activeSizes.length > 0 ? activeSizes : Object.keys(sizeInventory),
      sizeInventory,
      colors: colors.length > 0 ? colors : undefined,
      stockQuantity: totalStock,
      inStock: totalStock > 0 && inStock,
      isFeatured,
      isNewArrival,
      isBestSeller,
      sku: sku.trim() || undefined,
      materials: materials.trim() || undefined,
      careInstructions: careInstructions.trim() || undefined,
      fit: fit.trim() || undefined,
    };

    const validation = validateProductForm(payload);
    if (!validation.valid) {
      setErrors(validation.errors);
      setSubmitError('Veuillez corriger les champs en rouge avant de valider.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      const url = mode === 'create' ? '/api/products' : `/api/products/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Une erreur est survenue lors de l\'enregistrement.');
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(
        mode === 'create'
          ? 'Produit créé avec succès ! Redirection en cours...'
          : 'Produit mis à jour avec succès !'
      );

      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1200);
    } catch (err: any) {
      console.error('Submit failed:', err);
      setSubmitError(err.message || 'Échec de connexion au serveur.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/15 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg bg-obsidian-950 border border-gold-500/20 text-gold-400 hover:bg-obsidian-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory">
              {mode === 'create' ? 'Nouveau Produit de Luxe' : `Éditer : ${initialData?.title}`}
            </h1>
            <p className="text-xs text-obsidian-300">
              {mode === 'create'
                ? 'Ajout d\'une pièce exclusive au catalogue VIP TADJ'
                : 'Mise à jour des prix, photographies et stocks par taille'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-lg bg-obsidian-950 border border-gold-500/20 text-xs text-obsidian-300 hover:text-ivory transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{mode === 'create' ? 'Publier le Produit' : 'Enregistrer'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {submitError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{submitError}</span>
        </div>
      )}

      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{submitSuccess}</span>
        </div>
      )}

      {/* SECTION 1: Informations Générales */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-400 border-b border-gold-500/10 pb-2">
          1. Informations Générales & Présentation
        </h2>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
            Titre du Produit *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Costume Deux Pièces en Laine Super 130s Lanificio Cerruti"
            className={cn(
              'w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 transition-all',
              errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gold-500/20'
            )}
          />
          {errors.title && <p className="text-xs text-rose-400">{errors.title}</p>}
        </div>

        {/* Slug Generator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Identifiant URL (Slug) *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSlugLocked(!isSlugLocked)}
                className="text-[11px] text-gold-400 hover:text-gold-300 flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                {isSlugLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                <span>{isSlugLocked ? 'Verrouillé (Auto)' : 'Manuel'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSlug(generateSlug(title))}
                className="text-[11px] text-obsidian-300 hover:text-ivory flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Régénérer</span>
              </button>
            </div>
          </div>
          <div className="flex items-center rounded-sm bg-obsidian-900 border border-gold-500/20 overflow-hidden px-3 py-2 text-xs text-obsidian-300 font-mono">
            <span className="shrink-0 select-none">/product/</span>
            <input
              type="text"
              value={slug}
              readOnly={isSlugLocked}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-transparent text-gold-300 focus:outline-none px-1"
            />
          </div>
          {errors.slug && <p className="text-xs text-rose-400">{errors.slug}</p>}
        </div>

        {/* Subtitle & SKU */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Sous-titre / Exclusivité
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Ex : Édition Limitée Haute Façon"
              className="w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Référence SKU
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Ex : VT-SUIT-001"
              className="w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
            Description Détaillée *
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rédigez une description éditoriale haut de gamme décrivant la matière, la confection, et l'allure..."
            className={cn(
              'w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-gold-500 leading-relaxed',
              errors.description ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gold-500/20'
            )}
          />
          {errors.description && <p className="text-xs text-rose-400">{errors.description}</p>}
        </div>

        {/* Materials, Care, Fit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Matières & Tissage
            </label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="Ex : 100% Laine Vierge Super 130s"
              className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Entretien
            </label>
            <input
              type="text"
              value={careInstructions}
              onChange={(e) => setCareInstructions(e.target.value)}
              placeholder="Ex : Nettoyage à sec par spécialiste"
              className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Coupe (Fit)
            </label>
            <select
              value={fit}
              onChange={(e) => setFit(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              <option value="Tailored Fit">Tailored Fit (Ajustée moderne)</option>
              <option value="Slim Fit">Slim Fit (Cintrée)</option>
              <option value="Classic Fit">Classic Fit (Coupe droite)</option>
              <option value="Relaxed Fit">Relaxed Fit</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Catégorisation Dynamique */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-400 border-b border-gold-500/10 pb-2">
          2. Catégorie & Rayon VIP TADJ
        </h2>

        {/* Category Radio Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'clothing', label: 'Vêtements', sub: 'Costumes, Blazers, Chemises, Manteaux', icon: Shirt },
            { id: 'shoes', label: 'Chaussures', sub: 'Richelieus, Oxfords, Bottines, Cuir', icon: Footprints },
            { id: 'accessories', label: 'Accessoires', sub: 'Cravates, Ceintures, Horlogerie', icon: Watch },
          ].map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id as ProductCategoryType)}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all flex flex-col justify-between',
                  categoryId === cat.id
                    ? 'bg-obsidian-900 border-gold-500 ring-1 ring-gold-500 text-gold-300 shadow-luxury-subtle'
                    : 'bg-obsidian-900/40 border-gold-500/15 text-obsidian-300 hover:border-gold-500/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-6 h-6 text-gold-400" />
                  {categoryId === cat.id && (
                    <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-ivory">{cat.label}</p>
                  <p className="text-[11px] text-obsidian-300 mt-0.5">{cat.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Subcategory Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
            Sous-Catégorie Spécifique *
          </label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            {SUBCATEGORIES_BY_CATEGORY[categoryId].map((sub) => (
              <option key={sub.value} value={sub.value}>
                {sub.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 3: Tarification en Dinars Algériens (DZD / DA) */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-400 border-b border-gold-500/10 pb-2">
          3. Tarification en Dinars Algériens (DZD)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Selling Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
                Prix de Vente (DA) *
              </label>
              {typeof price === 'number' && price > 0 && (
                <span className="text-xs font-serif font-bold text-gold-400">
                  {formatDZD(price)}
                </span>
              )}
            </div>
            <input
              type="number"
              min={1}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="Ex : 48500"
              className={cn(
                'w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border text-ivory text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500',
                errors.price ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gold-500/20'
              )}
            />
            {errors.price && <p className="text-xs text-rose-400">{errors.price}</p>}
          </div>

          {/* Compare At Price (Strike-through) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
                Prix d&apos;origine barré (DA)
              </label>
              {discountPercent !== null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  -{discountPercent}%
                </span>
              )}
            </div>
            <input
              type="number"
              min={1}
              step={1}
              value={compareAtPrice}
              onChange={(e) =>
                setCompareAtPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10))
              }
              placeholder="Ex : 55000"
              className={cn(
                'w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border text-ivory text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500',
                errors.compareAtPrice ? 'border-rose-500 ring-1 ring-rose-500' : 'border-gold-500/20'
              )}
            />
            {errors.compareAtPrice && (
              <p className="text-xs text-rose-400">{errors.compareAtPrice}</p>
            )}
          </div>

          {/* Cost Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              Coût de Revient (Interne)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              placeholder="Ex : 22000"
              className="w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Matrice de Tailles & Gestion des Stocks */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold-500/10 pb-2">
          <div>
            <h2 className="font-cinzel text-base font-bold text-gold-400">
              4. Matrice de Tailles & Inventaire Stock
            </h2>
            <p className="text-xs text-obsidian-300">
              Gérez les disponibilités réelles par taille. Les tailles à 0 apparaîtront grisées sur la boutique.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                totalStock > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              )}
            >
              {totalStock > 0 ? `Stock Total : ${totalStock} unités` : 'Rupture de Stock'}
            </span>
          </div>
        </div>

        {/* Clothing Toggle (Tailor vs Standard) */}
        {categoryId === 'clothing' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-obsidian-300">Système de Tailles :</span>
            <button
              type="button"
              onClick={() => {
                setClothingSizeType('tailor');
                setSizeInventory({ '48': 2, '50': 4, '52': 4, '54': 2, '56': 1 });
              }}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                clothingSizeType === 'tailor'
                  ? 'bg-gold-500 text-obsidian-950 font-semibold'
                  : 'text-obsidian-300 hover:bg-obsidian-900'
              )}
            >
              Tailleur Italien (48 - 56)
            </button>
            <button
              type="button"
              onClick={() => {
                setClothingSizeType('standard');
                setSizeInventory({ S: 2, M: 4, L: 4, XL: 2, XXL: 1 });
              }}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                clothingSizeType === 'standard'
                  ? 'bg-gold-500 text-obsidian-950 font-semibold'
                  : 'text-obsidian-300 hover:bg-obsidian-900'
              )}
            >
              Standard International (S - XXL)
            </button>
          </div>
        )}

        {/* Dynamic Size Steppers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(sizeInventory).map(([sizeKey, qty]) => (
            <div
              key={sizeKey}
              className={cn(
                'p-3 rounded-xl border text-center space-y-2 transition-all',
                qty > 0
                  ? 'bg-obsidian-900 border-gold-500/30'
                  : 'bg-obsidian-900/40 border-obsidian-800 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-cinzel text-sm font-bold text-ivory">{sizeKey}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-mono',
                    qty > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                  )}
                >
                  {qty > 0 ? `${qty} en stock` : 'Épuisé'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSizeStockChange(sizeKey, -1)}
                  disabled={qty <= 0}
                  className="w-7 h-7 rounded bg-obsidian-950 hover:bg-obsidian-800 text-gold-400 disabled:opacity-30 flex items-center justify-center text-sm font-bold border border-gold-500/20"
                >
                  -
                </button>
                <input
                  type="number"
                  min={0}
                  value={qty}
                  onChange={(e) => setExactSizeStock(sizeKey, parseInt(e.target.value || '0', 10))}
                  className="w-12 text-center py-1 rounded bg-obsidian-950 border border-gold-500/20 text-ivory text-xs font-mono focus:outline-none focus:border-gold-500"
                />
                <button
                  type="button"
                  onClick={() => handleSizeStockChange(sizeKey, 1)}
                  className="w-7 h-7 rounded bg-obsidian-950 hover:bg-obsidian-800 text-gold-400 flex items-center justify-center text-sm font-bold border border-gold-500/20"
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
                    className="px-1 py-0.5 rounded text-[9px] bg-obsidian-950 text-obsidian-300 hover:text-gold-400 hover:bg-obsidian-800"
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
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-gold-500/10 pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold-400" />
            <h2 className="font-cinzel text-base font-bold text-gold-400">
              4b. Coloris Disponibles &amp; Photos Associées
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setColors((prev) => [
                ...prev,
                { name: 'Nouveau Coloris', hex: '#111111', inStock: true, imageUrl: '' },
              ]);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs hover:bg-gold-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter un Coloris</span>
          </button>
        </div>

        <p className="text-xs text-obsidian-300">
          Définissez les coloris disponibles pour cet article (ex: Noir Ébène, Marron Cognac). Lorsqu&apos;un client clique sur un coloris, la photo principale de la chaussure ou du vêtement s&apos;adapte automatiquement.
        </p>

        {/* Quick Presets for Shoes and Suits */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          <span className="text-[11px] text-obsidian-300 font-medium">Modèles rapides :</span>
          <button
            type="button"
            onClick={() => {
              setColors([
                {
                  name: 'Marron Cognac',
                  hex: '#8B4513',
                  inStock: true,
                  imageUrl: images[0]?.url || 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
                },
                {
                  name: 'Noir Ébène',
                  hex: '#111111',
                  inStock: true,
                  imageUrl: images[1]?.url || 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
                },
              ]);
            }}
            className="px-2.5 py-1 text-[11px] rounded bg-obsidian-900 border border-gold-500/20 text-gold-300 hover:bg-obsidian-800 transition-colors"
          >
            👞 Duo Souliers : Marron &amp; Noir
          </button>
          <button
            type="button"
            onClick={() => {
              setColors([
                {
                  name: 'Noir Profond',
                  hex: '#111111',
                  inStock: true,
                  imageUrl: images[0]?.url || '',
                },
                {
                  name: 'Bleu Nuit',
                  hex: '#1B2A4A',
                  inStock: true,
                  imageUrl: images[1]?.url || '',
                },
                {
                  name: 'Gris Anthracite',
                  hex: '#36454F',
                  inStock: true,
                  imageUrl: images[2]?.url || '',
                },
              ]);
            }}
            className="px-2.5 py-1 text-[11px] rounded bg-obsidian-900 border border-gold-500/20 text-gold-300 hover:bg-obsidian-800 transition-colors"
          >
            👔 Trio Costumes : Noir, Bleu &amp; Gris
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
          <div className="py-6 text-center border border-dashed border-gold-500/10 rounded-xl text-obsidian-300 text-xs">
            Aucun coloris configuré pour ce produit. Cliquez sur &quot;Ajouter un Coloris&quot; ou utilisez un modèle rapide.
          </div>
        ) : (
          <div className="space-y-3">
            {colors.map((colorItem, cIdx) => (
              <div
                key={cIdx}
                className="p-3.5 rounded-xl bg-obsidian-900/60 border border-gold-500/15 flex flex-col gap-2.5"
              >
                {/* Header Row: Color swatch, Name, Stock toggle, Delete */}
                <div className="flex items-center justify-between gap-2.5 w-full">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Visual Color Swatch */}
                    <div
                      className="w-7 h-7 rounded-md border border-gold-500/40 overflow-hidden shrink-0 shadow-sm relative cursor-pointer"
                      style={{ backgroundColor: colorItem.hex }}
                      title={`Couleur : ${colorItem.hex} (Cliquer pour changer)`}
                    >
                      <input
                        type="color"
                        value={colorItem.hex}
                        onChange={(e) => {
                          const next = [...colors];
                          next[cIdx].hex = e.target.value;
                          setColors(next);
                        }}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                    </div>

                    {/* Name input */}
                    <input
                      type="text"
                      value={colorItem.name}
                      placeholder="Nom du coloris (ex: Noir Profond)"
                      onChange={(e) => {
                        const next = [...colors];
                        next[cIdx].name = e.target.value;
                        setColors(next);
                      }}
                      className="flex-1 min-w-[120px] px-2.5 py-1.5 text-xs rounded bg-obsidian-950 border border-gold-500/20 text-ivory placeholder-obsidian-500 focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs text-obsidian-300 cursor-pointer select-none">
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
                      <span className="text-[11px] hidden sm:inline">En stock</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setColors(colors.filter((_, idx) => idx !== cIdx));
                      }}
                      className="p-1.5 rounded hover:bg-rose-500/10 text-obsidian-400 hover:text-rose-400 transition-colors"
                      aria-label={`Supprimer ${colorItem.name}`}
                      title="Supprimer ce coloris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Photo Association Row */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 border-t border-gold-500/10 w-full">
                  {/* Thumbnail preview if an image is assigned */}
                  {colorItem.imageUrl && (
                    <div className="w-8 h-8 rounded border border-gold-500/40 overflow-hidden shrink-0 bg-obsidian-950">
                      <img
                        src={normalizeImageUrl(colorItem.imageUrl)}
                        alt={colorItem.name}
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
                      className="flex-1 min-w-[140px] px-2 py-1.5 text-xs rounded bg-obsidian-950 border border-gold-500/20 text-ivory focus:outline-none focus:border-gold-500 truncate"
                      title="Associer une photo de la galerie à ce coloris"
                    >
                      <option value="">
                        {colorItem.imageUrl ? '-- Retirer la photo --' : 'Sélectionner une photo de la galerie...'}
                      </option>
                      {images.map((img, iIdx) => (
                        <option key={img.id || iIdx} value={img.url}>
                          Photo #{iIdx + 1} {img.isPrimary ? '★' : ''} {img.alt ? `- ${img.alt.slice(0, 25)}` : ''}
                        </option>
                      ))}
                      {colorItem.imageUrl && !images.some((img) => img.url === colorItem.imageUrl) && (
                        <option value={colorItem.imageUrl}>Photo personnalisée (Téléversée / Externe)</option>
                      )}
                    </select>
                  ) : (
                    <span className="text-[11px] text-obsidian-400 flex-1 truncate">
                      {colorItem.imageUrl ? 'Photo personnalisée liée' : 'Aucune photo dans la galerie (Section 5)'}
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
                    className="px-2.5 py-1.5 rounded bg-obsidian-950 hover:bg-gold-500/20 border border-gold-500/30 text-gold-400 text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    title="Téléverser une photo pour ce coloris depuis PC ou Mobile"
                  >
                    {uploadingColorIdx === cIdx ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Photo</span>
                  </button>

                  {/* Direct URL toggle button */}
                  <button
                    type="button"
                    onClick={() => setUrlInputOpenIdx(urlInputOpenIdx === cIdx ? null : cIdx)}
                    className={cn(
                      'p-1.5 rounded border text-xs flex items-center justify-center shrink-0 transition-colors',
                      urlInputOpenIdx === cIdx
                        ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                        : 'bg-obsidian-950 border-gold-500/20 text-obsidian-400 hover:text-gold-300'
                    )}
                    title="Saisir ou modifier l'URL manuellement"
                    aria-label="Saisir une URL"
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
                      className="p-1.5 rounded hover:bg-rose-500/10 text-obsidian-400 hover:text-rose-400 transition-colors shrink-0"
                      title="Détacher la photo de ce coloris"
                      aria-label="Détacher la photo"
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
                      value={colorItem.imageUrl || ''}
                      placeholder="URL directe de l'image (https://...)"
                      onChange={(e) => {
                        const next = [...colors];
                        next[cIdx].imageUrl = e.target.value;
                        setColors(next);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs rounded bg-obsidian-950 border border-gold-500/30 text-ivory placeholder-obsidian-500 focus:outline-none focus:border-gold-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setUrlInputOpenIdx(null)}
                      className="px-2 py-1 text-[10px] rounded bg-obsidian-950 border border-gold-500/20 text-obsidian-300 hover:text-ivory"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: Gestion des Visuels & Galerie d'Images */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-5">
        <h2 className="font-cinzel text-base font-bold text-gold-400 border-b border-gold-500/10 pb-2">
          5. Visuels & Galerie Haute Définition
        </h2>

        <AdminMediaUpload
          images={images}
          onChange={setImages}
          category={categoryId}
          error={errors.images}
        />
      </div>

      {/* SECTION 6: Visibilité & Badges */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-4">
        <h2 className="font-cinzel text-base font-bold text-gold-400 border-b border-gold-500/10 pb-2">
          6. Visibilité & Badges sur la Boutique
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* In Stock Active */}
          <label className="p-3 rounded-xl bg-obsidian-900 border border-gold-500/20 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-ivory">Article Actif</p>
              <p className="text-[10px] text-obsidian-300">Visible sur le catalogue</p>
            </div>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => setInStock(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>

          {/* Featured */}
          <label className="p-3 rounded-xl bg-obsidian-900 border border-gold-500/20 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-ivory">Sélection Prestige</p>
              <p className="text-[10px] text-obsidian-300">Mis en vedette accueil</p>
            </div>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>

          {/* New Arrival */}
          <label className="p-3 rounded-xl bg-obsidian-900 border border-gold-500/20 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-ivory">Nouveauté</p>
              <p className="text-[10px] text-obsidian-300">Badge &apos;Nouveau&apos; doré</p>
            </div>
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="w-4 h-4 accent-gold-500 rounded cursor-pointer"
            />
          </label>

          {/* Best Seller */}
          <label className="p-3 rounded-xl bg-obsidian-900 border border-gold-500/20 flex items-center justify-between cursor-pointer group">
            <div>
              <p className="text-xs font-semibold text-ivory">Best-Seller</p>
              <p className="text-[10px] text-obsidian-300">Pièce la plus prisée</p>
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
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-500/15">
        <Link
          href="/admin/products"
          className="px-4 py-2 rounded-lg bg-obsidian-950 border border-gold-500/20 text-xs text-obsidian-300 hover:text-ivory transition-colors"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50"
        >
          {submitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{mode === 'create' ? 'Publier le Produit' : 'Enregistrer les Modifications'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
