'use client';

import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartDrawer } from './CartDrawer';

export interface StorefrontLayoutProps {
  children: React.ReactNode;
  cartCount?: number;
}

export function StorefrontLayout({ children, cartCount }: StorefrontLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-ivory text-obsidian-900">
      <Header cartCount={cartCount} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <CartDrawer />
      <Footer />
    </div>
  );
}
