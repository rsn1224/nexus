import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { useOptimizeStore } from '../stores/useOptimizeStore';
import Button from './ui/Button';
import ErrorBanner from './ui/ErrorBanner';
import SectionHeader from './ui/SectionHeader';
import { Checkbox } from './ui/Toggle';

const Optimizations = memo(function Optimizations(): React.ReactElement {
  const {
    candidates,
    selected,
    isLoadingCandidates,
    isApplying,
    lastResult,
    error,
    fetchCandidates,
    toggleCandidate,
    applySelected,
    clearResult,
    clearError,
  } = useOptimizeStore();

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    if (lastResult === null) return;
    const id = setTimeout(() => clearResult(), 3000);
    return () => clearTimeout(id);
  }, [lastResult, clearResult]);

  const handleApply = useCallback(async () => {
    await applySelected();
    void fetchCandidates();
  }, [applySelected, fetchCandidates]);

  return (
    <section aria-label="最適化" className="flex flex-col gap-3">
      <SectionHeader title="OPTIMIZATIONS" color="muted" />

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      <div className="flex flex-col gap-1">
        {isLoadingCandidates ? (
          <span className="text-[11px] text-text-muted">LOADING...</span>
        ) : (
          candidates.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 bg-base-800/50 rounded px-3 py-2 mb-1 hover:bg-base-800 transition-colors"
            >
              <Checkbox checked={selected.has(c.id)} onChange={() => toggleCandidate(c.id)} />
              <span className="text-[12px] text-text-primary flex-1 min-w-0 truncate">
                {c.label}
              </span>
              <div className="flex items-center gap-2 shrink-0 max-w-[40%]">
                {c.is_recommended && (
                  <span className="bg-accent-500/20 text-accent-500 text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm uppercase shrink-0">
                    REC
                  </span>
                )}
                <span className="text-[10px] text-text-muted truncate">{c.current_state}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {lastResult && (
        <div className="border border-border-subtle rounded p-3 flex flex-col gap-1">
          <span className="text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase">
            RESULT
          </span>
          {lastResult.applied.map((item) => (
            <div key={item.id} className="flex gap-2 text-[11px]">
              <span className="text-success-500">✓</span>
              <span className="text-text-secondary">{item.id}</span>
              <span className="text-text-muted">
                {item.before} → {item.after}
              </span>
            </div>
          ))}
          {lastResult.failed.map((item) => (
            <div
              key={item.id}
              className="bg-danger-500/10 border-l-2 border-danger-500 px-3 py-2 rounded flex gap-2 text-[11px]"
            >
              <span className="text-danger-500 shrink-0">✗</span>
              <span className="text-text-secondary">{item.id}</span>
              <span className="text-text-muted">{item.reason}</span>
            </div>
          ))}
        </div>
      )}

      <Button
        variant="primary"
        fullWidth
        loading={isApplying}
        disabled={selected.size === 0 || isApplying}
        onClick={() => void handleApply()}
        className="h-12 text-[13px] tracking-[0.2em] rounded-md"
      >
        OPTIMIZE ({selected.size})
      </Button>
    </section>
  );
});

export default Optimizations;
