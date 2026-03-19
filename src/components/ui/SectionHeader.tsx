import type React from 'react';

interface SectionHeaderProps {
  title: string; // 例: '▶ HOME / OVERVIEW'
  color?: 'accent' | 'muted' | 'warm' | 'purple' | 'info'; // デフォルト: 'accent'
  children?: React.ReactNode; // 右側のボタン群
}

export default function SectionHeader({
  title,
  color = 'accent',
  children,
}: SectionHeaderProps): React.ReactElement {
  const colorClasses = {
    accent: 'text-accent-500',
    muted: 'text-text-muted',
    warm: 'text-warm-500',
    purple: 'text-purple-500',
    info: 'text-info-500',
  };

  return (
    <div className="px-4 py-[10px] border-b border-border-subtle flex-shrink-0 flex items-center justify-between">
      <span className={`text-sm font-semibold ${colorClasses[color]}`}>{title}</span>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
