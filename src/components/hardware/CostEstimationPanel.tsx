import type React from 'react';
import type { MonthlyCostEstimate } from '../../types';

interface CostEstimationPanelProps {
  costEstimate: MonthlyCostEstimate;
  hoursPerDay: number;
  onHoursPerDayChange: (value: number) => void;
}

export default function CostEstimationPanel({
  costEstimate,
  hoursPerDay,
  onHoursPerDayChange,
}: CostEstimationPanelProps): React.ReactElement {
  return (
    <div className="mb-4">
      <h4 className="text-text-primary text-[12px] mb-2">MONTHLY COST ESTIMATE</h4>
      <div className="p-3 bg-base-800 rounded">
        <div className="mb-3">
          <div className="text-text-secondary text-[10px] mb-1">HOURS PER DAY</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={hoursPerDay}
              onChange={(e) => onHoursPerDayChange(Number(e.target.value))}
              aria-label="プレイ時間（時間/日）"
              className="flex-1"
            />
            <span className="text-text-primary text-[11px] font-bold min-w-[40px] text-right">
              {hoursPerDay}h
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-text-secondary text-[10px]">NORMAL MODE</div>
            <div className="text-text-primary text-[11px] font-bold">
              ¥{costEstimate.normalMonthlyYen.toFixed(0)}
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-[10px]">ECO MODE</div>
            <div className="text-success-500 text-[11px] font-bold">
              ¥{costEstimate.ecoMonthlyYen.toFixed(0)}
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-base-800">
          <div>
            <div className="text-text-secondary text-[10px]">SAVINGS</div>
            <div
              className={`${costEstimate.savingsYen > 0 ? 'text-success-500' : 'text-text-secondary'} text-[12px] font-bold`}
            >
              ¥{costEstimate.savingsYen.toFixed(0)}/month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
