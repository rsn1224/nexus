import type React from 'react';
import { memo } from 'react';
import Button from '../ui/Button';

interface Props {
  startWithWindows: boolean;
  minimizeToTray: boolean;
  isLoading: boolean;
  onToggleStartWithWindows: () => void;
  onToggleMinimizeToTray: () => void;
}

const AppToggleSection = memo(function AppToggleSection({
  startWithWindows,
  minimizeToTray,
  isLoading,
  onToggleStartWithWindows,
  onToggleMinimizeToTray,
}: Props): React.ReactElement {
  return (
    <div className="glass-panel bloom-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-white/30" aria-hidden="true">
          settings_applications
        </span>
        <h3 className="text-[10px] tracking-widest text-white/60 uppercase">APPLICATION</h3>
      </div>
      <div className="space-y-4">
        <ToggleRow
          label="Start with Windows"
          description="Launch NEXUS on system startup"
          enabled={startWithWindows}
          isLoading={isLoading}
          onToggle={onToggleStartWithWindows}
        />
        <ToggleRow
          label="Minimize to Tray"
          description="Keep running in system tray"
          enabled={minimizeToTray}
          isLoading={isLoading}
          onToggle={onToggleMinimizeToTray}
        />
      </div>
    </div>
  );
});

const ToggleRow = memo(function ToggleRow({
  label,
  description,
  enabled,
  isLoading,
  onToggle,
}: {
  label: string;
  description: string;
  enabled: boolean;
  isLoading: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
      <div>
        <div className="text-xs text-white/60 font-data">{label}</div>
        <div className="text-[9px] text-white/40 mt-1">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-accent-500' : 'bg-white/30'}`} />
        <span className="text-xs text-text-primary font-data">
          {enabled ? 'ENABLED' : 'DISABLED'}
        </span>
        <Button variant="secondary" size="sm" onClick={onToggle} disabled={isLoading}>
          TOGGLE
        </Button>
      </div>
    </div>
  );
});

export default AppToggleSection;
