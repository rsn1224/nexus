import type React from 'react';
import { useSecurityStore } from '../../stores/useSecurityStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'var(--color-danger-500)';
    case 'high':
      return 'var(--color-accent-500)';
    case 'moderate':
      return 'var(--color-accent-400)';
    case 'low':
      return 'var(--color-text-muted)';
    default:
      return 'var(--color-text-primary)';
  }
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString('ja-JP');
}

// ─── ScanCard (empty state) ───────────────────────────────────────────────────

function ScanCard({
  title,
  description,
  isLoading,
  onScan,
  buttonLabel,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  onScan: () => void;
  buttonLabel: string;
}): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '40px 24px',
        flex: 1,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          letterSpacing: '0.12em',
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-muted)',
          letterSpacing: '0.08em',
        }}
      >
        {description}
      </span>
      <button
        type="button"
        onClick={onScan}
        disabled={isLoading}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          padding: '5px 16px',
          background: isLoading ? 'var(--color-base-700)' : 'var(--color-accent-500)',
          border: 'none',
          color: isLoading ? 'var(--color-text-muted)' : '#000',
          cursor: isLoading ? 'default' : 'pointer',
          letterSpacing: '0.1em',
          fontWeight: 600,
          marginTop: '4px',
        }}
      >
        {isLoading ? 'SCANNING...' : buttonLabel}
      </button>
    </div>
  );
}

// ─── SecurityWing ─────────────────────────────────────────────────────────────

