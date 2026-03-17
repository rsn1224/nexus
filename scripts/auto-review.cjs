#!/usr/bin/env node

/**
 * nexus 自動レビュースクリプト
 * 実装完了後に自動でレビューを実行し、結果を記録する
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 変更ファイルを取得
function getChangedFiles() {
  try {
    const result = execSync('git diff --name-only --diff-filter=M HEAD', { encoding: 'utf8' });
    return result
      .trim()
      .split('\n')
      .filter((f) => f?.match(/\.(ts|tsx|js|jsx|rs)$/));
  } catch (error) {
    logError(`Failed to get changed files: ${error.message}`);
    return [];
  }
}

// TypeScript/Reactファイルのレビュー
function reviewTypeScriptFiles(files) {
  const tsFiles = files.filter((f) => f.match(/\.(ts|tsx)$/));
  const issues = [];

  for (const file of tsFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // CSS変数チェック
      const hardCodedColors = content.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/g);
      if (hardCodedColors) {
        issues.push({
          file,
          type: 'hardcoded_color',
          message: `Hardcoded colors found: ${hardCodedColors.join(', ')}`,
          severity: 'medium',
        });
      }

      // console.logチェック
      const consoleLogs = content.match(/console\.log/g);
      if (consoleLogs) {
        issues.push({
          file,
          type: 'console_log',
          message: `console.log detected (${consoleLogs.length} instances)`,
          severity: 'high',
        });
      }

      // any型チェック
      const anyTypes = content.match(/: any\b/g);
      if (anyTypes) {
        issues.push({
          file,
          type: 'any_type',
          message: `any type detected (${anyTypes.length} instances)`,
          severity: 'medium',
        });
      }

      // unwrap()チェック（テストファイル以外）
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        const unwraps = content.match(/\.unwrap\(\)/g);
        if (unwraps) {
          issues.push({
            file,
            type: 'unwrap',
            message: `unwrap() detected in production code`,
            severity: 'high',
          });
        }
      }

      // key={index}チェック
      const keyIndex = content.match(/key=\{index\}/g);
      if (keyIndex) {
        issues.push({
          file,
          type: 'key_index',
          message: `key={index} detected - use unique IDs`,
          severity: 'medium',
        });
      }
    } catch (error) {
      logWarning(`Could not review ${file}: ${error.message}`);
    }
  }

  return issues;
}

// Rustファイルのレビュー
function reviewRustFiles(files) {
  const rustFiles = files.filter((f) => f.endsWith('.rs'));
  const issues = [];

  for (const file of rustFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');

      // テスト以外のunwrap()チェック
      if (!content.includes('#[cfg(test)]')) {
        const unwraps = content.match(/\.unwrap\(\)/g);
        if (unwraps) {
          issues.push({
            file,
            type: 'unwrap',
            message: `unwrap() detected in production code`,
            severity: 'high',
          });
        }
      }

      // println!/dbg!チェック
      const debugPrints = content.match(/(println!|dbg!)\(/g);
      if (debugPrints) {
        issues.push({
          file,
          type: 'debug_print',
          message: `Debug prints detected: ${debugPrints.join(', ')}`,
          severity: 'medium',
        });
      }

      // unsafeチェック
      const unsafeBlocks = content.match(/unsafe\s*\{/g);
      if (unsafeBlocks) {
        issues.push({
          file,
          type: 'unsafe',
          message: `unsafe block detected`,
          severity: 'high',
        });
      }
    } catch (error) {
      logWarning(`Could not review ${file}: ${error.message}`);
    }
  }

  return issues;
}

// 自動レビュースクリプトを実行
function runReviewScripts(files) {
  const results = [];

  // TypeScript/Reactレビュー
  const tsIssues = reviewTypeScriptFiles(files);
  if (tsIssues.length > 0) {
    results.push({
      category: 'TypeScript/React',
      issues: tsIssues,
    });
  }

  // Rustレビュー
  const rustIssues = reviewRustFiles(files);
  if (rustIssues.length > 0) {
    results.push({
      category: 'Rust',
      issues: rustIssues,
    });
  }

  return results;
}

// レビュー結果をHANDOFF.mdに記録
function recordReviewResults(results) {
  try {
    const handoffPath = path.join(process.cwd(), 'HANDOFF.md');
    const content = fs.readFileSync(handoffPath, 'utf8');

    // 最新のタスクを探す
    const taskMatches = content.match(
      /### タスク (\d+)[\s\S]*?#### タ\d+ — Claude Code レビュー結果/g,
    );
    if (!taskMatches || taskMatches.length === 0) {
      logWarning('No task found to record review results');
      return;
    }

    const lastTaskMatch = taskMatches[taskMatches.length - 1];
    const taskNumber = lastTaskMatch.match(/### タスク (\d+)/)[1];

    // レビュー結果を生成
    let reviewText = `#### タスク${taskNumber} — Claude Code レビュー結果\n\n`;

    if (results.length === 0 || results.every((r) => r.issues.length === 0)) {
      reviewText += `- **判定**: ✅ PASS（自動レビュー）\n`;
      reviewText += `- **指摘事項**: なし\n`;
      reviewText += `- **修正内容**: なし\n`;
      reviewText += `- **レビュー日**: ${new Date().toLocaleDateString('ja-JP')}\n`;
    } else {
      reviewText += `- **判定**: ⚠️ REQUIRES_CHANGES\n`;
      reviewText += `- **指摘事項**:\n`;

      for (const category of results) {
        if (category.issues.length > 0) {
          reviewText += `  **${category.category}**:\n`;
          for (const issue of category.issues) {
            const severityIcon =
              issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
            reviewText += `    ${severityIcon} ${path.basename(issue.file)}: ${issue.message}\n`;
          }
        }
      }

      reviewText += `- **修正内容**: 上記の問題を修正してください\n`;
      reviewText += `- **レビュー日**: ${new Date().toLocaleDateString('ja-JP')}\n`;
    }

    // 既存のレビューセクションを置換
    const reviewSectionRegex = new RegExp(
      `#### タスク${taskNumber} — Claude Code レビュー結果[\\s\\S]*?(?=\\n\\n###|\\n---|$)`,
    );
    const newContent = content.replace(reviewSectionRegex, reviewText);

    if (newContent !== content) {
      fs.writeFileSync(handoffPath, newContent, 'utf8');
      logSuccess(`Review results recorded for Task ${taskNumber}`);
    } else {
      logWarning('Could not find review section to update');
    }
  } catch (error) {
    logError(`Failed to record review results: ${error.message}`);
  }
}

// 自動ステージング・コミットは禁止
// git add -A / git commit の自動実行はユーザーのレビューを迂回するため削除
// コミットは必ず手動で行うこと（git add -p → git commit）

// メイン実行
function main() {
  log('🔍 nexus Auto Review', 'magenta');
  log('====================', 'magenta');

  try {
    // 変更ファイルを取得
    const changedFiles = getChangedFiles();

    if (changedFiles.length === 0) {
      logInfo('No files to review');
      process.exit(0);
    }

    logInfo(`Reviewing ${changedFiles.length} files`);

    // レビュー実行
    const results = runReviewScripts(changedFiles);

    // 結果表示
    log('\n📋 Review Results:', 'cyan');
    if (results.length === 0 || results.every((r) => r.issues.length === 0)) {
      logSuccess('No issues found - PASSED');
    } else {
      logWarning('Issues found:');
      for (const category of results) {
        if (category.issues.length > 0) {
          log(`  ${category.category}:`, 'yellow');
          for (const issue of category.issues) {
            const severityIcon =
              issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
            log(`    ${severityIcon} ${path.basename(issue.file)}: ${issue.message}`, 'yellow');
          }
        }
      }
    }

    // レビュー結果を記録
    recordReviewResults(results);

    // 終了コード設定
    const hasIssues = results.some((r) => r.issues.length > 0);
    process.exit(hasIssues ? 1 : 0);
  } catch (error) {
    logError(`Auto review failed: ${error.message}`);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { main, runReviewScripts, recordReviewResults };
