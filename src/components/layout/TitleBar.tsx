import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';

const TitleBar = memo(function TitleBar(): React.ReactElement {
  const appWindow = getCurrentWindow();
  const snap = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleMinimize = useCallback(() => {
    void appWindow.minimize();
  }, [appWindow]);

  const handleMaximize = useCallback(() => {
    void appWindow.toggleMaximize();
  }, [appWindow]);

  const handleClose = useCallback(() => {
    void appWindow.close();
  }, [appWindow]);

  const cpuPct = snap?.cpuPercent ?? null;
  const memGb = snap !== null && snap.memTotalMb > 0 ? (snap.memUsedMb / 1024).toFixed(1) : null;

  const cpuColor =
    cpuPct !== null && cpuPct >= 80
      ? 'text-danger-500'
      : cpuPct !== null && cpuPct >= 60
        ? 'text-warm-500'
        : 'text-text-secondary';

  return (
    <div
      data-tauri-drag-region
      className="h-8 flex items-center justify-between bg-base-950 border-b border-white/[0.04] select-none shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center h-full px-3 gap-2" data-tauri-drag-region>
        <div className="w-1.5 h-1.5 rounded-full bg-accent-500" data-tauri-drag-region />
        <span
          className="font-mono text-xs font-bold tracking-widest text-accent-500"
          data-tauri-drag-region
        >
          NEXUS
        </span>
      </div>

      {/* Drag area */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Live KPI strip */}
      {snap !== null && (
        <div
          className="flex items-center gap-3 px-3 h-full font-mono text-xs"
          data-tauri-drag-region
        >
          <span className={`flex items-center gap-1 ${cpuColor}`} data-tauri-drag-region>
            <span className="text-text-muted" data-tauri-drag-region>
              CPU
            </span>
            {cpuPct !== null ? `${Math.round(cpuPct)}%` : '--'}
          </span>
          <span className="w-px h-3 bg-white/10" data-tauri-drag-region />
          <span className="flex items-center gap-1 text-accent-400" data-tauri-drag-region>
            <span className="text-text-muted" data-tauri-drag-region>
              MEM
            </span>
            {memGb !== null ? `${memGb}G` : '--'}
          </span>
          <span className="w-px h-3 bg-white/10" data-tauri-drag-region />
          <span className="text-text-muted" data-tauri-drag-region>
            {clock}
          </span>
        </div>
      )}

      {/* Window controls */}
      <div className="flex items-center h-full">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-11 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-800 transition-colors"
          aria-label="最小化"
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-800 transition-colors"
          aria-label="最大化"
        >
          <Square size={10} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-danger-500/80 transition-colors"
          aria-label="閉じる"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
});

export default TitleBar;
