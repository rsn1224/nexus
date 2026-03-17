import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { launcherPageSuggestions } from '../../lib/localAi';
import {
  useLauncherActions,
  useLauncherState,
  useLauncherStore,
} from '../../stores/useLauncherStore';
import AiPanel from '../shared/AiPanel';
import { Card } from '../ui';
import GameCard from './GameCard';
import LauncherControls from './LauncherControls';

export default function LauncherWing(): React.ReactElement {
  const { games, isScanning, error, favorites, lastPlayed, sortMode, searchQuery } =
    useLauncherState();
  const { toggleAutoBoost, launchGame, scanGames, toggleFavorite, setSortMode, setSearchQuery } =
    useLauncherActions();
  const autoBoostEnabled = useLauncherStore((s) => s.autoBoostEnabled);
  const [isBoosting, setIsBoosting] = useState(false);

  const handleLaunchGame = async (appId: number) => {
    if (autoBoostEnabled) setIsBoosting(true);
    try {
      await launchGame(appId);
    } finally {
      setIsBoosting(false);
    }
  };

  useEffect(() => {
    void scanGames();
  }, [scanGames]);

  // ゲームのソートとフィルタリング
  const filteredAndSortedGames = useMemo(() => {
    let filtered = games;

    // 検索フィルタ
    if (searchQuery) {
      filtered = filtered.filter((game) =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'size':
          return b.size_gb - a.size_gb;
        case 'lastPlayed': {
          const aTime = lastPlayed[a.app_id] ?? 0;
          const bTime = lastPlayed[b.app_id] ?? 0;
          return bTime - aTime;
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [games, searchQuery, sortMode, lastPlayed]);

  // AI提案
  const suggestions = useMemo(
    () => launcherPageSuggestions(games.length, favorites.length),
    [games, favorites],
  );

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] mb-2">
          GAME LAUNCHER
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-4">
        <LauncherControls
          searchQuery={searchQuery}
          sortMode={sortMode}
          autoBoostEnabled={autoBoostEnabled}
          isScanning={isScanning}
          onSearchChange={setSearchQuery}
          onSortModeChange={setSortMode}
          onToggleAutoBoost={toggleAutoBoost}
          onScanGames={() => void scanGames()}
        />
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-4 border-[var(--color-danger-500)]">
          <div className="font-[var(--font-mono)] text-xs text-[var(--color-danger-500)]">
            Error: {error}
          </div>
        </Card>
      )}

      {/* Games Grid */}
      <Card>
        {filteredAndSortedGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredAndSortedGames.map((game) => (
              <GameCard
                key={game.app_id}
                game={game}
                isFavorite={favorites.includes(game.app_id)}
                lastPlayedAt={lastPlayed[game.app_id]}
                onLaunch={handleLaunchGame}
                onToggleFavorite={toggleFavorite}
                isBoosting={isBoosting}
                autoBoostEnabled={autoBoostEnabled}
              />
            ))}
          </div>
        ) : isScanning ? (
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] text-center py-8">
            ゲームをスキャン中...
          </div>
        ) : searchQuery ? (
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] text-center py-8">
            検索結果がありません
          </div>
        ) : (
          <div className="font-[var(--font-mono)] text-[11px] text-[var(--color-text-muted)] text-center py-8">
            ゲームが見つかりません
            <br />
            スキャンを実行してください
          </div>
        )}
      </Card>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card className="mt-4">
          <AiPanel suggestions={suggestions} />
        </Card>
      )}
    </div>
  );
}
