import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { launcherPageSuggestions } from '../../lib/localAi';
import { useLauncherStore } from '../../stores/useLauncherStore';
import type { GameInfo } from '../../types';
import AiPanel from '../shared/AiPanel';

// ─── Constants ───────────────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_RECENT = 7;
const DAYS_PLAYED = 30;

// ─── GameCard Props Interface ─────────────────────────────────────────────────

interface GameCardProps {
  game: GameInfo;
  isFavorite: boolean;
  lastPlayedAt: number | undefined;
  onLaunch: (appId: number) => void;
  onToggleFavorite: (appId: number) => void;
  isBoosting: boolean;
  autoBoostEnabled: boolean;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatLastPlayed(timestamp: number | undefined): string {
  if (!timestamp) return '未プレイ';
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / MS_PER_DAY);
  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < DAYS_RECENT) return `${days}日前`;
  if (days < DAYS_PLAYED) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / DAYS_PLAYED)}ヶ月前`;
}

// ─── GameCard Component ───────────────────────────────────────────────────────

function GameCard({
  game,
  isFavorite,
  lastPlayedAt,
  onLaunch: handleLaunchGame,
  onToggleFavorite,
  isBoosting,
  autoBoostEnabled,
}: GameCardProps): React.ReactElement {
  const [imgError, setImgError] = useState(false);
  const isBusy = autoBoostEnabled && isBoosting;

  return (
    <div className="bg-base-800 border border-border-subtle rounded overflow-hidden flex flex-col">
      {/* サムネイル */}
      {!imgError && (
        <img
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`}
          alt={game.name}
          onError={() => setImgError(true)}
          className="w-full h-[94px] object-cover rounded-tl-[3px] rounded-tr-[3px] block bg-base-700"
        />
      )}
      {imgError && (
        <div className="w-full h-[94px] bg-base-700 flex items-center justify-center font-(--font-mono) text-[9px] text-text-muted">
          NO IMAGE
        </div>
      )}

      {/* カード本体 */}
      <div className="p-2 flex flex-col gap-1 flex-1">
        {/* ゲーム名行 + お気に入りボタン */}
        <div className="flex items-start gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.app_id);
            }}
            className={`bg-transparent border-none cursor-pointer text-[13px] p-0 leading-none shrink-0 ${isFavorite ? 'text-(--color-accent-500)' : 'text-text-muted'}`}
          >
            {isFavorite ? '\u2605' : '\u2606'}
          </button>
          <div
            className="font-(--font-mono) text-[10px] text-text-primary tracking-[0.02em] flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
            title={game.name}
          >
            {game.name}
          </div>
        </div>

        {/* サイズ */}
        <div className="font-(--font-mono) text-[9px] text-text-muted">
          {game.size_gb === 0 ? '-- GB' : `${game.size_gb.toFixed(1)} GB`}
        </div>

        {/* 最終プレイ */}
        <div className="font-(--font-mono) text-[9px] text-text-muted">
          {formatLastPlayed(lastPlayedAt)}
        </div>

        {/* LAUNCH ボタン */}
        <button
          type="button"
          onClick={() => handleLaunchGame(game.app_id)}
          disabled={isBusy}
          className={`mt-auto font-(--font-mono) text-[9px] py-1 border-none rounded-[2px] tracking-[0.05em] w-full ${
            isBusy
              ? 'bg-base-600 text-text-muted cursor-default opacity-50'
              : 'bg-(--color-accent-500) text-base-900 cursor-pointer'
          }`}
        >
          {isBusy ? '\u25b6 BOOSTING...' : '\u25b6 LAUNCH'}
        </button>
      </div>
    </div>
  );
}

// ─── LauncherWing Component ───────────────────────────────────────────────────

