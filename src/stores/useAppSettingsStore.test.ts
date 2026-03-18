import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../types';
import { useAppSettingsStore } from './useAppSettingsStore';

const MOCK_SETTINGS: AppSettings = {
  perplexityApiKey: 'test-api-key',
  startWithWindows: false,
  minimizeToTray: true,
};

function resetStore(): void {
  useAppSettingsStore.setState({
    settings: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });
}

describe('useAppSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { settings, isLoading, error } = useAppSettingsStore.getState();
    expect(settings).toBeNull();
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchSettings stores settings on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SETTINGS);
    await useAppSettingsStore.getState().fetchSettings();
    expect(useAppSettingsStore.getState().settings).toEqual(MOCK_SETTINGS);
    expect(invoke).toHaveBeenCalledWith('get_app_settings');
    expect(useAppSettingsStore.getState().isLoading).toBe(false);
  });

  it('fetchSettings falls back to defaults and sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('settings error'));
    await useAppSettingsStore.getState().fetchSettings();
    expect(useAppSettingsStore.getState().error).toBe('settings error');
    expect(useAppSettingsStore.getState().settings).not.toBeNull();
    expect(useAppSettingsStore.getState().isLoading).toBe(false);
  });

  it('saveSettings updates settings on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useAppSettingsStore.getState().saveSettings(MOCK_SETTINGS);
    expect(useAppSettingsStore.getState().settings).toEqual(MOCK_SETTINGS);
    expect(invoke).toHaveBeenCalledWith('save_app_settings', { settings: MOCK_SETTINGS });
    expect(useAppSettingsStore.getState().lastUpdated).not.toBeNull();
  });

  it('saveSettings sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('save error'));
    await useAppSettingsStore.getState().saveSettings(MOCK_SETTINGS);
    expect(useAppSettingsStore.getState().error).toBe('save error');
  });

  it('updateSettings merges partial updates with current settings', async () => {
    useAppSettingsStore.setState({ settings: MOCK_SETTINGS });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useAppSettingsStore.getState().updateSettings({ startWithWindows: true });
    expect(useAppSettingsStore.getState().settings?.startWithWindows).toBe(true);
    expect(useAppSettingsStore.getState().settings?.minimizeToTray).toBe(true);
  });

  it('clearError resets error state', () => {
    useAppSettingsStore.setState({ error: 'some error' });
    useAppSettingsStore.getState().clearError();
    expect(useAppSettingsStore.getState().error).toBeNull();
  });
});
