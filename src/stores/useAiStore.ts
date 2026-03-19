import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type { AiAnalysisRequest } from '../types/v2';
import type { AiStore } from './types/aiStore';

// =============================================================================
// useAiStore — AI レイヤー管理（ADR-004 Graceful Degradation）
// =============================================================================

export const useAiStore = create<AiStore>((set, get) => ({
  activeLayer: 'rules',
  hasApiKey: false,
  lastAnalysis: null,
  analyzing: false,
  error: null,
  lastAnalyzedAt: null,

  detectLayer: async (): Promise<void> => {
    try {
      const hasKey = await invoke<boolean>('test_api_key');
      const layer = hasKey ? 'ai' : 'rules';
      log.info({ layer, hasKey }, 'ai: layer detected');
      set({ hasApiKey: hasKey, activeLayer: layer, error: null });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'ai: detectLayer failed (fallback to static): %s', msg);
      set({ hasApiKey: false, activeLayer: 'static', error: msg });
    }
  },

  analyze: async (): Promise<void> => {
    const { activeLayer } = get();
    if (activeLayer !== 'ai') {
      log.info({ activeLayer }, 'ai: analyze skipped — not in ai layer');
      return;
    }

    set({ analyzing: true, error: null });
    try {
      const { useHealthStore } = await import('./useHealthStore');
      const { healthScore, suggestions, lastInput } = useHealthStore.getState();
      if (!healthScore || !lastInput) {
        set({ analyzing: false });
        return;
      }

      const request: AiAnalysisRequest = {
        healthScore,
        systemInfo: {
          cpuName: 'Unknown',
          gpuName: null,
          memTotalGb: lastInput.memTotalGb,
          osVersion: 'Windows',
        },
        currentSuggestions: suggestions,
      };

      const response = await invoke<{
        summary: string;
        additional_insights: string[];
        priority_order: string[];
      }>('analyze_bottleneck_ai', { request });

      const analysis = {
        summary: response.summary,
        additionalInsights: response.additional_insights,
        priorityOrder: response.priority_order,
      };

      log.info({ summary: analysis.summary }, 'ai: analysis complete');

      useHealthStore
        .getState()
        .updateWithAiInsights(analysis.priorityOrder, analysis.additionalInsights);

      set({
        analyzing: false,
        lastAnalysis: analysis,
        lastAnalyzedAt: Date.now(),
        error: null,
      });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'ai: analyze failed: %s', msg);
      set({ analyzing: false, activeLayer: 'rules', error: msg });
    }
  },

  testApiKey: async (): Promise<boolean> => {
    set({ error: null });
    try {
      const result = await invoke<boolean>('test_api_key');
      log.info({ result }, 'ai: testApiKey');
      set({
        hasApiKey: result,
        activeLayer: result ? 'ai' : 'rules',
      });
      return result;
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'ai: testApiKey failed: %s', msg);
      set({ hasApiKey: false, activeLayer: 'rules', error: msg });
      return false;
    }
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

// ─── useShallow セレクタ ───────────────────────────────────────────────────

export const useAiState = () =>
  useAiStore(
    useShallow((s) => ({
      activeLayer: s.activeLayer,
      hasApiKey: s.hasApiKey,
      lastAnalysis: s.lastAnalysis,
      analyzing: s.analyzing,
      error: s.error,
      lastAnalyzedAt: s.lastAnalyzedAt,
    })),
  );

export const useAiActions = () =>
  useAiStore(
    useShallow((s) => ({
      detectLayer: s.detectLayer,
      analyze: s.analyze,
      testApiKey: s.testApiKey,
      clearError: s.clearError,
    })),
  );
