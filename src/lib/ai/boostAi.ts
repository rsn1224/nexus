import type { WinSetting } from '../../types';
import { CPU_USAGE_BOOST_WARN_PCT } from '../constants';
import { type LocalSuggestion, sortAndSlice } from './types';

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

  if (cpuPercent !== null && cpuPercent >= CPU_USAGE_BOOST_WARN_PCT) {
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
