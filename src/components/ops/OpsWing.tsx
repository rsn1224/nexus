import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOpsStore } from '../../stores/useOpsStore';
import type { SystemProcess } from '../../types';
import LauncherWing from './LauncherWing';

// ─── Constants ────────────────────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 5_000;
const CPU_WARN_THRESHOLD = 20;
const CPU_DANGER_THRESHOLD = 50;
/** ミリ秒。KILL 確認ボタンの自動リセット時間 */
const KILL_CONFIRM_TIMEOUT_MS = 3_000;

type OpsTab = 'processes' | 'launcher' | 'ai';
type SortKey = 'cpuPercent' | 'memMb';
type SortDir = 'asc' | 'desc';

// ─── CpuBar ───────────────────────────────────────────────────────────────────

function CpuBar({ percent }: { percent: number }): React.ReactElement {
  const clamped = Math.min(percent, 100);
  const color =
    percent >= CPU_DANGER_THRESHOLD
      ? 'var(--color-danger-500)'
      : percent >= CPU_WARN_THRESHOLD
        ? 'var(--color-accent-500)'
        : 'var(--color-cyan-500)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '120px' }}>
      <div
        style={{
          flex: 1,
          height: '4px',
          background: 'var(--color-base-700)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color,
          width: '40px',
          textAlign: 'right',
        }}
      >
        {percent.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── ProcessRow ───────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<'high' | 'normal' | 'idle', string> = {
  high: 'H',
  normal: 'N',
  idle: 'I',
};

function ProcessRow({
  process,
  index,
  pendingKillPid,
  onKillRequest,
  onSetPriority,
}: {
  process: SystemProcess;
  index: number;
  pendingKillPid: number | null;
  onKillRequest: (pid: number) => void;
  onSetPriority: (pid: number, priority: 'high' | 'normal' | 'idle') => void;
}): React.ReactElement {
  const isHighCpu = process.cpuPercent >= CPU_WARN_THRESHOLD;
  const isPendingKill = pendingKillPid === process.pid;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <tr
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          width: '60px',
        }}
      >
        {process.pid}
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: isHighCpu ? 'var(--color-accent-400)' : 'var(--color-text-primary)',
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {process.name}
      </td>
      <td style={{ padding: '5px 12px', width: '180px' }}>
        <CpuBar percent={process.cpuPercent} />
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          textAlign: 'right',
          width: '80px',
        }}
      >
        {process.memMb} MB
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          textAlign: 'right',
          width: '100px',
          whiteSpace: 'nowrap',
        }}
      >
        {process.diskReadKb > 0 || process.diskWriteKb > 0
          ? `r:${process.diskReadKb} w:${process.diskWriteKb}`
          : '—'}
      </td>
      <td style={{ padding: '5px 8px', width: '140px', whiteSpace: 'nowrap' }}>
        {process.canTerminate && (isHovered || isPendingKill) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {(['high', 'normal', 'idle'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSetPriority(process.pid, p)}
                title={`Set priority: ${p}`}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '1px 5px',
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  letterSpacing: '0.05em',
                }}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
            {/* 2-step KILL confirmation */}
            <button
              type="button"
              onClick={() => onKillRequest(process.pid)}
              title={isPendingKill ? 'Click again to confirm kill' : `Kill PID ${process.pid}`}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                padding: '1px 5px',
                background: isPendingKill ? 'var(--color-danger-500)' : 'transparent',
                border: '1px solid var(--color-danger-600)',
                color: isPendingKill ? '#000' : 'var(--color-danger-500)',
                cursor: 'pointer',
                borderRadius: '2px',
                letterSpacing: '0.05em',
                transition: 'all 0.15s ease',
              }}
            >
              {isPendingKill ? 'CONFIRM?' : 'KILL'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── OpsWing ──────────────────────────────────────────────────────────────────

export default function OpsWing(): React.ReactElement {
  const {
    processes,
    suggestions,
    isLoading,
    isSuggestionsLoading,
    error,
    lastUpdated,
    fetchProcesses,
    fetchSuggestions,
    killProcess,
    setProcessPriority,
  } = useOpsStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState<OpsTab>('processes');
  const [pendingKillPid, setPendingKillPid] = useState<number | null>(null);
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('cpuPercent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sortedProcesses = useMemo(() => {
    return [...processes].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return sortDir === 'desc' ? -diff : diff;
    });
  }, [processes, sortKey, sortDir]);

  const handleSortClick = (key: SortKey): void => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIndicator = (key: SortKey): string =>
    sortKey === key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : '';

  useEffect(() => {
    void fetchProcesses();
    intervalRef.current = setInterval(() => void fetchProcesses(), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [fetchProcesses]);

  // Auto-reset pending kill state after timeout
  const handleKillRequest = (pid: number): void => {
    if (pendingKillPid === pid) {
      // Second click — confirmed
      killProcess(pid);
      setPendingKillPid(null);
      if (killTimerRef.current !== null) clearTimeout(killTimerRef.current);
    } else {
      // First click — enter confirm state
      setPendingKillPid(pid);
      if (killTimerRef.current !== null) clearTimeout(killTimerRef.current);
      killTimerRef.current = setTimeout(() => {
        setPendingKillPid(null);
      }, KILL_CONFIRM_TIMEOUT_MS);
    }
  };

  const handleAiSuggest = (): void => {
    void fetchSuggestions();
    setActiveTab('ai');
  };

  const tabStyle = (tab: OpsTab): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    fontWeight: 600,
    padding: '3px 10px',
    background: activeTab === tab ? 'var(--color-accent-500)' : 'transparent',
    color: activeTab === tab ? '#000' : 'var(--color-text-secondary)',
    border: `1px solid ${activeTab === tab ? 'var(--color-accent-500)' : 'var(--color-border-subtle)'}`,
    cursor: 'pointer',
    letterSpacing: '0.08em',
    transition: 'all 0.1s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Title + tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-accent-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ プロセス管理
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('processes')}
              style={tabStyle('processes')}
            >
              PROC
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('launcher')}
              style={tabStyle('launcher')}
            >
              LAUNCH
            </button>
            <button type="button" onClick={() => setActiveTab('ai')} style={tabStyle('ai')}>
              AI
            </button>
          </div>
          {isLoading && activeTab === 'processes' && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-cyan-500)',
              }}
            >
              SCANNING...
            </span>
          )}
        </div>

        {/* Right controls — context-sensitive */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeTab === 'processes' && (
            <>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {lastUpdated ? `LAST: ${new Date(lastUpdated).toLocaleTimeString()}` : '--:--:--'}
              </span>
              <button
                type="button"
                onClick={() => void fetchProcesses()}
                disabled={isLoading}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  padding: '2px 10px',
                  background: 'transparent',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-secondary)',
                  cursor: isLoading ? 'default' : 'pointer',
                  letterSpacing: '0.1em',
                }}
              >
                REFRESH
              </button>
            </>
          )}
          {activeTab === 'ai' && (
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={isSuggestionsLoading}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '2px 10px',
                background: 'transparent',
                border: '1px solid var(--color-cyan-500)',
                color: 'var(--color-cyan-500)',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                borderRadius: '3px',
                opacity: isSuggestionsLoading ? 0.6 : 1,
              }}
            >
              {isSuggestionsLoading ? 'ANALYZING...' : 'AI SUGGEST'}
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (activeTab === 'processes' || activeTab === 'ai') && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid var(--color-danger-600)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-danger-500)',
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* PROCESSES tab */}
      {activeTab === 'processes' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  position: 'sticky',
                  top: 0,
                  background: 'var(--color-base-800)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
              >
                {(['PID', 'NAME', 'CPU', 'MEM', 'DISK', 'ACTIONS'] as const).map((col) => {
                  const sortable = col === 'CPU' || col === 'MEM';
                  const key: SortKey = col === 'CPU' ? 'cpuPercent' : 'memMb';
                  return (
                    <th
                      key={col}
                      onClick={sortable ? () => handleSortClick(key) : undefined}
                      style={{
                        padding: '6px 12px',
                        textAlign: col === 'MEM' || col === 'DISK' ? 'right' : 'left',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: sortable ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                        letterSpacing: '0.12em',
                        cursor: sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      {col}
                      {sortable ? sortIndicator(key) : ''}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedProcesses.map((proc, i) => (
                <ProcessRow
                  key={proc.pid}
                  process={proc}
                  index={i}
                  pendingKillPid={pendingKillPid}
                  onKillRequest={handleKillRequest}
                  onSetPriority={setProcessPriority}
                />
              ))}
            </tbody>
          </table>

          {!isLoading && processes.length === 0 && !error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.1em',
              }}
            >
              NO PROCESSES FOUND
            </div>
          )}
        </div>
      )}

      {/* LAUNCHER tab */}
      {activeTab === 'launcher' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <LauncherWing />
        </div>
      )}

      {/* AI SUGGESTIONS tab */}
      {activeTab === 'ai' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {suggestions.length === 0 && !isSuggestionsLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.1em',
              }}
            >
              PRESS AI SUGGEST TO ANALYZE PROCESSES
            </div>
          )}
          {isSuggestionsLoading && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '120px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-cyan-500)',
                letterSpacing: '0.1em',
              }}
            >
              ANALYZING PROCESSES...
            </div>
          )}
          {suggestions.map((suggestion, idx) => (
            <div
              key={suggestion.substring(0, 20)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-primary)',
                marginBottom: '10px',
                paddingLeft: '16px',
                position: 'relative',
                lineHeight: 1.6,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '0',
                  color: 'var(--color-cyan-500)',
                  fontWeight: 700,
                }}
              >
                {idx + 1}.
              </span>
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
