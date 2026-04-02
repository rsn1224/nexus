import { Cpu } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import { OptimizationRow } from '../ui/OptimizationRow';

const REVERT_COUNTDOWN_SECS = 3;

const OptimizeView = memo(function OptimizeView(): React.ReactElement {
  const {
    candidates,
    selected,
    isLoadingCandidates,
    isApplying,
    isReverting,
    lastResult,
    history,
    error,
    fetchCandidates,
    fetchHistory,
    toggleCandidate,
    applySelected,
    revertAll,
    clearResult,
    clearError,
  } = useOptimizeStore();

  const [revertConfirm, setRevertConfirm] = useState(false);
  const [revertCountdown, setRevertCountdown] = useState(REVERT_COUNTDOWN_SECS);
  const revertTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void fetchCandidates();
    void fetchHistory();
  }, [fetchCandidates, fetchHistory]);

  useEffect(() => {
    if (lastResult === null) return;
    const id = setTimeout(() => clearResult(), 3000);
    return () => clearTimeout(id);
  }, [lastResult, clearResult]);

  const handleApply = useCallback(async () => {
    await applySelected();
    void fetchCandidates();
  }, [applySelected, fetchCandidates]);

  const startRevertConfirm = useCallback(() => {
    setRevertConfirm(true);
    setRevertCountdown(REVERT_COUNTDOWN_SECS);
    revertTimerRef.current = setInterval(() => {
      setRevertCountdown((c) => {
        if (c <= 1) {
          clearInterval(revertTimerRef.current ?? undefined);
          revertTimerRef.current = null;
          setRevertConfirm(false);
          return REVERT_COUNTDOWN_SECS;
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

  return (
    <div className="h-full flex gap-4 p-4 overflow-hidden">
      {/* 左: 最適化チェックリスト */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-accent-500" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
            Optimization Actions
          </h2>
        </div>

        {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

        <div className="flex flex-col border border-border-subtle rounded bg-base-900 overflow-hidden">
          {isLoadingCandidates ? (
            <span className="text-[11px] text-text-muted px-4 py-3">読み込み中...</span>
          ) : (
            candidates.map((c, index) => (
              <OptimizationRow
                key={c.id}
                id={c.id}
                label={c.label}
                checked={selected.has(c.id)}
                onToggle={toggleCandidate}
                isLast={index === candidates.length - 1}
              />
            ))
          )}
        </div>

        {lastResult && (
          <div className="border border-border-subtle rounded p-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase">
              適用結果
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

        <div className="flex gap-2 mt-auto">
          <Button
            variant="primary"
            fullWidth
            loading={isApplying}
            disabled={selected.size === 0 || isApplying}
            onClick={() => void handleApply()}
            className="h-11 text-[11px] tracking-widest rounded"
          >
            OPTIMIZE ({selected.size})
          </Button>
          {revertConfirm ? (
            <Button
              variant="danger"
              loading={isReverting}
              onClick={() => void handleRevertConfirmed()}
            >
              確認 ({revertCountdown}s)
            </Button>
          ) : (
            <Button variant="ghost" disabled={isReverting} onClick={startRevertConfirm}>
              元に戻す
            </Button>
          )}
        </div>
      </div>

      {/* 右: 履歴 */}
      <div className="w-[240px] shrink-0 flex flex-col gap-3 overflow-y-auto">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
          History
        </h2>
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <span className="text-[11px] text-text-muted">履歴がありません</span>
          ) : (
            history.map((session) => (
              <div
                key={session.id}
                className="bg-base-800 border border-border-subtle rounded px-3 py-2"
              >
                <span className="text-[10px] text-text-muted">
                  {new Date(session.timestamp * 1000).toLocaleString()}
                </span>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  {session.applied.length} 件適用
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
});

export default OptimizeView;
