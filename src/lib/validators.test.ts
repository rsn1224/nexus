import { describe, expect, it } from 'vitest';
import { isInRange } from './validators';

describe('isInRange', () => {
  it('最小値と最大値の間にある値はtrueを返す', () => {
    expect(isInRange(50, 0, 100)).toBe(true);
  });

  it('最小値と等しい場合はtrueを返す', () => {
    expect(isInRange(0, 0, 100)).toBe(true);
  });

  it('最大値と等しい場合はtrueを返す', () => {
    expect(isInRange(100, 0, 100)).toBe(true);
  });

  it('最小値より小さい場合はfalseを返す', () => {
    expect(isInRange(-1, 0, 100)).toBe(false);
  });

  it('最大値より大きい場合はfalseを返す', () => {
    expect(isInRange(101, 0, 100)).toBe(false);
  });
});
