import { getCurrentWindow } from '@tauri-apps/api/window';
import type React from 'react';
import { memo, useCallback } from 'react';

const TitleBar = memo(function TitleBar(): React.ReactElement {
  const appWindow = (() => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  })();

  const handleMinimize = useCallback(() => {
    void appWindow?.minimize();
  }, [appWindow]);

  const handleMaximize = useCallback(() => {
    void appWindow?.toggleMaximize();
  }, [appWindow]);

  const handleClose = useCallback(() => {
    void appWindow?.close();
  }, [appWindow]);

  return (
    <header className="fixed top-0 w-full z-50 h-16 bg-base-900 border-b border-border-subtle flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <h1 className="text-2xl font-black tracking-tighter text-accent-500" data-tauri-drag-region>
          NEXUS
        </h1>
      </div>

      <div className="flex-1 h-full" data-tauri-drag-region />

      <div className="flex items-center gap-1">
        <WinButton onClick={handleMinimize} label="最小化">
          <span className="material-symbols-outlined text-[14px]">remove</span>
        </WinButton>
        <WinButton onClick={handleMaximize} label="最大化">
          <span className="material-symbols-outlined text-[14px]">check_box_outline_blank</span>
        </WinButton>
        <WinButton
          onClick={handleClose}
          label="閉じる"
          className="hover:text-danger-500 hover:bg-danger-500/10"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </WinButton>
      </div>
    </header>
  );
});

function WinButton({
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
      className={`w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-white/5 ${className}`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export default TitleBar;
