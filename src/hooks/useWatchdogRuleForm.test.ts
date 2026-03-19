import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { WatchdogRule } from '../types';
import { useWatchdogRuleForm } from './useWatchdogRuleForm';

const BASE_RULE: WatchdogRule = {
  id: 'r-1',
  name: 'High CPU',
  enabled: true,
  conditions: [{ metric: 'cpuPercent', operator: 'greaterThan', threshold: 80 }],
  action: 'suspend',
  processFilter: { includeNames: ['game.exe'], excludeNames: [] },
  profileId: null,
  cooldownSecs: 30,
  lastTriggeredAt: null,
};

describe('useWatchdogRuleForm', () => {
  it('editingRule から初期値が設定される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, vi.fn(), vi.fn()));
    expect(result.current.rule.name).toBe('High CPU');
    expect(result.current.rule.conditions).toHaveLength(1);
  });

  it('editingRule が null のときデフォルト値が設定される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(null, vi.fn(), vi.fn()));
    expect(result.current.rule.name).toBe('');
    expect(result.current.rule.action).toBe('suspend');
  });

  it('updateRule でルールが更新される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, vi.fn(), vi.fn()));
    act(() => result.current.updateRule({ name: 'Updated' }));
    expect(result.current.rule.name).toBe('Updated');
  });

  it('addCondition でコンディションが追加される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, vi.fn(), vi.fn()));
    act(() => result.current.addCondition());
    expect(result.current.rule.conditions).toHaveLength(2);
  });

  it('removeCondition でコンディションが削除される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, vi.fn(), vi.fn()));
    act(() => result.current.removeCondition(0));
    expect(result.current.rule.conditions).toHaveLength(0);
  });

  it('updateCondition で特定コンディションが更新される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, vi.fn(), vi.fn()));
    act(() => result.current.updateCondition(0, { threshold: 95 }));
    expect(result.current.rule.conditions[0].threshold).toBe(95);
  });

  it('handleSave は name が空の場合 onSave を呼ばない', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useWatchdogRuleForm({ ...BASE_RULE, name: '' }, onSave, onClose),
    );
    // alert をモック
    vi.stubGlobal('alert', vi.fn());
    act(() => result.current.handleSave());
    expect(onSave).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('handleSave は有効なルールで onSave と onClose を呼ぶ', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, onSave, onClose));
    act(() => result.current.handleSave());
    expect(onSave).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('removeIncludeName でフィルタリストが更新される', () => {
    const { result } = renderHook(() => useWatchdogRuleForm(BASE_RULE, vi.fn(), vi.fn()));
    act(() => result.current.removeIncludeName(0));
    expect(result.current.rule.processFilter.includeNames).toHaveLength(0);
  });
});
