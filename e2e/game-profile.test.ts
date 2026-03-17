import { expect, test } from '@playwright/test';

test.describe('ゲームプロファイル E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('BoostWing にプロファイルタブが存在する', async ({ page }) => {
    await page.getByTestId('nav-boost').click();
    await expect(page.getByTestId('wing-boost')).toBeVisible();

    // 「プロファイル」タブが存在する
    await expect(page.getByText('プロファイル')).toBeVisible();
  });

  test('プロファイルタブを開くと空状態メッセージが表示される', async ({ page }) => {
    await page.getByTestId('nav-boost').click();
    await expect(page.getByTestId('wing-boost')).toBeVisible();

    // プロファイルタブをクリック
    await page.getByText('プロファイル').click();

    // 空状態メッセージまたはプロファイル件数が表示される
    const content = page.getByText(/プロファイルがありません|件のプロファイル/);
    await expect(content).toBeVisible();
  });

  test('プロファイルタブで「新規プロファイル」ボタンが存在する', async ({ page }) => {
    await page.getByTestId('nav-boost').click();
    await page.getByText('プロファイル').click();

    await expect(page.getByText(/新規プロファイル/)).toBeVisible();
  });

  test('新規プロファイルフォームが開閉できる', async ({ page }) => {
    await page.getByTestId('nav-boost').click();
    await page.getByText('プロファイル').click();

    // フォームを開く
    await page.getByText(/新規プロファイル/).click();

    // フォーム要素が表示される
    await expect(page.getByText('ゲーム名')).toBeVisible();
    await expect(page.getByText('実行ファイル（EXE パス）')).toBeVisible();
    await expect(page.getByText('ブーストレベル')).toBeVisible();
    await expect(page.getByText('保存')).toBeVisible();
    await expect(page.getByText('キャンセル')).toBeVisible();

    // フォームを閉じる
    await page.getByText('キャンセル').click();

    // フォーム要素が消える
    await expect(page.getByText('保存')).not.toBeVisible();
  });

  test('GameCard に profileName props を渡せる状態になっている', async ({ page }) => {
    await page.getByTestId('nav-launcher').click();
    await expect(page.getByTestId('wing-launcher')).toBeVisible();

    // ProfileBadge はまだ LauncherWing から接続されていないため、
    // profile-badge testid は表示されないことを確認（Phase 8b 以降で接続）
    const badge = page.locator('[data-testid="profile-badge"]');
    const badgeActive = page.locator('[data-testid="profile-badge-active"]');
    expect(await badge.count()).toBe(0);
    expect(await badgeActive.count()).toBe(0);
  });
});
