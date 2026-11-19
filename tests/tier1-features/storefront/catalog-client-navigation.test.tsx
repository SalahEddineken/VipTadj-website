import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { CatalogClient } from '@/components/store/CatalogClient';
import { initialProducts } from '@/lib/seed/seed-data';

let currentParams = new URLSearchParams();

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => currentParams,
    usePathname: () => '/catalog',
    useParams: () => ({}),
  };
});

describe('CatalogClient Navigation & Filter Synchronization', () => {
  beforeEach(() => {
    currentParams = new URLSearchParams();
    vi.clearAllMocks();
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  it('renders all products by default when category is not set', () => {
    render(<CatalogClient initialProducts={initialProducts} />);
    // Check that products from multiple categories are present
    expect(screen.getByText(initialProducts[0].title)).toBeInTheDocument();
    expect(screen.getByText('Souliers Richelieu One-Cut en Veau Box')).toBeInTheDocument();
  });

  it('filters to footwear when category=shoes is in searchParams', () => {
    currentParams = new URLSearchParams('category=shoes');
    render(<CatalogClient initialProducts={initialProducts} />);
    
    // Check that button for shoes is selected
    const shoesBtn = screen.getByRole('button', { name: /Chaussures/i });
    expect(shoesBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify shoes are displayed
    expect(screen.getByText('Souliers Richelieu One-Cut en Veau Box')).toBeInTheDocument();
    // Verify clothing is NOT displayed
    expect(screen.queryByText(initialProducts[0].title)).not.toBeInTheDocument();
  });

  it('filters to clothing when category=clothing is in searchParams', () => {
    currentParams = new URLSearchParams('category=clothing');
    render(<CatalogClient initialProducts={initialProducts} />);
    
    const clothingBtn = screen.getByRole('button', { name: /Vêtements/i });
    expect(clothingBtn).toHaveAttribute('aria-pressed', 'true');

    // Verify clothing is displayed
    expect(screen.getByText(initialProducts[0].title)).toBeInTheDocument();
    // Verify shoes are NOT displayed
    expect(screen.queryByText('Souliers Richelieu One-Cut en Veau Box')).not.toBeInTheDocument();
  });

  it('does not call replaceState on initial mount or overwrite searchParams', () => {
    currentParams = new URLSearchParams('category=shoes');
    render(<CatalogClient initialProducts={initialProducts} />);
    
    // replaceState should NOT be called on mount (which would wipe out the URL)
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });

  it('hides products from the shop when their status is off (draft, inactive, or inStock=false)', () => {
    const activeProduct = {
      ...initialProducts[0],
      id: 'active-item-1',
      title: 'Active T-Shirt VIP',
      inStock: true,
      stockQuantity: 15,
      status: 'active' as const,
      isActive: true,
    };
    const offProductDraft = {
      ...initialProducts[1],
      id: 'off-item-draft',
      title: 'Pull Lacoste Draft Off',
      inStock: false,
      stockQuantity: 0,
      status: 'draft' as const,
      isActive: false,
    };
    const offProductToggled = {
      ...initialProducts[2],
      id: 'off-item-toggled',
      title: 'Sneakers Toggled Off',
      inStock: false,
      stockQuantity: 0,
    };

    render(
      <CatalogClient
        initialProducts={[activeProduct, offProductDraft, offProductToggled]}
      />
    );

    // Active product is visible in the shop
    expect(screen.getByText('Active T-Shirt VIP')).toBeInTheDocument();

    // Products with status off are completely hidden from the shop
    expect(screen.queryByText('Pull Lacoste Draft Off')).not.toBeInTheDocument();
    expect(screen.queryByText('Sneakers Toggled Off')).not.toBeInTheDocument();
  });
});
