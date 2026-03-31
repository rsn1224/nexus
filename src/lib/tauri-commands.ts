import { invoke } from '@tauri-apps/api/core';
import type {
  ApplyResult,
  DiagnosticAlert,
  NexusSettings,
  OptCandidate,
  OptSession,
  RevertResult,
  SystemStatus,
} from '../types';
import { extractErrorMessage } from './tauri';

function wrap<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: unknown) => {
    throw new Error(extractErrorMessage(err));
  });
}

export const commands = {
  getSystemStatus: (): Promise<SystemStatus> => wrap(invoke<SystemStatus>('get_system_status')),

  getOptimizationCandidates: (): Promise<OptCandidate[]> =>
    wrap(invoke<OptCandidate[]>('get_optimization_candidates')),

  applyOptimizations: (ids: string[]): Promise<ApplyResult> =>
    wrap(invoke<ApplyResult>('apply_optimizations', { ids })),

  revertAll: (): Promise<RevertResult> => wrap(invoke<RevertResult>('revert_all')),

  diagnose: (): Promise<DiagnosticAlert[]> => wrap(invoke<DiagnosticAlert[]>('diagnose')),

  getHistory: (): Promise<OptSession[]> => wrap(invoke<OptSession[]>('get_history')),

  getV4Settings: (): Promise<NexusSettings> => wrap(invoke<NexusSettings>('get_v4_settings')),

  updateV4Settings: (settings: NexusSettings): Promise<void> =>
    wrap(invoke<void>('update_v4_settings', { settings })),
} as const;
