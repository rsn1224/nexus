import type React from 'react';
import { memo } from 'react';

interface CardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glow' | 'glass' | 'glass-elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  tabIndex?: number;
  accentColor?: 'accent' | 'warm' | 'amber' | 'info' | 'muted';
}

const ACCENT_BAR: Record<string, string> = {
  accent: 'bg-accent-500',
  warm: 'bg-warm-500',
  amber: 'bg-amber-500',
  info: 'bg-info-500',
  muted: 'bg-text-muted',
};

const Card = memo(function Card({
  title,
  icon,
  children,
  className = '',
  action,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  ariaLabel,
  tabIndex,
  accentColor = 'muted',
}: CardProps): React.ReactElement {
  const variantClasses = {
    default: 'bg-base-800/80 border border-white/[0.06] backdrop-blur-sm',
    elevated: 'bg-base-800/90 border border-white/[0.08] shadow-md backdrop-blur-md',
    outlined: 'bg-transparent border border-border-subtle',
    glow: 'bg-base-800/80 border border-white/[0.06] card-glow backdrop-blur-sm',
    glass: 'piano-surface',
    'glass-elevated': 'card-glass-elevated',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };

  const interactionClasses = `
    ${hoverable ? 'transition-all duration-200 hover:shadow-md hover:shadow-accent-500/10 hover:border-white/10 hover:-translate-y-0.5' : ''}
    ${clickable ? 'cursor-pointer' : ''}
  `;

  const classes = `
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${interactionClasses}
    ${variant === 'glass' || variant === 'glass-elevated' ? '' : 'rounded-xl'}
    ${className}
  `;

  const barClass = ACCENT_BAR[accentColor] ?? ACCENT_BAR.muted;

  const inner = (
    <>
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className={`w-0.5 h-3.5 rounded-full ${barClass} shrink-0`} />
            {icon && <span className="text-text-muted text-sm leading-none">{icon}</span>}
            <div className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              {title}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div
        className={
          padding === 'none'
            ? ''
            : padding === 'sm'
              ? 'px-2 py-1'
              : padding === 'lg'
                ? 'p-4'
                : 'p-3'
        }
      >
        {children}
      </div>
    </>
  );

  if (clickable) {
    return (
      <button
        data-testid="ui-card"
        type="button"
        className={`${classes} text-left w-full`}
        onClick={onClick}
        aria-label={ariaLabel}
        tabIndex={tabIndex ?? 0}
      >
        {inner}
      </button>
    );
  }

  return (
    <div data-testid="ui-card" className={classes} tabIndex={tabIndex}>
      {inner}
    </div>
  );
});

export default Card;
