import type React from 'react';
import { useEffect, useMemo } from 'react';
import { homePageSuggestions } from '../../lib/localAi';
import { useHardwareStore } from '../../stores/useHardwareStore';
import { useLauncherStore } from '../../stores/useLauncherStore';
import { useNavStore } from '../../stores/useNavStore';
import { useOpsStore } from '../../stores/useOpsStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useStorageStore } from '../../stores/useStorageStore';
import type { SystemProcess } from '../../types';
import AiPanel from '../shared/AiPanel';

// ─── Types ───────────────────────────────────────────────────────────────────

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTopCpuProcesses(processes: SystemProcess[], limit: number = 3): SystemProcess[] {
  return [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, limit);
}

function formatNetSpeed(kb: number): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB/s`;
  }
  return `${kb.toFixed(0)} KB/s`;
}

// ─── HomeWing ────────────────────────────────────────────────────────────────

export default function HomeWing(): React.ReactElement {
  // Store data
  const processes = useOpsStore((s) => s.processes);
  const fetchProcesses = useOpsStore((s) => s.fetchProcesses);

  const latestSnapshot = usePulseStore((s) =>
    s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1] : null,
  );

  const cpuPercent = latestSnapshot?.cpuPercent ?? null;
  const memUsed = latestSnapshot?.memUsedMb ?? null;
  const memTotal = latestSnapshot?.memTotalMb ?? null;
  const diskRead = latestSnapshot?.diskReadKb ?? null;
  const diskWrite = latestSnapshot?.diskWriteKb ?? null;
  const netRecv = latestSnapshot?.netRecvKb ?? null;
  const netSent = latestSnapshot?.netSentKb ?? null;
  const isPolling = usePulseStore((s) => s.isPolling);
  const startPolling = usePulseStore((s) => s.startPolling);

  const games = useLauncherStore((s) => s.games);
  const navigate = useNavStore((s) => s.navigate);

  // Storage and Hardware stores
  const fetchStorage = useStorageStore((s) => s.fetchStorage);
  const drives = useStorageStore((s) => s.drives);
  const fetchHardware = useHardwareStore((s) => s.fetchHardware);
  const hwInfo = useHardwareStore((s) => s.info);

  useEffect(() => {
    // Auto-fetch data on mount
    void fetchProcesses();
    void fetchStorage();
    void fetchHardware();
    // Auto-start pulse polling
    if (!isPolling) {
      startPolling();
    }
  }, [fetchProcesses, fetchStorage, fetchHardware, isPolling, startPolling]);

  const topProcesses = useMemo(() => getTopCpuProcesses(processes, 3), [processes]);

  const suggestions = useMemo(
    () => homePageSuggestions(latestSnapshot ?? null, drives, hwInfo),
    [latestSnapshot, drives, hwInfo],
  );

  const activeProcessCount = useMemo(
    () => processes.filter((p: SystemProcess) => p.cpuPercent > 1).length,
    [processes],
  );

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-accent-500)',
            letterSpacing: '0.15em',
            marginBottom: '4px',
          }}
        >
          ▶ ホーム
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
          }}
        >
          システム概要とクイックアクション
        </div>
      </div>

      {/* Grid Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        {/* OPS Card */}
        <div
          style={{
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '4px',
            padding: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            プロセス管理
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              アクティブ:{' '}
              <span style={{ color: 'var(--color-accent-500)' }}>{activeProcessCount}</span>
            </div>
            {topProcesses.length > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                CPU上位:
                {topProcesses.map((p: SystemProcess) => (
                  <div key={p.pid} style={{ marginLeft: '8px' }}>
                    {p.name} ({p.cpuPercent.toFixed(1)}%)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PULSE Card */}
        <div
          style={{
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '4px',
            padding: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            システム監視
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              CPU:{' '}
              <span
                style={{
                  color:
                    cpuPercent !== null && cpuPercent >= 80
                      ? 'var(--color-danger-500)'
                      : cpuPercent !== null && cpuPercent >= 50
                        ? 'var(--color-accent-500)'
                        : 'var(--color-text-primary)',
                }}
              >
                {cpuPercent !== null ? `${cpuPercent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div>
              RAM:{' '}
              <span style={{ color: 'var(--color-text-primary)' }}>
                {memUsed !== null && memTotal !== null
                  ? `${memUsed.toFixed(0)} / ${memTotal.toFixed(0)} MB`
                  : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* LAUNCHER Card */}
        <div
          style={{
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '4px',
            padding: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            ゲーム起動
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              ゲーム数: <span style={{ color: 'var(--color-accent-500)' }}>{games.length}</span>
            </div>
            {games.length > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Recent:{' '}
                {games
                  .slice(0, 4)
                  .map((g) => g.name)
                  .join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div
          style={{
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '4px',
            padding: '12px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            クイックアクション
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => (isPolling ? null : startPolling())}
              disabled={isPolling}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '4px 8px',
                background: isPolling ? 'var(--color-base-600)' : 'var(--color-accent-500)',
                color: isPolling ? 'var(--color-text-muted)' : 'var(--color-base-900)',
                border: `1px solid ${isPolling ? 'var(--color-border-subtle)' : 'var(--color-accent-500)'}`,
                borderRadius: '3px',
                cursor: isPolling ? 'default' : 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              {isPolling ? '■ 監視中' : '▶ 監視開始'}
            </button>
            <button
              type="button"
              onClick={() => navigate?.('boost')}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '4px 8px',
                background: 'var(--color-accent-500)',
                color: 'var(--color-base-900)',
                border: '1px solid var(--color-accent-500)',
                borderRadius: '3px',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              ⚡ 今すぐ最適化
            </button>
          </div>
        </div>
      </div>

      {/* System Status Card */}
      <div
        style={{
          marginTop: '16px',
          background: 'var(--color-base-800)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '4px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          システムステータス
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div>
            CPU{'     '}
            <span style={{ color: 'var(--color-accent-500)' }}>
              {cpuPercent !== null ? `${cpuPercent.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div>
            MEM{'     '}
            <span style={{ color: 'var(--color-accent-500)' }}>
              {memUsed !== null && memTotal !== null
                ? `${memUsed.toFixed(0)} / ${memTotal.toFixed(0)} MB (${(
                    (memUsed / memTotal) * 100
                  ).toFixed(0)}%)`
                : '--'}
            </span>
          </div>
          <div>
            DISK R{'  '}
            <span style={{ color: 'var(--color-accent-500)' }}>
              {diskRead !== null ? `${diskRead.toFixed(0)} KB/s` : '--'}
            </span>
          </div>
          <div>
            DISK W{'  '}
            <span style={{ color: 'var(--color-accent-500)' }}>
              {diskWrite !== null ? `${diskWrite.toFixed(0)} KB/s` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Storage Card */}
      <div
        style={{
          marginTop: '16px',
          background: 'var(--color-base-800)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '4px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          ストレージ
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {drives.length > 0 ? (
            drives.map((drive) => (
              <div key={drive.name}>
                {drive.name}
                {'  '}
                <span style={{ color: 'var(--color-accent-500)' }}>
                  {drive.usedPercent.toFixed(0)}% ({drive.freeGb.toFixed(0)} GB 空き)
                </span>
              </div>
            ))
          ) : (
            <div>
              <span style={{ color: 'var(--color-accent-500)' }}>読み込み中...</span>
            </div>
          )}
        </div>
      </div>

      {/* Hardware Card */}
      <div
        style={{
          marginTop: '16px',
          background: 'var(--color-base-800)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '4px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          ハードウェア
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {hwInfo ? (
            <>
              <div>
                CPU{'     '}
                <span style={{ color: 'var(--color-accent-500)' }}>{hwInfo.cpuName}</span>
              </div>
              {hwInfo.cpuTempC !== null && (
                <div>
                  TEMP{'    '}
                  <span style={{ color: 'var(--color-accent-500)' }}>
                    {hwInfo.cpuTempC.toFixed(1)}°C
                  </span>
                </div>
              )}
              <div>
                GPU{'     '}
                <span
                  style={{
                    color: hwInfo.gpuName ? 'var(--color-accent-500)' : 'var(--color-text-muted)',
                  }}
                >
                  {hwInfo.gpuName ?? 'N/A'}
                </span>
              </div>
              <div>
                VRAM{'    '}
                <span
                  style={{
                    color:
                      hwInfo.gpuVramTotalMb != null
                        ? 'var(--color-accent-500)'
                        : 'var(--color-text-muted)',
                  }}
                >
                  {hwInfo.gpuVramTotalMb != null ? `${hwInfo.gpuVramTotalMb} MB` : 'N/A'}
                </span>
              </div>
            </>
          ) : (
            <div>
              <span style={{ color: 'var(--color-accent-500)' }}>読み込み中...</span>
            </div>
          )}
        </div>
      </div>

      {/* Network Speed Card */}
      <div
        style={{
          marginTop: '16px',
          background: 'var(--color-base-800)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '4px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          ネットワーク
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div>
            DOWN{'    '}
            <span style={{ color: 'var(--color-accent-500)' }}>
              {netRecv !== null ? formatNetSpeed(netRecv) : '--'}
            </span>
          </div>
          <div>
            UP{'      '}
            <span style={{ color: 'var(--color-accent-500)' }}>
              {netSent !== null ? formatNetSpeed(netSent) : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Game Score Placeholder */}
      <div
        style={{
          marginTop: '16px',
          background: 'var(--color-base-800)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: '4px',
          padding: '12px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.1em',
            marginBottom: '8px',
          }}
        >
          ゲームスコア
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-accent-500)',
            letterSpacing: '0.05em',
          }}
        >
          -- / 100
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            marginTop: '4px',
          }}
        >
          パフォーマンス計測 — 近日公開
        </div>
      </div>
      <AiPanel suggestions={suggestions} />
    </div>
  );
}
