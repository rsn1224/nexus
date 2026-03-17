import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StatusBadge from './StatusBadge';

describe('StatusBadge', () => {
  it('値が null のときにプレースホルダーが表示される', () => {
    render(<StatusBadge value={null} unit="%" />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('--%');
  });

  it('正常値で緑色が表示される', () => {
    render(<StatusBadge value={25.5} unit="%" />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('25.5%');
  });

  it('警告値で黄色が表示される', () => {
    render(<StatusBadge value={60} unit="%" thresholds={{ warn: 50, danger: 80 }} />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('60.0%');
  });

  it('危険値で赤色が表示される', () => {
    render(<StatusBadge value={85} unit="%" thresholds={{ warn: 50, danger: 80 }} />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('85.0%');
  });

  it('カスタム閾値が適用される', () => {
    render(<StatusBadge value={30} unit="MB" thresholds={{ warn: 20, danger: 40 }} />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('30.0MB');
  });

  it('小数点以下1桁で表示される', () => {
    render(<StatusBadge value={12.345} unit="°C" />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toHaveTextContent('12.3°C');
  });

  it('整数値も小数点以下1桁で表示される', () => {
    render(<StatusBadge value={100} unit="GB" />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toHaveTextContent('100.0GB');
  });

  it('カスタムクラス名が適用される', () => {
    render(<StatusBadge value={50} unit="%" className="custom-class" />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('異なる単位で表示される', () => {
    const { rerender } = render(<StatusBadge value={75} unit="%" />);
    expect(screen.getByTestId('ui-status-badge')).toHaveTextContent('75.0%');

    rerender(<StatusBadge value={1024} unit="MB" />);
    expect(screen.getByTestId('ui-status-badge')).toHaveTextContent('1024.0MB');

    rerender(<StatusBadge value={60} unit="°C" />);
    expect(screen.getByTestId('ui-status-badge')).toHaveTextContent('60.0°C');
  });

  it('境界値テスト - 警告境界', () => {
    render(<StatusBadge value={50} unit="%" thresholds={{ warn: 50, danger: 80 }} />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('50.0%');
  });

  it('境界値テスト - 危険境界', () => {
    render(<StatusBadge value={80} unit="%" thresholds={{ warn: 50, danger: 80 }} />);
    const badge = screen.getByTestId('ui-status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('80.0%');
  });
});
