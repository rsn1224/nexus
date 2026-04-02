import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';
import { OptimizationRow } from '../ui/OptimizationRow';

interface OptimizeSectionProps {
  onRevert: () => void;
}

const OptimizeSection = memo(function OptimizeSection({
  onRevert,
}: OptimizeSectionProps): React.ReactElement {
  const {
    candidates,
    selected,
    isLoadingCandidates,
    isApplying,
    lastResult,
    error,
    fetchCandidates,
    fetchHistory,
    toggleCandidate,
    applySelected,
    clearResult,
    clearError,
  } = useOptimizeStore();

  useEffect(() => {
    void fetchCandidates();
    void fetchHistory();
  }, [fetchCandidates, fetchHistory]);

  useEffect(() => {
    if (lastResult === null) return;
    const id = setTimeout(() => clearResult(), 5000);
    return () => clearTimeout(id);
  }, [lastResult, clearResult]);

  const handleApply = useCallback(async () => {
    await applySelected();
    void fetchCandidates();
  }, [applySelected, fetchCandidates]);

  return (
    <section aria-label="Optimizations" className="flex flex-col gap-2">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-text-muted">
        Optimizations
      </span>

      {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

      <div className="flex flex-col border border-border-subtle rounded bg-base-900 overflow-hidden">
        {isLoadingCandidates ? (
          <span className="text-[11px] text-text-muted px-4 py-3">読み込み中...</span>
        ) : (
          (() => {
            const appliedIds = new Set(lastResult?.applied.map((r) => r.id) ?? []);
            const failedIds = new Set(lastResult?.failed.map((r) => r.id) ?? []);
            return candidates.map((c, index) => (
              <OptimizationRow
                key={c.id}
                id={c.id}
                label={c.label}
                checked={selected.has(c.id)}
                onToggle={toggleCandidate}
                isLast={index === candidates.length - 1}
                result={appliedIds.has(c.id) ? 'success' : failedIds.has(c.id) ? 'failed' : null}
              />
            ));
          })()
        )}
      </div>

      {/* Before/After 差分表示 */}
      {lastResult && lastResult.applied.length > 0 && (
        <div className="border border-border-subtle rounded p-3 flex flex-col gap-1 bg-base-900">
          <span className="text-[10px] font-bold tracking-[0.12em] text-text-muted uppercase">
            Applied
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
            {lastResult.applied.map((item) => (
              <span key={item.id} className="text-[11px] text-text-secondary">
                <span className="text-success-500 mr-1">✓</span>
                {item.id}
                {item.before !== item.after && (
                  <span className="text-text-muted ml-1">
                    {item.before} → {item.after}
                  </span>
                )}
              </span>
            ))}
          </div>
          {lastResult.failed.length > 0 && (
            <div className="mt-1 flex flex-col gap-0.5">
              {lastResult.failed.map((item) => (
                <span key={item.id} className="text-[11px] text-danger-500">
                  <span className="mr-1">✗</span>
                  {item.id}: {item.reason}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="primary"
          fullWidth
          loading={isApplying}
          disabled={selected.size === 0 || isApplying}
          onClick={() => void handleApply()}
          className="h-10 text-[11px] tracking-widest rounded"
          ariaLabel={`最適化を実行 (${selected.size}件選択中)`}
        >
          OPTIMIZE ({selected.size})
        </Button>
        <Button variant="ghost" onClick={onRevert} ariaLabel="全設定を元に戻す">
          元に戻す
        </Button>
      </div>
    </section>
  );
});

export default OptimizeSection;
