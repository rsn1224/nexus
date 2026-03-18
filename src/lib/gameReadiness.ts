//! ゲームレディネススコア計算ロジック（3軸評価）
//!
//! リソース使用率 + 最適化状態 + フレームタイムの3軸で「ゲームレディネス」を評価する。

import type { FrameTimeSnapshot, TimerResolutionState } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ReadinessInput {
  // 軸1: リソース
  cpuPercent: number | null;
  memUsedMb: number | null;
  memTotalMb: number | null;
  gpuUsagePercent: number | null;
  gpuTempC: number | null;
  diskUsagePercent: number | null;

  // 軸2: 最適化状態
  isProfileApplied: boolean;
  boostLevel: 'none' | 'soft' | 'medium' | 'hard';
  timerState: TimerResolutionState | null;
  affinityConfigured: boolean;

  // 軸3: フレームタイム（ゲーム実行中のみ）
  frameTime: FrameTimeSnapshot | null;
}

export interface ReadinessResult {
  /** 総合スコア（0〜100） */
  total: number;

  /** 3軸の個別スコア（各 0〜100） */
  axes: {
    resource: number;
    optimization: number;
    performance: number; // ゲーム非実行時は N/A → -1
  };

  /** ランク */
  rank: ReadinessRank;

  /** 改善推奨事項 */
  recommendations: Recommendation[];
}

export type ReadinessRank = 'READY' | 'GOOD' | 'FAIR' | 'NOT_READY';

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string; // 遷移先（例: 'boost', 'profiles'）
}

// ─── Weights ────────────────────────────────────────────────────────────────

/** 軸ごとの重み（ゲーム実行中） */
const WEIGHTS_GAMING = { resource: 0.3, optimization: 0.3, performance: 0.4 };
/** 軸ごとの重み（ゲーム非実行時、フレームタイムなし） */
const WEIGHTS_IDLE = { resource: 0.5, optimization: 0.5 };

// ─── Main ───────────────────────────────────────────────────────────────────

export function calcReadiness(input: ReadinessInput): ReadinessResult {
  const resourceScore = calcResourceScore(input);
  const optimizationScore = calcOptimizationScore(input);
  const performanceScore = input.frameTime ? calcPerformanceScore(input.frameTime) : -1;

  const isGaming = performanceScore >= 0;

  // 総合スコア計算
  let total: number;
  if (isGaming) {
    total = Math.round(
      resourceScore * WEIGHTS_GAMING.resource +
        optimizationScore * WEIGHTS_GAMING.optimization +
        performanceScore * WEIGHTS_GAMING.performance,
    );
  } else {
    total = Math.round(
      resourceScore * WEIGHTS_IDLE.resource + optimizationScore * WEIGHTS_IDLE.optimization,
    );
  }

  total = Math.max(0, Math.min(100, total));

  const rank = getRank(total);
  const recommendations = generateRecommendations(
    input,
    resourceScore,
    optimizationScore,
    performanceScore,
  );

  return {
    total,
    axes: {
      resource: Math.round(resourceScore),
      optimization: Math.round(optimizationScore),
      performance: Math.round(performanceScore),
    },
    rank,
    recommendations,
  };
}

// ─── 軸1: リソーススコア ────────────────────────────────────────────────────

function calcResourceScore(input: ReadinessInput): number {
  let factors = 0;
  let sum = 0;

  // CPU: 使用率が低いほど良い（ゲームにリソースを残せる）
  if (input.cpuPercent !== null) {
    sum += Math.max(0, 100 - input.cpuPercent);
    factors++;
  }

  // MEM: 空きメモリが多いほど良い
  if (input.memUsedMb !== null && input.memTotalMb !== null && input.memTotalMb > 0) {
    const memPercent = (input.memUsedMb / input.memTotalMb) * 100;
    sum += Math.max(0, 100 - memPercent);
    factors++;
  }

  // GPU: 使用率が低いほど良い
  if (input.gpuUsagePercent !== null) {
    sum += Math.max(0, 100 - input.gpuUsagePercent);
    factors++;
  }

  // GPU温度: 80℃以上でペナルティ
  if (input.gpuTempC !== null) {
    const tempScore =
      input.gpuTempC < 70 ? 100 : input.gpuTempC < 80 ? 80 : input.gpuTempC < 90 ? 50 : 20;
    sum += tempScore;
    factors++;
  }

  // DISK: 使用率が低いほど良い
  if (input.diskUsagePercent !== null) {
    sum += Math.max(0, 100 - input.diskUsagePercent);
    factors++;
  }

  return factors > 0 ? sum / factors : 50; // データなし → 中立
}

