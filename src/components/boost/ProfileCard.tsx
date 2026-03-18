import { invoke } from '@tauri-apps/api/core';
import type React from 'react';
import { useEffect, useState } from 'react';
import { TIMER_100NS_PER_MS } from '../../lib/constants';
import log from '../../lib/logger';
import type { CurrentPowerPlan, GameProfile } from '../../types';
import { BOOST_LABELS, POWER_PLAN_LABELS, PRIORITY_LABELS } from './ProfileForm';

// ─── 電源プラン表示コンポーネント ────────────────────────────────────────────

export function CurrentPowerPlanDisplay(): React.ReactElement {
  const [currentPlan, setCurrentPlan] = useState<CurrentPowerPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        const plan = await invoke<CurrentPowerPlan>('get_current_power_plan');
        setCurrentPlan(plan);
      } catch (err) {
        setError(err instanceof Error ? err.message : '取得失敗');
        log.error({ err }, '電源プラン取得エラー');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPlan();
    const interval = setInterval(fetchCurrentPlan, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="font-(--font-mono) text-[9px] text-text-muted">電源プラン: 読み込み中...</div>
    );
  }

  if (error || !currentPlan) {
    return (
      <div className="font-(--font-mono) text-[9px] text-danger-500">
        電源プラン: {error || '不明'}
      </div>
    );
  }

  return (
    <div className="font-(--font-mono) text-[9px] text-text-muted">
      現在の電源: {currentPlan.name}
    </div>
  );
}

// ─── プロファイルカード ──────────────────────────────────────────────────────

export interface ProfileCardProps {
  profile: GameProfile;
  isActive: boolean;
  onApply: (id: string) => void;
  onEdit: (profile: GameProfile) => void;
  onDelete: (id: string) => void;
}

export default function ProfileCard({
  profile,
  isActive,
  onApply,
  onEdit,
  onDelete,
}: ProfileCardProps): React.ReactElement {
  const playHours = Math.floor(profile.totalPlaySecs / 3600);
  const playMins = Math.floor((profile.totalPlaySecs % 3600) / 60);

  return (
    <div
      className={`p-3 bg-base-800 border rounded flex flex-col gap-2 ${
        isActive ? 'border-cyan-500' : 'border-border-subtle'
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="font-(--font-mono) text-[11px] text-text-primary font-bold truncate">
          {profile.displayName}
        </div>
        {isActive && (
          <span className="font-(--font-mono) text-[9px] text-cyan-500 tracking-[0.1em]">
            ● 適用中
          </span>
        )}
      </div>

      {/* 情報 */}
      <div className="flex flex-col gap-0.5">
        <div
          className="font-(--font-mono) text-[9px] text-text-muted truncate"
          title={profile.exePath}
        >
          {profile.exePath}
        </div>
        <div className="font-(--font-mono) text-[9px] text-text-muted">
          ブースト: {BOOST_LABELS[profile.boostLevel]}
        </div>
        {profile.processPriority !== 'normal' && (
          <div className="font-(--font-mono) text-[9px] text-text-muted">
            優先度: {PRIORITY_LABELS[profile.processPriority]}
          </div>
        )}
        {profile.powerPlan !== 'unchanged' && (
          <div className="font-(--font-mono) text-[9px] text-text-muted">
            電源: {POWER_PLAN_LABELS[profile.powerPlan]}
          </div>
        )}
        {profile.timerResolution100ns != null && (
          <div className="font-(--font-mono) text-[9px] text-text-muted">
            タイマー: {(profile.timerResolution100ns / TIMER_100NS_PER_MS).toFixed(3)} ms
          </div>
        )}
        {profile.processesToKill.length > 0 && (
          <div className="font-(--font-mono) text-[9px] text-danger-500">
            強制終了: {profile.processesToKill.join(', ')}
          </div>
        )}
        {profile.processesToSuspend.length > 0 && (
          <div className="font-(--font-mono) text-[9px] text-text-muted">
            一時停止: {profile.processesToSuspend.join(', ')}
          </div>
        )}
        <div className="font-(--font-mono) text-[9px] text-text-muted">
          プレイ時間: {playHours}時間{playMins}分
        </div>
      </div>

      {/* アクション */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => onApply(profile.id)}
          disabled={isActive}
          className={`flex-1 font-(--font-mono) text-[9px] py-1 border-none rounded-[2px] tracking-[0.05em] ${
            isActive
              ? 'bg-base-600 text-text-muted cursor-default opacity-50'
              : 'bg-cyan-500 text-base-900 cursor-pointer'
          }`}
        >
          {isActive ? '適用中' : '▶ 適用'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(profile)}
          className="font-(--font-mono) text-[9px] py-1 px-3 bg-base-700 text-text-primary border-none rounded-[2px] cursor-pointer"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onDelete(profile.id)}
          className="font-(--font-mono) text-[9px] py-1 px-3 bg-base-700 text-danger-500 border-none rounded-[2px] cursor-pointer"
        >
          削除
        </button>
      </div>
    </div>
  );
}
