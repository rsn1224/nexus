import { memo, useCallback, useRef, useState } from 'react';
import { useOptimizeActions, useOptimizeState } from '../../stores/useOptimizeStore';
import type { OptimizePreset } from '../../types/v2';

const PRESETS: { id: OptimizePreset; label: string; desc: string }[] = [
  { id: 'gaming', label: 'GAMING', desc: 'ゲーム向け最大パフォーマンス' },
  { id: 'powerSave', label: 'POWER SAVE', desc: '消費電力最小化' },
  { id: 'streaming', label: 'STREAMING', desc: '配信最適化' },
];

const RISK_CLASS: Record<string, string> = {
  safe: 'text-success-500',
  medium: 'text-warning-500',
  high: 'text-danger-500',
};

export const OptimizeNowPanel = memo(function OptimizeNowPanel() {
  const { activePreset, steps, stepEnabled, lastResult, applying, error } = useOptimizeState();
  const { selectPreset, toggleStep, applyPreset, rollbackPreset, clearError } =
    useOptimizeActions();

  const [confirmRollback, setConfirmRollback] = useState(false);
  const rollbackTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleRollbackClick = useCallback((): void => {
    if (confirmRollback) {
      if (rollbackTimerRef.current) clearTimeout(rollbackTimerRef.current);
      setConfirmRollback(false);
      void rollbackPreset();
    } else {
      setConfirmRollback(true);
      rollbackTimerRef.current = setTimeout(() => setConfirmRollback(false), 3000);
    }
  }, [confirmRollback, rollbackPreset]);

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto flex-1">
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPreset(p.id)}
            className={`flex-1 px-3 py-2 text-xs font-mono rounded border transition-colors ${
              activePreset === p.id
                ? 'border-accent-500 bg-accent-500/10 text-accent-500'
                : 'border-border-subtle text-text-secondary hover:border-accent-500/50 hover:text-text-primary'
            }`}
          >
            <div className="uppercase tracking-widest">{p.label}</div>
            <div className="text-xs opacity-60 mt-0.5 normal-case">{p.desc}</div>
          </button>
        ))}
      </div>

      {activePreset && steps.length > 0 && (
        <div className="card-glass rounded p-3 flex flex-col gap-1.5">
          <p className="text-text-secondary text-xs font-mono uppercase tracking-widest mb-1">
            STEPS
          </p>
          {steps.map((step) => (
            <label
              key={step.id}
              className="flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={stepEnabled[step.id] ?? false}
                  onChange={() => toggleStep(step.id)}
                  className="accent-accent-500"
                />
                <span className="text-text-primary text-xs font-mono group-hover:text-accent-500 transition-colors">
                  {step.label}
                </span>
              </div>
              <span className={`text-xs font-mono ${RISK_CLASS[step.risk]}`}>
                {step.risk.toUpperCase()}
              </span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between px-3 py-2 bg-danger-500/10 border border-danger-500/30 rounded text-xs font-mono text-danger-500">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="ml-2 hover:text-text-primary">
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        {lastResult && (
          <button
            type="button"
            onClick={handleRollbackClick}
            className={`flex-1 px-3 py-2 text-xs font-mono rounded border transition-colors ${
              confirmRollback
                ? 'border-danger-500 bg-danger-500/10 text-danger-500'
                : 'border-border-subtle text-text-secondary hover:border-warning-500 hover:text-warning-500'
            }`}
          >
            {confirmRollback ? '⚠ CONFIRM ROLLBACK' : 'ROLLBACK'}
          </button>
        )}
        <button
          type="button"
          onClick={() => void applyPreset()}
          disabled={!activePreset || applying}
          className="flex-1 px-3 py-2 text-xs font-mono rounded border border-accent-500 text-accent-500 bg-accent-500/10 hover:bg-accent-500/20 transition-colors disabled:opacity-40"
        >
          {applying ? 'APPLYING...' : 'APPLY ALL ▶'}
        </button>
      </div>
    </div>
  );
});
