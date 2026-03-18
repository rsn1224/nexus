import { invoke } from '@tauri-apps/api/core';
import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TIMER_100NS_PER_MS } from '../../lib/constants';
import log from '../../lib/logger';
import {
  createDefaultProfile,
  useGameProfileActions,
  useGameProfileState,
} from '../../stores/useGameProfileStore';
import type {
  BoostLevel,
  CurrentPowerPlan,
  GameProfile,
  PowerPlanType,
  ProcessPriorityLevel,
} from '../../types';
import { Button, EmptyState, ErrorBanner, LoadingState } from '../ui';
import AffinityPanel from './AffinityPanel';

// ─── ブーストレベルラベル ────────────────────────────────────────────────────

const BOOST_LABELS: Record<BoostLevel, string> = {
  none: 'なし',
  soft: 'ソフト（Level 1）',
  medium: 'ミディアム（Level 2）',
  hard: 'ハード（Level 3）',
};

const PRIORITY_LABELS: Record<ProcessPriorityLevel, string> = {
  normal: '通常',
  aboveNormal: '通常以上',
  high: '高',
  realtime: 'リアルタイム',
};

const POWER_PLAN_LABELS: Record<PowerPlanType, string> = {
  unchanged: '変更なし',
  highPerformance: '高パフォーマンス',
  ultimatePerformance: '究極のパフォーマンス',
  balanced: 'バランス',
};

// ─── プロファイルフォーム ────────────────────────────────────────────────────

interface ProfileFormProps {
  initial?: Partial<GameProfile>;
  onSave: (profile: GameProfile) => void;
  onCancel: () => void;
}

function ProfileForm({ initial, onSave, onCancel }: ProfileFormProps): React.ReactElement {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [exePath, setExePath] = useState(initial?.exePath ?? '');
  const [boostLevel, setBoostLevel] = useState<BoostLevel>(initial?.boostLevel ?? 'none');
  const [processesToSuspend, setProcessesToSuspend] = useState(
    initial?.processesToSuspend?.join(', ') ?? '',
  );
  const [processPriority, setProcessPriority] = useState<ProcessPriorityLevel>(
    initial?.processPriority ?? 'normal',
  );
  const [powerPlan, setPowerPlan] = useState<PowerPlanType>(initial?.powerPlan ?? 'unchanged');
  const [cpuAffinityGame, setCpuAffinityGame] = useState<number[]>(initial?.cpuAffinityGame ?? []);
  const [cpuAffinityBackground, setCpuAffinityBackground] = useState<number[]>(
    initial?.cpuAffinityBackground ?? [],
  );
  const [processesToKill, setProcessesToKill] = useState(
    initial?.processesToKill?.join(', ') ?? '',
  );
  const [timerResolutionMs, setTimerResolutionMs] = useState(() => {
    const val = initial?.timerResolution100ns;
    return val != null ? (val / TIMER_100NS_PER_MS).toFixed(3) : '';
  });
  const [autoSuspendEnabled, setAutoSuspendEnabled] = useState(
    initial?.autoSuspendEnabled ?? false,
  );

  const handleSubmit = useCallback(() => {
    if (!displayName.trim() || !exePath.trim()) return;

    const profile: GameProfile = {
      id: initial?.id ?? '',
      displayName: displayName.trim(),
      exePath: exePath.trim(),
      steamAppId: initial?.steamAppId ?? null,
      cpuAffinityGame: cpuAffinityGame.length > 0 ? cpuAffinityGame : null,
      cpuAffinityBackground: cpuAffinityBackground.length > 0 ? cpuAffinityBackground : null,
      processPriority,
      powerPlan,
      processesToSuspend: processesToSuspend
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      processesToKill: processesToKill
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      timerResolution100ns: timerResolutionMs
        ? Math.round(parseFloat(timerResolutionMs) * TIMER_100NS_PER_MS)
        : null,
      autoSuspendEnabled,
      boostLevel,
      lastPlayed: initial?.lastPlayed ?? null,
      totalPlaySecs: initial?.totalPlaySecs ?? 0,
      createdAt: initial?.createdAt ?? 0,
      updatedAt: initial?.updatedAt ?? 0,
    };

    onSave(profile);
  }, [
    displayName,
    exePath,
    boostLevel,
    processesToSuspend,
    processPriority,
    powerPlan,
    cpuAffinityGame,
    cpuAffinityBackground,
    processesToKill,
    timerResolutionMs,
    autoSuspendEnabled,
    initial,
    onSave,
  ]);

  return (
    <div className="flex flex-col gap-3 p-3 bg-base-800 border border-border-subtle rounded">
      {/* ゲーム名 */}
      <label className="flex flex-col gap-1">
        <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
          ゲーム名
        </span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="例: Rocket League"
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
        />
      </label>

      {/* EXE パス */}
      <label className="flex flex-col gap-1">
        <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
          実行ファイル（EXE パス）
        </span>
        <input
          type="text"
          value={exePath}
          onChange={(e) => setExePath(e.target.value)}
          placeholder="例: C:\Games\RocketLeague\RocketLeague.exe"
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
        />
      </label>

      {/* ブーストレベル */}
      <label className="flex flex-col gap-1">
        <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
          ブーストレベル
        </span>
        <select
          value={boostLevel}
          onChange={(e) => setBoostLevel(e.target.value as BoostLevel)}
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
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
            <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
              サスペンドプロセス（カンマ区切り）
            </span>
            <input
              type="text"
              value={processesToSuspend}
              onChange={(e) => setProcessesToSuspend(e.target.value)}
              placeholder="例: chrome.exe, discord.exe"
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
            />
          </label>

          {/* 自動サスペンド有効化 */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoSuspendEnabled}
              onChange={(e) => setAutoSuspendEnabled(e.target.checked)}
              className="w-3 h-3 rounded border-border-subtle bg-base-900 text-[var(--color-cyan-500)] focus:ring-[var(--color-cyan-500)] focus:ring-offset-0"
            />
            <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
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
            <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
              プロセス優先度
            </span>
            <select
              value={processPriority}
              onChange={(e) => setProcessPriority(e.target.value as ProcessPriorityLevel)}
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
            >
              <option value="normal">通常</option>
              <option value="aboveNormal">通常以上</option>
              <option value="high">高</option>
              <option value="realtime">リアルタイム（注意）</option>
            </select>
          </label>

          {/* 電源プラン */}
          <label className="flex flex-col gap-1">
            <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
              電源プラン
            </span>
            <select
              value={powerPlan}
              onChange={(e) => setPowerPlan(e.target.value as PowerPlanType)}
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
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
            <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
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
              className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
            />
            <span className="font-[var(--font-mono)] text-[9px] text-text-secondary">
              低い値ほどスケジューリング精度が向上しますが、消費電力が増加します。
            </span>
          </label>
        </>
      )}

      {/* === Level 3 追加フィールド === */}
      {boostLevel === 'hard' && (
        <label className="flex flex-col gap-1">
          <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
            強制終了プロセス（カンマ区切り）
          </span>
          <input
            type="text"
            value={processesToKill}
            onChange={(e) => setProcessesToKill(e.target.value)}
            placeholder="例: wallpaper_engine.exe, obs64.exe"
            className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
          />
          <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-danger-500)]">
            ⚠️ 強制終了は不可逆です。保存していないデータが失われる可能性があります。
          </span>
        </label>
      )}

      {/* 一時停止プロセス */}
      <label className="flex flex-col gap-1">
        <span className="font-[var(--font-mono)] text-[9px] text-text-muted tracking-[0.1em]">
          一時停止プロセス（カンマ区切り）
        </span>
        <input
          type="text"
          value={processesToSuspend}
          onChange={(e) => setProcessesToSuspend(e.target.value)}
          placeholder="例: chrome.exe, discord.exe"
          className="bg-base-900 border border-border-subtle rounded px-2 py-1 font-[var(--font-mono)] text-[11px] text-text-primary outline-none focus:border-[var(--color-cyan-500)]"
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

