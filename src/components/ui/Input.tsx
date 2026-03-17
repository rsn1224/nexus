import type React from 'react';

interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  className?: string;
  id?: string;
  name?: string;
  onChange?: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  step?: string | number;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  autoComplete?: string;
}

export default function Input({
  type = 'text',
  value,
  defaultValue,
  placeholder,
  disabled = false,
  required = false,
  error = false,
  className = '',
  id,
  name,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  onKeyUp,
  maxLength,
  minLength,
  pattern,
  min,
  max,
  step,
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  ariaLabel,
  ariaDescribedBy,
  autoComplete,
}: InputProps): React.ReactElement {
  const baseClasses =
    'font-[var(--font-mono)] border transition-all duration-150 focus:outline-none focus:ring-2';

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-1',
    md: 'text-[11px] px-3 py-2',
    lg: 'text-[12px] px-4 py-3',
  };

  const stateClasses = {
    default:
      'border-[var(--color-border-subtle)] bg-[var(--color-base-800)] text-[var(--color-text-primary)] focus:border-[var(--color-accent-500)] focus:ring-[var(--color-accent-500)] focus:ring-opacity-50',
    error:
      'border-[var(--color-danger-500)] bg-[var(--color-base-800)] text-[var(--color-text-primary)] focus:border-[var(--color-danger-500)] focus:ring-[var(--color-danger-500)] focus:ring-opacity-50',
    disabled:
      'border-[var(--color-border-subtle)] bg-[var(--color-base-700)] text-[var(--color-text-muted)] cursor-not-allowed',
  };

  const iconClasses = {
    withLeft: leftIcon ? 'pl-8' : '',
    withRight: rightIcon ? 'pr-8' : '',
  };

  const fullWidthClasses = fullWidth ? 'w-full' : '';
  const disabledClasses = disabled
    ? stateClasses.disabled
    : error
      ? stateClasses.error
      : stateClasses.default;

  const classes = `${baseClasses} ${sizeClasses[size]} ${disabledClasses} ${iconClasses.withLeft} ${iconClasses.withRight} ${fullWidthClasses} ${className}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`relative inline-block ${fullWidth ? 'w-full' : ''}`}>
      {leftIcon && (
        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
          {leftIcon}
        </div>
      )}

      <input
        type={type}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={classes}
        id={id}
        name={name}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? 'true' : undefined}
        autoComplete={autoComplete}
      />

      {rightIcon && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
  );
}
