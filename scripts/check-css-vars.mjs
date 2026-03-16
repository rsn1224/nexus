#!/usr/bin/env node
// ─── check-css-vars.mjs ───────────────────────────────────────────────────────
// src/index.css に定義されていない CSS 変数参照を検出する。

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CSS_FILE = join(ROOT, 'src', 'index.css');
const SRC_DIR = join(ROOT, 'src');

const SCAN_EXTENSIONS = ['.tsx', '.ts'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'test']);
const SKIP_SUFFIXES = ['.test.ts', '.test.tsx', '.d.ts'];

// ─── CSS 変数定義を収集 ───────────────────────────────────────────────────────

function extractDefinedVars(cssContent) {
  const vars = new Set();
  const regex = /(--[\w-]+)\s*:/g;
  let match;
  while (true) {
    match = regex.exec(cssContent);
    if (match === null) break;
    vars.add(match[1]);
  }
  return vars;
}

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

// ─── var(--*) 使用箇所を収集 ─────────────────────────────────────────────────

function findVarUsages(content) {
  const usages = [];
  const lines = content.split('\n');
  const regex = /var\((--[\w-]+)\)/g;
  for (let i = 0; i < lines.length; i++) {
    let match;
    regex.lastIndex = 0;
    while (true) {
      match = regex.exec(lines[i]);
      if (match === null) break;
      usages.push({ varName: match[1], line: i + 1 });
    }
  }
  return usages;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const cssContent = readFileSync(CSS_FILE, 'utf-8');
const definedVars = extractDefinedVars(cssContent);
const files = findFiles(SRC_DIR);
const errors = [];

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  for (const usage of findVarUsages(content)) {
    if (!definedVars.has(usage.varName)) {
      errors.push({ file: relative(ROOT, file), ...usage });
    }
  }
}

if (errors.length === 0) {
  console.log('✅ CSS変数チェック: 未定義変数なし');
  process.exit(0);
} else {
  console.error(`❌ 未定義 CSS 変数: ${errors.length} 件`);
  for (const e of errors) {
    console.error(`  ${e.file}:${e.line}  ${e.varName}`);
  }
  process.exit(1);
}
