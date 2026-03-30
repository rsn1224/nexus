import type React from 'react';
import { useTranslation } from 'react-i18next';

interface GameLauncherProps {
  recentGames: {
    id: string;
    name: string;
    icon: string;
    lastPlayed: string;
    hours: number;
  }[];
  onLaunchGame: (gameId: string) => void;
}

export default function GameLauncher({
  recentGames,
  onLaunchGame,
}: GameLauncherProps): React.ReactElement {
  const { t } = useTranslation('tactics');

  return (
    <div className="glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
      <div className="reflective-overlay absolute inset-0"></div>
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <span className="material-symbols-outlined text-accent-500 text-2xl">rocket_launch</span>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">
            {t('gaming.gameLauncher')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentGames.map((game) => (
            <button
              type="button"
              key={game.id}
              className="glass-panel border border-white/20 p-6 cursor-pointer group hover:border-accent-500/50 transition-all relative overflow-hidden"
              onClick={() => onLaunchGame(game.id)}
              onKeyDown={(e) => e.key === 'Enter' && onLaunchGame(game.id)}
            >
              <div className="reflective-overlay absolute inset-0"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-black/40 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-accent-500 text-xl">
                      {game.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-text-primary mb-1 group-hover:text-accent-500 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-text-secondary/60 text-[9px]">
                      {t('gaming.lastPlayed', { time: game.lastPlayed })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary/40 text-[8px] font-label uppercase tracking-widest">
                    {game.hours}h
                  </span>
                  <button
                    type="button"
                    className="px-4 py-2 bg-accent-500/10 border border-accent-500/30 text-accent-500 text-[10px] font-black tracking-widest uppercase hover:bg-accent-500/20 transition-all"
                  >
                    {t('gaming.launch')}
                  </button>
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
