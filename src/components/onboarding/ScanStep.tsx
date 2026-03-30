import { invoke } from '@tauri-apps/api/core';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import log from '../../lib/logger';
import type { SteamGameSummary } from '../../stores/useOnboardingStore';
import { allTasksFinished, useOnboardingStore } from '../../stores/useOnboardingStore';
import type { AppSettings, HardwareInfo } from '../../types';
import Button from '../ui/Button';

// ============================================================
// SECTION: Task Runner
// ============================================================

function useScanTasks(): void {
  const setTaskStatus = useOnboardingStore((s) => s.setTaskStatus);
  const setScanResult = useOnboardingStore((s) => s.setScanResult);

  useEffect(() => {
    const runTask = async <T,>(
      taskKey: 'hardware' | 'steam' | 'settings',
      command: string,
      onSuccess: (data: T) => void,
    ) => {
      setTaskStatus(taskKey, { status: 'running' });
      try {
        const result = await invoke<T>(command);
        onSuccess(result);
        setTaskStatus(taskKey, { status: 'done' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log.warn({ err }, 'onboarding scan task "%s" failed: %s', command, message);
        setTaskStatus(taskKey, { status: 'error', error: message });
      }
    };

    // Scenario 4: 3 tasks run in parallel
    runTask<HardwareInfo>('hardware', 'get_hardware_info', (data) => {
      setScanResult('hardware', data);
    });

    runTask<SteamGameSummary[]>('steam', 'scan_steam_games', (data) => {
      setScanResult('steamGames', data);
    });

    runTask<AppSettings>('settings', 'get_app_settings', () => {
      setScanResult('settingsLoaded', true);
    });
  }, [setTaskStatus, setScanResult]);
}

// ============================================================
// SECTION: Task Status Display
// ============================================================

const TASK_I18N_KEYS: Record<string, string> = {
  hardware: 'scan.taskHardware',
  steam: 'scan.taskSteam',
  settings: 'scan.taskSettings',
};

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
  idle: { icon: '○', color: 'text-text-muted' },
  running: { icon: '◎', color: 'text-accent-500 animate-pulse' },
  done: { icon: '✓', color: 'text-success-500' },
  error: { icon: '⚠', color: 'text-danger-500' },
};

function TaskRow({ taskKey }: { taskKey: 'hardware' | 'steam' | 'settings' }): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const task = useOnboardingStore((s) => s.tasks[taskKey]);
  const { icon, color } = STATUS_ICONS[task.status];
  const label = t(TASK_I18N_KEYS[taskKey]);

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-b-0">
      <span className="text-xs text-text-secondary">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm ${color}`}>{icon}</span>
        {task.status === 'error' && (
          <span className="text-xs text-danger-500 max-w-[180px] truncate" title={task.error}>
            {task.error}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SECTION: ScanStep Component
// ============================================================

export default function ScanStep(): React.ReactElement {
  useScanTasks();

  const { t } = useTranslation('onboarding');
  const tasks = useOnboardingStore((s) => s.tasks);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const finished = allTasksFinished(tasks);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="text-sm font-bold text-text-primary uppercase tracking-wider">
          {t('scan.title')}
        </div>
        <div className="text-xs text-text-muted">{t('scan.subtitle')}</div>
      </div>

      <div className="bg-base-800/60 rounded-lg p-3">
        <TaskRow taskKey="hardware" />
        <TaskRow taskKey="steam" />
        <TaskRow taskKey="settings" />
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={nextStep} disabled={!finished}>
        {finished ? t('scan.next') : t('scan.scanning')}
      </Button>
    </div>
  );
}