// ─── プロファイルカード ──────────────────────────────────────────────────────

interface ProfileCardProps {
  profile: GameProfile;
  isActive: boolean;
  onApply: (id: string) => void;
  onEdit: (profile: GameProfile) => void;
  onDelete: (id: string) => void;
}

function ProfileCard({
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
        isActive ? 'border-[var(--color-cyan-500)]' : 'border-border-subtle'
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="font-[var(--font-mono)] text-[11px] text-text-primary font-bold truncate">
          {profile.displayName}
        </div>
        {isActive && (
          <span className="font-[var(--font-mono)] text-[9px] text-[var(--color-cyan-500)] tracking-[0.1em]">
            ● 適用中
          </span>
        )}
      </div>

      {/* 情報 */}
      <div className="flex flex-col gap-0.5">
        <div
          className="font-[var(--font-mono)] text-[9px] text-text-muted truncate"
          title={profile.exePath}
        >
          {profile.exePath}
        </div>
        <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
          ブースト: {BOOST_LABELS[profile.boostLevel]}
        </div>
        {/* 優先度（Normal 以外の場合のみ表示） */}
        {profile.processPriority !== 'normal' && (
          <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
            優先度: {PRIORITY_LABELS[profile.processPriority]}
          </div>
        )}
        {/* 電源プラン（unchanged 以外の場合のみ表示） */}
        {profile.powerPlan !== 'unchanged' && (
          <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
            電源: {POWER_PLAN_LABELS[profile.powerPlan]}
          </div>
        )}
        {/* タイマーリゾリューション */}
        {profile.timerResolution100ns != null && (
          <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
            タイマー: {(profile.timerResolution100ns / TIMER_100NS_PER_MS).toFixed(3)} ms
          </div>
        )}
        {/* 強制終了プロセス（Level 3） */}
        {profile.processesToKill.length > 0 && (
          <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-danger-500)]">
            強制終了: {profile.processesToKill.join(', ')}
          </div>
        )}
        {profile.processesToSuspend.length > 0 && (
          <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
            一時停止: {profile.processesToSuspend.join(', ')}
          </div>
        )}
        <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
          プレイ時間: {playHours}時間{playMins}分
        </div>
      </div>

      {/* アクション */}
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => onApply(profile.id)}
          disabled={isActive}
          className={`flex-1 font-[var(--font-mono)] text-[9px] py-1 border-none rounded-[2px] tracking-[0.05em] ${
            isActive
              ? 'bg-base-600 text-text-muted cursor-default opacity-50'
              : 'bg-[var(--color-cyan-500)] text-base-900 cursor-pointer'
          }`}
        >
          {isActive ? '適用中' : '▶ 適用'}
        </button>
        <button
          type="button"
          onClick={() => onEdit(profile)}
          className="font-[var(--font-mono)] text-[9px] py-1 px-3 bg-base-700 text-text-primary border-none rounded-[2px] cursor-pointer"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => onDelete(profile.id)}
          className="font-[var(--font-mono)] text-[9px] py-1 px-3 bg-base-700 text-[var(--color-danger-500)] border-none rounded-[2px] cursor-pointer"
        >
          削除
        </button>
      </div>
    </div>
  );
}

