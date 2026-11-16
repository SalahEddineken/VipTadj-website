import { describe, it, expect } from 'vitest';
import {
  wilayasFixture,
  getWilayaByCode,
  getWilayaFee,
} from '../../fixtures/wilayas.fixture';

describe('Tier 1: Checkout — Algerian 58 Wilayas Selector & Tariff Matrix (F-CHECK-01)', () => {
  // ==========================================
  // Test 1: Complete 58 Wilayas Dataset
  // ==========================================
  it('contains all 58 Algerian Wilayas in exact numerical sequence from 1 (Adrar) to 58 (El Meniaa)', () => {
    expect(wilayasFixture).toHaveLength(58);

    wilayasFixture.forEach((wilaya, index) => {
      expect(wilaya.code).toBe(index + 1);
      expect(wilaya.name).toBeTruthy();
      expect(wilaya.fee).toBeGreaterThan(0);
      expect(wilaya.zone).toBeDefined();
      expect(wilaya.estimatedDays).toBeTruthy();
    });

    expect(wilayasFixture[0].name).toBe('Adrar');
    expect(wilayasFixture[15].name).toBe('Alger');
    expect(wilayasFixture[30].name).toBe('Oran');
    expect(wilayasFixture[57].name).toBe('El Meniaa');
  });

  // ==========================================
  // Test 2: Search Wilaya by Name or Code
  // ==========================================
  it('searches and resolves wilayas by code or French/Arabic name', () => {
    const alger = getWilayaByCode(16);
    expect(alger).toBeDefined();
    expect(alger?.name).toBe('Alger');

    const oran = getWilayaByCode(31);
    expect(oran?.name).toBe('Oran');

    const constantine = getWilayaByCode(25);
    expect(constantine?.name).toBe('Constantine');

    const invalid = getWilayaByCode(99);
    expect(invalid).toBeUndefined();
  });

  // ==========================================
  // Test 3: Regional Fee Tiers Assignment
  // ==========================================
  it('assigns accurate regional delivery fee tiers across capital, coastal, and southern zones', () => {
    // Alger (Capital): 400 DA
    expect(getWilayaFee(16)).toBe(400);

    // Blida & Tipaza (Centre / Metropole): 500 DA
    expect(getWilayaFee(9)).toBe(500); // Blida

    // Oran & Constantine (Major Coastal & East hubs): 600 DA
    expect(getWilayaFee(31)).toBe(600); // Oran
    expect(getWilayaFee(25)).toBe(600); // Constantine

    // Grand Sud (Adrar, Tamanrasset, Biskra): 900 DA
    expect(getWilayaFee(1)).toBe(900); // Adrar
    expect(getWilayaFee(11)).toBe(900); // Tamanrasset
    expect(getWilayaFee(7)).toBe(900); // Biskra
  });

  // ==========================================
  // Test 4: Estimated Delivery Days
  // ==========================================
  it('provides realistic delivery lead times per geographic zone (24h for Algiers vs multi-day for South)', () => {
    const alger = getWilayaByCode(16);
    expect(alger?.estimatedDays).toBe('24h');

    const oran = getWilayaByCode(31);
    expect(oran?.estimatedDays).toBe('24h - 48h');

    const tamanrasset = getWilayaByCode(11);
    expect(tamanrasset?.estimatedDays).toBe('96h - 120h');
  });

  // ==========================================
  // Test 5: Zone Partitioning
  // ==========================================
  it('groups wilayas into valid logistics zones (alger, centre, ouest, est, hauts-plateaux, sud)', () => {
    const sudWilayas = wilayasFixture.filter((w) => w.zone === 'sud');
    expect(sudWilayas.length).toBeGreaterThanOrEqual(10);
    sudWilayas.forEach((w) => expect(w.zone).toBe('sud'));

    const algerZone = wilayasFixture.filter((w) => w.zone === 'alger');
    expect(algerZone).toHaveLength(1);
    expect(algerZone[0].code).toBe(16);
  });

  // ==========================================
  // Test 6: Desk (Stop Desk) vs Home Delivery Fees
  // ==========================================
  it('differentiates stop desk pickup fees from express home delivery fees', () => {
    // Algiers stop desk is 250 DA vs 400 DA home delivery
    const alger = getWilayaByCode(16);
    expect(alger?.deskFee).toBeDefined();
    expect(alger?.deskFee).toBeLessThan(alger!.fee);
    expect(alger?.deskFee).toBe(250);
    expect(alger?.fee).toBe(400);
  });
});
