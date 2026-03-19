import { useEffect, useRef } from 'react';
import { drawTimeline } from '../../lib/canvas/timelineRenderer';
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
    drawTimeline(canvas, timeline, height);
  }, [timeline, height]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} style={{ width: '100%', height: `${height}px`, display: 'block' }} />
    </div>
  );
}