export default function SecurityWing(): React.ReactElement {
  const {
    vulnerabilityReport,
    secretReport,
    isVulnLoading,
    isSecretLoading,
    error,
    runVulnerabilityScan,
    runSecretScan,
  } = useSecurityStore();

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
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-cyan-500)',
            letterSpacing: '0.15em',
          }}
        >
          ▶ SECURITY
        </span>
        {/* Re-scan buttons — visible only when data already exists */}
        {(vulnerabilityReport || secretReport) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={runVulnerabilityScan}
              disabled={isVulnLoading}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '2px 10px',
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: isVulnLoading ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                cursor: isVulnLoading ? 'default' : 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              {isVulnLoading ? 'SCANNING...' : 'RESCAN VULNS'}
            </button>
            <button
              type="button"
              onClick={runSecretScan}
              disabled={isSecretLoading}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '2px 10px',
                background: 'transparent',
                border: '1px solid var(--color-border-subtle)',
                color: isSecretLoading ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
                cursor: isSecretLoading ? 'default' : 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              {isSecretLoading ? 'SCANNING...' : 'RESCAN SECRETS'}
            </button>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(239,68,68,0.1)',
            borderBottom: '1px solid var(--color-danger-600)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--color-danger-500)',
            flexShrink: 0,
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* Two panels */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Vulnerability panel */}
        <div
          style={{
            flex: 1,
            borderRight: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--color-border-subtle)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.12em',
              }}
            >
              VULNERABILITY SCAN
              {vulnerabilityReport && (
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                  ({vulnerabilityReport.summary.total})
                </span>
              )}
            </span>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {vulnerabilityReport ? (
              <div style={{ padding: '16px' }}>
                {/* Summary grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {(
                    [
                      { label: 'CRITICAL', key: 'critical', color: 'var(--color-danger-500)' },
                      { label: 'HIGH', key: 'high', color: 'var(--color-accent-500)' },
                      { label: 'MODERATE', key: 'moderate', color: 'var(--color-accent-400)' },
                      { label: 'LOW', key: 'low', color: 'var(--color-text-muted)' },
                    ] as const
                  ).map(({ label, key, color }) => (
                    <div
                      key={key}
                      style={{
                        padding: '8px',
                        background: 'var(--color-base-800)',
                        border: `1px solid ${color}33`,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: 'var(--color-text-muted)',
                          letterSpacing: '0.1em',
                          marginBottom: '4px',
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '18px',
                          fontWeight: 700,
                          color,
                        }}
                      >
                        {vulnerabilityReport.summary[key]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* npm vulnerabilities */}
                {vulnerabilityReport.npm.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        letterSpacing: '0.1em',
                        marginBottom: '6px',
                      }}
                    >
                      npm ({vulnerabilityReport.npm.length})
                    </div>
                    {vulnerabilityReport.npm.map((vuln) => (
                      <div
                        key={`npm-${vuln.name}`}
                        style={{
                          padding: '6px 8px',
                          marginBottom: '4px',
                          background: 'var(--color-base-800)',
                          borderLeft: `3px solid ${getSeverityColor(vuln.severity)}`,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--color-text-primary)',
                            marginBottom: '2px',
                          }}
                        >
                          {vuln.name}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <span style={{ color: getSeverityColor(vuln.severity) }}>
                            {vuln.severity.toUpperCase()}
                          </span>
                          {vuln.fixAvailable && (
                            <span style={{ color: 'var(--color-success-500)', marginLeft: '8px' }}>
                              ✓ FIX AVAILABLE
                            </span>
                          )}
                          {vuln.via.length > 0 && (
                            <span style={{ marginLeft: '8px' }}>{vuln.via.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* cargo vulnerabilities */}
                {vulnerabilityReport.cargo.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                        letterSpacing: '0.1em',
                        marginBottom: '6px',
                      }}
                    >
                      cargo ({vulnerabilityReport.cargo.length})
                    </div>
                    {vulnerabilityReport.cargo.map((vuln) => (
                      <div
                        key={`cargo-${vuln.advisoryId}`}
                        style={{
                          padding: '6px 8px',
                          marginBottom: '4px',
                          background: 'var(--color-base-800)',
                          borderLeft: `3px solid ${getSeverityColor(vuln.severity)}`,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            color: 'var(--color-text-primary)',
                            marginBottom: '2px',
                          }}
                        >
                          {vuln.package}@{vuln.version}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '9px',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          <span style={{ color: getSeverityColor(vuln.severity) }}>
                            {vuln.severity.toUpperCase()}
                          </span>
                          <span style={{ marginLeft: '8px' }}>{vuln.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {vulnerabilityReport.npm.length === 0 && vulnerabilityReport.cargo.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-success-500)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ✓ NO VULNERABILITIES FOUND
                  </div>
                )}

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--color-text-muted)',
                    marginTop: '12px',
                    textAlign: 'right',
                  }}
                >
                  {formatDate(vulnerabilityReport.scannedAt)}
                </div>
              </div>
            ) : (
              <ScanCard
                title="VULNERABILITY SCAN"
                description="deps / CVE check"
                isLoading={isVulnLoading}
                onScan={runVulnerabilityScan}
                buttonLabel="SCAN VULNS"
              />
            )}
          </div>
        </div>

        {/* Secret scan panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid var(--color-border-subtle)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.12em',
              }}
            >
              SECRET SCAN
              {secretReport && (
                <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                  ({secretReport.summary.total})
                </span>
              )}
            </span>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {secretReport ? (
              <div style={{ padding: '16px' }}>
                {/* Summary */}
                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    padding: '12px 16px',
                    background: 'var(--color-base-800)',
                    border: `1px solid ${secretReport.summary.total > 0 ? 'rgba(249,115,22,0.3)' : 'var(--color-border-subtle)'}`,
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--color-text-muted)',
                        letterSpacing: '0.1em',
                        marginBottom: '4px',
                      }}
                    >
                      SECRETS
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '20px',
                        fontWeight: 700,
                        color:
                          secretReport.summary.total > 0
                            ? 'var(--color-accent-500)'
                            : 'var(--color-success-500)',
                      }}
                    >
                      {secretReport.summary.total}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--color-text-muted)',
                        letterSpacing: '0.1em',
                        marginBottom: '4px',
                      }}
                    >
                      FILES
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '20px',
                        fontWeight: 700,
                        color:
                          secretReport.summary.filesAffected > 0
                            ? 'var(--color-accent-500)'
                            : 'var(--color-success-500)',
                      }}
                    >
                      {secretReport.summary.filesAffected}
                    </div>
                  </div>
                </div>

                {/* Detected secrets */}
                {secretReport.secrets.map((secret) => (
                  <div
                    key={`secret-${secret.file}-${secret.line}`}
                    style={{
                      padding: '8px',
                      marginBottom: '6px',
                      background: 'rgba(239,68,68,0.06)',
                      borderLeft: '3px solid var(--color-danger-500)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--color-text-primary)',
                          fontWeight: 600,
                        }}
                      >
                        {secret.file}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '9px',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        L{secret.line}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: 'var(--color-text-muted)',
                        marginBottom: '4px',
                      }}
                    >
                      {secret.patternName}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        background: 'var(--color-base-800)',
                        padding: '3px 6px',
                        wordBreak: 'break-all',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {secret.preview}
                    </div>
                  </div>
                ))}

                {secretReport.secrets.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '24px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-success-500)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ✓ NO SECRETS DETECTED
                  </div>
                )}

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: 'var(--color-text-muted)',
                    marginTop: '12px',
                    textAlign: 'right',
                  }}
                >
                  {formatDate(secretReport.scannedAt)}
                </div>
              </div>
            ) : (
              <ScanCard
                title="SECRET SCAN"
                description="env / key exposure"
                isLoading={isSecretLoading}
                onScan={runSecretScan}
                buttonLabel="SCAN SECRETS"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
