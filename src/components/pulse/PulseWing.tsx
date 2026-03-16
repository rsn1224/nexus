import type React from 'react';
import { useEffect, useMemo } from 'react';
import { usePulseStore } from '../../stores/usePulseStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRAPH_HEIGHT = 60;

// ─── Helper Components ───────────────────────────────────────────────────────────

function ResourceBar({
  label,
  current,
  max,
  unit,
  color,
}: {
  label: string;
  current: number;
  max: number;
  unit: string;
  color: string;
}): React.ReactElement {
  const percentage = max > 0 ? (current / max) * 100 : 0;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          marginBottom: '4px',
        }}
      >
        <span>{label}</span>
        <span>
          {current.toFixed(1)}
          {unit} / {max.toFixed(1)}
          {unit}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--color-base-800)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function MiniGraph({
  data,
  color,
  label,
  unit,
  fixedMin,
  fixedMax,
}: {
  data: number[];
  color: string;
  label: string;
  unit: string;
  fixedMin?: number;
  fixedMax?: number;
}): React.ReactElement {
  if (data.length === 0) {
    return <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No data</div>;
  }

  const min = fixedMin !== undefined ? fixedMin : Math.min(...data, 0);
  const max = fixedMax !== undefined ? fixedMax : Math.max(...data, 1);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = data.length > 1 ? (index / (data.length - 1)) * 300 : 150;
      const y = GRAPH_HEIGHT - ((value - min) / range) * GRAPH_HEIGHT;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          marginBottom: '4px',
        }}
      >
        {label} ({unit})
      </div>
      <svg
        viewBox={`0 0 300 ${GRAPH_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${GRAPH_HEIGHT}px`, display: 'block' }}
        aria-label={`${label} graph`}
      >
        <title>{label} Time Series</title>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
        {data.map((value, index) => {
          const x = data.length > 1 ? (index / (data.length - 1)) * 300 : 150;
          const y = GRAPH_HEIGHT - ((value - min) / range) * GRAPH_HEIGHT;
          const id = `point-${index}-${value.toFixed(2)}`;
          return <circle key={id} cx={x} cy={y} r="1" fill={color} />;
        })}
      </svg>
    </div>
  );
}

// ─── PulseWing Component ─────────────────────────────────────────────────────────

export default function PulseWing(): React.ReactElement {
  const { snapshots, isPolling, error, startPolling, stopPolling } = usePulseStore();

  useEffect(() => {
    // 自動で監視を開始
    startPolling();
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  const latestSnapshot = useMemo(() => {
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }, [snapshots]);

  const graphData = useMemo(() => {
    return {
      cpu: snapshots.map((s) => s.cpuPercent),
      memory: snapshots.map((s) => s.memUsedMb),
      diskRead: snapshots.map((s) => s.diskReadKb),
      diskWrite: snapshots.map((s) => s.diskWriteKb),
      cpuTemp: snapshots.map((s) => s.cpuTempC ?? 0),
    };
  }, [snapshots]);

  const hasTempData = useMemo(() => snapshots.some((s) => s.cpuTempC !== null), [snapshots]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-cyan-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ システム監視
          </span>
          {isPolling && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-cyan-500)',
              }}
            >
              MONITORING
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={isPolling ? stopPolling : startPolling}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '2px 10px',
            background: 'transparent',
            border: `1px solid ${isPolling ? 'var(--color-danger-500)' : 'var(--color-cyan-500)'}`,
            color: isPolling ? 'var(--color-danger-500)' : 'var(--color-cyan-500)',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          {isPolling ? 'STOP' : 'START'}
        </button>
      </div>

      {error && (
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

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {!isPolling && snapshots.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                letterSpacing: '0.1em',
              }}
            >
              NO DATA — START MONITORING
            </span>
            <button
              type="button"
              onClick={startPolling}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '4px 16px',
                background: 'var(--color-cyan-500)',
                border: 'none',
                color: 'var(--color-base-900)',
                cursor: 'pointer',
                letterSpacing: '0.12em',
                fontWeight: 600,
              }}
            >
              START
            </button>
          </div>
        )}

        {latestSnapshot && (
          <>
            {/* Current Values */}
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  marginBottom: '12px',
                  letterSpacing: '0.1em',
                }}
              >
                CURRENT VALUES
              </h3>

              <ResourceBar
                label="CPU"
                current={latestSnapshot.cpuPercent}
                max={100}
                unit="%"
                color="var(--color-cyan-500)"
              />

              <ResourceBar
                label="MEMORY"
                current={latestSnapshot.memUsedMb}
                max={latestSnapshot.memTotalMb}
                unit="MB"
                color="var(--color-accent-500)"
              />

              {latestSnapshot.cpuTempC !== null && (
                <div style={{ marginBottom: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--color-text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    <span>CPU TEMP</span>
                    <span
                      style={{
                        color:
                          latestSnapshot.cpuTempC >= 90
                            ? 'var(--color-danger-500)'
                            : latestSnapshot.cpuTempC >= 75
                              ? 'var(--color-accent-500)'
                              : 'var(--color-cyan-500)',
                      }}
                    >
                      {latestSnapshot.cpuTempC.toFixed(1)}℃
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Graphs */}
            {snapshots.length > 1 && (
              <div>
                <h3
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    marginBottom: '12px',
                    letterSpacing: '0.1em',
                  }}
                >
                  TIME SERIES (LAST {snapshots.length} SAMPLES)
                </h3>

                <MiniGraph
                  data={graphData.cpu}
                  color="var(--color-cyan-500)"
                  label="CPU"
                  unit="%"
                />

                <MiniGraph
                  data={graphData.memory}
                  color="var(--color-accent-500)"
                  label="MEMORY"
                  unit="MB"
                  fixedMin={0}
                  fixedMax={latestSnapshot?.memTotalMb}
                />

                <MiniGraph
                  data={graphData.diskRead}
                  color="var(--color-accent-500)"
                  label="DISK READ"
                  unit="KB"
                />

                <MiniGraph
                  data={graphData.diskWrite}
                  color="var(--color-danger-500)"
                  label="DISK WRITE"
                  unit="KB"
                />

                {hasTempData && (
                  <MiniGraph
                    data={graphData.cpuTemp}
                    color="var(--color-danger-500)"
                    label="CPU TEMP"
                    unit="℃"
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
