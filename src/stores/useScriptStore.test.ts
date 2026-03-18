import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/tauri', () => ({
  extractErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
}));

import { invoke } from '@tauri-apps/api/core';
import type { ExecutionLog, ScriptEntry } from '../types';
import { useScriptStore } from './useScriptStore';

const MOCK_SCRIPT: ScriptEntry = {
  id: 'script-1',
  name: 'Clean Temp',
  path: 'C:\\scripts\\clean.ps1',
  scriptType: 'powershell',
  description: 'Cleans temp files',
  createdAt: 1_700_000_000,
};

const MOCK_LOG: ExecutionLog = {
  id: 'log-1',
  scriptId: 'script-1',
  scriptName: 'Clean Temp',
  startedAt: 1_700_000_000,
  durationMs: 1200,
  exitCode: 0,
  stdout: 'Done',
  stderr: '',
};

function resetStore(): void {
  useScriptStore.setState({
    scripts: [],
    logs: [],
    isLoading: false,
    isRunning: false,
    error: null,
  });
}

describe('useScriptStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { scripts, logs, isLoading, isRunning, error } = useScriptStore.getState();
    expect(scripts).toEqual([]);
    expect(logs).toEqual([]);
    expect(isLoading).toBe(false);
    expect(isRunning).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchScripts stores scripts on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_SCRIPT]);
    await useScriptStore.getState().fetchScripts();
    expect(useScriptStore.getState().scripts).toEqual([MOCK_SCRIPT]);
    expect(invoke).toHaveBeenCalledWith('list_scripts');
    expect(useScriptStore.getState().isLoading).toBe(false);
  });

  it('fetchScripts sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce('fetch failed');
    await useScriptStore.getState().fetchScripts();
    expect(useScriptStore.getState().error).toBe('fetch failed');
    expect(useScriptStore.getState().isLoading).toBe(false);
  });

  it('addScript appends script to list', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_SCRIPT);
    await useScriptStore
      .getState()
      .addScript('Clean Temp', 'C:\\scripts\\clean.ps1', 'powershell', 'Cleans temp files');
    expect(useScriptStore.getState().scripts).toEqual([MOCK_SCRIPT]);
    expect(invoke).toHaveBeenCalledWith(
      'add_script',
      expect.objectContaining({ name: 'Clean Temp' }),
    );
  });

  it('deleteScript removes script from list', async () => {
    useScriptStore.setState({ scripts: [MOCK_SCRIPT] });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useScriptStore.getState().deleteScript('script-1');
    expect(useScriptStore.getState().scripts).toEqual([]);
    expect(invoke).toHaveBeenCalledWith('delete_script', { id: 'script-1' });
  });

  it('runScript prepends log to logs list', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(MOCK_LOG);
    await useScriptStore.getState().runScript('script-1');
    expect(useScriptStore.getState().logs[0]).toEqual(MOCK_LOG);
    expect(useScriptStore.getState().isRunning).toBe(false);
    expect(invoke).toHaveBeenCalledWith('run_script', { id: 'script-1' });
  });

  it('runScript does not run when already running', async () => {
    useScriptStore.setState({ isRunning: true });
    await useScriptStore.getState().runScript('script-1');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('fetchLogs stores logs on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_LOG]);
    await useScriptStore.getState().fetchLogs();
    expect(useScriptStore.getState().logs).toEqual([MOCK_LOG]);
    expect(invoke).toHaveBeenCalledWith('get_execution_logs');
  });

  it('clearLogs clears logs list', async () => {
    useScriptStore.setState({ logs: [MOCK_LOG] });
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    await useScriptStore.getState().clearLogs();
    expect(useScriptStore.getState().logs).toEqual([]);
    expect(invoke).toHaveBeenCalledWith('clear_execution_logs');
  });
});
