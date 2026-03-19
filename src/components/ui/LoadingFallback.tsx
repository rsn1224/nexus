import type React from 'react';

export default function LoadingFallback(): React.ReactElement {
  return (
    <div data-testid="ui-loading-fallback" className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-text-muted">読み込み中...</span>
      </div>
    </div>
  );
}
