import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('HOMEからBOOSTへの遷移', async ({ page }) => {
    // HOMEが表示されていることを確認
    await expect(page.getByTestId('wing-home')).toBeVisible();

    // BOOSTナビゲーションをクリック
    await page.getByTestId('nav-boost').click();

    // BOOST Wingが表示されることを確認
    await expect(page.getByTestId('wing-boost')).toBeVisible();
  });

  test('HOMEからLAUNCHERへの遷移', async ({ page }) => {
    // HOMEが表示されていることを確認
    await expect(page.getByTestId('wing-home')).toBeVisible();

    // LAUNCHERナビゲーションをクリック
    await page.getByTestId('nav-launcher').click();

    // LAUNCHER Wingが表示されることを確認
    await expect(page.getByTestId('wing-launcher')).toBeVisible();
  });

  test('HOMEからHARDWAREへの遷移', async ({ page }) => {
    // HOMEが表示されていることを確認
    await expect(page.getByTestId('wing-home')).toBeVisible();

    // HARDWAREナビゲーションをクリック
    await page.getByTestId('nav-hardware').click();

    // HARDWARE Wingが表示されることを確認
    await expect(page.getByTestId('wing-hardware')).toBeVisible();
  });

  test('HOMEからSETTINGSへの遷移', async ({ page }) => {
    // HOMEが表示されていることを確認
    await expect(page.getByTestId('wing-home')).toBeVisible();

    // SETTINGSナビゲーションをクリック
    await page.getByTestId('nav-settings').click();

    // SETTINGS Wingが表示されることを確認
    await expect(page.getByTestId('wing-settings')).toBeVisible();
  });

  test('遷移後に元のWingに戻れること', async ({ page }) => {
    // HOMEが表示されていることを確認
    await expect(page.getByTestId('wing-home')).toBeVisible();

    // BOOSTに移動
    await page.getByTestId('nav-boost').click();
    await expect(page.getByTestId('wing-boost')).toBeVisible();

    // HOMEに戻る
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('wing-home')).toBeVisible();
  });

  test('サイドバーの全ナビゲーションアイテムが表示される', async ({ page }) => {
    // 全てのナビゲーションアイテムが存在することを確認
    await expect(page.getByTestId('nav-home')).toBeVisible();
    await expect(page.getByTestId('nav-boost')).toBeVisible();
    await expect(page.getByTestId('nav-launcher')).toBeVisible();
    await expect(page.getByTestId('nav-hardware')).toBeVisible();
    await expect(page.getByTestId('nav-windows')).toBeVisible();
    await expect(page.getByTestId('nav-log')).toBeVisible();
    await expect(page.getByTestId('nav-netopt')).toBeVisible();
    await expect(page.getByTestId('nav-storage')).toBeVisible();
    await expect(page.getByTestId('nav-settings')).toBeVisible();
  });

  test('アクティブなナビゲーションアイテムがハイライトされる', async ({ page }) => {
    // HOMEがアクティブ状態であることを確認
    const homeNav = page.getByTestId('nav-home');
    await expect(homeNav).toHaveClass(/border-\[var\(--color-cyan-500\)\]/);

    // BOOSTに移動してアクティブ状態が変わることを確認
    await page.getByTestId('nav-boost').click();
    const boostNav = page.getByTestId('nav-boost');
    await expect(boostNav).toHaveClass(/border-\[var\(--color-cyan-500\)\]/);

    // HOMEのハイライトが解除されることを確認
    await expect(homeNav).not.toHaveClass(/border-\[var\(--color-cyan-500\)\]/);
  });
});
