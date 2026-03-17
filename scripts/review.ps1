# nexus Claude Code auto-review
# 使い方: ./scripts/review.ps1 [対象ファイルパス]
# 例: ./scripts/review.ps1 src/components/settings/SettingsWing.tsx
# 例（全変更ファイル）: ./scripts/review.ps1

param([string]$Target = "")

if ($Target) {
  $Prompt = "nexus-review と nexus-design スキルを参照して、
$Target をレビューしてください。
問題があれば REQUIRES_CHANGES、なければ APPROVED と判定し、
指摘事項を箇条書きで出力してください。"
} else {
  $Prompt = "nexus-review と nexus-design スキルを参照して、
git diff HEAD でステージング済みの変更ファイルを全てレビューしてください。
問題があれば REQUIRES_CHANGES、なければ APPROVED と判定し、
指摘事項を箇条書きで出力してください。"
}

claude $Prompt --allowedTools "Read,Bash" --print