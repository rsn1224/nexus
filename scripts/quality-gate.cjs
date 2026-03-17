#!/usr/bin/env node

/**
 * nexus 品質ゲート自動実行スクリプト
 * Claude Code PostToolUse hookから呼び出され、
 * 全品質チェックを一括実行する
 */

const { execSync } = require('child_process');
const fs = require('fs');
const _path = require('path');

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

function logStep(step, description) {
  log(`\n=== Step ${step}: ${description} ===`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// コマンド実行ユーティリティ
function runCommand(command, description, options = {}) {
  try {
    log(`▶ ${command}`, 'blue');
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options,
    });
    logSuccess(`${description} - PASSED`);
    return { success: true, output: result };
  } catch (error) {
    logError(`${description} - FAILED`);
    if (options.showOutput !== false) {
      console.error(error.stdout || error.message);
    }
    return { success: false, error: error.stdout || error.message };
  }
}

// 変更されたファイルを検出
function getChangedFiles() {
  try {
    const result = execSync('git diff --name-only --diff-filter=M HEAD', { encoding: 'utf8' });
    return result
      .trim()
      .split('\n')
      .filter((file) => file.match(/\.(ts|tsx|js|jsx|rs)$/) && fs.existsSync(file));
  } catch {
    return [];
  }
}

// TypeScript/JavaScriptファイルの品質チェック
function checkFrontend(changedFiles) {
  logStep(1, 'Frontend Quality Checks');

  const tsFiles = changedFiles.filter((file) => file.match(/\.(ts|tsx)$/));
  const jsFiles = changedFiles.filter((file) => file.match(/\.(js|jsx)$/));

  let frontendPassed = true;

  // Biome check (format + lint)
  if (tsFiles.length > 0 || jsFiles.length > 0) {
    const biomeResult = runCommand('npm run check', 'Biome Format & Lint', { showOutput: true });
    if (!biomeResult.success) {
      frontendPassed = false;
      logWarning('Biome issues detected. Auto-fix applied where possible.');
    }
  }

  // TypeScript type check
  if (tsFiles.length > 0) {
    const typecheckResult = runCommand('npm run typecheck', 'TypeScript Type Check', {
      showOutput: true,
    });
    if (!typecheckResult.success) {
      frontendPassed = false;
    }
  }

  // Vitest tests (if test files changed or logic changed)
  const hasTestChanges = changedFiles.some(
    (file) => file.includes('.test.') || file.includes('.spec.'),
  );
  const hasLogicChanges = tsFiles.some(
    (file) => file.includes('/stores/') || file.includes('/lib/') || file.includes('/services/'),
  );

  if (hasTestChanges || hasLogicChanges) {
    const testResult = runCommand('npm run test', 'Vitest Tests', { showOutput: true });
    if (!testResult.success) {
      frontendPassed = false;
    }
  }

  return frontendPassed;
}

// Rustファイルの品質チェック
function checkRust(changedFiles) {
  logStep(2, 'Rust Quality Checks');

  const rustFiles = changedFiles.filter((file) => file.endsWith('.rs'));
  if (rustFiles.length === 0) {
    logSuccess('No Rust files changed - skipping');
    return true;
  }

  let rustPassed = true;

  // Cargo clippy
  const clippyResult = runCommand('cd src-tauri && cargo clippy -- -D warnings', 'Cargo Clippy', {
    showOutput: true,
  });
  if (!clippyResult.success) {
    rustPassed = false;
  }

  // Cargo format check
  const formatResult = runCommand('cd src-tauri && cargo fmt --check', 'Cargo Format Check', {
    showOutput: false,
  });
  if (!formatResult.success) {
    logWarning('Cargo format issues detected. Auto-formatting...');
    runCommand('cd src-tauri && cargo fmt', 'Cargo Format Fix');
  }

  // Cargo test
  const testResult = runCommand('cd src-tauri && cargo test', 'Cargo Tests', { showOutput: true });
  if (!testResult.success) {
    rustPassed = false;
  }

  return rustPassed;
}

// 結果サマリー生成
function generateSummary(changedFiles, frontendPassed, rustPassed) {
  logStep(3, 'Quality Gate Summary');

  const allPassed = frontendPassed && rustPassed;

  if (allPassed) {
    logSuccess('🎉 ALL QUALITY CHECKS PASSED!');
    log(`Changed files: ${changedFiles.length}`);
    log('Ready to proceed with next steps.', 'green');
  } else {
    logError('🚨 QUALITY GATE FAILED!');
    log('Please fix the issues above before proceeding.', 'red');

    // 修正提案
    log('\n💡 Auto-fix suggestions:', 'yellow');
    if (!frontendPassed) {
      log('- Run: npm run check (auto-fixes format issues)', 'yellow');
      log('- Check TypeScript errors in output above', 'yellow');
    }
    if (!rustPassed) {
      log('- Run: cd src-tauri && cargo fmt (auto-fixes format)', 'yellow');
      log('- Fix clippy warnings shown above', 'yellow');
    }
  }

  return allPassed;
}

// メイン実行
function main() {
  log('🚀 nexus Quality Gate - Automated Checks', 'magenta');
  log('=====================================', 'magenta');

  try {
    // 変更ファイル検出
    const changedFiles = getChangedFiles();
    log(`Detected ${changedFiles.length} changed files`, 'blue');

    if (changedFiles.length === 0) {
      log('No relevant files changed - skipping quality gate', 'yellow');
      process.exit(0);
    }

    // フロントエンドチェック
    const frontendPassed = checkFrontend(changedFiles);

    // Rustチェック
    const rustPassed = checkRust(changedFiles);

    // サマリー生成
    const allPassed = generateSummary(changedFiles, frontendPassed, rustPassed);

    // 終了コード設定
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    logError(`Quality gate execution failed: ${error.message}`);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main, runCommand, getChangedFiles };
