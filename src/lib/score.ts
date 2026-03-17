// ゲームパフォーマンススコア計算ライブラリ

export const SCORE_WEIGHTS = {
  cpu: 0.4,
  mem: 0.3,
  disk: 0.2,
  gpu: 0.1,
} as const;

/**
 * ゲームパフォーマンススコアを計算する
 * @param params - パフォーマンス指標
 * @returns スコア（0-100）またはnull（データ未取得時）
 */
export function calcScore(params: {
  cpuPercent: number | null;
  memUsedGb: number | null;
  memTotalGb: number | null;
  diskUsagePercent: number | null;
  gpuUsagePercent: number | null;
}): number | null {
  const { cpuPercent, memUsedGb, memTotalGb, diskUsagePercent, gpuUsagePercent } = params;

  // データ未取得時（全null）は null を返す
  if (
    cpuPercent === null &&
    memUsedGb === null &&
    memTotalGb === null &&
    diskUsagePercent === null &&
    gpuUsagePercent === null
  ) {
    return null;
  }

  // 各指標のスコアを計算（使用率が低いほど高スコア）
  const scores: Record<string, number | null> = {
    cpu: cpuPercent !== null ? 100 - cpuPercent : null,
    mem:
      memUsedGb !== null && memTotalGb !== null && memTotalGb > 0
        ? 100 - (memUsedGb / memTotalGb) * 100
        : null,
    disk: diskUsagePercent !== null ? 100 - diskUsagePercent : null,
    gpu: gpuUsagePercent !== null ? 100 - gpuUsagePercent : null,
  };

  // 有効な指標とウェイトを抽出
  const validEntries = Object.entries(SCORE_WEIGHTS).filter(([key]) => scores[key] !== null);

  if (validEntries.length === 0) {
    return null;
  }

  // ウェイトを正規化（null値を除く）
  const totalWeight = validEntries.reduce((sum, [, weight]) => sum + weight, 0);
  const normalizedWeights = validEntries.map(([key, weight]) => ({
    key,
    weight: weight / totalWeight,
    score: scores[key] as number,
  }));

  // 加重平均を計算
  const weightedSum = normalizedWeights.reduce((sum, { weight, score }) => sum + weight * score, 0);

  // 0〜100 にクランプして丸める
  return Math.round(Math.max(0, Math.min(100, weightedSum)));
}

/**
 * スコアからランク情報を取得する
 * @param score - スコア（0-100）
 * @returns ランク情報（ラベルと色）
 */
export function getScoreRank(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'EXCELLENT', color: 'var(--color-success-500)' };
  if (score >= 75) return { label: 'GOOD', color: 'var(--color-cyan-500)' };
  if (score >= 50) return { label: 'FAIR', color: 'var(--color-accent-400)' };
  return { label: 'POOR', color: 'var(--color-danger-500)' };
}

/**
 * プログレスバー文字列を生成する
 * @param percentage - パーセンテージ（0-100）
 * @param length - バーの長さ（デフォルト10）
 * @returns プログレスバー文字列
 */
export function createProgressBar(percentage: number, length: number = 10): string {
  const filledBlocks = Math.round((percentage / 100) * length);
  const emptyBlocks = length - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}
