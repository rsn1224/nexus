import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Card from './Card';

describe('Card', () => {
  it('コンテンツが表示される', () => {
    render(<Card>カード内容</Card>);
    expect(screen.getByText('カード内容')).toBeInTheDocument();
  });

  it('タイトルが表示される', () => {
    render(<Card title="カードタイトル">内容</Card>);
    expect(screen.getByText('カードタイトル')).toBeInTheDocument();
    expect(screen.getByText('内容')).toBeInTheDocument();
  });

  it('アクションボタンが表示される', () => {
    render(
      <Card
        title="タイトル"
        action={
          <button type="button" data-testid="action-btn">
            アクション
          </button>
        }
      >
        内容
      </Card>,
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
  });

  it('クリック可能なカードで onClick が呼ばれる', async () => {
    const onClick = vi.fn();
    render(
      <Card onClick={onClick} clickable>
        クリック可能カード
      </Card>,
    );
    await userEvent.click(screen.getByTestId('ui-card'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('各 variant が正しく表示される', () => {
    const { rerender } = render(<Card variant="default">Default</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();

    rerender(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();

    rerender(<Card variant="outlined">Outlined</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();
  });

  it('各 padding が正しく適用される', () => {
    const { rerender } = render(<Card padding="sm">Small padding</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();

    rerender(<Card padding="md">Medium padding</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();

    rerender(<Card padding="lg">Large padding</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();

    rerender(<Card padding="none">No padding</Card>);
    expect(screen.getByTestId('ui-card')).toBeInTheDocument();
  });

  it('hoverable でホバー効果が適用される', () => {
    render(<Card hoverable>ホバー可能カード</Card>);
    const card = screen.getByTestId('ui-card');
    expect(card).toBeInTheDocument();
  });

  it('clickable でカーソルがポインターになる', () => {
    render(<Card clickable>クリック可能</Card>);
    const card = screen.getByTestId('ui-card');
    expect(card).toBeInTheDocument();
  });

  it('ariaLabel が設定される', () => {
    render(
      <Card ariaLabel="カードの説明" clickable>
        内容
      </Card>,
    );
    const card = screen.getByTestId('ui-card');
    expect(card).toHaveAttribute('aria-label', 'カードの説明');
  });

  it('tabIndex が設定される', () => {
    render(<Card tabIndex={0}>内容</Card>);
    const card = screen.getByTestId('ui-card');
    expect(card).toHaveAttribute('tabindex', '0');
  });
});
