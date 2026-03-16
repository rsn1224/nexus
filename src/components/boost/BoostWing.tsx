import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { boostPageSuggestions } from '../../lib/localAi';
import { useBoostStore } from '../../stores/useBoostStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { useWinoptStore } from '../../stores/useWinoptStore';
import AiPanel from '../shared/AiPanel';

export default function BoostWing(): React.ReactElement {
  const { lastResult, isRunning, error, runBoost } = useBoostStore();
  const [threshold, setThreshold] = useState(15);
  const [activeTab, setActiveTab] = useState<'process' | 'windows' | 'network'>('process');

  // Winopt store
  const {
    winSettings,
    netSettings,
    isLoading,
    activeId,
    error: winoptError,
    flushDnsResult,
    fetchWinSettings,
    fetchNetSettings,
    applyWin,
    revertWin,
    applyNet,
    revertNet,
    flushDns,
  } = useWinoptStore();

  // Fetch settings when switching tabs
  useEffect(() => {
    if (activeTab === 'windows') {
      void fetchWinSettings();
    } else if (activeTab === 'network') {
      void fetchNetSettings();
    }
  }, [activeTab, fetchWinSettings, fetchNetSettings]);

  const cpuPercent = usePulseStore((s) =>
    s.snapshots.length > 0 ? (s.snapshots[s.snapshots.length - 1]?.cpuPercent ?? null) : null,
  );

  const boostSuggestions = useMemo(
    () => boostPageSuggestions(winSettings, netSettings, cpuPercent),
    [winSettings, netSettings, cpuPercent],
  );

  const handleRunBoost = async () => {
    await runBoost(threshold);
  };

  const formatDuration = (durationMs: number): string => {
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(1)}s`;
  };

  // Tab component
  const Tab = ({ id, label }: { id: typeof activeTab; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 600,
        padding: '8px 16px',
        background: 'transparent',
        color: activeTab === id ? 'var(--color-accent-500)' : 'var(--color-text-muted)',
        border: 'none',
        borderBottom:
          activeTab === id ? '2px solid var(--color-accent-500)' : '2px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );

  // Error banner
  const ErrorBanner = () => {
    const errorMsg = error || winoptError;
    if (!errorMsg) return null;

    return (
      <div
        style={{
          padding: '8px 16px',
          marginBottom: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderBottom: '1px solid var(--color-danger-600)',
          color: 'var(--color-danger-500)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          borderRadius: '3px',
        }}
      >
        {errorMsg}
      </div>
    );
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
            flexShrink: 0,
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          ▶ 最適化
        </div>
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: 'flex',
          marginBottom: '16px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <Tab id="process" label="プロセス最適化" />
        <Tab id="windows" label="Windows設定" />
        <Tab id="network" label="ネット最適化" />
      </div>

      {/* Error Banner */}
      <ErrorBanner />

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'process' && (
          <div>
            {/* Threshold Input */}
            <div
              style={{
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <label
                htmlFor="threshold-input"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                }}
              >
                CPU閾値 (%):
              </label>
              <input
                id="threshold-input"
                type="number"
                min="1"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                style={{
                  width: '60px',
                  padding: '4px 8px',
                  background: 'var(--color-base-800)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '3px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                }}
              />
            </div>

            {/* Run Boost Button */}
            <button
              type="button"
              onClick={handleRunBoost}
              disabled={isRunning}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '8px 16px',
                marginBottom: '16px',
                background: isRunning ? 'var(--color-base-600)' : 'var(--color-accent-500)',
                color: isRunning ? 'var(--color-text-muted)' : 'var(--color-base-900)',
                border: 'none',
                borderRadius: '3px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {isRunning ? 'RUNNING...' : '▶ RUN BOOST'}
            </button>

            {/* Results Table */}
            {lastResult && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  結果 ({formatDuration(lastResult.durationMs)})
                </div>
                <div
                  style={{
                    background: 'var(--color-base-800)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                    }}
                  >
                    <thead>
                      <tr style={{ background: 'var(--color-base-700)' }}>
                        <th
                          style={{
                            padding: '8px',
                            textAlign: 'left',
                            color: 'var(--color-text-secondary)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          ラベル
                        </th>
                        <th
                          style={{
                            padding: '8px',
                            textAlign: 'left',
                            color: 'var(--color-text-secondary)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          アクション
                        </th>
                        <th
                          style={{
                            padding: '8px',
                            textAlign: 'left',
                            color: 'var(--color-text-secondary)',
                            borderBottom: '1px solid var(--color-border-subtle)',
                          }}
                        >
                          結果
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastResult.actions.map((action) => (
                        <tr key={action.label}>
                          <td
                            style={{
                              padding: '8px',
                              color: action.isProtected
                                ? 'var(--color-text-muted)'
                                : 'var(--color-text-primary)',
                              borderBottom: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {action.label}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              color: action.isProtected
                                ? 'var(--color-text-muted)'
                                : 'var(--color-text-primary)',
                              borderBottom: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            {action.actionType}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderBottom: '1px solid var(--color-border-subtle)',
                            }}
                          >
                            <span
                              style={{
                                color: action.success
                                  ? 'var(--color-success-500)'
                                  : 'var(--color-danger-500)',
                              }}
                            >
                              {action.success ? '✓' : '✗'}
                            </span>
                            {action.isProtected && (
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '9px',
                                  padding: '1px 4px',
                                  border: '1px solid var(--color-text-muted)',
                                  color: 'var(--color-text-muted)',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                PROT
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'windows' && (
          <div>
            {isLoading ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  padding: '32px',
                }}
              >
                読み込み中...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {winSettings.map((setting) => (
                  <div
                    key={setting.id}
                    style={{
                      padding: '12px',
                      background: 'var(--color-base-800)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            color: setting.isOptimized
                              ? 'var(--color-cyan-500)'
                              : 'var(--color-text-muted)',
                            fontSize: '12px',
                          }}
                        >
                          {setting.isOptimized ? '●' : '○'}
                        </span>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {setting.label}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--color-text-secondary)',
                          lineHeight: '1.4',
                        }}
                      >
                        {setting.description}
                      </div>
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                      {setting.isOptimized && setting.canRevert ? (
                        <button
                          type="button"
                          onClick={() => void revertWin(setting.id)}
                          disabled={activeId === setting.id}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            padding: '4px 8px',
                            background: 'var(--color-base-600)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: '3px',
                            cursor: activeId === setting.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {activeId === setting.id ? 'RUNNING...' : '↩ 元に戻す'}
                        </button>
                      ) : setting.isOptimized ? (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--color-text-muted)',
                            padding: '4px 8px',
                          }}
                        >
                          -
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void applyWin(setting.id)}
                          disabled={activeId === setting.id}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            padding: '4px 8px',
                            background:
                              activeId === setting.id
                                ? 'var(--color-base-600)'
                                : 'var(--color-accent-500)',
                            color:
                              activeId === setting.id
                                ? 'var(--color-text-muted)'
                                : 'var(--color-base-900)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: activeId === setting.id ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {activeId === setting.id ? 'RUNNING...' : '▶ 適用'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            {/* DNS Cache Flush Button */}
            <div
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'var(--color-base-800)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => void flushDns()}
                disabled={activeId === 'flush_dns'}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  padding: '6px 12px',
                  background:
                    activeId === 'flush_dns' ? 'var(--color-base-600)' : 'var(--color-accent-500)',
                  color:
                    activeId === 'flush_dns' ? 'var(--color-text-muted)' : 'var(--color-base-900)',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: activeId === 'flush_dns' ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  marginBottom: '8px',
                }}
              >
                {activeId === 'flush_dns' ? 'RUNNING...' : '▶ DNSキャッシュをクリア'}
              </button>
              {flushDnsResult && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  最後の実行結果: {flushDnsResult}
                </div>
              )}
            </div>

            {/* Network Settings */}
            {isLoading ? (
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  padding: '32px',
                }}
              >
                読み込み中...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {netSettings.map((setting) => (
                  <div
                    key={setting.id}
                    style={{
                      padding: '12px',
                      background: 'var(--color-base-800)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            color: setting.isOptimized
                              ? 'var(--color-cyan-500)'
                              : 'var(--color-text-muted)',
                            fontSize: '12px',
                          }}
                        >
                          {setting.isOptimized ? '●' : '○'}
                        </span>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {setting.label}
                        </div>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--color-text-secondary)',
                          lineHeight: '1.4',
                        }}
                      >
                        {setting.description}
                      </div>
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                      {setting.isOptimized && setting.canRevert ? (
                        <button
                          type="button"
                          onClick={() => void revertNet(setting.id)}
                          disabled={activeId === setting.id}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            padding: '4px 8px',
                            background: 'var(--color-base-600)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border-subtle)',
                            borderRadius: '3px',
                            cursor: activeId === setting.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {activeId === setting.id ? 'RUNNING...' : '↩ 元に戻す'}
                        </button>
                      ) : setting.isOptimized ? (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--color-text-muted)',
                            padding: '4px 8px',
                          }}
                        >
                          -
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void applyNet(setting.id)}
                          disabled={activeId === setting.id}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            padding: '4px 8px',
                            background:
                              activeId === setting.id
                                ? 'var(--color-base-600)'
                                : 'var(--color-accent-500)',
                            color:
                              activeId === setting.id
                                ? 'var(--color-text-muted)'
                                : 'var(--color-base-900)',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: activeId === setting.id ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {activeId === setting.id ? 'RUNNING...' : '▶ 適用'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <AiPanel suggestions={boostSuggestions} />
    </div>
  );
}
