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
