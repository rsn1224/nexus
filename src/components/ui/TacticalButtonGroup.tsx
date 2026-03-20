import type React from 'react';
import { memo } from 'react';

interface TacticalButtonGroupProps {
  options: string[]; // ['L-CMD', 'R-CMD']
  active: string;
  onChange: (val: string) => void;
  className?: string;
}

export const TacticalButtonGroup = memo(function TacticalButtonGroup({
  options,
  active,
  onChange,
  className = '',
}: TacticalButtonGroupProps): React.ReactElement {
  return (
    <div className={`flex border border-border-subtle ${className}`}>
      {options.map((option, index) => (
        <button
          type="button"
          key={option}
          onClick={() => onChange(option)}
          className={`
            flex-1 px-3 py-2 font-mono text-xs uppercase transition-colors duration-150
            ${
              active === option
                ? 'bg-accent-500/20 text-accent-500 border-accent-500/40'
                : 'text-text-secondary hover:text-text-primary'
            }
            ${index < options.length - 1 ? 'border-r border-border-subtle' : ''}
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
});
