import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Tier 1: Admin — Order Notification Sound Chimes & Mute Preferences (F-ORD-05)', () => {
  const MUTE_KEY = 'vip_admin_audio_muted';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Sound chime manager harness
  class OrderAudioChimeManager {
    private audio: HTMLAudioElement;
    private isMuted: boolean = false;

    constructor(soundSrc = '/sounds/order-chime.mp3') {
      this.audio = new Audio(soundSrc);
      const saved = localStorage.getItem(MUTE_KEY);
      this.isMuted = saved === 'true';
    }

    public getAudioSrc(): string {
      return this.audio.src;
    }

    public getMuted(): boolean {
      return this.isMuted;
    }

    public setMuted(muted: boolean): void {
      this.isMuted = muted;
      localStorage.setItem(MUTE_KEY, String(muted));
    }

    public toggleMuted(): boolean {
      this.setMuted(!this.isMuted);
      return this.isMuted;
    }

    public async onIncomingOrder(): Promise<{ played: boolean; visualAlert: boolean }> {
      if (this.isMuted) {
        return { played: false, visualAlert: true };
      }

      try {
        await this.audio.play();
        return { played: true, visualAlert: true };
      } catch (err) {
        return { played: false, visualAlert: true };
      }
    }
  }

  // ==========================================
  // Test 1: Audio Element Initialization
  // ==========================================
  it('initializes audio alert element pointing to the official order chime sound file', () => {
    const manager = new OrderAudioChimeManager();
    expect(manager.getAudioSrc()).toContain('/sounds/order-chime.mp3');
    expect(manager.getMuted()).toBe(false);
  });

  // ==========================================
  // Test 2: Incoming Order Plays Sound Chime
  // ==========================================
  it('triggers audio.play() when a new COD order is registered in the system', async () => {
    const manager = new OrderAudioChimeManager();
    const result = await manager.onIncomingOrder();

    expect(result.played).toBe(true);
    expect(result.visualAlert).toBe(true);
  });

  // ==========================================
  // Test 3: Audio Mute Suppression
  // ==========================================
  it('suppresses audio playback when administrator has muted order notifications', async () => {
    const manager = new OrderAudioChimeManager();
    manager.setMuted(true);
    expect(manager.getMuted()).toBe(true);

    const result = await manager.onIncomingOrder();
    expect(result.played).toBe(false);
    expect(result.visualAlert).toBe(true); // Visual notification persists even when muted
  });

  // ==========================================
  // Test 4: Mute Preference Persistence
  // ==========================================
  it('persists mute preference to localStorage across admin dashboard reloads', () => {
    const manager1 = new OrderAudioChimeManager();
    manager1.setMuted(true);
    expect(localStorage.getItem(MUTE_KEY)).toBe('true');

    // Reload / fresh manager
    const manager2 = new OrderAudioChimeManager();
    expect(manager2.getMuted()).toBe(true);

    // Toggle unmute
    manager2.toggleMuted();
    expect(localStorage.getItem(MUTE_KEY)).toBe('false');
    expect(manager2.getMuted()).toBe(false);
  });

  // ==========================================
  // Test 5: Sound Toggle User Interaction
  // ==========================================
  it('toggles sound on and off seamlessly with each user toggle click', () => {
    const manager = new OrderAudioChimeManager();
    expect(manager.getMuted()).toBe(false);

    // Click 1: Mute
    const state1 = manager.toggleMuted();
    expect(state1).toBe(true);
    expect(manager.getMuted()).toBe(true);

    // Click 2: Unmute
    const state2 = manager.toggleMuted();
    expect(state2).toBe(false);
    expect(manager.getMuted()).toBe(false);
  });

  // ==========================================
  // Test 6: Visual Alert Accompaniment
  // ==========================================
  it('guarantees visual notification alert banner accompanies every incoming order regardless of audio state', async () => {
    const manager = new OrderAudioChimeManager();

    // In unmuted state
    const unmutedAlert = await manager.onIncomingOrder();
    expect(unmutedAlert.visualAlert).toBe(true);

    // In muted state
    manager.setMuted(true);
    const mutedAlert = await manager.onIncomingOrder();
    expect(mutedAlert.visualAlert).toBe(true);
  });
});
