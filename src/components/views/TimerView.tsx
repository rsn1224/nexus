import { Clock, RefreshCw } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { useTimerStore } from '../../stores/useTimerStore';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import SectionLabel from '../ui/SectionLabel';

const TIMER_PRESETS: { label: string; value100ns: number }[] = [
  { label: '0.5ms', value100ns: 5000 },
  { label: '1.0ms', value100ns: 10000 },
];

function formatMs(value100ns: number): string {
  return `${(value100ns / 10000).toFixed(2)}ms`;
}

const TimerView = memo(function TimerView(): React.ReactElement {
  const {
    timerState,
    parkingState,
    isLoading,
    error,
    fetchAll,
    setTimerResolution,
    restoreTimerResolution,
    setCoreParking,
    clearError,
  } = useTimerStore();

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const handleSetTimer = useCallback(
    (value100ns: number) => void setTimerResolution(value100ns),
    [setTimerResolution],
  );

  const handleRestoreTimer = useCallback(
    () => void restoreTimerResolution(),
    [restoreTimerResolution],
  );

  const handleParkingDisable = useCallback(() => void setCoreParking(0), [setCoreParking]);

  const handleParkingDefault = useCallback(() => void setCoreParking(100), [setCoreParking]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
            Timer &amp; Core Parking
          </h2>
        </div>
        <Button variant="ghost" onClick={() => void fetchAll()} loading={isLoading}>
          <RefreshCw size={12} />
          <span className="ml-1">更新</span>
        </Button>
      </div>

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      {isLoading && !timerState ? (
        <span className="text-[11px] text-text-muted">読み込み中...</span>
      ) : (
        <div className="flex flex-col gap-4">
          {/* タイマー解像度 */}
          {timerState && (
            <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
              <SectionLabel label="タイマー解像度" />
              <div className="flex flex-col items-center py-2">
                <span className="text-[9px] text-text-muted tracking-[0.15em] uppercase mb-1">
                  Current Resolution
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[36px] font-bold leading-none text-accent-500 font-mono">
                    {(timerState.current100ns / 10000).toFixed(2)}
                  </span>
                  <span className="text-[13px] text-text-muted">ms</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] text-text-muted">
                    Default: {formatMs(timerState.default100ns)}
                  </span>
                  {timerState.nexusRequested100ns !== null && (
                    <span className="text-[10px] text-text-muted">
                      nexus: {formatMs(timerState.nexusRequested100ns)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {TIMER_PRESETS.map(({ label, value100ns }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSetTimer(value100ns)}
                    disabled={isLoading}
                    className={[
                      'px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors',
                      timerState.nexusRequested100ns === value100ns
                        ? 'bg-accent-500/20 border-accent-500/60 text-accent-500'
                        : 'bg-base-700 border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-500/30',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleRestoreTimer}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors bg-base-700 border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-500/30"
                >
                  デフォルトに戻す
                </button>
              </div>
            </div>
          )}

          {/* コアパーキング */}
          {parkingState && (
            <div className="bg-base-800 border border-border-subtle rounded p-3 flex flex-col gap-3">
              <SectionLabel label="コアパーキング" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">AC電源 最小コア率</span>
                  <span className="text-[11px] font-mono text-text-primary">
                    {parkingState.minCoresPercentAc}%
                    {parkingState.minCoresPercentAc === 0 && (
                      <span className="ml-1 text-[10px] text-success-500">（パーキング無効）</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">電源プラン</span>
                  <span className="text-[11px] font-mono text-text-secondary">
                    {parkingState.activePlanName}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleParkingDisable}
                  disabled={isLoading}
                  className={[
                    'px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors',
                    parkingState.minCoresPercentAc === 0
                      ? 'bg-accent-500/20 border-accent-500/60 text-accent-500'
                      : 'bg-base-700 border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-500/30',
                  ].join(' ')}
                >
                  パーキング無効化
                </button>
                <button
                  type="button"
                  onClick={handleParkingDefault}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors bg-base-700 border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-500/30"
                >
                  デフォルトに戻す
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default TimerView;
