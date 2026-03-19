import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTimerStore } from '../../stores/useTimerStore';
import TimerSection from './TimerSection';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('TimerSection', () => {
  it('読み込み状態を表示する', () => {
    useTimerStore.setState({ isLoading: true, timerState: null, error: null, isApplying: false });
    render(<TimerSection />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('プリセットボタンが表示される', () => {
    useTimerStore.setState({
      isLoading: false,
      isApplying: false,
      error: null,
      timerState: {
        current100ns: 156250,
        nexusRequested100ns: null,
        default100ns: 156250,
        minimum100ns: 5000,
        maximum100ns: 156250,
      },
    });
    render(<TimerSection />);
    expect(screen.getByText('0.5 ms（最小）')).toBeInTheDocument();
    expect(screen.getByText('1.0 ms')).toBeInTheDocument();
  });
});
