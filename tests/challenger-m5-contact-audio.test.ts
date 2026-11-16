import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Modules under test
import {
  isValidAlgerianPhone,
  formatAlgerianPhone,
  formatTelLink,
  normalizePhoneForWhatsApp,
} from '@/lib/utils/phoneUtils';
import { generateWhatsAppConfirmLink } from '@/lib/utils/contactUtils';
import {
  OrderAudioChimeManager,
  orderAudioChime,
  MUTE_KEY,
} from '@/lib/utils/orderAudioChime';
import {
  AdminNotificationProvider,
  useAdminNotification,
} from '@/lib/context/admin-notification-context';
import { getDataStore } from '@/lib/data-provider';
import { ordersFixture } from './fixtures/orders.fixture';
import { Order } from '@/types';

// =============================================================================
// Web Audio API Mocks for JSDOM Verification
// =============================================================================
class MockAudioParam {
  value: number;
  setValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  exponentialRampToValueAtTime = vi.fn((val: number) => {
    this.value = val;
  });
  constructor(defaultValue: number = 0) {
    this.value = defaultValue;
  }
}

class MockGainNode {
  gain = new MockAudioParam(1);
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockOscillatorNode {
  type: string = 'sine';
  frequency = new MockAudioParam(440);
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn(() => {
    // Automatically trigger onended to resolve synthesis promise in tests
    setTimeout(() => {
      if (this.onended) {
        this.onended(new Event('ended'));
      }
    }, 5);
  });
  stop = vi.fn();
  onended: ((event: Event) => void) | null = null;
}

class MockAudioContext {
  state: AudioContextState = 'running';
  currentTime: number = 0;
  destination = {};
  createdOscillators: MockOscillatorNode[] = [];
  createdGainNodes: MockGainNode[] = [];

  createGain = vi.fn(() => {
    const gain = new MockGainNode();
    this.createdGainNodes.push(gain);
    return gain;
  });

  createOscillator = vi.fn(() => {
    const osc = new MockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc;
  });

  resume = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);
}

