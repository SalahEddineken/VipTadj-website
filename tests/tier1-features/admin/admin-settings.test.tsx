import { describe, it, expect, beforeEach } from 'vitest';
import { mockDataProvider } from '../../helpers/mockDataProvider';
import { calculateDeliveryFee } from '../../helpers/testUtils';
import { StoreSettings } from '@/types';

describe('Tier 1: Admin — 58 Wilaya Delivery Fee Settings (F-ADM-06)', () => {
  beforeEach(() => {
    mockDataProvider.reset();
  });

  // ==========================================
  // Test 1: Load All 58 Wilaya Shipping Fees
  // ==========================================
  it('retrieves store settings containing tariffs configured for all 58 Algerian wilayas', async () => {
    const settings = await mockDataProvider.getSettings();

    expect(settings).toBeDefined();
    expect(settings.storeName).toBe('VIP TADJ');
    expect(settings.currency).toBe('DZD');
    expect(settings.wilayaShippingFees).toBeDefined();

    const configuredWilayas = Object.keys(settings.wilayaShippingFees);
    expect(configuredWilayas).toHaveLength(58);

    // Verify Algiers defaults
    expect(settings.wilayaShippingFees[16].homeFee).toBe(400);
    expect(settings.wilayaShippingFees[16].deskFee).toBe(250);
    expect(settings.wilayaShippingFees[16].active).toBe(true);
  });

  // ==========================================
  // Test 2: Modify Home Delivery Fee for Specific Wilaya
  // ==========================================
  it('modifies home delivery fee for a specific wilaya (e.g. Alger: 400 DA -> 450 DA)', async () => {
    const currentSettings = await mockDataProvider.getSettings();
    const updatedFees = {
      ...currentSettings.wilayaShippingFees,
      [16]: {
        ...currentSettings.wilayaShippingFees[16],
        homeFee: 450,
      },
    };

    const saved = await mockDataProvider.updateSettings({
      wilayaShippingFees: updatedFees,
    });

    expect(saved.wilayaShippingFees[16].homeFee).toBe(450);

    const refreshed = await mockDataProvider.getSettings();
    expect(refreshed.wilayaShippingFees[16].homeFee).toBe(450);
  });

  // ==========================================
  // Test 3: Modify Desk Delivery Fee for Specific Wilaya
  // ==========================================
  it('modifies stop desk pickup fee for a specific wilaya (e.g. Oran desk: 350 DA -> 300 DA)', async () => {
    const currentSettings = await mockDataProvider.getSettings();
    const updatedFees = {
      ...currentSettings.wilayaShippingFees,
      [31]: {
        ...currentSettings.wilayaShippingFees[31],
        deskFee: 300,
      },
    };

    const saved = await mockDataProvider.updateSettings({
      wilayaShippingFees: updatedFees,
    });

    expect(saved.wilayaShippingFees[31].deskFee).toBe(300);

    const refreshed = await mockDataProvider.getSettings();
    expect(refreshed.wilayaShippingFees[31].deskFee).toBe(300);
  });

  // ==========================================
  // Test 4: Update Free Shipping Threshold
  // ==========================================
  it('updates the free shipping qualification threshold (e.g. from 15,000 DA to 25,000 DA)', async () => {
    const saved = await mockDataProvider.updateSettings({
      freeShippingThreshold: 25000,
    });

    expect(saved.freeShippingThreshold).toBe(25000);

    // Verify checkout shipping fee logic with new threshold:
    // Subtotal of 18,000 DA is no longer free under 25,000 DA threshold
    const feeUnderNewThreshold = calculateDeliveryFee(18000, 16, 25000);
    expect(feeUnderNewThreshold).toBe(400);

    // Subtotal of 26,000 DA qualifies for free shipping
    const feeQualified = calculateDeliveryFee(26000, 16, 25000);
    expect(feeQualified).toBe(0);
  });

  // ==========================================
  // Test 5: Wilaya Active / Inactive Shipping Toggle
  // ==========================================
  it('enables disabling and re-enabling delivery service for remote wilayas', async () => {
    const currentSettings = await mockDataProvider.getSettings();

    // Disable delivery for Wilaya 33 (Illizi)
    const updatedFees = {
      ...currentSettings.wilayaShippingFees,
      [33]: {
        ...currentSettings.wilayaShippingFees[33],
        active: false,
      },
    };

    const saved = await mockDataProvider.updateSettings({
      wilayaShippingFees: updatedFees,
    });

    expect(saved.wilayaShippingFees[33].active).toBe(false);

    // Re-enable
    saved.wilayaShippingFees[33].active = true;
    const reEnabled = await mockDataProvider.updateSettings({
      wilayaShippingFees: saved.wilayaShippingFees,
    });
    expect(reEnabled.wilayaShippingFees[33].active).toBe(true);
  });

  // ==========================================
  // Test 6: Settings Persistence Across Operations
  // ==========================================
  it('ensures modified settings persist across subsequent store queries', async () => {
    await mockDataProvider.updateSettings({
      phone: '+213550112233',
      email: 'contact@viptadj.dz',
    });

    const refreshed = await mockDataProvider.getSettings();
    expect(refreshed.phone).toBe('+213550112233');
    expect(refreshed.email).toBe('contact@viptadj.dz');
  });
});
