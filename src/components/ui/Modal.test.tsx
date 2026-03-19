import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalStore } from '../../stores/useModalStore';
import Modal from './Modal';

describe('Modal — useModalStore wire-up', () => {
  beforeEach(() => {
    useModalStore.setState({ openCount: 0, isOpen: false });
  });

  it('isOpen=true で openModal() が呼ばれ isOpen が true になる', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()}>
        内容
      </Modal>,
    );
    expect(useModalStore.getState().isOpen).toBe(true);
  });

  it('isOpen=false では isOpen が false のまま', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        内容
      </Modal>,
    );
    expect(useModalStore.getState().isOpen).toBe(false);
  });

  it('unmount 時に closeModal() が呼ばれ isOpen が false になる', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={vi.fn()}>
        内容
      </Modal>,
    );
    expect(useModalStore.getState().isOpen).toBe(true);
    unmount();
    expect(useModalStore.getState().isOpen).toBe(false);
  });
});

describe('Modal', () => {
  it('isOpen=true でモーダルが表示される', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="テスト">
        内容
      </Modal>,
    );
    expect(screen.getByText('テスト')).toBeInTheDocument();
    expect(screen.getByText('内容')).toBeInTheDocument();
  });

  it('isOpen=false でモーダルが非表示', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="テスト">
        内容
      </Modal>,
    );
    expect(screen.queryByText('テスト')).not.toBeInTheDocument();
    expect(screen.queryByText('内容')).not.toBeInTheDocument();
  });

  it('閉じるボタンで onClose が呼ばれる', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト">
        内容
      </Modal>,
    );
    const closeButton = screen.getByText('✕');
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('背景クリックで onClose が呼ばれる', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト">
        内容
      </Modal>,
    );
    const backdropButton = screen.getByLabelText('モーダルを閉じる');
    await userEvent.click(backdropButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnBackdropClick=false で背景クリックで onClose が呼ばれない', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト" closeOnBackdropClick={false}>
        内容
      </Modal>,
    );
    const overlay = screen.getByTestId('ui-modal-overlay');
    await userEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ESC キーで onClose が呼ばれる', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト">
        内容
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnEscape=false で ESC キーで onClose が呼ばれない', async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="テスト" closeOnEscape={false}>
        内容
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('各 size が正しく適用される', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={vi.fn()} size="sm">
        内容
      </Modal>,
    );
    expect(screen.getByTestId('ui-modal')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} size="md">
        内容
      </Modal>,
    );
    expect(screen.getByTestId('ui-modal')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} size="lg">
        内容
      </Modal>,
    );
    expect(screen.getByTestId('ui-modal')).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={vi.fn()} size="xl">
        内容
      </Modal>,
    );
    expect(screen.getByTestId('ui-modal')).toBeInTheDocument();
  });

  it('showCloseButton=false で閉じるボタンが非表示', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="テスト" showCloseButton={false}>
        内容
      </Modal>,
    );
    expect(screen.queryByText('✕')).not.toBeInTheDocument();
  });

  it('footer が表示される', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="テスト"
        footer={
          <button type="button" data-testid="footer-btn">
            フッター
          </button>
        }
      >
        内容
      </Modal>,
    );
    expect(screen.getByTestId('footer-btn')).toBeInTheDocument();
  });

  it('title なしでヘッダーが非表示', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} showCloseButton={false}>
        内容
      </Modal>,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('role="dialog" と aria-modal="true" が設定される', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="テスト">
        内容
      </Modal>,
    );
    const modal = screen.getByTestId('ui-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  it('aria-labelledby が設定される', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="テストタイトル">
        内容
      </Modal>,
    );
    const modal = screen.getByTestId('ui-modal');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});
