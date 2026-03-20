import { describe, expect, it } from 'vitest';
import type { HealthInput } from '../types/v2';
import { generateSuggestions } from './suggestionEngine';

const baseInput: HealthInput = {
  gameModeEnabled: true,
  powerPlanHighPerf: true,
  timerResolutionLow: true,
  nagleDisabled: true,
  visualEffectsOff: true,
  cpuTemp: 60,
  gpuTemp: 70,
  cpuUsage: 20,
  gpuUsage: 30,
  memUsedGb: 8,
  memTotalGb: 32,
  bottleneckRatio: 0.1,
};

describe('generateSuggestions', () => {
  it('returns empty array when all settings are optimal', () => {
    const result = generateSuggestions(baseInput);
    expect(result).toHaveLength(0);
  });

  it('suggests game-mode when gameModeEnabled is false', () => {
    const input = { ...baseInput, gameModeEnabled: false };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'game-mode');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('critical');
    expect(suggestion?.canRollback).toBe(true);
  });

  it('suggests power-plan when powerPlanHighPerf is false', () => {
    const input = { ...baseInput, powerPlanHighPerf: false };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'power-plan');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('critical');
    expect(suggestion?.actions[0].invokeCommand).toBe('set_power_plan');
  });

  it('suggests timer-res when timerResolutionLow is false', () => {
    const input = { ...baseInput, timerResolutionLow: false };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'timer-res');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('recommended');
  });

  it('suggests nagle when nagleDisabled is false', () => {
    const input = { ...baseInput, nagleDisabled: false };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'nagle');
    expect(suggestion).toBeDefined();
    expect(suggestion?.category).toBe('network_optimization');
  });

  it('suggests visual-effects when visualEffectsOff is false', () => {
    const input = { ...baseInput, visualEffectsOff: false };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'visual-effects');
    expect(suggestion).toBeDefined();
    expect(suggestion?.isApplied).toBe(false);
  });

  it('adds cpu-thermal warning when CPU temp >= 80', () => {
    const input = { ...baseInput, cpuTemp: 82 };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'cpu-thermal');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('critical');
    expect(suggestion?.canRollback).toBe(false);
    expect(suggestion?.actions).toHaveLength(0);
  });

  it('does not add cpu-thermal below threshold', () => {
    const input = { ...baseInput, cpuTemp: 79 };
    const result = generateSuggestions(input);
    expect(result.find((s) => s.id === 'cpu-thermal')).toBeUndefined();
  });

  it('adds gpu-thermal warning when GPU temp >= 85', () => {
    const input = { ...baseInput, gpuTemp: 90 };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'gpu-thermal');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('critical');
  });

  it('adds mem-pressure when memory ratio >= 80%', () => {
    const input = { ...baseInput, memUsedGb: 26, memTotalGb: 32 };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'mem-pressure');
    expect(suggestion).toBeDefined();
    expect(suggestion?.actions[0].invokeCommand).toBe('manual_memory_cleanup');
  });

  it('does not add mem-pressure below threshold', () => {
    const input = { ...baseInput, memUsedGb: 20, memTotalGb: 32 };
    const result = generateSuggestions(input);
    expect(result.find((s) => s.id === 'mem-pressure')).toBeUndefined();
  });

  it('adds bottleneck when ratio >= 0.3', () => {
    const input = { ...baseInput, bottleneckRatio: 0.5 };
    const result = generateSuggestions(input);
    const suggestion = result.find((s) => s.id === 'bottleneck');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('critical');
  });

  it('adds heavy-process when heavyProcessCount >= 3', () => {
    const result = generateSuggestions(baseInput, 3);
    const suggestion = result.find((s) => s.id === 'heavy-process');
    expect(suggestion).toBeDefined();
    expect(suggestion?.priority).toBe('recommended');
  });

  it('does not add heavy-process when count < 3', () => {
    const result = generateSuggestions(baseInput, 2);
    expect(result.find((s) => s.id === 'heavy-process')).toBeUndefined();
  });

  it('returns multiple suggestions when multiple settings are suboptimal', () => {
    const input: HealthInput = {
      ...baseInput,
      gameModeEnabled: false,
      powerPlanHighPerf: false,
      timerResolutionLow: false,
    };
    const result = generateSuggestions(input);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.map((s) => s.id)).toContain('game-mode');
    expect(result.map((s) => s.id)).toContain('power-plan');
    expect(result.map((s) => s.id)).toContain('timer-res');
  });

  it('handles zero total memory gracefully', () => {
    const input = { ...baseInput, memUsedGb: 0, memTotalGb: 0 };
    expect(() => generateSuggestions(input)).not.toThrow();
  });
});
