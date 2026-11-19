import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  ALGERIAN_68_WILAYAS,
  ALGERIAN_58_WILAYAS,
  ALGERIAN_WILAYAS,
  getWilayaByCode,
  getWilayaFee,
  searchWilayas,
  getCommunesByWilaya,
  searchCommunes,
  findCommune,
  getAllCommunes,
  ALGERIAN_COMMUNES,
} from '@/lib/data/wilayas';
import { CommuneSelector } from '@/components/store/CommuneSelector';
import { WilayaSelector } from '@/components/store/WilayaSelector';
import { renderWithProviders } from './helpers/renderWithProviders';

describe('Algerian 68 Wilayas & Baladiyat (Communes) Complete Suite', () => {
  // ==========================================
  // 1. Wilayas Coverage & Boundaries (1 to 68)
  // ==========================================
  describe('Wilayas 1 to 68 Completeness & Integrity', () => {
    it('contains exactly 68 wilayas in contiguous sequential order', () => {
      expect(ALGERIAN_68_WILAYAS).toHaveLength(68);
      expect(ALGERIAN_WILAYAS).toHaveLength(68);
      // Backward-compatibility alias
      expect(ALGERIAN_58_WILAYAS).toHaveLength(68);

      for (let i = 1; i <= 68; i++) {
        const w = getWilayaByCode(i);
        expect(w).toBeDefined();
        expect(w?.code).toBe(i);
        expect(w?.name).toBeTruthy();
        expect(w?.nameAr).toBeTruthy();
        expect(w?.fee).toBeGreaterThan(0);
        expect(w?.deskFee).toBeGreaterThan(0);
        expect(w!.deskFee).toBeLessThan(w!.homeDeliveryFee);
      }
    });

    it('verifies boundary wilayas: Wilaya 1 (Adrar), Wilaya 58 (El Meniaa), and Wilaya 68 (Bou Saâda)', () => {
      const adrar = getWilayaByCode(1);
      expect(adrar?.name).toBe('Adrar');
      expect(adrar?.nameAr).toBe('أدرار');

      const elMeniaa = getWilayaByCode(58);
      expect(elMeniaa?.name).toBe('El Meniaa');
      expect(elMeniaa?.nameAr).toBe('المنيعة');

      const bouSaada = getWilayaByCode(68);
      expect(bouSaada?.name).toBe('Bou Saâda');
      expect(bouSaada?.nameAr).toBe('بوسعادة');
      expect(bouSaada?.code).toBe(68);
      expect(bouSaada?.zone).toBe('hauts-plateaux');
      expect(bouSaada?.fee).toBe(800);
      expect(bouSaada?.deskFee).toBe(650);
    });

    it('verifies all 10 newest wilayas (59 to 68) are accurately mapped', () => {
      const expectedNewWilayas: Record<number, { name: string; nameAr: string }> = {
        59: { name: 'Aflou', nameAr: 'آفلو' },
        60: { name: 'Barika', nameAr: 'بريكة' },
        61: { name: 'El Kantara', nameAr: 'القنطرة' },
        62: { name: 'Bir El Ater', nameAr: 'بئر العاتر' },
        63: { name: 'El Aricha', nameAr: 'العريشة' },
        64: { name: 'Ksar Chellala', nameAr: 'قصر الشلالة' },
        65: { name: 'Aïn Ouessara', nameAr: 'عين وسارة' },
        66: { name: 'Messaad', nameAr: 'مسعد' },
        67: { name: 'Ksar El Boukhari', nameAr: 'قصر البخاري' },
        68: { name: 'Bou Saâda', nameAr: 'بوسعادة' },
      };

      for (const [codeStr, expected] of Object.entries(expectedNewWilayas)) {
        const code = Number(codeStr);
        const w = getWilayaByCode(code);
        expect(w).toBeDefined();
        expect(w?.code).toBe(code);
        expect(w?.name).toBe(expected.name);
        expect(w?.nameAr).toBe(expected.nameAr);
      }
    });

    it('correctly searches wilayas up to 68 by code, French, and Arabic', () => {
      expect(searchWilayas('68')[0]?.name).toBe('Bou Saâda');
      expect(searchWilayas('بوسعادة')[0]?.code).toBe(68);
      expect(searchWilayas('aflou')[0]?.code).toBe(59);
      expect(searchWilayas('بريكة')[0]?.code).toBe(60);
      expect(searchWilayas('alger')[0]?.code).toBe(16);
      expect(searchWilayas('')).toHaveLength(68);
    });
  });

  // ==========================================
  // 2. Baladiyat (Communes) Completeness & Lookup
  // ==========================================
  describe('Baladiyat (Communes) Dataset & Functions', () => {
    it('has communes for every single one of the 68 wilayas', () => {
      expect(ALGERIAN_COMMUNES.length).toBeGreaterThanOrEqual(1500);
      expect(getAllCommunes().length).toBeGreaterThanOrEqual(1500);

      for (let code = 1; code <= 68; code++) {
        const communes = getCommunesByWilaya(code);
        expect(communes.length).toBeGreaterThan(0);

        for (const commune of communes) {
          expect(commune.wilayaCode).toBe(code);
          expect(commune.name).toBeTruthy();
          expect(commune.nameAr).toBeTruthy();
        }
      }
    });

    it('verifies major wilayas commune counts and key municipalities', () => {
      // Wilaya 16 (Alger) has 57 communes
      const algerCommunes = getCommunesByWilaya(16);
      expect(algerCommunes.length).toBe(57);
      expect(algerCommunes.some((c) => c.name.toLowerCase().includes('hydra'))).toBe(true);
      expect(algerCommunes.some((c) => c.name.toLowerCase().includes('bab ezzouar'))).toBe(true);

      // Wilaya 31 (Oran) has 26 communes
      const oranCommunes = getCommunesByWilaya(31);
      expect(oranCommunes.length).toBe(26);

      // Wilaya 68 (Bou Saâda) has 23 communes
      const bouSaadaCommunes = getCommunesByWilaya(68);
      expect(bouSaadaCommunes.length).toBe(23);
      expect(bouSaadaCommunes.some((c) => c.name.toLowerCase().includes('bou saada'))).toBe(true);
    });

    it('searches communes by French name, Arabic name, or postal code', () => {
      const hydraResults = searchCommunes(16, 'hydra');
      expect(hydraResults.length).toBeGreaterThanOrEqual(1);
      expect(hydraResults[0].name).toBe('Hydra');

      const hydraArResults = searchCommunes(16, 'حيدرة');
      expect(hydraArResults.length).toBeGreaterThanOrEqual(1);
      expect(hydraArResults[0].name).toBe('Hydra');

      // Search within Wilaya 68
      const bsResults = searchCommunes(68, 'saada');
      expect(bsResults.length).toBeGreaterThanOrEqual(1);

      // Unknown query returns empty
      expect(searchCommunes(16, 'xyznonexistent123')).toHaveLength(0);
    });

    it('finds commune by exact or partial name with findCommune helper', () => {
      const found = findCommune(16, 'Hydra');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Hydra');
      expect(found?.nameAr).toBe('حيدرة');

      const foundAr = findCommune(16, 'حيدرة');
      expect(foundAr).toBeDefined();
      expect(foundAr?.name).toBe('Hydra');

      expect(findCommune(16, 'UnknownPlace')).toBeUndefined();
    });
  });

  // ==========================================
  // 3. CommuneSelector Component UX
  // ==========================================
  describe('CommuneSelector Component UX', () => {
    it('shows placeholder to pick wilaya first when no wilaya is selected (French & Arabic)', () => {
      renderWithProviders(
        <CommuneSelector
          selectedWilayaCode={null}
          value=""
          onChange={vi.fn()}
        />,
        { language: 'fr' }
      );

      const button = screen.getByRole('combobox');
      expect(button).toBeDisabled();
      expect(screen.getByText(/Sélectionnez la wilaya d'abord/i)).toBeInTheDocument();
    });

    it('enables dropdown when wilaya is selected', () => {
      renderWithProviders(
        <CommuneSelector
          selectedWilayaCode={16}
          value=""
          onChange={vi.fn()}
        />,
        { language: 'fr' }
      );

      const button = screen.getByRole('combobox');
      expect(button).not.toBeDisabled();
      expect(screen.getByText(/Commune de livraison/i)).toBeInTheDocument();
    });

    it('shows baladiyat in dropdown and calls onChange when a commune is clicked', () => {
      const handleChange = vi.fn();
      renderWithProviders(
        <CommuneSelector
          selectedWilayaCode={16}
          value=""
          onChange={handleChange}
        />,
        { language: 'fr' }
      );

      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      // Should show Hydra in the list
      const hydraOption = screen.getByText(/Hydra \(حيدرة\)/i);
      expect(hydraOption).toBeInTheDocument();

      fireEvent.click(hydraOption);
      expect(handleChange).toHaveBeenCalledWith('Hydra');
    });

    it('shows only the selected wilaya baladiyat and updates list when switching wilaya', () => {
      const handleChange = vi.fn();
      const { rerender } = renderWithProviders(
        <CommuneSelector
          selectedWilayaCode={16}
          value=""
          onChange={handleChange}
        />,
        { language: 'fr' }
      );

      const button = screen.getByRole('combobox');
      fireEvent.click(button);

      // Should show Alger baladiyat, not Oran or Aflou
      expect(screen.getByText(/Hydra \(حيدرة\)/i)).toBeInTheDocument();
      expect(screen.queryByText(/Es Senia/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Aflou \(آفلو\)/i)).not.toBeInTheDocument();

      // Switch wilaya to 31 (Oran)
      rerender(
        <CommuneSelector
          selectedWilayaCode={31}
          value=""
          onChange={handleChange}
        />
      );

      // Open dropdown for Oran — only Oran's baladiyat appear
      fireEvent.click(screen.getByRole('combobox'));
      expect(screen.getByText(/Es Senia/i)).toBeInTheDocument();
      expect(screen.queryByText(/Hydra \(حيدرة\)/i)).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // 4. WilayaSelector Component with 68 Wilayas
  // ==========================================
  describe('WilayaSelector Component with 68 Wilayas', () => {
    it('displays Wilaya label in header (French)', () => {
      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={null}
          deliveryType="home"
          cartSubtotal={10000}
          onSelectWilaya={vi.fn()}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'fr' }
      );

      expect(screen.getByText(/Wilaya de livraison/i)).toBeInTheDocument();
    });

    it('allows selecting Wilaya 68 (Bou Saâda)', () => {
      const handleSelect = vi.fn();
      renderWithProviders(
        <WilayaSelector
          selectedWilayaCode={null}
          deliveryType="home"
          cartSubtotal={10000}
          onSelectWilaya={handleSelect}
          onChangeDeliveryType={vi.fn()}
        />,
        { language: 'fr' }
      );

      // Open dropdown
      const button = screen.getByRole('button', { name: /Wilaya de livraison/i });
      fireEvent.click(button);

      // Search for 68 or Bou Saada
      const searchInput = screen.getByPlaceholderText(/Tapez le code/i);
      fireEvent.change(searchInput, { target: { value: '68' } });

      const bouSaadaItem = screen.getByRole('button', { name: /68.*Bou Saâda/i });
      expect(bouSaadaItem).toBeInTheDocument();

      fireEvent.click(bouSaadaItem);
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 68,
          name: 'Bou Saâda',
        })
      );
    });
  });
});
