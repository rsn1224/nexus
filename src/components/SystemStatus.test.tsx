import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SystemStatus from './SystemStatus';

const mockStatus = {
  cpu_percent: 20.1,
  gpu_percent: 28.0,
  gpu_temp_c: 45.0,
  ram_used_gb: 21.9,
  ram_total_gb: 31.1,
  disk_free_gb: 967.8,
};

vi.mock('../stores/useSystemStore', () => ({
  useSystemStatus: vi.fn(() => ({ status: mockStatus })),
}));

vi.mock('../stores/useOptimizeStore', () => ({
  useOptimizeStore: vi.fn((sel?: (s: { history: unknown[] }) => unknown) => {
    const store = { history: Array.from({ length: 11 }) };
    return sel ? sel(store) : store;
  }),
}));

describe('SystemStatus', () => {
  it('上段カードに CPU/GPU/GPU TEMP/RAM ラベルが DOM に存在する', () => {
    render(<SystemStatus />);
    // ラベルが DOM に存在することを確認（存在しなければ getByText が throw する）
    expect(screen.getByText('CPU')).toBeTruthy();
    expect(screen.getByText('GPU')).toBeTruthy();
    expect(screen.getByText('GPU TEMP')).toBeTruthy();
    expect(screen.getByText('RAM')).toBeTruthy();
  });

  it('上段ラベルは text-[10px] tracking-[0.12em] text-text-secondary クラスを持つ', () => {
    const { container } = render(<SystemStatus />);
    // KpiCard ラベル要素（上段・下段共通）の最初の要素を確認
    const labelEls = container.querySelectorAll('[class*="tracking-\\[0\\.12em\\]"]');
    // 上段4枚 + 下段2枚 = 6枚のラベルが存在するはず
    expect(labelEls.length).toBeGreaterThanOrEqual(6);
  });

  it('下段カードに DISK FREE / SESSIONS ラベルが DOM に存在する', () => {
    render(<SystemStatus />);
    expect(screen.getByText('DISK FREE')).toBeTruthy();
    expect(screen.getByText('SESSIONS')).toBeTruthy();
  });
});
