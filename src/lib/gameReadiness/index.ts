import { assertNever } from '../assert';
import { generateRecommendations } from './recommendations';
import { calcOptimizationScore, calcPerformanceScore, calcResourceScore } from './scores';
import type { ReadinessInput, ReadinessRank, ReadinessResult } from './types';

export type { ReadinessInput, ReadinessRank, ReadinessResult, Recommendation } from './types';

const WEIGHTS_GAMING = { resource: 0.3, optimization: 0.3, performance: 0.4 };
const WEIGHTS_IDLE = { resource: 0.5, optimization: 0.5 };

export function calcReadiness(input: ReadinessInput): ReadinessResult {
  const resourceScore = calcResourceScore(input);
  const optimizationScore = calcOptimizationScore(input);
  const performanceScore = input.frameTime ? calcPerformanceScore(input.frameTime) : -1;

  const isGaming = performanceScore >= 0;

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

function getRank(total: number): ReadinessRank {
  if (total >= 80) return 'READY';
  if (total >= 60) return 'GOOD';
  if (total >= 40) return 'FAIR';
  return 'NOT_READY';
}

export function getRankStyle(rank: ReadinessRank): { label: string; className: string } {
  switch (rank) {
    case 'READY':
      return { label: 'GAME READY', className: 'text-success-500' };
    case 'GOOD':
      return { label: 'GOOD', className: 'text-accent-500' };
    case 'FAIR':
      return { label: 'FAIR', className: 'text-accent-400' };
    case 'NOT_READY':
      return { label: 'NOT READY', className: 'text-danger-500' };
    default:
      return assertNever(rank);
  }
}
