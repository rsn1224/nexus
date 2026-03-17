import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useTimerActions, useTimerState } from '../../stores/useTimerStore';
import { Button } from '../ui';

/** 100ns 単位 → ms に変換（小数3桁） */
function toMs(value100ns: number): string {
  return (value100ns / 10000).toFixed(3);
}

/** プリセット値（100ns 単位） */
const PRESETS: { label: string; value: number }[] = [
  { label: '0.5 ms（最小）', value: 5000 },
  { label: '1.0 ms', value: 10000 },
  { label: '2.0 ms', value: 20000 },
  { label: '5.0 ms', value: 50000 },
  { label: '10.0 ms', value: 100000 },
];

export default function TimerSection(): React.ReactElement {
  const { timerState, isLoading, isApplying, error } = useTimerState();
  const { fetchTimerState, setTimerResolution, restoreTimerResolution } = useTimerActions();

  // 初期読み込み
  useEffect(() => {
    void fetchTimerState();
  }, [fetchTimerState]);

  // カスタム値入力（ms 単位でユーザーに見せ、内部で 100ns に変換）
  const [customMs, setCustomMs] = useState('');

  const handlePresetApply = useCallback(
    (value: number) => {
      void setTimerResolution(value);
    },
    [setTimerResolution],
  );

  const handleCustomApply = useCallback(() => {
    const ms = parseFloat(customMs);
    if (Number.isNaN(ms) || ms < 0.5 || ms > 15.625) return;
    const value100ns = Math.round(ms * 10000);
    void setTimerResolution(value100ns);
    setCustomMs('');
  }, [customMs, setTimerResolution]);

  const handleRestore = useCallback(() => {
    void restoreTimerResolution();
  }, [restoreTimerResolution]);

  const isActive = timerState?.nexusRequested100ns != null;

  return (
    <div className="p-3 bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={isActive ? 'text-[var(--color-cyan-500)]' : 'text-[var(--color-text-muted)]'}
          >
            {isActive ? '●' : '○'}
          </span>
          <span className="font-[var(--font-mono)] text-[11px] font-semibold text-[var(--color-text-primary)]">
            タイマーリゾリューション
          </span>
        </div>
        {isActive && (
          <Button variant="ghost" size="sm" onClick={handleRestore} disabled={isApplying}>
            復元
          </Button>
        )}
      </div>

      {/* 説明 */}
      <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)] leading-[1.4] mb-3">
        Windows
        のシステムタイマー精度を変更します。低い値ほどスケジューリング精度が向上しますが、消費電力が増加します。
      </div>

      {/* 現在値の表示 */}
      {isLoading ? (
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-muted)] py-2">
          読み込み中...
        </div>
      ) : timerState ? (
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.1em]">
              現在値
            </span>
            <span className="font-[var(--font-mono)] text-[12px] text-[var(--color-text-primary)] font-bold">
              {toMs(timerState.current100ns)} ms
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.1em]">
              nexus 要求値
            </span>
            <span
              className={`font-[var(--font-mono)] text-[12px] font-bold ${
                isActive ? 'text-[var(--color-cyan-500)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {timerState.nexusRequested100ns != null
                ? `${toMs(timerState.nexusRequested100ns)} ms`
                : '未設定'}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.1em]">
              最小（最高精度）
            </span>
            <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
              {toMs(timerState.minimum100ns)} ms
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-text-muted)] tracking-[0.1em]">
              デフォルト
            </span>
            <span className="font-[var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
              {toMs(timerState.default100ns)} ms
            </span>
          </div>
        </div>
      ) : null}

      {/* プリセットボタン */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => handlePresetApply(preset.value)}
            disabled={isApplying}
            className={`px-2 py-1 rounded font-[var(--font-mono)] text-[10px] border transition-colors ${
              timerState?.nexusRequested100ns === preset.value
                ? 'bg-[var(--color-cyan-500)]/20 border-[var(--color-cyan-500)] text-[var(--color-cyan-500)]'
                : 'bg-[var(--color-base-900)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-cyan-500)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* カスタム値入力 */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={customMs}
          onChange={(e) => setCustomMs(e.target.value)}
          placeholder="ms（0.5〜15.625）"
          min={0.5}
          max={15.625}
          step={0.1}
          className="flex-1 bg-[var(--color-base-900)] border border-[var(--color-border-subtle)] rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-cyan-500)]"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleCustomApply}
          disabled={isApplying || !customMs}
        >
          適用
        </Button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mt-2 font-[var(--font-mono)] text-[10px] text-[var(--color-danger-500)]">
          {error}
        </div>
      )}
    </div>
  );
}
