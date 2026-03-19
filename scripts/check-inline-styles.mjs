#!/usr/bin/env node
// ─── check-inline-styles.mjs ────────────────────────────────────────────────
// JSX のインラインスタイル（style={{...}}）を検出する。
// 許可リスト方式: 正当な使用箇所は明示的に登録。
// Phase 1: 許可リスト外の使用をエラーにする。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');

const SCAN_EXTENSIONS = ['.tsx'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'test']);
const SKIP_SUFFIXES = ['.test.tsx', '.spec.tsx'];

// ─── 許可リスト ───────────────────────────────────────────────────────────────
// 正当なインラインスタイル使用箇所（ファイル名:行番号 で特定）
// 行番号はリファクタリングで変わるため、ファイル名 + コメントマーカーで管理

const ALLOWED_FILES_AND_REASONS = [
  // 動的 width% — progressWidth ヘルパーで統一予定（Phase 4）
  { file: 'src/components/home/BottleneckCard.tsx', reason: '動的 width%' },
  { file: 'src/components/home/HeroSection.tsx', reason: '動的 width%' },
  { file: 'src/components/home/GameReadinessPanel.tsx', reason: '動的 width%' },
  { file: 'src/components/settings/AdvisorScoreCard.tsx', reason: '動的 width%' },
  { file: 'src/components/storage/DriveList.tsx', reason: '動的 width%' },
  // canvas サイズ — 正当な使用
  { file: 'src/components/home/FpsTimelineGraph.tsx', reason: 'canvas サイズ指定' },
  { file: 'src/components/home/ReadinessGauge.tsx', reason: 'canvas サイズ指定' },
  // Table の maxHeight / column width — 正当な使用
  { file: 'src/components/ui/Table.tsx', reason: 'Table maxHeight/column.width' },
];

const ALLOWED_SET = new Set(ALLOWED_FILES_AND_REASONS.map((a) => a.file.replace(/\\/g, '/')));

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

// ─── インラインスタイル検出 ───────────────────────────────────────────────────

const STYLE_REGEX = /style\s*=\s*\{\s*\{/g;

function findInlineStyles(content) {
  const locations = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    STYLE_REGEX.lastIndex = 0;
    if (STYLE_REGEX.test(lines[i])) {
      locations.push(i + 1);
    }
  }
  return locations;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = findFiles(SRC_DIR);
const violations = [];
let allowedCount = 0;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const styleLines = findInlineStyles(content);

  if (styleLines.length === 0) continue;

  const relPath = relative(ROOT, file).replace(/\\/g, '/');

  if (ALLOWED_SET.has(relPath)) {
    allowedCount += styleLines.length;
  } else {
    for (const line of styleLines) {
      violations.push({ file: relPath, line });
    }
  }
}

if (violations.length === 0) {
  console.log(
    `✅ インラインスタイルチェック: 許可リスト外の使用なし（許可済み: ${allowedCount} 箇所）`,
  );
  process.exit(0);
}

console.log(`❌ 許可リスト外のインラインスタイル: ${violations.length} 件`);
console.log('');
for (const v of violations) {
  console.log(`  ${v.file}:${v.line}`);
}
console.log('');
console.log('対応方法:');
console.log('  1. Tailwind v4 className に置換する（推奨）');
console.log(
  '  2. 正当な理由がある場合、scripts/check-inline-styles.mjs の ALLOWED_FILES_AND_REASONS に追加',
);
process.exit(1);
