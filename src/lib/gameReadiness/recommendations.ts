import { CPU_USAGE_BOOST_WARN_PCT } from '../constants';
import type { ReadinessInput, Recommendation } from './types';

export function generateRecommendations(
  input: ReadinessInput,
  _resourceScore: number,
  _optimizationScore: number,
  performanceScore: number,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (input.cpuPercent !== null && input.cpuPercent >= CPU_USAGE_BOOST_WARN_PCT) {
    recs.push({
      id: 'cpu-high',
      priority: 'high',
      message: `CPU 使用率 ${input.cpuPercent.toFixed(0)}% — 不要なプロセスを整理してください`,
      action: 'boost',
    });
  }

  if (input.memUsedMb !== null && input.memTotalMb !== null && input.memTotalMb > 0) {
    const memPercent = (input.memUsedMb / input.memTotalMb) * 100;
    if (memPercent >= 85) {
      recs.push({
        id: 'mem-high',
        priority: 'high',
        message: `メモリ使用率 ${memPercent.toFixed(0)}% — アプリを閉じるかブーストを実行`,
        action: 'boost',
      });
    }
  }

  if (input.gpuTempC !== null && input.gpuTempC >= 85) {
    recs.push({
      id: 'gpu-temp',
      priority: 'medium',
      message: `GPU 温度 ${input.gpuTempC.toFixed(0)}°C — 冷却を確認してください`,
    });
  }

  if (!input.isProfileApplied) {
    recs.push({
      id: 'no-profile',
      priority: 'medium',
      message: 'ゲームプロファイルが未適用です',
      action: 'profiles',
    });
  }

  if (input.boostLevel === 'none') {
    recs.push({
      id: 'no-boost',
      priority: 'low',
      message: 'ブーストが無効です — 有効にするとパフォーマンスが向上します',
      action: 'boost',
    });
  }

  if (input.timerState?.nexusRequested100ns == null) {
    recs.push({
      id: 'timer-default',
      priority: 'low',
      message: 'タイマーリゾリューション未設定 — 低遅延化が可能です',
      action: 'winopt',
    });
  }

  if (performanceScore >= 0) {
    const ft = input.frameTime;
    if (ft && ft.stutterCount > 3) {
      recs.push({
        id: 'stutter',
        priority: 'high',
        message: `スタッター ${ft.stutterCount} 回検出 — CPU アフィニティ設定を検討`,
        action: 'profiles',
      });
    }

    if (ft && ft.avgFps > 0 && ft.pct1Low / ft.avgFps < 0.5) {
      recs.push({
        id: 'fps-instability',
        priority: 'medium',
        message: `FPS が不安定（AVG ${ft.avgFps.toFixed(0)} / 1%Low ${ft.pct1Low.toFixed(0)}）`,
        action: 'boost',
      });
    }
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs.slice(0, 5);
}
