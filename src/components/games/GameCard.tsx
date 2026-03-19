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
  featured?: boolean;
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

function isRecentlyPlayed(timestamp: number | undefined): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp < DAYS_RECENT * MS_PER_DAY;
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
  featured = false,
}: GameCardProps): React.ReactElement {
  const [imgError, setImgError] = useState(false);
  const isBusy = autoBoostEnabled && isBoosting;
  const isRecent = isRecentlyPlayed(lastPlayedAt);

  if (featured) {
    return (
      <div className="group relative rounded-xl overflow-hidden border border-white/[0.08] bg-base-800 transition-all duration-300 hover:border-warm-500/40 hover:shadow-xl hover:shadow-warm-500/10">
        <div className="relative overflow-hidden h-48">
          {!imgError ? (
            <img
              src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`}
              alt={game.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-base-700 flex items-center justify-center">
              <span className="text-xs text-text-muted font-mono">NO IMAGE</span>
            </div>
          )}

          <div className="absolute inset-0 bg-linear-to-r from-base-900/95 via-base-900/60 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-warm-500 text-base-900 tracking-wider">
                LAST PLAYED
              </span>
              {isRecent && (
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-accent-500/90 text-base-900 tracking-wider">
                  RECENT
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-1 line-clamp-1">{game.name}</h2>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs text-text-secondary">{formatLastPlayed(lastPlayedAt)}</span>
              {game.size_gb > 0 && (
                <span className="text-xs text-text-muted">{game.size_gb.toFixed(1)} GB</span>
              )}
              {profileName && (
                <ProfileBadge profileName={profileName} isActive={isProfileActive ?? false} />
              )}
            </div>
            <button
              type="button"
              onClick={() => handleLaunchGame(game.app_id)}
              disabled={isBusy}
              aria-label={`${game.name}を起動`}
              className={`self-start flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.98] ${
                isBusy
                  ? 'bg-base-600 text-text-muted cursor-not-allowed'
                  : 'bg-warm-500 text-base-900 hover:bg-warm-400 shadow-lg shadow-warm-500/30'
              }`}
            >
              {isBusy ? '⚡ BOOSTING...' : '▶ PLAY NOW'}
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.app_id);
            }}
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            aria-pressed={isFavorite}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border backdrop-blur-sm text-base active:scale-[0.98] ${
              isFavorite
                ? 'bg-accent-500/30 text-accent-400 border-accent-500/50'
                : 'bg-black/50 text-text-muted border-white/10 hover:text-accent-400 hover:border-accent-500/30'
            }`}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-xl overflow-hidden bg-base-800 border border-white/[0.06] transition-all duration-300 hover:border-warm-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-warm-500/10">
      {/* Game Artwork */}
      <div className="relative overflow-hidden h-36">
        {!imgError ? (
          <img
            src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`}
            alt={game.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-base-700 flex items-center justify-center">
            <span className="text-xs text-text-muted font-mono">NO IMAGE</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-base-900 via-base-900/40 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {isRecent && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-warm-500 text-base-900 uppercase tracking-wide">
              RECENT
            </span>
          )}
        </div>

        {/* Favorite toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(game.app_id);
          }}
          aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          aria-pressed={isFavorite}
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border backdrop-blur-sm text-sm active:scale-[0.95] ${
            isFavorite
              ? 'bg-accent-500/30 text-accent-400 border-accent-500/50'
              : 'bg-black/50 text-text-muted border-white/10 hover:text-accent-400 hover:border-accent-500/30'
          }`}
        >
          {isFavorite ? '★' : '☆'}
        </button>

        {/* Game name + info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <div className="text-xs font-semibold text-text-primary leading-tight line-clamp-1">
            {game.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-text-muted">{formatLastPlayed(lastPlayedAt)}</span>
            {game.size_gb > 0 && (
              <span className="text-xs text-text-muted">· {game.size_gb.toFixed(1)} GB</span>
            )}
          </div>
          {profileName && (
            <ProfileBadge
              profileName={profileName}
              isActive={isProfileActive ?? false}
              className="mt-1"
            />
          )}
        </div>

        {/* LAUNCH hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-base-900/20">
          <button
            type="button"
            onClick={() => handleLaunchGame(game.app_id)}
            disabled={isBusy}
            aria-label={`${game.name}を起動`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.97] backdrop-blur-sm ${
              isBusy
                ? 'bg-base-600/90 text-text-muted cursor-not-allowed'
                : 'bg-warm-500 text-base-900 hover:bg-warm-400 shadow-lg shadow-warm-500/40'
            }`}
          >
            {isBusy ? '⚡ BOOSTING' : '▶ LAUNCH'}
          </button>
        </div>
      </div>
    </div>
  );
}
