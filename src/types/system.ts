export interface SystemStatus {
  cpu_percent: number;
  gpu_percent: number;
  gpu_temp_c: number;
  ram_used_gb: number;
  ram_total_gb: number;
  disk_free_gb: number;
}

export interface DiagnosticAlert {
  severity: 'warning' | 'danger';
  title: string;
  detail: string;
}
