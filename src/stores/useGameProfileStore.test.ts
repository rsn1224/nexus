import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── モック ──────────────────────────────────────────────────────────────────

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn().mockResolvedValue(vi.fn()) }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { GameProfile, ProfileApplyResult } from '../types';
import { createDefaultProfile, useGameProfileStore } from './useGameProfileStore';

// ─── テストデータ ────────────────────────────────────────────────────────────

const MOCK_PROFILE: GameProfile = {
  id: 'test-profile-1',
  displayName: 'テストゲーム',
  exePath: 'C:\\Games\\test.exe',
  steamAppId: 12345,
  cpuAffinityGame: null,
  cpuAffinityBackground: null,
  processPriority: 'normal',
  powerPlan: 'unchanged',
  processesToSuspend: [],
  processesToKill: [],
  timerResolution100ns: null,
  boostLevel: 'none',
  autoSuspendEnabled: false,
  lastPlayed: null,
  totalPlaySecs: 0,
  createdAt: 1710000000000,
  updatedAt: 1710000000000,
};

const MOCK_PROFILE_2: GameProfile = {
  ...MOCK_PROFILE,
  id: 'test-profile-2',
  displayName: '別のゲーム',
  exePath: 'C:\\Games\\other.exe',
  steamAppId: 67890,
  boostLevel: 'soft',
};

const MOCK_APPLY_RESULT: ProfileApplyResult = {
  profileId: 'test-profile-1',
  applied: ['processPriority', 'powerPlan'],
  warnings: [],
  appliedAt: 1710000000000,
  prevPowerPlan: '381b4222-f694-41f0-9685-ff5bb260df2e',
  suspendedPids: [],
};

// ─── ヘルパー ────────────────────────────────────────────────────────────────

function resetStore(): void {
  useGameProfileStore.setState({
    profiles: [],
    activeProfileId: null,
    currentGameExe: null,
    applyResult: null,
    isLoading: false,
    isApplying: false,
    error: null,
    isMonitoring: false,
  });
  vi.clearAllMocks();
}

// ─── テスト ──────────────────────────────────────────────────────────────────

