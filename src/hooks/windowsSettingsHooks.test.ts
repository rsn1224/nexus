import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWindowsSettings } from './windowsSettingsHooks';

vi.mock('../stores/useWindowsSettingsStore', () => {
  const mockStore = vi.fn();
  return { useWindowsSettingsStore: mockStore };
});

import { useWindowsSettingsStore } from '../stores/useWindowsSettingsStore';

const mockStoreState = {
  settings: { powerPlan: 'high', gameMode: true },
  advisorResult: null,
  isLoading: false,
  advisorLoading: false,
  error: null,
  advisorError: null,
  fetchSettings: vi.fn(),
  setPowerPlan: vi.fn(),
  toggleGameMode: vi.fn(),
  toggleFullscreenOptimization: vi.fn(),
  toggleHardwareGpuScheduling: vi.fn(),
  setVisualEffects: vi.fn(),
  fetchAdvisorResult: vi.fn(),
  applyRecommendation: vi.fn(),
  applyAllSafeRecommendations: vi.fn(),
};

describe('useWindowsSettings', () => {
  beforeEach(() => {
    vi.mocked(useWindowsSettingsStore).mockReturnValue(mockStoreState);
  });

  it('設定とアクションを正しい形で返す', () => {
    const { result } = renderHook(() => useWindowsSettings());

    expect(result.current).toEqual(
      expect.objectContaining({
        settings: mockStoreState.settings,
        advisorResult: null,
        isLoading: false,
        advisorLoading: false,
        error: null,
        advisorError: null,
        fetchSettings: expect.any(Function),
        setPowerPlan: expect.any(Function),
        toggleGameMode: expect.any(Function),
        toggleFullscreenOptimization: expect.any(Function),
        toggleHardwareGpuScheduling: expect.any(Function),
        setVisualEffects: expect.any(Function),
        fetchAdvisorResult: expect.any(Function),
        applyRecommendation: expect.any(Function),
        applyAllSafeRecommendations: expect.any(Function),
      }),
    );
  });

  it('ローディング中の状態を正しく返す', () => {
    vi.mocked(useWindowsSettingsStore).mockReturnValue({
      ...mockStoreState,
      isLoading: true,
      advisorLoading: true,
    });

    const { result } = renderHook(() => useWindowsSettings());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.advisorLoading).toBe(true);
  });

  it('エラーがある場合も正しく返す', () => {
    vi.mocked(useWindowsSettingsStore).mockReturnValue({
      ...mockStoreState,
      error: 'settings error',
      advisorError: 'advisor error',
    });

    const { result } = renderHook(() => useWindowsSettings());

    expect(result.current.error).toBe('settings error');
    expect(result.current.advisorError).toBe('advisor error');
  });
});
