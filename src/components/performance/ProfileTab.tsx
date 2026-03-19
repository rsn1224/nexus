import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDefaultProfile,
  useGameProfileActions,
  useGameProfileState,
} from '../../stores/useGameProfileStore';
import type { GameProfile } from '../../types';
import { Button, EmptyState, ErrorBanner, LoadingState } from '../ui';
import ProfileCard, { CurrentPowerPlanDisplay } from './ProfileCard';
import ProfileForm from './ProfileForm';
import ProfileSharePanel from './ProfileSharePanel';

interface ProfileTabProps {
  className?: string;
  onNew?: () => void;
  onEdit?: (profile: GameProfile) => void;
}

export default function ProfileTab({
  className = '',
  onNew,
  onEdit,
}: ProfileTabProps): React.ReactElement {
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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleEdit = useCallback(
    (profile: GameProfile) => {
      if (onEdit) {
        onEdit(profile);
      } else {
        setEditingProfile(profile);
        setShowForm(true);
      }
    },
    [onEdit],
  );

  const handleDeleteRequest = useCallback((id: string): void => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setDeleteConfirmId(id);
    deleteTimerRef.current = setTimeout(() => setDeleteConfirmId(null), 3000);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (id: string): Promise<void> => {
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      setDeleteConfirmId(null);
      await deleteProfile(id);
    },
    [deleteProfile],
  );

  const handleNewProfile = useCallback(() => {
    if (onNew) {
      onNew();
    } else {
      setEditingProfile(null);
      setShowForm(true);
    }
  }, [onNew]);

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
          <span className="font-mono text-[10px] text-text-muted">
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

      {/* フォーム — 外部ナビゲーションが提供されている場合は表示しない */}
      {!onNew && showForm && (
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
        <div className="font-mono text-[10px] text-accent-500 text-center py-2">
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
            deleteConfirmId={deleteConfirmId}
            onApply={(id) => void applyProfile(id)}
            onEdit={handleEdit}
            onDeleteRequest={handleDeleteRequest}
            onDeleteConfirm={(id) => void handleDeleteConfirm(id)}
          />
        ))}
      </div>

      {/* プロファイル共有（エクスポート / インポート） */}
      <ProfileSharePanel
        selectedProfile={profiles.find((p) => p.id === activeProfileId) ?? profiles[0] ?? null}
      />
    </div>
  );
}
