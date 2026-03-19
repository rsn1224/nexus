import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useEcoModeStore } from '../../stores/useEcoModeStore';
import type { EcoModeConfig } from '../../types';
import Button from '../ui/Button';
import CostEstimationPanel from './CostEstimationPanel';
import EcoModeToggle from './EcoModeToggle';
import PowerConsumptionDisplay from './PowerConsumptionDisplay';

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
  const prevConfigRef = useRef<string | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchPowerEstimate();
  }, [fetchConfig, fetchPowerEstimate]);

  useEffect(() => {
    if (!config) return;
    const json = JSON.stringify(config);
    if (json === prevConfigRef.current) return;
    prevConfigRef.current = json;
    setTempConfig(config);
    fetchCostEstimate(hoursPerDay);
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

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-text-primary text-[14px] mb-2">ECO MODE & POWER MANAGEMENT</h3>
      </div>

      <PowerConsumptionDisplay
        powerEstimate={powerEstimate}
        isLoading={isLoading}
        onRefresh={fetchPowerEstimate}
      />

      <EcoModeToggle
        config={config}
        tempConfig={tempConfig}
        isLoading={isLoading}
        onToggle={handleToggleEcoMode}
        onTargetFpsChange={handleTargetFpsChange}
        onPowerPlanChange={handlePowerPlanChange}
      />

      {costEstimate && (
        <CostEstimationPanel
          costEstimate={costEstimate}
          hoursPerDay={hoursPerDay}
          onHoursPerDayChange={setHoursPerDay}
        />
      )}

      <div className="mb-4">
        <h4 className="text-text-primary text-[12px] mb-2">CONFIGURATION</h4>
        <div className="p-3 bg-base-800 rounded">
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
