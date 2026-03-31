import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Optimizations from './Optimizations';

const mockStore = {
  candidates: [
    {
      id: 'dns_optimize',
      label: 'DNS Server',
      current_state: '163.139.9.214,163.139.8.214,163.139.9.21',
      is_recommended: true,
    },
    {
      id: 'power_plan',
      label: 'Power Plan',
      current_state: 'Balanced',
      is_recommended: true,
    },
  ],
  selected: new Set<string>(),
  isLoadingCandidates: false,
  isApplying: false,
  lastResult: null,
  error: null,
  fetchCandidates: vi.fn(() => Promise.resolve()),
  toggleCandidate: vi.fn(),
  applySelected: vi.fn(() => Promise.resolve()),
  clearResult: vi.fn(),
  clearError: vi.fn(),
  history: [],
};

vi.mock('../stores/useOptimizeStore', () => ({
  useOptimizeStore: vi.fn((sel?: (s: typeof mockStore) => unknown) =>
    sel ? sel(mockStore) : mockStore,
  ),
}));

describe('Optimizations', () => {
  it('長い current_state が truncate で省略される構造になっている', () => {
    const { container } = render(<Optimizations />);

    // current_state を表示する span が truncate クラスを持つこと
    const stateSpans = container.querySelectorAll('[class*="truncate"]');
    expect(stateSpans.length).toBeGreaterThan(0);

    // 右側ラッパー div が max-w-[40%] を持つこと
    const maxWDivs = container.querySelectorAll('[class*="max-w-\\[40%\\]"]');
    expect(maxWDivs.length).toBeGreaterThan(0);
  });

  it('REC バッジが shrink-0 で常に表示される', () => {
    render(<Optimizations />);
    const recBadges = screen.getAllByText('REC');
    expect(recBadges.length).toBeGreaterThan(0);
    for (const badge of recBadges) {
      expect(badge.className).toContain('shrink-0');
    }
  });
});
