import type { LocalSuggestion } from './types';

export function launcherPageSuggestions(
  gameCount: number,
  favoriteCount: number,
): LocalSuggestion[] {
  if (gameCount === 0) {
    return [
      {
        id: 'no_games',
        level: 'info',
        message: 'ゲームが見つかりません。SCAN を実行して Steam ライブラリを検出してください。',
      },
    ];
  }
  if (favoriteCount === 0) {
    return [
      {
        id: 'no_favorites',
        level: 'info',
        message:
          'よく遊ぶゲームを ★ でお気に入り登録すると、★ 優先ソートで素早くアクセスできます。',
      },
    ];
  }
  return [{ id: 'games_ok', level: 'ok', message: `${gameCount} 本のゲームが登録されています。` }];
}
