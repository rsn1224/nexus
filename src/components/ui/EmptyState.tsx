import type React from 'react';

interface EmptyStateProps {
  message: string; // 例: 'NO GAMES FOUND'
  action?: string; // 例: 'PRESS + ADD'
  height?: string; // デフォルト: 'h-[120px]'
}

export default function EmptyState({
  message,
  action,
  height = 'h-[120px]',
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={`flex flex-col items-center justify-center ${height} text-[11px] text-text-muted`}
    >
      <div>{message}</div>
      {action && <div className="mt-1 text-[10px] opacity-70">{action}</div>}
    </div>
  );
}
