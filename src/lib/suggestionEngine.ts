import type { HealthInput, Suggestion, SuggestionAction } from '../types/v2';

// =============================================================================
// Suggestion Engine — 純粋関数（ADR-006）
// =============================================================================

function action(
  label: string,
  invokeCommand: string,
  args: Record<string, unknown> = {},
  isDestructive = false,
): SuggestionAction {
  return { label, invokeCommand, args, isDestructive };
}

export function generateSuggestions(input: HealthInput, heavyProcessCount = 0): Suggestion[] {
  const memUsageRatio = input.memTotalGb > 0 ? input.memUsedGb / input.memTotalGb : 0;

  const suggestions: Suggestion[] = [];

  if (!input.gameModeEnabled) {
    suggestions.push({
      id: 'game-mode',
      priority: 'critical',
      title: 'Game Mode を有効にする',
      reason: 'Game Mode はゲーム中の CPU リソース優先を最適化します',
      impact: '+15 Health Points',
      category: 'windows_optimization',
      actions: [action('有効にする', 'toggle_game_mode')],
      isApplied: false,
      canRollback: true,
      rollbackAction: action('無効に戻す', 'toggle_game_mode'),
    });
  }

  if (!input.powerPlanHighPerf) {
    suggestions.push({
      id: 'power-plan',
      priority: 'critical',
      title: '電源プランを高パフォーマンスに変更',
      reason: '高パフォーマンスプランでゲーム中の CPU クロックが安定します',
      impact: '+15 Health Points',
      category: 'windows_optimization',
      actions: [action('変更する', 'set_power_plan', { plan: 'high_performance' })],
      isApplied: false,
      canRollback: true,
      rollbackAction: action('バランスに戻す', 'set_power_plan', {
        plan: 'balanced',
      }),
    });
  }

  if (!input.timerResolutionLow) {
    suggestions.push({
      id: 'timer-res',
      priority: 'recommended',
      title: 'Timer Resolution を 0.5ms に設定',
      reason: 'タイマー精度向上でフレームタイムの安定性が向上します',
      impact: '+10 Health Points',
      category: 'timer_optimization',
      actions: [
        action('適用する', 'set_timer_resolution', {
          resolution_100ns: 5000,
        }),
      ],
      isApplied: false,
      canRollback: true,
      rollbackAction: action('元に戻す', 'restore_timer_resolution'),
    });
  }

  if (!input.nagleDisabled) {
    suggestions.push({
      id: 'nagle',
      priority: 'recommended',
      title: 'Nagle アルゴリズムを無効化',
      reason: 'ネットワークレイテンシが改善されオンラインゲームが快適になります',
      impact: '+10 Health Points',
      category: 'network_optimization',
      actions: [action('無効にする', 'set_nagle_disabled', { disabled: true })],
      isApplied: false,
      canRollback: true,
      rollbackAction: action('元に戻す', 'set_nagle_disabled', {
        disabled: false,
      }),
    });
  }

  if (!input.visualEffectsOff) {
    suggestions.push({
      id: 'visual-effects',
      priority: 'recommended',
      title: '視覚効果をオフにする',
      reason: 'アニメーション等を無効化してレンダリング負荷を軽減します',
      impact: '+10 Health Points',
      category: 'windows_optimization',
      actions: [
        action('オフにする', 'set_visual_effects', {
          effect: 'best_performance',
        }),
      ],
      isApplied: false,
      canRollback: true,
      rollbackAction: action('元に戻す', 'set_visual_effects', {
        effect: 'default',
      }),
    });
  }

  if (input.cpuTemp !== null && input.cpuTemp >= 80) {
    suggestions.push({
      id: 'cpu-thermal',
      priority: 'critical',
      title: 'CPU 温度が高い — 冷却を確認してください',
      reason: `CPU 温度 ${input.cpuTemp}℃ は推奨上限（80℃）を超えています`,
      impact: '警告',
      category: 'thermal_warning',
      actions: [],
      isApplied: false,
      canRollback: false,
      rollbackAction: null,
    });
  }

  if (input.gpuTemp !== null && input.gpuTemp >= 85) {
    suggestions.push({
      id: 'gpu-thermal',
      priority: 'critical',
      title: 'GPU 温度が高い — 冷却を確認してください',
      reason: `GPU 温度 ${input.gpuTemp}℃ は推奨上限（85℃）を超えています`,
      impact: '警告',
      category: 'thermal_warning',
      actions: [],
      isApplied: false,
      canRollback: false,
      rollbackAction: null,
    });
  }

  if (memUsageRatio >= 0.8) {
    suggestions.push({
      id: 'mem-pressure',
      priority: 'recommended',
      title: 'メモリ使用率が高い — 解放を推奨',
      reason: `メモリ使用率 ${Math.round(memUsageRatio * 100)}% — 不要なプロセスをクリーンアップします`,
      impact: '+10 Health Points',
      category: 'memory_optimization',
      actions: [action('クリーンアップ', 'manual_memory_cleanup')],
      isApplied: false,
      canRollback: false,
      rollbackAction: null,
    });
  }

  if (input.bottleneckRatio >= 0.3) {
    suggestions.push({
      id: 'bottleneck',
      priority: 'critical',
      title: 'ボトルネック検出 — 要確認',
      reason: `ボトルネック比率 ${Math.round(input.bottleneckRatio * 100)}% — CPU/GPU のバランスを見直してください`,
      impact: '警告',
      category: 'process_optimization',
      actions: [],
      isApplied: false,
      canRollback: false,
      rollbackAction: null,
    });
  }

  if (heavyProcessCount >= 3) {
    suggestions.push({
      id: 'heavy-process',
      priority: 'recommended',
      title: '不要なバックグラウンドプロセスの優先度を下げる',
      reason: `CPU 使用率 15%以上のプロセスが ${heavyProcessCount} 件検出されました`,
      impact: '可変',
      category: 'process_optimization',
      actions: [action('最適化する', 'run_boost')],
      isApplied: false,
      canRollback: false,
      rollbackAction: null,
    });
  }

  return suggestions;
}