describe('CHALLENGER M5-2: Empirical Stress Test Suite (Phone Normalization, WhatsApp Link, Audio Chimes & Admin Notification)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    orderAudioChime.setMuted(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Section 1: Phone Formatting & Normalization Adversarial Stress
  // ===========================================================================
  describe('1. Phone Formatting & Normalization Stress', () => {
    it('1.1 correctly generates RFC tel: links for 9-digit numbers missing leading zero (550123456 -> tel:+213550123456)', () => {
      // Mobilis (6), Djezzy (7), Ooredoo (5) 9-digit national mobile inputs
      expect(formatTelLink('550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('661223344')).toBe('tel:+213661223344');
      expect(formatTelLink('770334455')).toBe('tel:+213770334455');
    });

    it('1.2 correctly normalizes 9-digit numbers for WhatsApp links without leading zero (550123456 -> 213550123456)', () => {
      expect(normalizePhoneForWhatsApp('550123456')).toBe('213550123456');
      expect(normalizePhoneForWhatsApp('661223344')).toBe('213661223344');
      expect(normalizePhoneForWhatsApp('770334455')).toBe('213770334455');
    });

    it('1.3 does not falsely prefix non-mobile 9-digit strings with +213', () => {
      // 9 digits starting with 1, 2, 3, 4, 8, 9 are not Algerian mobile numbers
      expect(formatTelLink('123456789')).toBe('tel:123456789');
      expect(formatTelLink('211234567')).toBe('tel:211234567');
      expect(normalizePhoneForWhatsApp('123456789')).toBe('123456789');
    });

    it('1.4 normalizes standard 10-digit mobile numbers across all operators (05, 06, 07)', () => {
      const ooredoo = '0550123456';
      const mobilis = '0661234567';
      const djezzy = '0770987654';

      expect(formatTelLink(ooredoo)).toBe('tel:+213550123456');
      expect(formatTelLink(mobilis)).toBe('tel:+213661234567');
      expect(formatTelLink(djezzy)).toBe('tel:+213770987654');

      expect(normalizePhoneForWhatsApp(ooredoo)).toBe('213550123456');
      expect(normalizePhoneForWhatsApp(mobilis)).toBe('213661234567');
      expect(normalizePhoneForWhatsApp(djezzy)).toBe('213770987654');

      expect(formatAlgerianPhone(ooredoo)).toBe('0550 12 34 56');
      expect(formatAlgerianPhone(mobilis)).toBe('0661 23 45 67');
      expect(formatAlgerianPhone(djezzy)).toBe('0770 98 76 54');
    });

    it('1.5 cleanses international prefixes (+213 and 00213) without creating duplicate country codes', () => {
      expect(formatTelLink('+213550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('00213550123456')).toBe('tel:+213550123456');
      expect(formatTelLink('+213 661 23 45 67')).toBe('tel:+213661234567');
      expect(formatTelLink('00213-770-98-76-54')).toBe('tel:+213770987654');

      expect(normalizePhoneForWhatsApp('+213550123456')).toBe('213550123456');
      expect(normalizePhoneForWhatsApp('00213550123456')).toBe('213550123456');
      expect(normalizePhoneForWhatsApp('+213 661 23 45 67')).toBe('213661234567');
      expect(normalizePhoneForWhatsApp('00213-770-98-76-54')).toBe('213770987654');
    });

    it('1.6 handles international numbers from foreign countries gracefully in formatTelLink', () => {
      // Non-Algerian international numbers should retain their leading +
      expect(formatTelLink('+33612345678')).toBe('tel:+33612345678');
      expect(formatTelLink('+12125550123')).toBe('tel:+12125550123');
    });

    it('1.7 strips arbitrary delimiter characters (spaces, hyphens, periods, parentheses)', () => {
      const messy1 = ' (05) 50-12.34 56 ';
      const messy2 = '06 - 61 . 23 - 45 (67)';

      expect(formatTelLink(messy1)).toBe('tel:+213550123456');
      expect(formatTelLink(messy2)).toBe('tel:+213661234567');

      expect(normalizePhoneForWhatsApp(messy1)).toBe('213550123456');
      expect(normalizePhoneForWhatsApp(messy2)).toBe('213661234567');

      expect(isValidAlgerianPhone(messy1)).toBe(true);
      expect(isValidAlgerianPhone(messy2)).toBe(true);
    });

    it('1.8 safely handles null, undefined, empty string, and whitespace-only inputs without crashing', () => {
      expect(formatTelLink(null)).toBe('tel:');
      expect(formatTelLink(undefined)).toBe('tel:');
      expect(formatTelLink('')).toBe('tel:');
      expect(formatTelLink('   ')).toBe('tel:');

      expect(normalizePhoneForWhatsApp(null)).toBe('');
      expect(normalizePhoneForWhatsApp(undefined)).toBe('');
      expect(normalizePhoneForWhatsApp('')).toBe('');
      expect(normalizePhoneForWhatsApp('   ')).toBe('');

      expect(formatAlgerianPhone(null)).toBe('');
      expect(formatAlgerianPhone(undefined)).toBe('');
      expect(formatAlgerianPhone('')).toBe('');

      expect(isValidAlgerianPhone(null)).toBe(false);
      expect(isValidAlgerianPhone(undefined)).toBe(false);
      expect(isValidAlgerianPhone('')).toBe(false);
      expect(isValidAlgerianPhone('   ')).toBe(false);
    });

    it('1.9 strictly rejects letters, punctuation junk, XSS tags, and SQL injection in isValidAlgerianPhone', () => {
      expect(isValidAlgerianPhone('055012345a')).toBe(false);
      expect(isValidAlgerianPhone('+213 550 12 34 5X')).toBe(false);
      expect(isValidAlgerianPhone('<script>0550123456</script>')).toBe(false);
      expect(isValidAlgerianPhone("0550123456' OR '1'='1")).toBe(false);
      expect(isValidAlgerianPhone('null')).toBe(false);
      expect(isValidAlgerianPhone('undefined')).toBe(false);
    });

    it('1.10 strictly rejects non-mobile Algerian prefixes (021 fixed landline, 0800 toll free, 0982 VoIP)', () => {
      expect(isValidAlgerianPhone('021123456')).toBe(false); // Alger landline
      expect(isValidAlgerianPhone('031123456')).toBe(false); // Constantine landline
      expect(isValidAlgerianPhone('041123456')).toBe(false); // Oran landline
      expect(isValidAlgerianPhone('0800123456')).toBe(false); // Toll-free
      expect(isValidAlgerianPhone('0982123456')).toBe(false); // VoIP
      expect(isValidAlgerianPhone('550123456')).toBe(false); // 9-digits requires leading 0 for checkout validation
    });
  });

  // ===========================================================================
  // Section 2: WhatsApp Link Generation Adversarial Stress
  // ===========================================================================
  describe('2. WhatsApp Confirmation Link Generator Stress', () => {
    const baseOrder: Order = ordersFixture[0];

    it('2.1 preserves complex French accents in customer names without garbling or breaking URL', () => {
      const accentedOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          fullName: 'Éléonore François-Noël de La Tour',
        },
      };

      const link = generateWhatsAppConfirmLink(accentedOrder);
      const url = new URL(link);
      const decodedText = decodeURIComponent(url.searchParams.get('text') || '');

      expect(decodedText).toContain('Bonjour Éléonore François-Noël de La Tour');
      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('wa.me');
    });

    it('2.2 preserves Arabic script customer names with correct RTL text encoding', () => {
      const arabicOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          fullName: 'سفيان بن عبد الرحمن الجزائري',
        },
      };

      const link = generateWhatsAppConfirmLink(arabicOrder);
      const url = new URL(link);
      const decodedText = decodeURIComponent(url.searchParams.get('text') || '');

      expect(decodedText).toContain('Bonjour سفيان بن عبد الرحمن الجزائري / مرحباً بك،');
      expect(decodedText).toContain('تأكيد الطلبية');
      expect(decodedText).toContain('المبلغ الإجمالي');
    });

    it('2.3 preserves punctuation, apostrophes, and quotation marks in customer dossier', () => {
      const punctuatedOrder: Order = {
        ...baseOrder,
        customer: {
          ...baseOrder.customer,
          fullName: 'M. L\'Hocine "Le Boss" d\'Alger',
          address: '15, Rue des Frères Bouadou (Bâtiment B, Apt #4)',
        },
      };

      const link = generateWhatsAppConfirmLink(punctuatedOrder);
      const url = new URL(link);
      const decodedText = decodeURIComponent(url.searchParams.get('text') || '');

      expect(decodedText).toContain('M. L\'Hocine "Le Boss" d\'Alger');
      expect(decodedText).toContain('15, Rue des Frères Bouadou (Bâtiment B, Apt #4)');
    });

    it('2.4 accurately formats complex multi-item orders with diverse sizes, quantities, and DZD formatting', () => {
      const multiItemOrder: Order = {
        ...baseOrder,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            title: 'Costume Trois-Pièces Royal Navy',
            price: 45000,
            quantity: 2,
            selectedSize: '52',
            image: '/images/costume.jpg',
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            title: 'Richelieu Cuir Veau Oxford',
            price: 24000,
            quantity: 1,
            selectedSize: '43',
            image: '/images/oxford.jpg',
          },
          {
            id: 'item-3',
            productId: 'prod-3',
            title: 'Ceinture Réversible Cuir Pleine Fleur',
            price: 8500,
            quantity: 3,
            selectedSize: 'TU',
            image: '/images/ceinture.jpg',
          },
        ],
        subtotal: 139500,
        deliveryFee: 0,
        total: 139500,
      };

      const link = generateWhatsAppConfirmLink(multiItemOrder);
      const url = new URL(link);
      const decodedText = decodeURIComponent(url.searchParams.get('text') || '');

      expect(decodedText).toContain('- 2x Costume Trois-Pièces Royal Navy (Taille 52) :');
      expect(decodedText).toContain('- 1x Richelieu Cuir Veau Oxford (Taille 43) :');
      expect(decodedText).toContain('- 3x Ceinture Réversible Cuir Pleine Fleur (Taille TU) :');
      expect(decodedText).toContain('*Livraison (Alger) :* Gratuite (Offerte)');
      expect(decodedText).toContain('*Total à payer à la réception / المبلغ الإجمالي :*');
    });

    it('2.5 displays formatted delivery fee when deliveryFee > 0 and Gratuite when 0', () => {
      // Free delivery
      const freeOrder = { ...baseOrder, deliveryFee: 0 };
      const freeLink = generateWhatsAppConfirmLink(freeOrder);
      expect(decodeURIComponent(freeLink)).toContain('Gratuite (Offerte)');

      // Paid delivery
      const paidOrder = { ...baseOrder, deliveryFee: 900 };
      const paidLink = generateWhatsAppConfirmLink(paidOrder);
      const decodedPaid = decodeURIComponent(paidLink);
      expect(decodedPaid).not.toContain('Gratuite (Offerte)');
      expect(decodedPaid).toMatch(/900.*DA/);
    });

    it('2.6 appends customer notes when present and omits note line entirely when notes are absent', () => {
      // With notes
      const orderWithNotes = {
        ...baseOrder,
        customer: { ...baseOrder.customer, notes: 'Appelez-moi avant midi SVP' },
      };
      const linkWithNotes = generateWhatsAppConfirmLink(orderWithNotes);
      expect(decodeURIComponent(linkWithNotes)).toContain('*Note :* Appelez-moi avant midi SVP');

      // Without notes
      const orderWithoutNotes = {
        ...baseOrder,
        customer: { ...baseOrder.customer, notes: undefined },
      };
      const linkWithoutNotes = generateWhatsAppConfirmLink(orderWithoutNotes);
      expect(decodeURIComponent(linkWithoutNotes)).not.toContain('*Note :*');
    });

    it('2.7 verifies URL is RFC-valid, percent-encoded, and has path /213...', () => {
      const link = generateWhatsAppConfirmLink(baseOrder);
      const url = new URL(link);

      expect(url.protocol).toBe('https:');
      expect(url.hostname).toBe('wa.me');
      expect(url.pathname).toBe('/213550123456');
      expect(url.searchParams.has('text')).toBe(true);

      // Raw link must not contain raw unencoded newlines or unescaped spaces in query
      expect(link).not.toContain('\n');
      expect(link).not.toContain(' ');
    });

    it('2.8 routes WhatsApp confirmation to custom store WhatsApp number when parameter is supplied', () => {
      const storeOverride = '0770 11 22 33';
      const link = generateWhatsAppConfirmLink(baseOrder, storeOverride);
      const url = new URL(link);

      expect(url.pathname).toBe('/213770112233');
      expect(decodeURIComponent(url.searchParams.get('text') || '')).toContain(baseOrder.customer.fullName);
    });
  });

  // ===========================================================================
  // Section 3: Audio Notification Chime Manager Adversarial Stress
  // ===========================================================================
  describe('3. Audio Notification Chime Manager Stress (OrderAudioChimeManager)', () => {
    it('3.1 initializes with official chime path and unmuted by default', () => {
      const manager = new OrderAudioChimeManager();
      expect(manager.getAudioSrc()).toContain('/sounds/order-chime.mp3');
      expect(manager.getMuted()).toBe(false);
    });

    it('3.2 synthesizes dual harmonic Web Audio chime with correct frequencies: D5 (587.33Hz), A5 (880Hz), D6 (1174.66Hz)', async () => {
      const mockCtx = new MockAudioContext();
      // @ts-expect-error Mocking AudioContext on window
      window.AudioContext = vi.fn(() => mockCtx);

      // Create manager with audio element null or failing play() to force Web Audio synthesis
      const manager = new OrderAudioChimeManager();
      // @ts-expect-error Injecting mock audio failure
      manager.audio = {
        play: vi.fn().mockRejectedValue(new Error('HTMLAudioElement autoplay blocked')),
      };

      const result = await manager.onIncomingOrder();

      expect(result.visualAlert).toBe(true);
      expect(result.played).toBe(true);

      // Verify Web Audio synthesis nodes
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(3);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(2); // masterGain and shimmerGain

      const [osc1, osc2, osc3] = mockCtx.createdOscillators;

      // Tone 1: D5 (587.33 Hz)
      expect(osc1.type).toBe('sine');
      expect(osc1.frequency.setValueAtTime).toHaveBeenCalledWith(587.33, 0);

      // Tone 2: A5 (880.00 Hz) - Harmonic 5th
      expect(osc2.type).toBe('sine');
      expect(osc2.frequency.setValueAtTime).toHaveBeenCalledWith(880.00, 0);

      // Tone 3: D6 (1174.66 Hz) - Shimmer
      expect(osc3.type).toBe('sine');
      expect(osc3.frequency.setValueAtTime).toHaveBeenCalledWith(1174.66, 0);

      // Verify master gain envelope ramps to 0.22
      const [masterGain, shimmerGain] = mockCtx.createdGainNodes;
      expect(masterGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.22, 0.02);
      expect(shimmerGain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.06, 0.015);
    });

    it('3.3 uses HTMLAudioElement when available and falls back to Web Audio on rejection', async () => {
      // 1. Success case for HTMLAudioElement
      const manager = new OrderAudioChimeManager();
      const playSpy = vi.fn().mockResolvedValue(undefined);
      // @ts-expect-error Mocking audio
      manager.audio = { play: playSpy };

      const resSuccess = await manager.onIncomingOrder();
      expect(resSuccess.played).toBe(true);
      expect(playSpy).toHaveBeenCalledTimes(1);

      // 2. Failure case for HTMLAudioElement -> Fallback to Web Audio
      const mockCtx = new MockAudioContext();
      // @ts-expect-error Mocking AudioContext
      window.AudioContext = vi.fn(() => mockCtx);
      // @ts-expect-error Mocking audio failure
      manager.audio = { play: vi.fn().mockRejectedValue(new Error('Audio element error')) };

      const resFallback = await manager.onIncomingOrder();
      expect(resFallback.played).toBe(true);
      expect(mockCtx.createOscillator).toHaveBeenCalledTimes(3);
    });

    it('3.4 provides safe total silence fallback if both HTMLAudioElement and Web Audio API fail', async () => {
      // @ts-expect-error Removing AudioContext
      window.AudioContext = undefined;
      // @ts-expect-error Removing webkitAudioContext
      window.webkitAudioContext = undefined;

      const manager = new OrderAudioChimeManager();
      // @ts-expect-error Nulling audio
      manager.audio = null;

      const result = await manager.onIncomingOrder();
      expect(result.played).toBe(false);
      expect(result.visualAlert).toBe(true);
    });

    it('3.5 suppresses audio playback when muted, but visual alert remains true', async () => {
      const manager = new OrderAudioChimeManager();
      manager.setMuted(true);

      const playSpy = vi.fn();
      // @ts-expect-error Mocking audio
      manager.audio = { play: playSpy };

      const result = await manager.onIncomingOrder();
      expect(result.played).toBe(false);
      expect(result.visualAlert).toBe(true);
      expect(playSpy).not.toHaveBeenCalled();
    });

    it('3.6 persists mute state to localStorage and recovers state on new instance instantiation', () => {
      const manager1 = new OrderAudioChimeManager();
      expect(manager1.getMuted()).toBe(false);

      manager1.toggleMuted();
      expect(manager1.getMuted()).toBe(true);
      expect(localStorage.getItem(MUTE_KEY)).toBe('true');

      // Second instance loads saved setting from localStorage
      const manager2 = new OrderAudioChimeManager();
      expect(manager2.getMuted()).toBe(true);

      // Toggle unmute
      manager2.toggleMuted();
      expect(manager2.getMuted()).toBe(false);
      expect(localStorage.getItem(MUTE_KEY)).toBe('false');
    });

    it('3.7 gracefully handles localStorage errors (e.g. SecurityError in private browsing) without throwing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError or SecurityError in private mode');
      });

      const manager = new OrderAudioChimeManager();
      expect(() => manager.setMuted(true)).not.toThrow();
      expect(manager.getMuted()).toBe(true);
    });

    it('3.8 registers one-time unlock listeners on window to resume suspended AudioContext', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      new OrderAudioChimeManager();

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), { once: true, passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), { once: true, passive: true });
      expect(addEventListenerSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function), { once: true, passive: true });
    });

    it('3.9 handles unexpected AudioContext initialization crashes gracefully', async () => {
      // @ts-expect-error Mocking throwing AudioContext
      window.AudioContext = vi.fn().mockImplementation(() => {
        throw new Error('WebAudio Security/Hardware Failure');
      });

      const manager = new OrderAudioChimeManager();
      // @ts-expect-error Mocking audio
      manager.audio = null;

      const result = await manager.onIncomingOrder();
      expect(result.played).toBe(false);
      expect(result.visualAlert).toBe(true);
    });
  });

  // ===========================================================================
  // Section 4: AdminNotificationProvider Live Order Polling & Badging
  // ===========================================================================
  describe('4. AdminNotificationProvider Live Order Polling & Alerts Stress', () => {
    // Helper Test Consumer Component
    function NotificationConsumer() {
      const { pendingCount, isMuted, toggleMuted, refreshPendingCount, lastAlertTime } = useAdminNotification();

      return React.createElement(
        'div',
        null,
        React.createElement('span', { 'data-testid': 'pending-count' }, String(pendingCount)),
        React.createElement('span', { 'data-testid': 'is-muted' }, String(isMuted)),
        React.createElement('span', { 'data-testid': 'alert-status' }, lastAlertTime ? 'alerted' : 'silent'),
        React.createElement('button', { 'data-testid': 'toggle-mute-btn', onClick: () => toggleMuted() }, 'Toggle Mute'),
        React.createElement('button', { 'data-testid': 'refresh-btn', onClick: () => refreshPendingCount() }, 'Refresh')
      );
    }

    it('4.1 establishes baseline pending order count on initial mount without triggering audio chime', async () => {
      const store = getDataStore();
      const getOrdersSpy = vi.spyOn(store, 'getOrders').mockResolvedValue(
        ordersFixture.filter((o) => o.status === 'pending')
      );
      const chimeSpy = vi.spyOn(orderAudioChime, 'onIncomingOrder');

      await act(async () => {
        render(
          React.createElement(
            AdminNotificationProvider,
            null,
            React.createElement(NotificationConsumer, null)
          )
        );
      });

      expect(getOrdersSpy).toHaveBeenCalledWith({ status: 'pending' });
      // Initial mount establishes baseline, should NOT trigger chime
      expect(chimeSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId('alert-status').textContent).toBe('silent');
      expect(Number(screen.getByTestId('pending-count').textContent)).toBeGreaterThanOrEqual(1);
    });

    it('4.2 does not trigger sound chime when pending order count decreases or stays same', async () => {
      const store = getDataStore();
      const chimeSpy = vi.spyOn(orderAudioChime, 'onIncomingOrder');

      // Start with 3 pending orders
      const pendingMock = [ordersFixture[0], { ...ordersFixture[0], id: 'ord-2' }, { ...ordersFixture[0], id: 'ord-3' }];
      vi.spyOn(store, 'getOrders').mockResolvedValue(pendingMock);

      await act(async () => {
        render(
          React.createElement(
            AdminNotificationProvider,
            null,
            React.createElement(NotificationConsumer, null)
          )
        );
      });

      expect(screen.getByTestId('pending-count').textContent).toBe('3');
      expect(chimeSpy).not.toHaveBeenCalled();

      // Refresh with same count (3 -> 3)
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-btn'));
      });
      expect(chimeSpy).not.toHaveBeenCalled();

      // Refresh with decreased count (3 -> 1, e.g. orders confirmed/cancelled)
      vi.spyOn(store, 'getOrders').mockResolvedValue([ordersFixture[0]]);
      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-btn'));
      });
      expect(screen.getByTestId('pending-count').textContent).toBe('1');
      expect(chimeSpy).not.toHaveBeenCalled();
      expect(screen.getByTestId('alert-status').textContent).toBe('silent');
    });

    it('4.3 triggers audio chime and sets lastAlertTime when pending order count increases', async () => {
      const store = getDataStore();
      const chimeSpy = vi.spyOn(orderAudioChime, 'onIncomingOrder').mockResolvedValue({
        played: true,
        visualAlert: true,
      });

      // Start with 1 pending order
      vi.spyOn(store, 'getOrders').mockResolvedValue([ordersFixture[0]]);

      await act(async () => {
        render(
          React.createElement(
            AdminNotificationProvider,
            null,
            React.createElement(NotificationConsumer, null)
          )
        );
      });

      expect(screen.getByTestId('pending-count').textContent).toBe('1');
      expect(chimeSpy).not.toHaveBeenCalled();

      // New orders arrive! (1 -> 3)
      const newOrders = [
        ordersFixture[0],
        { ...ordersFixture[0], id: 'ord-new-1' },
        { ...ordersFixture[0], id: 'ord-new-2' },
      ];
      vi.spyOn(store, 'getOrders').mockResolvedValue(newOrders);

      await act(async () => {
        fireEvent.click(screen.getByTestId('refresh-btn'));
      });

      expect(screen.getByTestId('pending-count').textContent).toBe('3');
      expect(chimeSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('alert-status').textContent).toBe('alerted');
    });

    it('4.4 automatically polls getOrders every 30 seconds via interval timer and cleans up on unmount', async () => {
      vi.useFakeTimers();
      const store = getDataStore();
      const getOrdersSpy = vi.spyOn(store, 'getOrders').mockResolvedValue([]);
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      let unmountFn: () => void = () => {};
      await act(async () => {
        const { unmount } = render(
          React.createElement(
            AdminNotificationProvider,
            null,
            React.createElement(NotificationConsumer, null)
          )
        );
        unmountFn = unmount;
      });

      // Initial call on mount
      expect(getOrdersSpy).toHaveBeenCalledTimes(1);

      // Advance by 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      expect(getOrdersSpy).toHaveBeenCalledTimes(2);

      // Advance another 30 seconds
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      expect(getOrdersSpy).toHaveBeenCalledTimes(3);

      // Unmount
      act(() => {
        unmountFn();
      });
      expect(clearIntervalSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('4.5 toggles mute state between context, manager, and localStorage seamlessly', async () => {
      await act(async () => {
        render(
          React.createElement(
            AdminNotificationProvider,
            null,
            React.createElement(NotificationConsumer, null)
          )
        );
      });

      expect(screen.getByTestId('is-muted').textContent).toBe('false');

      // Click toggle mute
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-mute-btn'));
      });

      expect(screen.getByTestId('is-muted').textContent).toBe('true');
      expect(orderAudioChime.getMuted()).toBe(true);
      expect(localStorage.getItem(MUTE_KEY)).toBe('true');

      // Click toggle unmute
      await act(async () => {
        fireEvent.click(screen.getByTestId('toggle-mute-btn'));
      });

      expect(screen.getByTestId('is-muted').textContent).toBe('false');
      expect(orderAudioChime.getMuted()).toBe(false);
      expect(localStorage.getItem(MUTE_KEY)).toBe('false');
    });

    it('4.6 handles DataStore query exceptions gracefully without crashing React tree', async () => {
      const store = getDataStore();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(store, 'getOrders').mockRejectedValue(new Error('Network connectivity failure to Firestore'));

      await act(async () => {
        render(
          React.createElement(
            AdminNotificationProvider,
            null,
            React.createElement(NotificationConsumer, null)
          )
        );
      });

      expect(screen.getByTestId('pending-count').textContent).toBe('0');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('4.7 provides safe default context values when useAdminNotification is consumed outside provider', () => {
      function OrphanConsumer() {
        const value = useAdminNotification();
        return React.createElement(
          'div',
          null,
          React.createElement('span', { 'data-testid': 'orphan-pending' }, String(value.pendingCount)),
          React.createElement('span', { 'data-testid': 'orphan-muted' }, String(value.isMuted)),
          React.createElement('span', { 'data-testid': 'orphan-toggle' }, String(value.toggleMuted()))
        );
      }

      render(React.createElement(OrphanConsumer, null));

      expect(screen.getByTestId('orphan-pending').textContent).toBe('0');
      expect(screen.getByTestId('orphan-muted').textContent).toBe('false');
      expect(screen.getByTestId('orphan-toggle').textContent).toBe('false');
    });
  });
});
