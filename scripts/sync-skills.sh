#!/usr/bin/env bash
# sync-skills.sh — .claude/skills/ → .windsurf/skills/ 同期（Claude を正とする）
# 共通 Skill のみ同期。Claude 専用・Windsurf 専用は同期対象外。
# 使い方: ./scripts/sync-skills.sh [--dry-run]

set -euo pipefail

CLAUDE_SKILLS="$(dirname "$0")/../.claude/skills"
WINDSURF_SKILLS="$(dirname "$0")/../.windsurf/skills"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "[DRY-RUN] 変更はしません"
fi

echo "=== Skills Sync ==="
echo "  from: $CLAUDE_SKILLS"
echo "  to:   $WINDSURF_SKILLS"
echo ""

# 同期対象スキル（ディレクトリ単位で同期）
SHARED_SKILLS=(
  "nexus-design"
  "nexus-review"
  "nexus-rust-rules"
  "cascade-workflow"
)

for skill in "${SHARED_SKILLS[@]}"; do
  src="$CLAUDE_SKILLS/$skill"
  dst="$WINDSURF_SKILLS/$skill"

  if [[ ! -d "$src" ]]; then
    echo "[SKIP] $skill — source directory not found"
    continue
  fi

  if [[ -d "$dst" ]]; then
    if diff -rq "$src" "$dst" > /dev/null 2>&1; then
      echo "[OK]   $skill — already in sync"
    else
      echo "[DIFF] $skill — files differ"
      if [[ "$DRY_RUN" == false ]]; then
        rm -rf "$dst"
        cp -r "$src" "$dst"
        echo "       → synced .claude → .windsurf"
      fi
    fi
  else
    echo "[NEW]  $skill — missing in .windsurf/skills/"
    if [[ "$DRY_RUN" == false ]]; then
      # 古いフラットファイル形式があれば削除
      rm -f "$WINDSURF_SKILLS/${skill}.md"
      mkdir -p "$(dirname "$dst")"
      cp -r "$src" "$dst"
      echo "       → created"
    fi
  fi
done

echo ""
echo "=== Done ==="
