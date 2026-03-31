import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
    isReverting,
    lastResult,
    error,
    fetchCandidates,
    toggleCandidate,
    applySelected,
    revertAll,
    clearResult,
    clearError,
  } = useOptimizeStore();

  const [revertConfirm, setRevertConfirm] = useState(false);
  const [revertCountdown, setRevertCountdown] = useState(3);
  const revertTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    if (lastResult === null) return;
    const id = setTimeout(() => clearResult(), 3000);
    return () => clearTimeout(id);
  }, [lastResult, clearResult]);

  const startRevertConfirm = useCallback(() => {
    setRevertConfirm(true);
    setRevertCountdown(3);
    revertTimerRef.current = setInterval(() => {
      setRevertCountdown((c) => {
        if (c <= 1) {
          clearInterval(revertTimerRef.current ?? undefined);
          revertTimerRef.current = null;
          setRevertConfirm(false);
          return 3;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  const handleRevertConfirmed = useCallback(async () => {
    if (revertTimerRef.current) {
      clearInterval(revertTimerRef.current);
      revertTimerRef.current = null;
    }
    setRevertConfirm(false);
    await revertAll();
    void fetchCandidates();
  }, [revertAll, fetchCandidates]);

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
            <div key={c.id} className="flex items-start gap-2 p-2 rounded hover:bg-base-800">
              <Checkbox checked={selected.has(c.id)} onChange={() => toggleCandidate(c.id)} />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-text-primary">{c.label}</span>
                  {c.is_recommended && (
                    <span className="text-[9px] font-bold tracking-widest text-accent-500 uppercase">
                      REC
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-muted truncate">{c.current_state}</span>
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
            <div key={item.id} className="flex gap-2 text-[11px]">
              <span className="text-danger-500">✗</span>
              <span className="text-text-secondary">{item.id}</span>
              <span className="text-text-muted">{item.reason}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          loading={isApplying}
          disabled={selected.size === 0 || isApplying}
          onClick={() => void handleApply()}
        >
          OPTIMIZE ({selected.size})
        </Button>

        {revertConfirm ? (
          <Button
            variant="danger"
            fullWidth
            loading={isReverting}
            onClick={() => void handleRevertConfirmed()}
          >
            CONFIRM REVERT ({revertCountdown}s)
          </Button>
        ) : (
          <Button variant="ghost" fullWidth disabled={isReverting} onClick={startRevertConfirm}>
            REVERT ALL
          </Button>
        )}
      </div>
    </section>
  );
});

export default Optimizations;
