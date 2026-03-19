/**
 * 網羅性チェック用ユーティリティ
 * switch/if-else の exhaustive check に使用する
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}
