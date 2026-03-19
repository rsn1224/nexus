# NEXUS テスト戦略ガイド

> **バージョン:** v3.0
> **最終更新:** 2026-03-19
> **対象コミット:** `28c7ca7` 以降

---

## 目次

1. [テストピラミッド](#1-テストピラミッド)
2. [エージェント分離ルール](#2-エージェント分離ルール)
3. [テスト判定フロー](#3-テスト判定フロー)
4. [テスト種別と責務](#4-テスト種別と責務)
5. [ミューテーションテスト](#5-ミューテーションテスト)
6. [テスト作成ガイドライン](#6-テスト作成ガイドライン)
7. [CI 統合](#7-ci-統合)

---

## 1. テストピラミッド

```
                    ╱╲
                   ╱  ╲         E2E (Playwright + Tauri)
                  ╱ E2E╲        → CI: continue-on-error（v3.1 で正式化）
                 ╱──────╲
                ╱        ╲
               ╱ IT (統合) ╲    Integration Tests
              ╱──────────────╲  → Claude Code が spec.md から作成（src/ 参照禁止）
             ╱                ╲ → Wing 単位の store + component 結合テスト
            ╱   UT (単体)      ╲ Unit Tests
           ╱────────────────────╲→ Cascade が実装と同時に作成
          ╱                      ╲→ 純粋関数・ユーティリティ中心
         ╱  Mutation Testing      ╲ ミューテーションテスト (Stryker)
        ╱──────────────────────────╲→ 全レイヤーの「嘘テスト」検出
       ╱────────────────────────────╲
```

### 現在のテスト数

| レイヤー | ツール | テスト数 | 備考 |
|----------|--------|---------|------|
| UT (TypeScript) | Vitest | 542+ | `src/test/*.test.ts` |
| UT (Rust) | cargo test | 233+ | `#[cfg(test)] mod tests` in `services/` |
| IT (統合) | Vitest | — | Phase 2 で導入予定 |
| E2E | Playwright | 存在 | `e2e/` ディレクトリ、continue-on-error |
| Mutation | Stryker | — | Phase 2 で導入予定 |

---

## 2. エージェント分離ルール

### 背景

AI が実装とテストを同時に作成すると「トートロジカルテスト」が発生する。
実装コードを参照してテストを書くと、テストが実装の挙動をそのまま追認するだけになり、
カバレッジは高いがバグ検出力が低いテストスイートになる。

| 指標 | 同一エージェント（実装+テスト） | 分離後 |
|------|-------------------------------|--------|
| テスト精度 | 61% | **87.8%** |
| AI チート率 | 76% | **≒ 0%**（src/ アクセス制限時） |

### ルール

#### Cascade（実装担当）— UT 作成時

1. テストが矛盾する場合（同じ入力に異なる期待値）は、実装を続けずに即停止して報告する
2. 既存テストファイル（`*.test.ts`, `*.test.tsx`, `*.spec.ts`）の既存テストケースを書き換えてはならない。新規テスト追加のみ許可
3. テストの期待値は実装の内部動作ではなく、仕様（spec.md）に基づくこと
4. `spec.md` に記載された期待動作と実装の結果が異なる場合、実装のバグとして報告する（テストを変えるな）

#### Claude Code（レビュー担当）— IT 作成時

1. `src/` ディレクトリのソースコードを読んではならない。参照してよいのは:
   - `docs/specs/*.md`（仕様書）
   - `src/types/**`（型定義のみ）
   - テスト対象の public API シグネチャ（関数名・引数型・戻り値型のみ）
2. テストの期待値は `spec.md` の Given/When/Then から導出する
3. 実装の内部構造に依存するテスト（private 関数の直接テスト、内部状態の検証）は書かない
4. テストが失敗した場合:
   - spec.md に合致している → 実装のバグとして報告
   - spec.md と乖離している → テストの修正を提案（理由を明記）

---

## 3. テスト判定フロー

テスト失敗時は以下のフローに従って判断する。

```
テスト失敗
  │
  ├─ spec.md に期待動作が定義されている？
  │    │
  │    ├─ YES → テスト結果は spec と一致している？
  │    │    │
  │    │    ├─ YES → ★ 実装のバグ。実装を修正せよ（テストを変えるな）
  │    │    │
  │    │    └─ NO → テストが spec から逸脱。テストを修正（理由を明記）
  │    │
  │    └─ NO → spec が不足。Computer に報告して spec 追加を依頼
  │
  └─ spec.md が存在しない？
       → spec 作成を先に行うこと（テストの前に spec）
```

### 判断の優先順位

1. **spec.md が最上位の真実** — テストと実装の両方が spec に従う
2. **テストは仕様の代理** — spec が存在しない場合、既存テストが暫定的な仕様として機能する
3. **実装は変更可能** — テストが spec に合致しているなら、実装側を修正する

---

## 4. テスト種別と責務

### 4-A. Unit Test (UT)

- **作成者:** Cascade
- **対象:** 純粋関数、ユーティリティ、lib/ モジュール
- **配置:** `src/test/*.test.ts`
- **ルール:**
  - 1 テストファイル = 1 対象モジュール
  - モック最小限（外部依存のみ）
  - エッジケース・境界値を必ず含める

### 4-B. Integration Test (IT)

- **作成者:** Claude Code（src/ 参照禁止）
- **対象:** Wing 単位の store + component 結合
- **配置:** `src/test/integration/*.test.ts`（Phase 2 で作成）
- **ルール:**
  - spec.md の Given/When/Then シナリオを直接テスト化
  - store の初期化 → アクション実行 → 状態検証のパターン
  - コンポーネントレンダリング + ユーザー操作のシミュレーション

### 4-C. E2E Test

- **ツール:** Playwright + Tauri
- **配置:** `e2e/`
- **状態:** CI で `continue-on-error: true`（v3.1 で正式化予定）

### 4-D. Rust Unit Test

- **配置:** 各 `services/*.rs` 内の `#[cfg(test)] mod tests`
- **ルール:**
  - `services/` レイヤーのビジネスロジックを中心にテスト
  - `unwrap()` はテストコード内で理由コメント付きで許可
  - `commands/` のテストは統合テストとして `tests/` に配置

---

## 5. ミューテーションテスト

### 目的

カバレッジが高くてもバグを検出できない「トートロジカルテスト」を検出する。
ミューテーションテストはソースコードに小さな変更（ミュータント）を挿入し、
テストがその変更を検出できるかを検証する。

### ツール

- **TypeScript:** `@stryker-mutator/core` + `@stryker-mutator/vitest-runner`
- **導入フェーズ:** Phase 2

### 導入手順（ベースラインファースト）

```
Step 1: Stryker をインストール（devDependency）
Step 2: stryker.config.mjs を作成（break 閾値なし = まず計測のみ）
Step 3: npx stryker run でベースラインスコアを取得
Step 4: 結果をこのドキュメントの「ベースライン記録」セクションに記録
Step 5: ベースラインに基づき break 閾値を設定:
  - ベースライン 40%+ → break: ベースライン - 5pt
  - ベースライン 30-39% → break: 25
  - ベースライン 30% 未満 → break: なし（改善優先）
Step 6: CI に weekly trigger で追加
```

### ベースライン記録

| 日付 | コミット | スコア | killed | survived | 閾値 | 備考 |
|------|---------|--------|--------|----------|------|------|
| 2026-03-19 | `212b958` | **31.64%** | 274 | 592 | 25 | 初回ベースライン（src/lib/ 対象、866 ミュータント） |

### ファイル別スコア（初回ベースライン）

| ファイル | スコア | killed | survived | 改善優先度 |
|---------|--------|--------|----------|-----------|
| `ai/homeAi.ts` | 74.05% | 97 | 34 | — |
| `ai/launcherAi.ts` | 75.00% | 18 | 6 | — |
| `gameDetection.ts` | 77.78% | 7 | 2 | — |
| `gameProfile.ts` | 71.43% | 5 | 2 | — |
| `ai/boostAi.ts` | 43.90% | 36 | 46 | 中 |
| `gameReadiness/index.ts` | 41.27% | 26 | 37 | 中 |
| `ai/types.ts` | 30.00% | 3 | 7 | 中 |
| `tauri.ts` | 20.83% | 5 | 19 | 高 |
| `canvas/timelineRenderer.ts` | 18.88% | 27 | 116 | 高 |
| `gameReadiness/scores.ts` | 16.96% | 29 | 142 | 高 |
| `gameReadiness/recommendations.ts` | 13.82% | 17 | 106 | 高 |
| `formatters.ts` | 10.53% | 4 | 34 | 高 |
| `logger.ts` | 0.00% | 0 | 5 | 高 |
| `storage.ts` | 0.00% | 0 | 32 | 高 |
| `windowsSettings.ts` | 0.00% | 0 | 4 | 高 |

### 運用ルール

- 毎コミットでは実行しない（実行時間が長いため）
- CI では weekly trigger + manual trigger で実行
- スコアが閾値を下回った場合、次のコミットで改善必須
- 新機能追加時は該当モジュールのみ `--mutate` 指定で実行可

---

## 6. テスト作成ガイドライン

### やるべきこと

- spec.md の Given/When/Then を直接テストケースに変換する
- エッジケース（空配列、null、境界値、エラー状態）を必ずテストする
- テスト名は「何を」「どの条件で」「どうなるか」を明記する
- 1 テストケース = 1 アサーション（原則）

### やってはいけないこと

- 実装の内部構造をテストする（private 関数、内部状態）
- テストコード内で本番ロジックを再実装する（トートロジー）
- カバレッジのためだけにテストを追加する
- 既存テストを「通るように」書き換える（spec との乖離を先に確認）
- モックを過剰に使用する（実際の依存を隠蔽してしまう）

### テストの品質チェックリスト

```
□ spec.md のシナリオに対応しているか？
□ テストを壊さずに実装のバグを見逃す状態になっていないか？
□ エッジケースをカバーしているか？
□ テスト名から何をテストしているか読み取れるか？
□ モックは必要最小限か？
```

---

## 7. CI 統合

### 現在の CI パイプライン

```yaml
frontend:
  - npm run typecheck    # tsc --noEmit
  - npm run check        # biome check
  - npm run lint         # カスタム lint スクリプト
  - npm run test:coverage # vitest run --coverage

rust-lint:
  - cargo fmt -- --check
  - cargo clippy -- -D warnings

rust-test-linux:
  - cargo test

rust-test-windows:    # [win-test] タグ時のみ
  - cargo test + clippy

e2e:                  # [win-test] タグ時のみ、continue-on-error
  - playwright test
```

### Phase 2 以降の追加予定

```yaml
# weekly trigger
mutation-test:
  - npx stryker run
  - ベースライン閾値チェック

# Phase 3
security:
  - semgrep --config p/typescript src/
  - semgrep --config p/rust src-tauri/src/
```

### テストファイル変更監視（Phase 2 で導入）

spec.md の変更を伴わないテストファイルの変更を CI で警告する。
AI がテストを「通るように」書き換えるチートパターンを検出するためのガードレール。
