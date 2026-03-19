import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameProfileActions, useGameProfileState } from './gameProfileHooks';

vi.mock('../stores/useGameProfileStore', () => {
  const mockStore = vi.fn();
  return { useGameProfileStore: mockStore };
});

import { useGameProfileStore } from '../stores/useGameProfileStore';

const mockState = {
  profiles: [{ id: '1', name: 'test' }],
  activeProfileId: '1',
  currentGameExe: 'game.exe',
  applyResult: null,
  isLoading: false,
  isApplying: false,
  error: null,
  isMonitoring: true,
  cpuTopology: null,
  coreParkingState: null,
};

const mockActions = {
  loadProfiles: vi.fn(),
  saveProfile: vi.fn(),
  deleteProfile: vi.fn(),
  applyProfile: vi.fn(),
  revertProfile: vi.fn(),
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  setupListeners: vi.fn(),
  getCpuTopology: vi.fn(),
  fetchCoreParking: vi.fn(),
  applyCoreParking: vi.fn(),
  exportProfile: vi.fn(),
  importProfile: vi.fn(),
  clearError: vi.fn(),
};

describe('useGameProfileState', () => {
  beforeEach(() => {
    vi.mocked(useGameProfileStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockState) => unknown)(mockState);
      }
      return mockState;
    });
  });

  it('プロファイル状態を正しい形で返す', () => {
    const { result } = renderHook(() => useGameProfileState());

    expect(result.current).toEqual(
      expect.objectContaining({
        profiles: mockState.profiles,
        activeProfileId: '1',
        currentGameExe: 'game.exe',
        isLoading: false,
        isApplying: false,
        error: null,
        isMonitoring: true,
      }),
    );
  });
});

describe('useGameProfileActions', () => {
  beforeEach(() => {
    vi.mocked(useGameProfileStore).mockImplementation((selector: unknown) => {
      if (typeof selector === 'function') {
        return (selector as (s: typeof mockActions) => unknown)(mockActions);
      }
      return mockActions;
    });
  });

  it('アクション関数を正しい形で返す', () => {
    const { result } = renderHook(() => useGameProfileActions());

    expect(result.current).toEqual(
      expect.objectContaining({
        loadProfiles: expect.any(Function),
        saveProfile: expect.any(Function),
        deleteProfile: expect.any(Function),
        applyProfile: expect.any(Function),
        revertProfile: expect.any(Function),
        startMonitoring: expect.any(Function),
        stopMonitoring: expect.any(Function),
        clearError: expect.any(Function),
      }),
    );
  });
});
