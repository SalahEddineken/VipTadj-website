import { describe, it, expect } from 'vitest';
import {
  wilayasFixture,
  getWilayaByCode,
  getWilayaFee,
} from '../fixtures/wilayas.fixture';
import { settingsFixture } from '../fixtures/settings.fixture';

describe('Tier 2: Boundary & Corner Cases — Algerian Wilaya Limits (wilaya-limits.test.ts)', () => {
  // ==========================================
  // 1. Lower Boundary: Wilaya 1 (Adrar)
  // ==========================================
  it('validates lower boundary Wilaya 1 (Adrar) specifications', () => {
    const adrar = getWilayaByCode(1);
    expect(adrar).toBeDefined();
    expect(adrar?.name).toBe('Adrar');
    expect(adrar?.code).toBe(1);
    expect(adrar?.zone).toBe('sud');
    expect(adrar?.fee).toBe(1650);
    expect(adrar?.deskFee).toBe(1450);
    expect(adrar?.estimatedDays).toBe('96h - 120h');

    expect(getWilayaFee(1)).toBe(1650);
  });

  // ==========================================
  // 2. Upper Boundary: Wilaya 68 (Bou Saâda) and Wilaya 58 (El Meniaa)
  // ==========================================
  it('validates Wilaya 58 (El Meniaa) specifications', () => {
    const elMeniaa = getWilayaByCode(58);
    expect(elMeniaa).toBeDefined();
    expect(elMeniaa?.name).toBe('El Meniaa');
    expect(elMeniaa?.code).toBe(58);
    expect(elMeniaa?.zone).toBe('sud');
    expect(elMeniaa?.fee).toBe(1150);
    expect(elMeniaa?.deskFee).toBe(950);
    expect(elMeniaa?.estimatedDays).toBe('48h - 72h');

    expect(getWilayaFee(58)).toBe(1150);
  });

  it('validates upper boundary Wilaya 68 (Bou Saâda) specifications', () => {
    const bouSaada = getWilayaByCode(68);
    expect(bouSaada).toBeDefined();
    expect(bouSaada?.name).toBe('Bou Saâda');
    expect(bouSaada?.code).toBe(68);
    expect(bouSaada?.zone).toBe('hauts-plateaux');
    expect(bouSaada?.fee).toBe(800);
    expect(bouSaada?.deskFee).toBe(650);
    expect(bouSaada?.estimatedDays).toBe('24h');

    expect(getWilayaFee(68)).toBe(800);
  });

  // ==========================================
  // 3. Capital Reference Anchor: Wilaya 16 (Alger)
  // ==========================================
  it('validates capital reference anchor Wilaya 16 (Alger) with lowest delivery tier', () => {
    const alger = getWilayaByCode(16);
    expect(alger).toBeDefined();
    expect(alger?.name).toBe('Alger');
    expect(alger?.code).toBe(16);
    expect(alger?.zone).toBe('alger');
    expect(alger?.fee).toBe(700); // 700 DA Home Delivery
    expect(alger?.deskFee).toBe(550); // 550 DA Desk Delivery
    expect(alger?.estimatedDays).toBe('24h');

    expect(getWilayaFee(16)).toBe(700);
  });

  // ==========================================
  // 4. Out-of-Range Wilaya Codes (0, 69, 70, 999, negative)
  // ==========================================
  it('correctly handles out-of-range codes (0, 69, 70, 999, negative) by returning undefined and defaulting fee', () => {
    const invalidCodes = [0, 69, 70, 100, 999, -1, -50];

    for (const code of invalidCodes) {
      expect(getWilayaByCode(code)).toBeUndefined();
      // Out of range falls back safely to default national fee (600 DA)
      expect(getWilayaFee(code)).toBe(600);
    }
  });

  // ==========================================
  // 5. Desk Delivery Fees vs Home Delivery Fees
  // ==========================================
  it('verifies desk delivery fees are strictly lower than home delivery fees across all 68 Wilayas', () => {
    expect(wilayasFixture).toHaveLength(68);

    for (const wilaya of wilayasFixture) {
      expect(wilaya.deskFee).toBeDefined();
      expect(wilaya.deskFee!).toBeLessThan(wilaya.fee);
      expect(wilaya.deskFee!).toBeGreaterThan(0);
      expect(wilaya.fee).toBeGreaterThan(0);
    }
  });

  // ==========================================
  // 6. Regional Zone Groupings and Fee Consistency
  // ==========================================
  it('verifies regional zone consistency across Alger, Centre, Est, Ouest, Hauts-Plateaux, and Sud', () => {
    const sudWilayas = wilayasFixture.filter((w) => w.zone === 'sud');
    const algerWilayas = wilayasFixture.filter((w) => w.zone === 'alger');

    expect(sudWilayas.length).toBeGreaterThanOrEqual(10);
    // All southern wilayas have valid Yalidine shipping fee (>= 900 DA)
    for (const w of sudWilayas) {
      expect(w.fee).toBeGreaterThanOrEqual(900);
      expect(w.deskFee).toBeGreaterThanOrEqual(750);
    }

    // Capital Alger has 700 DA home fee
    expect(algerWilayas).toHaveLength(1);
    expect(algerWilayas[0].fee).toBe(700);

    // Blida, Boumerdès, Tipaza in centre have 800 DA fee
    const closeCenter = wilayasFixture.filter((w) => [9, 35, 42].includes(w.code));
    for (const w of closeCenter) {
      expect(w.fee).toBe(800);
    }
  });

  // ==========================================
  // 7. Store Settings Wilaya Shipping Fees Mapping
  // ==========================================
  it('verifies store settings contain all 68 Wilayas in active state with valid fees', () => {
    const { wilayaShippingFees } = settingsFixture;
    expect(Object.keys(wilayaShippingFees)).toHaveLength(68);

    for (let code = 1; code <= 68; code++) {
      const config = wilayaShippingFees[code];
      expect(config).toBeDefined();
      expect(config.active).toBe(true);
      expect(config.homeFee).toBeGreaterThanOrEqual(400);
      expect(config.deskFee).toBeGreaterThanOrEqual(250);
      expect(config.deskFee).toBeLessThan(config.homeFee);
    }
  });
});
