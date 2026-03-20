// ─── Optimize Preset types ────────────────────────────────────────────────────

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
  timestamp: number;
  rollbackMap: Record<string, Record<string, unknown>>;
};

export type AppliedAction = {
  id: string;
  timestamp: number;
  label: string;
  previousValue: string;
  newValue: string;
  invokeCommand: string;
  rollbackArgs: Record<string, unknown>;
};

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
