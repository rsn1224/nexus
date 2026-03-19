// ─── BOOST ────────────────────────────────────────────────────────────────
export interface BoostAction {
  label: string;
  actionType: 'set_priority' | 'skipped' | 'skipped_protected';
  success: boolean;
  detail: string;
  isProtected: boolean;
}

export interface BoostResult {
  actions: BoostAction[];
  durationMs: number;
  scoreDelta: number;
  isSimulation: boolean;
}

// ─── SCRIPT ────────────────────────────────────────────────────────────────
export interface ScriptEntry {
  id: string;
  name: string;
  path: string;
  scriptType: 'powershell' | 'python';
  description: string;
  createdAt: number;
}

export interface ExecutionLog {
  id: string;
  scriptId: string;
  scriptName: string;
  startedAt: number;
  durationMs: number;
  exitCode: number;
  stdout: string;
  stderr: string;
}

// ─── WING IDs ────────────────────────────────────────────────────────────────
export type WingId =
  | 'home'
  | 'performance' // 旧 'boost'
  | 'games' // 旧 'launcher'
  | 'settings'
  | 'hardware'
  | 'log'
  | 'network' // 旧 'netopt'
  | 'storage';

// ─── STORAGE ─────────────────────────────────────────────────────────────────
export interface DriveInfo {
  name: string;
  totalGb: number;
  freeGb: number;
  usedPercent: number;
}

// ─── HARDWARE ────────────────────────────────────────────────────────────────
export interface HardwareInfo {
  cpuName: string;
  cpuCores: number;
  cpuThreads: number;
  cpuBaseGhz: number;
  cpuTempC: number | null;
  memTotalGb: number;
  memUsedGb: number;
  osName: string;
  osVersion: string;
  hostname: string;
  uptimeSecs: number;
  bootTimeUnix: number;
  disks: DiskInfo[];
  gpuName: string | null;
  gpuVramTotalMb: number | null;
  gpuVramUsedMb: number | null;
  gpuTempC: number | null;
  gpuUsagePercent: number | null;
}

export interface DiskInfo {
  mount: string;
  kind: string;
  totalGb: number;
  usedGb: number;
}

// ─── WINDOWS SETTINGS ────────────────────────────────────────────────────────
export interface WindowsSettings {
  powerPlan: PowerPlan;
  gameMode: boolean;
  fullscreenOptimization: boolean;
  hardwareGpuScheduling: boolean;
  visualEffects: VisualEffects;
}

export enum PowerPlan {
  Balanced = 'Balanced',
  HighPerformance = 'High Performance',
  PowerSaver = 'Power Saver',
}

export enum VisualEffects {
  BestPerformance = 'Best Performance',
  Balanced = 'Balanced',
  BestAppearance = 'Best Appearance',
}

export interface WingStatus {
  id: WingId;
  label: string;
  online: boolean;
}

// ─── APP SETTINGS ────────────────────────────────────────────────────────
export interface AppSettings {
  perplexityApiKey: string;
  startWithWindows: boolean;
  minimizeToTray: boolean;
}

// ─── NETOPT ────────────────────────────────────────────────────────────────
export interface NetworkAdapter {
  name: string;
  ip: string;
  mac: string;
  isConnected: boolean;
}

export interface DnsPreset {
  name: string;
  primary: string;
  secondary: string;
}

export interface PingResult {
  target: string;
  latencyMs: number | null;
  success: boolean;
}

// ─── SETTINGS ADVISOR (ε-1) ───────────────────────────────────────────────────

export interface SettingRecommendation {
  settingId: string;
  label: string;
  recommendedValue: RecommendedValue;
  currentValue: string;
  reason: string;
  importance: 'high' | 'medium' | 'low';
  safetyLevel: 'safe' | 'moderate' | 'advanced';
  isOptimal: boolean;
}

export type RecommendedValue = { boolean: boolean } | { string: string } | { enum: string };

export interface AdvisorResult {
  recommendations: SettingRecommendation[];
  optimizationScore: number;
  hardwareSummary: string;
  warnings: string[];
}

export interface WindowsSettingsSnapshot {
  gameMode: boolean;
  hags: boolean;
  fullscreenOptimization: boolean;
  visualEffects: string;
  powerPlan: string;
  memoryIntegrity: boolean;
}

// ─── POWER ESTIMATOR (ε-2) ───────────────────────────────────────────────────

export interface PowerEstimate {
  cpuPowerW: number;
  gpuPowerW: number;
  gpuActualPowerW: number | null;
  totalEstimatedW: number;
  cpuTdpW: number;
  gpuTdpW: number;
  timestamp: number;
}

