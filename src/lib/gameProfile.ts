import type { BoostLevel, GameProfile, PowerPlanType, ProcessPriorityLevel } from '../types';

export function createDefaultProfile(
  displayName: string,
  exePath: string,
  steamAppId?: number,
): Partial<GameProfile> {
  return {
    id: '',
    displayName,
    exePath,
    steamAppId: steamAppId ?? null,
    cpuAffinityGame: null,
    cpuAffinityBackground: null,
    processPriority: 'normal' as ProcessPriorityLevel,
    powerPlan: 'unchanged' as PowerPlanType,
    processesToSuspend: [],
    processesToKill: [],
    timerResolution100ns: null,
    boostLevel: 'none' as BoostLevel,
    coreParkingDisabled: false,
    lastPlayed: null,
    totalPlaySecs: 0,
    createdAt: 0,
    updatedAt: 0,
  };
}
