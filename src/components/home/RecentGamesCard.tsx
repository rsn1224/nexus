import type React from 'react';
import { useState } from 'react';
import { useLauncherStore } from '../../stores/useLauncherStore';
import { useNavStore } from '../../stores/useNavStore';
import { Card, EmptyState } from '../ui';

function getGameInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function getInitialBg(name: string): string {
  const seed = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const colors = [
    'bg-[#4c1d95]/60',
    'bg-[#1e3a5f]/60',
    'bg-[#164e63]/60',
    'bg-[#312e81]/60',
    'bg-[#3b0764]/60',
  ];
  return colors[seed % colors.length];
}

const MAX_RECENT = 4;

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '未プレイ';
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  return `${Math.floor(days / 7)}週間前`;
}

function GameThumb({ appId, name }: { appId: number; name: string }): React.ReactElement {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${getInitialBg(name)} rounded`}
      >
        <span className="text-sm font-bold text-white/30 select-none">{getGameInitial(name)}</span>
      </div>
    );
  }

  return (
    <img
      src={`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`}
      alt={name}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function RecentGamesCard(): React.ReactElement {
  const games = useLauncherStore((s) => s.games);
  const lastPlayed = useLauncherStore((s) => s.lastPlayed);
  const navigateTo = useNavStore((s) => s.navigateTo);

  const recentGames = [...games]
    .sort((a, b) => (lastPlayed[b.app_id] ?? 0) - (lastPlayed[a.app_id] ?? 0))
    .slice(0, MAX_RECENT);

  return (
    <Card title="RECENT GAMES" accentColor="warm">
      {games.length === 0 ? (
        <EmptyState message="ゲーム未検出" action="GAMES Wing でスキャンを実行" />
      ) : (
        <div className="flex flex-col gap-1.5">
          {recentGames.map((game) => (
            <button
              key={game.app_id}
              type="button"
              onClick={() => navigateTo('games')}
              className="flex items-center gap-3 p-2 rounded-lg bg-base-700/20 hover:bg-base-700/40 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                <GameThumb appId={game.app_id} name={game.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-text-primary truncate">{game.name}</div>
                <div className="text-xs text-text-muted">{formatDate(lastPlayed[game.app_id])}</div>
              </div>
              {game.size_gb > 0 && (
                <div className="text-xs text-text-muted shrink-0 tabular-nums font-mono">
                  {game.size_gb.toFixed(1)} GB
                </div>
              )}
            </button>
          ))}
          {games.length > MAX_RECENT && (
            <button
              type="button"
              onClick={() => navigateTo('games')}
              className="text-xs text-accent-500 hover:text-accent-400 transition-colors text-center py-1"
            >
              全 {games.length} タイトルを表示 →
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
