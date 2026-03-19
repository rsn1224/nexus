#!/usr/bin/env node
// ─── check-file-size.mjs ────────────────────────────────────────────
// TS/TSX 実装ファイルの行数制限チェック（テストファイル除外）
// Phase 3 完了: エラーモード（常時有効— 全ファイル 200 行以下を強制）

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'src');

const MAX_LINES_TS = 200;
const SCAN_EXTENSIONS = ['.ts', '.tsx'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'test']);
const SKIP_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx', '.d.ts'];
const STRICT_MODE = true;

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

// ─── 行数カウント ─────────────────────────────────────────────────────────────

function countLines(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const files = findFiles(SRC_DIR);
const violations = [];

for (const file of files) {
  const lines = countLines(file);
  if (lines > MAX_LINES_TS) {
    violations.push({ file: relative(ROOT, file), lines });
  }
}

if (violations.length === 0) {
  console.log(`✅ ファイルサイズチェック: 全 TS/TSX ファイルが ${MAX_LINES_TS} 行以下`);
  process.exit(0);
}

// ─── 違反を報告 ───────────────────────────────────────────────────────────────

violations.sort((a, b) => b.lines - a.lines);

const icon = STRICT_MODE ? '❌' : '⚠️';
console.log(`${icon} ファイルサイズ超過: ${violations.length} 件（上限 ${MAX_LINES_TS} 行）`);
console.log('');
for (const v of violations) {
  const over = v.lines - MAX_LINES_TS;
  console.log(`  ${v.file}: ${v.lines} 行 (+${over})`);
}

console.log('');
console.log('エラーモード: 全ファイルを 200 行以下にしてください');
process.exit(1);
