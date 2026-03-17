import type React from 'react';

interface ButtonProps {
  variant: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export default function Button({
  variant,
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps): React.ReactElement {
  const baseClasses = 'font-[var(--font-mono)] transition-all duration-150 cursor-pointer border';

  const variantClasses = {
    primary:
      'bg-[var(--color-accent-500)] text-white border-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)]',
    ghost:
      'border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-base-700)]',
    danger:
      'bg-[var(--color-danger-500)] text-white border-[var(--color-danger-500)] hover:bg-[var(--color-danger-600)]',
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-1',
    md: 'text-[11px] px-3 py-2',
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`;

  return (
    <button type="button" className={classes} onClick={onClick} disabled={disabled || loading}>
      {loading ? '...' : children}
    </button>
  );
}
