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
