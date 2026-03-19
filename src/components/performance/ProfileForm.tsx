import type React from 'react';
import { useProfileForm } from '../../hooks/useProfileForm';
import type { BoostLevel, GameProfile, PowerPlanType, ProcessPriorityLevel } from '../../types';
import { Button } from '../ui';
import AffinityPanel from './AffinityPanel';

// ─── ラベル定数（ProfileCard でも使用）────────────────────────────────────────

export const BOOST_LABELS: Record<BoostLevel, string> = {
  none: 'なし',
  soft: 'ソフト（Level 1）',
  medium: 'ミディアム（Level 2）',
  hard: 'ハード（Level 3）',
};

export const PRIORITY_LABELS: Record<ProcessPriorityLevel, string> = {
  normal: '通常',
  aboveNormal: '通常以上',
  high: '高',
  realtime: 'リアルタイム',
};

export const POWER_PLAN_LABELS: Record<PowerPlanType, string> = {
  unchanged: '変更なし',
  highPerformance: '高パフォーマンス',
  ultimatePerformance: '究極のパフォーマンス',
  balanced: 'バランス',
};

// ─── プロファイルフォーム ────────────────────────────────────────────────────

export interface ProfileFormProps {
  initial?: Partial<GameProfile>;
  onSave: (profile: GameProfile) => void;
  onCancel: () => void;
}

export default function ProfileForm({
  initial,
  onSave,
  onCancel,
}: ProfileFormProps): React.ReactElement {
  const {
    displayName,
    setDisplayName,
    exePath,
    setExePath,
    boostLevel,
    setBoostLevel,
    processesToSuspend,
    setProcessesToSuspend,
    processPriority,
    setProcessPriority,
    powerPlan,
    setPowerPlan,
    cpuAffinityGame,
    setCpuAffinityGame,
    cpuAffinityBackground,
    setCpuAffinityBackground,
    processesToKill,
    setProcessesToKill,
    timerResolutionMs,
    setTimerResolutionMs,
    autoSuspendEnabled,
    setAutoSuspendEnabled,
    handleSubmit,
  } = useProfileForm(initial, onSave);

  return (
    <div className="flex flex-col gap-3 p-3 bg-base-800 border border-border-subtle rounded">
      {/* ゲーム名 */}
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">ゲーム名</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例: Rocket League"
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
        />
      </label>

      {/* EXE パス */}
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
          実行ファイル（EXE パス）
        </span>
        <input
          type="text"
          value={exePath}
          onChange={(e) => setExePath(e.target.value)}
          placeholder="例: C:\Games\RocketLeague\RocketLeague.exe"
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
        />
      </label>

      {/* ブーストレベル */}
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
          ブーストレベル
        </span>
        <select
          value={boostLevel}
          onChange={(e) => setBoostLevel(e.target.value as BoostLevel)}
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
        >
          {(Object.entries(BOOST_LABELS) as [BoostLevel, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {/* === Level 1+ 追加フィールド === */}
      {boostLevel !== 'none' && (
        <>
          {/* サスペンドプロセス */}
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
              サスペンドプロセス（カンマ区切り）
            </span>
            <input
              type="text"
              value={processesToSuspend}
              onChange={(e) => setProcessesToSuspend(e.target.value)}
              placeholder="例: chrome.exe, discord.exe"
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
            />
          </label>

          {/* 自動サスペンド有効化 */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoSuspendEnabled}
              onChange={(e) => setAutoSuspendEnabled(e.target.checked)}
              className="w-3 h-3 rounded border-border-subtle bg-base-900 text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
            />
            <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
              バックグラウンドプロセスを自動でサスペンドする
            </span>
          </label>
        </>
      )}

      {/* === Level 2+ 追加フィールド === */}
      {(boostLevel === 'medium' || boostLevel === 'hard') && (
        <>
          {/* プロセス優先度 */}
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
              プロセス優先度
            </span>
            <select
              value={processPriority}
              onChange={(e) => setProcessPriority(e.target.value as ProcessPriorityLevel)}
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
            >
              <option value="normal">通常</option>
              <option value="aboveNormal">通常以上</option>
              <option value="high">高</option>
              <option value="realtime">リアルタイム（注意）</option>
            </select>
          </label>

          {/* 電源プラン */}
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
              電源プラン
            </span>
            <select
              value={powerPlan}
              onChange={(e) => setPowerPlan(e.target.value as PowerPlanType)}
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
            >
              <option value="unchanged">変更なし</option>
              <option value="highPerformance">高パフォーマンス</option>
              <option value="ultimatePerformance">究極のパフォーマンス</option>
              <option value="balanced">バランス</option>
            </select>
          </label>

          {/* ゲーム用 CPU アフィニティ */}
          <AffinityPanel
            label="ゲーム用 CPU コア（空欄 = 自動）"
            selectedCores={cpuAffinityGame}
            onChange={setCpuAffinityGame}
          />

          {/* バックグラウンド用 CPU アフィニティ */}
          <AffinityPanel
            label="バックグラウンド追い出し先コア（空欄 = 自動）"
            selectedCores={cpuAffinityBackground}
            onChange={setCpuAffinityBackground}
          />
        </>
      )}

      {/* === Level 2/3 追加フィールド === */}
      {(boostLevel === 'medium' || boostLevel === 'hard') && (
        <>
          {/* タイマーリゾリューション */}
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
              タイマーリゾリューション（ms）
            </span>
            <input
              type="number"
              value={timerResolutionMs}
              onChange={(e) => setTimerResolutionMs(e.target.value)}
              placeholder="例: 1.0（0.5〜15.625）"
              min={0.5}
              max={15.625}
              step={0.1}
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
            />
            <span className="font-mono text-[9px] text-text-secondary">
              低い値ほどスケジューリング精度が向上しますが、消費電力が増加します。
            </span>
          </label>
        </>
      )}

      {/* === Level 3 追加フィールド === */}
      {boostLevel === 'hard' && (
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
            強制終了プロセス（カンマ区切り）
          </span>
          <input
            type="text"
            value={processesToKill}
            onChange={(e) => setProcessesToKill(e.target.value)}
            placeholder="例: wallpaper_engine.exe, obs64.exe"
            className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
          />
          <span className="font-mono text-[9px] text-danger-500">
            ⚠️ 強制終了は不可逆です。保存していないデータが失われる可能性があります。
          </span>
        </label>
      )}

      {/* 一時停止プロセス */}
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] text-text-muted tracking-[0.1em]">
          一時停止プロセス（カンマ区切り）
        </span>
        <input
          type="text"
          value={processesToSuspend}
          onChange={(e) => setProcessesToSuspend(e.target.value)}
          placeholder="例: chrome.exe, discord.exe"
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-mono text-[11px] text-text-primary outline-none focus:border-accent-500"
        />
      </label>

      {/* ボタン */}
      <div className="flex gap-2 mt-1">
        <Button variant="primary" onClick={handleSubmit} className="flex-1">
          保存
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          キャンセル
        </Button>
      </div>
    </div>
  );
}
