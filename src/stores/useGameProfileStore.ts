import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { createDefaultProfile } from '../lib/gameProfile';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type {
  CoreParkingState,
  CpuTopology,
  GameExitEvent,
  GameLaunchEvent,
  GameProfile,
  ProfileApplyResult,
  SharedProfile,
} from '../types';

// ─── ストア型定義 ────────────────────────────────────────────────────────────

interface GameProfileState {
  profiles: GameProfile[];
  activeProfileId: string | null;
  currentGameExe: string | null;
  applyResult: ProfileApplyResult | null;
  isLoading: boolean;
  isApplying: boolean;
  error: string | null;
  isMonitoring: boolean;
  cpuTopology: CpuTopology | null;
  coreParkingState: CoreParkingState | null;
}

interface GameProfileActions {
  loadProfiles: () => Promise<void>;
  saveProfile: (profile: GameProfile) => Promise<GameProfile | null>;
  deleteProfile: (id: string) => Promise<void>;
  applyProfile: (id: string) => Promise<void>;
  revertProfile: () => Promise<void>;
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => Promise<void>;
  setupListeners: () => Promise<() => void>;
  getCpuTopology: () => Promise<void>;
  fetchCoreParking: () => Promise<void>;
  applyCoreParking: (minCoresPercent: number) => Promise<void>;
  exportProfile: (id: string) => Promise<string | null>;
  importProfile: (json: string) => Promise<GameProfile | null>;
  clearError: () => void;
}

export { createDefaultProfile };

// ─── ストア ──────────────────────────────────────────────────────────────────

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

  // CRUD
  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await invoke<GameProfile[]>('list_game_profiles');
      set({ profiles, isLoading: false });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: プロファイル読み込み失敗: %s', msg);
      set({ isLoading: false, error: msg });
    }
  },

  saveProfile: async (profile: GameProfile) => {
    try {
      const saved = await invoke<GameProfile>('save_game_profile', { profile });
      const profiles = get().profiles;
      const idx = profiles.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        set({ profiles: profiles.map((p, i) => (i === idx ? saved : p)) });
      } else {
        set({ profiles: [...profiles, saved] });
      }
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
      await invoke('delete_game_profile', { id });
      set({ profiles: get().profiles.filter((p) => p.id !== id) });
      log.info({ profileId: id }, 'gameProfile: プロファイル削除完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: プロファイル削除失敗: %s', msg);
      set({ error: msg });
    }
  },

  // 適用・リバート
  applyProfile: async (id: string) => {
    set({ isApplying: true, error: null });
    try {
      const result = await invoke<ProfileApplyResult>('apply_game_profile', { id });
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
      await invoke('revert_game_profile');
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
      await invoke('start_game_monitor');
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
      await invoke('stop_game_monitor');
      set({ isMonitoring: false });
      log.info('gameProfile: ゲーム監視停止');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: ゲーム監視停止失敗: %s', msg);
      set({ error: msg });
    }
  },

  // イベントリスナー
  setupListeners: async () => {
    const unlistenLaunched = await listen<GameLaunchEvent>('nexus://game-launched', (e) => {
      log.info({ event: e.payload }, 'gameProfile: ゲーム起動検出');
      set({
        currentGameExe: e.payload.exePath,
        activeProfileId: e.payload.profileId,
      });
    });

    const unlistenExited = await listen<GameExitEvent>('nexus://game-exited', (e) => {
      log.info({ event: e.payload }, 'gameProfile: ゲーム終了検出');
      set({
        currentGameExe: null,
        activeProfileId: null,
        applyResult: null,
      });
      // プレイ時間が更新されたので再読み込み
      void get().loadProfiles();
    });

    const unlistenApplied = await listen<ProfileApplyResult>('nexus://profile-applied', (e) => {
      log.info({ event: e.payload }, 'gameProfile: プロファイル適用通知');
      set({
        applyResult: e.payload,
        activeProfileId: e.payload.profileId,
      });
    });

    const unlistenReverted = await listen('nexus://profile-reverted', () => {
      log.info('gameProfile: リバート通知');
      set({ activeProfileId: null, applyResult: null });
    });

    return () => {
      unlistenLaunched();
      unlistenExited();
      unlistenApplied();
      unlistenReverted();
    };
  },

  getCpuTopology: async () => {
    try {
      const topology = await invoke<CpuTopology>('get_cpu_topology');
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
      const state = await invoke<CoreParkingState>('get_core_parking_state');
      set({ coreParkingState: state });
      log.info({ state }, 'gameProfile: コアパーキング状態取得完了');
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'gameProfile: コアパーキング状態取得失敗: %s', msg);
    }
  },

  applyCoreParking: async (minCoresPercent: number) => {
    try {
      await invoke('set_core_parking', { minCoresPercent });
      log.info({ minCoresPercent }, 'gameProfile: コアパーキング設定完了');
      const state = await invoke<CoreParkingState>('get_core_parking_state');
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
      const json = await invoke<string>('export_game_profile', { id });
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
      const profile = await invoke<GameProfile>('import_game_profile', { json });
      log.info({ id: profile.id }, 'gameProfile: インポート完了');
      // ストアのプロファイル一覧を更新
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

// SharedProfile 型は import/export の戻り値として commands から直接使用される
export type { SharedProfile };

// ─── useShallow セレクタ ─────────────────────────────────────────────────────

export const useGameProfileState = () =>
  useGameProfileStore(
    useShallow((s) => ({
      profiles: s.profiles,
      activeProfileId: s.activeProfileId,
      currentGameExe: s.currentGameExe,
      applyResult: s.applyResult,
      isLoading: s.isLoading,
      isApplying: s.isApplying,
      error: s.error,
      isMonitoring: s.isMonitoring,
      cpuTopology: s.cpuTopology,
      coreParkingState: s.coreParkingState,
    })),
  );

export const useGameProfileActions = () =>
  useGameProfileStore(
    useShallow((s) => ({
      loadProfiles: s.loadProfiles,
      saveProfile: s.saveProfile,
      deleteProfile: s.deleteProfile,
      applyProfile: s.applyProfile,
      revertProfile: s.revertProfile,
      startMonitoring: s.startMonitoring,
      stopMonitoring: s.stopMonitoring,
      setupListeners: s.setupListeners,
      getCpuTopology: s.getCpuTopology,
      fetchCoreParking: s.fetchCoreParking,
      applyCoreParking: s.applyCoreParking,
      exportProfile: s.exportProfile,
      importProfile: s.importProfile,
      clearError: s.clearError,
    })),
  );
