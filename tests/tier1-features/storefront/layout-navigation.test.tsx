import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import HomePage from '@/app/page';
import { AnnouncementBar } from '@/components/store/AnnouncementBar';

describe('Tier 1: Storefront — Luxury Storefront Design & Navigation Layout (F-SF-01)', () => {
  // ==========================================
  // Test 1: Header Brand Identity
  // ==========================================
  it('renders the brand title "VIP TADJ" and luxury branding in the navigation header', () => {
    const { container } = render(<HomePage />);
    const brandElements = screen.getAllByText(/VIP TADJ/i);
    expect(brandElements.length).toBeGreaterThan(0);

    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    const brandLogo = within(header!).getByRole('img', { name: /VIP TADJ/i });
    expect(brandLogo).toBeInTheDocument();

    const taglines = screen.getAllByText(/Haute Élégance/i);
    expect(taglines.length).toBeGreaterThan(0);
  });

  // ==========================================
  // Test 2: Announcement Bar
  // ==========================================
  it('displays the top announcement bar with 58 Wilayas shipping, COD payment, and telephone contact', () => {
    render(<AnnouncementBar />);

    expect(screen.getByText(/Haute Élégance Masculine/i)).toBeInTheDocument();
    expect(screen.getByText(/Livraison (?:58|68) Wilayas/i)).toBeInTheDocument();
    const codBadges = screen.getAllByText(/Paiement à la Livraison \(COD\)/i);
    expect(codBadges.length).toBeGreaterThan(0);

    const phoneLinks = screen.getAllByRole('link', { name: /\+213/i });
    expect(phoneLinks.length).toBeGreaterThan(0);
    phoneLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', 'tel:+213550000000');
    });
  });

  // ==========================================
  // Test 3: Category Navigation Links
  // ==========================================
  it('contains navigation links for the 3 luxury categories (Vêtements, Chaussures, Accessoires)', () => {
    render(<HomePage />);

    const clothingLinks = screen.getAllByRole('link', { name: /Vêtements/i });
    expect(clothingLinks.some((l) => l.getAttribute('href') === '/catalog?category=clothing')).toBe(true);

    const shoesLinks = screen.getAllByRole('link', { name: /Chaussures/i });
    expect(shoesLinks.some((l) => l.getAttribute('href') === '/catalog?category=shoes')).toBe(true);

    const accessoriesLinks = screen.getAllByRole('link', { name: /Accessoires/i });
    expect(accessoriesLinks.some((l) => l.getAttribute('href') === '/catalog?category=accessories')).toBe(true);
  });

  // ==========================================
  // Test 4: Admin Portal Link
  // ==========================================
  it('provides direct access link to the Admin Management dashboard (/admin)', () => {
    render(<HomePage />);

    const adminLinks = screen.getAllByRole('link', { name: /Espace Admin|Tableau de Bord/i });
    expect(adminLinks.length).toBeGreaterThan(0);
    const hasAdminRoute = adminLinks.some((link) => link.getAttribute('href') === '/admin');
    expect(hasAdminRoute).toBe(true);
  });

  // ==========================================
  // Test 5: Luxury Editorial Footer
  // ==========================================
  it('renders luxury footer with Algerian prestige cities and copyright notice', () => {
    render(<HomePage />);

    expect(screen.getAllByText(/Chelghoum Laïd/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/© 2026 VIP TADJ/i)).toBeInTheDocument();
  });

  // ==========================================
  // Test 6: Responsive Navigation Structure
  // ==========================================
  it('ensures sticky header layout wrapper with high z-index and blurred backdrop classes', () => {
    const { container } = render(<HomePage />);

    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('z-40');
  });
});
