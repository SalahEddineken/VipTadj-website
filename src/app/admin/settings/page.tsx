'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { StoreSettings } from '@/types';
import { ALGERIAN_58_WILAYAS, AlgerianWilaya } from '@/lib/data/wilayas';
import { formatDZD } from '@/lib/utils/formatDZD';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/language-context';

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

  // 58 Wilayas Fee Matrix State
  const [wilayaFees, setWilayaFees] = useState<Record<number, WilayaFeeItem>>({});

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

  // Fetch Settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
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

          // Populate wilaya fees
          const initialMap: Record<number, WilayaFeeItem> = {};
          ALGERIAN_58_WILAYAS.forEach((w) => {
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
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        showNotification('error', t('admin.settings.load_error', 'Erreur de chargement des paramètres.'));
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [t]);

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

  // Reset to Algerian official defaults
  const handleResetToDefaults = () => {
    if (confirm(t('admin.settings.reset_confirm', 'Voulez-vous rétablir les tarifs officiels par défaut pour les 58 Wilayas ?'))) {
      const defaultMap: Record<number, WilayaFeeItem> = {};
      ALGERIAN_58_WILAYAS.forEach((w) => {
        defaultMap[w.code] = {
          homeFee: w.homeDeliveryFee,
          deskFee: w.deskFee,
          active: true,
        };
      });
      setWilayaFees(defaultMap);
      setFreeShippingThreshold(15000);
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
    return ALGERIAN_58_WILAYAS.filter((w) => {
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
  const zoneTabs = [
    { id: 'all', label: t('admin.settings.zone_all', 'Toutes les Wilayas'), count: 58 },
    { id: 'alger', label: t('admin.settings.zone_alger', 'Alger'), count: 1 },
    { id: 'centre', label: t('admin.settings.zone_centre', 'Centre'), count: 6 },
    { id: 'est', label: t('admin.settings.zone_est', 'Est'), count: 15 },
    { id: 'ouest', label: t('admin.settings.zone_ouest', 'Ouest'), count: 12 },
    { id: 'hauts-plateaux', label: t('admin.settings.zone_hauts_plateaux', 'Hauts-Plateaux'), count: 10 },
    { id: 'sud', label: t('admin.settings.zone_sud', 'Grand Sud'), count: 14 },
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
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', t('admin.settings.saved_toast', 'Paramètres et grille tarifaire enregistrés avec succès !'));
      } else {
        showNotification('error', data.error || t('admin.settings.save_error', 'Erreur lors de l\'enregistrement.'));
      }
    } catch (err: any) {
      console.error('Save settings failed:', err);
      showNotification('error', t('admin.settings.connect_error', 'Échec de connexion au serveur.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-ivory space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        <p className="font-cinzel text-xs text-gold-400 tracking-wider">
          {t('admin.settings.loading', 'Chargement des paramètres de la boutique...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-500/15 pb-6">
        <div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold tracking-wide text-ivory">
            {t('admin.settings.title', 'Paramètres & Tarifs 58 Wilayas')}
          </h1>
          <p className="text-xs sm:text-sm text-obsidian-300 mt-1">
            {t('admin.settings.subtitle', 'Configuration des coordonnées VIP TADJ, du seuil de gratuité et des tarifs COD par wilaya')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 rounded-lg bg-obsidian-950 border border-gold-500/20 text-xs text-obsidian-300 hover:text-ivory transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('admin.settings.default_rates', 'Tarifs par défaut')}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
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
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          )}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SECTION 1: Store Metadata */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-gold-500/10 pb-3">
          <Store className="w-4 h-4 text-gold-400" />
          <h2 className="font-cinzel text-base font-bold text-gold-400">
            {t('admin.settings.sec_store', '1. Coordonnées de la Maison VIP TADJ')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.store_name', 'Nom de la Boutique')}
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.store_tagline', 'Slogan / Devise de Marque')}
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.store_phone', 'Téléphone Service Client & Confirmations')}
            </label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.store_whatsapp', 'Numéro WhatsApp Commercial')}
            </label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.store_email', 'Email Officiel')}
            </label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-obsidian-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.store_address', 'Adresse Principale (Alger)')}
            </label>
            <div className="relative">
              <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full ps-9 pe-3.5 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-sm focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Seuil de Gratuité de Livraison */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-gold-500/10 pb-3">
          <Truck className="w-4 h-4 text-gold-400" />
          <h2 className="font-cinzel text-base font-bold text-gold-400">
            {t('admin.settings.sec_shipping_threshold', '2. Seuil de Livraison Gratuite (Offre Nationale 58 Wilayas)')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
              {t('admin.settings.min_amount_dzd', 'Montant Minimum d\'Achat (DZD / DA)')}
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={500}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full px-4 py-2.5 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory font-serif text-lg font-bold focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-gold-400 font-bold">
                DA
              </span>
            </div>
            <p className="text-xs text-obsidian-300">
              {t('admin.settings.free_shipping_desc', 'Toute commande égale ou supérieure à {amount} bénéficiera automatiquement de 0 DA de frais de livraison sur l\'ensemble des 58 Wilayas.').replace('{amount}', formatDZD(freeShippingThreshold, { locale: language }))}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-obsidian-300 uppercase tracking-wider">
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
                      : 'bg-obsidian-900 hover:bg-obsidian-850 text-obsidian-300 border border-gold-500/20'
                  )}
                >
                  {formatDZD(preset, { locale: language })}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Grille Tarifaire des 58 Wilayas */}
      <div className="p-6 rounded-sm bg-obsidian-950 border border-gold-500/20 shadow-luxury-subtle space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold-500/10 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-gold-400" />
            <h2 className="font-cinzel text-base font-bold text-gold-400">
              {t('admin.settings.sec_wilayas', '3. Grille Tarifaire des 58 Wilayas d\'Algérie')}
            </h2>
          </div>
          <span className="text-xs text-obsidian-300">
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
                  : 'bg-obsidian-900 text-obsidian-300 hover:text-ivory border border-gold-500/10'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full',
                  selectedZone === tab.id ? 'bg-obsidian-950/20 text-obsidian-950' : 'bg-obsidian-950 text-obsidian-300'
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
              className="w-full ps-9 pe-8 py-2 rounded-lg bg-obsidian-900 border border-gold-500/20 text-ivory text-xs placeholder:text-obsidian-600 focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-obsidian-300 hover:text-ivory text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 rounded-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Batch Zone Action */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-obsidian-900/70 border border-gold-500/15">
            <span className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider shrink-0 w-full sm:w-auto">
              {t('admin.settings.batch_apply', 'Appliquer à la sélection :')}
            </span>
            <input
              type="number"
              placeholder={t('admin.settings.home_rate_label', 'Tarif Domicile DA')}
              value={batchHomeFee}
              onChange={(e) => setBatchHomeFee(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full sm:w-28 px-2 py-1 rounded bg-obsidian-950 border border-gold-500/20 text-xs text-ivory font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            <input
              type="number"
              placeholder={t('admin.settings.desk_rate_label', 'Tarif Relais DA')}
              value={batchDeskFee}
              onChange={(e) => setBatchDeskFee(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              className="w-full sm:w-28 px-2 py-1 rounded bg-obsidian-950 border border-gold-500/20 text-xs text-ivory font-mono focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            />
            <button
              type="button"
              onClick={handleApplyBatchZone}
              disabled={batchHomeFee === '' && batchDeskFee === ''}
              className="w-full sm:w-auto px-3 py-1 rounded bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border border-gold-500/40 text-xs font-semibold transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {t('admin.settings.btn_apply', 'Appliquer')}
            </button>
          </div>
        </div>

        {/* 58 Wilayas Table */}
        <div className="rounded-sm border border-gold-500/15 overflow-hidden bg-obsidian-900/40">
          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="sticky top-0 bg-obsidian-950 border-b border-gold-500/15 text-obsidian-200 z-10">
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
              <tbody className="divide-y divide-gold-500/5">
                {filteredWilayas.map((w) => {
                  const currentFee = wilayaFees[w.code] || {
                    homeFee: w.homeDeliveryFee,
                    deskFee: w.deskFee,
                    active: true,
                  };

                  return (
                    <tr
                      key={w.code}
                      className={cn(
                        'hover:bg-obsidian-900/70 transition-colors',
                        !currentFee.active && 'opacity-50 bg-obsidian-950/40'
                      )}
                    >
                      {/* Code & Wilaya */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-sm bg-obsidian-950 border border-gold-500/20 text-gold-400 font-sans tabular-nums font-bold text-[11px] flex items-center justify-center shrink-0">
                            {w.code}
                          </span>
                          <div>
                            <span className="font-semibold text-ivory text-xs">
                              {language === 'ar' ? (w.nameAr || w.name) : w.name}
                            </span>
                            {language !== 'ar' && w.nameAr && (
                              <span className="text-[10px] text-obsidian-300 font-arabic ms-1.5">
                                {w.nameAr}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Zone */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium uppercase tracking-wider bg-obsidian-950 border border-gold-500/15 text-obsidian-300">
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
                            className="w-24 px-2.5 py-1.5 min-h-[36px] rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          />
                          <span className="text-[11px] text-gold-400 font-medium">DA</span>
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
                            className="w-24 px-2.5 py-1.5 min-h-[36px] rounded-sm bg-obsidian-950 border border-gold-500/20 text-ivory text-xs font-sans tabular-nums focus:outline-none focus:border-gold-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                          />
                          <span className="text-[11px] text-gold-400 font-medium">DA</span>
                        </div>
                      </td>

                      {/* Estimated Days */}
                      <td className="py-2.5 px-3 text-obsidian-300 text-[11px] font-sans tabular-nums">
                        {w.estimatedDays}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="flex items-center justify-between p-4 rounded-sm bg-obsidian-950 border border-gold-500/20 sticky bottom-4 shadow-2xl backdrop-blur-md">
        <p className="text-xs text-obsidian-300 hidden sm:block">
          {t('admin.settings.footer_notice', 'Les modifications prennent effet immédiatement sur le storefront et le module de checkout COD.')}
        </p>
        <div className="flex items-center gap-3 ms-auto">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-lg bg-obsidian-900 text-obsidian-300 hover:text-ivory text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            {t('admin.settings.btn_reset', 'Réinitialiser')}
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-obsidian-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-luxury-subtle disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
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
