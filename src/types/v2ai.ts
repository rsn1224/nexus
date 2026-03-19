// ─── AI Analysis types (ADR-004) ─────────────────────────────────────────────
import type { HealthScore } from './v2health';
import type { Suggestion } from './v2suggest';

export type V2AppSettings = {
  perplexityApiKey: string;
  aiEnabled: boolean;
  pulseIntervalMs: number;
  autoStartMonitor: boolean;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  language: 'ja' | 'en';
  accentColor: string;
};

export type AiLayer = 'ai' | 'rules' | 'static';

export type AiAnalysisRequest = {
  healthScore: HealthScore;
  systemInfo: {
    cpuName: string;
    gpuName: string | null;
    memTotalGb: number;
    osVersion: string;
  };
  currentSuggestions: Suggestion[];
};

export type AiAnalysisResponse = {
  summary: string;
  additionalInsights: string[];
  priorityOrder: string[];
};
