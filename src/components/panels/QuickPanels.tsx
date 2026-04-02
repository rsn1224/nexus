/**
 * Quick Actions パネルコンテンツ
 * game / display / security / modules の 4 種類
 */
import type React from 'react';
import { memo, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import log from '../../lib/logger';
import { useMemoryStore } from '../../stores/useMemoryStore';
import type { QuickPanel } from '../../stores/useUiStore';
import { useWindowsStore } from '../../stores/useWindowsStore';
import type { VisualEffects } from '../../types';

function ToggleRow({
  label,
  sub,
  value,
  disabled,
  onToggle,
}: {
  label: string;
  sub?: string;
  value: boolean;
  disabled?: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div className="nx-s-row">
      <div>
        <div className="nx-s-lbl">{label}</div>
        {sub && <div className="nx-s-sub">{sub}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={`nx-tog${disabled ? ' opacity-40 cursor-not-allowed' : ''}`}
        data-on={String(value)}
      />
    </div>
  );
}

export const QuickPanelContent = memo(function QuickPanelContent({
  panel,
}: {
  panel: QuickPanel;
}): React.ReactElement {
  const { settings, isLoading, toggleGameMode, toggleFullscreenOptimization, setVisualEffects } =
    useWindowsStore(
      useShallow((s) => ({
        settings: s.settings,
        isLoading: s.isLoading,
        toggleGameMode: s.toggleGameMode,
        toggleFullscreenOptimization: s.toggleFullscreenOptimization,
        setVisualEffects: s.setVisualEffects,
      })),
    );
  const { isCleaning, lastResult, runCleanup } = useMemoryStore(
    useShallow((s) => ({
      isCleaning: s.isCleaning,
      lastResult: s.lastResult,
      runCleanup: s.runCleanup,
    })),
  );

  const handleGameMode = useCallback(
    () => void toggleGameMode().catch((e) => log.error({ e }, 'toggleGameMode')),
    [toggleGameMode],
  );
  const handleFullscreen = useCallback(
    () => void toggleFullscreenOptimization().catch((e) => log.error({ e }, 'toggleFullscreen')),
    [toggleFullscreenOptimization],
  );
  const handleVfx = useCallback(
    (v: VisualEffects) =>
      void setVisualEffects(v).catch((e) => log.error({ e }, 'setVisualEffects')),
    [setVisualEffects],
  );
  const handleCleanup = useCallback(
    () => void runCleanup().catch((e) => log.error({ e }, 'runCleanup')),
    [runCleanup],
  );

  if (panel === 'game') {
    return (
      <div className="flex flex-col px-3 pb-3 gap-1">
        <ToggleRow
          label="Game Mode"
          sub="Windows ゲームモードを有効化"
          value={settings?.gameMode ?? false}
          disabled={isLoading}
          onToggle={handleGameMode}
        />
        <div className="nx-s-row">
          <div className="nx-s-lbl">Game Profile</div>
          <span className="text-[10px] text-(--t-3)">Coming Soon</span>
        </div>
      </div>
    );
  }

  if (panel === 'display') {
    return (
      <div className="flex flex-col px-3 pb-3 gap-1">
        <ToggleRow
          label="Fullscreen Optimization"
          sub="フルスクリーン最適化を無効化"
          value={!(settings?.fullscreenOptimization ?? true)}
          disabled={isLoading}
          onToggle={handleFullscreen}
        />
      </div>
    );
  }

  if (panel === 'security') {
    const vfx = settings?.visualEffects ?? 'Balanced';
    return (
      <div className="flex flex-col px-3 pb-3 gap-1">
        <div className="nx-s-row">
          <div className="nx-s-lbl">Visual Effects</div>
        </div>
        <div className="flex gap-2">
          {(['BestPerformance', 'Balanced', 'BestAppearance'] as VisualEffects[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleVfx(v)}
              disabled={isLoading}
              className={[
                'flex-1 py-1.5 rounded text-[9px] font-bold tracking-widest uppercase transition-colors border',
                vfx === v
                  ? 'border-(--c-border) bg-(--c-bg) text-(--c)'
                  : 'border-transparent bg-(--s-4) text-(--t-3) hover:text-(--t-2)',
              ].join(' ')}
            >
              {v === 'BestPerformance' ? 'Perf' : v === 'Balanced' ? 'Bal' : 'Look'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // modules
  return (
    <div className="flex flex-col px-3 pb-3 gap-2">
      <div className="nx-s-row">
        <div className="nx-s-lbl">Memory Cleanup</div>
        <button
          type="button"
          onClick={handleCleanup}
          disabled={isCleaning}
          className="px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase border-(--c-border) bg-(--c-bg) text-(--c) border transition-colors disabled:opacity-40"
        >
          {isCleaning ? '...' : 'RUN'}
        </button>
      </div>
      {lastResult?.freedMb !== null && lastResult?.freedMb !== undefined && (
        <div className="text-[10px] text-(--nx-success)">
          {lastResult.freedMb.toFixed(0)} MB freed
        </div>
      )}
    </div>
  );
});
