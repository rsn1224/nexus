export type BottleneckType = 'cpu' | 'gpu' | 'memory' | 'storage' | 'unknown' | 'balanced';
export type BottleneckConfidence = 'high' | 'medium' | 'low';

export interface BottleneckScores {
  cpu: number;
  gpu: number;
  memory: number;
  storage: number;
}

export interface BottleneckSuggestion {
  id: string;
  message: string;
  action: string | null;
}

export interface BottleneckResult {
  primary: BottleneckType;
  confidence: BottleneckConfidence;
  scores: BottleneckScores;
  suggestions: BottleneckSuggestion[];
  timestamp: number;
}

export interface AiRecommendation {
  title: string;
  description: string;
  applicableInNexus: boolean;
  action: string | null;
}

export interface AiBottleneckResponse {
  analysis: string;
  recommendations: AiRecommendation[];
}

export type HealthSeverity = 'ok' | 'warning' | 'critical';

export interface HealthFixAction {
  id: string;
  label: string;
}

export interface HealthCheckItem {
  id: string;
  label: string;
  severity: HealthSeverity;
  message: string;
  fixAction: HealthFixAction | null;
}

export interface HealthCheckResult {
  items: HealthCheckItem[];
  overall: HealthSeverity;
  timestamp: number;
}

export interface HealthCheckInput {
  diskFreeGb: number;
  diskTotalGb: number;
  cpuTempC: number | null;
  gpuTempC: number | null;
  memUsedMb: number;
  memTotalMb: number;
  heavyProcesses: HeavyProcess[];
}

export interface HeavyProcess {
  name: string;
  cpuPercent: number;
  memMb: number;
}
