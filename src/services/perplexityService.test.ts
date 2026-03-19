import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type AiBottleneckRequest,
  analyzeBottleneckAi,
  getOptimizationSuggestions,
  testApiKey,
} from './perplexityService';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('../lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { invoke } from '@tauri-apps/api/core';

describe('getOptimizationSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('成功時に提案リストを返す', async () => {
    const suggestions = ['提案1', '提案2'];
    vi.mocked(invoke).mockResolvedValue(suggestions);

    const result = await getOptimizationSuggestions(['game.exe']);

    expect(result).toEqual({ ok: true, data: suggestions });
    expect(invoke).toHaveBeenCalledWith('get_optimization_suggestions', {
      processNames: ['game.exe'],
    });
  });

  it('エラー時に error メッセージを返す', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('network error'));

    const result = await getOptimizationSuggestions(['game.exe']);

    expect(result).toEqual({ ok: false, error: 'network error' });
  });

  it('非 Error 型のエラーではデフォルトメッセージを返す', async () => {
    vi.mocked(invoke).mockRejectedValue('unknown');

    const result = await getOptimizationSuggestions(['game.exe']);

    expect(result).toEqual({ ok: false, error: 'AI提案の取得に失敗しました' });
  });
});

describe('testApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('成功時に true を返す', async () => {
    vi.mocked(invoke).mockResolvedValue(true);

    const result = await testApiKey();

    expect(result).toEqual({ ok: true, data: true });
    expect(invoke).toHaveBeenCalledWith('test_api_key');
  });

  it('エラー時に error メッセージを返す', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('invalid key'));

    const result = await testApiKey();

    expect(result).toEqual({ ok: false, error: 'invalid key' });
  });
});

describe('analyzeBottleneckAi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const request: AiBottleneckRequest = {
    gameName: 'TestGame',
    bottleneckType: 'cpu',
    cpuName: 'Ryzen 9 7950X',
    gpuName: 'RTX 4090',
    avgFps: 120,
    pct1Low: 80,
    cpuPercent: 95,
    gpuUsagePercent: 60,
    gpuTempC: 70,
    memTotalGb: 32,
    memUsedGb: 16,
  };

  it('成功時に AI 分析結果を返す', async () => {
    const response = {
      summary: 'CPU がボトルネック',
      recommendations: [{ title: '対策1', description: '説明' }],
    };
    vi.mocked(invoke).mockResolvedValue(response);

    const result = await analyzeBottleneckAi(request);

    expect(result).toEqual({ ok: true, data: response });
    expect(invoke).toHaveBeenCalledWith('analyze_bottleneck_ai', { request });
  });

  it('エラー時に error メッセージを返す', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('timeout'));

    const result = await analyzeBottleneckAi(request);

    expect(result).toEqual({ ok: false, error: 'timeout' });
  });

  it('非 Error 型のエラーではデフォルトメッセージを返す', async () => {
    vi.mocked(invoke).mockRejectedValue(42);

    const result = await analyzeBottleneckAi(request);

    expect(result).toEqual({ ok: false, error: 'AI分析の取得に失敗しました' });
  });
});
