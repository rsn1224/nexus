import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import type { EcoModeConfig } from '../types';
import { useEcoModeStore } from './useEcoModeStore';

const MOCK_CONFIG: EcoModeConfig = {
  enabled: false,
  targetFps: 60,
  ecoPowerPlan: 'balanced',
  electricityRateYen: 27,
};

const MOCK_POWER_ESTIMATE = {
  cpuPowerW: 45,
  gpuPowerW: 80,
  gpuActualPowerW: null,
  totalEstimatedW: 125,
  timestamp: 1_700_000_000,
};

const MOCK_COST_ESTIMATE = {
  normalMonthlyYen: 2000,
  ecoMonthlyYen: 1400,
  savingsYen: 600,
};

function resetStore(): void {
  useEcoModeStore.setState({
    config: null,
    powerEstimate: null,
    costEstimate: null,
    isLoading: false,
    error: null,
  });
}

describe('useEcoModeStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { config, powerEstimate, isLoading, error } = useEcoModeStore.getState();
    expect(config).toBeNull();
    expect(powerEstimate).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchConfig stores config on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_CONFIG);
    await useEcoModeStore.getState().fetchConfig();
    expect(useEcoModeStore.getState().config).toEqual(MOCK_CONFIG);
    expect(invoke).toHaveBeenCalledWith('get_eco_mode_config');
    expect(useEcoModeStore.getState().isLoading).toBe(false);
  });

  it('fetchConfig sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('config error'));
    await useEcoModeStore.getState().fetchConfig();
    expect(useEcoModeStore.getState().error).toBe('config error');
    expect(useEcoModeStore.getState().isLoading).toBe(false);
  });

  it('saveConfig updates config on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useEcoModeStore.getState().saveConfig(MOCK_CONFIG);
    expect(useEcoModeStore.getState().config).toEqual(MOCK_CONFIG);
    expect(invoke).toHaveBeenCalledWith('save_eco_mode_config', { config: MOCK_CONFIG });
  });

  it('toggleEcoMode sets error when no config', async () => {
    await useEcoModeStore.getState().toggleEcoMode(true);
    expect(useEcoModeStore.getState().error).toBe('No config available');
  });

  it('toggleEcoMode updates config.enabled when config exists', async () => {
    useEcoModeStore.setState({ config: MOCK_CONFIG });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useEcoModeStore.getState().toggleEcoMode(true);
    expect(useEcoModeStore.getState().config?.enabled).toBe(true);
    expect(invoke).toHaveBeenCalledWith('set_eco_mode', { enabled: true, config: MOCK_CONFIG });
  });

  it('fetchPowerEstimate stores estimate on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_POWER_ESTIMATE);
    await useEcoModeStore.getState().fetchPowerEstimate();
    expect(useEcoModeStore.getState().powerEstimate).toEqual(MOCK_POWER_ESTIMATE);
    expect(invoke).toHaveBeenCalledWith('get_power_estimate');
  });

  it('fetchCostEstimate sets error when no config', async () => {
    await useEcoModeStore.getState().fetchCostEstimate(8);
    expect(useEcoModeStore.getState().error).toBe('No config available for cost estimation');
  });

  it('fetchCostEstimate stores estimate when config exists', async () => {
    useEcoModeStore.setState({ config: MOCK_CONFIG });
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_COST_ESTIMATE);
    await useEcoModeStore.getState().fetchCostEstimate(8);
    expect(useEcoModeStore.getState().costEstimate).toEqual(MOCK_COST_ESTIMATE);
  });

  it('updateConfig merges updates into existing config', () => {
    useEcoModeStore.setState({ config: MOCK_CONFIG });
    useEcoModeStore.getState().updateConfig({ enabled: true });
    expect(useEcoModeStore.getState().config?.enabled).toBe(true);
    expect(useEcoModeStore.getState().config?.targetFps).toBe(60);
  });

  it('updateConfig does nothing when config is null', () => {
    useEcoModeStore.getState().updateConfig({ enabled: true });
    expect(useEcoModeStore.getState().config).toBeNull();
  });
});
