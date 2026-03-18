import { useEffect, useRef } from 'react';
import type { ReadinessRank } from '../../lib/gameReadiness';
import { getRankStyle } from '../../lib/gameReadiness';

interface ReadinessGaugeProps {
  score: number;
  rank: ReadinessRank;
  size?: number;
}

export default function ReadinessGauge({ score, rank, size = 120 }: ReadinessGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rankStyle = getRankStyle(rank);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const startAngle = 0.75 * Math.PI; // 135°
    const endAngle = 2.25 * Math.PI; // 405°
    const sweepAngle = endAngle - startAngle;

    // 背景円弧
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.stroke();

    // スコア円弧
    const scoreAngle = startAngle + (score / 100) * sweepAngle;
    ctx.strokeStyle = rankStyle.color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, scoreAngle);
    ctx.stroke();

    // 中央テキスト — スコア
    ctx.fillStyle = rankStyle.color;
    ctx.font = `bold ${size * 0.28}px var(--font-mono)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(score.toString(), cx, cy - 4);

    // ラベル
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `${size * 0.08}px var(--font-mono)`;
    ctx.fillText(rankStyle.label, cx, cy + size * 0.18);
  }, [score, size, rankStyle.color, rankStyle.label]);

  return (
    <canvas ref={canvasRef} className="block" style={{ width: `${size}px`, height: `${size}px` }} />
  );
}
