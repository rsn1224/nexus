import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTimerActions, useTimerState } from '../../stores/useTimerStore';

export const TimerPanel = memo(function TimerPanel() {
  const { t } = useTranslation('tactics');
  const { timerState, isLoading, isApplying } = useTimerState();
  const { fetchTimerState, setTimerResolution, restoreTimerResolution } = useTimerActions();

  const PRESETS: { label: string; value: number; desc: string }[] = [
    { label: '0.5ms', value: 5000, desc: t('timer.highPrecisionGame') },
    { label: '1.0ms', value: 10000, desc: t('timer.highPrecisionStream') },
    { label: 'DEFAULT', value: 156250, desc: t('timer.windowsDefault') },
  ];

  const currentMs = timerState ? (timerState.current100ns / 10000).toFixed(2) : '—';
  const isCustom = timerState?.nexusRequested100ns != null;

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
      <div className="piano-surface rounded p-4 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest">
          {t('timer.currentResolution')}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-text-primary text-2xl font-mono font-bold">{currentMs}</span>
          <span className="text-text-secondary text-sm font-mono">ms</span>
          {isCustom && (
            <span className="text-accent-500 text-xs font-mono ml-auto">
              {t('timer.nexusApplied')}
            </span>
          )}
        </div>
        {timerState && (
          <div className="text-text-secondary text-xs font-mono">
            {t('timer.systemMin')}: {(timerState.minimum100ns / 10000).toFixed(2)}ms |{' '}
            {t('timer.max')}: {(timerState.maximum100ns / 10000).toFixed(2)}ms
          </div>
        )}
      </div>

      <div className="piano-surface rounded p-3 flex flex-col gap-2">
        <p className="text-text-secondary text-xs font-mono uppercase tracking-widest mb-1">
          {t('timer.presets')}
        </p>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              if (p.value === timerState?.default100ns) {
                void restoreTimerResolution();
              } else {
                void setTimerResolution(p.value);
              }
            }}
            disabled={isApplying || timerState?.current100ns === p.value}
            className={`flex items-center justify-between px-3 py-2 rounded border transition-colors text-xs font-mono ${
              timerState?.current100ns === p.value
                ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                : 'border-border-subtle text-text-secondary hover:border-accent-500/50 hover:text-text-primary disabled:opacity-40'
            }`}
          >
            <span className="font-bold">{p.label}</span>
            <span className="opacity-60">{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void fetchTimerState()}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs font-mono rounded border border-border-subtle text-text-secondary hover:border-accent-500/50 hover:text-text-primary transition-colors disabled:opacity-40"
        >
          {t('timer.refresh')}
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={() => void restoreTimerResolution()}
            disabled={isApplying}
            className="flex-1 px-3 py-2 text-xs font-mono rounded border border-warning-500/40 text-warning-500 hover:bg-warning-500/10 transition-colors disabled:opacity-40"
          >
            {t('timer.restoreDefault')}
          </button>
        )}
      </div>
    </div>
  );
});
