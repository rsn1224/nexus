import type React from 'react';
import { memo, useRef, useState } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'tactical' | 'locked';

interface NexusButtonProps {
  variant?: ButtonVariant;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-500 text-base-900 hover:shadow-[0_0_16px_rgba(68,214,44,0.5)] active:scale-[0.99]',
  ghost:
    'bg-transparent text-accent-500 border border-accent-500 hover:bg-accent-500/10 hover:shadow-[0_0_12px_rgba(68,214,44,0.3)]',
  tactical:
    'bg-transparent text-text-primary border border-base-500 hover:border-accent-500/40 hover:text-accent-500',
  locked: 'bg-base-700 text-text-muted border border-base-500 cursor-not-allowed opacity-50',
};

export const NexusButton = memo(function NexusButton({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  className = '',
}: NexusButtonProps): React.ReactElement {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (disabled) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: Ripple = { x, y, id: rippleIdRef.current++ };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  const isDisabled = disabled || variant === 'locked';

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`px-6 py-2.5 font-bold uppercase tracking-widest text-sm transition-all duration-150 relative overflow-hidden ${VARIANTS[variant]} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{ left: ripple.x - 10, top: ripple.y - 10, width: 20, height: 20 }}
        />
      ))}
      {children}
    </button>
  );
});
