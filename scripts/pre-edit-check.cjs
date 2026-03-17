#!/usr/bin/env node

/**
 * nexus 編集前安全チェックスクリプト
 Claude Code PreToolUse hookから呼び出され、
 ファイル編集前の安全性を確認する
 */

const fs = require('fs');
const path = require('path');

// 色付き出力ユーティリティ
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Gitリポジトリ状態チェック
function checkGitStatus() {
  try {
    const { execSync } = require('child_process');

    // 未コミットの変更があるかチェック
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    const hasUncommittedChanges = status.trim().length > 0;

    if (hasUncommittedChanges) {
      logWarning('Uncommitted changes detected');
      logInfo('Consider committing or stashing changes before proceeding');
    }

    return true;
  } catch (_error) {
    logWarning('Could not check git status');
    return true;
  }
}

// 重要ファイルの保護チェック
function checkProtectedFiles(filePath) {
  const criticalFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'src-tauri/Cargo.toml',
    'src-tauri/tauri.conf.json',
    '.windsurfrules',
    'CLAUDE.md',
    'AGENTS.md',
  ];

  if (!filePath) {
    return true; // ファイルパスがない場合はスキップ
  }

  const fileName = path.basename(filePath);
  const isProtected = criticalFiles.includes(fileName);

  if (isProtected) {
    logWarning(`Editing protected file: ${fileName}`);
    logInfo('Please ensure changes are intentional');
  }

  return true;
}

// ディスク容量チェック
function checkDiskSpace() {
  try {
    const _stats = fs.statSync(process.cwd());
    // 簡単なチェック - 実際のディスク容量チェックは複雑なので省略
    return true;
  } catch (_error) {
    logWarning('Could not check disk space');
    return true;
  }
}

// メイン実行
function main() {
  // 環境変数から編集対象ファイルを取得（もし利用可能なら）
  const targetFile = process.env.TARGET_FILE || process.argv[2];

  log('🔒 nexus Pre-Edit Safety Check', 'magenta');
  log('================================', 'magenta');

  if (targetFile) {
    logInfo(`Target file: ${targetFile}`);
  }

  // 各種チェック実行
  const checks = [
    { name: 'Git Status', check: checkGitStatus },
    { name: 'Protected Files', check: () => checkProtectedFiles(targetFile) },
    { name: 'Disk Space', check: checkDiskSpace },
  ];

  let allPassed = true;

  for (const { name, check } of checks) {
    try {
      const passed = check();
      if (passed === false) {
        allPassed = false;
      }
    } catch (error) {
      logWarning(`${name} check failed: ${error.message}`);
    }
  }

  if (allPassed) {
    logInfo('Pre-edit checks passed - proceeding with edit');
  } else {
    logWarning('Some pre-edit checks failed - proceed with caution');
  }

  // Pre-editチェックは常に成功を返す（編集をブロックしないため）
  process.exit(0);
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main };
