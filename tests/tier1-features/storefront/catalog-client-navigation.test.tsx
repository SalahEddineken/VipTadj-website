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
    expect(screen.getByText('Costume Deux Pièces en Laine Italienne Super 130s')).toBeInTheDocument();
    expect(screen.getByText('Souliers Richelieu One-Cut en Veau Box')).toBeInTheDocument();
  });

  it('filters to footwear when category=shoes is in searchParams', () => {
    currentParams = new URLSearchParams('category=shoes');
    render(<CatalogClient initialProducts={initialProducts} />);
    
    // Check that radio for shoes is selected
    const shoesRadio = screen.getByRole('radio', { name: /Chaussures/i });
    expect(shoesRadio).toBeChecked();

    // Verify shoes are displayed
    expect(screen.getByText('Souliers Richelieu One-Cut en Veau Box')).toBeInTheDocument();
    // Verify clothing is NOT displayed
    expect(screen.queryByText('Costume Deux Pièces en Laine Italienne Super 130s')).not.toBeInTheDocument();
  });

  it('filters to clothing when category=clothing is in searchParams', () => {
    currentParams = new URLSearchParams('category=clothing');
    render(<CatalogClient initialProducts={initialProducts} />);
    
    const clothingRadio = screen.getByRole('radio', { name: /Vêtements/i });
    expect(clothingRadio).toBeChecked();

    // Verify clothing is displayed
    expect(screen.getByText('Costume Deux Pièces en Laine Italienne Super 130s')).toBeInTheDocument();
    // Verify shoes are NOT displayed
    expect(screen.queryByText('Souliers Richelieu One-Cut en Veau Box')).not.toBeInTheDocument();
  });

  it('does not call replaceState on initial mount or overwrite searchParams', () => {
    currentParams = new URLSearchParams('category=shoes');
    render(<CatalogClient initialProducts={initialProducts} />);
    
    // replaceState should NOT be called on mount (which would wipe out the URL)
    expect(window.history.replaceState).not.toHaveBeenCalled();
  });
});
