#!/bin/bash
# .claude/hooks/pre-bash.sh
# PreToolUse(Bash) フック: 危険コマンドや前提条件を検出してブロック

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except Exception as e:
    print(f'[pre-bash] JSON parse error: {e}', file=sys.stderr)
")

[[ -z "$COMMAND" ]] && exit 0

# Cargo.toml 不在での cargo build/test/clippy/run を防止
if echo "$COMMAND" | grep -qE 'cargo (build|test|clippy|run)' \
    && [[ ! -f "Cargo.toml" ]] \
    && [[ ! -f "src-tauri/Cargo.toml" ]]; then
    echo "[pre-bash] Cargo.toml が存在しません。先に \`cargo init\` でプロジェクトを初期化してください。" >&2
    exit 1
fi

# settings.local.json の git add を防止
if echo "$COMMAND" | grep -qE 'git add.*settings\.local\.json'; then
    echo "[pre-bash] settings.local.json はコミット禁止です（bypassPermissions モードを含むため）。" >&2
    exit 1
fi

exit 0
