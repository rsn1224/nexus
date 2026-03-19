import type React from 'react';
import { memo } from 'react';

interface ToggleV2Props {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Toggle Switch v2 — Stitch Inspect 確定値
 * サイズ: 56×28px / ノブ: 20×20px / カラー: accent-500 (#44D62C)
 */
export const ToggleV2 = memo(function ToggleV2({
  enabled,
  onToggle,
  label,
  disabled = false,
  className = '',
}: ToggleV2Props): React.ReactElement {
  return (
    <label
      className={`flex items-center gap-3 select-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        disabled={disabled}
        className={[
          'relative w-14 h-7 rounded-full border transition-all duration-200',
          enabled
            ? 'bg-accent-500/20 border-accent-500/60 shadow-[0_0_10px_rgba(68,214,44,0.4)]'
            : 'bg-base-700 border-base-500',
          disabled ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-[4px] w-5 h-5 rounded-full transition-transform duration-200',
            enabled
              ? 'bg-accent-500 translate-x-[32px] shadow-[0_0_6px_rgba(68,214,44,0.6)]'
              : 'bg-text-muted translate-x-[4px]',
          ].join(' ')}
        />
      </button>
      {label && (
        <span className="text-xs text-text-secondary uppercase tracking-widest">{label}</span>
      )}
    </label>
  );
});
