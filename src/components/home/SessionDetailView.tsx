import { useSessionStore } from '../../stores/useSessionStore';
import FpsTimelineGraph from './FpsTimelineGraph';

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionDetailView() {
  const { selectedSession, isLoading } = useSessionStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80px] text-xs text-text-muted">
        LOADING...
      </div>
    );
  }

  if (!selectedSession) {
    return (
      <div className="flex items-center justify-center h-[80px] text-xs text-text-muted">
        SELECT A SESSION FROM LIST
      </div>
    );
  }

  const s = selectedSession.summary;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-xs font-bold text-accent-500">{selectedSession.gameName}</div>
        <div className="text-xs text-text-muted">
          {formatDate(selectedSession.startedAt)} — {formatDate(selectedSession.endedAt)}（
          {Math.round(selectedSession.playSecs / 60)} 分）
        </div>
      </div>

      {selectedSession.fpsTimeline.length > 0 && (
        <div>
          <div className="text-xs text-text-muted mb-1">FPS TIMELINE</div>
          <FpsTimelineGraph timeline={selectedSession.fpsTimeline} />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            { label: 'AVG FPS', value: s.avgFps.toFixed(1) },
            { label: '1% LOW', value: s.pct1Low.toFixed(1) },
            { label: '0.1% LOW', value: s.pct01Low.toFixed(1) },
            { label: 'STUTTER', value: String(s.totalStutterCount) },
            { label: 'MAX FT', value: `${s.maxFrameTimeMs.toFixed(1)}ms` },
            { label: 'FRAMES', value: String(s.totalFrames) },
          ] as const
        ).map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-text-muted">{label}</div>
            <div className="font-mono text-sm font-bold text-accent-500">{value}</div>
          </div>
        ))}
      </div>

      {selectedSession.percentiles.length > 0 && (
        <div>
          <div className="text-xs text-text-muted mb-1">PERCENTILES</div>
          <div className="flex gap-3">
            {selectedSession.percentiles.map((p) => (
              <div key={p.percentile} className="text-center">
                <div className="text-xs text-text-muted">P{p.percentile}</div>
                <div className="font-mono text-xs text-text-primary">{p.fps.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedSession.note && (
        <div className="pt-2 border-t border-border-subtle">
          <div className="text-xs text-text-muted mb-1">NOTE</div>
          <div className="text-xs text-text-secondary">{selectedSession.note}</div>
        </div>
      )}

      {selectedSession.hardwareSnapshot && (
        <div className="pt-2 border-t border-border-subtle">
          <div className="text-xs text-text-muted mb-1">HARDWARE</div>
          <div className="text-xs text-text-secondary flex flex-col gap-[2px]">
            <div>CPU {selectedSession.hardwareSnapshot.cpuName}</div>
            {selectedSession.hardwareSnapshot.gpuName && (
              <div>GPU {selectedSession.hardwareSnapshot.gpuName}</div>
            )}
            <div>RAM {selectedSession.hardwareSnapshot.memTotalGb.toFixed(0)} GB</div>
          </div>
        </div>
      )}
    </div>
  );
}
