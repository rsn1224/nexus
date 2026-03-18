// ─── タイマーリゾリューション ────────────────────────────────────────────────

/** Windows タイマーの内部単位（100ナノ秒）→ ミリ秒の変換係数 */
export const TIMER_100NS_PER_MS = 10_000;

// ─── CPU 使用率閾値 ─────────────────────────────────────────────────────────

/** CPU 使用率 Critical 閾値（%） */
export const CPU_USAGE_CRITICAL_PCT = 90;
/** CPU 使用率 Warning 閾値（%） — プロセス整理を促す */
export const CPU_USAGE_WARN_PCT = 70;
/** CPU 使用率 Boost 推奨閾値（%） — ブースト実行を促す */
export const CPU_USAGE_BOOST_WARN_PCT = 80;

// ─── メモリ使用率閾値 ───────────────────────────────────────────────────────

/** メモリ使用率 Critical 閾値（%） */
export const MEM_USAGE_CRITICAL_PCT = 90;
/** メモリ使用率 Warning 閾値（%） */
export const MEM_USAGE_WARN_PCT = 75;

// ─── ディスク使用率閾値 ─────────────────────────────────────────────────────

/** ディスク使用率 Critical 閾値（%） */
export const DISK_USAGE_CRITICAL_PCT = 95;
/** ディスク使用率 Warning 閾値（%） */
export const DISK_USAGE_WARN_PCT = 85;

// ─── CPU 温度閾値 ───────────────────────────────────────────────────────────

/** CPU 温度 Critical 閾値（℃） */
export const CPU_TEMP_CRITICAL_C = 90;
/** CPU 温度 Warning 閾値（℃） */
export const CPU_TEMP_WARN_C = 75;

// ─── GPU 温度閾値 ───────────────────────────────────────────────────────────

/** GPU 温度 Critical 閾値（℃） */
export const GPU_TEMP_CRITICAL_C = 95;
/** GPU 温度 Warning 閾値（℃） */
export const GPU_TEMP_WARN_C = 85;

/** GPU 温度スコア計算: Good（満点）閾値（℃） */
export const GPU_TEMP_SCORE_GOOD_C = 70;
/** GPU 温度スコア計算: Warning 閾値（℃） */
export const GPU_TEMP_SCORE_WARN_C = 80;
/** GPU 温度スコア計算: Critical 閾値（℃） */
export const GPU_TEMP_SCORE_CRITICAL_C = 90;
