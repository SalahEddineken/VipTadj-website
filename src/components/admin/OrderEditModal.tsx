'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Order, OrderItem, Product } from '@/types';
import { useLanguage } from '@/lib/context/language-context';
import { formatDZD } from '@/lib/utils/formatDZD';
import { normalizeImageUrl } from '@/lib/media/url-normalizer';
import { getLocalizedProduct, getLocalizedColor, getLocalizedSize } from '@/lib/i18n/catalog-translations';
import {
  X,
  Plus,
  Trash2,
  Minus,
  ShoppingBag,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

export interface OrderEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: (updatedOrder: Order) => void;
}

export function OrderEditModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: OrderEditModalProps) {
  const { t, language } = useLanguage();

  // Local state for items being edited
  const [items, setItems] = useState<OrderItem[]>([]);
  
  // Catalog products state
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Form state for adding a new product
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Saving state & error feedback
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync items when modal opens or order changes
  useEffect(() => {
    if (order && isOpen) {
      setItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
      setErrorMessage(null);
      setSelectedProductId('');
      setSelectedSize('');
      setSelectedColor('');
      setNewQuantity(1);
      setCustomPrice(0);
    }
  }, [order, isOpen]);

  // Load catalog products when opened
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingCatalog(true);

    fetch('/api/products?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.success && Array.isArray(data.products)) {
          setCatalogProducts(data.products);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch catalog products', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCatalog(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Escape key handler for dialog accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  // When selectedProductId changes, prefill size, color, price
  const activeCatalogProduct = useMemo(() => {
    return catalogProducts.find((p) => p.id === selectedProductId) || null;
  }, [catalogProducts, selectedProductId]);

  useEffect(() => {
    if (activeCatalogProduct) {
      const defaultSize = activeCatalogProduct.sizes?.[0] || 'Unique';
      setSelectedSize(defaultSize);

      const defaultColor = activeCatalogProduct.colors?.[0]?.name || '';
      setSelectedColor(defaultColor);

      const price = activeCatalogProduct.price || 0;
      setCustomPrice(price);
      setNewQuantity(1);
    } else {
      setSelectedSize('');
      setSelectedColor('');
      setCustomPrice(0);
      setNewQuantity(1);
    }
  }, [activeCatalogProduct]);

  // Calculated totals
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const deliveryFee = order?.deliveryFee ?? 0;
  const discount = order?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Handle item deletion
  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage(t('admin.order_edit.min_one_item', 'La commande doit contenir au moins un article.'));
      return;
    }
    setErrorMessage(null);
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handle quantity adjustment
  const handleQuantityChange = (index: number, delta: number) => {
    setErrorMessage(null);
    setItems((prev) => {
      const updated = [...prev];
      const target = updated[index];
      const newQty = target.quantity + delta;
      if (newQty >= 1) {
        updated[index] = { ...target, quantity: newQty };
      }
      return updated;
    });
  };

  // Handle adding new product
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCatalogProduct) return;

    if (!selectedSize) {
      setErrorMessage(t('admin.order_edit.select_size', 'Veuillez sélectionner une taille.'));
      return;
    }

    if (newQuantity < 1) {
      return;
    }

    const primaryImg =
      activeCatalogProduct.primaryImage ||
      activeCatalogProduct.images?.[0]?.url ||
      '';

    // Check if identical item (same product ID, size, and color) already in order
    const existingIndex = items.findIndex(
      (it) =>
        it.productId === activeCatalogProduct.id &&
        it.selectedSize === selectedSize &&
        (it.selectedColor || '') === (selectedColor || '')
    );

    if (existingIndex >= 0) {
      // Increase quantity
      setItems((prev) => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + newQuantity,
        };
        return next;
      });
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId: activeCatalogProduct.id,
        slug: activeCatalogProduct.slug,
        title: activeCatalogProduct.title,
        price: customPrice > 0 ? customPrice : activeCatalogProduct.price,
        quantity: newQuantity,
        selectedSize: selectedSize,
        selectedColor: selectedColor || undefined,
        image: primaryImg,
      };
      setItems((prev) => [...prev, newItem]);
    }

    // Reset add form
    setSelectedProductId('');
    setSelectedSize('');
    setSelectedColor('');
    setNewQuantity(1);
    setCustomPrice(0);
    setErrorMessage(null);
  };

  // Save changes to API
  const handleSave = async () => {
    if (!order) return;
    if (items.length === 0) {
      setErrorMessage(t('admin.order_edit.min_one_item', 'La commande doit contenir au moins un article.'));
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': language,
        },
        body: JSON.stringify({
          items,
          updatedBy: 'Admin',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || t('admin.order_edit.error_toast', 'Erreur lors de la mise à jour des articles.'));
      }

      onSuccess(data.order);
      onClose();
    } catch (err: any) {
      console.error('[OrderEditModal Save Error]:', err);
      setErrorMessage(err.message || t('admin.order_edit.error_toast', 'Erreur lors de la mise à jour des articles.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-edit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-950/70 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-white border border-obsidian-200 rounded-sm shadow-luxury-subtle overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-obsidian-200 bg-ivory-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold-600" />
            <h2 id="order-edit-modal-title" className="font-cinzel text-base sm:text-lg font-bold text-obsidian-950">
              {t('admin.order_edit.modal_title', 'Modifier les articles de la commande')}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 text-obsidian-400 hover:text-obsidian-900 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label={t('admin.order_edit.modal_close_aria', 'Fermer')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Error Message banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-sm text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Current Order Items */}
          <div>
            <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-obsidian-950 mb-3">
              {t('admin.order_edit.current_items', 'Articles actuels de la commande')} ({items.length})
            </h3>

            <div className="space-y-2 border border-obsidian-200 rounded-sm divide-y divide-obsidian-100 bg-white">
              {items.map((item, idx) => {
                const normalizedImg = normalizeImageUrl(item.image, { width: 80, language });
                const localizedItem = getLocalizedProduct(item, language);
                const localizedSize = getLocalizedSize(item.selectedSize, language);
                const localizedColor = item.selectedColor ? getLocalizedColor(item.selectedColor, language) : '';

                return (
                  <div
                    key={`${item.productId}-${item.selectedSize}-${item.selectedColor || ''}-${idx}`}
                    className="p-3 flex items-center gap-3 justify-between"
                  >
                    {/* Image & Title & Size/Color */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative w-12 h-12 rounded-sm overflow-hidden bg-ivory-100 border border-obsidian-200 flex-shrink-0">
                        {normalizedImg ? (
                          <Image
                            src={normalizedImg}
                            alt={localizedItem.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-obsidian-400 font-cinzel text-[10px]">
                            VIP
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs sm:text-sm text-obsidian-950 truncate">
                          {localizedItem.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-obsidian-500 mt-0.5">
                          <span className="font-semibold text-obsidian-700">
                            {localizedSize}
                          </span>
                          {localizedColor && (
                            <span>• {localizedColor}</span>
                          )}
                          <span className="font-sans tabular-nums text-gold-700">
                            {formatDZD(item.price, { locale: language })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, -1)}
                        disabled={item.quantity <= 1 || isSaving}
                        className="w-7 h-7 rounded-sm border border-obsidian-300 flex items-center justify-center text-obsidian-700 hover:bg-ivory-100 disabled:opacity-40 transition-colors"
                        title={t('admin.order_edit.qty', 'Quantité')}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-sans tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, 1)}
                        disabled={isSaving}
                        className="w-7 h-7 rounded-sm border border-obsidian-300 flex items-center justify-center text-obsidian-700 hover:bg-ivory-100 transition-colors"
                        title={t('admin.order_edit.qty', 'Quantité')}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-end font-sans tabular-nums text-xs sm:text-sm font-bold text-obsidian-950 min-w-[70px]">
                      {formatDZD(item.price * item.quantity, { locale: language })}
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      disabled={items.length <= 1 || isSaving}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-sm disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title={t('admin.orders.action.delete', 'Supprimer')}
                      aria-label={t('admin.orders.action.delete', 'Supprimer')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Add Another Product */}
          <div className="rounded-sm bg-ivory-100 border border-obsidian-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-gold-600" />
              <h3 className="font-cinzel text-xs sm:text-sm font-bold uppercase tracking-wider text-obsidian-950">
                {t('admin.order_edit.add_product_title', 'Ajouter un autre article à la commande')}
              </h3>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3">
              {/* Product Select */}
              <div>
                <label htmlFor="catalog-product-select" className="block text-xs font-semibold text-obsidian-700 mb-1">
                  {t('admin.order_edit.select_product', 'Sélectionner un produit du catalogue')}
                </label>
                <select
                  id="catalog-product-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={isLoadingCatalog || isSaving}
                  className="w-full text-xs p-2 rounded-sm border border-obsidian-300 bg-white text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  <option value="">
                    {isLoadingCatalog
                      ? '...'
                      : `-- ${t('admin.order_edit.select_product', 'Sélectionner un produit')} --`}
                  </option>
                  {catalogProducts.map((p) => {
                    const loc = getLocalizedProduct(p, language);
                    return (
                      <option key={p.id} value={p.id}>
                        {loc.title} — {formatDZD(p.price, { locale: language })}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Options row (Size, Color, Price, Qty) when product selected */}
              {activeCatalogProduct && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {/* Size */}
                  <div>
                    <label className="block text-[11px] font-semibold text-obsidian-700 mb-1">
                      {t('admin.order_edit.select_size', 'Taille')}
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full text-xs p-2 rounded-sm border border-obsidian-300 bg-white text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      {(activeCatalogProduct.sizes && activeCatalogProduct.sizes.length > 0
                        ? activeCatalogProduct.sizes
                        : ['Unique']
                      ).map((sz) => (
                        <option key={sz} value={sz}>
                          {getLocalizedSize(sz, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-[11px] font-semibold text-obsidian-700 mb-1">
                      {t('admin.order_edit.select_color', 'Couleur')}
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full text-xs p-2 rounded-sm border border-obsidian-300 bg-white text-obsidian-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    >
                      <option value="">-</option>
                      {activeCatalogProduct.colors?.map((c) => (
                        <option key={c.name} value={c.name}>
                          {getLocalizedColor(c.name, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-[11px] font-semibold text-obsidian-700 mb-1">
                      {t('admin.order_edit.unit_price', 'Prix')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                      className="w-full text-xs p-2 rounded-sm border border-obsidian-300 bg-white text-obsidian-900 font-sans tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-[11px] font-semibold text-obsidian-700 mb-1">
                      {t('admin.order_edit.qty', 'Quantité')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-xs p-2 rounded-sm border border-obsidian-300 bg-white text-obsidian-900 font-sans tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold rounded-sm flex items-center gap-1.5 transition-colors shadow-luxury-subtle"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t('admin.order_edit.btn_add_to_order', 'Ajouter à la commande')}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Section 3: Recalculated Order Financial Summary */}
          <div className="p-3 bg-white border border-obsidian-200 rounded-sm space-y-1.5 text-xs">
            <div className="flex justify-between text-obsidian-600">
              <span>{t('admin.order_detail.subtotal', 'Sous-total :')}</span>
              <span className="font-sans tabular-nums font-semibold text-obsidian-900">
                {formatDZD(subtotal, { locale: language })}
              </span>
            </div>
            <div className="flex justify-between text-obsidian-600">
              <span>{t('admin.order_detail.delivery_fee', 'Frais de livraison :')}</span>
              <span className="font-sans tabular-nums text-obsidian-900">
                {deliveryFee === 0 ? '0 DA' : formatDZD(deliveryFee, { locale: language })}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>{t('admin.order_detail.commercial_discount', 'Remise :')}</span>
                <span className="font-sans tabular-nums">
                  -{formatDZD(discount, { locale: language })}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-obsidian-200 flex justify-between font-bold text-sm text-obsidian-950">
              <span>{t('admin.order_detail.total_cod_collect', 'Nouveau Total COD :')}</span>
              <span className="font-serif text-gold-700 text-base">
                {formatDZD(total, { locale: language })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-obsidian-200 bg-ivory-100 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-obsidian-300 rounded-sm text-xs font-semibold text-obsidian-700 hover:bg-white transition-colors"
          >
            {t('admin.order_edit.btn_cancel', 'Annuler')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || items.length === 0}
            className="px-5 py-2 bg-gold-600 hover:bg-gold-700 text-white rounded-sm text-xs font-bold transition-colors flex items-center gap-2 shadow-luxury-subtle disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('admin.order_detail.saving', 'Enregistrement...')}</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('admin.order_edit.btn_save_changes', 'Enregistrer les modifications')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
