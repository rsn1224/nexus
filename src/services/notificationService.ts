import { sendNotification } from '@tauri-apps/plugin-notification';
import log from '../lib/logger';
import type { ResourceSnapshot } from '../types';

// ─── Alert Thresholds ─────────────────────────────────────────────────────────

const CPU_ALERT_THRESHOLD = 90; // %
const MEM_ALERT_THRESHOLD = 90; // %
const CPU_TEMP_THRESHOLD = 90; // ℃

const DEDUP_INTERVAL_MS = 60 * 1000; // 60秒以内の重複通知を抑制

// ─── Deduplication State ──────────────────────────────────────────────────────

const notificationTimestamps = new Map<string, number>();

/** テスト用: タイムスタンプをリセット */
export function resetNotificationTimestamps(): void {
  notificationTimestamps.clear();
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

export async function checkAndNotify(snapshot: ResourceSnapshot): Promise<void> {
  try {
    const now = Date.now();

    // CPU 使用率アラート
    if (snapshot.cpuPercent > CPU_ALERT_THRESHOLD) {
      await maybeSend('cpu-usage', now, {
        title: '⚠️ CPU使用率アラート',
        body: `CPU使用率が${snapshot.cpuPercent.toFixed(1)}%に達しました（閾値: ${CPU_ALERT_THRESHOLD}%）`,
      });
    }

    // CPU 温度アラート
    if (snapshot.cpuTempC !== null && snapshot.cpuTempC > CPU_TEMP_THRESHOLD) {
      await maybeSend('cpu-temp', now, {
        title: '⚠️ CPU温度アラート',
        body: `CPU温度が${snapshot.cpuTempC.toFixed(1)}℃に達しました（閾値: ${CPU_TEMP_THRESHOLD}℃）`,
      });
    }

    // メモリ使用率アラート
    if (snapshot.memTotalMb > 0) {
      const memPercent = (snapshot.memUsedMb / snapshot.memTotalMb) * 100;
      if (memPercent > MEM_ALERT_THRESHOLD) {
        await maybeSend('mem-usage', now, {
          title: '⚠️ メモリ使用率アラート',
          body: `メモリ使用率が${memPercent.toFixed(1)}%に達しました（閾値: ${MEM_ALERT_THRESHOLD}%）`,
        });
      }
    }
  } catch (err) {
    log.error({ err }, 'notification: failed to send alert');
  }
}

async function maybeSend(
  key: string,
  now: number,
  payload: { title: string; body: string },
): Promise<void> {
  const last = notificationTimestamps.get(key);
  if (last !== undefined && now - last < DEDUP_INTERVAL_MS) {
    return;
  }
  await sendNotification(payload);
  notificationTimestamps.set(key, now);
  log.info({ key, title: payload.title }, 'notification: alert sent');
}
