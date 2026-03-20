// ─── Session / History types ──────────────────────────────────────────────────

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
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  healthScoreStart: number;
  healthScoreEnd: number;
  optimizationsApplied: string[];
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
