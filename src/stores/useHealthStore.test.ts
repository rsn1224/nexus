import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import type { AppliedAction, HealthScore, Suggestion } from '../types/v2';
import { useHealthStore } from './useHealthStore';

const mockScore: HealthScore = {
  score: 75,
  grade: 'B',
  factors: [],
  warnings: [],
  label: '2つの改善で推定 +25 ポイント',
};

const mockSuggestion: Suggestion = {
  id: 'game-mode',
  priority: 'critical',
  title: 'Game Mode を有効にする',
  reason: 'ゲームのパフォーマンスが向上します',
  impact: '+15',
  category: 'windows_optimization',
  actions: [
    { label: '有効にする', invokeCommand: 'toggle_game_mode', args: {}, isDestructive: false },
  ],
  isApplied: false,
  canRollback: true,
  rollbackAction: {
    label: '無効に戻す',
    invokeCommand: 'toggle_game_mode',
    args: {},
    isDestructive: false,
  },
};

const mockAppliedAction: AppliedAction = {
  id: 'game-mode-1',
  timestamp: 1000,
  label: 'Game Mode を有効にする',
  previousValue: '',
  newValue: 'applied',
  invokeCommand: 'toggle_game_mode',
  rollbackArgs: {},
};

function resetStore(): void {
  useHealthStore.setState({
    healthScore: null,
    suggestions: [],
    appliedActions: [],
    lastInput: null,
    loading: false,
    error: null,
  });
}

describe('useHealthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('starts with empty state', () => {
    const s = useHealthStore.getState();
    expect(s.healthScore).toBeNull();
    expect(s.suggestions).toHaveLength(0);
    expect(s.appliedActions).toHaveLength(0);
    expect(s.error).toBeNull();
  });

  it('recalculate sets healthScore and suggestions from input', () => {
    const input = {
      gameModeEnabled: false,
      powerPlanHighPerf: true,
      timerResolutionLow: true,
      nagleDisabled: true,
      visualEffectsOff: true,
      cpuTemp: 60,
      gpuTemp: 70,
      cpuUsage: 20,
      gpuUsage: 30,
      memUsedGb: 8,
      memTotalGb: 32,
      bottleneckRatio: 0.1,
    };
    useHealthStore.getState().recalculate(input);
    const { healthScore, suggestions } = useHealthStore.getState();
    expect(healthScore).not.toBeNull();
    expect(healthScore?.score).toBe(85);
    expect(suggestions.some((s) => s.id === 'game-mode')).toBe(true);
  });

  it('applySuggestion calls invoke and marks suggestion as applied', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    useHealthStore.setState({ suggestions: [mockSuggestion] });

    await useHealthStore.getState().applySuggestion('game-mode');

    expect(invoke).toHaveBeenCalledWith('toggle_game_mode', {});
    const { suggestions, appliedActions } = useHealthStore.getState();
    expect(suggestions.find((s) => s.id === 'game-mode')?.isApplied).toBe(true);
    expect(appliedActions).toHaveLength(1);
    expect(appliedActions[0].label).toBe('Game Mode を有効にする');
  });

  it('applySuggestion sets error on invoke failure', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Permission denied'));
    useHealthStore.setState({ suggestions: [mockSuggestion] });

    await useHealthStore.getState().applySuggestion('game-mode');

    expect(useHealthStore.getState().error).toBe('Permission denied');
    expect(useHealthStore.getState().appliedActions).toHaveLength(0);
  });

  it('rollbackSuggestion calls rollback invoke and unmarks applied', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(undefined);
    const appliedSuggestion = { ...mockSuggestion, isApplied: true };
    useHealthStore.setState({
      suggestions: [appliedSuggestion],
      appliedActions: [mockAppliedAction],
    });

    await useHealthStore.getState().rollbackSuggestion('game-mode');

    expect(invoke).toHaveBeenCalledWith('toggle_game_mode', {});
    const { suggestions } = useHealthStore.getState();
    expect(suggestions.find((s) => s.id === 'game-mode')?.isApplied).toBe(false);
  });

  it('updateWithAiInsights reorders suggestions by AI priority', () => {
    const s1 = { ...mockSuggestion, id: 'power-plan' };
    const s2 = { ...mockSuggestion, id: 'game-mode' };
    useHealthStore.setState({ healthScore: mockScore, suggestions: [s1, s2] });
    // AI says game-mode should come first
    useHealthStore.getState().updateWithAiInsights(['game-mode', 'power-plan'], []);
    const { suggestions } = useHealthStore.getState();
    expect(suggestions[0].id).toBe('game-mode');
    expect(suggestions[1].id).toBe('power-plan');
  });

  it('updateWithAiInsights appends AI-generated suggestions', () => {
    useHealthStore.setState({ healthScore: mockScore, suggestions: [mockSuggestion] });
    useHealthStore.getState().updateWithAiInsights([], ['AI 追加提案: XMPを有効化してください']);
    const { suggestions } = useHealthStore.getState();
    expect(suggestions.some((s) => s.id.startsWith('ai-insight-'))).toBe(true);
  });

  it('clearError resets error to null', () => {
    useHealthStore.setState({ error: 'some error' });
    useHealthStore.getState().clearError();
    expect(useHealthStore.getState().error).toBeNull();
  });
});
