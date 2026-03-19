import type React from 'react';
import { useMemo, useState } from 'react';
import { useInitialData } from '../../hooks/useInitialData';
import { launcherPageSuggestions } from '../../lib/localAi';
import {
  useLauncherActions,
  useLauncherState,
  useLauncherStore,
} from '../../stores/useLauncherStore';
import AiPanel from '../shared/AiPanel';
import { ErrorBoundary } from '../ui';
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

  useInitialData(() => scanGames(), [scanGames]);

  const filteredAndSortedGames = useMemo(() => {
    let filtered = games;
    if (searchQuery) {
      filtered = filtered.filter((game) =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
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

  const featuredGame = useMemo(() => {
    if (games.length === 0) return null;
    const withPlayed = games.filter((g) => lastPlayed[g.app_id]);
    if (withPlayed.length === 0) return null;
    return withPlayed.reduce((a, b) =>
      (lastPlayed[a.app_id] ?? 0) > (lastPlayed[b.app_id] ?? 0) ? a : b,
    );
  }, [games, lastPlayed]);

  const suggestions = useMemo(
    () => launcherPageSuggestions(games.length, favorites.length),
    [games, favorites],
  );

  const favoriteGames = useMemo(
    () => filteredAndSortedGames.filter((g) => favorites.includes(g.app_id)),
    [filteredAndSortedGames, favorites],
  );
  const otherGames = useMemo(
    () => filteredAndSortedGames.filter((g) => !favorites.includes(g.app_id)),
    [filteredAndSortedGames, favorites],
  );

  return (
    <div className="h-full overflow-y-auto">
      {/* Header bar */}
      <div className="sticky top-0 z-10 bg-base-900/90 backdrop-blur-sm border-b border-white/[0.06]">
        {/* Stats strip */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-white/[0.04]">
          <span className="text-xs font-bold text-warm-400">
            {games.length}
            <span className="text-text-muted font-normal ml-1">GAMES</span>
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span className="text-xs font-bold text-accent-400">
            {favorites.length}
            <span className="text-text-muted font-normal ml-1">FAVORITES</span>
          </span>
          {filteredAndSortedGames.length !== games.length && (
            <>
              <span className="w-px h-3 bg-white/10" />
              <span className="text-xs text-text-muted">
                {filteredAndSortedGames.length} results
              </span>
            </>
          )}
          <div className="flex-1" />
          <span
            className={`text-xs font-bold uppercase ${autoBoostEnabled ? 'text-warm-400' : 'text-text-muted'}`}
          >
            {autoBoostEnabled ? '⚡ BOOST ACTIVE' : '⚡ BOOST OFF'}
          </span>
        </div>
        <div className="px-4 py-2.5">
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
        </div>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Error */}
        {error && (
          <div className="rounded-xl border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-xs text-danger-500">
            ERROR: {error}
          </div>
        )}

        {/* Featured hero card */}
        {featuredGame && !searchQuery && (
          <ErrorBoundary name="フィーチャーカード">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full bg-warm-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-warm-500">
                  Continue Playing
                </span>
              </div>
              <GameCard
                game={featuredGame}
                isFavorite={favorites.includes(featuredGame.app_id)}
                lastPlayedAt={lastPlayed[featuredGame.app_id]}
                onLaunch={handleLaunchGame}
                onToggleFavorite={toggleFavorite}
                isBoosting={isBoosting}
                autoBoostEnabled={autoBoostEnabled}
                featured
              />
            </div>
          </ErrorBoundary>
        )}

        {/* Games content */}
        <ErrorBoundary name="ゲームリスト">
          {filteredAndSortedGames.length > 0 ? (
            <div className="flex flex-col gap-6">
              {/* Favorites section */}
              {favoriteGames.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full bg-accent-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-accent-500">
                      Favorites
                    </span>
                    <span className="text-xs text-text-muted">({favoriteGames.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {favoriteGames.map((game) => (
                      <GameCard
                        key={game.app_id}
                        game={game}
                        isFavorite
                        lastPlayedAt={lastPlayed[game.app_id]}
                        onLaunch={handleLaunchGame}
                        onToggleFavorite={toggleFavorite}
                        isBoosting={isBoosting}
                        autoBoostEnabled={autoBoostEnabled}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All games section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-text-muted" />
                    <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">
                      {searchQuery ? 'Search Results' : 'All Games'}
                    </span>
                    <span className="text-xs text-text-muted">({otherGames.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {otherGames.map((game) => (
                    <GameCard
                      key={game.app_id}
                      game={game}
                      isFavorite={false}
                      lastPlayedAt={lastPlayed[game.app_id]}
                      onLaunch={handleLaunchGame}
                      onToggleFavorite={toggleFavorite}
                      isBoosting={isBoosting}
                      autoBoostEnabled={autoBoostEnabled}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : isScanning ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-warm-500 border-t-transparent animate-spin" />
              <div className="text-sm text-text-muted">ゲームをスキャン中...</div>
            </div>
          ) : searchQuery ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="text-2xl text-text-muted">🔍</div>
              <div className="text-sm text-text-secondary">検索結果がありません</div>
              <div className="text-xs text-text-muted">"{searchQuery}"</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-4xl text-text-muted">🎮</div>
              <div className="text-sm font-semibold text-text-secondary">
                ゲームが見つかりません
              </div>
              <div className="text-xs text-text-muted">上部のスキャンボタンを押してください</div>
            </div>
          )}
        </ErrorBoundary>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <div className="rounded-xl bg-base-800/60 border border-white/[0.06] p-4">
            <AiPanel suggestions={suggestions} />
          </div>
        )}
      </div>
    </div>
  );
}