export interface EcoModeConfig {
  enabled: boolean;
  targetFps: number;
  ecoPowerPlan: string;
  electricityRateYen: number;
}

export interface MonthlyCostEstimate {
  normalMonthlyYen: number;
  ecoMonthlyYen: number;
  savingsYen: number;
  assumedHoursPerDay: number;
}

// ─── STORAGE ────────────────────────────────────────────────────────────────
export interface DiskDrive {
  name: string;
  model: string;
  sizeBytes: number;
  usedBytes: number;
  availableBytes: number;
  fileSystem: string;
  mountPoint: string;
  isRemovable: boolean;
  healthStatus: 'Good' | 'Warning' | 'Critical';
}

export interface StorageInfo {
  drives: DiskDrive[];
  totalSizeBytes: number;
  totalUsedBytes: number;
  totalAvailableBytes: number;
}

export interface CleanupResult {
  tempFilesCleaned: number;
  recycleBinCleaned: number;
  systemCacheCleaned: number;
  totalFreedBytes: number;
}

// ─── LOG ────────────────────────────────────────────────────────────────────

export type LogLevel = 'Debug' | 'Info' | 'Warn' | 'Error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  processId?: number;
  threadId?: number;
}

export interface LogAnalysis {
  totalEntries: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  debugCount: number;
  timeRange: string;
  topSources: [string, number][];
}

// ─── INTEL FEED ──────────────────────────────────────────────────────────────
export type FeedLevel = 'info' | 'warn' | 'critical' | 'ok';

export interface FeedEntry {
  id: string;
  level: FeedLevel;
  wing: WingId;
  message: string;
  timestamp: number;
}

// ─── RECON ────────────────────────────────────────────────────────────────────
export interface NetworkDevice {
  ip: string;
  mac: string;
  hostname: string;
  vendor: string;
  status: 'known' | 'unknown' | 'suspicious';
  lastSeen: number;
}

export interface TrafficSnapshot {
  bytesSent: number;
  bytesRecv: number;
  timestamp: number;
}

// ─── LAUNCHER ────────────────────────────────────────────────────────────────
export interface GameInfo {
  app_id: number;
  name: string;
  install_path: string;
  size_gb: number;
}

// ─── OPS ─────────────────────────────────────────────────────────────────────

export interface SystemProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memMb: number;
  diskReadKb: number;
  diskWriteKb: number;
  canTerminate: boolean;
}

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionCommand: string | null;
}

// ─── PULSE ───────────────────────────────────────────────────────────────────
export interface ResourceSnapshot {
  timestamp: number;
  cpuPercent: number;
  cpuTempC: number | null;
  memUsedMb: number;
  memTotalMb: number;
  diskReadKb: number;
  diskWriteKb: number;
  netRecvKb: number;
  netSentKb: number;
}

// ─── CHRONO ───────────────────────────────────────────────────────────────────

// ─── LINK ────────────────────────────────────────────────────────────────────

// ─── WINOPT ──────────────────────────────────────────────────────────────────
export interface WinSetting {
  id: string;
  label: string;
  description: string;
  isOptimized: boolean;
  canRevert: boolean;
}

// ─── BEACON ───────────────────────────────────────────────────────────────────

// ─── TOTP ────────────────────────────────────────────────────────────────────

// ─── GAME PROFILE ────────────────────────────────────────────────────────────

export type ProcessPriorityLevel = 'normal' | 'high' | 'realtime' | 'aboveNormal';
export type PowerPlanType = 'unchanged' | 'highPerformance' | 'ultimatePerformance' | 'balanced';
export type BoostLevel = 'none' | 'soft' | 'medium' | 'hard';

