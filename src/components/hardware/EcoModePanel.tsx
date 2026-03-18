import type React from 'react';
import { useEffect, useState } from 'react';
import { useEcoModeStore } from '../../stores/useEcoModeStore';
import type { EcoModeConfig } from '../../types';

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
      <div style={{ padding: '16px' }}>
        <div style={{ color: 'var(--color-danger-500)', marginBottom: '8px' }}>ERROR: {error}</div>
        <button
          type="button"
          onClick={() => {
            fetchConfig();
            fetchPowerEstimate();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-accent-500)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px',
          }}
        >
          RETRY
        </button>
      </div>
    );
  }

  if (!config || !powerEstimate || !tempConfig) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>LOADING...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ color: 'var(--color-text-primary)', fontSize: '14px', marginBottom: '8px' }}>
          ECO MODE & POWER MANAGEMENT
        </h3>
      </div>

      {/* Current Power Estimate */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: 'var(--color-text-primary)', fontSize: '12px', marginBottom: '8px' }}>
          CURRENT POWER CONSUMPTION
        </h4>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>CPU</div>
              <div
                style={{ color: 'var(--color-text-primary)', fontSize: '11px', fontWeight: 'bold' }}
              >
                {powerEstimate.cpuPowerW.toFixed(1)}W
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>GPU</div>
              <div
                style={{ color: 'var(--color-text-primary)', fontSize: '11px', fontWeight: 'bold' }}
              >
                {powerEstimate.gpuActualPowerW || powerEstimate.gpuPowerW.toFixed(1)}W
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '8px',
              borderTop: '1px solid var(--color-surface)',
            }}
          >
            <div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>TOTAL</div>
              <div
                style={{
                  color:
                    powerEstimate.totalEstimatedW > 400
                      ? 'var(--color-warning-500)'
                      : 'var(--color-success-500)',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {powerEstimate.totalEstimatedW.toFixed(1)}W
              </div>
            </div>
            <button
              type="button"
              onClick={fetchPowerEstimate}
              disabled={isLoading}
              style={{
                padding: '4px 8px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              REFRESH
            </button>
          </div>
        </div>
      </div>

      {/* Eco Mode Toggle */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: 'var(--color-text-primary)', fontSize: '12px', marginBottom: '8px' }}>
          ECO MODE
        </h4>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <div>
              <div
                style={{ color: 'var(--color-text-primary)', fontSize: '11px', fontWeight: 'bold' }}
              >
                ENABLE ECO MODE
              </div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                Reduce power consumption and FPS limits
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleEcoMode}
              disabled={isLoading}
              style={{
                padding: '6px 12px',
                backgroundColor: config.enabled
                  ? 'var(--color-success-500)'
                  : 'var(--color-surface)',
                color: config.enabled ? 'var(--color-background)' : 'var(--color-text-primary)',
                border: config.enabled ? 'none' : '1px solid var(--color-text-muted)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              {config.enabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* FPS Limit */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '10px',
                marginBottom: '4px',
              }}
            >
              TARGET FPS LIMIT
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="30"
                max="144"
                step="15"
                value={tempConfig.targetFps}
                onChange={(e) => handleTargetFpsChange(Number(e.target.value))}
                disabled={!config.enabled}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  color: config.enabled ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '40px',
                  textAlign: 'right',
                }}
              >
                {tempConfig.targetFps}
              </span>
            </div>
          </div>

          {/* Power Plan */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '10px',
                marginBottom: '4px',
              }}
            >
              POWER PLAN
            </div>
            <select
              value={tempConfig.ecoPowerPlan}
              onChange={(e) => handlePowerPlanChange(e.target.value)}
              disabled={!config.enabled}
              style={{
                width: '100%',
                padding: '4px 8px',
                backgroundColor: config.enabled
                  ? 'var(--color-background)'
                  : 'var(--color-surface)',
                color: config.enabled ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: '1px solid var(--color-surface)',
                borderRadius: '4px',
                fontSize: '10px',
              }}
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
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ color: 'var(--color-text-primary)', fontSize: '12px', marginBottom: '8px' }}>
            MONTHLY COST ESTIMATE
          </h4>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '4px',
            }}
          >
            {/* Play Time Input */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '10px',
                  marginBottom: '4px',
                }}
              >
                HOURS PER DAY
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    minWidth: '40px',
                    textAlign: 'right',
                  }}
                >
                  {hoursPerDay}h
                </span>
              </div>
            </div>

            {/* Cost Comparison */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                  NORMAL MODE
                </div>
                <div
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  ¥{costEstimate.normalMonthlyYen.toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                  ECO MODE
                </div>
                <div
                  style={{
                    color: 'var(--color-success-500)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  ¥{costEstimate.ecoMonthlyYen.toFixed(0)}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid var(--color-surface)',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                  SAVINGS
                </div>
                <div
                  style={{
                    color:
                      costEstimate.savingsYen > 0
                        ? 'var(--color-success-500)'
                        : 'var(--color-text-secondary)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  ¥{costEstimate.savingsYen.toFixed(0)}/month
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ color: 'var(--color-text-primary)', fontSize: '12px', marginBottom: '8px' }}>
          CONFIGURATION
        </h4>
        <div
          style={{
            padding: '12px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: '4px',
          }}
        >
          {/* Electricity Rate */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '10px',
                marginBottom: '4px',
              }}
            >
              ELECTRICITY RATE (¥/kWh)
            </div>
            <input
              type="number"
              min="10"
              max="50"
              step="1"
              value={tempConfig.electricityRateYen}
              onChange={(e) => handleElectricityRateChange(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '4px 8px',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-surface)',
                borderRadius: '4px',
                fontSize: '10px',
              }}
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isLoading || JSON.stringify(tempConfig) === JSON.stringify(config)}
            style={{
              padding: '6px 12px',
              backgroundColor:
                JSON.stringify(tempConfig) === JSON.stringify(config)
                  ? 'var(--color-surface)'
                  : 'var(--color-accent-500)',
              color:
                JSON.stringify(tempConfig) === JSON.stringify(config)
                  ? 'var(--color-text-muted)'
                  : 'var(--color-background)',
              border: 'none',
              borderRadius: '4px',
              cursor: JSON.stringify(tempConfig) === JSON.stringify(config) ? 'default' : 'pointer',
              fontSize: '10px',
              width: '100%',
            }}
          >
            {JSON.stringify(tempConfig) === JSON.stringify(config) ? 'NO CHANGES' : 'SAVE CONFIG'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcoModePanel;
