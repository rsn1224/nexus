export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(1)} ${units[i]}`;
}

export function getHealthColor(status: string): string {
  switch (status) {
    case 'Good':
      return 'var(--color-success-500)';
    case 'Warning':
      return 'var(--color-accent-500)';
    case 'Critical':
      return 'var(--color-danger-500)';
    default:
      return 'var(--color-text-muted)';
  }
}

export function getUsagePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return (used / total) * 100;
}
