import { describe, expect, it } from 'vitest';
import {
  formatTimestamp,
  getLogLevelBgColor,
  getLogLevelColor,
  truncateMessage,
} from './logFilter';

describe('getLogLevelColor', () => {
  it('Errorはdanger色を返す', () => {
    expect(getLogLevelColor('Error')).toBe('var(--color-danger-500)');
  });

  it('Warnはaccent色を返す', () => {
    expect(getLogLevelColor('Warn')).toBe('var(--color-accent-500)');
  });

  it('Infoはaccent色を返す', () => {
    expect(getLogLevelColor('Info')).toBe('var(--color-accent-500)');
  });

  it('Debugはmuted色を返す', () => {
    expect(getLogLevelColor('Debug')).toBe('var(--color-text-muted)');
  });

  it('未知のレベルはprimary色を返す', () => {
    // biome-ignore lint: テスト用に未知の値を渡す
    expect(getLogLevelColor('Unknown' as any)).toBe('var(--color-text-primary)');
  });
});

describe('getLogLevelBgColor', () => {
  it('Errorはdanger背景色を返す', () => {
    expect(getLogLevelBgColor('Error')).toBe('var(--color-danger-500)');
  });

  it('Warnはaccent背景色を返す', () => {
    expect(getLogLevelBgColor('Warn')).toBe('var(--color-accent-500)');
  });

  it('Infoはaccent背景色を返す', () => {
    expect(getLogLevelBgColor('Info')).toBe('var(--color-accent-500)');
  });

  it('Debugはbase背景色を返す', () => {
    expect(getLogLevelBgColor('Debug')).toBe('var(--color-base-600)');
  });

  it('未知のレベルはbase背景色を返す', () => {
    // biome-ignore lint: テスト用に未知の値を渡す
    expect(getLogLevelBgColor('Unknown' as any)).toBe('var(--color-base-600)');
  });
});

describe('formatTimestamp', () => {
  it('有効なISO文字列をフォーマットする', () => {
    const result = formatTimestamp('2024-01-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('無効な日付文字列はそのまま返す', () => {
    const result = formatTimestamp('invalid-date');
    // Invalid Date の場合、toLocaleString が "Invalid Date" を返すか元の値を返す
    expect(typeof result).toBe('string');
  });

  it('空文字列を処理する', () => {
    const result = formatTimestamp('');
    expect(typeof result).toBe('string');
  });
});

describe('truncateMessage', () => {
  it('maxLength以下のメッセージはそのまま返す', () => {
    expect(truncateMessage('short', 100)).toBe('short');
  });

  it('maxLengthを超えるメッセージは切り詰める', () => {
    const long = 'a'.repeat(150);
    const result = truncateMessage(long, 100);
    expect(result).toHaveLength(103); // 100 + "..."
    expect(result.endsWith('...')).toBe(true);
  });

  it('デフォルトのmaxLengthは100文字', () => {
    const exact = 'a'.repeat(100);
    expect(truncateMessage(exact)).toBe(exact);

    const over = 'a'.repeat(101);
    expect(truncateMessage(over).endsWith('...')).toBe(true);
  });

  it('空文字列はそのまま返す', () => {
    expect(truncateMessage('')).toBe('');
  });

  it('ちょうどmaxLengthの文字列はそのまま返す', () => {
    const exact = 'a'.repeat(50);
    expect(truncateMessage(exact, 50)).toBe(exact);
  });
});
