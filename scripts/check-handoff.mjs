#!/usr/bin/env node
// ─── check-handoff.mjs ────────────────────────────────────────────────────────
// HANDOFF.md のステータス値と構造の整合性を検証する。

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// HANDOFF.md は nexus の親ディレクトリ（ワークスペースルート）にある
const HANDOFF_FILE = join(__dirname, '..', 'HANDOFF.md');

const VALID_STATUSES = new Set(['pending', 'in-progress', 'review', 'done']);

// コードブロック外に混入したコードを示すパターン
const CORRUPTION_PATTERNS = [
  /^\s{4,}pub \w+: \w+,\s*$/, // Rust struct フィールド
  /^pub (?:async )?fn \w+/, // Rust 関数定義
  /^\s*let \w+ = \w+\.iter\(\)/, // Rust let 文
  /^\s*#\[tauri::command\]/, // Rust attribute
];

// ─── Main ─────────────────────────────────────────────────────────────────────

let content;
try {
  content = readFileSync(HANDOFF_FILE, 'utf-8');
} catch {
  console.error(`❌ HANDOFF.md が見つかりません: ${HANDOFF_FILE}`);
  process.exit(1);
}

const lines = content.split('\n');
const errors = [];
let inCodeBlock = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // コードブロックの開閉を追跡
  if (line.trimStart().startsWith('```')) {
    inCodeBlock = !inCodeBlock;
    continue;
  }

  if (inCodeBlock) continue;

  // テーブル行のステータスチェック: | ... | `status` | ...
  // ステータス値はアルファベット開始（CSS変数 --color-* などは除外）
  const tableMatch = line.match(/\|\s*`([a-z][a-z-]*)`\s*\|/g);
  if (tableMatch) {
    for (const m of tableMatch) {
      const status = m.match(/`([a-z][a-z-]*)`/)?.[1];
      if (status && status.length <= 20 && !VALID_STATUSES.has(status)) {
        errors.push(`L${lineNum}: テーブルに無効なステータス値 \`${status}\``);
      }
    }
  }

  // インラインステータスチェック: **ステータス:** `status`
  const inlineMatch = line.match(/\*\*ステータス:\*\*\s*`([a-z][a-z-]*)`/);
  if (inlineMatch) {
    const status = inlineMatch[1];
    if (!VALID_STATUSES.has(status)) {
      errors.push(`L${lineNum}: インラインに無効なステータス値 \`${status}\``);
    }
  }

  // コードブロック外へのコード混入チェック
  for (const pattern of CORRUPTION_PATTERNS) {
    if (pattern.test(line)) {
      errors.push(`L${lineNum}: コードブロック外にコードが混入: "${line.trim().slice(0, 60)}"`);
      break;
    }
  }
}

// コードブロックが閉じられていないケース
if (inCodeBlock) {
  errors.push('ファイル末尾: 閉じられていない ``` コードブロックがあります');
}

if (errors.length === 0) {
  console.log('✅ HANDOFF.md バリデーション: 問題なし');
  process.exit(0);
} else {
  console.error(`❌ HANDOFF.md に ${errors.length} 件の問題があります:`);
  for (const e of errors) {
    console.error(`  ${e}`);
  }
  process.exit(1);
}