// ─── 電源プラン表示コンポーネント ────────────────────────────────────────────────

function CurrentPowerPlanDisplay() {
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
    // 30秒ごとに更新
    const interval = setInterval(fetchCurrentPlan, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
        電源プラン: 読み込み中...
      </div>
    );
  }

  if (error || !currentPlan) {
    return (
      <div className="font-[var(--font-mono)] text-[9px] text-[var(--color-danger-500)]">
        電源プラン: {error || '不明'}
      </div>
    );
  }

  return (
    <div className="font-[var(--font-mono)] text-[9px] text-text-muted">
      現在の電源: {currentPlan.name}
    </div>
  );
}

// ─── ProfileTab メイン ───────────────────────────────────────────────────────

interface ProfileTabProps {
  className?: string;
}

export default function ProfileTab({ className = '' }: ProfileTabProps): React.ReactElement {
  const { profiles, activeProfileId, isLoading, isApplying, error } = useGameProfileState();
  const {
    loadProfiles,
    saveProfile,
    deleteProfile,
    applyProfile,
    revertProfile,
    setupListeners,
    clearError,
  } = useGameProfileActions();

  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<GameProfile | null>(null);

  // 初回読み込み + イベントリスナー設定
  useEffect(() => {
    void loadProfiles();
    let cleanup: (() => void) | undefined;
    void setupListeners().then((fn) => {
      cleanup = fn;
    });
    return () => cleanup?.();
  }, [loadProfiles, setupListeners]);

  const handleSave = useCallback(
    async (profile: GameProfile) => {
      await saveProfile(profile);
      setShowForm(false);
      setEditingProfile(null);
    },
    [saveProfile],
  );

  const handleEdit = useCallback((profile: GameProfile) => {
    setEditingProfile(profile);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteProfile(id);
    },
    [deleteProfile],
  );

  const handleNewProfile = useCallback(() => {
    setEditingProfile(null);
    setShowForm(true);
  }, []);

  const handleCancel = useCallback(() => {
    setShowForm(false);
    setEditingProfile(null);
  }, []);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* エラー表示 */}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* ヘッダー + リバートボタン + 新規ボタン */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-[var(--font-mono)] text-[10px] text-text-muted">
            {profiles.length} 件のプロファイル
          </span>
          <CurrentPowerPlanDisplay />
        </div>
        <div className="flex gap-2">
          {activeProfileId && (
            <Button variant="secondary" onClick={() => void revertProfile()} className="text-[9px]">
              リバート
            </Button>
          )}
          <Button variant="primary" onClick={handleNewProfile} className="text-[9px]">
            + 新規プロファイル
          </Button>
        </div>
      </div>

      {/* フォーム */}
      {showForm && (
        <ProfileForm
          initial={editingProfile ?? createDefaultProfile('', '')}
          onSave={(p) => void handleSave(p)}
          onCancel={handleCancel}
        />
      )}

      {/* ローディング */}
      {isLoading && <LoadingState message="読み込み中..." />}

      {/* 適用中インジケーター */}
      {isApplying && (
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-cyan-500)] text-center py-2">
          プロファイル適用中...
        </div>
      )}

      {/* プロファイル一覧 */}
      {!isLoading && profiles.length === 0 && !showForm && (
        <EmptyState
          message="プロファイルがありません"
          action="「+ 新規プロファイル」で作成してください"
        />
      )}

      <div className="flex flex-col gap-2">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            isActive={profile.id === activeProfileId}
            onApply={(id) => void applyProfile(id)}
            onEdit={handleEdit}
            onDelete={(id) => void handleDelete(id)}
          />
        ))}
      </div>
    </div>
  );
}
