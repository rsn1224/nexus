import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

import { invoke } from '@tauri-apps/api/core';
import type { WatchdogRule } from '../types';
import { useWatchdogStore } from './useWatchdogStore';

const MOCK_RULE: WatchdogRule = {
  id: 'rule-1',
  name: 'High CPU Rule',
  enabled: true,
  conditions: [{ metric: 'cpuPercent', operator: 'greaterThan', threshold: 80 }],
  action: { setPriority: { level: 'BelowNormal' } },
  processFilter: { includeNames: ['chrome'], excludeNames: [] },
  profileId: null,
  cooldownSecs: 60,
  lastTriggeredAt: null,
};

const MOCK_EVENT = {
  timestamp: 1_700_000_000,
  ruleId: 'rule-1',
  ruleName: 'High CPU Rule',
  processName: 'chrome',
  pid: 1234,
  actionTaken: 'setPriority',
  metricValue: 85,
  threshold: 80,
  success: true,
  detail: 'priority set to BelowNormal',
};

function resetStore(): void {
  useWatchdogStore.setState({
    rules: [],
    events: [],
    isLoading: false,
    error: null,
  });
}

describe('useWatchdogStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const { rules, events, isLoading, error } = useWatchdogStore.getState();
    expect(rules).toEqual([]);
    expect(events).toEqual([]);
    expect(isLoading).toBe(false);
    expect(error).toBeNull();
  });

  it('fetchRules stores rules on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_RULE]);
    await useWatchdogStore.getState().fetchRules();
    expect(useWatchdogStore.getState().rules).toEqual([MOCK_RULE]);
    expect(invoke).toHaveBeenCalledWith('get_watchdog_rules');
    expect(useWatchdogStore.getState().isLoading).toBe(false);
  });

  it('fetchRules sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('fetch failed'));
    await useWatchdogStore.getState().fetchRules();
    expect(useWatchdogStore.getState().error).toBe('fetch failed');
    expect(useWatchdogStore.getState().isLoading).toBe(false);
  });

  it('addRule calls add_watchdog_rule and refreshes', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce([MOCK_RULE]);
    await useWatchdogStore.getState().addRule(MOCK_RULE);
    expect(invoke).toHaveBeenCalledWith('add_watchdog_rule', { rule: MOCK_RULE });
    expect(useWatchdogStore.getState().rules).toEqual([MOCK_RULE]);
  });

  it('addRule sets error on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('add failed'));
    await useWatchdogStore.getState().addRule(MOCK_RULE);
    expect(useWatchdogStore.getState().error).toBe('add failed');
  });

  it('removeRule calls remove_watchdog_rule and refreshes', async () => {
    useWatchdogStore.setState({ rules: [MOCK_RULE] });
    vi.mocked(invoke).mockResolvedValueOnce(undefined).mockResolvedValueOnce([]);
    await useWatchdogStore.getState().removeRule('rule-1');
    expect(invoke).toHaveBeenCalledWith('remove_watchdog_rule', { ruleId: 'rule-1' });
    expect(useWatchdogStore.getState().rules).toEqual([]);
  });

  it('fetchEvents stores events on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_EVENT]);
    await useWatchdogStore.getState().fetchEvents();
    expect(useWatchdogStore.getState().events).toEqual([MOCK_EVENT]);
    expect(invoke).toHaveBeenCalledWith('get_watchdog_events');
  });

  it('loadPresets returns presets on success', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([MOCK_RULE]);
    const presets = await useWatchdogStore.getState().loadPresets();
    expect(presets).toEqual([MOCK_RULE]);
    expect(invoke).toHaveBeenCalledWith('get_watchdog_presets');
  });

  it('loadPresets returns empty array on failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('presets failed'));
    const presets = await useWatchdogStore.getState().loadPresets();
    expect(presets).toEqual([]);
  });
});
