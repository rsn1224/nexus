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
    <header className="fixed top-0 w-full z-50 h-16 bg-[#030305]/80 backdrop-blur-xl border-b-[0.5px] border-white/10 flex items-center justify-between px-4 select-none">
      {/* Left: NEXUS Logo */}
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <h1
          className="text-2xl font-black tracking-tighter text-accent-500 drop-shadow-[0_0_8px_rgba(68,214,44,0.5)]"
          data-tauri-drag-region
        >
          NEXUS
        </h1>
      </div>

      {/* Center: Drag Area */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Right: Notifications + Settings + Window Controls */}
      <div className="flex items-center gap-2">
        {/* Material Symbols */}
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="通知"
        >
          <span className="material-symbols-outlined text-[16px]">notifications</span>
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="設定"
        >
          <span className="material-symbols-outlined text-[16px]">settings</span>
        </button>

        {/* Window Controls */}
        <button
          type="button"
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="最小化"
        >
          <span className="material-symbols-outlined text-[14px]">remove</span>
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="最大化"
        >
          <span className="material-symbols-outlined text-[14px]">check_box_outline_blank</span>
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-danger-500 hover:bg-danger-500/10 transition-colors"
          aria-label="閉じる"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </header>
  );
});

export default TitleBar;
