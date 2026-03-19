// =============================================================================
// NEXUS v2 — 型定義（Single Source of Truth）
// =============================================================================

// -----------------------------------------------------------------------------
// Wing ID
// -----------------------------------------------------------------------------

export type WingId = 'core' | 'arsenal' | 'tactics' | 'logs' | 'settings';

// -----------------------------------------------------------------------------
// System Health Score (ADR-003)
// -----------------------------------------------------------------------------

/** healthScore.ts の入力 — pulse / hardware / windows_settings から収集 */
export type HealthInput = {
  // ハードウェア状態
  cpuUsage: number; // 0-100
  gpuUsage: number; // 0-100
  cpuTemp: number | null; // ℃
  gpuTemp: number | null; // ℃
  memUsedGb: number;
  memTotalGb: number;

  // 最適化状態（windows_settings から取得）
  gameModeEnabled: boolean;
  powerPlanHighPerf: boolean;
  timerResolutionLow: boolean; // 0.5ms 適用済み
  nagleDisabled: boolean;
  visualEffectsOff: boolean;

  // ボトルネック（bottleneck コマンド由来）
  bottleneckRatio: number; // 0-1
};

export type HealthFactorStatus = 'optimal' | 'suboptimal' | 'critical';

export type HealthFactor = {
  name: string; // 例: "Game Mode"
  points: number; // 獲得ポイント
  maxPoints: number; // 最大ポイント
  status: HealthFactorStatus;
};

export type HealthGrade = 'S' | 'A' | 'B' | 'C' | 'D';

export type HealthScore = {
  score: number; // 0-100
  grade: HealthGrade;
  factors: HealthFactor[];
  warnings: string[];
  label: string; // "3つの最適化で推定+28ポイント"
};

// -----------------------------------------------------------------------------
// Suggestion System (ADR-006)
// -----------------------------------------------------------------------------

export type SuggestionPriority = 'critical' | 'recommended' | 'info';

export type SuggestionCategory =
  | 'windows_optimization'
  | 'network_optimization'
  | 'process_optimization'
  | 'memory_optimization'
  | 'timer_optimization'
  | 'thermal_warning';

export type SuggestionAction = {
  label: string;
  invokeCommand: string;
  args: Record<string, unknown>;
  isDestructive: boolean;
};

export type Suggestion = {
  id: string;
  priority: SuggestionPriority;
  title: string;
  reason: string;
  impact: string; // "+15 Health Points"
  category: SuggestionCategory;
  actions: SuggestionAction[];
  isApplied: boolean;
  canRollback: boolean;
  rollbackAction: SuggestionAction | null;
};

// -----------------------------------------------------------------------------
// Optimize Preset
// -----------------------------------------------------------------------------

export type OptimizePreset = 'gaming' | 'powerSave' | 'streaming';

export type OptimizeStepRisk = 'safe' | 'medium' | 'high';

export type OptimizeStep = {
  id: string;
  label: string;
  invokeCommand: string;
  args: Record<string, unknown>;
  risk: OptimizeStepRisk;
  defaultEnabled: boolean;
};

export type OptimizeResult = {
  preset: OptimizePreset;
  appliedSteps: string[];
  timestamp: number; // Unix ms
  rollbackMap: Record<string, Record<string, unknown>>;
};

// -----------------------------------------------------------------------------
// Applied Action History（セッション中のみ保持、永続化しない — ADR-003）
// -----------------------------------------------------------------------------

export type AppliedAction = {
  id: string;
  timestamp: number; // Unix ms
  label: string;
  previousValue: string;
  newValue: string;
  invokeCommand: string;
  rollbackArgs: Record<string, unknown>;
};

// -----------------------------------------------------------------------------
// Monitor Data (ADR-007 — pulse 500ms interval)
// -----------------------------------------------------------------------------

export type MonitorCpu = {
  usage: number; // %
  temperature: number | null; // ℃
  clock: number; // MHz
  coreCount: number;
};

export type MonitorGpu = {
  usage: number; // %
  temperature: number | null; // ℃
  clock: number; // MHz
  vramUsedMb: number;
  vramTotalMb: number;
};

export type MonitorMemory = {
  usedMb: number;
  totalMb: number;
  usage: number; // %
};

export type MonitorFps = {
  current: number;
  avg: number;
  low1: number; // 1% Low
  frametime: number; // ms
};

export type MonitorSample = {
  timestamp: number; // Unix ms
  cpu: MonitorCpu;
  gpu: MonitorGpu;
  memory: MonitorMemory;
  fps: MonitorFps;
};

// -----------------------------------------------------------------------------
// Session / History
// -----------------------------------------------------------------------------

export type SessionSummary = {
  avgFps: number;
  pct1Low: number;
  pct01Low: number;
  totalStutterCount: number;
  maxFrameTimeMs: number;
  minFps: number;
  totalFrames: number;
};

export type GameSession = {
  id: string;
  gameName: string;
  startedAt: string; // ISO 8601
  endedAt: string | null;
  durationMinutes: number;
  healthScoreStart: number;
  healthScoreEnd: number;
  optimizationsApplied: string[]; // Suggestion IDs
  summary: SessionSummary;
  avgCpuTemp: number | null;
  avgGpuTemp: number | null;
  note: string;
};

export type SessionListItem = {
  id: string;
  gameName: string;
  startedAt: string;
  endedAt: string | null;
  summary: SessionSummary;
};

// -----------------------------------------------------------------------------
// Gaming Wing — Sections
// -----------------------------------------------------------------------------

export type GamingSection =
  | 'optimize_all'
  | 'windows'
  | 'process'
  | 'network'
  | 'memory'
  | 'timer'
  | 'cpu';

export type OptimizeAllConfig = {
  windows: boolean;
  process: boolean;
  network: boolean;
  memory: boolean;
  timer: boolean;
  cpu: boolean;
};

// -----------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------

export type V2AppSettings = {
  perplexityApiKey: string;
  aiEnabled: boolean;
  pulseIntervalMs: number; // default 500
  autoStartMonitor: boolean;
  startWithWindows: boolean;
  minimizeToTray: boolean;
  language: 'ja' | 'en';
  accentColor: string; // default #06B6D4
};

// -----------------------------------------------------------------------------
// AI Analysis (Perplexity Sonar — ADR-004 Graceful Degradation)
// -----------------------------------------------------------------------------

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
  priorityOrder: string[]; // Suggestion IDs
};

// -----------------------------------------------------------------------------
// Existing Rust command return types (re-exported for convenience)
// 既存の types/ から import して使うもの。v2 固有ではないが参照用に列挙。
// -----------------------------------------------------------------------------

// hardware.ts: HardwareInfo, DiskInfo, CpuTopology, CoreParkingState, ThermalAlert, CurrentPowerPlan
// network.ts:  NetworkAdapter, DnsPreset, PingResult, TcpTuningState, NetworkQualitySnapshot
// settings.ts: AppSettings, WindowsSettings, PowerPlan, VisualEffects, WinSetting
// session.ts:  SavedFrameTimeSession, SessionComparisonResult
// process.ts:  SystemProcess, AiSuggestion
