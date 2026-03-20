import type React from 'react';
import { memo } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'tactical' | 'locked';

interface NexusButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const NexusButton = memo(function NexusButton({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  className = '',
}: NexusButtonProps): React.ReactElement {
  const base =
    'px-6 py-2.5 font-bold uppercase tracking-widest text-sm transition-all duration-150 font-sans';

  const variants = {
    primary: `bg-accent-500 text-black hover:shadow-[0_0_16px_rgba(68,214,44,0.5)] active:scale-[0.99] active:shadow-[0_0_24px_rgba(68,214,44,0.7)]`,
    ghost: `bg-transparent text-accent-500 border border-accent-500 hover:bg-accent-500/10 hover:shadow-[0_0_12px_rgba(68,214,44,0.3)] active:bg-accent-500/20`,
    tactical: `bg-transparent text-text-primary border border-border-subtle hover:border-accent-500/40 hover:text-accent-500`,
    locked: `bg-base-600 text-text-muted border border-border-subtle cursor-not-allowed opacity-50`,
  };

  const isDisabled = disabled || variant === 'locked';

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={onClick}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
});
