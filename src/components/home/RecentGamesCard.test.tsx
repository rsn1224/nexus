import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RecentGamesCard from './RecentGamesCard';

vi.mock('../../stores/useLauncherStore', () => ({
  useLauncherStore: vi.fn(
    (selector: (s: { games: unknown[]; lastPlayed: Record<number, number> }) => unknown) => {
      const store = { games: [], lastPlayed: {} };
      return selector(store);
    },
  ),
}));

vi.mock('../../stores/useNavStore', () => ({
  useNavStore: vi.fn((selector: (s: { navigateTo: () => void }) => unknown) =>
    selector({ navigateTo: vi.fn() }),
  ),
}));

describe('RecentGamesCard', () => {
  it('ゲーム未検出時に EmptyState を表示', () => {
    render(<RecentGamesCard />);
    expect(screen.getByText('ゲーム未検出')).toBeInTheDocument();
  });

  it('RECENT GAMES ヘッダーが表示される', () => {
    render(<RecentGamesCard />);
    expect(screen.getByText('RECENT GAMES')).toBeInTheDocument();
  });
});
