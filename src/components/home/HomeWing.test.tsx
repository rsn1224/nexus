import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomeWing from './HomeWing';

vi.mock('./HeroSection', () => ({
  default: () => <div data-testid="hero-section">HeroSection</div>,
}));

vi.mock('./ActionRow', () => ({
  default: () => <div data-testid="action-row">ActionRow</div>,
}));

vi.mock('./TimelineSection', () => ({
  default: () => <div data-testid="timeline-section">TimelineSection</div>,
}));

describe('HomeWing 統合テスト', () => {
  it('HeroSection が描画される', () => {
    render(<HomeWing />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
  });

  it('ActionRow が描画される', () => {
    render(<HomeWing />);
    expect(screen.getByTestId('action-row')).toBeInTheDocument();
  });

  it('TimelineSection が描画される', () => {
    render(<HomeWing />);
    expect(screen.getByTestId('timeline-section')).toBeInTheDocument();
  });
});
