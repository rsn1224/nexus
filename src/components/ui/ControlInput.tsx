import type React from 'react';
import { memo } from 'react';

interface ControlInputProps {
  label: string;
  value?: string;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: string[];
  onChange?: (value: string) => void;
  className?: string;
}

export const ControlInput = memo(function ControlInput({
  label,
  value,
  placeholder,
  type = 'text',
  options,
  onChange,
  className = '',
}: ControlInputProps): React.ReactElement {
  const baseInput =
    'bg-base-700 border border-border-subtle text-accent-500 font-mono text-sm px-3 py-2 w-full focus:border-accent-500/60 focus:outline-none focus:shadow-[0_0_8px_rgba(68,214,44,0.2)] transition-all duration-150';

  return (
    <div className={className}>
      {/* Label */}
      <div className="font-mono text-xs text-text-secondary uppercase mb-1">{label}</div>

      {/* Input Field */}
      {type === 'select' ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={`${baseInput} appearance-none pr-8`}
          >
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {/* Dropdown Arrow */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-accent-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="dropdown"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          className={baseInput}
        />
      )}
    </div>
  );
});
