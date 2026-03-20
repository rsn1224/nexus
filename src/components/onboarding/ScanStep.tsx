import { invoke } from '@tauri-apps/api/core';
import type React from 'react';
import { memo, useEffect, useState } from 'react';
import log from '../../lib/logger';
import { extractErrorMessage } from '../../lib/tauri';

interface ScanTask {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
}

export interface ScanResult {
  steamGames: number;
  hardwareOk: boolean;
  settingsOk: boolean;
}

interface Props {
  onNext: (result: ScanResult) => void;
  onSkip: () => void;
}

async function scanSteamGames(): Promise<number> {
  try {
    const games = await invoke<string[]>('scan_steam_games');
    return games.length;
  } catch {
    // scan_steam_games が未実装の場合はモックで代替
    log.warn('scan_steam_games not available, using mock');
    await new Promise((r) => setTimeout(r, 800));
    return 0;
  }
}

const ScanStep = memo(function ScanStep({ onNext, onSkip }: Props): React.ReactElement {
  const [tasks, setTasks] = useState<ScanTask[]>([
    { label: 'STEAM GAMES', status: 'pending' },
    { label: 'HARDWARE INFO', status: 'pending' },
    { label: 'APP SETTINGS', status: 'pending' },
  ]);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runScan(): Promise<void> {
      const result: ScanResult = { steamGames: 0, hardwareOk: false, settingsOk: false };

      // Task 0: Steam Games
      setTasks((prev) => prev.map((t, i) => (i === 0 ? { ...t, status: 'running' } : t)));
      try {
        const count = await scanSteamGames();
        result.steamGames = count;
        if (!cancelled) {
          setTasks((prev) =>
            prev.map((t, i) =>
              i === 0 ? { ...t, status: 'done', detail: `${count} games found` } : t,
            ),
          );
        }
      } catch {
        if (!cancelled) {
          setTasks((prev) =>
            prev.map((t, i) => (i === 0 ? { ...t, status: 'error', detail: 'Scan failed' } : t)),
          );
        }
      }

      // Task 1: Hardware Info
      if (!cancelled) {
        setTasks((prev) => prev.map((t, i) => (i === 1 ? { ...t, status: 'running' } : t)));
      }
      try {
        await invoke('get_hardware_info');
        result.hardwareOk = true;
        if (!cancelled) {
          setTasks((prev) =>
            prev.map((t, i) => (i === 1 ? { ...t, status: 'done', detail: 'Detected' } : t)),
          );
        }
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'onboarding: hardware scan failed: %s', msg);
        if (!cancelled) {
          setTasks((prev) =>
            prev.map((t, i) => (i === 1 ? { ...t, status: 'error', detail: msg } : t)),
          );
        }
      }

      // Task 2: App Settings
      if (!cancelled) {
        setTasks((prev) => prev.map((t, i) => (i === 2 ? { ...t, status: 'running' } : t)));
      }
      try {
        await invoke('get_app_settings');
        result.settingsOk = true;
        if (!cancelled) {
          setTasks((prev) =>
            prev.map((t, i) => (i === 2 ? { ...t, status: 'done', detail: 'Loaded' } : t)),
          );
        }
      } catch (err) {
        const msg = extractErrorMessage(err);
        log.error({ err }, 'onboarding: settings load failed: %s', msg);
        if (!cancelled) {
          setTasks((prev) =>
            prev.map((t, i) => (i === 2 ? { ...t, status: 'error', detail: msg } : t)),
          );
        }
      }

      if (!cancelled) {
        setScanResult(result);
      }
    }

    void runScan();
    return () => {
      cancelled = true;
    };
  }, []);

  const allDone = tasks.every((t) => t.status === 'done' || t.status === 'error');

  return (
    <div className="wing-enter flex flex-col">
      <h2 className="text-[14px] font-bold font-mono text-text-primary mb-6 text-center">
        SYSTEM SCAN
      </h2>

      {/* Task List */}
      <div className="space-y-3 mb-8">
        {tasks.map((task) => (
          <div key={task.label} className="glass-panel bloom-border p-4 flex items-center gap-3">
            <StatusIcon status={task.status} />
            <div className="flex-1">
              <div className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider">
                {task.label}
              </div>
              {task.detail && (
                <div
                  className={`text-[10px] font-mono mt-0.5 ${task.status === 'error' ? 'text-danger-500' : 'text-text-muted'}`}
                >
                  {task.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={() => scanResult && onNext(scanResult)}
        disabled={!allDone}
        className="w-full py-3 bg-accent-500 text-base-900 font-black text-[12px] tracking-widest uppercase rounded-sm hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {allDone ? '次へ' : 'スキャン中...'}
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-[10px] font-mono text-text-muted hover:text-text-secondary transition-colors uppercase tracking-widest text-center"
      >
        スキップ
      </button>
    </div>
  );
});

const StatusIcon = memo(function StatusIcon({
  status,
}: {
  status: ScanTask['status'];
}): React.ReactElement {
  switch (status) {
    case 'pending':
      return <div className="w-3 h-3 rounded-full bg-base-600" />;
    case 'running':
      return <div className="w-3 h-3 rounded-full bg-accent-500 animate-pulse" />;
    case 'done':
      return <div className="w-3 h-3 rounded-full bg-success-500" />;
    case 'error':
      return <div className="w-3 h-3 rounded-full bg-danger-500" />;
  }
});

export default ScanStep;
