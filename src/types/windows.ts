export type PowerPlan = 'Balanced' | 'HighPerformance' | 'PowerSaver';
export type VisualEffects = 'BestPerformance' | 'Balanced' | 'BestAppearance';

export interface WindowsSettings {
  powerPlan: PowerPlan;
  gameMode: boolean;
  fullscreenOptimization: boolean;
  hardwareGpuScheduling: boolean;
  visualEffects: VisualEffects;
}

export interface BoostAction {
  label: string;
  actionType: string;
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
