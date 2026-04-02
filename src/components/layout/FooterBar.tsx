import { AlertTriangle, History, Settings } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { useUiStore } from '../../stores/useUiStore';

const FooterBar = memo(function FooterBar(): React.ReactElement {
  const { openSettings, openHistory, openRevertDialog } = useUiStore();

  return (
    <footer className="flex items-center justify-between gap-2 pt-1 border-t border-border-subtle">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={openSettings}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold tracking-[0.1em] uppercase text-text-muted hover:text-text-primary hover:bg-base-700 transition-colors"
          aria-label="設定を開く"
        >
          <Settings size={10} />
          Settings
        </button>
        <button
          type="button"
          onClick={openHistory}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold tracking-[0.1em] uppercase text-text-muted hover:text-text-primary hover:bg-base-700 transition-colors"
          aria-label="履歴を開く"
        >
          <History size={10} />
          History
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={openRevertDialog}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold tracking-[0.1em] uppercase text-warning-500/70 hover:text-warning-500 hover:bg-warning-500/10 border border-transparent hover:border-warning-500/30 transition-colors"
          aria-label="全設定を元に戻す"
        >
          <AlertTriangle size={10} />
          Revert All
        </button>
      </div>
    </footer>
  );
});

export default FooterBar;
