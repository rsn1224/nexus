#!/bin/bash
# nexus Claude Code auto-review
# 使い方: ./scripts/review.sh [対象ファイルパス]
# 例: ./scripts/review.sh src/components/settings/SettingsWing.tsx
# 例（全変更ファイル）: ./scripts/review.sh

TARGET=${1:-""}

if [ -n "$TARGET" ]; then
  PROMPT="nexus-review と nexus-design スキルを参照して、${TARGET} をレビューしてください。
問題があれば REQUIRES_CHANGES、なければ APPROVED と判定し、
指摘事項を箇条書きで出力してください。"
else
  PROMPT="nexus-review と nexus-design スキルを参照して、
git diff HEAD でステージング済みの変更ファイルを全てレビューしてください。
問題があれば REQUIRES_CHANGES、なければ APPROVED と判定し、
指摘事項を箇条書きで出力してください。"
fi

claude "$PROMPT" \
  --allowedTools "Read,Bash" \
  --print