export interface GameProfile {
  id: string;
  displayName: string;
  exePath: string;
  steamAppId: number | null;
  cpuAffinityGame: number[] | null;
  cpuAffinityBackground: number[] | null;
  processPriority: ProcessPriorityLevel;
  powerPlan: PowerPlanType;
  processesToSuspend: string[];
  processesToKill: string[];
  autoSuspendEnabled: boolean;
  timerResolution100ns: number | null;
  boostLevel: BoostLevel;
  /** ゲーム中にコアパーキングを無効化するか（全コア稼働 = パフォーマンス優先） */
  coreParkingDisabled: boolean;
  lastPlayed: number | null;
  totalPlaySecs: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileApplyResult {
  profileId: string;
  applied: string[];
  warnings: string[];
  appliedAt: number;
  prevPowerPlan: string | null;
  suspendedPids: number[];
  prevCoreParking: number | null;
}

export interface GameLaunchEvent {
  exePath: string;
  profileId: string | null;
  pid: number;
  detectedAt: number;
}

export interface GameExitEvent {
  exePath: string;
  profileId: string | null;
  playSecs: number;
  revertSuccess: boolean;
  // フレームタイム統計（FrameTimeSession から取得）
  avgFps?: number;
  percentile1Low?: number;
  percentile01Low?: number;
  stutterCount?: number;
}

export interface CpuTopology {
  physicalCores: number;
  logicalCores: number;
  pCores: number[];
  eCores: number[];
  ccdGroups: number[][];
  hyperthreadingEnabled: boolean;
  vendorId: string;
  brand: string;
}

// ─── TIMER RESOLUTION ─────────────────────────────────────────────────────
export interface TimerResolutionState {
  /** 現在のシステムタイマー分解能（100ns 単位） */
  current100ns: number;
  /** nexus が要求した値（null = 未設定） */
  nexusRequested100ns: number | null;
  /** Windows デフォルト値（通常 156250 = 15.625ms） */
  default100ns: number;
  /** 最小分解能 = 最も細かい（通常 5000 = 0.5ms） */
  minimum100ns: number;
  /** 最大分解能 = 最も粗い（通常 156250 = 15.625ms） */
  maximum100ns: number;
}

// ─── FRAME TIME ──────────────────────────────────────────────────────────────

export interface FrameTimeSnapshot {
  pid: number;
  processName: string;
  avgFps: number;
  pct1Low: number;
  pct01Low: number;
  stutterCount: number;
  lastFrameTimeMs: number;
  frameTimes: number[]; // ms, グラフ描画用
  timestamp: number;
}

export type FrameTimeMonitorState =
  | { type: 'stopped' }
  | { type: 'running'; pid: number; processName: string }
  | { type: 'error'; message: string };

// ─── THERMAL ALERT ────────────────────────────────────────────────────────────

export type ThermalAlertLevel = 'Warning' | 'Critical' | 'Normal';

export interface ThermalAlert {
  component: string; // "CPU" or "GPU"
  level: ThermalAlertLevel;
  currentTempC: number;
  thresholdC: number;
  message: string;
  timestamp: number;
}

export interface CurrentPowerPlan {
  name: string;
  guid: string;
}

// ─── CLEANUP ──────────────────────────────────────────────────────────────
export interface RevertItem {
  category: string;
  label: string;
  success: boolean;
  detail: string;
}

// ─── BOTTLENECK ──────────────────────────────────────────────────────────────

export type BottleneckType = 'cpu' | 'gpu' | 'memory' | 'storage' | 'unknown' | 'balanced';
export type BottleneckConfidence = 'high' | 'medium' | 'low';

export interface BottleneckScores {
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
}

export interface BottleneckSuggestion {
  id: string;
  message: string;
  action: string | null;
}

export interface BottleneckResult {
  primary: BottleneckType;
  confidence: BottleneckConfidence;
  scores: BottleneckScores;
  suggestions: BottleneckSuggestion[];
  timestamp: number;
}

// ─── AI BOTTLENECK ──────────────────────────────────────────────────────────

export interface AiRecommendation {
  title: string;
  description: string;
  applicableInNexus: boolean;
  action: string | null;
}

export interface AiBottleneckResponse {
  analysis: string;
  recommendations: AiRecommendation[];
}

// ─── HEALTH CHECK ───────────────────────────────────────────────────────────

export type HealthSeverity = 'ok' | 'warning' | 'critical';

export interface HealthFixAction {
  id: string;
  label: string;
}

export interface HealthCheckItem {
  id: string;
  label: string;
  severity: HealthSeverity;
  message: string;
  fixAction: HealthFixAction | null;
}

export interface HealthCheckResult {
  items: HealthCheckItem[];
  overall: HealthSeverity;
  timestamp: number;
}

export interface HealthCheckInput {
  diskFreeGb: number;
  diskTotalGb: number;
  cpuTempC: number | null;
  gpuTempC: number | null;
  memUsedMb: number;
  memTotalMb: number;
  heavyProcesses: HeavyProcess[];
}

export interface HeavyProcess {
  name: string;
  cpuPercent: number;
  memMb: number;
}

export interface RevertAllResult {
  items: RevertItem[];
  total: number;
  successCount: number;
  failCount: number;
}

export interface SessionSummary {
  avgFps: number;
  pct1Low: number;
  pct01Low: number;
  totalStutterCount: number;
  maxFrameTimeMs: number;
  minFps: number;
  totalFrames: number;
}

export interface FrameTimePercentile {
  percentile: number;
  frameTimeMs: number;
  fps: number;
}

export interface FpsTimelinePoint {
  timestamp: number;
  fps: number;
}

export interface HardwareSnapshot {
  cpuName: string;
  gpuName?: string;
  memTotalGb: number;
  osVersion: string;
}

export interface SavedFrameTimeSession {
  id: string;
  profileId?: string;
  gameName: string;
  startedAt: number;
  endedAt: number;
  playSecs: number;
  summary: SessionSummary;
  percentiles: FrameTimePercentile[];
  fpsTimeline: FpsTimelinePoint[];
  note: string;
  hardwareSnapshot?: HardwareSnapshot;
}

export interface SessionListItem {
  id: string;
  gameName: string;
  startedAt: number;
  endedAt: number;
  summary: SessionSummary;
}

export interface SessionComparisonResult {
  sessionA: SessionSummary;
  sessionB: SessionSummary;
  fpsDeltaPct: number;
  pct1LowDeltaPct: number;
  pct01LowDeltaPct: number;
  stutterDelta: number;
  autoSummary: string;
}

// ─── Profile Sharing ─────────────────────────────────────────────────────────

/** コミュニティ共有用プロファイル（マシン固有情報を除く） */
export interface SharedProfile {
  version: number;
  displayName: string;
  cpuAffinityGame: number[] | null;
  cpuAffinityBackground: number[] | null;
  processPriority: ProcessPriorityLevel;
  powerPlan: PowerPlanType;
  processesToSuspend: string[];
  processesToKill: string[];
  autoSuspendEnabled: boolean;
  timerResolution100ns: number | null;
  boostLevel: BoostLevel;
  coreParkingDisabled: boolean;
  exportedAt: number;
}

// ─── NETWORK TUNING (δ-2) ────────────────────────────────────────────────────

export type TcpAutoTuningLevel =
  | 'normal'
  | 'disabled'
  | 'highlyRestricted'
  | 'restricted'
  | 'experimental';

export interface TcpTuningState {
  nagleDisabled: boolean;
  delayedAckDisabled: boolean;
  /** -1 = 無制限, 10 = デフォルト */
  networkThrottlingIndex: number;
  /** 0–100% */
  qosReservedBandwidthPct: number;
  tcpAutoTuning: TcpAutoTuningLevel;
  ecnEnabled: boolean;
  rssEnabled: boolean;
}

export interface NetworkQualitySnapshot {
  target: string;
  avgLatencyMs: number;
  jitterMs: number;
  packetLossPct: number;
  sampleCount: number;
  timestamp: number;
}

/** コアパーキング現在状態（Rust CoreParkingState から） */
export interface CoreParkingState {
  /** AC 電源時のコアパーキング最小コア率（0=パーキング有効, 100=無効） */
  minCoresPercentAc: number;
  /** DC（バッテリー）時のコアパーキング最小コア率 */
  minCoresPercentDc: number;
}

// ─── WATCHDOG (δ-3) ────────────────────────────────────────────────────────

export interface WatchdogRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: WatchdogCondition[];
  action: WatchdogAction;
  processFilter: ProcessFilter;
  profileId: string | null;
  cooldownSecs: number;
  lastTriggeredAt: number | null;
}

export interface WatchdogCondition {
  metric: WatchdogMetric;
  operator: WatchdogOperator;
  threshold: number;
}

export type WatchdogMetric = 'cpuPercent' | 'memoryMb' | 'diskReadKb' | 'diskWriteKb';
export type WatchdogOperator = 'greaterThan' | 'lessThan' | 'equals';

export type WatchdogAction =
  | { setPriority: { level: string } }
  | { setAffinity: { cores: number[] } }
  | 'suspend'
  | 'terminate';

export interface ProcessFilter {
  includeNames: string[];
  excludeNames: string[];
}

export interface WatchdogEvent {
  timestamp: number;
  ruleId: string;
  ruleName: string;
  processName: string;
  pid: number;
  actionTaken: string;
  metricValue: number;
  threshold: number;
  success: boolean;
  detail: string;
}

// ─── EXHAUSTIVE CHECK UTILITY ─────────────────────────────────────────────────

/**
 * Exhaustive switch helper. Pass the `default` branch value here to get a
 * compile-time error when a new union member is not handled.
 *
 * @example
 * switch (wingId) {
 *   case 'home': return ...;
 *   case 'performance': return ...;
 *   // ... all cases
 *   default: return assertNever(wingId);
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
