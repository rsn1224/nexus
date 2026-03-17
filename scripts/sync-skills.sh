#!/usr/bin/env bash
# sync-skills.sh — .claude/skills/ と .windsurf/skills/ を同期する
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

# 同期対象スキル（双方向で一致させるもの）
SHARED_SKILLS=(
  "nexus-design.md"
  "cascade-workflow/SKILL.md"
)

for skill in "${SHARED_SKILLS[@]}"; do
  src="$CLAUDE_SKILLS/$skill"
  dst="$WINDSURF_SKILLS/$skill"

  if [[ ! -f "$src" ]]; then
    echo "[SKIP] $skill — source not found"
    continue
  fi

  if [[ -f "$dst" ]]; then
    if diff -q "$src" "$dst" > /dev/null 2>&1; then
      echo "[OK]   $skill — already in sync"
    else
      echo "[DIFF] $skill — files differ"
      if [[ "$DRY_RUN" == false ]]; then
        mkdir -p "$(dirname "$dst")"
        cp "$src" "$dst"
        echo "       → copied .claude → .windsurf"
      fi
    fi
  else
    echo "[NEW]  $skill — missing in .windsurf/skills/"
    if [[ "$DRY_RUN" == false ]]; then
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
      echo "       → created"
    fi
  fi
done

echo ""
echo "=== Done ==="
