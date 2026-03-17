import type React from 'react';
import { memo } from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

const Card = memo(function Card({
  title,
  children,
  className = '',
  action,
}: CardProps): React.ReactElement {
  return (
    <div
      className={`bg-[var(--color-base-800)] border border-[var(--color-border-subtle)] rounded ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-subtle)]">
          <div className="text-[var(--color-text-secondary)] text-[10px] tracking-widest uppercase font-[var(--font-mono)]">
            {title}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
});

export default Card;
