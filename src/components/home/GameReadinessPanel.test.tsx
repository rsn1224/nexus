import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameReadinessPanel from './GameReadinessPanel';

// Store モック
vi.mock('../../stores/usePulseStore', () => ({
  usePulseStore: vi.fn(() => null),
}));
vi.mock('../../stores/useHardwareStore', () => ({
  useHardwareData: vi.fn(() => ({ info: null, diskUsagePercent: null })),
}));
vi.mock('../../stores/useTimerStore', () => ({
  useTimerState: vi.fn(() => ({ timerState: null })),
}));
vi.mock('../../stores/useFrameTimeStore', () => ({
  useFrameTimeState: vi.fn(() => ({ snapshot: null })),
}));
vi.mock('../../stores/useGameProfileStore', () => ({
  useGameProfileState: vi.fn(() => ({ activeProfileId: null, profiles: [] })),
}));

describe('GameReadinessPanel', () => {
  it('GAME READINESS ヘッダーが表示される', () => {
    render(<GameReadinessPanel />);
    expect(screen.getByText('GAME READINESS')).toBeInTheDocument();
  });

  it('3軸のラベルが表示される', () => {
    render(<GameReadinessPanel />);
    expect(screen.getByText('リソース')).toBeInTheDocument();
    expect(screen.getByText('最適化')).toBeInTheDocument();
    expect(screen.getByText('FPS')).toBeInTheDocument();
  });

  it('ゲーム非実行時に FPS 軸が N/A', () => {
    render(<GameReadinessPanel />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });
});
