/**
 * VIP TADJ — Order Notification Audio Chime & Mute Engine (F-ORD-05)
 * Dual-mode synthesizer: Web Audio API harmonic chime with HTMLAudioElement fallback
 * and localStorage mute preferences persistence.
 */

export const MUTE_KEY = 'vip_admin_audio_muted';

export class OrderAudioChimeManager {
  private audio: HTMLAudioElement | null = null;
  private audioSrc: string;
  private isMuted: boolean = false;
  private audioContext: AudioContext | null = null;

  constructor(soundSrc = '/sounds/order-chime.mp3') {
    this.audioSrc = soundSrc;
    if (typeof Audio !== 'undefined') {
      try {
        this.audio = new Audio(soundSrc);
      } catch {
        this.audio = null;
      }
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(MUTE_KEY);
        this.isMuted = saved === 'true';
        this.initUnlockListener();
      } catch {
        this.isMuted = false;
      }
    }
  }

  private initUnlockListener(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
    };

    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  }

  public getAudioSrc(): string {
    return this.audio?.src || this.audioSrc;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(MUTE_KEY, String(muted));
      } catch {
        // LocalStorage fallback
      }
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Synthesizes luxury dual harmonic chime using Web Audio API:
   * Tone 1: D5 (587.33 Hz) + Tone 2: A5 (880.00 Hz) + Tone 3: D6 (1174.66 Hz)
   */
  private playSynthesizedChime(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        if (typeof window === 'undefined') {
          resolve(false);
          return;
        }

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (!AudioCtx) {
          resolve(false);
          return;
        }

        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }

        const ctx = this.audioContext;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const duration = 1.25;

        // Master Gain Envelope
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, now);
        masterGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        masterGain.connect(ctx.destination);

        // Tone 1: D5 (587.33 Hz)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.connect(masterGain);

        // Tone 2: A5 (880.00 Hz) - Harmonic 5th
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now);
        osc2.connect(masterGain);

        // Tone 3: D6 (1174.66 Hz) - Bell Shimmer
        const shimmerGain = ctx.createGain();
        shimmerGain.gain.setValueAtTime(0.0001, now);
        shimmerGain.gain.exponentialRampToValueAtTime(0.06, now + 0.015);
        shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        shimmerGain.connect(ctx.destination);

        const osc3 = ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(1174.66, now);
        osc3.connect(shimmerGain);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + 0.65);

        osc1.onended = () => {
          try {
            osc1.disconnect();
            osc2.disconnect();
            osc3.disconnect();
            masterGain.disconnect();
            shimmerGain.disconnect();
          } catch {
            // Disconnect cleanup
          }
          resolve(true);
        };
      } catch {
        resolve(false);
      }
    });
  }

  public async onIncomingOrder(): Promise<{ played: boolean; visualAlert: boolean }> {
    if (this.isMuted) {
      return { played: false, visualAlert: true };
    }

    let played = false;

    // 1. Try HTMLAudioElement (ensures test mocks and audio elements succeed)
    if (this.audio) {
      try {
        await this.audio.play();
        played = true;
      } catch {
        // Fallback to Web Audio synthesis
      }
    }

    // 2. Synthesize via Web Audio API if in browser and not already played
    if (!played && typeof window !== 'undefined') {
      played = await this.playSynthesizedChime();
    }

    return { played, visualAlert: true };
  }
}

export const orderAudioChime = new OrderAudioChimeManager();
