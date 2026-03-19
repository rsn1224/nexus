import { create } from 'zustand';
import {
  applyGameProfile as cmdApplyProfile,
  deleteGameProfile as cmdDeleteProfile,
  exportGameProfile as cmdExportProfile,
  fetchCoreParkingState as cmdFetchCoreParking,
  fetchGameProfiles as cmdFetchProfiles,
  getCpuTopology as cmdGetCpuTopology,
  importGameProfile as cmdImportProfile,
  revertGameProfile as cmdRevertProfile,
  saveGameProfile as cmdSaveProfile,
  setCoreParking as cmdSetCoreParking,
  startGameMonitor as cmdStartMonitor,
  stopGameMonitor as cmdStopMonitor,
  createDefaultProfile,
  setupGameListeners,
  updateProfileInList,
} from '../lib/gameProfile';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { GameProfile, SharedProfile } from '../types';
import type { GameProfileActions, GameProfileState } from '../types/game';

export const useGameProfileStore = create<GameProfileState & GameProfileActions>((set, get) => ({
  // 状態
  profiles: [],
  activeProfileId: null,
  currentGameExe: null,
  applyResult: null,
  isLoading: false,
  isApplying: false,
  error: null,
  isMonitoring: false,
  cpuTopology: null,
  coreParkingState: null,

  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await cmdFetchProfiles();
      set({ profiles, isLoading: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: プロファイル読み込み失敗: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  saveProfile: async (profile: GameProfile) => {
    try {
      const saved = await cmdSaveProfile(profile);
      set({ profiles: updateProfileInList(saved, get().profiles) });
      log.info({ profileId: saved.id }, 'gameProfile: プロファイル保存完了');
      return saved;
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: プロファイル保存失敗: %s', msg);
      set({ error: msg });
      return null;
    }
  },

  deleteProfile: async (id: string) => {
    try {
      await cmdDeleteProfile(id);
      set({ profiles: get().profiles.filter((p) => p.id !== id) });
      log.info({ profileId: id }, 'gameProfile: プロファイル削除完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: プロファイル削除失敗: %s', msg);
      set({ error: msg });
    }
  },

  applyProfile: async (id: string) => {
    set({ isApplying: true, error: null });
    try {
      const result = await cmdApplyProfile(id);
      set({ activeProfileId: id, applyResult: result, isApplying: false });
      log.info({ profileId: id }, 'gameProfile: プロファイル適用完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: プロファイル適用失敗: %s', msg);
      set({ isApplying: false, error: msg });
    }
  },

  revertProfile: async () => {
    try {
      await cmdRevertProfile();
      set({ activeProfileId: null, applyResult: null });
      log.info('gameProfile: リバート完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: リバート失敗: %s', msg);
      set({ error: msg });
    }
  },

  // 監視
  startMonitoring: async () => {
    try {
      await cmdStartMonitor();
      set({ isMonitoring: true });
      log.info('gameProfile: ゲーム監視開始');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: ゲーム監視開始失敗: %s', msg);
      set({ error: msg });
    }
  },

  stopMonitoring: async () => {
    try {
      await cmdStopMonitor();
      set({ isMonitoring: false });
      log.info('gameProfile: ゲーム監視停止');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: ゲーム監視停止失敗: %s', msg);
      set({ error: msg });
    }
  },

  // イベントリスナー
  setupListeners: async () => setupGameListeners(set, get),

  getCpuTopology: async () => {
    try {
      const topology = await cmdGetCpuTopology();
      set({ cpuTopology: topology });
      log.info({ topology }, 'gameProfile: CPU トポロジー取得完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: CPU トポロジー取得失敗: %s', msg);
      // エラーでも致命的ではないので error には設定しない
    }
  },

  fetchCoreParking: async () => {
    try {
      const state = await cmdFetchCoreParking();
      set({ coreParkingState: state });
      log.info({ state }, 'gameProfile: コアパーキング状態取得完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: コアパーキング状態取得失敗: %s', msg);
    }
  },

  applyCoreParking: async (minCoresPercent: number) => {
    try {
      await cmdSetCoreParking(minCoresPercent);
      log.info({ minCoresPercent }, 'gameProfile: コアパーキング設定完了');
      const state = await cmdFetchCoreParking();
      set({ coreParkingState: state });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: コアパーキング設定失敗: %s', msg);
      set({ error: msg });
    }
  },

  clearError: () => set({ error: null }),

  exportProfile: async (id: string): Promise<string | null> => {
    try {
      const json = await cmdExportProfile(id);
      log.info({ id }, 'gameProfile: エクスポート完了');
      return json;
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: エクスポート失敗: %s', msg);
      set({ error: msg });
      return null;
    }
  },

  importProfile: async (json: string): Promise<GameProfile | null> => {
    try {
      const profile = await cmdImportProfile(json);
      log.info({ id: profile.id }, 'gameProfile: インポート完了');
      const { profiles } = useGameProfileStore.getState();
      set({ profiles: [...profiles, profile] });
      return profile;
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: インポート失敗: %s', msg);
      set({ error: msg });
      return null;
    }
  },
}));

export { useGameProfileActions, useGameProfileState } from '../hooks/gameProfileHooks';
export type { SharedProfile };
export { createDefaultProfile };
