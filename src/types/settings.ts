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

export interface WindowsSettingsStore {
  settings: WindowsSettings | null;
  advisorResult: import('./advisor').AdvisorResult | null;
  isLoading: boolean;
  advisorLoading: boolean;
  error: string | null;
  advisorError: string | null;
  lastUpdated: number | null;
  fetchSettings: () => Promise<void>;
  setPowerPlan: (plan: PowerPlan) => Promise<void>;
  toggleGameMode: () => Promise<void>;
  toggleFullscreenOptimization: () => Promise<void>;
  toggleHardwareGpuScheduling: () => Promise<void>;
  setVisualEffects: (effect: VisualEffects) => Promise<void>;
  fetchAdvisorResult: () => Promise<void>;
  applyRecommendation: (settingId: string) => Promise<void>;
  applyAllSafeRecommendations: () => Promise<void>;
  clearError: () => void;
  clearAdvisorError: () => void;
}
