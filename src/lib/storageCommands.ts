import { invoke } from '@tauri-apps/api/core';
import type { CleanupResult, StorageInfo } from '../types';

export async function fetchStorageInfo(): Promise<StorageInfo | null> {
  return await invoke<StorageInfo>('get_storage_info');
}

export async function cleanupTempFiles(confirmed = true): Promise<number> {
  return await invoke<number>('cleanup_temp_files', { confirmed });
}

export async function cleanupRecycleBin(): Promise<number> {
  return await invoke<number>('cleanup_recycle_bin');
}

export async function cleanupSystemCache(confirmed = true): Promise<number> {
  return await invoke<number>('cleanup_system_cache', { confirmed });
}

export async function runFullCleanup(): Promise<CleanupResult> {
  return await invoke<CleanupResult>('run_full_cleanup');
}

export async function analyzeDiskUsage(driveName: string): Promise<string[]> {
  return await invoke<string[]>('analyze_disk_usage', { driveName });
}
