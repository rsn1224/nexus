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
  | 'boost'
  | 'launcher'
  | 'settings'
  | 'windows'
  | 'hardware'
  | 'log'
  | 'netopt'
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
  timerResolution100ns: number | null;
  boostLevel: BoostLevel;
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
  | { type: 'monitoring'; pid: number; processName: string }
  | { type: 'error'; message: string };

// ─── CLEANUP ──────────────────────────────────────────────────────────────
export interface RevertItem {
  category: string;
  label: string;
  success: boolean;
  detail: string;
}

export interface RevertAllResult {
  items: RevertItem[];
  total: number;
  successCount: number;
  failCount: number;
}
