import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BottleneckResult } from '../types';
import { useBottleneckStore } from './useBottleneckStore';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// ストア状態を取得するヘルパー（stale reference 回避）
const getStore = () => useBottleneckStore.getState();

describe('useBottleneckStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStore().reset();
  });

  describe('analyzeBottleneck', () => {
    it('should analyze bottleneck successfully', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      const mockResult: BottleneckResult = {
        primary: 'cpu',
        confidence: 'medium',
        scores: { cpu: 0.5, gpu: 0.8, memory: 0.5, storage: 0.03 },
        suggestions: [
          {
            id: 'cpu-affinity',
            message: 'CPU アフィニティを P コアのみに変更すると改善する可能性があります',
            action: 'boost',
          },
        ],
        timestamp: Date.now(),
      };

      vi.mocked(invoke)
        .mockResolvedValueOnce({
          cpuPercent: 50,
          memory: { usedMb: 8192, totalMb: 16384 },
          disk: { readKb: 1024, writeKb: 512 },
        })
        .mockResolvedValueOnce({
          gpuUsagePercent: 80,
          gpuTempC: 70,
          gpuVramUsedMb: 4000,
          gpuVramTotalMb: 8000,
        })
        .mockResolvedValueOnce({
          type: 'running',
          avgFps: 60,
          pct1Low: 45,
          stutterCount: 1,
          frameTimes: [16.6, 16.7, 16.5],
        })
        .mockResolvedValueOnce(mockResult);

      await getStore().analyzeBottleneck();

      const state = getStore();
      expect(state.bottleneck).toEqual({
        primary: 'cpu',
        confidence: 'medium',
        scores: { cpu: 0.5, gpu: 0.8, memory: 0.5, storage: 0.03 },
        suggestions: [
          {
            id: 'cpu-affinity',
            message: 'CPU アフィニティを P コアのみに変更すると改善する可能性があります',
            action: 'boost',
          },
        ],
        timestamp: expect.any(Number),
      });
      expect(state.error).toBeNull();
      expect(state.isAnalyzing).toBe(false);
    });

    it('should handle analysis error', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockRejectedValue(new Error('API Error'));

      await getStore().analyzeBottleneck();

      const state = getStore();
      expect(state.bottleneck).toBeNull();
      expect(state.error).toBe('API Error');
      expect(state.isAnalyzing).toBe(false);
    });

    it('should not analyze if already analyzing', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke).mockResolvedValue({});

      // isAnalyzing を Zustand 経由で設定
      useBottleneckStore.setState({ isAnalyzing: true });

      await getStore().analyzeBottleneck();

      expect(invoke).not.toHaveBeenCalled();

      // クリーンアップ
      useBottleneckStore.setState({ isAnalyzing: false });
    });
  });

  describe('auto analysis', () => {
    beforeEach(() => {
      getStore().reset();
      vi.useFakeTimers();
    });

    afterEach(() => {
      getStore().stopAutoAnalysis();
      vi.useRealTimers();
    });

    it('should start auto analysis', () => {
      getStore().startAutoAnalysis();
      expect(getStore().isRunning).toBe(true);
    });

    it('should stop auto analysis', () => {
      getStore().startAutoAnalysis();
      getStore().stopAutoAnalysis();
      expect(getStore().isRunning).toBe(false);
    });

    it('should not start if already running', () => {
      getStore().startAutoAnalysis();
      getStore().startAutoAnalysis(); // 2回目
      expect(getStore().isRunning).toBe(true);
    });

    it('should analyze periodically when frame time is running', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      vi.mocked(invoke)
        // setInterval 内: get_frame_time_status
        .mockResolvedValueOnce({ type: 'running', avgFps: 60 })
        // analyzeBottleneck 内: get_resource_snapshot
        .mockResolvedValueOnce({
          cpuPercent: 50,
          memory: { usedMb: 8192, totalMb: 16384 },
          disk: { readKb: 1024, writeKb: 512 },
        })
        // analyzeBottleneck 内: get_hardware_info
        .mockResolvedValueOnce({ gpuUsagePercent: 80 })
        // analyzeBottleneck 内: get_frame_time_status (try-catch)
        .mockResolvedValueOnce({ type: 'running', avgFps: 60 })
        // analyzeBottleneck 内: analyze_bottleneck
        .mockResolvedValueOnce({
          primary: 'balanced',
          confidence: 'high',
          scores: { cpu: 0.5, gpu: 0.8, memory: 0.5, storage: 0.03 },
          suggestions: [],
          timestamp: Date.now(),
        } as BottleneckResult);

      getStore().startAutoAnalysis();

      // 2秒後に1回だけ実行
      await vi.advanceTimersByTimeAsync(2000);

      expect(getStore().bottleneck).not.toBeNull();
    });

    it('should not analyze when frame time is not running', async () => {
      const { invoke } = await import('@tauri-apps/api/core');
      // get_frame_time_status が stopped を返す
      vi.mocked(invoke).mockResolvedValue({ type: 'stopped' });

      const analyzeSpy = vi.spyOn(getStore(), 'analyzeBottleneck');

      getStore().startAutoAnalysis();
      await vi.advanceTimersByTimeAsync(2000);

      expect(analyzeSpy).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      useBottleneckStore.setState({
        bottleneck: {
          primary: 'cpu',
          confidence: 'high',
          scores: { cpu: 0.9, gpu: 0.3, memory: 0.5, storage: 0.1 },
          suggestions: [],
          timestamp: Date.now(),
        },
        isRunning: true,
        isAnalyzing: true,
        error: 'Some error',
        _interval: null,
      });

      getStore().reset();

      const state = getStore();
      expect(state.bottleneck).toBeNull();
      expect(state.isRunning).toBe(false);
      expect(state.isAnalyzing).toBe(false);
      expect(state.error).toBeNull();
      expect(state._interval).toBeNull();
    });
  });
});
