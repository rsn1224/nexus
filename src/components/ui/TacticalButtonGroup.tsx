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
    <div className={`flex border border-nexus-border ${className}`}>
      {options.map((option, index) => (
        <button
          type="button"
          key={option}
          onClick={() => onChange(option)}
          className={`
            flex-1 px-3 py-2 font-mono text-xs uppercase transition-colors duration-150
            ${
              active === option
                ? 'bg-nexus-green/20 text-nexus-green border-nexus-green/40'
                : 'text-nexus-label hover:text-nexus-text'
            }
            ${index < options.length - 1 ? 'border-r border-nexus-border' : ''}
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
});
