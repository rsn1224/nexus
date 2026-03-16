// ─── Wing IDs ────────────────────────────────────────────────────────────────
export type WingId =
  | 'recon'
  | 'pulse'
  | 'beacon'
  | 'ops'
  | 'security'
  | 'vault'
  | 'archive'
  | 'chrono'
  | 'link'
  | 'signal';

export interface WingStatus {
  id: WingId;
  label: string;
  online: boolean;
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
  appId: number;
  name: string;
  installPath: string;
  sizeGb: number;
}

// ─── OPS ─────────────────────────────────────────────────────────────────────
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'exited';
  ports: string[];
}

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

// ─── VAULT ───────────────────────────────────────────────────────────────────
export interface VaultEntry {
  id: string;
  label: string;
  category: 'password' | 'api_key' | 'note' | 'config' | 'totp';
  username: string;
  url: string;
  secret: string;
  createdAt: number;
  updatedAt: number;
}

// ─── ARCHIVE ─────────────────────────────────────────────────────────────────
export interface ArchiveNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  links: string[];
  createdAt: number;
  updatedAt: number;
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
}

// ─── CHRONO ───────────────────────────────────────────────────────────────────
export interface ChronoTask {
  id: string;
  title: string;
  done: boolean;
  priority: 'low' | 'medium' | 'high';
  dueAt?: number;
  createdAt: number;
  updatedAt: number;
}

// ─── LINK ────────────────────────────────────────────────────────────────────
export interface Snippet {
  id: string;
  label: string;
  content: string;
  category: 'text' | 'code' | 'url';
  createdAt: number;
}

// ─── BEACON ───────────────────────────────────────────────────────────────────
export interface WatchedPath {
  id: string;
  path: string;
  isRecursive: boolean;
  createdAt: number;
  isActive: boolean;
}

export interface WatchEvent {
  id: string;
  pathId: string;
  kind: 'Create' | 'Modify' | 'Remove' | 'Other';
  path: string;
  timestamp: number;
}

// ─── TOTP ────────────────────────────────────────────────────────────────────
export interface TotpResult {
  uri: string;
  code: string;
  remaining: number;
}

// --- Security ---

export interface NpmVulnerability {
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  via: string[];
  fixAvailable: boolean;
}

export interface CargoVulnerability {
  package: string;
  version: string;
  advisoryId: string;
  title: string;
  severity: string;
  url: string;
}

export interface VulnerabilitySummary {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}

export interface VulnerabilityReport {
  npm: NpmVulnerability[];
  cargo: CargoVulnerability[];
  summary: VulnerabilitySummary;
  scannedAt: string; // ISO8601（Date への変換はUI層で行う）
}

export interface DetectedSecret {
  file: string;
  line: number;
  patternName: string;
  preview: string;
}

export interface SecretSummary {
  total: number;
  filesAffected: number;
}

export interface SecretReport {
  secrets: DetectedSecret[];
  summary: SecretSummary;
  scannedAt: string;
}

// ─── SIGNAL ───────────────────────────────────────────────────────────────────
export interface SignalFeed {
  id: string;
  label: string;
  url: string;
  kind: 'rss' | 'http';
  intervalSecs: number;
  lastChecked: number;
  isActive: boolean;
  lastResult?: SignalResult;
}

export interface SignalResult {
  title: string;
  link?: string;
  description?: string;
  published: number;
  guid?: string;
}
