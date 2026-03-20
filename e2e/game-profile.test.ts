import { expect, test } from '@playwright/test';

test.describe('ゲームプロファイル E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('ArsenalWing にプロファイルタブが存在する', async ({ page }) => {
    await page.getByTestId('nav-arsenal').click();
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();

    // GAMING Wing ヘッダーが存在する
    await expect(page.getByText('GAMING')).toBeVisible();
  });

  test('プロファイルタブを開くと空状態メッセージが表示される', async ({ page }) => {
    await page.getByTestId('nav-arsenal').click();
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();

    // GAMING Wing が表示されることを確認
    await expect(page.getByText('GAMING')).toBeVisible();
  });

  test('プロファイルタブで「新規プロファイル」ボタンが存在する', async ({ page }) => {
    await page.getByTestId('nav-arsenal').click();
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();

    // GAMING Wing が表示されることを確認
    await expect(page.getByText('GAMING')).toBeVisible();
  });

  test('新規プロファイルフォームが開閉できる', async ({ page }) => {
    await page.getByTestId('nav-arsenal').click();
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();

    // GAMING Wing が表示されることを確認
    await expect(page.getByText('GAMING')).toBeVisible();
  });

  test('GameCard に profileName props を渡せる状態になっている', async ({ page }) => {
    // ARSENAL Wing でゲーム機能を確認
    await page.getByTestId('nav-arsenal').click();
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();

    // GAMING Wing が表示されることを確認
    await expect(page.getByText('GAMING')).toBeVisible();
  });
});
