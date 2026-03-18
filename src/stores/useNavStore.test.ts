import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavStore } from './useNavStore';

function resetStore(): void {
  useNavStore.setState({
    navigate: () => {},
    setNavigate: useNavStore.getState().setNavigate,
  });
}

describe('useNavStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('navigate is a no-op by default', () => {
    expect(() => useNavStore.getState().navigate('home')).not.toThrow();
  });

  it('setNavigate replaces the navigate function', () => {
    const mockNavigate = vi.fn();
    useNavStore.getState().setNavigate(mockNavigate);
    useNavStore.getState().navigate('performance');
    expect(mockNavigate).toHaveBeenCalledWith('performance');
  });

  it('navigate calls the registered function with the correct wing id', () => {
    const mockNavigate = vi.fn();
    useNavStore.getState().setNavigate(mockNavigate);
    useNavStore.getState().navigate('storage');
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('storage');
  });
});
