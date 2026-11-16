import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('Tier 1: Storefront — Luxury Storefront Design & Navigation Layout (F-SF-01)', () => {
  // ==========================================
  // Test 1: Header Brand Identity
  // ==========================================
  it('renders the brand title "VIP TADJ" and luxury subtitle in the navigation header', () => {
    render(<HomePage />);
    const brandElements = screen.getAllByText(/VIP TADJ/i);
    expect(brandElements.length).toBeGreaterThan(0);

    const subtitle = screen.getByText(/Haute Couture Masculine/i);
    expect(subtitle).toBeInTheDocument();
  });

  // ==========================================
  // Test 2: Announcement Bar
  // ==========================================
  it('displays the top announcement bar with 58 Wilayas shipping, COD payment, and telephone contact', () => {
    render(<HomePage />);

    expect(screen.getByText(/Haute Élégance Masculine/i)).toBeInTheDocument();
    expect(screen.getByText(/Livraison 58 Wilayas/i)).toBeInTheDocument();
    const codBadges = screen.getAllByText(/Paiement à la Livraison \(COD\)/i);
    expect(codBadges.length).toBeGreaterThan(0);

    const phoneLink = screen.getByRole('link', { name: /\+213/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:+213550000000');
  });

  // ==========================================
  // Test 3: Category Navigation Links
  // ==========================================
  it('contains navigation links for the 3 luxury categories (Vêtements, Chaussures, Accessoires)', () => {
    render(<HomePage />);

    const clothingLink = screen.getByRole('link', { name: /Vêtements/i });
    expect(clothingLink).toHaveAttribute('href', '/catalog?category=clothing');

    const shoesLink = screen.getByRole('link', { name: /Chaussures/i });
    expect(shoesLink).toHaveAttribute('href', '/catalog?category=shoes');

    const accessoriesLink = screen.getByRole('link', { name: /Accessoires/i });
    expect(accessoriesLink).toHaveAttribute('href', '/catalog?category=accessories');
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

    expect(screen.getByText(/Alger • Oran • Constantine/i)).toBeInTheDocument();
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
