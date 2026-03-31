import '@testing-library/jest-dom';
import { vi } from 'vitest';

// i18n mock — returns translation keys as-is for testing
vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string | string[]) => {
    const _defaultNs = Array.isArray(ns) ? ns[0] : (ns ?? 'common');
    return {
      t: (key: string, opts?: Record<string, unknown>) => {
        // Strip namespace prefix if present (e.g., "settings:general.apiKey" → "general.apiKey")
        const stripped = key.includes(':') ? key.split(':').slice(1).join(':') : key;
        if (opts?.defaultValue) return opts.defaultValue as string;
        return stripped;
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn(),
        exists: vi.fn(() => true),
      },
      ready: true,
    };
  },
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Tauri API mock
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Canvas mock — Phase γ のグラフコンポーネントテスト用
const canvasMethods = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  setLineDash: vi.fn(),
  getLineDash: vi.fn(() => []),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(0),
    width: 0,
    height: 0,
  })),
  putImageData: vi.fn(),
  canvas: { width: 300, height: 150 },
};

HTMLCanvasElement.prototype.getContext = vi.fn(
  () => canvasMethods,
) as unknown as typeof HTMLCanvasElement.prototype.getContext;
