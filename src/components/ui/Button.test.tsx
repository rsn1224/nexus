import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Button from './Button';

// @testing-library/jest-dom のマッチャーを追加
describe('Button', () => {
  it('テキストが表示される', () => {
    render(<Button variant="primary">テスト</Button>);
    expect(screen.getByText('テスト')).toBeInTheDocument();
  });

  it('クリックイベントが発火する', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick}>
        ボタン
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled 時にクリックできない', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick} disabled>
        ボタン
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading 時にクリックできない', async () => {
    const onClick = vi.fn();
    render(
      <Button variant="primary" onClick={onClick} loading>
        ボタン
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('各 variant が正しく表示される', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();
  });

  it('各 size が正しく表示される', () => {
    const { rerender } = render(
      <Button variant="primary" size="sm">
        Small
      </Button>,
    );
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();

    rerender(
      <Button variant="primary" size="md">
        Medium
      </Button>,
    );
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();

    rerender(
      <Button variant="primary" size="lg">
        Large
      </Button>,
    );
    expect(screen.getByTestId('ui-button')).toBeInTheDocument();
  });

  it('アイコンが表示される', () => {
    render(
      <Button variant="primary" icon="🔍">
        検索
      </Button>,
    );
    const button = screen.getByTestId('ui-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('🔍');
    expect(button).toHaveTextContent('検索');
  });

  it('fullWidth で幅が広がる', () => {
    render(
      <Button variant="primary" fullWidth>
        Full Width
      </Button>,
    );
    const button = screen.getByTestId('ui-button');
    expect(button).toHaveClass('w-full');
  });

  it('tooltip が設定される', () => {
    render(
      <Button variant="primary" tooltip="ヒント">
        ボタン
      </Button>,
    );
    const button = screen.getByTestId('ui-button');
    expect(button).toHaveAttribute('title', 'ヒント');
  });
});
