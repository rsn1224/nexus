import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import {
  createDefaultProfile,
  useGameProfileActions,
  useGameProfileState,
} from '../../stores/useGameProfileStore';
import type { BoostLevel, GameProfile } from '../../types';
import { Button } from '../ui';

// ─── ブーストレベルラベル ────────────────────────────────────────────────────

const BOOST_LABELS: Record<BoostLevel, string> = {
  none: 'なし',
  soft: 'ソフト（Level 1）',
  medium: 'ミディアム（Level 2）',
  hard: 'ハード（Level 3）',
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

  const handleSubmit = useCallback(() => {
    if (!displayName.trim() || !exePath.trim()) return;

    const profile: GameProfile = {
      id: initial?.id ?? '',
      displayName: displayName.trim(),
      exePath: exePath.trim(),
      steamAppId: initial?.steamAppId ?? null,
      cpuAffinityGame: initial?.cpuAffinityGame ?? null,
      cpuAffinityBackground: initial?.cpuAffinityBackground ?? null,
      processPriority: initial?.processPriority ?? 'normal',
      powerPlan: initial?.powerPlan ?? 'unchanged',
      processesToSuspend: processesToSuspend
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      processesToKill: initial?.processesToKill ?? [],
      timerResolution100ns: initial?.timerResolution100ns ?? null,
      boostLevel,
      lastPlayed: initial?.lastPlayed ?? null,
      totalPlaySecs: initial?.totalPlaySecs ?? 0,
      createdAt: initial?.createdAt ?? 0,
      updatedAt: initial?.updatedAt ?? 0,
    };

    onSave(profile);
  }, [displayName, exePath, boostLevel, processesToSuspend, initial, onSave]);

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
      {error && (
        <div className="px-3 py-2 bg-red-500/10 border border-red-600 rounded font-[var(--font-mono)] text-[10px] text-red-500 flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-red-400 bg-transparent border-none cursor-pointer text-[10px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* ヘッダー + リバートボタン + 新規ボタン */}
      <div className="flex items-center justify-between">
        <span className="font-[var(--font-mono)] text-[10px] text-text-muted">
          {profiles.length} 件のプロファイル
        </span>
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
      {isLoading && (
        <div className="font-[var(--font-mono)] text-[10px] text-text-muted text-center py-4">
          読み込み中...
        </div>
      )}

      {/* 適用中インジケーター */}
      {isApplying && (
        <div className="font-[var(--font-mono)] text-[10px] text-[var(--color-cyan-500)] text-center py-2">
          プロファイル適用中...
        </div>
      )}

      {/* プロファイル一覧 */}
      {!isLoading && profiles.length === 0 && !showForm && (
        <div className="font-[var(--font-mono)] text-[10px] text-text-muted text-center py-8">
          プロファイルがありません。「+ 新規プロファイル」で作成してください。
        </div>
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
