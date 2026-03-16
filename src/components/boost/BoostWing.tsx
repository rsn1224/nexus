import type React from 'react';
import { useEffect, useState } from 'react';
import { useBoostStore } from '../../stores/useBoostStore';
import { useWinoptStore } from '../../stores/useWinoptStore';
import type { WinSetting } from '../../types';

type BoostTab = 'process' | 'windows' | 'network';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TAB_LABELS: { id: BoostTab; label: string }[] = [
  { id: 'process', label: 'プロセス最適化' },
  { id: 'windows', label: 'Windows設定' },
  { id: 'network', label: 'ネット最適化' },
];

function TabBar({
  active,
  onChange,
}: {
  active: BoostTab;
  onChange: (t: BoostTab) => void;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--color-border-subtle)',
        marginBottom: '16px',
      }}
    >
      {TAB_LABELS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            padding: '6px 14px',
            background: 'transparent',
            border: 'none',
            borderBottom:
              active === id
                ? '2px solid var(--color-cyan-500)'
                : '2px solid transparent',
            color:
              active === id
                ? 'var(--color-cyan-500)'
                : 'var(--color-text-muted)',
            cursor: 'pointer',
            marginBottom: '-1px',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({
  setting,
  activeId,
  onApply,
  onRevert,
}: {
  setting: WinSetting;
  activeId: string | null;
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
}): React.ReactElement {
  const isActive = activeId === setting.id;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          flexShrink: 0,
          background: setting.isOptimized
            ? 'var(--color-cyan-500)'
            : 'var(--color-text-muted)',
          border: setting.isOptimized
            ? 'none'
            : '1px solid var(--color-text-muted)',
        }}
      />
      {/* Label + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-primary)',
            letterSpacing: '0.04em',
          }}
        >
          {setting.label}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
            marginTop: '2px',
          }}
        >
          {setting.description}
        </div>
      </div>
      {/* Action button */}
      {!setting.isOptimized ? (
        <button
          type="button"
          disabled={isActive}
          onClick={() => onApply(setting.id)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '3px 10px',
            background: isActive ? 'var(--color-base-600)' : 'var(--color-accent-500)',
            color: isActive ? 'var(--color-text-muted)' : 'var(--color-base-900)',
            border: 'none',
            borderRadius: '2px',
            cursor: isActive ? 'default' : 'pointer',
            flexShrink: 0,
            letterSpacing: '0.05em',
          }}
        >
          {isActive ? 'RUNNING...' : '▶ 適用'}
        </button>
      ) : setting.canRevert ? (
        <button
          type="button"
          disabled={isActive}
          onClick={() => onRevert(setting.id)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '3px 10px',
            background: 'transparent',
            color: isActive ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '2px',
            cursor: isActive ? 'default' : 'pointer',
            flexShrink: 0,
            letterSpacing: '0.05em',
          }}
        >
          {isActive ? 'RUNNING...' : '↩ 元に戻す'}
        </button>
      ) : (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
            width: '60px',
            textAlign: 'center',
          }}
        >
          -
        </div>
      )}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }): React.ReactElement {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--color-danger-600)',
        background: 'var(--color-base-800)',
        padding: '8px 12px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-danger-500)',
        }}
      >
        ERROR: {message}
      </div>
    </div>
  );
}

// ─── Tab: Process ─────────────────────────────────────────────────────────────

function ProcessTab(): React.ReactElement {
  const { lastResult, isRunning, error, runBoost } = useBoostStore();
  const [threshold, setThreshold] = useState(15);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-secondary)',
            }}
          >
            %
          </span>
        </div>
        <button
          type="button"
          onClick={() => runBoost(threshold)}
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

      {error && <ErrorBanner message={error} />}

      <div style={{ flex: 1, minHeight: 0 }}>
        {!lastResult && !isRunning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '180px',
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
              height: '180px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            RUNNING...
          </div>
        )}
        {lastResult && !isRunning && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
            {lastResult.actions.length > 0 ? (
              <div style={{ overflowY: 'auto' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.1em',
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
                  height: '180px',
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

// ─── Tab: Windows Settings ────────────────────────────────────────────────────

function WindowsTab(): React.ReactElement {
  const {
    winSettings,
    isLoading,
    error,
    activeId,
    fetchWinSettings,
    applyWin,
    revertWin,
  } = useWinoptStore();

  useEffect(() => {
    void fetchWinSettings();
  }, [fetchWinSettings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {error && <ErrorBanner message={error} />}
      {isLoading && winSettings.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '180px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          LOADING...
        </div>
      ) : (
        <div style={{ overflowY: 'auto' }}>
          {winSettings.map((s) => (
            <SettingRow
              key={s.id}
              setting={s}
              activeId={activeId}
              onApply={applyWin}
              onRevert={revertWin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Network Optimization ────────────────────────────────────────────────

function NetworkTab(): React.ReactElement {
  const {
    netSettings,
    isLoading,
    error,
    activeId,
    flushDnsResult,
    fetchNetSettings,
    applyNet,
    revertNet,
    flushDns,
  } = useWinoptStore();

  useEffect(() => {
    void fetchNetSettings();
  }, [fetchNetSettings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {error && <ErrorBanner message={error} />}

      {/* DNS Flush — single-shot action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '12px',
          marginBottom: '12px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <button
          type="button"
          disabled={activeId === 'flush_dns'}
          onClick={() => flushDns()}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '4px 12px',
            background:
              activeId === 'flush_dns' ? 'var(--color-base-600)' : 'var(--color-accent-500)',
            color:
              activeId === 'flush_dns' ? 'var(--color-text-muted)' : 'var(--color-base-900)',
            border: 'none',
            borderRadius: '2px',
            cursor: activeId === 'flush_dns' ? 'default' : 'pointer',
            flexShrink: 0,
            letterSpacing: '0.05em',
          }}
        >
          {activeId === 'flush_dns' ? 'RUNNING...' : '▶ DNSキャッシュをクリア'}
        </button>
        {flushDnsResult && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--color-success-500)',
              letterSpacing: '0.04em',
            }}
          >
            {flushDnsResult}
          </div>
        )}
      </div>

      {isLoading && netSettings.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '140px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          LOADING...
        </div>
      ) : (
        <div style={{ overflowY: 'auto' }}>
          {netSettings.map((s) => (
            <SettingRow
              key={s.id}
              setting={s}
              activeId={activeId}
              onApply={applyNet}
              onRevert={revertNet}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function BoostWing(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<BoostTab>('process');

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-cyan-500)',
          letterSpacing: '0.15em',
          marginBottom: '12px',
        }}
      >
        ▶ 最適化
      </div>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'process' && <ProcessTab />}
        {activeTab === 'windows' && <WindowsTab />}
        {activeTab === 'network' && <NetworkTab />}
      </div>
    </div>
  );
}
