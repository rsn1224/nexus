export function formatTemp(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}

export function formatGb(gb: number): string {
  return `${gb.toFixed(1)} GB`;
}

export function formatPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}

export function formatTimestamp(unixMs: number): string {
  return new Date(unixMs).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
