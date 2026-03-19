export interface SettingRecommendation {
  settingId: string;
  label: string;
  recommendedValue: RecommendedValue;
  currentValue: string;
  reason: string;
  importance: 'high' | 'medium' | 'low';
  safetyLevel: 'safe' | 'moderate' | 'advanced';
  isOptimal: boolean;
}

export type RecommendedValue = { boolean: boolean } | { string: string } | { enum: string };

export interface AdvisorResult {
  recommendations: SettingRecommendation[];
  optimizationScore: number;
  hardwareSummary: string;
  warnings: string[];
}

export interface WindowsSettingsSnapshot {
  gameMode: boolean;
  hags: boolean;
  fullscreenOptimization: boolean;
  visualEffects: string;
  powerPlan: string;
  memoryIntegrity: boolean;
}
