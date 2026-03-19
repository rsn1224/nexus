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
    primary: `bg-nexus-green text-black hover:shadow-[0_0_16px_rgba(68,214,44,0.5)] active:scale-[0.99] active:shadow-[0_0_24px_rgba(68,214,44,0.7)]`,
    ghost: `bg-transparent text-nexus-green border border-nexus-green hover:bg-nexus-green/10 hover:shadow-[0_0_12px_rgba(68,214,44,0.3)] active:bg-nexus-green/20`,
    tactical: `bg-transparent text-nexus-text border border-nexus-border hover:border-nexus-green/40 hover:text-nexus-green`,
    locked: `bg-nexus-surface2 text-nexus-muted border border-nexus-border cursor-not-allowed opacity-50`,
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
