import { expect, test } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('アプリが起動して基本UIが表示される', async ({ page }) => {
    // アプリにアクセス
    await page.goto('/');

    // ページタイトルを確認（実際のタイトルに合わせる）
    await expect(page).toHaveTitle(/Tauri \+ React \+ Typescript/i);

    // Shellのサイドバーが存在することを確認
    const sidebar = page.locator('nav[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // COREナビゲーションアイテムが存在することを確認
    const coreNav = page.locator('[data-testid="nav-core"]');
    await expect(coreNav).toBeVisible();

    // Core Wingが初期表示されることを確認
    const coreWing = page.locator('[data-testid="wing-core"]');
    await expect(coreWing).toBeVisible();

    // Core Wingのヘッダーが正しく表示されることを確認
    const coreHeader = page.locator('text=DASHBOARD');
    await expect(coreHeader).toBeVisible();
  });

  test('サイドバーの基本構造が正しい', async ({ page }) => {
    await page.goto('/');

    // サイドバーの幅を確認
    const sidebar = page.locator('nav[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // NEXUSロゴが存在することを確認
    const logo = page.locator('text=NEXUS');
    await expect(logo).toBeVisible();

    // SYSTEM STATUSサブタイトルが存在することを確認
    const subtitle = page.locator('text=SYSTEM STATUS');
    await expect(subtitle).toBeVisible();

    // COREアイテムがアクティブ状態であることを確認
    const coreNavItem = page.locator('[data-testid="nav-core"]');
    await expect(coreNavItem).toBeVisible();
    // アクティブ状態のスタイルを確認
    await expect(coreNavItem).toHaveClass(/bg-accent-500\/10/);
  });

  test('ウィンドウサイズが適切に設定されている', async ({ page }) => {
    await page.goto('/');

    // ビューポートサイズを確認
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThanOrEqual(900);
    expect(viewport?.height).toBeGreaterThanOrEqual(600);
  });
});
