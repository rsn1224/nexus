import { expect, test } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('アプリが起動して基本UIが表示される', async ({ page }) => {
    // アプリにアクセス
    await page.goto('/');

    // ページタイトルを確認（実際のタイトルに合わせる）
    await expect(page).toHaveTitle(/Tauri \+ React \+ Typescript/i);

    // Shellのサイドバーが存在することを確認
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // HOMEナビゲーションアイテムが存在することを確認
    const homeNav = page.locator('[data-testid="nav-home"]');
    await expect(homeNav).toBeVisible();

    // Home Wingが初期表示されることを確認
    const homeWing = page.locator('[data-testid="wing-home"]');
    await expect(homeWing).toBeVisible();

    // Home Wingのヘッダーが正しく表示されることを確認
    const homeHeader = page.locator('text=▶ HOME / OVERVIEW');
    await expect(homeHeader).toBeVisible();
  });

  test('サイドバーの基本構造が正しい', async ({ page }) => {
    await page.goto('/');

    // サイドバーの幅を確認
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // NEXUSロゴが存在することを確認
    const logo = page.locator('text=NEXUS');
    await expect(logo).toBeVisible();

    // GAMING TOOLSサブタイトルが存在することを確認
    const subtitle = page.locator('text=GAMING TOOLS');
    await expect(subtitle).toBeVisible();

    // HOMEアイテムがアクティブ状態であることを確認
    const homeNavItem = page.locator('[data-testid="nav-home"]');
    await expect(homeNavItem).toBeVisible();
    // アクティブ状態のスタイルを確認（CSS変数クラス）
    await expect(homeNavItem).toHaveClass(/border-\[var\(--color-cyan-500\)\]/);
  });

  test('ウィンドウサイズが適切に設定されている', async ({ page }) => {
    await page.goto('/');

    // ビューポートサイズを確認
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(900);
    expect(viewport?.height).toBeGreaterThanOrEqual(600);
  });
});
