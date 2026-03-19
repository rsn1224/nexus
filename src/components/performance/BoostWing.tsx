import type React from 'react';
import { useCallback, useMemo } from 'react';
import { boostPageSuggestions } from '../../lib/localAi';
import { createDefaultProfile, useGameProfileStore } from '../../stores/useGameProfileStore';
import { useNavStore } from '../../stores/useNavStore';
import { usePulseStore } from '../../stores/usePulseStore';
import type { GameProfile } from '../../types';
import AiPanel from '../shared/AiPanel';
import { TabBar } from '../ui';
import ProcessTab from './ProcessTab';
import ProfileForm from './ProfileForm';
import ProfileTab from './ProfileTab';
import SessionTab from './SessionTab';
import WatchdogTab from './WatchdogTab';

const TABS = [
  { id: 'process', label: 'プロセス最適化' },
  { id: 'profiles', label: 'プロファイル' },
  { id: 'watchdog', label: 'WATCHDOG' },
  { id: 'session', label: 'セッション' },
] as const;

type BoostTab = (typeof TABS)[number]['id'];

export default function BoostWing(): React.ReactElement {
  const wingState = useNavStore((s) => s.wingStates.performance);
  const activeTab = (wingState.activeTab ?? 'process') as BoostTab;
  const currentSubpage = wingState.subpageStack[wingState.subpageStack.length - 1] ?? null;

  const cpuPercent = usePulseStore((s) =>
    s.snapshots.length > 0 ? (s.snapshots[s.snapshots.length - 1]?.cpuPercent ?? null) : null,
  );

  const boostSuggestions = useMemo(() => boostPageSuggestions([], [], cpuPercent), [cpuPercent]);

  const handleNewProfile = useCallback(() => {
    useNavStore.getState().pushSubpage('performance', {
      id: 'profile-form',
      params: {},
      title: 'NEW PROFILE',
    });
  }, []);

  const handleEditProfile = useCallback((profile: GameProfile) => {
    useNavStore.getState().pushSubpage('performance', {
      id: 'profile-form',
      params: { profile },
      title: profile.displayName,
    });
  }, []);

  const handleSaveProfile = useCallback(async (profile: GameProfile): Promise<void> => {
    await useGameProfileStore.getState().saveProfile(profile);
    useNavStore.getState().popSubpage('performance');
  }, []);

  const handleCancelProfile = useCallback(() => {
    useNavStore.getState().popSubpage('performance');
  }, []);

  const isSubpageActive = currentSubpage !== null;

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Tab Bar — サブページ表示中は非表示 */}
      {!isSubpageActive && (
        <TabBar
          tabs={[...TABS]}
          active={activeTab}
          onChange={(id) => useNavStore.getState().setTab('performance', id)}
          className="mb-4"
        />
      )}

      {/* コンテンツ */}
      <div className="flex-1 overflow-y-auto">
        {isSubpageActive && currentSubpage.id === 'profile-form' ? (
          <ProfileForm
            initial={
              (currentSubpage.params.profile as GameProfile | null) ?? createDefaultProfile('', '')
            }
            onSave={(p) => void handleSaveProfile(p)}
            onCancel={handleCancelProfile}
          />
        ) : (
          <>
            {activeTab === 'process' && <ProcessTab />}
            {activeTab === 'profiles' && (
              <ProfileTab onNew={handleNewProfile} onEdit={handleEditProfile} />
            )}
            {activeTab === 'watchdog' && <WatchdogTab />}
            {activeTab === 'session' && <SessionTab />}
          </>
        )}
      </div>

      <AiPanel suggestions={boostSuggestions} />
    </div>
  );
}