export default function LauncherWing(): React.ReactElement {
  const games = useLauncherStore((s) => s.games);
  const isScanning = useLauncherStore((s) => s.isScanning);
  const error = useLauncherStore((s) => s.error);
  const favorites = useLauncherStore((s) => s.favorites);
  const lastPlayed = useLauncherStore((s) => s.lastPlayed);
  const sortMode = useLauncherStore((s) => s.sortMode);
  const searchQuery = useLauncherStore((s) => s.searchQuery);
  const autoBoostEnabled = useLauncherStore((s) => s.autoBoostEnabled);
  const toggleAutoBoost = useLauncherStore((s) => s.toggleAutoBoost);
  const launchGame = useLauncherStore((s) => s.launchGame);
  const scanGames = useLauncherStore((s) => s.scanGames);
  const toggleFavorite = useLauncherStore((s) => s.toggleFavorite);
  const setSortMode = useLauncherStore((s) => s.setSortMode);
  const setSearchQuery = useLauncherStore((s) => s.setSearchQuery);
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

  const sortedGames = useMemo(() => {
    let filtered = games.filter(
      (g) => searchQuery === '' || g.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    switch (sortMode) {
      case 'recent':
        filtered = [...filtered].sort((a, b) => {
          const ta = lastPlayed[a.app_id] ?? 0;
          const tb = lastPlayed[b.app_id] ?? 0;
          return tb - ta;
        });
        break;
      case 'favorites':
        filtered = [...filtered].sort((a, b) => {
          const fa = favorites.includes(a.app_id) ? 1 : 0;
          const fb = favorites.includes(b.app_id) ? 1 : 0;
          if (fb !== fa) return fb - fa;
          return a.name.localeCompare(b.name);
        });
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return filtered;
  }, [games, sortMode, favorites, lastPlayed, searchQuery]);

  const launcherSuggestions = useMemo(
    () => launcherPageSuggestions(games.length, favorites.length),
    [games.length, favorites.length],
  );

  const sortBtnClass = (active: boolean) =>
    `font-(--font-mono) text-[9px] px-2 py-[3px] border rounded-[3px] cursor-pointer tracking-[0.05em] ${
      active
        ? 'bg-cyan-500 text-base-900 border-cyan-500'
        : 'bg-transparent text-text-muted border-border-subtle'
    }`;

  return (
    <div className="p-4 h-full flex flex-col">
      {/* ── ヘッダー ── */}
      <div className="font-[var(--font-mono)] text-[11px] font-bold text-cyan-500 tracking-[0.15em] mb-3">
        ▶ ゲーム起動
      </div>

      {/* ── コントロールバー ── */}
      <div className="flex items-center gap-2 mb-[10px] flex-wrap">
        {/* SCAN */}
        <button
          type="button"
          onClick={() => void scanGames()}
          disabled={isScanning}
          className={`font-(--font-mono) text-[10px] px-3 py-1 bg-transparent border rounded-[3px] tracking-[0.05em] ${
            isScanning
              ? 'text-text-muted border-border-subtle cursor-default'
              : 'text-cyan-500 border-cyan-500 cursor-pointer'
          }`}
        >
          {isScanning ? 'SCANNING...' : 'SCAN'}
        </button>

        {/* ソートボタン */}
        <button
          type="button"
          onClick={() => setSortMode('name')}
          className={sortBtnClass(sortMode === 'name')}
        >
          NAME
        </button>
        <button
          type="button"
          onClick={() => setSortMode('recent')}
          className={sortBtnClass(sortMode === 'recent')}
        >
          最近
        </button>
        <button
          type="button"
          onClick={() => setSortMode('favorites')}
          className={sortBtnClass(sortMode === 'favorites')}
        >
          {'\u2605'}優先
        </button>

        {/* 検索 */}
        <input
          type="search"
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ml-auto py-[3px] px-2 bg-base-800 border border-border-subtle rounded-[3px] text-text-primary font-(--font-mono) text-[10px] w-[140px]"
        />
      </div>

      {/* ── AutoBoost トグル ── */}
      <div className="flex items-center gap-2 mb-[14px]">
        <button
          type="button"
          onClick={toggleAutoBoost}
          className={`font-(--font-mono) text-[9px] px-2 py-[3px] border rounded-[3px] cursor-pointer ${
            autoBoostEnabled
              ? 'bg-(--color-accent-500) text-base-900 border-(--color-accent-500)'
              : 'bg-transparent text-text-muted border-border-subtle'
          }`}
        >
          {autoBoostEnabled ? '\u26a1 AUTO BOOST: ON' : '\u26a1 AUTO BOOST: OFF'}
        </button>
        <span className="font-(--font-mono) text-[9px] text-text-muted">
          起動時にプロセス最適化を自動実行
        </span>
      </div>

      {/* ── エラーバナー ── */}
      {error && (
        <div className="border-b border-danger-600 bg-base-800 px-3 py-2 mb-3">
          <div className="font-(--font-mono) text-[11px] text-danger-500">ERROR: {error}</div>
        </div>
      )}

      {/* ── カードグリッド ── */}
      <div className="flex-1 overflow-y-auto">
        {isScanning ? (
          <div className="flex items-center justify-center h-[200px] font-(--font-mono) text-[11px] text-text-muted">
            SCANNING STEAM LIBRARY...
          </div>
        ) : sortedGames.length === 0 && searchQuery !== '' ? (
          <div className="flex items-center justify-center h-[200px] font-(--font-mono) text-[11px] text-text-muted">
            「{searchQuery}」に一致するゲームが見つかりません
          </div>
        ) : games.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] font-(--font-mono) text-[11px] text-text-muted">
            NO GAMES — PRESS SCAN TO DETECT STEAM LIBRARY
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {sortedGames.map((game) => (
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
        )}
      </div>
      <AiPanel suggestions={launcherSuggestions} />
    </div>
  );
}
