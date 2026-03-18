import type React from 'react';

interface SectionHeaderProps {
  title: string; // 例: '▶ HOME / OVERVIEW'
  color?: 'accent' | 'cyan' | 'muted'; // デフォルト: 'accent'
  children?: React.ReactNode; // 右側のボタン群
}

export default function SectionHeader({
  title,
  color = 'accent',
  children,
}: SectionHeaderProps): React.ReactElement {
  const colorClasses = {
    accent: 'text-(--color-accent-500)',
    cyan: 'text-cyan-500',
    muted: 'text-text-muted',
  };

  return (
    <div className="px-4 py-[10px] border-b border-border-subtle flex-shrink-0 flex items-center justify-between">
      <span
        className={`font-[var(--font-mono)] text-[11px] font-bold tracking-[0.15em] ${colorClasses[color]}`}
      >
        {title}
      </span>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
