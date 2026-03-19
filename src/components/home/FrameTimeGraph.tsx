import { useEffect, useRef } from 'react';

interface FrameTimeGraphProps {
  frameTimes: number[]; // ms 単位
}

export default function FrameTimeGraph({ frameTimes }: FrameTimeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const height = 60; // nexus プロジェクトのデザインルールに従い高さのみ指定

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas サイズを設定
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // クリア
    ctx.clearRect(0, 0, rect.width, height);

    if (frameTimes.length === 0) return;

    // データ準備
    const width = rect.width;
    const padding = 4;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Y 軸スケール（0-50ms の範囲）
    const maxFrameTime = 50;
    const yScale = graphHeight / maxFrameTime;

    // 背景グリッド（16.6ms = 60fps のライン）
    const borderColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-border-subtle').trim() ||
      '#1e293b';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    // 16.6ms (60fps) ライン
    const fps60Y = height - padding - 16.6 * yScale;
    ctx.beginPath();
    ctx.moveTo(padding, fps60Y);
    ctx.lineTo(width - padding, fps60Y);
    ctx.stroke();

    // 33.3ms (30fps) ライン
    const fps30Y = height - padding - 33.3 * yScale;
    ctx.beginPath();
    ctx.moveTo(padding, fps30Y);
    ctx.lineTo(width - padding, fps30Y);
    ctx.stroke();

    ctx.setLineDash([]);

    // フレームタイムラインを描画
    if (frameTimes.length > 0) {
      const step = graphWidth / (frameTimes.length - 1);

      // グラデーションを作成
      const accentColor =
        getComputedStyle(document.documentElement).getPropertyValue('--color-accent-500').trim() ||
        '#3b82f6';
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, accentColor);
      gradient.addColorStop(1, accentColor);

      // グラデーションフィルエリア
      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      fillGradient.addColorStop(0, accentColor + '33');
      fillGradient.addColorStop(1, accentColor + '00');

      ctx.beginPath();
      frameTimes.forEach((frameTime, index) => {
        const x = padding + index * step;
        const y = height - padding - Math.min(frameTime, maxFrameTime) * yScale;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(padding + (frameTimes.length - 1) * step, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // グローライン（影として2回描画）
      ctx.shadowBlur = 8;
      ctx.shadowColor = accentColor;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      frameTimes.forEach((frameTime, index) => {
        const x = padding + index * step;
        const y = height - padding - Math.min(frameTime, maxFrameTime) * yScale;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // スタッター（33ms以上）をハイライト
      const dangerColor =
        getComputedStyle(document.documentElement).getPropertyValue('--color-danger-500').trim() ||
        '#ef4444';
      ctx.strokeStyle = dangerColor;
      ctx.lineWidth = 2;

      frameTimes.forEach((frameTime, index) => {
        if (frameTime >= 33) {
          const x = padding + index * step;
          const y = height - padding - Math.min(frameTime, maxFrameTime) * yScale;

          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // Y 軸ラベル
    const textMutedColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() ||
      '#6b7280';
    const fontMono =
      getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim() ||
      'monospace';
    ctx.fillStyle = textMutedColor;
    ctx.font = `9px ${fontMono}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    // 50ms
    ctx.fillText('50ms', padding - 2, padding);
    // 16.6ms (60fps)
    ctx.fillText('60fps', padding - 2, fps60Y);
    // 0ms
    ctx.fillText('0ms', padding - 2, height - padding);
  }, [frameTimes]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full h-[60px] block" />
      {/* オーバーレイ情報 */}
      <div className="absolute top-1 right-1 text-xs text-text-muted font-mono pointer-events-none">
        {frameTimes.length > 0 && <div>{frameTimes[frameTimes.length - 1]?.toFixed(1)} ms</div>}
      </div>
    </div>
  );
}
