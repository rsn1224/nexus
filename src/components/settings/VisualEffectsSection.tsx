import type React from 'react';
import { VisualEffects } from '../../types';
import { Button } from '../ui';

interface VisualEffectsSectionProps {
  pendingVisualEffects: VisualEffects;
  isLoading: boolean;
  onPendingChange: (effect: VisualEffects) => void;
  onApply: () => void;
}

export default function VisualEffectsSection({
  pendingVisualEffects,
  isLoading,
  onPendingChange,
  onApply,
}: VisualEffectsSectionProps): React.ReactElement {
  return (
    <div className="bg-base-800 border border-border-subtle rounded p-3">
      <div className="text-[10px] text-text-muted mb-2">VISUAL</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-text-secondary">Visual Effects</div>
          <div className="flex items-center gap-2">
            <select
              value={pendingVisualEffects}
              title="Visual Effects"
              onChange={(e) => onPendingChange(e.target.value as VisualEffects)}
              className="bg-base-700 border border-border-subtle text-text-primary font-mono text-[11px] px-2 py-1 rounded"
            >
              <option value={VisualEffects.BestPerformance}>Best Performance</option>
              <option value={VisualEffects.Balanced}>Balanced</option>
              <option value={VisualEffects.BestAppearance}>Best Appearance</option>
            </select>
            <Button variant="secondary" size="sm" onClick={onApply} disabled={isLoading}>
              APPLY
            </Button>
          </div>
        </div>
        <div className="text-[10px] text-text-muted">
          (Best Performance / Balanced / Best Appearance)
        </div>
      </div>
    </div>
  );
}
