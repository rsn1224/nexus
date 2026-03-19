import { describe, expect, it } from 'vitest';
import { fmtDate, fmtDuration, fmtNum, formatDurationMs, formatTime } from './formatters';

describe('fmtNum', () => {
  it('デフォルトで小数点1桁にフォーマットする', () => {
    expect(fmtNum(Math.PI)).toBe('3.1');
  });

  it('小数点桁数を指定できる', () => {
    expect(fmtNum(Math.PI, 3)).toBe('3.142');
  });

  it('0をフォーマットする', () => {
    expect(fmtNum(0)).toBe('0.0');
  });

  it('負の数をフォーマットする', () => {
    expect(fmtNum(-5.678, 2)).toBe('-5.68');
  });

  it('大きな数をフォーマットする', () => {
    expect(fmtNum(123456.789, 2)).toBe('123456.79');
  });

  it('小数点0桁を指定すると整数になる', () => {
    expect(fmtNum(9.99, 0)).toBe('10');
  });
});

describe('fmtDate', () => {
  it('UNIXタイムスタンプを日本語フォーマットで返す', () => {
    const result = fmtDate(1700000000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('タイムスタンプ0を処理する', () => {
    const result = fmtDate(0);
    expect(typeof result).toBe('string');
  });
});

describe('fmtDuration', () => {
  it('分単位の期間を返す', () => {
    expect(fmtDuration(0, 300)).toBe('5m');
  });

  it('時間と分の期間を返す', () => {
    expect(fmtDuration(0, 3660)).toBe('1h1m');
  });

  it('差が0秒の場合は0mを返す', () => {
    expect(fmtDuration(100, 100)).toBe('0m');
  });

  it('59分以下は分のみ表示する', () => {
    expect(fmtDuration(0, 3540)).toBe('59m');
  });

  it('ちょうど60分は時間表示に切り替わる', () => {
    expect(fmtDuration(0, 3600)).toBe('1h0m');
  });
});

describe('formatTime', () => {
  it('nullの場合は"--"を返す', () => {
    expect(formatTime(null)).toBe('--');
  });

  it('有効なタイムスタンプを時刻文字列に変換する', () => {
    const result = formatTime(1700000000000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('タイムスタンプ0を処理する', () => {
    const result = formatTime(0);
    expect(typeof result).toBe('string');
  });
});

describe('formatDurationMs', () => {
  it('1000ms未満はms単位で返す', () => {
    expect(formatDurationMs(500)).toBe('500ms');
  });

  it('0msを返す', () => {
    expect(formatDurationMs(0)).toBe('0ms');
  });

  it('999msを返す', () => {
    expect(formatDurationMs(999)).toBe('999ms');
  });

  it('1000ms以上は秒単位で返す', () => {
    expect(formatDurationMs(1000)).toBe('1.0s');
  });

  it('大きな値を秒単位で返す', () => {
    expect(formatDurationMs(5500)).toBe('5.5s');
  });
});
