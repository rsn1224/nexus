import type React from 'react';

type SortMode = 'name' | 'size' | 'lastPlayed';

interface LauncherControlsProps {
  searchQuery: string;
  sortMode: SortMode;
  autoBoostEnabled: boolean;
  isScanning: boolean;
  onSearchChange: (value: string) => void;
  onSortModeChange: (mode: SortMode) => void;
  onToggleAutoBoost: () => void;
  onScanGames: () => void;
}

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'lastPlayed', label: 'RECENT' },
  { value: 'name', label: 'NAME' },
  { value: 'size', label: 'SIZE' },
];

export default function LauncherControls({
  searchQuery,
  sortMode,
  autoBoostEnabled,
  isScanning,
  onSearchChange,
  onSortModeChange,
  onToggleAutoBoost,
  onScanGames,
}: LauncherControlsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-40">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-xs select-none">
          🔍
        </span>
        <input
          type="text"
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="ゲームを検索"
          className="w-full bg-base-700/60 border border-white/[0.08] text-text-primary text-xs placeholder:text-text-muted rounded-lg pl-8 pr-3 py-2 outline-none focus:border-warm-500/60 focus:bg-base-700 transition-all duration-200 font-mono"
        />
      </div>

      {/* Sort tabs */}
      <div className="flex items-center gap-0.5 bg-base-700/60 border border-white/[0.06] rounded-lg p-0.5">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSortModeChange(opt.value)}
            aria-label={`${opt.label}順でソート`}
            aria-pressed={sortMode === opt.value}
            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.97] ${
              sortMode === opt.value
                ? 'bg-warm-500 text-base-900'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-white/[0.08]" />

      {/* AUTO BOOST toggle */}
      <button
        type="button"
        onClick={onToggleAutoBoost}
        aria-label={autoBoostEnabled ? 'Auto Boost を無効化' : 'Auto Boost を有効化'}
        aria-pressed={autoBoostEnabled}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.97] border ${
          autoBoostEnabled
            ? 'bg-warm-500/15 border-warm-500/40 text-warm-400'
            : 'bg-transparent border-white/[0.08] text-text-muted hover:border-white/20 hover:text-text-secondary'
        }`}
      >
        <span className={`text-sm ${autoBoostEnabled ? 'text-warm-400' : 'text-text-muted'}`}>
          ⚡
        </span>
        BOOST {autoBoostEnabled ? 'ON' : 'OFF'}
      </button>

      {/* Scan button */}
      <button
        type="button"
        onClick={onScanGames}
        disabled={isScanning}
        aria-label="ゲームをスキャン"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-200 active:scale-[0.97] border ${
          isScanning
            ? 'bg-base-700/40 border-white/[0.06] text-text-muted cursor-not-allowed'
            : 'bg-accent-500/10 border-accent-500/30 text-accent-400 hover:bg-accent-500/20 hover:border-accent-500/50'
        }`}
      >
        {isScanning ? (
          <>
            <span className="w-3 h-3 border border-accent-400 border-t-transparent rounded-full animate-spin" />
            SCANNING
          </>
        ) : (
          <>
            <span className="text-sm">⟳</span>
            SCAN
          </>
        )}
      </button>
    </div>
  );
}
