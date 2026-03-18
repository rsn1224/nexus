import '@testing-library/jest-dom';
import { vi } from 'vitest';

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
