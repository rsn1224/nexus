import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { PowerPlan, VisualEffects } from '../types';
import { useWindowsSettingsStore } from './useWindowsSettingsStore';

const MOCK_SETTINGS = {
  powerPlan: PowerPlan.Balanced,
  gameMode: true,
  fullscreenOptimization: true,
  hardwareGpuScheduling: false,
  visualEffects: VisualEffects.Balanced,
};

const MOCK_ADVISOR = {
  recommendations: [],
  score: 85,
};

function resetStore(): void {
  useWindowsSettingsStore.setState({
    settings: null,
    advisorResult: null,
    isLoading: false,
    advisorLoading: false,
    error: null,
    advisorError: null,
    lastUpdated: null,
  });
}

describe('useWindowsSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { settings, isLoading, error } = useWindowsSettingsStore.getState();
    expect(settings).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchSettings stores result on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SETTINGS);
    await useWindowsSettingsStore.getState().fetchSettings();
    expect(useWindowsSettingsStore.getState().settings).toEqual(MOCK_SETTINGS);
    expect(useWindowsSettingsStore.getState().error).toBeNull();
  });

  it('fetchSettings falls back to defaults and sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('registry error'));
    await useWindowsSettingsStore.getState().fetchSettings();
    expect(useWindowsSettingsStore.getState().error).toBe('registry error');
    expect(useWindowsSettingsStore.getState().settings).not.toBeNull();
  });

  it('fetchAdvisorResult stores result on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_ADVISOR);
    await useWindowsSettingsStore.getState().fetchAdvisorResult();
    expect(useWindowsSettingsStore.getState().advisorResult).toEqual(MOCK_ADVISOR);
    expect(useWindowsSettingsStore.getState().advisorLoading).toBe(false);
  });

  it('fetchAdvisorResult sets advisorError on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('advisor error'));
    await useWindowsSettingsStore.getState().fetchAdvisorResult();
    expect(useWindowsSettingsStore.getState().advisorError).toBe('advisor error');
    expect(useWindowsSettingsStore.getState().advisorLoading).toBe(false);
  });

  it('setPowerPlan calls set_power_plan command', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce(MOCK_SETTINGS);
    await useWindowsSettingsStore.getState().setPowerPlan(PowerPlan.HighPerformance);
    expect(invoke).toHaveBeenCalledWith('set_power_plan', { plan: PowerPlan.HighPerformance });
  });

  it('clearError resets error state', () => {
    useWindowsSettingsStore.setState({ error: 'test error' });
    useWindowsSettingsStore.getState().clearError();
    expect(useWindowsSettingsStore.getState().error).toBeNull();
  });

  it('clearAdvisorError resets advisorError state', () => {
    useWindowsSettingsStore.setState({ advisorError: 'advisor error' });
    useWindowsSettingsStore.getState().clearAdvisorError();
    expect(useWindowsSettingsStore.getState().advisorError).toBeNull();
  });
});
