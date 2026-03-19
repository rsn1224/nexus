import { useCallback, useState } from 'react';
import { TIMER_100NS_PER_MS } from '../lib/constants';
import type { BoostLevel, GameProfile, PowerPlanType, ProcessPriorityLevel } from '../types';

export interface UseProfileFormResult {
  displayName: string;
  setDisplayName: (v: string) => void;
  exePath: string;
  setExePath: (v: string) => void;
  boostLevel: BoostLevel;
  setBoostLevel: (v: BoostLevel) => void;
  processesToSuspend: string;
  setProcessesToSuspend: (v: string) => void;
  processPriority: ProcessPriorityLevel;
  setProcessPriority: (v: ProcessPriorityLevel) => void;
  powerPlan: PowerPlanType;
  setPowerPlan: (v: PowerPlanType) => void;
  cpuAffinityGame: number[];
  setCpuAffinityGame: (v: number[]) => void;
  cpuAffinityBackground: number[];
  setCpuAffinityBackground: (v: number[]) => void;
  processesToKill: string;
  setProcessesToKill: (v: string) => void;
  timerResolutionMs: string;
  setTimerResolutionMs: (v: string) => void;
  autoSuspendEnabled: boolean;
  setAutoSuspendEnabled: (v: boolean) => void;
  handleSubmit: () => void;
}

export function useProfileForm(
  initial: Partial<GameProfile> | undefined,
  onSave: (profile: GameProfile) => void,
): UseProfileFormResult {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [exePath, setExePath] = useState(initial?.exePath ?? '');
  const [boostLevel, setBoostLevel] = useState<BoostLevel>(initial?.boostLevel ?? 'none');
  const [processesToSuspend, setProcessesToSuspend] = useState(
    initial?.processesToSuspend?.join(', ') ?? '',
  );
  const [processPriority, setProcessPriority] = useState<ProcessPriorityLevel>(
    initial?.processPriority ?? 'normal',
  );
  const [powerPlan, setPowerPlan] = useState<PowerPlanType>(initial?.powerPlan ?? 'unchanged');
  const [cpuAffinityGame, setCpuAffinityGame] = useState<number[]>(initial?.cpuAffinityGame ?? []);
  const [cpuAffinityBackground, setCpuAffinityBackground] = useState<number[]>(
    initial?.cpuAffinityBackground ?? [],
  );
  const [processesToKill, setProcessesToKill] = useState(
    initial?.processesToKill?.join(', ') ?? '',
  );
  const [timerResolutionMs, setTimerResolutionMs] = useState(() => {
    const val = initial?.timerResolution100ns;
    return val != null ? (val / TIMER_100NS_PER_MS).toFixed(3) : '';
  });
  const [autoSuspendEnabled, setAutoSuspendEnabled] = useState(
    initial?.autoSuspendEnabled ?? false,
  );

  const handleSubmit = useCallback(() => {
    if (!displayName.trim() || !exePath.trim()) return;

    const profile: GameProfile = {
      id: initial?.id ?? '',
      displayName: displayName.trim(),
      exePath: exePath.trim(),
      steamAppId: initial?.steamAppId ?? null,
      cpuAffinityGame: cpuAffinityGame.length > 0 ? cpuAffinityGame : null,
      cpuAffinityBackground: cpuAffinityBackground.length > 0 ? cpuAffinityBackground : null,
      processPriority,
      powerPlan,
      processesToSuspend: processesToSuspend
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      processesToKill: processesToKill
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      timerResolution100ns: timerResolutionMs
        ? Math.round(parseFloat(timerResolutionMs) * TIMER_100NS_PER_MS)
        : null,
      autoSuspendEnabled,
      boostLevel,
      coreParkingDisabled: initial?.coreParkingDisabled ?? false,
      lastPlayed: initial?.lastPlayed ?? null,
      totalPlaySecs: initial?.totalPlaySecs ?? 0,
      createdAt: initial?.createdAt ?? 0,
      updatedAt: initial?.updatedAt ?? 0,
    };

    onSave(profile);
  }, [
    displayName,
    exePath,
    boostLevel,
    processesToSuspend,
    processPriority,
    powerPlan,
    cpuAffinityGame,
    cpuAffinityBackground,
    processesToKill,
    timerResolutionMs,
    autoSuspendEnabled,
    initial,
    onSave,
  ]);

  return {
    displayName,
    setDisplayName,
    exePath,
    setExePath,
    boostLevel,
    setBoostLevel,
    processesToSuspend,
    setProcessesToSuspend,
    processPriority,
    setProcessPriority,
    powerPlan,
    setPowerPlan,
    cpuAffinityGame,
    setCpuAffinityGame,
    cpuAffinityBackground,
    setCpuAffinityBackground,
    processesToKill,
    setProcessesToKill,
    timerResolutionMs,
    setTimerResolutionMs,
    autoSuspendEnabled,
    setAutoSuspendEnabled,
    handleSubmit,
  };
}