// ─── 軸2: 最適化スコア ──────────────────────────────────────────────────────

function calcOptimizationScore(input: ReadinessInput): number {
  let score = 0;

  // プロファイル適用（0 or 30）
  if (input.isProfileApplied) {
    score += 30;
  }

  // ブーストレベル（0〜30）
  switch (input.boostLevel) {
    case 'hard':
      score += 30;
      break;
    case 'medium':
      score += 25;
      break;
    case 'soft':
      score += 15;
      break;
    case 'none':
      score += 0;
      break;
  }

  // タイマーリゾリューション（0〜20）
  if (input.timerState?.nexusRequested100ns != null) {
    const ms = input.timerState.nexusRequested100ns / 10000;
    if (ms <= 0.5) score += 20;
    else if (ms <= 1.0) score += 15;
    else if (ms <= 2.0) score += 10;
    else score += 5;
  }

  // CPU アフィニティ設定（0 or 20）
  if (input.affinityConfigured) {
    score += 20;
  }

  return Math.min(100, score);
}

// ─── 軸3: パフォーマンススコア ──────────────────────────────────────────────

function calcPerformanceScore(ft: FrameTimeSnapshot): number {
  let score = 0;

  // AVG FPS（0〜40）
  if (ft.avgFps >= 144) score += 40;
  else if (ft.avgFps >= 120) score += 35;
  else if (ft.avgFps >= 60) score += 30;
  else if (ft.avgFps >= 30) score += 15;
  else score += 5;

  // 1% Low と AVG の乖離（0〜30）— 乖離が小さいほど安定
  if (ft.avgFps > 0) {
    const ratio = ft.pct1Low / ft.avgFps;
    if (ratio >= 0.8) score += 30;
    else if (ratio >= 0.6) score += 20;
    else if (ratio >= 0.4) score += 10;
    else score += 5;
  }

  // スタッター（0〜30）— 少ないほど良い
  if (ft.stutterCount === 0) score += 30;
  else if (ft.stutterCount <= 2) score += 20;
  else if (ft.stutterCount <= 5) score += 10;
  else score += 0;

  return Math.min(100, score);
}

// ─── ランク ─────────────────────────────────────────────────────────────────

function getRank(total: number): ReadinessRank {
  if (total >= 80) return 'READY';
  if (total >= 60) return 'GOOD';
  if (total >= 40) return 'FAIR';
  return 'NOT_READY';
}

export function getRankStyle(rank: ReadinessRank): { label: string; color: string } {
  switch (rank) {
    case 'READY':
      return { label: 'GAME READY', color: 'var(--color-success-500)' };
    case 'GOOD':
      return { label: 'GOOD', color: 'var(--color-cyan-500)' };
    case 'FAIR':
      return { label: 'FAIR', color: 'var(--color-accent-400)' };
    case 'NOT_READY':
      return { label: 'NOT READY', color: 'var(--color-danger-500)' };
  }
}

// ─── 推奨事項生成 ────────────────────────────────────────────────────────────

function generateRecommendations(
  input: ReadinessInput,
  _resourceScore: number,
  _optimizationScore: number,
  performanceScore: number,
): Recommendation[] {
  const recs: Recommendation[] = [];

  // リソース系
  if (input.cpuPercent !== null && input.cpuPercent >= 80) {
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

  // 最適化系
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

  // パフォーマンス系
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

  // 優先度順ソート
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs.slice(0, 5); // 最大5件
}
