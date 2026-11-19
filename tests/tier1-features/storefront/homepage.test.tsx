import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

describe('Tier 1: Storefront — Homepage Editorial Experience (F-SF-02)', () => {
  // ==========================================
  // Test 1: Hero Editorial Title & Subtitle
  // ==========================================
  it('renders the luxury editorial hero banner with season title and high-fashion headline', () => {
    render(<HomePage />);

    expect(screen.getByText(/Collection Automne-Hiver 2026/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /L'Art du (Costume|Vêtement) & du Soulier Masculin/i, level: 1 })
    ).toBeInTheDocument();
  });

  // ==========================================
  // Test 2: Hero Primary Call to Action
  // ==========================================
  it('contains prominent call-to-action button directing shoppers to the full catalog (/catalog)', () => {
    render(<HomePage />);

    const ctaButton = screen.getByRole('link', { name: /Explorer le Catalogue/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/catalog');
    expect(ctaButton.className).toContain('btn-luxury-gold');
  });

  // ==========================================
  // Test 3: Algerian Trust Badges (68 Wilayas Shipping)
  // ==========================================
  it('displays the 68 Wilayas express logistics trust badge with courier partnerships (Yalidine & ZR Express)', () => {
    render(<HomePage />);

    const wilayaHeading = screen.getByRole('heading', { name: /(58|68) Wilayas Algériennes/i, level: 3 });
    expect(wilayaHeading).toBeInTheDocument();
    expect(screen.getByText(/Yalidine & ZR Express/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmation téléphonique avant tout envoi/i)).toBeInTheDocument();
  });

  // ==========================================
  // Test 4: Trust Badges (Direct COD Payment)
  // ==========================================
  it('displays the Cash on Delivery (COD) trust badge reassuring shoppers of no upfront bank card requirement', () => {
    render(<HomePage />);

    const codHeadings = screen.getAllByRole('heading', { name: /Paiement à la Livraison \(COD\)/i });
    expect(codHeadings.length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Payez en espèces à la réception de votre colis/i)
    ).toBeInTheDocument();
  });

  // ==========================================
  // Test 5: Craftsmanship Story & Haute Couture Quality
  // ==========================================
  it('renders the craftsmanship pillar highlighting bespoke tailoring, Italian wool, and Spanish leather', () => {
    render(<HomePage />);

    const craftHeading = screen.getByRole('heading', { name: /(Coupe & Finitions Haute Couture|Matières Nobles & Finitions Soignées)/i, level: 3 });
    expect(craftHeading).toBeInTheDocument();
    expect(
      screen.getByText(/Italie et d'Espagne/i)
    ).toBeInTheDocument();
  });

  // ==========================================
  // Test 6: Editorial Readiness & Algerian Currency Verification
  // ==========================================
  it('displays store readiness indicator and verified Algerian Dinar currency formatting', () => {
    render(<HomePage />);

    expect(screen.getByText(/VIP TADJ Core Infrastructure Status/i)).toBeInTheDocument();
    const currencyDisplays = screen.getAllByText((content) => content.includes('38') && content.includes('500') && content.includes('DA'));
    expect(currencyDisplays.length).toBeGreaterThan(0);
  });
});
