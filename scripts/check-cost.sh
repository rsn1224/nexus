#!/bin/bash
# Claude Code コスト確認スクリプト
# 使い方: bash scripts/check-cost.sh [daily|monthly|session|live|blocks|report]

MODE=${1:-daily}
echo "============================="
echo " Claude Code コスト監視"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================="

case $MODE in
  daily)
    echo ""
    echo "📊 本日のコスト:"
    npx ccusage@latest daily --since $(date '+%Y%m%d') --breakdown
    ;;
  monthly)
    echo ""
    echo "📅 今月のコスト:"
    npx ccusage@latest monthly --breakdown
    ;;
  session)
    echo ""
    echo "💬 セッション別コスト:"
    npx ccusage@latest session
    ;;
  live)
    echo ""
    echo "🔴 ライブモニタリング開始..."
    npx ccusage@latest blocks --live
    ;;
  blocks)
    echo ""
    echo "⏰ 5時間ブロック:"
    npx ccusage@latest blocks --active
    ;;
  report)
    echo ""
    echo "📋 日次レポート（JSON出力）:"
    REPORT_DIR="$HOME/dev/nexus/docs/cost-reports"
    mkdir -p "$REPORT_DIR"
    FILENAME="$REPORT_DIR/cost-$(date '+%Y%m%d').json"
    npx ccusage@latest daily --json --since $(date '+%Y%m%d') > "$FILENAME"
    echo "保存先: $FILENAME"
    ;;
  *)
    echo "使い方: bash scripts/check-cost.sh [daily|monthly|session|live|blocks|report]"
    ;;
esac
