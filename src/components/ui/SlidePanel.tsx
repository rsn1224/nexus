import type React from 'react';
import { memo, useCallback, useEffect } from 'react';

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const SlidePanel = memo(function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
}: SlidePanelProps): React.ReactElement | null {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
      <aside
        className="fixed top-0 right-0 z-50 h-full w-80 bg-base-900 border-l border-border-subtle flex flex-col"
        role="dialog"
        aria-label={title}
        aria-modal="true"
      >
        <header className="h-16 flex items-center justify-between px-4 border-b border-border-subtle shrink-0">
          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-text-secondary">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-white/5"
            aria-label="閉じる"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </>
  );
});

export default SlidePanel;
