import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { invoke } from '@tauri-apps/api/core';
import { useAiStore } from './useAiStore';

function resetStore(): void {
  useAiStore.setState({
    activeLayer: 'rules',
    hasApiKey: false,
    lastAnalysis: null,
    analyzing: false,
    error: null,
    lastAnalyzedAt: null,
  });
}

describe('useAiStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('初期状態: rules レイヤー', () => {
    const state = useAiStore.getState();
    expect(state.activeLayer).toBe('rules');
    expect(state.hasApiKey).toBe(false);
    expect(state.analyzing).toBe(false);
    expect(state.error).toBeNull();
  });

  it('detectLayer: API キーあり → ai レイヤー', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    await useAiStore.getState().detectLayer();
    const state = useAiStore.getState();
    expect(state.activeLayer).toBe('ai');
    expect(state.hasApiKey).toBe(true);
    expect(state.error).toBeNull();
  });

  it('detectLayer: API キーなし → rules レイヤー', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(false);
    await useAiStore.getState().detectLayer();
    const state = useAiStore.getState();
    expect(state.activeLayer).toBe('rules');
    expect(state.hasApiKey).toBe(false);
  });

  it('detectLayer: エラー → static フォールバック', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Network error'));
    await useAiStore.getState().detectLayer();
    const state = useAiStore.getState();
    expect(state.activeLayer).toBe('static');
    expect(state.hasApiKey).toBe(false);
    expect(state.error).toBeTruthy();
  });

  it('testApiKey: 成功 → ai レイヤー', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    const result = await useAiStore.getState().testApiKey();
    expect(result).toBe(true);
    expect(useAiStore.getState().activeLayer).toBe('ai');
    expect(useAiStore.getState().hasApiKey).toBe(true);
  });

  it('testApiKey: 失敗 → rules フォールバック', async () => {
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Invalid key'));
    const result = await useAiStore.getState().testApiKey();
    expect(result).toBe(false);
    expect(useAiStore.getState().activeLayer).toBe('rules');
    expect(useAiStore.getState().error).toBeTruthy();
  });

  it('analyze: ai レイヤーでない場合はスキップ', async () => {
    await useAiStore.getState().analyze();
    expect(invoke).not.toHaveBeenCalled();
    expect(useAiStore.getState().analyzing).toBe(false);
  });

  it('clearError: エラーをクリア', () => {
    useAiStore.setState({ error: 'some error' });
    useAiStore.getState().clearError();
    expect(useAiStore.getState().error).toBeNull();
  });
});
