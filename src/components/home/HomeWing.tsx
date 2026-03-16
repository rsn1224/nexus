import type React from 'react';
import { useEffect } from 'react';
import { useLauncherStore } from '../../stores/useLauncherStore';
import { useNavStore } from '../../stores/useNavStore';
import { useOpsStore } from '../../stores/useOpsStore';
import { usePulseStore } from '../../stores/usePulseStore';
import type { SystemProcess } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTopCpuProcesses(processes: SystemProcess[], limit: number = 3): SystemProcess[] {
  return [...processes].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, limit);
}

// ─── HomeWing ────────────────────────────────────────────────────────────────

export default function HomeWing(): React.ReactElement {
  // Store data
  const processes = useOpsStore((s) => s.processes);
  const fetchProcesses = useOpsStore((s) => s.fetchProcesses);

  const cpuPercent = usePulseStore(
    (s) =>
      (s.snapshots.length > 0 ? s.snapshots[s.snapshots.length - 1]?.cpuPercent : null) ?? null,
  );
  const memUsed = usePulseStore(
    (s) =>
      (s.snapshots.length > 0
        ? (s.snapshots[s.snapshots.length - 1]?.memUsedMb ?? 0) / 1024
        : null) ?? null,
  );
  const memTotal = usePulseStore(
    (s) =>
      (s.snapshots.length > 0
        ? (s.snapshots[s.snapshots.length - 1]?.memTotalMb ?? 0) / 1024
        : null) ?? null,
  );
  const isPolling = usePulseStore((s) => s.isPolling);
  const startPolling = usePulseStore((s) => s.startPolling);

  const games = useLauncherStore((s) => s.games);
  const navigate = useNavStore((s) => s.navigate);

  useEffect(() => {
    // Auto-fetch data on mount
    void fetchProcesses();
  }, [fetchProcesses]);

  const topProcesses = getTopCpuProcesses(processes);
  const activeProcessCount = processes.filter((p: SystemProcess) => p.cpuPercent > 1).length;

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
          SYSTEM OVERVIEW AND QUICK ACTIONS
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
            OPS / PROCESSES
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              Active: <span style={{ color: 'var(--color-accent-500)' }}>{activeProcessCount}</span>
            </div>
            {topProcesses.length > 0 && (
              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                Top CPU:
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
            PULSE / SYSTEM
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
                  ? `${memUsed.toFixed(1)} / ${memTotal.toFixed(1)} GB`
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
            LAUNCHER / GAMES
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div style={{ marginBottom: '4px' }}>
              Games: <span style={{ color: 'var(--color-accent-500)' }}>{games.length}</span>
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
            QUICK ACTIONS
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
              {isPolling ? '■ MONITORING' : '▶ START MONITORING'}
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
              ⚡ BOOST NOW
            </button>
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
          GAME SCORE
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
          Performance scoring algorithm — COMING SOON
        </div>
      </div>
    </div>
  );
}
