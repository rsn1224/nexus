import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect } from 'react';
import { useOptimizeStore } from '../../stores/useOptimizeStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useSystemStore } from '../../stores/useSystemStore';
import Main from '../Main';
import { ErrorBoundary } from '../ui/ErrorBoundary';

function WinBtn({
  onClick,
  label,
  children,
  className = '',
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-white/5 ${className}`}
    >
      {children}
    </button>
  );
}

const AppShell = memo(function AppShell(): React.ReactElement {
  const startPolling = useSystemStore((s) => s.startPolling);
  const stopPolling = useSystemStore((s) => s.stopPolling);
  const fetchHistory = useOptimizeStore((s) => s.fetchHistory);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    startPolling();
    void fetchHistory();
    void fetchSettings();
    return () => stopPolling();
  }, [startPolling, stopPolling, fetchHistory, fetchSettings]);

  const appWindow = (() => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  })();

  const handleMinimize = useCallback(() => void appWindow?.minimize(), [appWindow]);
  const handleMaximize = useCallback(() => void appWindow?.toggleMaximize(), [appWindow]);
  const handleClose = useCallback(() => void appWindow?.close(), [appWindow]);

  return (
    <div className="h-screen flex flex-col bg-base-900 text-text-primary overflow-hidden select-none">
      {/* タイトルバー */}
      <header
        className="h-10 shrink-0 bg-base-950 border-b border-border-subtle flex items-center"
        data-tauri-drag-region
      >
        <div className="flex items-center gap-3 px-4 shrink-0">
          <span className="text-[11px] font-bold tracking-[0.3em] text-accent-500">NEXUS</span>
          <span className="text-[10px] text-text-muted">v4.0</span>
        </div>

        <div className="flex-1 min-w-0" />

        <div className="flex items-center gap-0.5 px-2 shrink-0">
          <WinBtn onClick={handleMinimize} label="最小化">
            <Minus size={12} />
          </WinBtn>
          <WinBtn onClick={handleMaximize} label="最大化">
            <Square size={10} />
          </WinBtn>
          <WinBtn
            onClick={handleClose}
            label="閉じる"
            className="hover:text-danger-500 hover:bg-danger-500/10"
          >
            <X size={12} />
          </WinBtn>
        </div>
      </header>

      {/* メインコンテンツ */}
      <ErrorBoundary name="Main">
        <Main />
      </ErrorBoundary>
    </div>
  );
});

export default AppShell;
