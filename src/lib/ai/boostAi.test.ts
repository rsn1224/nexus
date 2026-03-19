import { describe, expect, it } from 'vitest';
import type { WinSetting } from '../../types';
import { CPU_USAGE_BOOST_WARN_PCT } from '../constants';
import { boostPageSuggestions } from './boostAi';

function makeSetting(id: string, isOptimized: boolean): WinSetting {
  return { id, label: id, isOptimized } as WinSetting;
}

describe('boostPageSuggestions', () => {
  it('全設定が最適化済みでCPU正常ならok提案を返す', () => {
    const win = [makeSetting('a', true)];
    const net = [makeSetting('b', true)];
    const result = boostPageSuggestions(win, net, 30);
    expect(result.some((s) => s.level === 'ok')).toBe(true);
  });

  it('Windows設定が全て未最適化ならwarn提案を返す', () => {
    const win = [makeSetting('a', false), makeSetting('b', false)];
    const result = boostPageSuggestions(win, [], null);
    expect(result.some((s) => s.id === 'no_win_opt')).toBe(true);
    expect(result.find((s) => s.id === 'no_win_opt')?.level).toBe('warn');
  });

  it('Windows設定が一部最適化済みならinfo提案を返す', () => {
    const win = [makeSetting('a', true), makeSetting('b', false)];
    const result = boostPageSuggestions(win, [], null);
    expect(result.some((s) => s.id === 'partial_win_opt')).toBe(true);
    expect(result.find((s) => s.id === 'partial_win_opt')?.message).toContain('1/2');
  });

  it('power_planが未最適化ならwarn提案を返す', () => {
    const win = [makeSetting('power_plan', false)];
    const result = boostPageSuggestions(win, [], null);
    expect(result.some((s) => s.id === 'power_plan_warn')).toBe(true);
  });

  it('ネット設定が全て未最適化ならinfo提案を返す', () => {
    const win = [makeSetting('a', true)];
    const net = [makeSetting('n1', false), makeSetting('n2', false)];
    const result = boostPageSuggestions(win, net, null);
    expect(result.some((s) => s.id === 'no_net_opt')).toBe(true);
  });

  it('CPU使用率が閾値以上ならwarn提案を返す', () => {
    const win = [makeSetting('a', true)];
    const result = boostPageSuggestions(win, [], CPU_USAGE_BOOST_WARN_PCT);
    expect(result.some((s) => s.id === 'boost_cpu')).toBe(true);
    expect(result.find((s) => s.id === 'boost_cpu')?.level).toBe('warn');
  });

  it('CPU使用率が閾値未満ならboost_cpu提案なし', () => {
    const win = [makeSetting('a', true)];
    const result = boostPageSuggestions(win, [], CPU_USAGE_BOOST_WARN_PCT - 1);
    expect(result.some((s) => s.id === 'boost_cpu')).toBe(false);
  });

  it('cpuPercentがnullならboost_cpu提案なし', () => {
    const win = [makeSetting('a', true)];
    const result = boostPageSuggestions(win, [], null);
    expect(result.some((s) => s.id === 'boost_cpu')).toBe(false);
  });

  it('結果は最大3件に制限される（sortAndSlice経由）', () => {
    const win = [makeSetting('power_plan', false), makeSetting('b', false)];
    const net = [makeSetting('n1', false)];
    const result = boostPageSuggestions(win, net, 95);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('空の設定配列で問題が起きないこと', () => {
    const result = boostPageSuggestions([], [], null);
    expect(result).toHaveLength(1);
    expect(result[0].level).toBe('ok');
  });
});
