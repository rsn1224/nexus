import type React from 'react';
import { useProfileForm } from '../../hooks/useProfileForm';
import type { BoostLevel, GameProfile, PowerPlanType, ProcessPriorityLevel } from '../../types';
import { Button } from '../ui';
import ProfileFormLevelFields from './ProfileFormLevelFields';

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

const inputClass =
  'bg-base-900 border border-border-subtle rounded-lg px-2 py-1 font-mono text-xs text-text-primary outline-none focus:border-accent-500';
const labelSpanClass = 'text-xs text-text-muted';

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
    <div className="flex flex-col gap-3 p-3 bg-base-800 border border-border-subtle rounded-lg">
      {/* ゲーム名 */}
      <label className="flex flex-col gap-1">
        <span className={labelSpanClass}>ゲーム名</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例: Rocket League"
          className={inputClass}
        />
      </label>

      {/* EXE パス */}
      <label className="flex flex-col gap-1">
        <span className={labelSpanClass}>実行ファイル（EXE パス）</span>
        <input
          type="text"
          value={exePath}
          onChange={(e) => setExePath(e.target.value)}
          placeholder="例: C:\Games\RocketLeague\RocketLeague.exe"
          className={inputClass}
        />
      </label>

      {/* ブーストレベル */}
      <label className="flex flex-col gap-1">
        <span className={labelSpanClass}>ブーストレベル</span>
        <select
          value={boostLevel}
          onChange={(e) => setBoostLevel(e.target.value as BoostLevel)}
          className={inputClass}
        >
          {(Object.entries(BOOST_LABELS) as [BoostLevel, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {/* レベル別フィールド（Level 1+） */}
      <ProfileFormLevelFields
        boostLevel={boostLevel}
        processesToSuspend={processesToSuspend}
        setProcessesToSuspend={setProcessesToSuspend}
        autoSuspendEnabled={autoSuspendEnabled}
        setAutoSuspendEnabled={setAutoSuspendEnabled}
        processPriority={processPriority}
        setProcessPriority={setProcessPriority}
        powerPlan={powerPlan}
        setPowerPlan={setPowerPlan}
        cpuAffinityGame={cpuAffinityGame}
        setCpuAffinityGame={setCpuAffinityGame}
        cpuAffinityBackground={cpuAffinityBackground}
        setCpuAffinityBackground={setCpuAffinityBackground}
        timerResolutionMs={timerResolutionMs}
        setTimerResolutionMs={setTimerResolutionMs}
        processesToKill={processesToKill}
        setProcessesToKill={setProcessesToKill}
      />

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
