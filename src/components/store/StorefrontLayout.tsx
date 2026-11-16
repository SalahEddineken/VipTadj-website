'use client';

import React from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartProvider } from '@/lib/context/cart-context';
import { CartDrawer } from './CartDrawer';

export interface StorefrontLayoutProps {
  children: React.ReactNode;
  cartCount?: number;
}

export function StorefrontLayout({ children, cartCount }: StorefrontLayoutProps) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-ivory text-obsidian-900">
        <AnnouncementBar />
        <Header cartCount={cartCount} />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <CartDrawer />
        <Footer />
      </div>
    </CartProvider>
  );
}
