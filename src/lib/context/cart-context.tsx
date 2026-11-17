'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { OrderItem } from '@/types';

export interface CartItem extends OrderItem {
  id?: string;
}

export interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  updateQuantity: (
    idOrProductId: string,
    newQuantity: number,
    selectedSize?: string,
    selectedColor?: string
  ) => void;
  removeItem: (idOrProductId: string, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  freeShippingThreshold: number;
  amountRemaining: number;
  progressPercentage: number;
  isFreeShipping: boolean;
  canCheckout: boolean;
}

const DEFAULT_THRESHOLD = 15000;
const STORAGE_KEY = 'vip_cart';
const FALLBACK_STORAGE_KEY = 'vip_tadj_cart';
const EVENT_NAME = 'vip-cart-updated';

export function clampQuantity(qty: number): number {
  return Math.min(99, Math.max(1, Math.floor(qty)));
}

export function getCartItemId(productId: string, size: string, color?: string): string {
  return color ? `${productId}-${size}-${color}` : `${productId}-${size}`;
}

function loadItemsFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      id: item.id || getCartItemId(item.productId, item.selectedSize || 'Standard', item.selectedColor),
      quantity: Math.min(99, Math.max(1, Number(item.quantity) || 1)),
    }));
  } catch {
    // Malformed storage recovery
    return [];
  }
}

function saveItemsToStorage(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // Ignore storage quota/security errors
  }
}

const defaultContextValue: CartContextType = {
  items: [],
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
  toggleCart: () => {},
  addItem: () => {},
  updateQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  subtotal: 0,
  itemCount: 0,
  freeShippingThreshold: DEFAULT_THRESHOLD,
  amountRemaining: DEFAULT_THRESHOLD,
  progressPercentage: 0,
  isFreeShipping: false,
  canCheckout: false,
};

const CartContext = createContext<CartContextType>(defaultContextValue);

export function CartProvider({
  children,
  initialThreshold = DEFAULT_THRESHOLD,
}: {
  children: React.ReactNode;
  initialThreshold?: number;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from storage on mount
  useEffect(() => {
    setItems(loadItemsFromStorage());
    setIsHydrated(true);

    const handleSync = () => {
      setItems(loadItemsFromStorage());
    };

    window.addEventListener(EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addItem = useCallback((item: CartItem) => {
    if (!item || item.quantity <= 0) return;

    const safeQty = clampQuantity(item.quantity);
    const size = item.selectedSize || 'Standard';
    const color = item.selectedColor;
    const lineId = item.id || getCartItemId(item.productId, size, color);

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex(
        (it) =>
          it.productId === item.productId &&
          (it.selectedSize === size || (!it.selectedSize && !size)) &&
          (it.selectedColor === color || (!it.selectedColor && !color))
      );

      let nextItems: CartItem[];
      if (existingIdx >= 0) {
        nextItems = prevItems.map((it, idx) => {
          if (idx === existingIdx) {
            const allowedMax =
              typeof (item.maxStock ?? it.maxStock) === 'number'
                ? (item.maxStock ?? it.maxStock)!
                : 99;
            return {
              ...it,
              maxStock: allowedMax,
              quantity: Math.min(allowedMax, it.quantity + safeQty),
            };
          }
          return it;
        });
      } else {
        const allowedMax = typeof item.maxStock === 'number' ? item.maxStock : 99;
        nextItems = [
          ...prevItems,
          {
            ...item,
            id: lineId,
            selectedSize: size,
            selectedColor: color,
            quantity: Math.min(allowedMax, safeQty),
            maxStock: allowedMax,
          },
        ];
      }

      saveItemsToStorage(nextItems);
      return nextItems;
    });
  }, []);

  const updateQuantity = useCallback(
    (
      idOrProductId: string,
      newQuantity: number,
      selectedSize?: string,
      selectedColor?: string
    ) => {
      setItems((prevItems) => {
        let nextItems: CartItem[];

        if (newQuantity <= 0) {
          nextItems = prevItems.filter((it) => {
            if (it.id && it.id === idOrProductId) return false;
            if (it.productId === idOrProductId) {
              const sizeMatch = !selectedSize || it.selectedSize === selectedSize;
              const colorMatch = !selectedColor || it.selectedColor === selectedColor;
              if (sizeMatch && colorMatch) return false;
            }
            return true;
          });
        } else {
          const clamped = Math.min(99, Math.floor(newQuantity));
          nextItems = prevItems.map((it) => {
            const matchesId = it.id && it.id === idOrProductId;
            const matchesProductAndSize =
              it.productId === idOrProductId &&
              (!selectedSize || it.selectedSize === selectedSize) &&
              (!selectedColor || it.selectedColor === selectedColor);

            if (matchesId || matchesProductAndSize) {
              const allowedMax = typeof it.maxStock === 'number' ? it.maxStock : 99;
              const clamped = Math.min(allowedMax, Math.floor(newQuantity));
              return { ...it, quantity: clamped };
            }
            return it;
          });
        }

        saveItemsToStorage(nextItems);
        return nextItems;
      });
    },
    []
  );

  const removeItem = useCallback(
    (idOrProductId: string, selectedSize?: string, selectedColor?: string) => {
      setItems((prevItems) => {
        const nextItems = prevItems.filter((it) => {
          if (it.id && it.id === idOrProductId) return false;
          if (it.productId === idOrProductId) {
            const sizeMatch = !selectedSize || it.selectedSize === selectedSize;
            const colorMatch = !selectedColor || it.selectedColor === selectedColor;
            if (sizeMatch && colorMatch) return false;
          }
          return true;
        });

        if (nextItems.length !== prevItems.length) {
          saveItemsToStorage(nextItems);
        }
        return nextItems;
      });
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    saveItemsToStorage([]);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Math.max(0, it.price) * Math.max(0, it.quantity), 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + Math.max(0, it.quantity), 0),
    [items]
  );

  const freeShippingThreshold = initialThreshold;
  const amountRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercentage = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100)
  );
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const canCheckout = items.length > 0 && subtotal > 0;

  const value: CartContextType = {
    items,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    itemCount,
    freeShippingThreshold,
    amountRemaining,
    progressPercentage,
    isFreeShipping,
    canCheckout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  return context || defaultContextValue;
}
