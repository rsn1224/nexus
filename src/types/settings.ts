export interface AppSettings {
  perplexityApiKey: string;
  startWithWindows: boolean;
  minimizeToTray: boolean;
}

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

export interface WinSetting {
  id: string;
  label: string;
  description: string;
  isOptimized: boolean;
  canRevert: boolean;
}
