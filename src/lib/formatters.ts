export function fmtNum(n: number, dec = 1): string {
  return n.toFixed(dec);
}

export function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDuration(startTs: number, endTs: number): string {
  const secs = endTs - startTs;
  const m = Math.floor(secs / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60}m` : `${m}m`;
}

export function formatTime(timestamp: number | null): string {
  if (timestamp == null) return '--';
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDurationMs(durationMs: number): string {
  const SHORT_MS = 1000;
  if (durationMs < SHORT_MS) return `${durationMs}ms`;
  return `${(durationMs / SHORT_MS).toFixed(1)}s`;
}
