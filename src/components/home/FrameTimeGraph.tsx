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
    ctx.strokeStyle = 'var(--color-border)';
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
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'var(--color-accent-500)');
      gradient.addColorStop(1, 'var(--color-accent-500)');

      ctx.strokeStyle = gradient;
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

      // スタッター（33ms以上）をハイライト
      ctx.strokeStyle = 'var(--color-danger-500)';
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
    ctx.fillStyle = 'var(--color-text-muted)';
    ctx.font = '9px var(--font-mono)';
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
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${height}px`,
          display: 'block',
        }}
      />
      {/* オーバーレイ情報 */}
      <div
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          fontSize: '9px',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
        }}
      >
        {frameTimes.length > 0 && <div>{frameTimes[frameTimes.length - 1]?.toFixed(1)} ms</div>}
      </div>
    </div>
  );
}
