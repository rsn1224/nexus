import type React from 'react';

export default function LoadingFallback(): React.ReactElement {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[11px] text-text-muted tracking-[0.12em] uppercase">
          読み込み中...
        </span>
      </div>
    </div>
  );
}