describe('useGameProfileStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // 初期状態
  describe('初期状態', () => {
    it('空のプロファイル一覧で開始する', () => {
      const state = useGameProfileStore.getState();
      expect(state.profiles).toEqual([]);
      expect(state.activeProfileId).toBeNull();
      expect(state.currentGameExe).toBeNull();
      expect(state.applyResult).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isApplying).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isMonitoring).toBe(false);
    });
  });

  // loadProfiles
  describe('loadProfiles', () => {
    it('プロファイル一覧を正常に読み込む', async () => {
      vi.mocked(invoke).mockResolvedValueOnce([MOCK_PROFILE, MOCK_PROFILE_2]);

      await useGameProfileStore.getState().loadProfiles();

      const state = useGameProfileStore.getState();
      expect(state.profiles).toHaveLength(2);
      expect(state.profiles[0].displayName).toBe('テストゲーム');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(invoke).toHaveBeenCalledWith('list_game_profiles');
    });

    it('読み込み中は isLoading が true', async () => {
      vi.mocked(invoke).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );

      const promise = useGameProfileStore.getState().loadProfiles();
      expect(useGameProfileStore.getState().isLoading).toBe(true);
      await promise;
      expect(useGameProfileStore.getState().isLoading).toBe(false);
    });

    it('読み込みエラー時に error が設定される', async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error('読み込み失敗'));

      await useGameProfileStore.getState().loadProfiles();

      const state = useGameProfileStore.getState();
      expect(state.error).toBeTruthy();
      expect(state.isLoading).toBe(false);
    });
  });

  // saveProfile
  describe('saveProfile', () => {
    it('新規プロファイルを保存して一覧に追加する', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(MOCK_PROFILE);

      const result = await useGameProfileStore.getState().saveProfile(MOCK_PROFILE);

      expect(result).toEqual(MOCK_PROFILE);
      expect(useGameProfileStore.getState().profiles).toHaveLength(1);
      expect(useGameProfileStore.getState().profiles[0].displayName).toBe('テストゲーム');
      expect(invoke).toHaveBeenCalledWith('save_game_profile', { profile: MOCK_PROFILE });
    });

    it('既存プロファイルを更新する（同一IDは置き換え）', async () => {
      // 既存プロファイルをセット
      useGameProfileStore.setState({ profiles: [MOCK_PROFILE] });

      const updated = { ...MOCK_PROFILE, displayName: '更新済みゲーム' };
      vi.mocked(invoke).mockResolvedValueOnce(updated);

      await useGameProfileStore.getState().saveProfile(updated);

      const profiles = useGameProfileStore.getState().profiles;
      expect(profiles).toHaveLength(1);
      expect(profiles[0].displayName).toBe('更新済みゲーム');
    });

    it('保存エラー時に error が設定され null が返る', async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error('保存失敗'));

      const result = await useGameProfileStore.getState().saveProfile(MOCK_PROFILE);

      expect(result).toBeNull();
      expect(useGameProfileStore.getState().error).toBeTruthy();
    });
  });

  // deleteProfile
  describe('deleteProfile', () => {
    it('プロファイルを削除して一覧から除外する', async () => {
      useGameProfileStore.setState({ profiles: [MOCK_PROFILE, MOCK_PROFILE_2] });
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await useGameProfileStore.getState().deleteProfile('test-profile-1');

      const profiles = useGameProfileStore.getState().profiles;
      expect(profiles).toHaveLength(1);
      expect(profiles[0].id).toBe('test-profile-2');
      expect(invoke).toHaveBeenCalledWith('delete_game_profile', { id: 'test-profile-1' });
    });

    it('削除エラー時に error が設定される', async () => {
      useGameProfileStore.setState({ profiles: [MOCK_PROFILE] });
      vi.mocked(invoke).mockRejectedValueOnce(new Error('削除失敗'));

      await useGameProfileStore.getState().deleteProfile('test-profile-1');

      expect(useGameProfileStore.getState().error).toBeTruthy();
      // プロファイルは残るべきである
      expect(useGameProfileStore.getState().profiles).toHaveLength(1);
    });
  });

  // applyProfile
  describe('applyProfile', () => {
    it('プロファイルを適用して状態を更新する', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(MOCK_APPLY_RESULT);

      await useGameProfileStore.getState().applyProfile('test-profile-1');

      const state = useGameProfileStore.getState();
      expect(state.activeProfileId).toBe('test-profile-1');
      expect(state.applyResult).toEqual(MOCK_APPLY_RESULT);
      expect(state.isApplying).toBe(false);
      expect(invoke).toHaveBeenCalledWith('apply_game_profile', { id: 'test-profile-1' });
    });

    it('適用中は isApplying が true', async () => {
      vi.mocked(invoke).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(MOCK_APPLY_RESULT), 100)),
      );

      const promise = useGameProfileStore.getState().applyProfile('test-profile-1');
      expect(useGameProfileStore.getState().isApplying).toBe(true);
      await promise;
      expect(useGameProfileStore.getState().isApplying).toBe(false);
    });

    it('適用エラー時に error が設定される', async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error('適用失敗'));

      await useGameProfileStore.getState().applyProfile('test-profile-1');

      expect(useGameProfileStore.getState().error).toBeTruthy();
      expect(useGameProfileStore.getState().isApplying).toBe(false);
      expect(useGameProfileStore.getState().activeProfileId).toBeNull();
    });
  });

  // revertProfile
  describe('revertProfile', () => {
    it('リバート後に activeProfileId と applyResult がクリアされる', async () => {
      useGameProfileStore.setState({
        activeProfileId: 'test-profile-1',
        applyResult: MOCK_APPLY_RESULT,
      });
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await useGameProfileStore.getState().revertProfile();

      expect(useGameProfileStore.getState().activeProfileId).toBeNull();
      expect(useGameProfileStore.getState().applyResult).toBeNull();
      expect(invoke).toHaveBeenCalledWith('revert_game_profile');
    });

    it('リバートエラー時に error が設定される', async () => {
      useGameProfileStore.setState({ activeProfileId: 'test-profile-1' });
      vi.mocked(invoke).mockRejectedValueOnce(new Error('リバート失敗'));

      await useGameProfileStore.getState().revertProfile();

      expect(useGameProfileStore.getState().error).toBeTruthy();
    });
  });

  // startMonitoring / stopMonitoring
  describe('ゲーム監視', () => {
    it('startMonitoring で isMonitoring が true になる', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await useGameProfileStore.getState().startMonitoring();

      expect(useGameProfileStore.getState().isMonitoring).toBe(true);
      expect(invoke).toHaveBeenCalledWith('start_game_monitor');
    });

    it('stopMonitoring で isMonitoring が false になる', async () => {
      useGameProfileStore.setState({ isMonitoring: true });
      vi.mocked(invoke).mockResolvedValueOnce(undefined);

      await useGameProfileStore.getState().stopMonitoring();

      expect(useGameProfileStore.getState().isMonitoring).toBe(false);
      expect(invoke).toHaveBeenCalledWith('stop_game_monitor');
    });
  });

  // setupListeners
  describe('setupListeners', () => {
    it('4つのイベントリスナーが登録される', async () => {
      const unlistenFn = vi.fn();
      vi.mocked(listen).mockResolvedValue(unlistenFn);

      const cleanup = await useGameProfileStore.getState().setupListeners();

      // 4 イベント: game-launched, game-exited, profile-applied, profile-reverted
      expect(listen).toHaveBeenCalledTimes(4);
      expect(listen).toHaveBeenCalledWith('nexus://game-launched', expect.any(Function));
      expect(listen).toHaveBeenCalledWith('nexus://game-exited', expect.any(Function));
      expect(listen).toHaveBeenCalledWith('nexus://profile-applied', expect.any(Function));
      expect(listen).toHaveBeenCalledWith('nexus://profile-reverted', expect.any(Function));

      // cleanup で全 unlisten が呼ばれる
      cleanup();
      expect(unlistenFn).toHaveBeenCalledTimes(4);
    });

    it('game-launched イベントで状態が更新される', async () => {
      let launchedHandler: ((event: unknown) => void) | undefined;
      vi.mocked(listen).mockImplementation(async (eventName, handler) => {
        if (eventName === 'nexus://game-launched') {
          launchedHandler = handler as (event: unknown) => void;
        }
        return () => {};
      });

      await useGameProfileStore.getState().setupListeners();

      // イベント発火
      launchedHandler?.({
        payload: {
          exePath: 'C:\\Games\\test.exe',
          profileId: 'test-profile-1',
          pid: 1234,
          detectedAt: 1710000000000,
        },
      });

      expect(useGameProfileStore.getState().currentGameExe).toBe('C:\\Games\\test.exe');
      expect(useGameProfileStore.getState().activeProfileId).toBe('test-profile-1');
    });

    it('game-exited イベントで状態がクリアされる', async () => {
      useGameProfileStore.setState({
        currentGameExe: 'C:\\Games\\test.exe',
        activeProfileId: 'test-profile-1',
        applyResult: MOCK_APPLY_RESULT,
      });

      let exitedHandler: ((event: unknown) => void) | undefined;
      vi.mocked(listen).mockImplementation(async (eventName, handler) => {
        if (eventName === 'nexus://game-exited') {
          exitedHandler = handler as (event: unknown) => void;
        }
        return () => {};
      });
      // loadProfiles 呼び出し用
      vi.mocked(invoke).mockResolvedValue([]);

      await useGameProfileStore.getState().setupListeners();

      exitedHandler?.({
        payload: {
          exePath: 'C:\\Games\\test.exe',
          profileId: 'test-profile-1',
          playSecs: 3600,
          revertSuccess: true,
        },
      });

      expect(useGameProfileStore.getState().currentGameExe).toBeNull();
      expect(useGameProfileStore.getState().activeProfileId).toBeNull();
      expect(useGameProfileStore.getState().applyResult).toBeNull();
    });

    it('profile-reverted イベントで activeProfileId がクリアされる', async () => {
      useGameProfileStore.setState({
        activeProfileId: 'test-profile-1',
        applyResult: MOCK_APPLY_RESULT,
      });

      let revertedHandler: ((event: unknown) => void) | undefined;
      vi.mocked(listen).mockImplementation(async (eventName, handler) => {
        if (eventName === 'nexus://profile-reverted') {
          revertedHandler = handler as (event: unknown) => void;
        }
        return () => {};
      });

      await useGameProfileStore.getState().setupListeners();

      revertedHandler?.({ payload: {} });

      expect(useGameProfileStore.getState().activeProfileId).toBeNull();
      expect(useGameProfileStore.getState().applyResult).toBeNull();
    });
  });

  // clearError
  describe('clearError', () => {
    it('error を null にリセットする', () => {
      useGameProfileStore.setState({ error: 'テストエラー' });

      useGameProfileStore.getState().clearError();

      expect(useGameProfileStore.getState().error).toBeNull();
    });
  });
});

