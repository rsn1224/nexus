import type { DiskDrive, HardwareInfo, ResourceSnapshot } from '../../types';
import {
  CPU_TEMP_CRITICAL_C,
  CPU_TEMP_WARN_C,
  CPU_USAGE_CRITICAL_PCT,
  CPU_USAGE_WARN_PCT,
  DISK_USAGE_CRITICAL_PCT,
  DISK_USAGE_WARN_PCT,
  GPU_TEMP_CRITICAL_C,
  GPU_TEMP_WARN_C,
  MEM_USAGE_CRITICAL_PCT,
  MEM_USAGE_WARN_PCT,
} from '../constants';
import { type LocalSuggestion, sortAndSlice } from './types';

export function homePageSuggestions(
  snapshot: ResourceSnapshot | null,
  drives: DiskDrive[],
  hwInfo: HardwareInfo | null,
): LocalSuggestion[] {
  const suggestions: LocalSuggestion[] = [];

  if (!hwInfo) {
    return [];
  }

  if (snapshot) {
    if (snapshot.cpuPercent >= CPU_USAGE_CRITICAL_PCT) {
      suggestions.push({
        id: 'cpu_usage_critical',
        level: 'critical',
        message: `CPU 使用率が ${snapshot.cpuPercent.toFixed(0)}% です。最適化タブでプロセスを整理してください。`,
      });
    } else if (snapshot.cpuPercent >= CPU_USAGE_WARN_PCT) {
      suggestions.push({
        id: 'cpu_usage_warn',
        level: 'warn',
        message: `CPU 使用率が ${snapshot.cpuPercent.toFixed(0)}% です。重いプロセスを確認してください。`,
      });
    }

    if (snapshot.memTotalMb > 0) {
      const memPercent = (snapshot.memUsedMb / snapshot.memTotalMb) * 100;
      if (memPercent >= MEM_USAGE_CRITICAL_PCT) {
        suggestions.push({
          id: 'mem_critical',
          level: 'critical',
          message: `メモリ使用率が ${memPercent.toFixed(0)}% です。不要なアプリを閉じてください。`,
        });
      } else if (memPercent >= MEM_USAGE_WARN_PCT) {
        suggestions.push({
          id: 'mem_warn',
          level: 'warn',
          message: `メモリ使用率が ${memPercent.toFixed(0)}% です。`,
        });
      }
    }
  }

  for (const drive of drives) {
    const usedPercent = (drive.usedBytes / drive.sizeBytes) * 100;
    const freeGb = drive.availableBytes / (1024 * 1024 * 1024);

    if (usedPercent >= DISK_USAGE_CRITICAL_PCT) {
      suggestions.push({
        id: `disk_critical_${drive.name}`,
        level: 'critical',
        message: `ドライブ ${drive.name} の使用率が ${usedPercent.toFixed(0)}% です。空き容量を確保してください。`,
      });
    } else if (usedPercent >= DISK_USAGE_WARN_PCT) {
      suggestions.push({
        id: `disk_warn_${drive.name}`,
        level: 'warn',
        message: `ドライブ ${drive.name} の空き容量が残り ${freeGb.toFixed(0)} GB です。`,
      });
    }
  }

  if (hwInfo?.cpuTempC != null) {
    if (hwInfo.cpuTempC >= CPU_TEMP_CRITICAL_C) {
      suggestions.push({
        id: 'temp_critical',
        level: 'critical',
        message: `CPU 温度が ${hwInfo.cpuTempC.toFixed(0)}°C です。冷却環境を確認してください。`,
      });
    } else if (hwInfo.cpuTempC >= CPU_TEMP_WARN_C) {
      suggestions.push({
        id: 'temp_warn',
        level: 'warn',
        message: `CPU 温度が ${hwInfo.cpuTempC.toFixed(0)}°C です。`,
      });
    }
  }

  if (hwInfo?.gpuTempC != null) {
    if (hwInfo.gpuTempC >= GPU_TEMP_CRITICAL_C) {
      suggestions.push({
        id: 'gpu_temp_critical',
        level: 'critical',
        message: `GPU 温度が ${hwInfo.gpuTempC.toFixed(0)}°C です。冷却環境を確認してください。`,
      });
    } else if (hwInfo.gpuTempC >= GPU_TEMP_WARN_C) {
      suggestions.push({
        id: 'gpu_temp_warn',
        level: 'warn',
        message: `GPU 温度が ${hwInfo.gpuTempC.toFixed(0)}°C です。`,
      });
    }
  }

  if (suggestions.length === 0) {
    suggestions.push({ id: 'all_ok', level: 'ok', message: 'システムは正常な状態です。' });
  }

  return sortAndSlice(suggestions);
}
