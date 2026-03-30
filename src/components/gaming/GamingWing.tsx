import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import log from '../../lib/logger';
import GameLauncher from './GameLauncher';
import GamingOptimizations from './GamingOptimizations';
import GamingPresets from './GamingPresets';

export default function GamingWing(): React.ReactElement {
  const { t } = useTranslation('tactics');
  const [activePreset, setActivePreset] = useState('balanced');
  const [optimizations, setOptimizations] = useState([
    {
      id: 'gpu',
      label: 'GPU 最適化',
      description: 'GPUクロックとメモリを最適化',
      icon: 'gpu',
      enabled: true,
    },
    {
      id: 'network',
      label: 'ネットワーク最適化',
      description: 'レイテンシを最小化',
      icon: 'network',
      enabled: false,
    },
    {
      id: 'storage',
      label: 'ストレージ最適化',
      description: 'SSDパフォーマンスを最大化',
      icon: 'storage',
      enabled: true,
    },
  ]);

  const recentGames = [
    {
      id: 'game1',
      name: 'Cyberpunk 2077',
      icon: 'sports_esports',
      lastPlayed: '2日前',
      hours: 124,
    },
    {
      id: 'game2',
      name: 'Valorant',
      icon: 'sports_esports',
      lastPlayed: '1時間前',
      hours: 89,
    },
    {
      id: 'game3',
      name: 'Elden Ring',
      icon: 'sports_esports',
      lastPlayed: '3日前',
      hours: 156,
    },
  ];

  const handleToggleOptimization = (id: string) => {
    setOptimizations((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt)),
    );
  };

  const handleLaunchGame = (gameId: string) => {
    log.info({ gameId }, 'gaming: launching game');
  };

  return (
    <div className="min-h-screen bg-base-900 p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scanline-overlay"></div>
        <div className="scanning-line animate-pulse opacity-20"></div>
        <div className="absolute top-[20%] left-[20%] w-96 h-96 rounded-full bg-accent-500/2 blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 rounded-full bg-warning-500/1 blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="mb-14 relative">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="h-px w-12 bg-accent-500"></div>
              <span className="font-label text-accent-500 text-[10px] tracking-[0.3em] font-bold">
                {t('gaming.moduleLabel')}
              </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter text-text-primary mb-2">
              ARSENAL{' '}
              <span className="text-accent-500 drop-shadow-[0_0_15px_rgba(68,214,44,0.3)]">
                WING
              </span>
            </h1>
            <p className="font-label text-text-secondary/40 text-[10px] tracking-[0.2em] uppercase">
              {t('gaming.gamingPreset')}: {activePreset.toUpperCase()} {/* */}{' '}
              {/* Status: OPTIMIZED */}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-warning-500/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap tracking-widest">
                {t('gaming.searchingGames')}
              </span>
              <button
                type="button"
                className="relative group px-6 py-2.5 border border-text-secondary/20 text-text-secondary/60 hover:text-warning-500 hover:border-warning-500/50 font-label text-[10px] tracking-widest uppercase transition-all bg-white/2 glass-panel"
              >
                <div className="hud-btn-scan"></div>
                {t('gaming.searchGames')}
              </button>
            </div>
            <div className="relative group">
              <span className="absolute -top-5 right-0 font-label text-[8px] text-accent-500 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse whitespace-nowrap tracking-widest">
                {t('gaming.optimizationApplied')}
              </span>
              <button
                type="button"
                className="relative px-8 py-2.5 bg-accent-500/10 border border-accent-500 text-accent-500 font-black text-[10px] tracking-widest uppercase transition-all hover:bg-accent-500/20 glass-panel"
              >
                <div className="scanning-line animate-pulse opacity-20"></div>
                {t('gaming.apply')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Gaming Presets */}
          <div className="md:col-span-12">
            <GamingPresets activePreset={activePreset} setActivePreset={setActivePreset} />
          </div>

          {/* Optimizations */}
          <div className="md:col-span-12 lg:col-span-8">
            <div className="glass-panel border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="reflective-overlay absolute inset-0"></div>
              <div className="p-8 relative z-10">
                <GamingOptimizations
                  optimizations={optimizations}
                  onToggleOptimization={handleToggleOptimization}
                />
              </div>
            </div>
          </div>

          {/* Game Launcher */}
          <div className="md:col-span-12 lg:col-span-4">
            <GameLauncher recentGames={recentGames} onLaunchGame={handleLaunchGame} />
          </div>
        </div>
      </div>
    </div>
  );
}
