import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X } from 'lucide-react';
import type React from 'react';
import { memo, useCallback } from 'react';

const TitleBar = memo(function TitleBar(): React.ReactElement {
  const appWindow = getCurrentWindow();

  const handleMinimize = useCallback(() => {
    void appWindow.minimize();
  }, [appWindow]);

  const handleMaximize = useCallback(() => {
    void appWindow.toggleMaximize();
  }, [appWindow]);

  const handleClose = useCallback(() => {
    void appWindow.close();
  }, [appWindow]);

  return (
    <div
      data-tauri-drag-region
      className="h-8 flex items-center justify-between bg-base-950 border-b border-border-subtle select-none shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center h-full px-3" data-tauri-drag-region>
        <span className="font-sans text-xs font-bold text-accent-500" data-tauri-drag-region>
          NEXUS
        </span>
      </div>

      {/* Drag area */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Window controls */}
      <div className="flex items-center h-full">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-11 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-700 transition-colors"
          aria-label="最小化"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-base-700 transition-colors"
          aria-label="最大化"
        >
          <Square size={12} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-danger-500/80 transition-colors"
          aria-label="閉じる"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
});

export default TitleBar;
