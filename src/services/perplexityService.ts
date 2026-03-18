import { invoke } from '@tauri-apps/api/core';
import log from '../lib/logger';

// ─── Constants ───────────────────────────────────────────────────────────────

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

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
