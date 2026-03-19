import { describe, expect, it } from 'vitest';
import { launcherPageSuggestions } from './launcherAi';

describe('launcherPageSuggestions', () => {
  it('ゲーム0件のときinfo提案を返す', () => {
    const result = launcherPageSuggestions(0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('no_games');
    expect(result[0].level).toBe('info');
    expect(result[0].message).toContain('SCAN');
  });

  it('ゲームありだがお気に入り0件のときinfo提案を返す', () => {
    const result = launcherPageSuggestions(5, 0);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('no_favorites');
    expect(result[0].level).toBe('info');
    expect(result[0].message).toContain('お気に入り');
  });

  it('ゲームあり・お気に入りありのときok提案を返す', () => {
    const result = launcherPageSuggestions(10, 3);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('games_ok');
    expect(result[0].level).toBe('ok');
    expect(result[0].message).toContain('10');
  });

  it('ゲーム1件・お気に入り1件でも正常に動作する', () => {
    const result = launcherPageSuggestions(1, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('games_ok');
    expect(result[0].message).toContain('1');
  });

  it('大量のゲームでも正常に動作する', () => {
    const result = launcherPageSuggestions(500, 50);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('games_ok');
    expect(result[0].message).toContain('500');
  });

  it('ゲーム0件のときお気に入り数に関係なくno_gamesを返す', () => {
    const result = launcherPageSuggestions(0, 10);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('no_games');
  });
});
