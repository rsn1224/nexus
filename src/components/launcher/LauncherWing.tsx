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

// ─── GameCard Props Interface ───────────────────────────────────────────────────────

interface GameCardProps {
  game: GameInfo;
  isFavorite: boolean;
  lastPlayedAt: number | undefined;
  onLaunch: (appId: number) => void;
  onToggleFavorite: (appId: number) => void;
  isBoosting: boolean;
  autoBoostEnabled: boolean;
}

// ─── Helper Functions ───────────────────────────────────────────────────────────────

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

const sortBtnStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  padding: '3px 8px',
  background: active ? 'var(--color-cyan-500)' : 'transparent',
  color: active ? 'var(--color-base-900)' : 'var(--color-text-muted)',
  border: `1px solid ${active ? 'var(--color-cyan-500)' : 'var(--color-border-subtle)'}`,
  borderRadius: '3px',
  cursor: 'pointer',
  letterSpacing: '0.05em',
});

// ─── GameCard Component ─────────────────────────────────────────────────────────────

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

  return (
    <div
      style={{
        background: 'var(--color-base-800)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* サムネイル */}
      {!imgError && (
        <img
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`}
          alt={game.name}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '94px',
            objectFit: 'cover',
            borderRadius: '3px 3px 0 0',
            display: 'block',
            background: 'var(--color-base-700)',
          }}
        />
      )}
      {imgError && (
        <div
          style={{
            width: '100%',
            height: '94px',
            background: 'var(--color-base-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          NO IMAGE
        </div>
      )}

      {/* カード本体 */}
      <div
        style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}
      >
        {/* ゲーム名行 + お気に入りボタン */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.app_id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isFavorite ? 'var(--color-accent-500)' : 'var(--color-text-muted)',
              fontSize: '13px',
              padding: '0',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {isFavorite ? '\u2605' : '\u2606'}
          </button>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-primary)',
              letterSpacing: '0.02em',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={game.name}
          >
            {game.name}
          </div>
        </div>

        {/* サイズ */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          {game.size_gb === 0 ? '-- GB' : `${game.size_gb.toFixed(1)} GB`}
        </div>

        {/* 最終プレイ */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          {formatLastPlayed(lastPlayedAt)}
        </div>

        {/* LAUNCH ボタン */}
        <button
          type="button"
          onClick={() => handleLaunchGame(game.app_id)}
          disabled={autoBoostEnabled && isBoosting}
          style={{
            marginTop: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '4px 0',
            background:
              autoBoostEnabled && isBoosting ? 'var(--color-base-600)' : 'var(--color-accent-500)',
            color:
              autoBoostEnabled && isBoosting ? 'var(--color-text-muted)' : 'var(--color-base-900)',
            border: 'none',
            borderRadius: '2px',
            cursor: autoBoostEnabled && isBoosting ? 'default' : 'pointer',
            letterSpacing: '0.05em',
            width: '100%',
            opacity: autoBoostEnabled && isBoosting ? 0.5 : 1,
          }}
        >
          {autoBoostEnabled && isBoosting ? '\u25b6 BOOSTING...' : '\u25b6 LAUNCH'}
        </button>
      </div>
    </div>
  );
}

// ─── LauncherWing Component ───────────────────────────────────────────────────────

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

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── ヘッダー ── */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-cyan-500)',
          letterSpacing: '0.15em',
          marginBottom: '12px',
        }}
      >
        ▶ ゲーム起動
      </div>

      {/* ── コントロールバー ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* SCAN */}
        <button
          type="button"
          onClick={() => void scanGames()}
          disabled={isScanning}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '4px 12px',
            background: 'transparent',
            color: isScanning ? 'var(--color-text-muted)' : 'var(--color-cyan-500)',
            border: `1px solid ${isScanning ? 'var(--color-border-subtle)' : 'var(--color-cyan-500)'}`,
            borderRadius: '3px',
            cursor: isScanning ? 'default' : 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          {isScanning ? 'SCANNING...' : 'SCAN'}
        </button>

        {/* ソートボタン */}
        <button
          type="button"
          onClick={() => setSortMode('name')}
          style={sortBtnStyle(sortMode === 'name')}
        >
          NAME
        </button>
        <button
          type="button"
          onClick={() => setSortMode('recent')}
          style={sortBtnStyle(sortMode === 'recent')}
        >
          最近
        </button>
        <button
          type="button"
          onClick={() => setSortMode('favorites')}
          style={sortBtnStyle(sortMode === 'favorites')}
        >
          {'\u2605'}優先
        </button>

        {/* 検索 */}
        <input
          type="search"
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '3px 8px',
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '3px',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            width: '140px',
          }}
        />
      </div>

      {/* ── AutoBoost トグル ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button
          type="button"
          onClick={toggleAutoBoost}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '3px 8px',
            background: autoBoostEnabled ? 'var(--color-accent-500)' : 'transparent',
            color: autoBoostEnabled ? 'var(--color-base-900)' : 'var(--color-text-muted)',
            border: `1px solid ${autoBoostEnabled ? 'var(--color-accent-500)' : 'var(--color-border-subtle)'}`,
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          {autoBoostEnabled ? '\u26a1 AUTO BOOST: ON' : '\u26a1 AUTO BOOST: OFF'}
        </button>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          起動時にプロセス最適化を自動実行
        </span>
      </div>

      {/* ── エラーバナー ── */}
      {error && (
        <div
          style={{
            borderBottom: '1px solid var(--color-danger-600)',
            background: 'var(--color-base-800)',
            padding: '8px 12px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-danger-500)',
            }}
          >
            ERROR: {error}
          </div>
        </div>
      )}

      {/* ── カードグリッド ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isScanning ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            SCANNING STEAM LIBRARY...
          </div>
        ) : sortedGames.length === 0 && searchQuery !== '' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            「{searchQuery}」に一致するゲームが見つかりません
          </div>
        ) : games.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            NO GAMES — PRESS SCAN TO DETECT STEAM LIBRARY
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
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
