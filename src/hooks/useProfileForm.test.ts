import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useProfileForm } from './useProfileForm';

describe('useProfileForm', () => {
  it('initial が未指定の場合デフォルト値が設定される', () => {
    const { result } = renderHook(() => useProfileForm(undefined, vi.fn()));
    expect(result.current.displayName).toBe('');
    expect(result.current.exePath).toBe('');
    expect(result.current.boostLevel).toBe('none');
    expect(result.current.autoSuspendEnabled).toBe(false);
  });

  it('initial から値が正しく初期化される', () => {
    const { result } = renderHook(() =>
      useProfileForm(
        {
          displayName: 'My Game',
          exePath: 'C:\\game.exe',
          boostLevel: 'hard',
          autoSuspendEnabled: true,
          processesToSuspend: ['chrome.exe', 'discord.exe'],
        },
        vi.fn(),
      ),
    );
    expect(result.current.displayName).toBe('My Game');
    expect(result.current.exePath).toBe('C:\\game.exe');
    expect(result.current.boostLevel).toBe('hard');
    expect(result.current.processesToSuspend).toBe('chrome.exe, discord.exe');
    expect(result.current.autoSuspendEnabled).toBe(true);
  });

  it('handleSubmit は displayName が空だと onSave を呼ばない', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useProfileForm(undefined, onSave));
    act(() => result.current.handleSubmit());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('handleSubmit は exePath が空だと onSave を呼ばない', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() => useProfileForm({ displayName: 'Game' }, onSave));
    act(() => result.current.handleSubmit());
    expect(onSave).not.toHaveBeenCalled();
  });

  it('handleSubmit は正しい GameProfile で onSave を呼ぶ', () => {
    const onSave = vi.fn();
    const { result } = renderHook(() =>
      useProfileForm({ displayName: 'Elden Ring', exePath: 'C:\\er.exe' }, onSave),
    );
    act(() => result.current.handleSubmit());
    expect(onSave).toHaveBeenCalledOnce();
    const profile = onSave.mock.calls[0][0];
    expect(profile.displayName).toBe('Elden Ring');
    expect(profile.exePath).toBe('C:\\er.exe');
  });

  it('setBoostLevel で boostLevel が更新される', () => {
    const { result } = renderHook(() => useProfileForm(undefined, vi.fn()));
    act(() => result.current.setBoostLevel('medium'));
    expect(result.current.boostLevel).toBe('medium');
  });
});
