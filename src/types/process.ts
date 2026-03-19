export interface SystemProcess {
  pid: number;
  name: string;
  cpuPercent: number;
  memMb: number;
  diskReadKb: number;
  diskWriteKb: number;
  canTerminate: boolean;
}

export interface AiSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionCommand: string | null;
}
