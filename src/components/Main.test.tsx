import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Main from './Main';

// ストアモック
vi.mock('../stores/useSystemStore', () => ({
  useSystemStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      startPolling: vi.fn(),
      stopPolling: vi.fn(),
      status: null,
      alerts: [],
    }),
  ),
}));

vi.mock('../stores/useOptimizeStore', () => ({
  useOptimizeStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      fetchCandidates: vi.fn(() => Promise.resolve()),
      fetchHistory: vi.fn(() => Promise.resolve()),
      history: [],
      candidates: [],
      selected: new Set<string>(),
      isLoadingCandidates: false,
      isApplying: false,
      isReverting: false,
      lastResult: null,
      error: null,
      toggleCandidate: vi.fn(),
      applySelected: vi.fn(() => Promise.resolve()),
      revertAll: vi.fn(() => Promise.resolve()),
      clearResult: vi.fn(),
      clearError: vi.fn(),
    }),
  ),
}));

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn((sel: (s: unknown) => unknown) =>
    sel({
      fetchSettings: vi.fn(() => Promise.resolve()),
      settings: null,
    }),
  ),
}));

// 子コンポーネントはシンプルなモックに
vi.mock('./SystemStatus', () => ({ default: () => <div data-testid="system-status" /> }));
vi.mock('./Diagnostics', () => ({ default: () => <div data-testid="diagnostics" /> }));
vi.mock('./Optimizations', () => ({ default: () => <div data-testid="optimizations" /> }));
vi.mock('./QuickInfo', () => ({ default: () => <div data-testid="quick-info" /> }));
vi.mock('./SettingsPanel', () => ({ default: () => <div data-testid="settings-panel" /> }));
vi.mock('./HistoryPanel', () => ({ default: () => <div data-testid="history-panel" /> }));

describe('Main', () => {
  it('フッターに HISTORY と SETTINGS ボタンが存在する', () => {
    render(<Main />);
    expect(screen.getByRole('button', { name: /HISTORY/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /SETTINGS/i })).toBeInTheDocument();
  });

  it('フッターに REVERT ALL ボタンが存在する', () => {
    render(<Main />);
    expect(screen.getByRole('button', { name: /REVERT ALL/i })).toBeInTheDocument();
  });
});
