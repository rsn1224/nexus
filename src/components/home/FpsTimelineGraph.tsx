import { useEffect, useRef } from 'react';
import type { FpsTimelinePoint } from '../../types';

interface FpsTimelineGraphProps {
  timeline: FpsTimelinePoint[];
  height?: number;
}

export default function FpsTimelineGraph({ timeline, height = 60 }: FpsTimelineGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const padding = 4;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const style = getComputedStyle(document.documentElement);
    const borderColor = style.getPropertyValue('--color-border-subtle').trim() || '#1e293b';
    const accentColor = style.getPropertyValue('--color-accent-500').trim() || '#f97316';
    const dangerColor = style.getPropertyValue('--color-danger-500').trim() || '#ef4444';
    const successColor = style.getPropertyValue('--color-success-500').trim() || '#22c55e';
    const textMuted = style.getPropertyValue('--color-text-muted').trim() || '#6b7280';
    const fontMono = style.getPropertyValue('--font-mono').trim() || 'monospace';

    const fpsList = timeline.map((p) => p.fps);
    const maxFps = Math.max(...fpsList, 60);
    const minFps = Math.min(...fpsList, 0);
    const range = maxFps - minFps || 1;

    const yForFps = (fps: number) => height - padding - ((fps - minFps) / range) * graphHeight;

    // グリッドライン (60fps)
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    const y60 = yForFps(60);
    if (y60 >= padding && y60 <= height - padding) {
      ctx.beginPath();
      ctx.moveTo(padding, y60);
      ctx.lineTo(width - padding, y60);
      ctx.stroke();
    }

    const y30 = yForFps(30);
    if (y30 >= padding && y30 <= height - padding) {
      ctx.beginPath();
      ctx.moveTo(padding, y30);
      ctx.lineTo(width - padding, y30);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // FPS ライン
    if (timeline.length > 1) {
      const step = graphWidth / (timeline.length - 1);

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      timeline.forEach((point, i) => {
        const x = padding + i * step;
        const y = yForFps(point.fps);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // スタッター強調 (30fps 以下)
      ctx.strokeStyle = dangerColor;
      ctx.lineWidth = 2;
      timeline.forEach((point, i) => {
        if (point.fps > 0 && point.fps < 30) {
          const x = padding + i * step;
          const y = yForFps(point.fps);
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // Y 軸ラベル
    ctx.fillStyle = textMuted;
    ctx.font = `9px ${fontMono}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    ctx.fillText(`${Math.round(maxFps)}`, padding - 2, padding);
    ctx.fillStyle = successColor;
    if (y60 >= padding && y60 <= height - padding) {
      ctx.fillText('60', padding - 2, y60);
    }
    ctx.fillStyle = textMuted;
    ctx.fillText(`${Math.round(minFps)}`, padding - 2, height - padding);
  }, [timeline, height]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} />
    </div>
  );
}
