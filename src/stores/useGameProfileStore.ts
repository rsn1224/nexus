import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type {
  BoostLevel,
  CpuTopology,
  GameExitEvent,
  GameLaunchEvent,
  GameProfile,
  PowerPlanType,
  ProcessPriorityLevel,
  ProfileApplyResult,
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
  clearError: () => void;
}

// ─── デフォルトプロファイル生成 ──────────────────────────────────────────────

export function createDefaultProfile(
  displayName: string,
  exePath: string,
  steamAppId?: number,
): Partial<GameProfile> {
  return {
    id: '',
    displayName,
    exePath,
    steamAppId: steamAppId ?? null,
    cpuAffinityGame: null,
    cpuAffinityBackground: null,
    processPriority: 'normal' as ProcessPriorityLevel,
    powerPlan: 'unchanged' as PowerPlanType,
    processesToSuspend: [],
    processesToKill: [],
    timerResolution100ns: null,
    boostLevel: 'none' as BoostLevel,
    lastPlayed: null,
    totalPlaySecs: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

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

  clearError: () => set({ error: null }),
}));

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
      clearError: s.clearError,
    })),
  );
