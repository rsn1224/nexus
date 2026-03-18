import type React from 'react';
import { useEffect, useState } from 'react';
import { useEcoModeStore } from '../../stores/useEcoModeStore';
import type { EcoModeConfig } from '../../types';
import Button from '../ui/Button';

const EcoModePanel: React.FC = () => {
  const {
    config,
    powerEstimate,
    costEstimate,
    isLoading,
    error,
    fetchConfig,
    saveConfig,
    toggleEcoMode,
    fetchPowerEstimate,
    fetchCostEstimate,
  } = useEcoModeStore();

  const [hoursPerDay, setHoursPerDay] = useState(3.0);
  const [tempConfig, setTempConfig] = useState<EcoModeConfig | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchPowerEstimate();
  }, [fetchConfig, fetchPowerEstimate]);

  useEffect(() => {
    if (config) {
      setTempConfig(config);
      fetchCostEstimate(hoursPerDay);
    }
  }, [config, hoursPerDay, fetchCostEstimate]);

  const handleToggleEcoMode = async () => {
    if (!config) return;
    await toggleEcoMode(!config.enabled);
  };

  const handleSaveConfig = async () => {
    if (!tempConfig) return;
    await saveConfig(tempConfig);
  };

  const handleTargetFpsChange = (value: number) => {
    if (!tempConfig) return;
    setTempConfig({ ...tempConfig, targetFps: value });
  };

  const handlePowerPlanChange = (plan: string) => {
    if (!tempConfig) return;
    setTempConfig({ ...tempConfig, ecoPowerPlan: plan });
  };

  const handleElectricityRateChange = (rate: number) => {
    if (!tempConfig) return;
    setTempConfig({ ...tempConfig, electricityRateYen: rate });
  };

  if (error) {
    return (
      <div className="p-4">
        <div className="text-danger-500 mb-2 text-[10px]">ERROR: {error}</div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            fetchConfig();
            fetchPowerEstimate();
          }}
          aria-label="エコモード設定を再読み込み"
        >
          RETRY
        </Button>
      </div>
    );
  }

  if (!config || !powerEstimate || !tempConfig) {
    return (
      <div className="p-4 text-center">
        <div className="text-text-secondary text-[10px]">LOADING...</div>
      </div>
    );
  }

  const isDirty = JSON.stringify(tempConfig) !== JSON.stringify(config);
  const totalColor = powerEstimate.totalEstimatedW > 400 ? 'text-accent-500' : 'text-success-500';

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-text-primary text-[14px] mb-2">ECO MODE & POWER MANAGEMENT</h3>
      </div>

      {/* Current Power Estimate */}
      <div className="mb-4">
        <h4 className="text-text-primary text-[12px] mb-2">CURRENT POWER CONSUMPTION</h4>
        <div className="p-3 bg-base-800 rounded">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <div className="text-text-secondary text-[10px]">CPU</div>
              <div className="text-text-primary text-[11px] font-bold">
                {powerEstimate.cpuPowerW.toFixed(1)}W
              </div>
            </div>
            <div>
              <div className="text-text-secondary text-[10px]">GPU</div>
              <div className="text-text-primary text-[11px] font-bold">
                {powerEstimate.gpuActualPowerW || powerEstimate.gpuPowerW.toFixed(1)}W
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-base-800">
            <div>
              <div className="text-text-secondary text-[10px]">TOTAL</div>
              <div className={`${totalColor} text-[12px] font-bold`}>
                {powerEstimate.totalEstimatedW.toFixed(1)}W
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPowerEstimate}
              disabled={isLoading}
              aria-label="電力消費量を更新"
            >
              REFRESH
            </Button>
          </div>
        </div>
      </div>

      {/* Eco Mode Toggle */}
      <div className="mb-4">
        <h4 className="text-text-primary text-[12px] mb-2">ECO MODE</h4>
        <div className="p-3 bg-base-800 rounded">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-text-primary text-[11px] font-bold">ENABLE ECO MODE</div>
              <div className="text-text-secondary text-[10px]">
                Reduce power consumption and FPS limits
              </div>
            </div>
            <Button
              variant={config.enabled ? 'primary' : 'ghost'}
              size="sm"
              onClick={handleToggleEcoMode}
              aria-label={`エコモードを${config.enabled ? '無効' : '有効'}にする`}
              disabled={isLoading}
            >
              {config.enabled ? 'ENABLED' : 'DISABLED'}
            </Button>
          </div>

          {/* FPS Limit */}
          <div className="mb-3">
            <div className="text-text-secondary text-[10px] mb-1">TARGET FPS LIMIT</div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="30"
                max="144"
                step="15"
                value={tempConfig.targetFps}
                onChange={(e) => handleTargetFpsChange(Number(e.target.value))}
                disabled={!config.enabled}
                aria-label="ターゲット FPS"
                className="flex-1"
              />
              <span
                className={`${config.enabled ? 'text-text-primary' : 'text-text-muted'} text-[11px] font-bold min-w-[40px] text-right`}
              >
                {tempConfig.targetFps}
              </span>
            </div>
          </div>

          {/* Power Plan */}
          <div className="mb-3">
            <div className="text-text-secondary text-[10px] mb-1">POWER PLAN</div>
            <select
              value={tempConfig.ecoPowerPlan}
              onChange={(e) => handlePowerPlanChange(e.target.value)}
              disabled={!config.enabled}
              aria-label="電力プラン"
              className={`w-full px-2 py-1 ${config.enabled ? 'bg-base-900 text-text-primary' : 'bg-base-800 text-text-muted'} border border-base-800 rounded text-[10px]`}
            >
              <option value="Balanced">Balanced</option>
              <option value="Power Saver">Power Saver</option>
              <option value="High Performance">High Performance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cost Estimation */}
      {costEstimate && (
        <div className="mb-4">
          <h4 className="text-text-primary text-[12px] mb-2">MONTHLY COST ESTIMATE</h4>
          <div className="p-3 bg-base-800 rounded">
            {/* Play Time Input */}
            <div className="mb-3">
              <div className="text-text-secondary text-[10px] mb-1">HOURS PER DAY</div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  aria-label="プレイ時間（時間/日）"
                  className="flex-1"
                />
                <span className="text-text-primary text-[11px] font-bold min-w-[40px] text-right">
                  {hoursPerDay}h
                </span>
              </div>
            </div>

            {/* Cost Comparison */}
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
      )}

      {/* Configuration */}
      <div className="mb-4">
        <h4 className="text-text-primary text-[12px] mb-2">CONFIGURATION</h4>
        <div className="p-3 bg-base-800 rounded">
          {/* Electricity Rate */}
          <div className="mb-3">
            <div className="text-text-secondary text-[10px] mb-1">ELECTRICITY RATE (¥/kWh)</div>
            <input
              type="number"
              min="10"
              max="50"
              step="1"
              value={tempConfig.electricityRateYen}
              onChange={(e) => handleElectricityRateChange(Number(e.target.value))}
              aria-label="電気料金（円/kWh）"
              className="w-full px-2 py-1 bg-base-900 text-text-primary border border-base-800 rounded text-[10px]"
            />
          </div>

          {/* Save Button */}
          <Button
            variant={isDirty ? 'primary' : 'ghost'}
            size="sm"
            fullWidth
            onClick={handleSaveConfig}
            disabled={isLoading || !isDirty}
            aria-label="エコモード設定を保存"
          >
            {isDirty ? 'SAVE CONFIG' : 'NO CHANGES'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EcoModePanel;
