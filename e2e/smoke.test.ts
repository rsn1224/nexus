import { expect, test } from '@playwright/test';

test.describe('NEXUS v4 Smoke Tests', () => {
  test('アプリが起動してタイトルバーが表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルバーの NEXUS テキストを確認
    const title = page.locator('[data-testid="titlebar"]');
    await expect(title).toBeVisible();

    const nexusText = page.locator('text=NEXUS');
    await expect(nexusText).toBeVisible();
  });

  test('SystemStatus セクションが表示される', async ({ page }) => {
    await page.goto('/');

    // システムステータスセクションの存在を確認
    const statusSection = page.locator('[data-testid="system-status"]');
    await expect(statusSection).toBeVisible({ timeout: 10000 });
  });

  test('Optimizations セクションが表示される', async ({ page }) => {
    await page.goto('/');

    const optimizeSection = page.locator('[data-testid="optimizations"]');
    await expect(optimizeSection).toBeVisible({ timeout: 10000 });
  });

  test('Settings パネルが開閉する', async ({ page }) => {
    await page.goto('/');

    // Settings ボタンをクリック
    const settingsButton = page.locator('[data-testid="open-settings"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // パネルが開く
    const settingsPanel = page.locator('[data-testid="settings-panel"]');
    await expect(settingsPanel).toBeVisible();

    // Esc で閉じる
    await page.keyboard.press('Escape');
    await expect(settingsPanel).not.toBeVisible();
  });

  test('History パネルが開閉する', async ({ page }) => {
    await page.goto('/');

    // History ボタンをクリック
    const historyButton = page.locator('[data-testid="open-history"]');
    await expect(historyButton).toBeVisible();
    await historyButton.click();

    // パネルが開く
    const historyPanel = page.locator('[data-testid="history-panel"]');
    await expect(historyPanel).toBeVisible();

    // バックドロップクリックで閉じる
    await page.locator('[data-testid="slide-panel-backdrop"]').click();
    await expect(historyPanel).not.toBeVisible();
  });

  test('ウィンドウサイズが最小要件を満たしている', async ({ page }) => {
    await page.goto('/');

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(800);
    expect(viewport?.height).toBeGreaterThanOrEqual(600);
  });
});
