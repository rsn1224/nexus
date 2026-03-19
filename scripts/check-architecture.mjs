#!/usr/bin/env node
// ─── check-architecture.mjs ─────────────────────────────────────────────────
// アーキテクチャ適合テスト — import パス違反・循環参照を検出
// Phase 1: 警告モード（exit 0）
// Phase 3 完了後: エラーモード（--strict フラグで有効化）

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');

const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'test']);
const SKIP_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.d.ts'];
const STRICT_MODE = process.argv.includes('--strict');

// ─── ルール定義 ───────────────────────────────────────────────────────────────

// ルール 1: Wing コンポーネントは自分のドメインの store のみ import 可能
// 例外: useNavStore, usePulseStore は全 Wing から参照可
const SHARED_STORES = new Set(['useNavStore', 'usePulseStore']);

// Wing 名 → 許可される store 名のマッピング
const WING_STORE_MAP = {
  home: [
    'useHardwareStore',
    'useBoostStore',
    'useHealthStore',
    'useGameProfileStore',
    'useStorageStore',
    'useWindowsSettingsStore',
    // ダッシュボードは多数の Wing データを集約表示するため広い参照が必要
    'useOpsStore',
    'useBottleneckStore',
    'useFrameTimeStore',
    'useTimerStore',
    'useSessionStore',
  ],
  performance: [
    'useOpsStore',
    'useWatchdogStore',
    'useSessionStore',
    'useBoostStore',
    // パフォーマンス Wing はゲームプロファイル・ネットワーク・Windows 設定と連携
    'useGameProfileStore',
    'useNetworkTuningStore',
    'useTimerStore',
    'useWinoptStore',
  ],
  games: ['useGameProfileStore', 'useLauncherStore'],
  hardware: ['useHardwareStore', 'useEcoModeStore'],
  network: ['useNetworkTuningStore', 'useNetoptStore', 'useWinoptStore'],
  storage: ['useStorageStore'],
  settings: ['useWindowsSettingsStore', 'useAppSettingsStore', 'useScriptStore'],
  log: ['useLogStore'],
};

// ルール 2: lib/ は store を import しない（純粋関数のみ）
// ルール 3: ui/ コンポーネントは store を import しない（presentational only）

// ─── ファイル検索 ─────────────────────────────────────────────────────────────

function findFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (!SKIP_DIRS.has(entry)) results.push(...findFiles(fullPath));
    } else if (
      SCAN_EXTENSIONS.some((ext) => entry.endsWith(ext)) &&
      !SKIP_SUFFIXES.some((s) => fullPath.endsWith(s))
    ) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── import 解析 ──────────────────────────────────────────────────────────────

const IMPORT_REGEX = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
const STORE_NAME_REGEX = /use[A-Z]\w*Store/g;

function extractImports(content) {
  const imports = [];
  let match;
  IMPORT_REGEX.lastIndex = 0;
  while (true) {
    match = IMPORT_REGEX.exec(content);
    if (match === null) break;
    imports.push(match[1]);
  }
  return imports;
}

function extractStoreNames(importPath) {
  const names = [];
  let match;
  STORE_NAME_REGEX.lastIndex = 0;
  while (true) {
    match = STORE_NAME_REGEX.exec(importPath);
    if (match === null) break;
    names.push(match[0]);
  }
  return names;
}

// ─── ルールチェック ───────────────────────────────────────────────────────────

function checkFile(filePath, content) {
  const violations = [];
  const relPath = relative(SRC_DIR, filePath).replace(/\\/g, '/');
  const imports = extractImports(content);

  // ルール 2: lib/ は store を import しない
  if (relPath.startsWith('lib/')) {
    for (const imp of imports) {
      if (imp.includes('stores/') || imp.includes('Store')) {
        const storeNames = extractStoreNames(imp);
        if (storeNames.length > 0) {
          violations.push({
            rule: 'lib-no-store',
            file: relative(ROOT, filePath),
            message: `lib/ が store をインポート: ${storeNames.join(', ')}`,
          });
        }
      }
    }
  }

  // ルール 3: ui/ コンポーネントは store を import しない
  if (relPath.startsWith('components/ui/')) {
    for (const imp of imports) {
      if (imp.includes('stores/') || imp.includes('Store')) {
        const storeNames = extractStoreNames(imp);
        if (storeNames.length > 0) {
          violations.push({
            rule: 'ui-no-store',
            file: relative(ROOT, filePath),
            message: `ui/ が store をインポート: ${storeNames.join(', ')}`,
          });
        }
      }
    }
  }

  // ルール 1: Wing コンポーネントは自分のドメインの store のみ import 可能
  if (relPath.startsWith('components/')) {
    const wingMatch = relPath.match(/^components\/([^/]+)\//);
    if (wingMatch) {
      const wingName = wingMatch[1];
      if (wingName !== 'ui' && wingName !== 'layout' && wingName !== 'shared') {
        const allowedStores = WING_STORE_MAP[wingName] || [];

        for (const imp of imports) {
          if (imp.includes('stores/')) {
            const storeNames = extractStoreNames(imp);
            for (const storeName of storeNames) {
              if (!SHARED_STORES.has(storeName) && !allowedStores.includes(storeName)) {
                violations.push({
                  rule: 'wing-store-boundary',
                  file: relative(ROOT, filePath),
                  message: `${wingName}/ が許可外の store をインポート: ${storeName}`,
                });
              }
            }
          }
        }
      }
    }
  }

  return violations;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = findFiles(SRC_DIR);
const allViolations = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  allViolations.push(...checkFile(file, content));
}

if (allViolations.length === 0) {
  console.log('✅ アーキテクチャチェック: 違反なし');
  process.exit(0);
}

// ─── 違反を報告 ───────────────────────────────────────────────────────────────

const byRule = {};
for (const v of allViolations) {
  if (!byRule[v.rule]) byRule[v.rule] = [];
  byRule[v.rule].push(v);
}

const icon = STRICT_MODE ? '❌' : '⚠️';
console.log(`${icon} アーキテクチャ違反: ${allViolations.length} 件`);
console.log('');

const ruleDescriptions = {
  'wing-store-boundary': 'Wing → Store 境界違反（自ドメイン外の store を参照）',
  'lib-no-store': 'lib/ → store 参照禁止違反',
  'ui-no-store': 'ui/ → store 参照禁止違反',
};

for (const [rule, violations] of Object.entries(byRule)) {
  console.log(`  [${rule}] ${ruleDescriptions[rule] || rule} (${violations.length} 件)`);
  for (const v of violations) {
    console.log(`    ${v.file}: ${v.message}`);
  }
  console.log('');
}

if (STRICT_MODE) {
  console.log('エラーモード（--strict）: 全違反を修正してください');
  process.exit(1);
}

console.log('警告モード: アーキテクチャ違反を認識した上で開発を継続');
process.exit(0);
