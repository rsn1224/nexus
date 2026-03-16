import type React from 'react';
import { useState } from 'react';
import { useBoostStore } from '../../stores/useBoostStore';

export default function BoostWing(): React.ReactElement {
  const { lastResult, isRunning, error, runBoost } = useBoostStore();
  const [threshold, setThreshold] = useState(15);
  const handleRunBoost = async () => {
    await runBoost(threshold);
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.15em',
          }}
        >
          ▶ BOOST / OPTIMIZER
        </div>
        <button
          type="button"
          onClick={handleRunBoost}
          disabled={isRunning}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '4px 12px',
            background: isRunning ? 'var(--color-base-600)' : 'var(--color-accent-500)',
            color: isRunning ? 'var(--color-text-muted)' : 'var(--color-base-900)',
            border: 'none',
            borderRadius: '3px',
            cursor: isRunning ? 'default' : 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          {isRunning ? 'RUNNING...' : '[▶ RUN BOOST]'}
        </button>
      </div>

      {/* Threshold Input */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label
          htmlFor="threshold-input"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.05em',
          }}
        >
          THRESHOLD:
        </label>
        <input
          id="threshold-input"
          type="number"
          min={1}
          max={99}
          value={threshold}
          onChange={(e) =>
            setThreshold(Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 15)))
          }
          placeholder="15"
          style={{
            width: '48px',
            padding: '4px 6px',
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            borderRadius: '2px',
            textAlign: 'center',
          }}
        />
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
            letterSpacing: '0.05em',
          }}
        >
          %
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            borderBottom: '1px solid var(--color-danger-600)',
            background: 'var(--color-base-800)',
            padding: '8px 12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-danger-500)',
            }}
          >
            ERROR: {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!lastResult && !isRunning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            READY — PRESS RUN BOOST TO OPTIMIZE
          </div>
        )}

        {isRunning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            RUNNING...
          </div>
        )}

        {lastResult && !isRunning && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Summary */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-success-500)',
                letterSpacing: '0.05em',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              BOOST COMPLETE · {lastResult.actions.length} ACTIONS ·{' '}
              {formatDuration(lastResult.durationMs)}
            </div>

            {/* Results Table */}
            {lastResult.actions.length > 0 ? (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    display: 'flex',
                    gap: '16px',
                    paddingBottom: '4px',
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div style={{ flex: 1 }}>PROCESS</div>
                  <div style={{ width: '80px' }}>ACTION</div>
                  <div style={{ width: '100px' }}>STATUS</div>
                </div>

                {lastResult.actions.map((action) => (
                  <div
                    key={action.label}
                    style={{
                      display: 'flex',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <div style={{ flex: 1 }}>{action.label}</div>
                    <div style={{ width: '80px' }}>
                      {action.actionType === 'set_priority' ? 'SET IDLE' : 'SKIPPED'}
                    </div>
                    <div
                      style={{
                        width: '100px',
                        color: action.success
                          ? 'var(--color-success-500)'
                          : 'var(--color-danger-500)',
                      }}
                    >
                      {action.success ? '✓ OK' : `✗ ${action.detail}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}
              >
                NO PROCESSES ABOVE THRESHOLD — SYSTEM IS CLEAN
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
