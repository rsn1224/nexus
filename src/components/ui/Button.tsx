import type React from 'react';

interface ButtonProps {
  variant: 'primary' | 'ghost' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  tooltip?: string;
}

export default function Button({
  variant,
  size = 'md',
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ariaLabel,
  ariaDescribedBy,
  tooltip,
}: ButtonProps): React.ReactElement {
  const baseClasses =
    'transition-all duration-150 cursor-pointer border inline-flex items-center justify-center gap-1';

  const variantClasses = {
    primary:
      'bg-accent-500 text-base-900 border-accent-500 hover:bg-accent-600 focus:ring-2 focus:ring-accent-500 focus:ring-opacity-50',
    ghost:
      'border border-border-subtle text-text-secondary hover:bg-base-700 focus:ring-2 focus:ring-border-subtle focus:ring-opacity-50',
    danger:
      'bg-danger-500 text-base-900 border-danger-500 hover:bg-danger-600 focus:ring-2 focus:ring-danger-500 focus:ring-opacity-50',
    secondary:
      'border border-border-subtle text-text-primary bg-base-700 hover:bg-base-600 focus:ring-2 focus:ring-border-subtle focus:ring-opacity-50',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-1',
    md: 'text-xs px-3 py-2',
    lg: 'text-[13px] px-4 py-3',
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  const fullWidthClasses = fullWidth ? 'w-full' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${fullWidthClasses} ${className}`;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          {children && <span>{children}</span>}
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          {icon}
          {children}
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          {icon}
        </>
      );
    }

    return children;
  };

  return (
    <button
      data-testid="ui-button"
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading || undefined}
      title={tooltip}
    >
      {renderContent()}
    </button>
  );
}
