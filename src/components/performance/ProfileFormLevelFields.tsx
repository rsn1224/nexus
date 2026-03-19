import type React from 'react';
import type { BoostLevel, PowerPlanType, ProcessPriorityLevel } from '../../types';
import AffinityPanel from './AffinityPanel';

const inputClass =
  'bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500';
const labelSpanClass = 'text-[9px] text-text-muted';

interface ProfileFormLevelFieldsProps {
  boostLevel: BoostLevel;
  processesToSuspend: string;
  setProcessesToSuspend: (v: string) => void;
  autoSuspendEnabled: boolean;
  setAutoSuspendEnabled: (v: boolean) => void;
  processPriority: ProcessPriorityLevel;
  setProcessPriority: (v: ProcessPriorityLevel) => void;
  powerPlan: PowerPlanType;
  setPowerPlan: (v: PowerPlanType) => void;
  cpuAffinityGame: number[];
  setCpuAffinityGame: (cores: number[]) => void;
  cpuAffinityBackground: number[];
  setCpuAffinityBackground: (cores: number[]) => void;
  timerResolutionMs: string;
  setTimerResolutionMs: (v: string) => void;
  processesToKill: string;
  setProcessesToKill: (v: string) => void;
}

export default function ProfileFormLevelFields({
  boostLevel,
  processesToSuspend,
  setProcessesToSuspend,
  autoSuspendEnabled,
  setAutoSuspendEnabled,
  processPriority,
  setProcessPriority,
  powerPlan,
  setPowerPlan,
  cpuAffinityGame,
  setCpuAffinityGame,
  cpuAffinityBackground,
  setCpuAffinityBackground,
  timerResolutionMs,
  setTimerResolutionMs,
  processesToKill,
  setProcessesToKill,
}: ProfileFormLevelFieldsProps): React.ReactElement | null {
  if (boostLevel === 'none') return null;

  return (
    <>
      {/* Level 1+: サスペンドプロセス */}
      <label className="flex flex-col gap-1">
        <span className={labelSpanClass}>サスペンドプロセス（カンマ区切り）</span>
        <input
          type="text"
          value={processesToSuspend}
          onChange={(e) => setProcessesToSuspend(e.target.value)}
          placeholder="例: chrome.exe, discord.exe"
          className={inputClass}
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={autoSuspendEnabled}
          onChange={(e) => setAutoSuspendEnabled(e.target.checked)}
          className="w-3 h-3 rounded border-border-subtle bg-base-900 text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
        />
        <span className={labelSpanClass}>バックグラウンドプロセスを自動でサスペンドする</span>
      </label>

      {/* Level 2+: 優先度・電源プラン・アフィニティ・タイマー */}
      {(boostLevel === 'medium' || boostLevel === 'hard') && (
        <>
          <label className="flex flex-col gap-1">
            <span className={labelSpanClass}>プロセス優先度</span>
            <select
              value={processPriority}
              onChange={(e) => setProcessPriority(e.target.value as ProcessPriorityLevel)}
              className={inputClass}
            >
              <option value="normal">通常</option>
              <option value="aboveNormal">通常以上</option>
              <option value="high">高</option>
              <option value="realtime">リアルタイム（注意）</option>
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={labelSpanClass}>電源プラン</span>
            <select
              value={powerPlan}
              onChange={(e) => setPowerPlan(e.target.value as PowerPlanType)}
              className={inputClass}
            >
              <option value="unchanged">変更なし</option>
              <option value="highPerformance">高パフォーマンス</option>
              <option value="ultimatePerformance">究極のパフォーマンス</option>
              <option value="balanced">バランス</option>
            </select>
          </label>

          <AffinityPanel
            label="ゲーム用 CPU コア（空欄 = 自動）"
            selectedCores={cpuAffinityGame}
            onChange={setCpuAffinityGame}
          />

          <AffinityPanel
            label="バックグラウンド追い出し先コア（空欄 = 自動）"
            selectedCores={cpuAffinityBackground}
            onChange={setCpuAffinityBackground}
          />

          <label className="flex flex-col gap-1">
            <span className={labelSpanClass}>タイマーリゾリューション（ms）</span>
            <input
              type="number"
              value={timerResolutionMs}
              onChange={(e) => setTimerResolutionMs(e.target.value)}
              placeholder="例: 1.0（0.5〜15.625）"
              min={0.5}
              max={15.625}
              step={0.1}
              className={inputClass}
            />
            <span className="text-[9px] text-text-secondary">
              低い値ほどスケジューリング精度が向上しますが、消費電力が増加します。
            </span>
          </label>
        </>
      )}

      {/* Level 3: 強制終了プロセス */}
      {boostLevel === 'hard' && (
        <label className="flex flex-col gap-1">
          <span className={labelSpanClass}>強制終了プロセス（カンマ区切り）</span>
          <input
            type="text"
            value={processesToKill}
            onChange={(e) => setProcessesToKill(e.target.value)}
            placeholder="例: wallpaper_engine.exe, obs64.exe"
            className={inputClass}
          />
          <span className="text-[9px] text-danger-500">
            ⚠️ 強制終了は不可逆です。保存していないデータが失われる可能性があります。
          </span>
        </label>
      )}
    </>
  );
}
