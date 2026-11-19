'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Save,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Store,
  Truck,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  Film,
  Video,
  Upload,
  Eye,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { StoreSettings, CommuneShippingFeeOverride, Product, ProductCategoryType } from '@/types';
import { ALGERIAN_68_WILAYAS, AlgerianWilaya } from '@/lib/data/wilayas';
import { getCommunesByWilaya, searchCommunes } from '@/lib/data/communes';
import { formatEstimatedDays } from '@/lib/utils/deliveryUtils';
import { formatDZD } from '@/lib/utils/formatDZD';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';
import { formatTranslation } from '@/lib/i18n/locales';
import { initialProducts } from '@/lib/seed/seed-data';
import { getLocalizedProduct, getLocalizedCategoryName } from '@/lib/i18n/catalog-translations';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';

interface WilayaFeeItem {
  homeFee: number;
  deskFee: number;
  active: boolean;
}

export default function AdminSettingsPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Store Metadata State
  const [storeName, setStoreName] = useState('VIP TADJ');
  const [tagline, setTagline] = useState('Haute Couture Homme & Prêt-à-Porter Masculin');
  const [phone, setPhone] = useState('0550 00 00 00');
  const [whatsappNumber, setWhatsappNumber] = useState('0550 00 00 00');
  const [email, setEmail] = useState('contact@viptadj.dz');
  const [address, setAddress] = useState('Hydra, Alger, Algérie');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(15000);

  // Hero Background Video State
  const [heroVideoEnabled, setHeroVideoEnabled] = useState(true);
  const [heroVideoUrl, setHeroVideoUrl] = useState('/videos/20261117_170900.mp4');
  const [heroPosterUrl, setHeroPosterUrl] = useState('');
  const [heroOverlayOpacity, setHeroOverlayOpacity] = useState(65);
  const [heroPlaybackRate, setHeroPlaybackRate] = useState(1.0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadVideoError, setUploadVideoError] = useState<string | null>(null);

  // Featured Section State ("تشكيلاتنا المختارة")
  const [featuredEnabled, setFeaturedEnabled] = useState(true);
  const [featuredTitleAr, setFeaturedTitleAr] = useState('تشكيلاتنا المختارة');
  const [featuredTitleFr, setFeaturedTitleFr] = useState(language === 'ar' ? '' : 'Créations Emblématiques');
  const [featuredTitleEn, setFeaturedTitleEn] = useState(language === 'ar' ? '' : 'Signature Creations');
  const [selectedFeaturedProductIds, setSelectedFeaturedProductIds] = useState<string[]>([
    'prod-blazer-royal-bordeaux',
    'prod-costume-trois-pieces-prince',
    'prod-smoking-ceremonie-noir',
    'prod-suit-01',
  ]);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<'all' | ProductCategoryType>('all');

  // 68 Wilayas Fee Matrix State
  const [wilayaFees, setWilayaFees] = useState<Record<number, WilayaFeeItem>>({});
  const [communeFees, setCommuneFees] = useState<Record<string, CommuneShippingFeeOverride>>({});
  const [expandedWilayas, setExpandedWilayas] = useState<Record<number, boolean>>({});
  const [communeSearchByWilaya, setCommuneSearchByWilaya] = useState<Record<number, string>>({});

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  // Batch zone inputs
  const [batchHomeFee, setBatchHomeFee] = useState<number | ''>('');
  const [batchDeskFee, setBatchDeskFee] = useState<number | ''>('');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Sync preview video playback speed in real time
  useEffect(() => {
    if (previewVideoRef.current) {
      previewVideoRef.current.playbackRate = heroPlaybackRate;
    }
  }, [heroPlaybackRate, heroVideoUrl, heroVideoEnabled]);

  // Fetch Settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings', {
          headers: { 'x-lang': language },
        });
        const data = await res.json();
        if (data.success && data.settings) {
          const s: StoreSettings = data.settings;
          setStoreName(s.storeName || 'VIP TADJ');
          setTagline(s.tagline || '');
          setPhone(s.phone || '');
          setWhatsappNumber(s.whatsappNumber || '');
          setEmail(s.email || '');
          setAddress(s.address || '');
          setFreeShippingThreshold(s.freeShippingThreshold ?? 15000);

          if (s.heroVideo) {
            setHeroVideoEnabled(s.heroVideo.enabled ?? true);
            setHeroVideoUrl(s.heroVideo.videoUrl || '/videos/20261117_170900.mp4');
            setHeroPosterUrl(s.heroVideo.posterUrl || '');
            setHeroOverlayOpacity(s.heroVideo.overlayOpacity ?? 65);
            setHeroPlaybackRate(s.heroVideo.playbackRate ?? 1.0);
          }

          if (s.featuredSection) {
            setFeaturedEnabled(s.featuredSection.enabled !== false);
            if (s.featuredSection.titleAr !== undefined) setFeaturedTitleAr(s.featuredSection.titleAr);
            if (s.featuredSection.title !== undefined) setFeaturedTitleFr(s.featuredSection.title);
            if (s.featuredSection.titleEn !== undefined) setFeaturedTitleEn(s.featuredSection.titleEn);
            if (Array.isArray(s.featuredSection.productIds) && s.featuredSection.productIds.length > 0) {
              setSelectedFeaturedProductIds(s.featuredSection.productIds);
            }
          }

          // Fetch products for featured showcase selection
          try {
            const prodRes = await fetch('/api/products');
            const prodData = await prodRes.json();
            if (prodData?.success && Array.isArray(prodData.products)) {
              setAllProducts(prodData.products);
            }
          } catch (prodErr) {
            console.error('Failed to load products for featured picker:', prodErr);
          }

          // Populate wilaya fees
          const initialMap: Record<number, WilayaFeeItem> = {};
          ALGERIAN_68_WILAYAS.forEach((w) => {
            const existing = s.wilayaShippingFees?.[w.code];
            if (existing) {
              initialMap[w.code] = {
                homeFee: existing.homeFee ?? w.homeDeliveryFee,
                deskFee: existing.deskFee ?? w.deskFee,
                active: existing.active ?? true,
              };
            } else {
              initialMap[w.code] = {
                homeFee: w.homeDeliveryFee,
                deskFee: w.deskFee,
                active: w.isAvailable ?? true,
              };
            }
          });
          setWilayaFees(initialMap);
          setCommuneFees(s.communeShippingFees || {});
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        showNotification('error', t('admin.settings.load_error', 'Erreur de chargement des paramètres.'));
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [t, language]);

  // Update specific wilaya fee
  const handleFeeChange = (code: number, field: 'homeFee' | 'deskFee', value: number) => {
    setWilayaFees((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: Math.max(0, value),
      },
    }));
  };

  const handleToggleWilayaActive = (code: number) => {
    setWilayaFees((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        active: !prev[code]?.active,
      },
    }));
  };

  // Baladiyat (Commune) Dropdown & Custom Pricing Helpers
  const toggleWilayaExpand = (code: number) => {
    setExpandedWilayas((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const getCommuneKey = (wilayaCode: number, communeName: string) => `${wilayaCode}:${communeName}`;

  const handleCommuneFeeChange = (
    wilayaCode: number,
    communeName: string,
    field: 'homeFee' | 'deskFee',
    rawValue: string
  ) => {
    const key = getCommuneKey(wilayaCode, communeName);
    setCommuneFees((prev) => {
      const next = { ...prev };
      const existing: CommuneShippingFeeOverride = { ...(next[key] || {}) };
      if (rawValue === '') {
        delete existing[field];
      } else {
        const parsed = parseInt(rawValue, 10);
        existing[field] = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
      }
      if (
        existing.homeFee === undefined &&
        existing.deskFee === undefined &&
        existing.active !== false
      ) {
        delete next[key];
      } else {
        next[key] = existing;
      }
      return next;
    });
  };

  const handleToggleCommuneActive = (wilayaCode: number, communeName: string) => {
    const key = getCommuneKey(wilayaCode, communeName);
    setCommuneFees((prev) => {
      const next = { ...prev };
      const existing: CommuneShippingFeeOverride = { ...(next[key] || {}) };
      const currentlyActive = existing.active !== false;
      if (currentlyActive) {
        existing.active = false;
        next[key] = existing;
      } else {
        delete existing.active;
        if (existing.homeFee === undefined && existing.deskFee === undefined) {
          delete next[key];
        } else {
          next[key] = existing;
        }
      }
      return next;
    });
  };

  const handleResetCommune = (wilayaCode: number, communeName: string) => {
    const key = getCommuneKey(wilayaCode, communeName);
    setCommuneFees((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleResetWilayaCommunes = (wilayaCode: number) => {
    const prefix = `${wilayaCode}:`;
    setCommuneFees((prev) => {
      const next: Record<string, CommuneShippingFeeOverride> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith(prefix)) {
          next[k] = v;
        }
      }
      return next;
    });
  };

  const customCommuneCountsByWilaya = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const key of Object.keys(communeFees)) {
      const code = parseInt(key.split(':')[0], 10);
      if (!Number.isNaN(code)) {
        counts[code] = (counts[code] || 0) + 1;
      }
    }
    return counts;
  }, [communeFees]);

  // Reset to Algerian official defaults
  const handleResetToDefaults = () => {
    if (confirm(t('admin.settings.reset_confirm', 'Voulez-vous rétablir les tarifs officiels par défaut pour les 68 Wilayas ?'))) {
      const defaultMap: Record<number, WilayaFeeItem> = {};
      ALGERIAN_68_WILAYAS.forEach((w) => {
        defaultMap[w.code] = {
          homeFee: w.homeDeliveryFee,
          deskFee: w.deskFee,
          active: true,
        };
      });
      setWilayaFees(defaultMap);
      setCommuneFees({});
      setFreeShippingThreshold(15000);
      setFeaturedEnabled(true);
      setFeaturedTitleAr('تشكيلاتنا المختارة');
      setFeaturedTitleFr(language === 'ar' ? '' : 'Créations Emblématiques');
      setFeaturedTitleEn(language === 'ar' ? '' : 'Signature Creations');
      setSelectedFeaturedProductIds([
        'prod-blazer-royal-bordeaux',
        'prod-costume-trois-pieces-prince',
        'prod-smoking-ceremonie-noir',
        'prod-suit-01',
      ]);
      showNotification('success', t('admin.settings.reset_success', 'Tarifs officiels par défaut restaurés.'));
    }
  };

  // Apply batch price to filtered zone
  const handleApplyBatchZone = () => {
    if (batchHomeFee === '' && batchDeskFee === '') return;

    setWilayaFees((prev) => {
      const updated = { ...prev };
      filteredWilayas.forEach((w) => {
        updated[w.code] = {
          ...updated[w.code],
          homeFee: batchHomeFee !== '' ? Number(batchHomeFee) : updated[w.code].homeFee,
          deskFee: batchDeskFee !== '' ? Number(batchDeskFee) : updated[w.code].deskFee,
        };
      });
      return updated;
    });

    showNotification('success', t('admin.settings.batch_success', 'Tarifs appliqués aux wilayas sélectionnées.'));
    setBatchHomeFee('');
    setBatchDeskFee('');
  };

  // Filtered Wilayas
  const filteredWilayas = useMemo(() => {
    return ALGERIAN_68_WILAYAS.filter((w) => {
      if (selectedZone !== 'all' && w.zone !== selectedZone) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = String(w.code).startsWith(q);
        const nameMatch = w.name.toLowerCase().includes(q);
        const arabicMatch = w.nameAr ? w.nameAr.includes(q) : false;
        if (!codeMatch && !nameMatch && !arabicMatch) return false;
      }
      return true;
    });
  }, [selectedZone, searchQuery]);

  // Zone tabs
  const zoneCounts = useMemo(() => {
    const counts: Record<string, number> = { all: ALGERIAN_68_WILAYAS.length };
    ALGERIAN_68_WILAYAS.forEach((w) => {
      counts[w.zone] = (counts[w.zone] || 0) + 1;
    });
    return counts;
  }, []);

  const zoneTabs = [
    { id: 'all', label: t('admin.settings.zone_all', 'Toutes les Wilayas'), count: zoneCounts.all },
    { id: 'alger', label: t('admin.settings.zone_alger', 'Alger'), count: zoneCounts.alger || 1 },
    { id: 'centre', label: t('admin.settings.zone_centre', 'Centre'), count: zoneCounts.centre || 8 },
    { id: 'est', label: t('admin.settings.zone_est', 'Est'), count: zoneCounts.est || 12 },
    { id: 'ouest', label: t('admin.settings.zone_ouest', 'Ouest'), count: zoneCounts.ouest || 9 },
    { id: 'hauts-plateaux', label: t('admin.settings.zone_hauts_plateaux', 'Hauts-Plateaux'), count: zoneCounts['hauts-plateaux'] || 19 },
    { id: 'sud', label: t('admin.settings.zone_sud', 'Grand Sud'), count: zoneCounts.sud || 19 },
  ];

  const getZoneLabel = (zone: string) => {
    switch (zone) {
      case 'alger':
        return t('admin.settings.zone_alger', 'Alger');
      case 'centre':
        return t('admin.settings.zone_centre', 'Centre');
      case 'est':
        return t('admin.settings.zone_est', 'Est');
      case 'ouest':
        return t('admin.settings.zone_ouest', 'Ouest');
      case 'hauts-plateaux':
        return t('admin.settings.zone_hauts_plateaux', 'Hauts-Plateaux');
      case 'sud':
        return t('admin.settings.zone_sud', 'Grand Sud');
      default:
        return zone;
    }
  };

  // Handle Direct Video Upload
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadVideoError(t('admin.settings.video_too_large', 'Le fichier vidéo ne doit pas dépasser 100 Mo.'));
      return;
    }

    setUploadingVideo(true);
    setUploadVideoError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alt', 'VIP TADJ Hero Background Video');

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'x-lang': language },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data?.success && (data.url || data.image?.url || data.media?.url)) {
        const url = data.url || data.image?.url || data.media?.url;
        setHeroVideoUrl(url);
        setHeroVideoEnabled(true);
        showNotification('success', t('admin.settings.video_upload_success', 'Vidéo téléversée avec succès ! N\'oubliez pas d\'enregistrer les modifications.'));
      } else {
        setUploadVideoError(
          data?.errorKey
            ? t(data.errorKey, data?.error)
            : language === 'fr' && data?.error
            ? data.error
            : t('admin.settings.video_upload_error', 'Échec du téléversement de la vidéo.')
        );
      }
    } catch (err: any) {
      setUploadVideoError(
        language === 'fr' && err?.message
          ? err.message
          : t('admin.settings.upload_network_error', 'Erreur réseau lors du téléversement.')
      );
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  // Featured Products ("تشكيلاتنا المختارة") Actions & Computations
  const handleToggleFeaturedProduct = (productId: string) => {
    setSelectedFeaturedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleMoveFeatured = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedFeaturedProductIds.length) return;
    setSelectedFeaturedProductIds((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleRemoveFeatured = (productId: string) => {
    setSelectedFeaturedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleResetFeaturedToDefault = () => {
    setSelectedFeaturedProductIds([
      'prod-blazer-royal-bordeaux',
      'prod-costume-trois-pieces-prince',
      'prod-smoking-ceremonie-noir',
      'prod-suit-01',
    ]);
  };

  const selectedFeaturedProductObjects = useMemo(() => {
    const map = new Map<string, Product>();
    allProducts.forEach((p) => map.set(p.id, p));
    return selectedFeaturedProductIds
      .map((id) => map.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [allProducts, selectedFeaturedProductIds]);

  const filteredCatalogProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (catalogCategory !== 'all' && p.categoryId !== catalogCategory) {
        return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const localized = getLocalizedProduct(p, language);
        const matchTitle = localized.title.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q));
        const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchSku) return false;
      }
      return true;
    });
  }, [allProducts, catalogCategory, catalogSearch, language]);

  // Save changes
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        storeName: storeName.trim(),
        tagline: tagline.trim(),
        phone: phone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        email: email.trim(),
        address: address.trim(),
        freeShippingThreshold: Number(freeShippingThreshold),
        wilayaShippingFees: wilayaFees,
        communeShippingFees: communeFees,
        heroVideo: {
          enabled: heroVideoEnabled,
          videoUrl: heroVideoUrl.trim(),
          posterUrl: heroPosterUrl.trim(),
          overlayOpacity: Number(heroOverlayOpacity),
          playbackRate: Number(heroPlaybackRate),
        },
        featuredSection: {
          enabled: featuredEnabled,
          title: featuredTitleFr.trim(),
          titleAr: featuredTitleAr.trim(),
          titleEn: featuredTitleEn.trim(),
          productIds: selectedFeaturedProductIds,
        },
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-lang': language,
        },
        body: JSON.stringify(payload),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // Non-JSON response
      }

      if (res.ok && data?.success) {
        window.dispatchEvent(new Event('vip-settings-updated'));
        showNotification('success', t('admin.settings.saved_toast', 'Paramètres et grille tarifaire enregistrés avec succès !'));
      } else {
        const mappedKeys = Array.isArray(data?.errorKeys)
          ? data.errorKeys.map((k: string) => t(k, k)).join(' | ')
          : data?.errorKeys && typeof data.errorKeys === 'object'
          ? Object.values(data.errorKeys).map((k: any) => t(String(k), String(k))).join(' | ')
          : null;
        const errorDetail =
          mappedKeys ||
          (data?.errorKey ? t(data.errorKey, data?.error) : null) ||
          (language === 'fr' && data?.errors ? Object.values(data.errors).join(' | ') : null);
        const errorMsg =
          errorDetail ||
          (language === 'fr' && data?.error ? data.error : null) ||
          (res.status
            ? formatTranslation(t('admin.settings.http_error', 'Erreur HTTP {status}'), { status: res.status })
            : null);
        showNotification('error', errorMsg || t('admin.settings.save_error', 'Erreur lors de l\'enregistrement.'));
      }
    } catch (err: any) {
      console.error('Save settings failed:', err);
      const isNetworkError = err?.name === 'TypeError' || err?.message?.toLowerCase().includes('fetch');
      showNotification('error', isNetworkError
        ? t('admin.settings.connect_error', 'Échec de connexion au serveur. Assurez-vous que le serveur (npm run dev) est actif.')
        : ((language === 'fr' && err?.message) || t('admin.settings.connect_error', 'Échec de connexion au serveur.'))
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-obsidian-900 space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-gold-500/20 border-t-gold-600 rounded-full animate-spin" />
        <p className="font-cinzel text-xs text-gold-700 tracking-wider">
          {t('admin.settings.loading', 'Chargement des paramètres de la boutique...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-obsidian-200 pb-6">
        <div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-obsidian-950">
            {t('admin.settings.title', 'Paramètres & Tarifs 68 Wilayas')}
          </h1>
          <p className="text-xs sm:text-sm text-obsidian-500 mt-1">
            {t('admin.settings.subtitle', 'Configuration des coordonnées VIP TADJ, du seuil de gratuité et des tarifs COD par wilaya')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 rounded-lg bg-white border border-obsidian-200 text-xs text-obsidian-700 hover:text-obsidian-950 hover:border-gold-500 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('admin.settings.default_rates', 'Tarifs par défaut')}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
                <span>{t('admin.settings.saving', 'Enregistrement...')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('admin.settings.save', 'Enregistrer')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'p-4 rounded-xl flex items-center justify-between gap-3 text-xs animate-fade-in',
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            aria-label={t('common.close', 'Fermer')}
            className="p-1 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: Store Metadata */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-obsidian-100 pb-3">
          <Store className="w-4 h-4 text-gold-600" />
          <h2 className="font-cinzel text-base font-bold text-gold-700">
            {t('admin.settings.sec_store', '1. Coordonnées de la Maison VIP TADJ')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.store_name', 'Nom de la Boutique')}
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.store_tagline', 'Slogan / Devise de Marque')}
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.store_phone', 'Téléphone Service Client & Confirmations')}
            </label>
            <div className="relative" dir="ltr">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-sm font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.store_whatsapp', 'Numéro WhatsApp Commercial')}
            </label>
            <div className="relative" dir="ltr">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                type="tel"
                dir="ltr"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-sm font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.store_email', 'Email Officiel')}
            </label>
            <div className="relative" dir="ltr">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.store_address', 'Adresse Principale (Alger)')}
            </label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-600" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Vidéo d'Ambiance Hero Showcase */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-100 pb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-gold-600" />
            <h2 className="font-cinzel text-base font-bold text-gold-700">
              {t('admin.settings.sec_hero_video', '2. Vidéo d\'Ambiance Page d\'Accueil (Hero Banner)')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={heroVideoEnabled}
              onClick={() => setHeroVideoEnabled(!heroVideoEnabled)}
              dir="ltr"
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                heroVideoEnabled ? 'bg-gold-500' : 'bg-obsidian-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                  heroVideoEnabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <span className="text-xs font-semibold text-obsidian-950">
              {heroVideoEnabled
                ? t('admin.settings.video_active', 'Vidéo Activée')
                : t('admin.settings.video_disabled', 'Vidéo Désactivée')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls column */}
          <div className="space-y-4">
            {/* Video Source URL & Default Preset */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                  {t('admin.settings.video_url_label', 'URL de la Vidéo (MP4 / WebM / Cloudinary)')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setHeroVideoUrl('/videos/20261117_170900.mp4');
                    setHeroPosterUrl('');
                    setHeroVideoEnabled(true);
                  }}
                  className="text-[11px] text-gold-700 hover:text-gold-800 underline transition-colors font-medium"
                >
                  {t('admin.settings.use_default_video', 'Vidéo par Défaut (20261117_170900.mp4)')}
                </button>
              </div>
              <div className="relative" dir="ltr">
                <Video className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-600" />
                <input
                  type="text"
                  dir="ltr"
                  value={heroVideoUrl}
                  onChange={(e) => setHeroVideoUrl(e.target.value)}
                  placeholder={t('admin.settings.video_url_ph', 'https://... ou /videos/20261117_170900.mp4')}
                  className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-xs sm:text-sm font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                />
              </div>
              <p className="text-[11px] text-obsidian-500">
                {t(
                  'admin.settings.video_url_hint',
                  'Saisissez un lien direct MP4/WebM ou téléversez un nouveau fichier ci-dessous.'
                )}
              </p>
            </div>

            {/* Direct Video File Upload */}
            <div className="p-4 rounded-lg bg-ivory-100 border border-obsidian-200 space-y-2">
              <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                {t('admin.settings.video_upload_label', 'Téléverser une Nouvelle Vidéo')}
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gold-500/60 hover:border-gold-600 hover:bg-gold-50 text-xs text-gold-800 font-medium cursor-pointer transition-all bg-white',
                    uploadingVideo && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {uploadingVideo ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-gold-600 border-t-transparent rounded-full animate-spin" />
                      <span>{t('admin.settings.uploading', 'Téléversement en cours...')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gold-600" />
                      <span>{t('admin.settings.select_video_file', 'Choisir un fichier vidéo (MP4, WebM)')}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    disabled={uploadingVideo}
                    onChange={handleVideoFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
              {uploadVideoError && (
                <p className="text-xs text-rose-700 mt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadVideoError}</span>
                </p>
              )}
            </div>

            {/* Overlay Opacity Slider */}
            <div className="space-y-2 p-4 rounded-lg bg-ivory-100 border border-obsidian-200">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                  {t('admin.settings.overlay_opacity', 'Voile Sombre de Contraste')}
                </label>
                <span className="text-xs font-mono font-bold text-gold-800 bg-white px-2 py-0.5 rounded border border-obsidian-200">
                  {heroOverlayOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="90"
                step="5"
                value={heroOverlayOpacity}
                onChange={(e) => setHeroOverlayOpacity(Number(e.target.value))}
                className="w-full accent-gold-500 cursor-pointer"
              />
              <p className="text-[11px] text-obsidian-500 leading-normal">
                {t(
                  'admin.settings.overlay_desc',
                  'Ajuste l\'assombrissement sur la vidéo pour garantir que les textes or et ivoire restent impeccablement lisibles.'
                )}
              </p>
            </div>

            {/* Video Playback Speed Slider */}
            <div className="space-y-2 p-4 rounded-lg bg-ivory-100 border border-obsidian-200">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                  {t('admin.settings.playback_speed', 'Vitesse de Lecture Vidéo')}
                </label>
                <span className="text-xs font-mono font-bold text-gold-800 bg-white px-2 py-0.5 rounded border border-obsidian-200" dir="ltr">
                  {heroPlaybackRate.toFixed(2).replace(/\.00$/, '.0')}×
                </span>
              </div>
              <input
                type="range"
                min="0.25"
                max="2.0"
                step="0.05"
                value={heroPlaybackRate}
                onChange={(e) => setHeroPlaybackRate(Number(e.target.value))}
                dir="ltr"
                className="w-full accent-gold-500 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-1.5 pt-1" dir="ltr">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setHeroPlaybackRate(speed)}
                    className={cn(
                      'flex-1 py-1 rounded text-[11px] font-mono font-semibold transition-all',
                      Math.abs(heroPlaybackRate - speed) < 0.01
                        ? 'bg-gold-500 text-obsidian-950 shadow-sm'
                        : 'bg-white text-obsidian-600 hover:text-obsidian-950 border border-obsidian-200'
                    )}
                  >
                    {speed}×
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-obsidian-500 leading-normal">
                {t(
                  'admin.settings.playback_speed_desc',
                  'Contrôlez la vitesse de la vidéo (plus lente pour un effet cinématique ou plus rapide).'
                )}
              </p>
            </div>

            {/* Poster / Fallback Image URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
                {t('admin.settings.poster_url_label', 'Image de couverture (Poster - Optionnel)')}
              </label>
              <input
                type="text"
                dir="ltr"
                value={heroPosterUrl}
                onChange={(e) => setHeroPosterUrl(e.target.value)}
                placeholder={t('admin.settings.poster_url_ph', 'https://... image de préchargement')}
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-xs focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          {/* Live Preview column */}
          <div className="space-y-2 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gold-700 font-semibold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5" />
              <span>{t('admin.settings.live_preview', 'Aperçu en Direct')}</span>
            </div>

            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gold-500/30 bg-obsidian-950 shadow-2xl flex items-center justify-center">
              {heroVideoEnabled && heroVideoUrl ? (
                <>
                  <video
                    ref={previewVideoRef}
                    key={heroVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={heroPosterUrl || undefined}
                    onLoadedMetadata={(e) => {
                      e.currentTarget.playbackRate = heroPlaybackRate;
                    }}
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={heroVideoUrl} type={heroVideoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                  </video>
                  {/* Opacity mask */}
                  <div
                    className="absolute inset-0 bg-obsidian-950 transition-opacity duration-200"
                    style={{ opacity: heroOverlayOpacity / 100 }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.15),transparent_60%)] pointer-events-none" />
                </>
              ) : (
                <div className="absolute inset-0 bg-obsidian-950 flex flex-col items-center justify-center p-4 text-center">
                  <Film className="w-8 h-8 text-obsidian-600 mb-2" />
                  <span className="text-xs text-obsidian-400">
                    {t('admin.settings.video_disabled_preview', 'Vidéo désactivée — Fond classique actif')}
                  </span>
                </div>
              )}

              {/* Sample Mockup Typography */}
              <div className="relative z-10 text-center px-4 max-w-sm pointer-events-none select-none">
                <span className="text-[10px] uppercase font-cinzel text-gold-400 tracking-widest block mb-1">
                  {t('admin.settings.hero_preview_season', 'Collection Automne-Hiver')}
                </span>
                <h4 className="font-serif text-sm sm:text-base md:text-lg font-bold text-ivory uppercase leading-tight mb-2">
                  {t('admin.settings.hero_preview_title', "L'Art du Vêtement & du Soulier")}
                </h4>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-sm bg-gold-500 text-obsidian-950 text-[10px] font-bold uppercase tracking-wider">
                    {t('admin.settings.hero_preview_cta1', 'Explorer')}
                  </span>
                  <span className="px-2.5 py-1 rounded-sm border border-neutral-600 text-ivory text-[10px] uppercase tracking-wider">
                    {t('admin.settings.hero_preview_cta2', 'Collection')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-obsidian-400 italic text-center">
              {t('admin.settings.preview_note', 'Le rendu s\'adapte automatiquement à la taille de l\'écran de vos visiteurs.')}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: تشكيلاتنا المختارة — Créations En Vedette */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-obsidian-100 pb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-gold-600" />
            <div>
              <h2 className="font-cinzel text-base font-bold text-gold-700">
                {t('admin.settings.sec_featured', '3. تشكيلاتنا المختارة — Créations En Vedette sur la Page d\'Accueil')}
              </h2>
              <p className="text-xs text-obsidian-500 mt-0.5">
                {t('admin.settings.featured_desc', 'Personnalisez le titre de la section et sélectionnez manuellement les produits phares affichés en vitrine sur la page d\'accueil.')}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              role="switch"
              aria-checked={featuredEnabled}
              onClick={() => setFeaturedEnabled(!featuredEnabled)}
              dir="ltr"
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                featuredEnabled ? 'bg-gold-500' : 'bg-obsidian-200'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                  featuredEnabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
            <span className="text-xs font-medium text-obsidian-700">
              {featuredEnabled ? (
                <span className="text-emerald-700 font-semibold">{t('common.active', 'Actif')}</span>
              ) : (
                <span className="text-obsidian-400">{t('common.inactive', 'Désactivé')}</span>
              )}
            </span>
          </div>
        </div>

        {/* Selected Products Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleResetFeaturedToDefault}
              className="px-2.5 py-1.5 rounded bg-white border border-obsidian-200 text-[11px] text-obsidian-700 hover:text-gold-700 hover:border-gold-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('admin.settings.featured_restore_default', 'Rétablir défaut (4)')}</span>
            </button>
            {selectedFeaturedProductIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFeaturedProductIds([])}
                className="px-2.5 py-1.5 rounded bg-white border border-rose-200 text-[11px] text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t('admin.settings.featured_clear_all', 'Vider la sélection')}</span>
              </button>
            )}
          </div>

          {selectedFeaturedProductObjects.length === 0 ? (
            <div className="p-4 rounded border border-dashed border-obsidian-200 text-center text-xs text-obsidian-500 bg-sand-50/50">
              {t('admin.settings.featured_empty', 'Aucun produit sélectionné. La boutique affichera automatiquement les articles marqués "En Vedette" du catalogue.')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {selectedFeaturedProductObjects.map((prod, index) => {
                const localized = getLocalizedProduct(prod, language);
                return (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded border border-gold-500/30 bg-gold-50/20 relative group hover:border-gold-500 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-14 h-16 rounded overflow-hidden bg-obsidian-100 shrink-0 border border-obsidian-200">
                        <img
                          src={normalizeImageUrl(prod.primaryImage || prod.images?.[0]?.url || '')}
                          alt={localized.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-0.5 start-0.5 bg-obsidian-950/80 text-gold-300 text-[10px] font-bold px-1 rounded">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-obsidian-950 line-clamp-1" title={localized.title}>
                          {localized.title}
                        </h4>
                        <span className="text-[10px] text-gold-700 uppercase tracking-wider block font-medium">
                          {getLocalizedCategoryName(prod.categoryId, language)}
                        </span>
                        <span className="text-xs font-semibold text-obsidian-900 tabular-nums">
                          {formatDZD(prod.price, { locale: language })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-gold-200/50 text-[11px]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveFeatured(index, 'up')}
                          disabled={index === 0}
                          title={t('admin.settings.featured_move_up', 'Déplacer vers l\'avant')}
                          className="p-1 rounded bg-white border border-obsidian-200 text-obsidian-700 hover:text-gold-700 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveFeatured(index, 'down')}
                          disabled={index === selectedFeaturedProductObjects.length - 1}
                          title={t('admin.settings.featured_move_down', 'Déplacer vers l\'arrière')}
                          className="p-1 rounded bg-white border border-obsidian-200 text-obsidian-700 hover:text-gold-700 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFeatured(prod.id)}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-medium flex items-center gap-0.5"
                      >
                        <X className="w-3 h-3" />
                        <span>{t('admin.settings.featured_remove', 'Retirer')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Catalog Picker to add products */}
        <div className="space-y-3 pt-3 border-t border-obsidian-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-obsidian-900">
              {t('admin.settings.featured_catalog_title', 'Ajouter des Créations depuis le Catalogue')}
            </h3>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'clothing', 'shoes', 'accessories'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                    catalogCategory === cat
                      ? 'bg-obsidian-950 text-gold-400'
                      : 'bg-obsidian-50 text-obsidian-600 hover:bg-obsidian-100'
                  )}
                >
                  {cat === 'all'
                    ? t('catalog.all_products', 'Tous')
                    : getLocalizedCategoryName(cat, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-obsidian-400 pointer-events-none" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder={t('admin.settings.featured_catalog_search', 'Rechercher un produit à ajouter par nom ou SKU...')}
              className="w-full ps-9 pe-4 py-2 rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs focus:outline-none focus:border-gold-500 focus-visible:ring-2 focus-visible:ring-gold-500"
            />
          </div>

          {/* Filtered Catalog List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1 border border-obsidian-100 rounded bg-obsidian-50/40">
            {filteredCatalogProducts.map((prod) => {
              const isSelected = selectedFeaturedProductIds.includes(prod.id);
              const localized = getLocalizedProduct(prod, language);
              return (
                <div
                  key={prod.id}
                  className={cn(
                    'p-2 rounded border bg-white flex items-center justify-between gap-2.5 transition-all',
                    isSelected ? 'border-gold-500 bg-gold-50/20 shadow-sm' : 'border-obsidian-200 hover:border-obsidian-300'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={normalizeImageUrl(prod.primaryImage || prod.images?.[0]?.url || '')}
                      alt={localized.title}
                      className="w-10 h-12 object-cover rounded bg-obsidian-100 shrink-0 border border-obsidian-200"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-obsidian-950 truncate" title={localized.title}>
                        {localized.title}
                      </p>
                      <p className="text-[10px] text-gold-700 font-medium">
                        {formatDZD(prod.price, { locale: language })}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFeaturedProduct(prod.id)}
                    className={cn(
                      'px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors',
                      isSelected
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-rose-100 hover:text-rose-800'
                        : 'bg-gold-500 text-obsidian-950 hover:bg-gold-600'
                    )}
                  >
                    {isSelected ? t('admin.settings.featured_is_selected', 'Sélectionné ✓') : t('common.add', '+ Ajouter')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: Seuil de Gratuité de Livraison */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-obsidian-100 pb-3">
          <Truck className="w-4 h-4 text-gold-600" />
          <h2 className="font-cinzel text-base font-bold text-gold-700">
            {t('admin.settings.sec_shipping_threshold', '4. Seuil de Livraison Gratuite (Offre Nationale 68 Wilayas)')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.min_amount_dzd', 'Montant Minimum d\'Achat (DZD / DA)')}
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={500}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full ps-4 pe-12 py-2.5 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 font-serif text-lg font-bold focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-gold-700 font-bold">
                {t('common.currency_short', 'DA')}
              </span>
            </div>
            <p className="text-xs text-obsidian-500">
              {t('admin.settings.free_shipping_desc', 'Toute commande égale ou supérieure à {amount} bénéficiera automatiquement de 0 DA de frais de livraison sur l\'ensemble des 68 Wilayas.').replace('{amount}', formatDZD(freeShippingThreshold, { locale: language }))}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-obsidian-700 uppercase tracking-wider">
              {t('admin.settings.quick_presets', 'Présélections Rapides')}
            </label>
            <div className="flex flex-wrap gap-2">
              {[10000, 15000, 20000, 25000, 30000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setFreeShippingThreshold(preset)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                    freeShippingThreshold === preset
                      ? 'bg-gold-500 text-obsidian-950 shadow-luxury-subtle'
                      : 'bg-ivory-100 hover:bg-ivory-200 text-obsidian-700 border border-obsidian-200'
                  )}
                >
                  {formatDZD(preset, { locale: language })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Grille Tarifaire des 68 Wilayas */}
      <div className="p-6 rounded-sm bg-white border border-obsidian-200 shadow-luxury-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-obsidian-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-gold-600" />
            <h2 className="font-cinzel text-base font-bold text-gold-700">
              {t('admin.settings.sec_wilayas', '5. Grille Tarifaire des 68 Wilayas d\'Algérie')}
            </h2>
          </div>
          <span className="text-xs text-obsidian-500">
            {t('admin.settings.wilayas_displayed', '{count} wilaya(s) affichée(s)').replace('{count}', String(filteredWilayas.length))}
          </span>
        </div>

        {/* Zone Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {zoneTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedZone(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                selectedZone === tab.id
                  ? 'bg-gold-500 text-obsidian-950 font-semibold'
                  : 'bg-ivory-100 text-obsidian-600 hover:text-obsidian-950 border border-obsidian-200'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  selectedZone === tab.id ? 'bg-obsidian-950/15 text-obsidian-950' : 'bg-white text-obsidian-600 border border-obsidian-200'
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Batch Zone Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.settings.search_ph', 'Chercher par code (16, 31) ou nom (Alger, Oran, الجزائر)...')}
              className="w-full ps-9 pe-8 py-2 rounded-lg bg-white border border-obsidian-200 text-obsidian-950 text-xs placeholder:text-obsidian-400 focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={t('common.close', 'Fermer')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-950 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Batch Zone Action */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-ivory-100 border border-obsidian-200">
            <span className="text-[11px] font-semibold text-gold-700 uppercase tracking-wider shrink-0 w-full sm:w-auto">
              {t('admin.settings.batch_apply', 'Appliquer à la sélection :')}
            </span>
            <input
              type="number"
              placeholder={t('admin.settings.home_rate_label', 'Tarif Domicile DA')}
              value={batchHomeFee}
              onChange={(e) => setBatchHomeFee(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full sm:w-28 px-2 py-1 rounded bg-white border border-obsidian-200 text-xs text-obsidian-950 font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            <input
              type="number"
              placeholder={t('admin.settings.desk_rate_label', 'Tarif Relais DA')}
              value={batchDeskFee}
              onChange={(e) => setBatchDeskFee(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full sm:w-28 px-2 py-1 rounded bg-white border border-obsidian-200 text-xs text-obsidian-950 font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            <button
              type="button"
              onClick={handleApplyBatchZone}
              disabled={batchHomeFee === '' && batchDeskFee === ''}
              className="w-full sm:w-auto px-3 py-1 rounded bg-gold-50 hover:bg-gold-100 text-gold-800 border border-gold-500/40 text-xs font-semibold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t('admin.settings.btn_apply', 'Appliquer')}
            </button>
          </div>
        </div>

        {/* Mobile Card Layout (Phone) */}
        <div className="md:hidden space-y-2.5 max-h-[620px] overflow-y-auto">
          {filteredWilayas.map((w) => {
            const currentFee = wilayaFees[w.code] || {
              homeFee: w.homeDeliveryFee,
              deskFee: w.deskFee,
              active: true,
            };
            const isExpanded = !!expandedWilayas[w.code];
            const allWilayaCommunes = getCommunesByWilaya(w.code);
            const customCount = customCommuneCountsByWilaya[w.code] || 0;
            const communeQuery = communeSearchByWilaya[w.code] || '';
            const visibleCommunes = isExpanded ? searchCommunes(w.code, communeQuery) : [];

            return (
              <div
                key={`mobile-${w.code}`}
                className={cn(
                  'rounded-sm border border-obsidian-200 bg-white overflow-hidden transition-colors',
                  !currentFee.active && 'opacity-60'
                )}
              >
                <div className="p-3 space-y-3">
                  {/* Card Header: Expand + Code + Name + Active */}
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleWilayaExpand(w.code)}
                      aria-expanded={isExpanded}
                      className="flex items-center gap-2 text-start flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                    >
                      <span
                        className={cn(
                          'w-7 h-7 rounded-sm border flex items-center justify-center shrink-0 transition-colors',
                          isExpanded
                            ? 'bg-gold-50 border-gold-500 text-gold-700'
                            : 'bg-ivory-100 border-obsidian-200 text-obsidian-500'
                        )}
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </span>
                      <span className="w-7 h-7 rounded-sm bg-gold-50 border border-gold-500/30 text-gold-800 font-sans tabular-nums font-bold text-xs flex items-center justify-center shrink-0">
                        {w.code}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-semibold text-obsidian-950 text-sm truncate">
                            {language === 'ar' ? (w.nameAr || w.name) : w.name}
                          </span>
                          {language !== 'ar' && w.nameAr && (
                            <span className="text-[11px] text-obsidian-500 font-arabic">
                              {w.nameAr}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-600">
                            {getZoneLabel(w.zone)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-500">
                            {t('admin.settings.baladiyat_count', '{count} baladiyat').replace(
                              '{count}',
                              String(allWilayaCommunes.length)
                            )}
                          </span>
                          {customCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-50 border border-gold-500/40 text-gold-800 font-semibold">
                              {t('admin.settings.baladiyat_custom_count', '{count} perso.').replace(
                                '{count}',
                                String(customCount)
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                      <input
                        type="checkbox"
                        checked={currentFee.active}
                        onChange={() => handleToggleWilayaActive(w.code)}
                        className="w-5 h-5 accent-gold-500 rounded-sm cursor-pointer"
                        aria-label={t('admin.settings.active_aria', 'Activer livraison {name}').replace(
                          '{name}',
                          language === 'ar' && w.nameAr ? w.nameAr : w.name
                        )}
                      />
                      <span className="text-[10px] text-obsidian-500 tabular-nums">
                        {formatEstimatedDays(w.estimatedDays, language)}
                      </span>
                    </div>
                  </div>

                  {/* Card Fee Inputs (2-column grid, no overflow) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-obsidian-600 mb-1">
                        {t('admin.settings.th_home_rate', 'Tarif Domicile (DA)')}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={currentFee.homeFee}
                          onChange={(e) =>
                            handleFeeChange(w.code, 'homeFee', parseInt(e.target.value || '0', 10))
                          }
                          className="w-full min-w-0 px-2.5 py-1.5 min-h-[38px] rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500"
                        />
                        <span className="text-[11px] text-gold-700 font-medium shrink-0">{t('common.currency_short', 'DA')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-obsidian-600 mb-1">
                        {t('admin.settings.th_desk_rate', 'Tarif Point Relais (DA)')}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={currentFee.deskFee}
                          onChange={(e) =>
                            handleFeeChange(w.code, 'deskFee', parseInt(e.target.value || '0', 10))
                          }
                          className="w-full min-w-0 px-2.5 py-1.5 min-h-[38px] rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500"
                        />
                        <span className="text-[11px] text-gold-700 font-medium shrink-0">{t('common.currency_short', 'DA')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Expanded Baladiyat Panel */}
                {isExpanded && (
                  <div className="border-t border-obsidian-200 bg-ivory-100 p-3 space-y-2.5">
                    <div className="relative">
                      <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-obsidian-400" />
                      <input
                        type="text"
                        value={communeQuery}
                        onChange={(e) =>
                          setCommuneSearchByWilaya((prev) => ({
                            ...prev,
                            [w.code]: e.target.value,
                          }))
                        }
                        placeholder={t(
                          'admin.settings.baladiyat_search_ph',
                          'Rechercher une baladiya par nom ou code postal...'
                        )}
                        className="w-full ps-8 pe-7 py-2 rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs placeholder:text-obsidian-400 focus:outline-none focus:border-gold-500"
                      />
                      {communeQuery && (
                        <button
                          type="button"
                          onClick={() =>
                            setCommuneSearchByWilaya((prev) => ({ ...prev, [w.code]: '' }))
                          }
                          aria-label={t('common.close', 'Fermer')}
                          className="absolute end-2 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-950"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-obsidian-600">
                      <span>
                        {t('admin.settings.baladiyat_default_hint', 'Défaut wilaya')}:{' '}
                        <strong className="text-gold-700 tabular-nums">
                          {currentFee.homeFee} / {currentFee.deskFee} {t('common.currency_short', 'DA')}
                        </strong>
                      </span>
                      {customCount > 0 && (
                        <button
                          type="button"
                          onClick={() => handleResetWilayaCommunes(w.code)}
                          className="px-2 py-1 rounded-sm bg-white border border-obsidian-200 text-gold-700 text-[11px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>
                            {t('admin.settings.baladiyat_reset_all', 'Réinitialiser les baladiyat')}
                          </span>
                        </button>
                      )}
                    </div>

                    {visibleCommunes.length === 0 ? (
                      <p className="text-xs text-obsidian-500 py-3 text-center">
                        {t('admin.settings.baladiyat_empty', 'Aucune baladiya correspondante.')}
                      </p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-2">
                        {visibleCommunes.map((commune) => {
                          const cKey = getCommuneKey(w.code, commune.name);
                          const override = communeFees[cKey];
                          const isCustomized = !!override;
                          const isCommuneActive = override?.active !== false;

                          return (
                            <div
                              key={`mobile-${cKey}`}
                              className={cn(
                                'p-2.5 rounded-sm border border-obsidian-200 bg-white space-y-2',
                                isCustomized && 'border-gold-500/60 bg-gold-50/40',
                                !isCommuneActive && 'opacity-50'
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-obsidian-950 text-xs">
                                    {language === 'ar'
                                      ? commune.nameAr || commune.name
                                      : commune.name}
                                  </span>
                                  {language !== 'ar' && commune.nameAr && (
                                    <span className="text-[11px] text-obsidian-500 font-arabic ms-1.5">
                                      {commune.nameAr}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {isCustomized && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetCommune(w.code, commune.name)}
                                      className="p-1 rounded-sm text-obsidian-400 hover:text-gold-700"
                                      aria-label={t(
                                        'admin.settings.baladiyat_reset_one',
                                        'Rétablir le tarif de la wilaya'
                                      )}
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <input
                                    type="checkbox"
                                    checked={isCommuneActive}
                                    onChange={() => handleToggleCommuneActive(w.code, commune.name)}
                                    className="w-4 h-4 accent-gold-500 rounded-sm cursor-pointer"
                                    aria-label={language === 'ar' ? (commune.nameAr || commune.name) : commune.name}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    step={50}
                                    value={override?.homeFee ?? ''}
                                    placeholder={String(currentFee.homeFee)}
                                    onChange={(e) =>
                                      handleCommuneFeeChange(
                                        w.code,
                                        commune.name,
                                        'homeFee',
                                        e.target.value
                                      )
                                    }
                                    className={cn(
                                      'w-full min-w-0 px-2 py-1 min-h-[34px] rounded-sm bg-white border text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500',
                                      override?.homeFee !== undefined
                                        ? 'border-gold-500 text-gold-800 font-semibold'
                                        : 'border-obsidian-200 text-obsidian-950 placeholder:text-obsidian-400'
                                    )}
                                  />
                                  <span className="text-[10px] text-obsidian-500 shrink-0">{t('common.currency_short', 'DA')}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    step={50}
                                    value={override?.deskFee ?? ''}
                                    placeholder={String(currentFee.deskFee)}
                                    onChange={(e) =>
                                      handleCommuneFeeChange(
                                        w.code,
                                        commune.name,
                                        'deskFee',
                                        e.target.value
                                      )
                                    }
                                    className={cn(
                                      'w-full min-w-0 px-2 py-1 min-h-[34px] rounded-sm bg-white border text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500',
                                      override?.deskFee !== undefined
                                        ? 'border-gold-500 text-gold-800 font-semibold'
                                        : 'border-obsidian-200 text-obsidian-950 placeholder:text-obsidian-400'
                                    )}
                                  />
                                  <span className="text-[10px] text-obsidian-500 shrink-0">{t('common.currency_short', 'DA')}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 68 Wilayas Table (Desktop) */}
        <div className="hidden md:block rounded-sm border border-obsidian-200 overflow-hidden bg-white">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="sticky top-0 bg-ivory-100 border-b border-obsidian-200 text-obsidian-600 z-10">
                <tr>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-start">
                    {t('admin.settings.th_code_wilaya', 'Code & Wilaya')}
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-start">
                    {t('admin.settings.th_zone', 'Zone')}
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-start">
                    {t('admin.settings.th_home_rate', 'Tarif Domicile (DA)')}
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-start">
                    {t('admin.settings.th_desk_rate', 'Tarif Point Relais (DA)')}
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-start">
                    {t('admin.settings.th_est_delay', 'Délai Estimé')}
                  </th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-[11px] text-center">
                    {t('admin.settings.th_available', 'Disponible')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-100">
                {filteredWilayas.map((w) => {
                  const currentFee = wilayaFees[w.code] || {
                    homeFee: w.homeDeliveryFee,
                    deskFee: w.deskFee,
                    active: true,
                  };
                  const isExpanded = !!expandedWilayas[w.code];
                  const allWilayaCommunes = getCommunesByWilaya(w.code);
                  const customCount = customCommuneCountsByWilaya[w.code] || 0;
                  const communeQuery = communeSearchByWilaya[w.code] || '';
                  const visibleCommunes = isExpanded
                    ? searchCommunes(w.code, communeQuery)
                    : [];

                  return (
                    <React.Fragment key={w.code}>
                      <tr
                        className={cn(
                          'hover:bg-ivory-100/70 transition-colors',
                          !currentFee.active && 'opacity-50 bg-obsidian-50',
                          isExpanded && 'bg-gold-50/40'
                        )}
                      >
                        {/* Code & Wilaya + Dropdown Toggle */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleWilayaExpand(w.code)}
                              aria-expanded={isExpanded}
                              aria-label={t('admin.settings.baladiyat_toggle_aria', 'Afficher les baladiyat de {name}').replace(
                                '{name}',
                                language === 'ar' && w.nameAr ? w.nameAr : w.name
                              )}
                              className={cn(
                                'w-6 h-6 rounded-sm border flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
                                isExpanded
                                  ? 'bg-gold-50 border-gold-500 text-gold-700'
                                  : 'bg-white border-obsidian-200 text-obsidian-500 hover:text-gold-700 hover:border-gold-500'
                              )}
                            >
                              <ChevronDown
                                className={cn(
                                  'w-3.5 h-3.5 transition-transform duration-200',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </button>
                            <span className="w-6 h-6 rounded-sm bg-gold-50 border border-gold-500/30 text-gold-800 font-sans tabular-nums font-bold text-[11px] flex items-center justify-center shrink-0">
                              {w.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleWilayaExpand(w.code)}
                              className="text-start group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
                            >
                              <div className="flex items-center flex-wrap gap-1.5">
                                <span className="font-semibold text-obsidian-950 text-xs group-hover:text-gold-700 transition-colors">
                                  {language === 'ar' ? (w.nameAr || w.name) : w.name}
                                </span>
                                {language !== 'ar' && w.nameAr && (
                                  <span className="text-[10px] text-obsidian-500 font-arabic">
                                    {w.nameAr}
                                  </span>
                                )}
                                <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-ivory-100 border border-obsidian-200 text-obsidian-600">
                                  {t('admin.settings.baladiyat_count', '{count} baladiyat').replace(
                                    '{count}',
                                    String(allWilayaCommunes.length)
                                  )}
                                </span>
                                {customCount > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gold-50 border border-gold-500/40 text-gold-800 font-semibold">
                                    {t('admin.settings.baladiyat_custom_count', '{count} perso.').replace(
                                      '{count}',
                                      String(customCount)
                                    )}
                                  </span>
                                )}
                              </div>
                            </button>
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-wider bg-ivory-100 border border-obsidian-200 text-obsidian-700">
                            {getZoneLabel(w.zone)}
                          </span>
                        </td>

                        {/* Home Fee Input */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step={50}
                              value={currentFee.homeFee}
                              onChange={(e) =>
                                handleFeeChange(w.code, 'homeFee', parseInt(e.target.value || '0', 10))
                              }
                              className="w-24 px-2.5 py-1.5 min-h-[36px] rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            />
                            <span className="text-[11px] text-gold-700 font-medium">{t('common.currency_short', 'DA')}</span>
                          </div>
                        </td>

                        {/* Desk Fee Input */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              step={50}
                              value={currentFee.deskFee}
                              onChange={(e) =>
                                handleFeeChange(w.code, 'deskFee', parseInt(e.target.value || '0', 10))
                              }
                              className="w-24 px-2.5 py-1.5 min-h-[36px] rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            />
                            <span className="text-[11px] text-gold-700 font-medium">{t('common.currency_short', 'DA')}</span>
                          </div>
                        </td>

                        {/* Estimated Days */}
                        <td className="py-2.5 px-3 text-obsidian-600 text-[11px] font-sans tabular-nums">
                          {formatEstimatedDays(w.estimatedDays, language)}
                        </td>

                        {/* Active Toggle */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={currentFee.active}
                            onChange={() => handleToggleWilayaActive(w.code)}
                            className="w-5 h-5 accent-gold-500 rounded-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                            aria-label={t('admin.settings.active_aria', 'Activer livraison {name}').replace('{name}', language === 'ar' && w.nameAr ? w.nameAr : w.name)}
                          />
                        </td>
                      </tr>

                      {/* Expanded Baladiyat Dropdown Panel */}
                      {isExpanded && (
                        <tr className="bg-ivory-100/70">
                          <td colSpan={6} className="p-0 border-t border-b border-obsidian-200">
                            <div className="p-3 sm:p-4 space-y-3 bg-ivory-100">
                              {/* Baladiyat Toolbar */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="relative flex-1 max-w-sm">
                                  <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-obsidian-400" />
                                  <input
                                    type="text"
                                    value={communeQuery}
                                    onChange={(e) =>
                                      setCommuneSearchByWilaya((prev) => ({
                                        ...prev,
                                        [w.code]: e.target.value,
                                      }))
                                    }
                                    placeholder={t(
                                      'admin.settings.baladiyat_search_ph',
                                      'Rechercher une baladiya par nom ou code postal...'
                                    )}
                                    className="w-full ps-8 pe-7 py-1.5 rounded-sm bg-white border border-obsidian-200 text-obsidian-950 text-xs placeholder:text-obsidian-400 focus:outline-none focus:border-gold-500"
                                  />
                                  {communeQuery && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCommuneSearchByWilaya((prev) => ({ ...prev, [w.code]: '' }))
                                      }
                                      aria-label={t('common.close', 'Fermer')}
                                      className="absolute end-2 top-1/2 -translate-y-1/2 text-obsidian-400 hover:text-obsidian-950"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-obsidian-600">
                                  <span>
                                    {t('admin.settings.baladiyat_default_hint', 'Défaut wilaya')}:{' '}
                                    <strong className="text-gold-700 tabular-nums">
                                      {currentFee.homeFee} / {currentFee.deskFee} {t('common.currency_short', 'DA')}
                                    </strong>
                                  </span>
                                  {customCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleResetWilayaCommunes(w.code)}
                                      className="px-2.5 py-1 rounded-sm bg-white hover:bg-ivory-200 border border-obsidian-200 text-gold-700 text-[11px] flex items-center gap-1 transition-colors"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>
                                        {t('admin.settings.baladiyat_reset_all', 'Réinitialiser les baladiyat')}
                                      </span>
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Baladiyat List */}
                              {visibleCommunes.length === 0 ? (
                                <p className="text-xs text-obsidian-500 py-4 text-center">
                                  {t('admin.settings.baladiyat_empty', 'Aucune baladiya correspondante.')}
                                </p>
                              ) : (
                                <div className="max-h-72 overflow-y-auto rounded-sm border border-obsidian-200 bg-white">
                                  <table className="w-full text-start text-xs">
                                    <tbody className="divide-y divide-obsidian-100">
                                      {visibleCommunes.map((commune) => {
                                        const cKey = getCommuneKey(w.code, commune.name);
                                        const override = communeFees[cKey];
                                        const isCustomized = !!override;
                                        const isCommuneActive = override?.active !== false;

                                        return (
                                          <tr
                                            key={cKey}
                                            className={cn(
                                              'hover:bg-ivory-100/70 transition-colors',
                                              isCustomized && 'bg-gold-50/50',
                                              !isCommuneActive && 'opacity-50'
                                            )}
                                          >
                                            {/* Baladiya Name */}
                                            <td className="py-2 px-3">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium text-obsidian-950 text-xs">
                                                  {language === 'ar' ? (commune.nameAr || commune.name) : commune.name}
                                                </span>
                                                {language !== 'ar' && commune.nameAr && (
                                                  <span className="text-[11px] text-obsidian-500 font-arabic">
                                                    {commune.nameAr}
                                                  </span>
                                                )}
                                                {commune.postalCode && (
                                                  <span className="text-[10px] font-mono text-obsidian-400">
                                                    {commune.postalCode}
                                                  </span>
                                                )}
                                              </div>
                                            </td>

                                            {/* Custom Home Fee */}
                                            <td className="py-2 px-3">
                                              <div className="flex items-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  step={50}
                                                  value={override?.homeFee ?? ''}
                                                  placeholder={String(currentFee.homeFee)}
                                                  onChange={(e) =>
                                                    handleCommuneFeeChange(
                                                      w.code,
                                                      commune.name,
                                                      'homeFee',
                                                      e.target.value
                                                    )
                                                  }
                                                  className={cn(
                                                    'w-24 px-2 py-1 min-h-[32px] rounded-sm bg-white border text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500',
                                                    override?.homeFee !== undefined
                                                      ? 'border-gold-500 text-gold-800 font-semibold'
                                                      : 'border-obsidian-200 text-obsidian-950 placeholder:text-obsidian-400'
                                                  )}
                                                />
                                                <span className="text-[11px] text-obsidian-500">{t('common.currency_short', 'DA')}</span>
                                              </div>
                                            </td>

                                            {/* Custom Desk Fee */}
                                            <td className="py-2 px-3">
                                              <div className="flex items-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  step={50}
                                                  value={override?.deskFee ?? ''}
                                                  placeholder={String(currentFee.deskFee)}
                                                  onChange={(e) =>
                                                    handleCommuneFeeChange(
                                                      w.code,
                                                      commune.name,
                                                      'deskFee',
                                                      e.target.value
                                                    )
                                                  }
                                                  className={cn(
                                                    'w-24 px-2 py-1 min-h-[32px] rounded-sm bg-white border text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500',
                                                    override?.deskFee !== undefined
                                                      ? 'border-gold-500 text-gold-800 font-semibold'
                                                      : 'border-obsidian-200 text-obsidian-950 placeholder:text-obsidian-400'
                                                  )}
                                                />
                                                <span className="text-[11px] text-obsidian-500">{t('common.currency_short', 'DA')}</span>
                                              </div>
                                            </td>

                                            {/* Active Toggle & Reset */}
                                            <td className="py-2 px-3">
                                              <div className="flex items-center justify-end gap-2">
                                                <input
                                                  type="checkbox"
                                                  checked={isCommuneActive}
                                                  onChange={() => handleToggleCommuneActive(w.code, commune.name)}
                                                  className="w-4 h-4 accent-gold-500 rounded-sm cursor-pointer"
                                                  aria-label={language === 'ar' ? (commune.nameAr || commune.name) : commune.name}
                                                />
                                                {isCustomized && (
                                                  <button
                                                    type="button"
                                                    onClick={() => handleResetCommune(w.code, commune.name)}
                                                    title={t('admin.settings.baladiyat_reset_one', 'Rétablir le tarif de la wilaya')}
                                                    className="p-1 rounded-sm text-obsidian-400 hover:text-gold-700 hover:bg-ivory-200 transition-colors"
                                                  >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="flex items-center justify-between p-4 rounded-sm bg-white/95 border border-obsidian-200 sticky bottom-4 shadow-luxury-card backdrop-blur-md">
        <p className="text-xs text-obsidian-600 hidden sm:block">
          {t('admin.settings.footer_notice', 'Les modifications prennent effet immédiatement sur le storefront et le module de checkout COD.')}
        </p>
        <div className="flex items-center gap-3 ms-auto">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-lg bg-ivory-100 border border-obsidian-200 text-obsidian-700 hover:text-obsidian-950 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {t('admin.settings.btn_reset', 'Réinitialiser')}
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-obsidian-950/20 border-t-obsidian-950 rounded-full animate-spin" />
                <span>{t('admin.settings.saving', 'Enregistrement...')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('admin.settings.btn_save_rates', 'Enregistrer les Tarifs')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
