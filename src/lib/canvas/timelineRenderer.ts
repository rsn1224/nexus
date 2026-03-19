import type { FpsTimelinePoint } from '../../types';

export interface TimelineColors {
  border: string;
  accent: string;
  danger: string;
  success: string;
  textMuted: string;
  fontMono: string;
}

export function getTimelineColors(): TimelineColors {
  const style = getComputedStyle(document.documentElement);
  return {
    border: style.getPropertyValue('--color-border-subtle').trim() || '#1e293b',
    accent: style.getPropertyValue('--color-accent-500').trim() || '#06b6d4',
    danger: style.getPropertyValue('--color-danger-500').trim() || '#ef4444',
    success: style.getPropertyValue('--color-success-500').trim() || '#22c55e',
    textMuted: style.getPropertyValue('--color-text-muted').trim() || '#6b7280',
    fontMono: style.getPropertyValue('--font-mono').trim() || 'monospace',
  };
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  height: number,
): { ctx: CanvasRenderingContext2D; width: number; dpr: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  return { ctx, width: rect.width, dpr };
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
}

export function drawGridLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  yForFps: (fps: number) => number,
  borderColor: string,
): void {
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);

  for (const target of [60, 30]) {
    const y = yForFps(target);
    if (y >= padding && y <= height - padding) {
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
  }

  ctx.setLineDash([]);
}

export function drawFpsLine(
  ctx: CanvasRenderingContext2D,
  timeline: FpsTimelinePoint[],
  graphWidth: number,
  padding: number,
  yForFps: (fps: number) => number,
  accentColor: string,
  dangerColor: string,
): void {
  if (timeline.length <= 1) return;

  const step = graphWidth / (timeline.length - 1);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  for (const [i, point] of timeline.entries()) {
    const x = padding + i * step;
    const y = yForFps(point.fps);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();

  ctx.strokeStyle = dangerColor;
  ctx.lineWidth = 2;
  for (const [i, point] of timeline.entries()) {
    if (point.fps > 0 && point.fps < 30) {
      const x = padding + i * step;
      const y = yForFps(point.fps);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

export function drawYAxisLabels(
  ctx: CanvasRenderingContext2D,
  height: number,
  padding: number,
  minFps: number,
  maxFps: number,
  yForFps: (fps: number) => number,
  colors: TimelineColors,
): void {
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `9px ${colors.fontMono}`;

  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`${Math.round(maxFps)}`, padding - 2, padding);
  ctx.fillText(`${Math.round(minFps)}`, padding - 2, height - padding);

  const y60 = yForFps(60);
  if (y60 >= padding && y60 <= height - padding) {
    ctx.fillStyle = colors.success;
    ctx.fillText('60', padding - 2, y60);
  }
}

export function buildYForFps(
  minFps: number,
  maxFps: number,
  height: number,
  padding: number,
): (fps: number) => number {
  const graphHeight = height - padding * 2;
  const range = maxFps - minFps || 1;
  return (fps: number) => height - padding - ((fps - minFps) / range) * graphHeight;
}

export function drawTimeline(
  canvas: HTMLCanvasElement,
  timeline: FpsTimelinePoint[],
  height: number,
): void {
  if (timeline.length === 0) return;

  const setup = setupCanvas(canvas, height);
  if (!setup) return;

  const { ctx, width } = setup;
  const padding = 4;
  const graphWidth = width - padding * 2;
  const colors = getTimelineColors();

  const fpsList = timeline.map((p) => p.fps);
  const maxFps = Math.max(...fpsList, 60);
  const minFps = Math.min(...fpsList, 0);
  const yForFps = buildYForFps(minFps, maxFps, height, padding);

  clearCanvas(ctx, width, height);
  drawGridLines(ctx, width, height, padding, yForFps, colors.border);
  drawFpsLine(ctx, timeline, graphWidth, padding, yForFps, colors.accent, colors.danger);
  drawYAxisLabels(ctx, height, padding, minFps, maxFps, yForFps, colors);
}
