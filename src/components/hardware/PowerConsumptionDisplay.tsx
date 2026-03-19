import type React from 'react';
import type { PowerEstimate } from '../../types';
import Button from '../ui/Button';

interface PowerConsumptionDisplayProps {
  powerEstimate: PowerEstimate;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function PowerConsumptionDisplay({
  powerEstimate,
  isLoading,
  onRefresh,
}: PowerConsumptionDisplayProps): React.ReactElement {
  const totalColor = powerEstimate.totalEstimatedW > 400 ? 'text-accent-500' : 'text-success-500';

  return (
    <div className="mb-4">
      <h4 className="text-text-primary text-[12px] mb-2">CURRENT POWER CONSUMPTION</h4>
      <div className="p-3 bg-base-800 rounded-lg">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <div className="text-text-secondary text-xs">CPU</div>
            <div className="text-text-primary text-xs font-bold">
              {powerEstimate.cpuPowerW.toFixed(1)}W
            </div>
          </div>
          <div>
            <div className="text-text-secondary text-xs">GPU</div>
            <div className="text-text-primary text-xs font-bold">
              {powerEstimate.gpuActualPowerW || powerEstimate.gpuPowerW.toFixed(1)}W
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-base-800">
          <div>
            <div className="text-text-secondary text-xs">TOTAL</div>
            <div className={`${totalColor} text-[12px] font-bold`}>
              {powerEstimate.totalEstimatedW.toFixed(1)}W
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="電力消費量を更新"
          >
            REFRESH
          </Button>
        </div>
      </div>
    </div>
  );
}
