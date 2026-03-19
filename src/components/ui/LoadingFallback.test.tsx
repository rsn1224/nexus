import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingFallback from './LoadingFallback';

describe('LoadingFallback', () => {
  it('ローディングスピナーが表示される', () => {
    render(<LoadingFallback />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('ローディングテキストが表示される', () => {
    render(<LoadingFallback />);
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('data-testid が設定される', () => {
    render(<LoadingFallback />);
    expect(screen.getByTestId('ui-loading-fallback')).toBeInTheDocument();
  });

  it('コンテナに正しいクラスが設定される', () => {
    render(<LoadingFallback />);
    const container = screen.getByTestId('ui-loading-fallback');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'h-full');
  });

  it('スピナーに正しいスタイルが設定される', () => {
    render(<LoadingFallback />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
    expect(spinner?.className).toContain('animate-spin');
  });

  it('テキストに正しいスタイルが設定される', () => {
    render(<LoadingFallback />);
    const text = screen.getByText('読み込み中...');
    expect(text).toHaveClass('text-[11px]', 'text-text-muted');
  });

  it('コンポーネント構造が正しい', () => {
    render(<LoadingFallback />);
    const container = screen.getByTestId('ui-loading-fallback');
    const innerContainer = container.querySelector('.flex.flex-col.items-center.gap-3');
    const spinner = innerContainer?.querySelector('.animate-spin');
    const text = innerContainer?.querySelector('span');

    expect(container).toBeInTheDocument();
    expect(innerContainer).toBeInTheDocument();
    expect(spinner).toBeTruthy();
    expect(text).toBeTruthy();
  });
});
