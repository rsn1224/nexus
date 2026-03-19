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

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;

    // Ripple エフェクト作成
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple: Ripple = {
      x,
      y,
      id: rippleIdRef.current++,
    };

    setRipples((prev) => [...prev, newRipple]);

    // 600ms後にrippleを削除
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  const base =
    'px-6 py-2.5 font-bold uppercase tracking-widest text-sm transition-all duration-150 font-sans relative overflow-hidden';

  const variants = {
    primary: `bg-nexus-green text-black hover:shadow-[0_0_16px_rgba(68,214,44,0.5)] active:scale-[0.99] active:shadow-[0_0_24px_rgba(68,214,44,0.7)]`,
    ghost: `bg-transparent text-nexus-green border border-nexus-green hover:bg-nexus-green/10 hover:shadow-[0_0_12px_rgba(68,214,44,0.3)] active:bg-nexus-green/20`,
    tactical: `bg-transparent text-nexus-text border border-nexus-border hover:border-nexus-green/40 hover:text-nexus-green`,
    locked: `bg-nexus-surface2 text-nexus-muted border border-nexus-border cursor-not-allowed opacity-50`,
  };

  const isDisabled = disabled || variant === 'locked';

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${base} ${variants[variant]} ${className} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}

      {children}
    </button>
  );
});
