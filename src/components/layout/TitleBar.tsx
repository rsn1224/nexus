import { getCurrentWindow } from '@tauri-apps/api/window';
import { Bell, Minus, Radio, Settings, Square, X } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';

const TitleBar = memo(function TitleBar(): React.ReactElement {
  const appWindow = getCurrentWindow();

  const [blink, setBlink] = useState(true);
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  );

  useEffect(() => {
    const clockId = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      );
    }, 1000);
    const blinkId = setInterval(() => {
      setBlink((b) => !b);
    }, 800);
    return () => {
      clearInterval(clockId);
      clearInterval(blinkId);
    };
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

  return (
    <div
      data-tauri-drag-region
      className="h-16 flex items-center justify-between bg-base-950 border-b border-white/5 select-none shrink-0 px-4"
    >
      {/* Logo */}
      <div className="flex items-center gap-3" data-tauri-drag-region>
        <span
          className="text-2xl font-black tracking-tighter text-accent-500 bloom-razer"
          data-tauri-drag-region
        >
          NEXUS
        </span>
        <span
          className="text-[10px] font-black tracking-[0.4em] text-accent-500/60 mt-1"
          data-tauri-drag-region
        >
          V2
        </span>
      </div>

      {/* Drag area */}
      <div className="flex-1 h-full" data-tauri-drag-region />

      {/* Clock */}
      <div
        className="font-mono text-[11px] text-white/30 tracking-[0.2em] mr-4"
        data-tauri-drag-region
      >
        {clock}
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-1 mr-2">
        <button
          type="button"
          className={`w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/5 ${
            blink ? 'text-accent-500' : 'text-accent-500/30'
          }`}
          aria-label="センサー状態"
        >
          <Radio size={14} />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors"
          aria-label="通知"
        >
          <Bell size={14} />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors hover:rotate-45"
          aria-label="設定"
        >
          <Settings size={14} />
        </button>
      </div>

      {/* Window controls */}
      <div className="flex items-center h-full">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors rounded"
          aria-label="最小化"
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-text-primary hover:bg-white/5 transition-colors rounded"
          aria-label="最大化"
        >
          <Square size={10} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-danger-500 hover:bg-danger-500/10 transition-colors rounded"
          aria-label="閉じる"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
});

export default TitleBar;
