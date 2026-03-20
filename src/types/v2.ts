// =============================================================================
// NEXUS v2 — 型定義バレル（Single Source of Truth）
// 各ドメイン別ファイルから re-export する。直接 import 先を変える必要なし。
// =============================================================================

export type WingId = 'core' | 'arsenal' | 'tactics' | 'logs' | 'settings';

export type {
  AiAnalysisRequest,
  AiAnalysisResponse,
  AiLayer,
  V2AppSettings,
} from './v2ai';
export type {
  HealthFactor,
  HealthFactorStatus,
  HealthGrade,
  HealthInput,
  HealthScore,
} from './v2health';
export type {
  MonitorCpu,
  MonitorFps,
  MonitorGpu,
  MonitorMemory,
  MonitorSample,
} from './v2monitor';
export type {
  AppliedAction,
  GamingSection,
  OptimizeAllConfig,
  OptimizePreset,
  OptimizeResult,
  OptimizeStep,
  OptimizeStepRisk,
} from './v2optimize';

export type {
  GameSession,
  SessionListItem,
  SessionSummary,
} from './v2session';
export type {
  Suggestion,
  SuggestionAction,
  SuggestionCategory,
  SuggestionPriority,
} from './v2suggest';
