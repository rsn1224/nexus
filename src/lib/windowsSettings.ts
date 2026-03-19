import type { WindowsSettings } from '../types';
import { PowerPlan, VisualEffects } from '../types';

export const defaultWindowsSettings: WindowsSettings = {
  powerPlan: PowerPlan.Balanced,
  gameMode: true,
  fullscreenOptimization: true,
  hardwareGpuScheduling: false,
  visualEffects: VisualEffects.Balanced,
};
