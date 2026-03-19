import { invoke } from '@tauri-apps/api/core';
import { create } from 'zustand';
import log from '../lib/logger';
import { extractErrorMessage } from '../lib/tauri';
import type {
  BottleneckResult,
  FrameTimeMonitorState,
  HardwareInfo,
  ResourceSnapshot,
} from '../types';

// get_frame_time_status は FrameTimeMonitorState を返す（fps/frame data は含まない）

interface BottleneckState {
  bottleneck: BottleneckResult | null;
  isRunning: boolean;
  isAnalyzing: boolean;
  error: string | null;
  _interval: NodeJS.Timeout | null;
}

interface BottleneckActions {
  analyzeBottleneck: () => Promise<void>;
  startAutoAnalysis: () => void;
  stopAutoAnalysis: () => void;
  reset: () => void;
}

export const useBottleneckStore = create<BottleneckState & BottleneckActions>((set, get) => ({
  bottleneck: null,
  isRunning: false,
  isAnalyzing: false,
  error: null,
  _interval: null,

  analyzeBottleneck: async () => {
    const { isAnalyzing } = get();
    if (isAnalyzing) return;

    set({ isAnalyzing: true, error: null });

    try {
      // pulse / hardware の最新データを集約
      const pulseData = await invoke<ResourceSnapshot>('get_resource_snapshot');
      const hardwareData = await invoke<HardwareInfo>('get_hardware_info');

      // フレームタイム監視状態のみ確認（fps データは get_frame_time_status に含まれない）
      let isFrameTimeRunning = false;
      try {
        const frameTimeState = await invoke<FrameTimeMonitorState>('get_frame_time_status');
        isFrameTimeRunning = frameTimeState.type === 'running';
      } catch (_err) {
        // frameTime 監視が未開始の場合は無視
      }

      // BottleneckRequest を構築
      const request = {
        avgFps: 0, // フレームタイム統計は未実装（将来拡張）
        pct1Low: 0,
        stutterCount: 0,
        frameTimes: [] as number[],
        isFrameTimeRunning,
        cpuPercent: pulseData.cpuPercent,
        gpuUsagePercent: hardwareData.gpuUsagePercent ?? null,
        gpuTempC: hardwareData.gpuTempC ?? null,
        memUsedMb: pulseData.memUsedMb,
        memTotalMb: pulseData.memTotalMb,
        gpuVramUsedMb: hardwareData.gpuVramUsedMb ?? null,
        gpuVramTotalMb: hardwareData.gpuVramTotalMb ?? null,
        diskReadKb: pulseData.diskReadKb,
        diskWriteKb: pulseData.diskWriteKb,
      };

      const result = await invoke<BottleneckResult>('analyze_bottleneck', { request });

      set({
        bottleneck: result,
        isAnalyzing: false,
        error: null,
      });
    } catch (err) {
      const msg = extractErrorMessage(err);
      log.error({ err }, 'bottleneck: 分析失敗: %s', msg);
      set({ error: msg, isAnalyzing: false });
    }
  },

  startAutoAnalysis: () => {
    const { isRunning } = get();
    if (isRunning) return;

    set({ isRunning: true });

    // 2秒間隔で自動分析（フレームタイム監視中のみ）
    const interval = setInterval(() => {
      invoke<FrameTimeMonitorState>('get_frame_time_status')
        .then((state) => {
          if (state.type === 'running') {
            return get().analyzeBottleneck();
          }
        })
        .catch(() => {
          // frameTime 監視が未開始の場合は何もしない
        });
    }, 2000);

    // ストアにinterval IDを保持（クリーンアップ用）
    set({ _interval: interval });
  },

  stopAutoAnalysis: () => {
    const { isRunning, _interval } = get();
    if (!isRunning) return;

    if (_interval) {
      clearInterval(_interval);
    }

    set({ isRunning: false, _interval: null });
  },

  reset: () => {
    const { _interval } = get();
    if (_interval) {
      clearInterval(_interval);
    }

    set({
      bottleneck: null,
      isRunning: false,
      isAnalyzing: false,
      error: null,
      _interval: null,
    });
  },
}));
