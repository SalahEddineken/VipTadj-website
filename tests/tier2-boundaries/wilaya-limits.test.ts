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
    expect(adrar?.fee).toBe(900);
    expect(adrar?.deskFee).toBe(500);
    expect(adrar?.estimatedDays).toBe('72h - 96h');

    expect(getWilayaFee(1)).toBe(900);
  });

  // ==========================================
  // 2. Upper Boundary: Wilaya 58 (El Meniaa)
  // ==========================================
  it('validates upper boundary Wilaya 58 (El Meniaa) specifications', () => {
    const elMeniaa = getWilayaByCode(58);
    expect(elMeniaa).toBeDefined();
    expect(elMeniaa?.name).toBe('El Meniaa');
    expect(elMeniaa?.code).toBe(58);
    expect(elMeniaa?.zone).toBe('sud');
    expect(elMeniaa?.fee).toBe(900);
    expect(elMeniaa?.deskFee).toBe(600);
    expect(elMeniaa?.estimatedDays).toBe('72h - 96h');

    expect(getWilayaFee(58)).toBe(900);
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
    expect(alger?.fee).toBe(400); // 400 DA Home Delivery
    expect(alger?.deskFee).toBe(250); // 250 DA Desk Delivery
    expect(alger?.estimatedDays).toBe('24h');

    expect(getWilayaFee(16)).toBe(400);
  });

  // ==========================================
  // 4. Out-of-Range Wilaya Codes (0, 59, 999, negative, NaN)
  // ==========================================
  it('correctly handles out-of-range codes (0, 59, 999, negative) by returning undefined and defaulting fee', () => {
    const invalidCodes = [0, 59, 60, 100, 999, -1, -50];

    for (const code of invalidCodes) {
      expect(getWilayaByCode(code)).toBeUndefined();
      // Out of range falls back safely to default national fee (600 DA)
      expect(getWilayaFee(code)).toBe(600);
    }
  });

  // ==========================================
  // 5. Desk Delivery Fees vs Home Delivery Fees
  // ==========================================
  it('verifies desk delivery fees are strictly lower than home delivery fees across all 58 Wilayas', () => {
    expect(wilayasFixture).toHaveLength(58);

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
    const centreWilayas = wilayasFixture.filter((w) => w.zone === 'centre');

    expect(sudWilayas.length).toBeGreaterThanOrEqual(10);
    // All southern wilayas have 900 DA home fee
    for (const w of sudWilayas) {
      expect(w.fee).toBe(900);
    }

    // Capital Alger has 400 DA home fee
    expect(algerWilayas).toHaveLength(1);
    expect(algerWilayas[0].fee).toBe(400);

    // Blida, Boumerdès, Tipaza in centre have 500 DA fee
    const closeCenter = wilayasFixture.filter((w) => [9, 35, 42].includes(w.code));
    for (const w of closeCenter) {
      expect(w.fee).toBe(500);
    }
  });

  // ==========================================
  // 7. Store Settings Wilaya Shipping Fees Mapping
  // ==========================================
  it('verifies store settings contain all 58 Wilayas in active state with valid fees', () => {
    const { wilayaShippingFees } = settingsFixture;
    expect(Object.keys(wilayaShippingFees)).toHaveLength(58);

    for (let code = 1; code <= 58; code++) {
      const config = wilayaShippingFees[code];
      expect(config).toBeDefined();
      expect(config.active).toBe(true);
      expect(config.homeFee).toBeGreaterThanOrEqual(400);
      expect(config.deskFee).toBeGreaterThanOrEqual(250);
      expect(config.deskFee).toBeLessThan(config.homeFee);
    }
  });
});
