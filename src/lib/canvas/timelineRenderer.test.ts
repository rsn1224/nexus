import { describe, expect, it } from 'vitest';
import type { FpsTimelinePoint } from '../../types';
import { buildYForFps, getTimelineColors } from './timelineRenderer';

describe('buildYForFps', () => {
  it('最大値が上端（padding）にマップされる', () => {
    const yFor = buildYForFps(0, 100, 60, 4);
    expect(yFor(100)).toBeCloseTo(4);
  });

  it('最小値が下端（height - padding）にマップされる', () => {
    const yFor = buildYForFps(0, 100, 60, 4);
    expect(yFor(0)).toBeCloseTo(56);
  });

  it('中間値が中央付近にマップされる', () => {
    const yFor = buildYForFps(0, 100, 60, 4);
    expect(yFor(50)).toBeCloseTo(30);
  });

  it('range が 0 の場合にゼロ除算しない', () => {
    const yFor = buildYForFps(60, 60, 60, 4);
    expect(() => yFor(60)).not.toThrow();
  });

  it('min/max が非対称でも正しくスケールする', () => {
    const yFor = buildYForFps(30, 90, 100, 5);
    expect(yFor(90)).toBeCloseTo(5);
    expect(yFor(30)).toBeCloseTo(95);
  });
});

describe('getTimelineColors', () => {
  it('期待するプロパティをすべて返す', () => {
    const colors = getTimelineColors();
    expect(colors).toHaveProperty('border');
    expect(colors).toHaveProperty('accent');
    expect(colors).toHaveProperty('danger');
    expect(colors).toHaveProperty('success');
    expect(colors).toHaveProperty('textMuted');
    expect(colors).toHaveProperty('fontMono');
  });

  it('フォールバック値が文字列である', () => {
    const colors = getTimelineColors();
    for (const value of Object.values(colors)) {
      expect(typeof value).toBe('string');
    }
  });
});

describe('FpsTimelinePoint 型確認（コンパイル時）', () => {
  it('FpsTimelinePoint の fps プロパティが数値', () => {
    const point: FpsTimelinePoint = { timestamp: 1000, fps: 60 };
    expect(point.fps).toBe(60);
  });
});
