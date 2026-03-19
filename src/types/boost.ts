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

export type ProcessPriorityLevel = 'normal' | 'high' | 'realtime' | 'aboveNormal';
export type BoostLevel = 'none' | 'soft' | 'medium' | 'hard';
