import { Check } from 'lucide-react';
import type React from 'react';
import { cn } from '../../lib/cn';

interface OptimizationRowProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (id: string) => void;
  isLast?: boolean;
  result?: 'success' | 'failed' | null;
}

export function OptimizationRow({
  id,
  label,
  checked,
  onToggle,
  isLast = false,
  result = null,
}: OptimizationRowProps): React.ReactElement {
  return (
    <label
      htmlFor={`opt-row-${id}`}
      className={cn(
        'flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-opacity',
        !isLast && 'border-b border-dashed border-border-subtle',
        checked ? 'opacity-100' : 'opacity-60 hover:opacity-80',
        result === 'success' && 'border-l-2 border-success-500',
        result === 'failed' && 'border-l-2 border-danger-500',
      )}
    >
      <input
        type="checkbox"
        id={`opt-row-${id}`}
        checked={checked}
        onChange={() => onToggle(id)}
        className="sr-only"
      />
      <div
        aria-hidden="true"
        className={cn(
          'w-4 h-4 flex items-center justify-center rounded-[2px] shrink-0 transition-colors',
          checked ? 'bg-accent-500' : 'border border-border-subtle bg-transparent',
        )}
      >
        {checked && <Check className="w-3 h-3 text-base-950" strokeWidth={3} />}
      </div>

      <span className="text-[12px] font-mono text-text-primary">{label}</span>
    </label>
  );
}

export default OptimizationRow;
