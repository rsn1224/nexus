import { invoke } from '@tauri-apps/api/core';
import log from '../lib/logger';

// ─── Constants ───────────────────────────────────────────────────────────────

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface AiRecommendation {
  title: string;
  description: string;
  applicableInNexus: boolean;
  action: string | null;
}

export interface AiBottleneckResponse {
  analysis: string;
  recommendations: AiRecommendation[];
}

export interface AiBottleneckRequest {
  gameName: string;
  bottleneckType: string;
  cpuName: string;
  gpuName: string | null;
  avgFps: number;
  pct1Low: number;
  cpuPercent: number;
  gpuUsagePercent: number | null;
  gpuTempC: number | null;
  memTotalGb: number;
  memUsedGb: number;
}

export async function getOptimizationSuggestions(
  processNames: string[],
): Promise<ApiResult<string[]>> {
  try {
    log.info('Getting optimization suggestions via Rust proxy');
    const suggestions = await invoke<string[]>('get_optimization_suggestions', { processNames });
    log.info(`Received ${suggestions.length} suggestions from Perplexity`);
    return { ok: true, data: suggestions };
  } catch (err) {
    log.error({ err }, 'Failed to get suggestions from Perplexity');
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'AI提案の取得に失敗しました',
    };
  }
}

export async function testApiKey(): Promise<ApiResult<boolean>> {
  try {
    log.info('Testing API key via Rust proxy');
    const valid = await invoke<boolean>('test_api_key');
    log.info('API key test successful');
    return { ok: true, data: valid };
  } catch (err) {
    log.error({ err }, 'Failed to test API key');
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'APIキーのテストに失敗しました',
    };
  }
}

export async function analyzeBottleneckAi(
  request: AiBottleneckRequest,
): Promise<ApiResult<AiBottleneckResponse>> {
  try {
    log.info('Requesting AI bottleneck analysis via Rust proxy');
    const response = await invoke<AiBottleneckResponse>('analyze_bottleneck_ai', { request });
    log.info(`AI analysis complete: ${response.recommendations.length} recommendations`);
    return { ok: true, data: response };
  } catch (err) {
    log.error({ err }, 'Failed to get AI bottleneck analysis');
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'AI分析の取得に失敗しました',
    };
  }
}
