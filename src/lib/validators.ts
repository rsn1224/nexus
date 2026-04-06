/**
 * 数値が指定した範囲内にあるかを検証する
 * ハードウェア値（CPU%: 0–100、温度: 0–150℃、メモリGB等）の
 * 上下限チェックに使用する
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}
