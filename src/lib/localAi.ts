import type { DriveInfo, HardwareInfo, ResourceSnapshot, WinSetting } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuggestionLevel = 'ok' | 'info' | 'warn' | 'critical';

export interface LocalSuggestion {
  id: string;
  level: SuggestionLevel;
  message: string;
}

// ─── Shared ───────────────────────────────────────────────────────────────────

const LEVEL_ORDER: SuggestionLevel[] = ['critical', 'warn', 'info', 'ok'];

function sortAndSlice(suggestions: LocalSuggestion[], max = 3): LocalSuggestion[] {
  return suggestions
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
    .slice(0, max);
}

// ─── HomeWing ─────────────────────────────────────────────────────────────────

export function homePageSuggestions(
  snapshot: ResourceSnapshot | null,
  drives: DriveInfo[],
  hwInfo: HardwareInfo | null,
): LocalSuggestion[] {
  const suggestions: LocalSuggestion[] = [];

  // hwInfo が null の場合は早期リターン
  if (!hwInfo) {
    return [];
  }

  if (snapshot) {
    if (snapshot.cpuPercent >= 90) {
      suggestions.push({
        id: 'cpu_usage_critical',
        level: 'critical',
        message: `CPU 使用率が ${snapshot.cpuPercent.toFixed(0)}% です。最適化タブでプロセスを整理してください。`,
      });
    } else if (snapshot.cpuPercent >= 70) {
      suggestions.push({
        id: 'cpu_usage_warn',
        level: 'warn',
        message: `CPU 使用率が ${snapshot.cpuPercent.toFixed(0)}% です。重いプロセスを確認してください。`,
      });
    }

    if (snapshot.memTotalMb > 0) {
      const memPercent = (snapshot.memUsedMb / snapshot.memTotalMb) * 100;
      if (memPercent >= 90) {
        suggestions.push({
          id: 'mem_critical',
          level: 'critical',
          message: `メモリ使用率が ${memPercent.toFixed(0)}% です。不要なアプリを閉じてください。`,
        });
      } else if (memPercent >= 75) {
        suggestions.push({
          id: 'mem_warn',
          level: 'warn',
          message: `メモリ使用率が ${memPercent.toFixed(0)}% です。`,
        });
      }
    }
  }

  for (const drive of drives) {
    if (drive.usedPercent >= 95) {
      suggestions.push({
        id: `disk_critical_${drive.name}`,
        level: 'critical',
        message: `ドライブ ${drive.name} の使用率が ${drive.usedPercent.toFixed(0)}% です。空き容量を確保してください。`,
      });
    } else if (drive.usedPercent >= 85) {
      suggestions.push({
        id: `disk_warn_${drive.name}`,
        level: 'warn',
        message: `ドライブ ${drive.name} の空き容量が残り ${drive.freeGb.toFixed(0)} GB です。`,
      });
    }
  }

  if (hwInfo?.cpuTempC != null) {
    if (hwInfo.cpuTempC >= 90) {
      suggestions.push({
        id: 'temp_critical',
        level: 'critical',
        message: `CPU 温度が ${hwInfo.cpuTempC.toFixed(0)}\u00b0C です。冷却環境を確認してください。`,
      });
    } else if (hwInfo.cpuTempC >= 75) {
      suggestions.push({
        id: 'temp_warn',
        level: 'warn',
        message: `CPU 温度が ${hwInfo.cpuTempC.toFixed(0)}\u00b0C です。`,
      });
    }
  }

  // ── GPU 温度チェック ──────────────────────────────────────────────────────
  if (hwInfo?.gpuTempC != null) {
    if (hwInfo.gpuTempC >= 95) {
      suggestions.push({
        id: 'gpu_temp_critical',
        level: 'critical',
        message: `GPU 温度が ${hwInfo.gpuTempC.toFixed(0)}°C です。冷却環境を確認してください。`,
      });
    } else if (hwInfo.gpuTempC >= 85) {
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

// ─── BoostWing ────────────────────────────────────────────────────────────────

export function boostPageSuggestions(
  winSettings: WinSetting[],
  netSettings: WinSetting[],
  cpuPercent: number | null,
): LocalSuggestion[] {
  const suggestions: LocalSuggestion[] = [];

  const optimizedWin = winSettings.filter((s) => s.isOptimized).length;
  const totalWin = winSettings.length;

  if (totalWin > 0 && optimizedWin === 0) {
    suggestions.push({
      id: 'no_win_opt',
      level: 'warn',
      message: `Windows 設定が未最適化です。「Windows設定」タブで ${totalWin} 件の設定を適用できます。`,
    });
  } else if (totalWin > 0 && optimizedWin < totalWin) {
    suggestions.push({
      id: 'partial_win_opt',
      level: 'info',
      message: `Windows 設定 ${optimizedWin}/${totalWin} 件が最適化済みです。残り ${totalWin - optimizedWin} 件を適用できます。`,
    });
  }

  const powerPlan = winSettings.find((s) => s.id === 'power_plan');
  if (powerPlan && !powerPlan.isOptimized) {
    suggestions.push({
      id: 'power_plan_warn',
      level: 'warn',
      message: '高パフォーマンス電源プランが未設定です。ゲームパフォーマンスに影響します。',
    });
  }

  const optimizedNet = netSettings.filter((s) => s.isOptimized).length;
  const totalNet = netSettings.length;
  if (totalNet > 0 && optimizedNet === 0) {
    suggestions.push({
      id: 'no_net_opt',
      level: 'info',
      message: `ネット最適化設定が未適用です。「ネット最適化」タブで ${totalNet} 件の設定を適用できます。`,
    });
  }

  if (cpuPercent !== null && cpuPercent >= 80) {
    suggestions.push({
      id: 'boost_cpu',
      level: 'warn',
      message: `CPU 使用率が ${cpuPercent.toFixed(0)}% です。「プロセス最適化」タブで RUN BOOST を実行してください。`,
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: 'all_optimized',
      level: 'ok',
      message: 'すべての最適化設定が適用されています。',
    });
  }

  return sortAndSlice(suggestions);
}

// ─── LauncherWing ─────────────────────────────────────────────────────────────

export function launcherPageSuggestions(
  gameCount: number,
  favoriteCount: number,
): LocalSuggestion[] {
  if (gameCount === 0) {
    return [
      {
        id: 'no_games',
        level: 'info',
        message: 'ゲームが見つかりません。SCAN を実行して Steam ライブラリを検出してください。',
      },
    ];
  }
  if (favoriteCount === 0) {
    return [
      {
        id: 'no_favorites',
        level: 'info',
        message:
          'よく遊ぶゲームを \u2605 でお気に入り登録すると、\u2605 優先ソートで素早くアクセスできます。',
      },
    ];
  }
  return [{ id: 'games_ok', level: 'ok', message: `${gameCount} 本のゲームが登録されています。` }];
}
