import type React from 'react';
import { memo } from 'react';
import { formatTimestamp } from '../lib/formatters';
import { useOptimizeStore } from '../stores/useOptimizeStore';

interface QuickInfoProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

const QuickInfo = memo(function QuickInfo({
  onOpenSettings,
  onOpenHistory,
}: QuickInfoProps): React.ReactElement {
  const history = useOptimizeStore((s) => s.history);
  const lastSession = history[0];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <InfoItem label="SESSIONS" value={String(history.length)} />
        {lastSession && (
          <InfoItem label="LAST OPT" value={formatTimestamp(lastSession.timestamp)} />
        )}
      </div>
      <div className="flex items-center gap-1">
        <IconButton icon="history" label="履歴" onClick={onOpenHistory} />
        <IconButton icon="settings" label="設定" onClick={onOpenSettings} />
      </div>
    </div>
  );
});

function InfoItem({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-text-muted uppercase">
        {label}
      </span>
      <span className="text-[12px] text-text-primary">{value}</span>
    </div>
  );
}

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-white/5"
      aria-label={label}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
    </button>
  );
}

export default QuickInfo;
