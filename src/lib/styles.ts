/**
 * 動的 width% のインラインスタイルを生成するヘルパー
 * プログレスバーなど 0-100% の幅指定に使用
 *
 * @param percent - 0〜100 の値（範囲外は自動クランプ）
 * @returns CSSProperties オブジェクト
 */
export function progressWidth(percent: number): React.CSSProperties {
  const clamped = Math.min(100, Math.max(0, percent));
  return { width: `${clamped}%` };
}