// ─── createDefaultProfile ────────────────────────────────────────────────────

describe('createDefaultProfile', () => {
  it('デフォルト値が正しく設定される', () => {
    const profile = createDefaultProfile('テストゲーム', 'C:\\Games\\test.exe');

    expect(profile.displayName).toBe('テストゲーム');
    expect(profile.exePath).toBe('C:\\Games\\test.exe');
    expect(profile.steamAppId).toBeNull();
    expect(profile.boostLevel).toBe('none');
    expect(profile.processPriority).toBe('normal');
    expect(profile.powerPlan).toBe('unchanged');
    expect(profile.processesToSuspend).toEqual([]);
    expect(profile.processesToKill).toEqual([]);
  });

  it('steamAppId が指定された場合にセットされる', () => {
    const profile = createDefaultProfile('テストゲーム', 'test.exe', 12345);
    expect(profile.steamAppId).toBe(12345);
  });
});

// getCpuTopology テスト
describe('getCpuTopology', () => {
  it('CPU トポロジーを取得して state に保存する', async () => {
    const mockTopology = {
      physicalCores: 8,
      logicalCores: 16,
      pCores: [0, 1, 2, 3, 4, 5, 6, 7],
      eCores: [8, 9, 10, 11, 12, 13, 14, 15],
      ccdGroups: [],
      hyperthreadingEnabled: true,
      vendorId: 'GenuineIntel',
      brand: 'Intel Core i7-12700K',
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockTopology);

    await useGameProfileStore.getState().getCpuTopology();

    expect(useGameProfileStore.getState().cpuTopology).toEqual(mockTopology);
    expect(invoke).toHaveBeenCalledWith('get_cpu_topology');
  });

  it('取得エラー時は cpuTopology が null のまま', async () => {
    // 事前に state をクリア
    useGameProfileStore.setState({ cpuTopology: null });
    vi.mocked(invoke).mockRejectedValueOnce(new Error('取得失敗'));

    await useGameProfileStore.getState().getCpuTopology();

    expect(useGameProfileStore.getState().cpuTopology).toBeNull();
    // error は設定されない（致命的ではないため）
    expect(useGameProfileStore.getState().error).toBeNull();
  });
});
