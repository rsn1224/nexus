import { expect, test } from '@playwright/test';

test.describe('Wings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('HomeWing: カード群が表示される', async ({ page }) => {
    // HOMEに移動
    await page.getByTestId('nav-home').click();
    await expect(page.getByTestId('wing-home')).toBeVisible();

    // SYSTEM STATUS セクションが表示される
    await expect(page.getByText('SYSTEM STATUS')).toBeVisible();

    // PROCESSES セクションが表示される
    await expect(page.getByText('PROCESSES')).toBeVisible();

    // SCORE セクションが表示される
    await expect(page.getByText('SCORE')).toBeVisible();
  });

  test('BoostWing: BOOST タブと PROCESSES タブが存在する', async ({ page }) => {
    // BOOSTに移動
    await page.getByTestId('nav-boost').click();
    await expect(page.getByTestId('wing-boost')).toBeVisible();

    // BOOST タブが存在する
    await expect(page.getByText('BOOST')).toBeVisible();

    // PROCESSES タブが存在する
    await expect(page.getByText('PROCESSES')).toBeVisible();
  });

  test('LauncherWing: ゲームが0件のとき空状態メッセージが表示される', async ({ page }) => {
    // LAUNCHERに移動
    await page.getByTestId('nav-launcher').click();
    await expect(page.getByTestId('wing-launcher')).toBeVisible();

    // 空状態メッセージまたはSCANボタンが存在することを確認
    const emptyMessage = page.getByText(/ゲームが見つかりません|No games found|スキャン/);
    await expect(emptyMessage).toBeVisible();
  });

  test('LogWing: フィルタUIが表示される', async ({ page }) => {
    // LOGに移動
    await page.getByTestId('nav-log').click();
    await expect(page.getByTestId('wing-log')).toBeVisible();

    // レベルフィルターが存在する
    const levelFilter = page.getByText(/level|レベル|info|debug|error/i);
    await expect(levelFilter).toBeVisible();

    // ソースフィルターが存在する
    const sourceFilter = page.getByText(/source|ソース|filter|フィルター/i);
    await expect(sourceFilter).toBeVisible();
  });

  test('SettingsWing: APIキー入力フィールドが存在する', async ({ page }) => {
    // SETTINGSに移動
    await page.getByTestId('nav-settings').click();
    await expect(page.getByTestId('wing-settings')).toBeVisible();

    // APIキー入力フィールドが存在する
    const apiKeyInput = page.getByLabel(/api.?key|api.?キー/i);
    await expect(apiKeyInput).toBeVisible();
  });

  test('HardwareWing: ハードウェア情報が表示される', async ({ page }) => {
    // HARDWAREに移動
    await page.getByTestId('nav-hardware').click();
    await expect(page.getByTestId('wing-hardware')).toBeVisible();

    // CPU、メモリ、GPUなどの情報が表示される
    const hardwareInfo = page.getByText(/cpu|memory|gpu|disk|ハードウェア/i);
    await expect(hardwareInfo).toBeVisible();
  });

  test('WindowsWing: Windows関連のUIが表示される', async ({ page }) => {
    // WINDOWSに移動
    await page.getByTestId('nav-windows').click();
    await expect(page.getByTestId('wing-windows')).toBeVisible();

    // Windows関連の情報が表示される
    const windowsInfo = page.getByText(/windows|プロセス|window/i);
    await expect(windowsInfo).toBeVisible();
  });

  test('NetoptWing: ネットワーク関連のUIが表示される', async ({ page }) => {
    // NETOPTに移動
    await page.getByTestId('nav-netopt').click();
    await expect(page.getByTestId('wing-netopt')).toBeVisible();

    // ネットワーク関連の情報が表示される
    const networkInfo = page.getByText(/network|ネットワーク|connection|接続/i);
    await expect(networkInfo).toBeVisible();
  });

  test('StorageWing: ストレージ関連のUIが表示される', async ({ page }) => {
    // STORAGEに移動
    await page.getByTestId('nav-storage').click();
    await expect(page.getByTestId('wing-storage')).toBeVisible();

    // ストレージ関連の情報が表示される
    const storageInfo = page.getByText(/storage|disk|drive|ストレージ|ディスク/i);
    await expect(storageInfo).toBeVisible();
  });

  test('全Wing間の遷移が正常に動作する', async ({ page }) => {
    const wings = [
      'home',
      'boost',
      'launcher',
      'hardware',
      'windows',
      'log',
      'netopt',
      'storage',
      'settings',
    ];

    // 各Wingに順番に移動して表示を確認
    for (const wing of wings) {
      await page.getByTestId(`nav-${wing}`).click();
      await expect(page.getByTestId(`wing-${wing}`)).toBeVisible();
    }
  });
});
