import type React from 'react';
import { useTranslation } from 'react-i18next';
import type { WindowsSettings } from '../../types';
import { Button } from '../ui';

interface GamingSectionProps {
  settings: WindowsSettings | null;
  isLoading: boolean;
  onToggleGameMode: () => void;
  onToggleFullscreenOptimization: () => void;
  onToggleHardwareGpuScheduling: () => void;
}

export default function GamingSection({
  settings,
  isLoading,
  onToggleGameMode,
  onToggleFullscreenOptimization,
  onToggleHardwareGpuScheduling,
}: GamingSectionProps): React.ReactElement {
  const { t } = useTranslation(['settings', 'common']);
  return (
    <div className="bg-base-800 border border-border-subtle rounded-lg p-3">
      <div className="text-xs text-text-muted mb-2">{t('settings:windows.gaming')}</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-secondary">{t('settings:windows.gameMode')}</div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${settings?.gameMode ? 'bg-success-500' : 'bg-text-muted'}`}
            />
            <span className="text-xs text-text-primary">
              {settings?.gameMode ? t('common:enabled') : t('common:disabled')}
            </span>
            <Button variant="secondary" size="sm" onClick={onToggleGameMode} disabled={isLoading}>
              {t('common:toggle')}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-secondary">{t('settings:windows.fullscreenOpt')}</div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${settings?.fullscreenOptimization ? 'bg-success-500' : 'bg-text-muted'}`}
            />
            <span className="text-xs text-text-primary">
              {settings?.fullscreenOptimization ? t('common:enabled') : t('common:disabled')}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleFullscreenOptimization}
              disabled={isLoading}
            >
              {t('common:toggle')}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-text-secondary">{t('settings:windows.gpuScheduling')}</div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${settings?.hardwareGpuScheduling ? 'bg-success-500' : 'bg-text-muted'}`}
            />
            <span className="text-xs text-text-primary">
              {settings?.hardwareGpuScheduling ? t('common:enabled') : t('common:disabled')}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleHardwareGpuScheduling}
              disabled={isLoading}
            >
              {t('common:toggle')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
