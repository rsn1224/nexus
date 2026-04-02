import type React from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import log from '../../lib/logger';
import { commands } from '../../lib/tauri-commands';
import type { PowerPlan } from '../../types';

const FEEDBACK_DURATION_MS = 3000;

interface ActionButtonProps {
  label: string;
  feedback?: string;
  isLoading: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ActionButton({
  label,
  feedback,
  isLoading,
  disabled = false,
  onClick,
}: ActionButtonProps): React.ReactElement {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'flex-1 flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded border',
        'text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors',
        isDisabled
          ? 'opacity-40 cursor-not-allowed border-border-subtle text-text-muted'
          : 'border-border-subtle text-text-secondary hover:border-accent-500 hover:text-accent-500 cursor-pointer',
      ].join(' ')}
    >
      {isLoading ? (
        <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{label}</span>
      )}
      {feedback && !isLoading && (
        <span className="text-[9px] text-success-500 normal-case tracking-normal font-normal">
          {feedback}
        </span>
      )}
      {disabled && !isLoading && !feedback && (
        <span className="text-[9px] text-text-muted normal-case tracking-normal font-normal">
          準備中
        </span>
      )}
    </button>
  );
}

const ActionStrip = memo(function ActionStrip(): React.ReactElement {
  const [boostLoading, setBoostLoading] = useState(false);
  const [boostFeedback, setBoostFeedback] = useState<string | undefined>();

  const [powerLoading, setPowerLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PowerPlan | null>(null);
  const [powerFeedback, setPowerFeedback] = useState<string | undefined>();

  const [memLoading, setMemLoading] = useState(false);
  const [memFeedback, setMemFeedback] = useState<string | undefined>();

  const boostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const memTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    commands
      .getWindowsSettings()
      .then((s) => setCurrentPlan(s.powerPlan))
      .catch((err) => {
        log.warn({ err }, 'failed to get windows settings');
      });
    return () => {
      if (boostTimer.current) clearTimeout(boostTimer.current);
      if (powerTimer.current) clearTimeout(powerTimer.current);
      if (memTimer.current) clearTimeout(memTimer.current);
    };
  }, []);

  const showFeedback = useCallback(
    (
      setter: (v: string | undefined) => void,
      timer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
      msg: string,
    ) => {
      setter(msg);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setter(undefined), FEEDBACK_DURATION_MS);
    },
    [],
  );

  const handleBoost = useCallback(async () => {
    if (boostLoading) return;
    setBoostLoading(true);
    try {
      const result = await commands.runBoost();
      const delta = result.scoreDelta >= 0 ? `+${result.scoreDelta}` : String(result.scoreDelta);
      showFeedback(setBoostFeedback, boostTimer, `Score ${delta}`);
    } catch (err) {
      log.error({ err }, 'boost failed');
      showFeedback(setBoostFeedback, boostTimer, 'エラー');
    } finally {
      setBoostLoading(false);
    }
  }, [boostLoading, showFeedback]);

  const handlePower = useCallback(async () => {
    if (powerLoading) return;
    const next: PowerPlan = currentPlan === 'HighPerformance' ? 'Balanced' : 'HighPerformance';
    setPowerLoading(true);
    try {
      await commands.setPowerPlan(next);
      setCurrentPlan(next);
      const label = next === 'HighPerformance' ? 'High Perf' : 'Balanced';
      showFeedback(setPowerFeedback, powerTimer, label);
    } catch (err) {
      log.error({ err }, 'set power plan failed');
      showFeedback(setPowerFeedback, powerTimer, 'エラー');
    } finally {
      setPowerLoading(false);
    }
  }, [powerLoading, currentPlan, showFeedback]);

  const handleMemory = useCallback(async () => {
    if (memLoading) return;
    setMemLoading(true);
    try {
      const result = await commands.manualMemoryCleanup();
      if (result.freedMb !== null) {
        showFeedback(setMemFeedback, memTimer, `${result.freedMb.toFixed(0)} MB freed`);
      } else {
        showFeedback(setMemFeedback, memTimer, result.error ?? 'done');
      }
    } catch (err) {
      log.error({ err }, 'memory cleanup failed');
      showFeedback(setMemFeedback, memTimer, 'エラー');
    } finally {
      setMemLoading(false);
    }
  }, [memLoading, showFeedback]);

  const powerLabel =
    currentPlan === 'HighPerformance'
      ? 'POWER: HP'
      : currentPlan === 'Balanced'
        ? 'POWER: BAL'
        : 'POWER';

  return (
    <section aria-label="Quick Actions" className="flex gap-2">
      <ActionButton
        label="⚡ BOOST"
        feedback={boostFeedback}
        isLoading={boostLoading}
        onClick={() => void handleBoost()}
      />
      <ActionButton
        label={powerLabel}
        feedback={powerFeedback}
        isLoading={powerLoading}
        onClick={() => void handlePower()}
      />
      <ActionButton
        label="🧹 MEMORY"
        feedback={memFeedback}
        isLoading={memLoading}
        onClick={() => void handleMemory()}
      />
      {/* NOTIFY: v4.0 未実装のため除外。実装時に再追加する */}
    </section>
  );
});

export default ActionStrip;
