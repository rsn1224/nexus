import type React from 'react';
import { progressWidth } from '../../lib/styles';
import type { AdvisorResult } from '../../types';
import Button from '../ui/Button';

interface AdvisorScoreCardProps {
  advisorResult: AdvisorResult;
  onApplyAllSafe: () => void;
  onRefresh: () => void;
}

const scoreTextClass = (score: number) => {
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-accent-500';
  return 'text-danger-500';
};

export default function AdvisorScoreCard({
  advisorResult,
  onApplyAllSafe,
  onRefresh,
}: AdvisorScoreCardProps): React.ReactElement {
  const safeCount = advisorResult.recommendations.filter((r) => r.safetyLevel === 'safe').length;

  return (
    <div className="mb-4">
      <h3 className="text-text-primary text-[14px] mb-2">SETTINGS OPTIMIZATION ADVISOR</h3>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-secondary text-xs">OPTIMIZATION SCORE</span>
          <span className={`${scoreTextClass(advisorResult.optimizationScore)} text-xs font-bold`}>
            {advisorResult.optimizationScore}%
          </span>
        </div>
        <div className="w-full h-1 bg-base-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-[width] duration-300 ${
              advisorResult.optimizationScore >= 80
                ? 'bg-success-500'
                : advisorResult.optimizationScore >= 60
                  ? 'bg-accent-500'
                  : 'bg-danger-500'
            }`}
            style={progressWidth(advisorResult.optimizationScore)}
          />
        </div>
      </div>

      <div className="p-2 bg-base-800 rounded-lg mb-3">
        <div className="text-text-secondary text-xs mb-1">HARDWARE SUMMARY</div>
        <div className="text-text-primary text-xs">{advisorResult.hardwareSummary}</div>
      </div>

      {advisorResult.warnings.length > 0 && (
        <div className="mb-3">
          <div className="text-accent-500 text-xs mb-1">WARNINGS:</div>
          {advisorResult.warnings.map((warning) => (
            <div
              key={`warning-${warning.substring(0, 30)}`}
              className="text-accent-500 text-xs mb-0.5"
            >
              • {warning}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <Button
          variant={safeCount > 0 ? 'primary' : 'ghost'}
          size="sm"
          onClick={onApplyAllSafe}
          disabled={safeCount === 0}
        >
          APPLY ALL SAFE ({safeCount})
        </Button>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          REFRESH
        </Button>
      </div>
    </div>
  );
}
