import { describe, expect, it } from 'vitest';
import { boostPageSuggestions, homePageSuggestions, launcherPageSuggestions } from '../lib/localAi';
import type { DiskDrive, HardwareInfo, ResourceSnapshot, WinSetting } from '../types';

// HardwareInfo のベースオブジェクト（全 null）
const baseHw: HardwareInfo = {
  cpuName: 'Test CPU',
  cpuTempC: null,
  gpuName: null,
  gpuVramTotalMb: null,
  gpuVramUsedMb: null,
  gpuTempC: null,
  gpuUsagePercent: null,
};

describe('homePageSuggestions', () => {
  describe('GPU 温度境界値', () => {
    it('gpuTempC が null → GPU サジェストなし', () => {
      const result = homePageSuggestions(null, [], { ...baseHw, gpuTempC: null });
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('gpu_temp_warn');
      expect(ids).not.toContain('gpu_temp_critical');
    });

    it('gpuTempC === 84 → サジェストなし', () => {
      const result = homePageSuggestions(null, [], { ...baseHw, gpuTempC: 84 });
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('gpu_temp_warn');
      expect(ids).not.toContain('gpu_temp_critical');
    });

    it('gpuTempC === 85 → gpu_temp_warn', () => {
      const result = homePageSuggestions(null, [], { ...baseHw, gpuTempC: 85 });
      expect(result.map((s) => s.id)).toContain('gpu_temp_warn');
    });

    it('gpuTempC === 94 → gpu_temp_warn (critical でない)', () => {
      const result = homePageSuggestions(null, [], { ...baseHw, gpuTempC: 94 });
      const ids = result.map((s) => s.id);
      expect(ids).toContain('gpu_temp_warn');
      expect(ids).not.toContain('gpu_temp_critical');
    });

    it('gpuTempC === 95 → gpu_temp_critical', () => {
      const result = homePageSuggestions(null, [], { ...baseHw, gpuTempC: 95 });
      expect(result.map((s) => s.id)).toContain('gpu_temp_critical');
    });
  });

  // 追加テスト A：CPU 使用率境界値
  // homePageSuggestions が snapshot を受け取るため、テストを実装
  describe('CPU 使用率境界値', () => {
    // snapshot の雛形（cpuPercent のみ変える）
    const baseSnapshot: ResourceSnapshot = {
      timestamp: Date.now(),
      cpuPercent: 0,
      cpuTempC: null,
      memUsedMb: 0,
      memTotalMb: 10000,
      diskReadKb: 0,
      diskWriteKb: 0,
      netRecvKb: 0,
      netSentKb: 0,
    };

    it('cpuPercent === 69 → CPU 使用率サジェストなし', () => {
      const result = homePageSuggestions({ ...baseSnapshot, cpuPercent: 69 }, [], { ...baseHw });
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('cpu_usage_warn');
      expect(ids).not.toContain('cpu_usage_critical');
    });

    it('cpuPercent === 70 → cpu_usage_warn', () => {
      const result = homePageSuggestions({ ...baseSnapshot, cpuPercent: 70 }, [], { ...baseHw });
      expect(result.map((s) => s.id)).toContain('cpu_usage_warn');
    });

    it('cpuPercent === 89 → cpu_usage_warn (critical でない)', () => {
      const result = homePageSuggestions({ ...baseSnapshot, cpuPercent: 89 }, [], { ...baseHw });
      const ids = result.map((s) => s.id);
      expect(ids).toContain('cpu_usage_warn');
      expect(ids).not.toContain('cpu_usage_critical');
    });

    it('cpuPercent === 90 → cpu_usage_critical', () => {
      const result = homePageSuggestions({ ...baseSnapshot, cpuPercent: 90 }, [], { ...baseHw });
      expect(result.map((s) => s.id)).toContain('cpu_usage_critical');
    });

    it('cpuPercent === 91 → cpu_usage_critical', () => {
      const result = homePageSuggestions({ ...baseSnapshot, cpuPercent: 91 }, [], { ...baseHw });
      expect(result.map((s) => s.id)).toContain('cpu_usage_critical');
    });
  });

  // 追加テスト B：メモリ境界値
  describe('メモリ境界値', () => {
    const baseSnapshot: ResourceSnapshot = {
      timestamp: Date.now(),
      cpuPercent: 0,
      cpuTempC: null,
      memUsedMb: 0,
      memTotalMb: 10000,
      diskReadKb: 0,
      diskWriteKb: 0,
      netRecvKb: 0,
      netSentKb: 0,
    };

    it('7400/10000 = 74% → mem_warn / mem_critical なし', () => {
      const result = homePageSuggestions({ ...baseSnapshot, memUsedMb: 7400 }, [], { ...baseHw });
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('mem_warn');
      expect(ids).not.toContain('mem_critical');
    });

    it('7500/10000 = 75% → mem_warn', () => {
      const result = homePageSuggestions({ ...baseSnapshot, memUsedMb: 7500 }, [], { ...baseHw });
      expect(result.map((s) => s.id)).toContain('mem_warn');
    });

    it('8900/10000 = 89% → mem_warn (critical でない)', () => {
      const result = homePageSuggestions({ ...baseSnapshot, memUsedMb: 8900 }, [], { ...baseHw });
      const ids = result.map((s) => s.id);
      expect(ids).toContain('mem_warn');
      expect(ids).not.toContain('mem_critical');
    });

    it('9000/10000 = 90% → mem_critical', () => {
      const result = homePageSuggestions({ ...baseSnapshot, memUsedMb: 9000 }, [], { ...baseHw });
      expect(result.map((s) => s.id)).toContain('mem_critical');
    });
  });

  // 追加テスト C：ディスク境界値
  describe('ディスク境界値', () => {
    const GB = 1024 * 1024 * 1024;
    const makeDrive = (usedPercent: number): DiskDrive[] => [
      {
        name: 'C',
        model: 'Test SSD',
        sizeBytes: 100 * GB,
        usedBytes: usedPercent * GB,
        availableBytes: (100 - usedPercent) * GB,
        fileSystem: 'NTFS',
        mountPoint: 'C:\\',
        isRemovable: false,
        healthStatus: 'Good',
      },
    ];

    it('84% → disk_warn なし', () => {
      const result = homePageSuggestions(null, makeDrive(84), { ...baseHw });
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('disk_warn_C');
      expect(ids).not.toContain('disk_critical_C');
    });

    it('85% → disk_warn を含む', () => {
      const result = homePageSuggestions(null, makeDrive(85), { ...baseHw });
      expect(result.map((s) => s.id)).toContain('disk_warn_C');
    });

    it('94% → disk_warn を含む (critical でない)', () => {
      const result = homePageSuggestions(null, makeDrive(94), { ...baseHw });
      const ids = result.map((s) => s.id);
      expect(ids).toContain('disk_warn_C');
      expect(ids).not.toContain('disk_critical_C');
    });

    it('95% → disk_critical を含む', () => {
      const result = homePageSuggestions(null, makeDrive(95), { ...baseHw });
      expect(result.map((s) => s.id)).toContain('disk_critical_C');
    });
  });

  // 追加テスト D：boostPageSuggestions
  describe('boostPageSuggestions', () => {
    const makeWin = (isOptimized: boolean): WinSetting => ({
      id: 'test',
      label: 'Test',
      description: '',
      isOptimized,
      canRevert: false,
    });

    it('winSettings 全3件最適化済み → all_optimized を含む', () => {
      const result = boostPageSuggestions([makeWin(true), makeWin(true), makeWin(true)], [], null);
      expect(result.map((s) => s.id)).toContain('all_optimized');
    });

    it('winSettings 全3件未最適化 → no_win_opt を含む', () => {
      const result = boostPageSuggestions(
        [makeWin(false), makeWin(false), makeWin(false)],
        [],
        null,
      );
      expect(result.map((s) => s.id)).toContain('no_win_opt');
    });

    it('winSettings 3件中2件最適化済み → partial_win_opt を含む', () => {
      const result = boostPageSuggestions([makeWin(true), makeWin(true), makeWin(false)], [], null);
      expect(result.map((s) => s.id)).toContain('partial_win_opt');
    });
  });

  // 追加テスト E：launcherPageSuggestions
  describe('launcherPageSuggestions', () => {
    it('gameCount=0 → no_games を含む', () => {
      const result = launcherPageSuggestions(0, 0);
      expect(result.map((s) => s.id)).toContain('no_games');
    });

    it('gameCount=5, favoriteCount=0 → no_favorites を含む', () => {
      const result = launcherPageSuggestions(5, 0);
      expect(result.map((s) => s.id)).toContain('no_favorites');
    });

    it('gameCount=5, favoriteCount=2 → games_ok を含む', () => {
      const result = launcherPageSuggestions(5, 2);
      expect(result.map((s) => s.id)).toContain('games_ok');
    });
  });

  // 追加テスト F：sortAndSlice（homePageSuggestions 経由で検証）
  describe('sortAndSlice 動作検証', () => {
    const baseSnapshot: ResourceSnapshot = {
      timestamp: Date.now(),
      cpuPercent: 0,
      cpuTempC: null,
      memUsedMb: 0,
      memTotalMb: 10000,
      diskReadKb: 0,
      diskWriteKb: 0,
      netRecvKb: 0,
      netSentKb: 0,
    };

    it('critical が warn より前', () => {
      const result = homePageSuggestions({ ...baseSnapshot, cpuPercent: 91 }, [], {
        ...baseHw,
        gpuTempC: 85,
      });
      expect(result[0].level).toBe('critical');
    });

    it('max 切り捨て（4件以上）', () => {
      const result = homePageSuggestions(
        { ...baseSnapshot, cpuPercent: 95, memUsedMb: 9000 },
        [{ name: 'C', totalGb: 100, freeGb: 5, usedPercent: 95 }],
        { ...baseHw, cpuTempC: 95, gpuTempC: 95 },
      );
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('CPU 温度境界値', () => {
    it('cpuTempC が null → CPU サジェストなし', () => {
      const result = homePageSuggestions(null, [], { ...baseHw, cpuTempC: null });
      const ids = result.map((s) => s.id);
      expect(ids).not.toContain('temp_warn');
      expect(ids).not.toContain('temp_critical');
      expect(ids).not.toContain('cpu_usage_warn');
      expect(ids).not.toContain('cpu_usage_critical');
    });

    it('cpuTempC === 84 → temp_warn', () => {
      const result = homePageSuggestions(
        {
          timestamp: Date.now(),
          cpuPercent: 0,
          memUsedMb: 0,
          memTotalMb: 10000,
          cpuTempC: null,
          diskReadKb: 0,
          diskWriteKb: 0,
          netRecvKb: 0,
          netSentKb: 0,
        },
        [],
        { ...baseHw, cpuTempC: 84 },
      );

      expect(result.map((s) => s.id)).toContain('temp_warn');
    });

    it('cpuTempC === 85 → temp_warn', () => {
      const result = homePageSuggestions(
        {
          timestamp: Date.now(),
          cpuPercent: 0,
          memUsedMb: 0,
          memTotalMb: 10000,
          cpuTempC: null,
          diskReadKb: 0,
          diskWriteKb: 0,
          netRecvKb: 0,
          netSentKb: 0,
        },
        [],
        { ...baseHw, cpuTempC: 85 },
      );
      expect(result.map((s) => s.id)).toContain('temp_warn');
    });

    it('cpuTempC === 95 → temp_critical', () => {
      const result = homePageSuggestions(
        {
          timestamp: Date.now(),
          cpuPercent: 0,
          memUsedMb: 0,
          memTotalMb: 10000,
          cpuTempC: null,
          diskReadKb: 0,
          diskWriteKb: 0,
          netRecvKb: 0,
          netSentKb: 0,
        },
        [],
        { ...baseHw, cpuTempC: 95 },
      );
      expect(result.map((s) => s.id)).toContain('temp_critical');
    });
  });

  it('hwInfo が null → 空配列を返す', () => {
    const result = homePageSuggestions(null, [], null);
    expect(result).toEqual([]);
  });
});
