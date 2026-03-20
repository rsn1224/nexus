import { expect, test } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('HOMEからARSENALへの遷移', async ({ page }) => {
    // COREが表示されていることを確認
    await expect(page.getByTestId('wing-core')).toBeVisible();

    // ARSENALナビゲーションをクリック
    await page.getByTestId('nav-arsenal').click();

    // ARSENAL Wingが表示されることを確認
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();
  });

  test('COREからTACTICSへの遷移', async ({ page }) => {
    // COREが表示されていることを確認
    await expect(page.getByTestId('wing-core')).toBeVisible();

    // TACTICSナビゲーションをクリック
    await page.getByTestId('nav-tactics').click();

    // TACTICS Wingが表示されることを確認
    await expect(page.getByTestId('wing-tactics')).toBeVisible();
  });

  test('COREからLOGSへの遷移', async ({ page }) => {
    // COREが表示されていることを確認
    await expect(page.getByTestId('wing-core')).toBeVisible();

    // LOGSナビゲーションをクリック
    await page.getByTestId('nav-logs').click();

    // LOGS Wingが表示されることを確認
    await expect(page.getByTestId('wing-logs')).toBeVisible();
  });

  test('COREからSETTINGSへの遷移', async ({ page }) => {
    // COREが表示されていることを確認
    await expect(page.getByTestId('wing-core')).toBeVisible();

    // SETTINGSナビゲーションをクリック
    await page.getByTestId('nav-settings').click();

    // SETTINGS Wingが表示されることを確認
    await expect(page.getByTestId('wing-settings')).toBeVisible();
  });

  test('遷移後に元のWingに戻れること', async ({ page }) => {
    // COREが表示されていることを確認
    await expect(page.getByTestId('wing-core')).toBeVisible();

    // ARSENALに移動
    await page.getByTestId('nav-arsenal').click();
    await expect(page.getByTestId('wing-arsenal')).toBeVisible();

    // COREに戻る
    await page.getByTestId('nav-core').click();
    await expect(page.getByTestId('wing-core')).toBeVisible();
  });

  test('サイドバーの全ナビゲーションアイテムが表示される', async ({ page }) => {
    // 全てのナビゲーションアイテムが存在することを確認
    await expect(page.getByTestId('nav-core')).toBeVisible();
    await expect(page.getByTestId('nav-arsenal')).toBeVisible();
    await expect(page.getByTestId('nav-tactics')).toBeVisible();
    await expect(page.getByTestId('nav-logs')).toBeVisible();
    await expect(page.getByTestId('nav-settings')).toBeVisible();
  });

  test('アクティブなナビゲーションアイテムがハイライトされる', async ({ page }) => {
    // COREがアクティブ状態であることを確認
    const coreNav = page.getByTestId('nav-core');
    await expect(coreNav).toHaveClass(/bg-accent-500\/10/);

    // ARSENALに移動してアクティブ状態が変わることを確認
    await page.getByTestId('nav-arsenal').click();
    const arsenalNav = page.getByTestId('nav-arsenal');
    await expect(arsenalNav).toHaveClass(/bg-accent-500\/10/);

    // COREのハイライトが解除されることを確認
    await expect(coreNav).not.toHaveClass(/bg-accent-500\/10/);
  });
});
