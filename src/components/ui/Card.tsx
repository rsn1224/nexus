import type React from 'react';
import { memo } from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  tabIndex?: number;
}

const Card = memo(function Card({
  title,
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
}: CardProps): React.ReactElement {
  const variantClasses = {
    default: 'bg-base-800 border border-border-subtle',
    elevated: 'bg-base-800 border border-border-subtle shadow-lg',
    outlined: 'bg-transparent border border-border-subtle',
    glow: 'bg-base-800 border border-border-subtle card-glow',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  const interactionClasses = `
    ${hoverable ? 'transition-all duration-200 hover:shadow-md hover:border-accent-500' : ''}
    ${clickable ? 'cursor-pointer' : ''}
  `;

  const classes = `
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${interactionClasses}
    rounded
    ${className}
  `;

  const inner = (
    <>
      {title && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
          <div className="text-text-secondary text-[10px] tracking-widest uppercase font-mono">
            {title}
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
