import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// 1. Mock LocalStorage for JSDOM
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string): string | null => {
      return store[key] !== undefined ? store[key] : null;
    }),
    setItem: vi.fn((key: string, value: string): void => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[key];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
    key: vi.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
    get length(): number {
      return Object.keys(store).length;
    },
  };
};

const localStorageMock = createLocalStorageMock();

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });

  // 2. Mock matchMedia for responsive layouts & mobile drawer tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // 3. Mock window.Audio for order notification chimes (F-ORD-05)
  class AudioMock {
    src: string;
    volume: number = 1;
    muted: boolean = false;
    currentTime: number = 0;
    duration: number = 1;
    paused: boolean = false;
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    load = vi.fn();

    constructor(src?: string) {
      this.src = src || '';
    }
  }

  // @ts-expect-error Mocking Audio constructor in JSDOM
  window.Audio = AudioMock;
  // @ts-expect-error Mocking Audio constructor in Node/global
  global.Audio = AudioMock;
}

// 4. Mock next/navigation (useRouter, usePathname, useSearchParams)
vi.mock('next/navigation', () => {
  const pushMock = vi.fn();
  const replaceMock = vi.fn();
  const backMock = vi.fn();
  const forwardMock = vi.fn();
  const refreshMock = vi.fn();
  const prefetchMock = vi.fn();

  return {
    useRouter: () => ({
      push: pushMock,
      replace: replaceMock,
      back: backMock,
      forward: forwardMock,
      refresh: refreshMock,
      prefetch: prefetchMock,
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
  };
});

// 5. Global beforeEach hook to reset state between test cases
beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

export { localStorageMock };
