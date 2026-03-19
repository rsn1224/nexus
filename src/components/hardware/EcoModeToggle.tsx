import type React from 'react';
import type { EcoModeConfig } from '../../types';
import Button from '../ui/Button';

interface EcoModeToggleProps {
  config: EcoModeConfig;
  tempConfig: EcoModeConfig;
  isLoading: boolean;
  onToggle: () => void;
  onTargetFpsChange: (value: number) => void;
  onPowerPlanChange: (plan: string) => void;
}

export default function EcoModeToggle({
  config,
  tempConfig,
  isLoading,
  onToggle,
  onTargetFpsChange,
  onPowerPlanChange,
}: EcoModeToggleProps): React.ReactElement {
  return (
    <div className="mb-4">
      <h4 className="text-text-primary text-[12px] mb-2">ECO MODE</h4>
      <div className="p-3 bg-base-800 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-text-primary text-xs font-bold">ENABLE ECO MODE</div>
            <div className="text-text-secondary text-xs">
              Reduce power consumption and FPS limits
            </div>
          </div>
          <Button
            variant={config.enabled ? 'primary' : 'ghost'}
            size="sm"
            onClick={onToggle}
            aria-label={`エコモードを${config.enabled ? '無効' : '有効'}にする`}
            disabled={isLoading}
          >
            {config.enabled ? 'ENABLED' : 'DISABLED'}
          </Button>
        </div>

        <div className="mb-3">
          <div className="text-text-secondary text-xs mb-1">TARGET FPS LIMIT</div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="30"
              max="144"
              step="15"
              value={tempConfig.targetFps}
              onChange={(e) => onTargetFpsChange(Number(e.target.value))}
              disabled={!config.enabled}
              aria-label="ターゲット FPS"
              className="flex-1"
            />
            <span
              className={`${config.enabled ? 'text-text-primary' : 'text-text-muted'} text-xs font-bold min-w-[40px] text-right`}
            >
              {tempConfig.targetFps}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="text-text-secondary text-xs mb-1">POWER PLAN</div>
          <select
            value={tempConfig.ecoPowerPlan}
            onChange={(e) => onPowerPlanChange(e.target.value)}
            disabled={!config.enabled}
            aria-label="電力プラン"
            className={`w-full px-2 py-1 ${config.enabled ? 'bg-base-900 text-text-primary' : 'bg-base-800 text-text-muted'} border border-base-800 rounded-lg text-xs`}
          >
            <option value="Balanced">Balanced</option>
            <option value="Power Saver">Power Saver</option>
            <option value="High Performance">High Performance</option>
          </select>
        </div>
      </div>
    </div>
  );
}
