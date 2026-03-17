import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ProfileBadge from './ProfileBadge';

describe('ProfileBadge', () => {
  it('非アクティブ時に profile-badge testid でレンダリングされる', () => {
    render(<ProfileBadge profileName="テストゲーム" isActive={false} />);

    const badge = screen.getByTestId('profile-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('PROFILE: テストゲーム');
  });

  it('アクティブ時に profile-badge-active testid でレンダリングされる', () => {
    render(<ProfileBadge profileName="テストゲーム" isActive={true} />);

    const badge = screen.getByTestId('profile-badge-active');
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('● PROFILE: テストゲーム');
  });

  it('アクティブ時に cyan カラークラスが適用される', () => {
    render(<ProfileBadge profileName="テスト" isActive={true} />);

    const badge = screen.getByTestId('profile-badge-active');
    expect(badge.className).toContain('cyan');
  });

  it('非アクティブ時に muted カラークラスが適用される', () => {
    render(<ProfileBadge profileName="テスト" isActive={false} />);

    const badge = screen.getByTestId('profile-badge');
    expect(badge.className).toContain('muted');
  });

  it('className prop が追加される', () => {
    render(<ProfileBadge profileName="テスト" isActive={false} className="mt-2" />);

    const badge = screen.getByTestId('profile-badge');
    expect(badge.className).toContain('mt-2');
  });
});
