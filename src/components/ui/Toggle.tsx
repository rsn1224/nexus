import type React from 'react';
import { memo } from 'react';

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Toggle Switch v1 — 40×20px compact variant */
export const Toggle = memo(function Toggle({
  enabled,
  onToggle,
  label,
  disabled = false,
  className = '',
}: ToggleProps): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`relative flex items-center gap-2 ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={[
          'w-10 h-5 rounded-full border transition-all duration-200',
          enabled ? 'bg-accent-500/20 border-accent-500/60' : 'bg-base-700 border-base-500',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200',
            enabled
              ? 'bg-accent-500 translate-x-5 shadow-[0_0_6px_rgba(68,214,44,0.6)]'
              : 'bg-text-muted translate-x-0.5',
          ].join(' ')}
        />
      </span>
      {label && (
        <span className="text-xs text-text-secondary uppercase tracking-widest">{label}</span>
      )}
    </button>
  );
});

// Checkbox variant
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const Checkbox = memo(function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}: CheckboxProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`flex items-center gap-2 ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      <span
        className={[
          'w-4 h-4 border rounded transition-all duration-150 flex items-center justify-center',
          checked
            ? 'bg-accent-500/20 border-accent-500 text-accent-500'
            : 'bg-transparent border-base-500',
        ].join(' ')}
      >
        {checked && (
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
            role="img"
            aria-label="checked"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      {label && (
        <span className="text-xs text-text-secondary uppercase tracking-widest">{label}</span>
      )}
    </button>
  );
});
