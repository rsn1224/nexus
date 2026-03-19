import { describe, expect, it } from 'vitest';
import { assertNever } from './assert';

describe('assertNever', () => {
  it('値を渡すとエラーをスローする', () => {
    expect(() => assertNever('unexpected' as never)).toThrow();
  });

  it('エラーメッセージに渡された値が含まれる', () => {
    expect(() => assertNever('test-value' as never)).toThrow('Unhandled case');
  });

  it('エラーメッセージにJSON.stringifyされた値が含まれる', () => {
    expect(() => assertNever('hello' as never)).toThrow('"hello"');
  });

  it('数値を渡した場合もエラーをスローする', () => {
    expect(() => assertNever(42 as never)).toThrow('42');
  });

  it('オブジェクトを渡した場合もエラーメッセージに含まれる', () => {
    const obj = { key: 'value' };
    expect(() => assertNever(obj as never)).toThrow('{"key":"value"}');
  });
});
