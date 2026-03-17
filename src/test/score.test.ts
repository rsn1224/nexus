import { describe, expect, it } from 'vitest';
import { calcScore, createProgressBar, getScoreRank } from '../lib/score';

describe('calcScore', () => {
  it('should calculate score with all data available', () => {
    const result = calcScore({
      cpuPercent: 30,
      memUsedGb: 8,
      memTotalGb: 16,
      diskUsagePercent: 50,
      gpuUsagePercent: 20,
    });

    expect(result).toBe(61); // CPU:70*0.4=28, MEM:50*0.3=15, DISK:50*0.2=10, GPU:80*0.1=8, Total=61
  });

  it('should handle null values by normalizing weights', () => {
    const result = calcScore({
      cpuPercent: 30,
      memUsedGb: 8,
      memTotalGb: 16,
      diskUsagePercent: null,
      gpuUsagePercent: null,
    });

    // CPU 40% + MEM 60% normalized weights: CPU=0.4/0.7≈0.571, MEM=0.3/0.7≈0.429
    // Score: (70*0.571 + 50*0.429) = 61.4 -> 61
    expect(result).toBe(61);
  });

  it('should return null when all values are null', () => {
    const result = calcScore({
      cpuPercent: null,
      memUsedGb: null,
      memTotalGb: null,
      diskUsagePercent: null,
      gpuUsagePercent: null,
    });

    expect(result).toBe(null);
  });

  it('should clamp score between 0 and 100', () => {
    const highUsage = calcScore({
      cpuPercent: 100,
      memUsedGb: 16,
      memTotalGb: 16,
      diskUsagePercent: 100,
      gpuUsagePercent: 100,
    });

    const lowUsage = calcScore({
      cpuPercent: 0,
      memUsedGb: 0,
      memTotalGb: 16,
      diskUsagePercent: 0,
      gpuUsagePercent: 0,
    });

    expect(highUsage).toBe(0);
    expect(lowUsage).toBe(100);
  });

  it('should handle division by zero for memory', () => {
    const result = calcScore({
      cpuPercent: 30,
      memUsedGb: 8,
      memTotalGb: 0,
      diskUsagePercent: 50,
      gpuUsagePercent: 20,
    });

    // CPU 40% + DISK 20% + GPU 10% = 70% total weight
    // Normalized: CPU=0.4/0.7≈0.571, DISK=0.2/0.7≈0.286, GPU=0.1/0.7≈0.143
    // Score: (70*0.571 + 50*0.286 + 80*0.143) = 66.4 -> 66
    expect(result).toBe(66);
  });
});

describe('getScoreRank', () => {
  it('should return EXCELLENT for scores >= 90', () => {
    const result = getScoreRank(95);
    expect(result).toEqual({
      label: 'EXCELLENT',
      color: 'var(--color-success-500)',
    });
  });

  it('should return GOOD for scores >= 75', () => {
    const result = getScoreRank(80);
    expect(result).toEqual({
      label: 'GOOD',
      color: 'var(--color-cyan-500)',
    });
  });

  it('should return FAIR for scores >= 50', () => {
    const result = getScoreRank(60);
    expect(result).toEqual({
      label: 'FAIR',
      color: 'var(--color-accent-400)',
    });
  });

  it('should return POOR for scores < 50', () => {
    const result = getScoreRank(30);
    expect(result).toEqual({
      label: 'POOR',
      color: 'var(--color-danger-500)',
    });
  });
});

describe('createProgressBar', () => {
  it('should create correct progress bar', () => {
    const result = createProgressBar(75, 10);
    expect(result).toBe('████████░░'); // 7.5 -> 8 filled, 2 empty
  });

  it('should handle 0%', () => {
    const result = createProgressBar(0, 5);
    expect(result).toBe('░░░░░');
  });

  it('should handle 100%', () => {
    const result = createProgressBar(100, 5);
    expect(result).toBe('█████');
  });

  it('should round correctly', () => {
    const result = createProgressBar(49, 10);
    expect(result).toBe('█████░░░░░'); // 4.9 -> 5 filled
  });

  it('should use default length of 10', () => {
    const result = createProgressBar(50);
    expect(result).toBe('█████░░░░░'); // 5 filled, 5 empty
  });
});
