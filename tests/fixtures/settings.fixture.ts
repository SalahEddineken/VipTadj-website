import { StoreSettings } from './types';
import { wilayasFixture } from './wilayas.fixture';

// Generate shipping matrix for all 58 Wilayas
const wilayaShippingFees: Record<number, { homeFee: number; deskFee: number; active: boolean }> = {};
wilayasFixture.forEach((w) => {
  wilayaShippingFees[w.code] = {
    homeFee: w.fee,
    deskFee: w.deskFee || Math.round(w.fee * 0.6),
    active: true,
  };
});

export const settingsFixture: StoreSettings = {
  storeName: 'VIP TADJ',
  phone: '+213 550 12 34 56',
  email: 'contact@viptadj.dz',
  currency: 'DZD',
  currencySymbol: 'DA',
  freeShippingThreshold: 15000, // Free shipping threshold in DZD
  wilayaShippingFees,
  wilayasDelivery: wilayasFixture,
};
