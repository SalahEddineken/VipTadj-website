import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDetailPage } from '@/components/store/pdp/ProductDetailPage';
import { ColorSelector } from '@/components/store/pdp/ColorSelector';
import { ProductCard } from '@/components/store/ProductCard';
import { CartProvider, useCart } from '@/lib/context/cart-context';
import { Product } from '@/types';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/catalog/chaussures/souliers-richelieu-one-cut',
  useSearchParams: () => new URLSearchParams(),
}));

const sampleShoe: Product = {
  id: 'shoe-test-01',
  title: 'Souliers Richelieu One-Cut en Veau Box',
  slug: 'souliers-richelieu-one-cut',
  description: 'Chaussures de luxe en cuir patiné artisanal.',
  price: 24500,
  categoryId: 'shoes',
  categorySlug: 'chaussures',
  subcategory: 'richelieu',
  colors: [
    {
      name: 'Marron Cognac',
      hex: '#8B4513',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
    },
    {
      name: 'Noir Ébène',
      hex: '#111111',
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
    },
  ],
  images: [
    {
      id: 'img-brown',
      url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f',
      alt: 'Richelieus marron cognac',
      isPrimary: true,
      color: 'Marron Cognac',
    },
    {
      id: 'img-black',
      url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509',
      alt: 'Richelieus noir ébène',
      isPrimary: false,
      color: 'Noir Ébène',
    },
  ],
  sizes: ['40', '41', '42'],
  stockQuantity: 15,
  inStock: true,
  isFeatured: true,
  isNewArrival: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('Color Selection & Dynamic Shoe Picture Switching', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('renders available colors with swatches and names', () => {
    const handleSelectColor = vi.fn();
    render(
      <ColorSelector
        colors={sampleShoe.colors}
        selectedColor={sampleShoe.colors![0]}
        onSelectColor={handleSelectColor}
      />
    );

    expect(screen.getByText(/Couleur :/i)).toBeDefined();
    expect(screen.getAllByText('Marron Cognac').length).toBeGreaterThanOrEqual(1);

    const blackSwatch = screen.getByRole('radio', { name: /Coloris Noir Ébène/i });
    expect(blackSwatch).toBeDefined();

    fireEvent.click(blackSwatch);
    expect(handleSelectColor).toHaveBeenCalledWith(sampleShoe.colors![1]);
  });

  it('automatically updates the displayed shoe picture when selecting brown vs black color', () => {
    render(<ProductDetailPage product={sampleShoe} />);

    // Initially defaults to the first color (Marron Cognac)
    const initialHeroImg = screen.getAllByRole('img').find((img) =>
      img.getAttribute('src')?.includes('photo-1617137984095-74e4e5e3613f')
    );
    expect(initialHeroImg).toBeDefined();

    // Select Black shoe color
    const blackColorRadio = screen.getByRole('radio', { name: /Coloris Noir Ébène/i });
    fireEvent.click(blackColorRadio);

    // Active image flips to black shoe
    const blackHeroImg = screen.getAllByRole('img').find((img) =>
      img.getAttribute('src')?.includes('photo-1533867617858-e7b97e060509')
    );
    expect(blackHeroImg).toBeDefined();

    // Select Brown shoe color back
    const brownColorRadio = screen.getByRole('radio', { name: /Coloris Marron Cognac/i });
    fireEvent.click(brownColorRadio);

    // Active image flips back to brown shoe
    const brownHeroImg = screen.getAllByRole('img').find((img) =>
      img.getAttribute('src')?.includes('photo-1617137984095-74e4e5e3613f')
    );
    expect(brownHeroImg).toBeDefined();
  });

  it('adds product to cart with the selected color and color-matched picture', () => {
    render(<ProductDetailPage product={sampleShoe} />);

    // Select size 41
    const sizeButton = screen.getByRole('button', { name: /41/i });
    fireEvent.click(sizeButton);

    // Select Black color
    const blackColorRadio = screen.getByRole('radio', { name: /Coloris Noir Ébène/i });
    fireEvent.click(blackColorRadio);

    // Click "Ajouter au Panier"
    const addToCartBtn = screen.getByRole('button', { name: /Ajouter au Panier/i });
    fireEvent.click(addToCartBtn);

    const savedCart = JSON.parse(localStorage.getItem('vip_cart') || '[]');
    expect(savedCart).toHaveLength(1);
    expect(savedCart[0].productId).toBe('shoe-test-01');
    expect(savedCart[0].selectedSize).toBe('41');
    expect(savedCart[0].selectedColor).toBe('Noir Ébène');
    expect(savedCart[0].image).toContain('photo-1533867617858-e7b97e060509');
  });

  it('changes product card preview image when hovering or clicking a color dot', () => {
    render(<ProductCard product={sampleShoe} />);

    // Initially displays primary image (Brown)
    const cardImg = screen.getByRole('img');
    expect(cardImg.getAttribute('src')).toContain('photo-1617137984095-74e4e5e3613f');

    // Click black color dot on card
    const blackDot = screen.getByTitle('Noir Ébène');
    fireEvent.click(blackDot);

    // Preview image changes to black shoe
    expect(cardImg.getAttribute('src')).toContain('photo-1533867617858-e7b97e060509');
  });
});
