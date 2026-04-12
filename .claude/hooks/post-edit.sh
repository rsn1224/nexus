#!/bin/bash
# .claude/hooks/post-edit.sh
# PostToolUse(Edit|Write) フック: ファイル種別に応じてフォーマット + lint 実行

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except Exception as e:
    print(f'[post-edit] JSON parse error: {e}', file=sys.stderr)
")

[[ -z "$FILE_PATH" ]] && exit 0

# === Rust ===
if [[ "$FILE_PATH" == *.rs ]]; then
    if ! command -v cargo &>/dev/null; then
        exit 0
    fi
    if [[ ! -f "src-tauri/Cargo.toml" ]]; then
        exit 0
    fi

    FMT_OUT=$( (cd src-tauri && cargo fmt) 2>&1)
    FMT_EXIT=$?
    if [[ $FMT_EXIT -ne 0 ]]; then
        echo "[post-edit] cargo fmt failed on: $FILE_PATH" >&2
        echo "$FMT_OUT" >&2
        exit 1
    fi

    CLIPPY_OUT=$( (cd src-tauri && cargo clippy --message-format=short) 2>&1)
    if echo "$CLIPPY_OUT" | grep -q "^error"; then
        echo "[post-edit] cargo clippy errors in: $FILE_PATH" >&2
        echo "$CLIPPY_OUT" | grep "^error" >&2
        exit 1
    elif echo "$CLIPPY_OUT" | grep -q "^warning"; then
        echo "[post-edit] cargo clippy warnings (non-blocking):" >&2
        echo "$CLIPPY_OUT" | grep "^warning" | head -5 >&2
    fi

    exit 0
fi

# === TypeScript ===
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
    if ! command -v npm &>/dev/null; then
        exit 0
    fi
    if [[ ! -d "node_modules" ]]; then
        exit 0
    fi

    if [[ -f "biome.json" && "$FILE_PATH" == */src/* ]]; then
        BIOME_OUT=$(npx @biomejs/biome check --write "$FILE_PATH" 2>&1)
        BIOME_EXIT=$?
        if [[ $BIOME_EXIT -ne 0 ]]; then
            echo "[post-edit] biome check issues in: $FILE_PATH" >&2
            echo "$BIOME_OUT" | head -10 >&2
        fi
    fi

    TSC_OUT=$(npm run typecheck 2>&1)
    TSC_EXIT=$?
    if [[ $TSC_EXIT -ne 0 ]]; then
        ERROR_COUNT=$(echo "$TSC_OUT" | grep -c "error TS")
        echo "[post-edit] tsc --noEmit: ${ERROR_COUNT} error(s) after editing $FILE_PATH" >&2
        echo "$TSC_OUT" | grep "error TS" | head -10 >&2
        exit 1
    fi

    exit 0
fi

exit 0
