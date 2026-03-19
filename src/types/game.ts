import type { BoostLevel, ProcessPriorityLevel } from './boost';

export interface GameInfo {
  app_id: number;
  name: string;
  install_path: string;
  size_gb: number;
}

export type PowerPlanType = 'unchanged' | 'highPerformance' | 'ultimatePerformance' | 'balanced';

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
