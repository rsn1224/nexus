import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Input from './Input';

describe('Input', () => {
  it('プレースホルダーが表示される', () => {
    render(<Input placeholder="入力してください" />);
    const input = screen.getByTestId('ui-input');
    expect(input).toHaveAttribute('placeholder', '入力してください');
  });

  it('値の変更イベントが発火する', async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    const input = screen.getByTestId('ui-input');
    await userEvent.type(input, 'テスト');
    expect(onChange).toHaveBeenCalledWith('テスト');
  });

  it('disabled で入力できない', async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} disabled />);
    const input = screen.getByTestId('ui-input');
    expect(input).toBeDisabled();
  });

  it('error 状態でエラースタイルが適用される', () => {
    render(<Input error />);
    const input = screen.getByTestId('ui-input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('各 type が正しく設定される', () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByTestId('ui-input')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" />);
    expect(screen.getByTestId('ui-input')).toHaveAttribute('type', 'password');

    rerender(<Input type="email" />);
    expect(screen.getByTestId('ui-input')).toHaveAttribute('type', 'email');

    rerender(<Input type="number" />);
    expect(screen.getByTestId('ui-input')).toHaveAttribute('type', 'number');
  });

  it('各 size が正しく適用される', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByTestId('ui-input')).toBeInTheDocument();

    rerender(<Input size="md" />);
    expect(screen.getByTestId('ui-input')).toBeInTheDocument();

    rerender(<Input size="lg" />);
    expect(screen.getByTestId('ui-input')).toBeInTheDocument();
  });

  it('fullWidth で幅が広がる', () => {
    render(<Input fullWidth />);
    const container = screen.getByTestId('ui-input').parentElement;
    expect(container).toHaveClass('w-full');
  });

  it('左アイコンが表示される', () => {
    render(<Input leftIcon={<span data-testid="left-icon">🔍</span>} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('右アイコンが表示される', () => {
    render(<Input rightIcon={<span data-testid="right-icon">✓</span>} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('ariaLabel が設定される', () => {
    render(<Input ariaLabel="入力フィールド" />);
    const input = screen.getByTestId('ui-input');
    expect(input).toHaveAttribute('aria-label', '入力フィールド');
  });

  it('maxLength が設定される', () => {
    render(<Input maxLength={10} />);
    const input = screen.getByTestId('ui-input');
    expect(input).toHaveAttribute('maxlength', '10');
  });

  it('required で必須属性が設定される', () => {
    render(<Input required />);
    const input = screen.getByTestId('ui-input');
    expect(input).toBeRequired();
  });
});
