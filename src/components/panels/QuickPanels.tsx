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
import { Toggle } from '../ui/Toggle';

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
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
      <div>
        <div className="text-[11px] text-text-secondary tracking-[0.04em]">{label}</div>
        {sub && <div className="text-[10px] text-text-muted mt-0.5">{sub}</div>}
      </div>
      <Toggle enabled={value} onToggle={onToggle} disabled={disabled} />
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
        <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
          <div className="text-[11px] text-text-secondary tracking-[0.04em]">Game Profile</div>
          <span className="text-[10px] text-text-muted">Coming Soon</span>
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
        <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
          <div className="text-[11px] text-text-secondary tracking-[0.04em]">Visual Effects</div>
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
                  ? 'border-border-active bg-accent-500/10 text-accent-500'
                  : 'border-transparent bg-base-600 text-text-muted hover:text-text-secondary',
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
      <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-b-0">
        <div className="text-[11px] text-text-secondary tracking-[0.04em]">Memory Cleanup</div>
        <button
          type="button"
          onClick={handleCleanup}
          disabled={isCleaning}
          className="px-3 py-1 rounded text-[9px] font-bold tracking-widest uppercase border border-border-active bg-accent-500/10 text-accent-500 transition-colors disabled:opacity-40"
        >
          {isCleaning ? '...' : 'RUN'}
        </button>
      </div>
      {lastResult?.freedMb !== null && lastResult?.freedMb !== undefined && (
        <div className="text-[10px] text-success-500">{lastResult.freedMb.toFixed(0)} MB freed</div>
      )}
    </div>
  );
});
