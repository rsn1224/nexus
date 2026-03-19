---
name: explore-codebase
description: >
  コードベースの構造・型定義・依存関係を調査してマークダウンレポートを生成。
  Explore サブエージェントとして fork コンテキストで実行。
  Use when user says "構造を調べて", "依存関係を確認", "コードベース調査",
  "/explore-codebase", or before major refactoring.
  Do NOT use for targeted single-file searches (use Grep/Glob directly).
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
---

プロジェクトの構造を調査し、以下をレポートしてください:
1. ディレクトリ構成の概要
2. 主要な型定義の一覧
3. コンポーネント間の依存関係
4. 潜在的な問題（型の重複、未使用の export など）

結果はマークダウン形式で出力すること。
