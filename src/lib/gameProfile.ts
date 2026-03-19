import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type {
  BoostLevel,
  CoreParkingState,
  CpuTopology,
  GameExitEvent,
  GameLaunchEvent,
  GameProfile,
  PowerPlanType,
  ProcessPriorityLevel,
  ProfileApplyResult,
} from '../types';
import log from './logger';

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
    coreParkingDisabled: false,
    lastPlayed: null,
    totalPlaySecs: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}

export function updateProfileInList(saved: GameProfile, profiles: GameProfile[]): GameProfile[] {
  const idx = profiles.findIndex((p) => p.id === saved.id);
  if (idx >= 0) {
    return profiles.map((p, i) => (i === idx ? saved : p));
  }
  return [...profiles, saved];
}

export async function fetchGameProfiles(): Promise<GameProfile[]> {
  return await invoke<GameProfile[]>('list_game_profiles');
}

export async function saveGameProfile(profile: GameProfile): Promise<GameProfile> {
  return await invoke<GameProfile>('save_game_profile', { profile });
}

export async function deleteGameProfile(id: string): Promise<void> {
  await invoke('delete_game_profile', { id });
}

export async function applyGameProfile(id: string): Promise<ProfileApplyResult> {
  return await invoke<ProfileApplyResult>('apply_game_profile', { id });
}

export async function revertGameProfile(): Promise<void> {
  await invoke('revert_game_profile');
}

export async function getCpuTopology(): Promise<CpuTopology> {
  return await invoke<CpuTopology>('get_cpu_topology');
}

export async function fetchCoreParkingState(): Promise<CoreParkingState> {
  return await invoke<CoreParkingState>('get_core_parking_state');
}

export async function setCoreParking(minCoresPercent: number): Promise<void> {
  await invoke('set_core_parking', { minCoresPercent });
}

export async function exportGameProfile(id: string): Promise<string> {
  return await invoke<string>('export_game_profile', { id });
}

export async function importGameProfile(json: string): Promise<GameProfile> {
  return await invoke<GameProfile>('import_game_profile', { json });
}

export async function startGameMonitor(): Promise<void> {
  await invoke('start_game_monitor');
}

export async function stopGameMonitor(): Promise<void> {
  await invoke('stop_game_monitor');
}

type GameProfileSetFn = (partial: {
  currentGameExe?: string | null;
  activeProfileId?: string | null;
  applyResult?: ProfileApplyResult | null;
}) => void;

type GameProfileGetFn = () => { loadProfiles: () => Promise<void> };

export async function setupGameListeners(
  set: GameProfileSetFn,
  get: GameProfileGetFn,
): Promise<() => void> {
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
}
