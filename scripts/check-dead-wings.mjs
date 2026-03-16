#!/usr/bin/env node
// ─── check-dead-wings.mjs ─────────────────────────────────────────────────────
// src/components/**/  にある *Wing.tsx が App.tsx に登録されているか検出する。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const APP_FILE = join(ROOT, 'src', 'App.tsx');
const COMPONENTS_DIR = join(ROOT, 'src', 'components');

// ─── *Wing.tsx ファイルを再帰検索 ────────────────────────────────────────────

function findWingFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...findWingFiles(fullPath));
    } else if (entry.endsWith('Wing.tsx')) {
      results.push({ name: basename(entry, '.tsx'), path: fullPath });
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const appContent = readFileSync(APP_FILE, 'utf-8');
const wings = findWingFiles(COMPONENTS_DIR);
const errors = [];

for (const wing of wings) {
  // import 文または WING_COMPONENTS への登録のいずれかがあればOK
  if (!appContent.includes(wing.name)) {
    errors.push(`${wing.name}  (${relative(ROOT, wing.path)})`);
  }
}

if (errors.length === 0) {
  console.log(`✅ Wing登録チェック: 全 ${wings.length} コンポーネント登録済み`);
  process.exit(0);
} else {
  console.error(`❌ App.tsx に未登録の Wing: ${errors.length} 件`);
  for (const e of errors) {
    console.error(`  ${e}`);
  }
  process.exit(1);
}
