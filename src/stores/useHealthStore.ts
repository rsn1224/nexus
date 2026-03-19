import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { calcHealthScore } from '../lib/healthScore';
import log from '../lib/logger';
import { generateSuggestions } from '../lib/suggestionEngine';
import { extractErrorMessage } from '../lib/tauri';
import type { AppliedAction, HealthInput } from '../types/v2';
import type { HealthStore } from './types/healthStore';

// =============================================================================
// useHealthStore — DASHBOARD の中核ストア（ADR-003）
// =============================================================================

export const useHealthStore = create<HealthStore>((set, get) => ({
  healthScore: null,
  suggestions: [],
  appliedActions: [],
  lastInput: null,
  loading: false,
  error: null,

  recalculate: (input: HealthInput): void => {
    const healthScore = calcHealthScore(input);
    const suggestions = generateSuggestions(input);
    log.info({ score: healthScore.score, grade: healthScore.grade }, 'health: recalculated');
    set({ healthScore, suggestions, lastInput: input, error: null });
  },

  applySuggestion: async (suggestionId: string): Promise<void> => {
    const { suggestions } = get();
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion || suggestion.actions.length === 0) return;

    set({ loading: true, error: null });
    try {
      for (const act of suggestion.actions) {
        await invoke(act.invokeCommand, act.args);
        log.info({ command: act.invokeCommand }, 'health: suggestion applied');
      }

      const appliedAction: AppliedAction = {
        id: `${suggestionId}-${Date.now()}`,
        timestamp: Date.now(),
        label: suggestion.title,
        previousValue: '',
        newValue: 'applied',
        invokeCommand: suggestion.actions[0]?.invokeCommand ?? '',
        rollbackArgs: suggestion.rollbackAction?.args ?? {},
      };

      set((state) => ({
        loading: false,
        appliedActions: [...state.appliedActions, appliedAction],
        suggestions: state.suggestions.map((s) =>
          s.id === suggestionId ? { ...s, isApplied: true } : s,
        ),
      }));
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'health: applySuggestion failed: %s', msg);
      set({ loading: false, error: msg });
    }
  },

  rollbackSuggestion: async (suggestionId: string): Promise<void> => {
    const { suggestions } = get();
    const suggestion = suggestions.find((s) => s.id === suggestionId);
    if (!suggestion?.canRollback || !suggestion.rollbackAction) return;

    set({ loading: true, error: null });
    try {
      const { rollbackAction } = suggestion;
      await invoke(rollbackAction.invokeCommand, rollbackAction.args);
      log.info({ command: rollbackAction.invokeCommand }, 'health: suggestion rolled back');

      set((state) => ({
        loading: false,
        suggestions: state.suggestions.map((s) =>
          s.id === suggestionId ? { ...s, isApplied: false } : s,
        ),
      }));
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'health: rollbackSuggestion failed: %s', msg);
      set({ loading: false, error: msg });
    }
  },

  updateWithAiInsights: (priorityOrder: string[], additionalInsights: string[]): void => {
    log.info(
      { count: priorityOrder.length, insights: additionalInsights.length },
      'health: AI insights applied',
    );
    set((state) => {
      const orderMap = new Map(priorityOrder.map((id, i) => [id, i]));
      const reordered = [...state.suggestions].sort((a, b) => {
        const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return ai - bi;
      });

      const aiSuggestions = additionalInsights.map((insight, i): (typeof state.suggestions)[0] => ({
        id: `ai-insight-${i}`,
        priority: 'info' as const,
        title: insight,
        reason: 'AI 分析による追加提案',
        impact: '可変',
        category: 'process_optimization' as const,
        actions: [],
        isApplied: false,
        canRollback: false,
        rollbackAction: null,
      }));

      return { suggestions: [...reordered, ...aiSuggestions] };
    });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

// ─── useShallow セレクタ ───────────────────────────────────────────────────

export const useHealthState = () =>
  useHealthStore(
    useShallow((s) => ({
      healthScore: s.healthScore,
      suggestions: s.suggestions,
      appliedActions: s.appliedActions,
      loading: s.loading,
      error: s.error,
    })),
  );

export const useHealthActions = () =>
  useHealthStore(
    useShallow((s) => ({
      recalculate: s.recalculate,
      applySuggestion: s.applySuggestion,
      rollbackSuggestion: s.rollbackSuggestion,
      updateWithAiInsights: s.updateWithAiInsights,
      clearError: s.clearError,
    })),
  );
