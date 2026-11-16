'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Zap, Plus, Minus, Check } from 'lucide-react';
import { Product, ProductColor } from '@/types';
import { useCart } from '@/lib/context/cart-context';
import { useLanguage } from '@/lib/context/language-context';

export interface AddToCartSectionProps {
  product: Product;
  selectedSize: string | null;
  selectedColor?: ProductColor | null;
  onValidateSize: () => boolean;
}

export function AddToCartSection({
  product,
  selectedSize,
  selectedColor,
  onValidateSize,
}: AddToCartSectionProps) {
  const router = useRouter();
  const cart = useCart();
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const isAvailable = product.inStock && product.stockQuantity > 0;

  const colorMatchedImage = selectedColor
    ? selectedColor.imageUrl ||
    product.images?.find(
      (img) =>
        img.color &&
        selectedColor.name &&
        img.color.toLowerCase() === selectedColor.name.toLowerCase()
    )?.url
    : undefined;

  const primaryImage =
    (colorMatchedImage
      ? { id: 'color-match', url: colorMatchedImage, alt: `${product.title} - ${selectedColor?.name}` }
      : null) ||
    product.images?.find((img) => img.isPrimary) ||
    product.images?.[0] || {
      id: 'placeholder',
      url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35',
      alt: product.title,
    };

  const handleAddToCart = () => {
    if (!onValidateSize()) return;

    try {
      const lineItem = {
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: product.price,
        quantity: quantity,
        selectedSize: selectedSize || (product.sizes?.[0] ?? 'Unique'),
        selectedColor: selectedColor?.name,
        image: primaryImage.url,
      };

      const raw = localStorage.getItem('vip_cart');
      const localCart = raw ? JSON.parse(raw) : [];
      const existingIdx = localCart.findIndex(
        (it: any) =>
          it.productId === lineItem.productId &&
          it.selectedSize === lineItem.selectedSize &&
          (it.selectedColor === lineItem.selectedColor || (!it.selectedColor && !lineItem.selectedColor))
      );

      if (existingIdx >= 0) {
        localCart[existingIdx].quantity += lineItem.quantity;
      } else {
        localCart.push(lineItem);
      }

      localStorage.setItem('vip_cart', JSON.stringify(localCart));
      window.dispatchEvent(new CustomEvent('vip-cart-updated'));

      if (cart?.openCart) {
        cart.openCart();
      }

      setIsAddedFeedback(true);
      setTimeout(() => setIsAddedFeedback(false), 2500);
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleExpressDirectCheckout = () => {
    if (!onValidateSize()) return;

    const chosenSize = selectedSize || (product.sizes?.[0] ?? 'Unique');

    const expressItem = {
      productId: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      quantity: quantity,
      selectedSize: chosenSize,
      selectedColor: selectedColor?.name,
      image: primaryImage.url,
    };

    // CRITICAL: Must completely bypass vip_cart in localStorage to preserve Journey 2 contract:
    // expect(localStorageMock.getItem('vip_cart')).toBeNull();
    try {
      sessionStorage.setItem('vip_express_checkout', JSON.stringify(expressItem));
    } catch {
      // Ignore sessionStorage issues
    }

    let checkoutUrl = `/checkout?direct=1&productId=${encodeURIComponent(
      product.id
    )}&size=${encodeURIComponent(chosenSize)}&qty=${quantity}`;

    if (selectedColor?.name) {
      checkoutUrl += `&color=${encodeURIComponent(selectedColor.name)}`;
    }

    router.push(checkoutUrl);
  };

  if (!isAvailable) {
    return (
      <div className="py-6 border-b border-sand-200">
        <button
          type="button"
          disabled
          className="w-full py-4 bg-sand-200 text-neutral-500 font-sans uppercase tracking-[0.2em] text-xs font-semibold cursor-not-allowed"
        >
          {t('pdp.btn.out_of_stock', 'Produit Épuisé • Rupture Temporaire')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-6 border-b border-sand-200">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-xs uppercase tracking-wider text-sand-800 font-sans font-medium">
          {t('pdp.qty.label', 'Quantité :')}
        </span>
        <div className="flex items-center border border-sand-300 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-obsidian-800 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label={t('pdp.qty.decrease_aria', 'Diminuer la quantité')}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-4 text-xs font-sans tabular-nums font-semibold text-obsidian-950">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) =>
                Math.min(product.stockQuantity || 10, q + 1)
              )
            }
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-obsidian-800 hover:text-gold-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label={t('pdp.qty.increase_aria', 'Augmenter la quantité')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-neutral-600 font-sans tabular-nums">
          ({product.stockQuantity} {t('pdp.qty.available', 'exemplaires disponibles')})
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {/* Button 1: Add to cart */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3.5 px-4 sm:px-6 border-2 border-obsidian-950 text-obsidian-950 hover:bg-obsidian-950 hover:text-ivory active:scale-[0.99] font-sans uppercase tracking-wider sm:tracking-[0.2em] text-xs font-semibold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          {isAddedFeedback ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{t('pdp.btn.added_to_cart', 'Ajouté au Panier !')}</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>{t('pdp.btn.add_to_cart', 'Ajouter au Panier')}</span>
            </>
          )}
        </button>

        {/* Button 2: 1-Click Express Direct Checkout */}
        <button
          type="button"
          onClick={handleExpressDirectCheckout}
          className="flex-1 btn-luxury-gold py-3.5 px-4 sm:px-6 text-xs uppercase tracking-wider sm:tracking-[0.2em] font-semibold flex items-center justify-center gap-2 shadow-luxury-gold active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
        >
          <Zap className="w-4 h-4" />
          <span>{t('pdp.btn.buy_now', 'Commander directement')}</span>
        </button>
      </div>

      {isAddedFeedback && (
        <p className="text-xs text-emerald-700 font-sans text-center animate-fade-in">
          {t('pdp.added_success_feedback', 'Pièce ajoutée avec succès. Vous pouvez finaliser vos achats ou continuer la visite.')}
        </p>
      )}
    </div>
  );
}
