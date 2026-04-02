import { AlertTriangle } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import { useUiStore } from '../../stores/useUiStore';
import Button from './Button';

const CONFIRM_COUNTDOWN_SECS = 3;

const RevertDialog = memo(function RevertDialog(): React.ReactElement {
  const { isReverting, lastResult, history, revertAll, fetchCandidates } = useOptimizeStore();
  const closeAll = useUiStore((s) => s.closeAll);

  const [countdown, setCountdown] = useState(CONFIRM_COUNTDOWN_SECS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setCountdown(CONFIRM_COUNTDOWN_SECS);
    timerRef.current = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleConfirm = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await revertAll();
    void fetchCandidates();
    closeAll();
  }, [revertAll, fetchCandidates, closeAll]);

  const appliedCount =
    history.length > 0 ? (history[0]?.applied.length ?? 0) : (lastResult?.applied.length ?? 0);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={closeAll} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="revert-dialog-title"
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] bg-base-900 border border-border-subtle rounded p-5 flex flex-col gap-4"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span id="revert-dialog-title" className="text-[12px] font-bold text-text-primary">
              全設定を元に戻しますか？
            </span>
            <span className="text-[11px] text-text-secondary">
              {appliedCount > 0
                ? `${appliedCount} 件の最適化設定が全て元の状態に戻ります。`
                : '適用済みの全設定が元の状態に戻ります。'}
            </span>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={closeAll} disabled={isReverting}>
            キャンセル
          </Button>
          <Button
            variant="danger"
            loading={isReverting}
            disabled={countdown > 0 || isReverting}
            onClick={() => void handleConfirm()}
            ariaLabel="全設定を元に戻すことを確認"
          >
            {countdown > 0 ? `確認 (${countdown}s)` : '元に戻す'}
          </Button>
        </div>
      </div>
    </>
  );
});

export default RevertDialog;
