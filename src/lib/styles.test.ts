import { describe, expect, it } from 'vitest';
import { progressWidth } from './styles';

describe('progressWidth', () => {
  it('0%の場合は width: "0%" を返す', () => {
    expect(progressWidth(0)).toEqual({ width: '0%' });
  });

  it('50%の場合は width: "50%" を返す', () => {
    expect(progressWidth(50)).toEqual({ width: '50%' });
  });

  it('100%の場合は width: "100%" を返す', () => {
    expect(progressWidth(100)).toEqual({ width: '100%' });
  });

  it('負の値は0にクランプする', () => {
    expect(progressWidth(-10)).toEqual({ width: '0%' });
  });

  it('100を超える値は100にクランプする', () => {
    expect(progressWidth(150)).toEqual({ width: '100%' });
  });

  it('小数値を正しく処理する', () => {
    expect(progressWidth(33.33)).toEqual({ width: '33.33%' });
  });

  it('CSSPropertiesオブジェクトを返す', () => {
    const result = progressWidth(50);
    expect(result).toHaveProperty('width');
    expect(typeof result.width).toBe('string');
  });
});
