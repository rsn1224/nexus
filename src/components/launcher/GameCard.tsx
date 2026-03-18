import type React from 'react';
import { useState } from 'react';
import type { GameInfo } from '../../types';
import ProfileBadge from './ProfileBadge';

interface GameCardProps {
  game: GameInfo;
  isFavorite: boolean;
  lastPlayedAt: number | undefined;
  onLaunch: (appId: number) => void;
  onToggleFavorite: (appId: number) => void;
  isBoosting: boolean;
  autoBoostEnabled: boolean;
  profileName?: string;
  isProfileActive?: boolean;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_RECENT = 7;
const DAYS_PLAYED = 30;

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

export default function GameCard({
  game,
  isFavorite,
  lastPlayedAt,
  onLaunch: handleLaunchGame,
  onToggleFavorite,
  isBoosting,
  autoBoostEnabled,
  profileName,
  isProfileActive,
}: GameCardProps): React.ReactElement {
  const [imgError, setImgError] = useState(false);
  const isBusy = autoBoostEnabled && isBoosting;

  return (
    <div className="bg-base-800 border border-border-subtle rounded overflow-hidden flex flex-col transition-all duration-200 hover:border-cyan-500">
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

        {/* プロファイルバッジ */}
        {profileName && (
          <ProfileBadge profileName={profileName} isActive={isProfileActive ?? false} />
        )}

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
