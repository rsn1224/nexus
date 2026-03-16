import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useScriptStore } from '../../stores/useScriptStore';

// ─── ScriptWing ──────────────────────────────────────────────────────────────

export default function ScriptWing(): React.ReactElement {
  const {
    scripts,
    logs,
    isRunning,
    error,
    fetchScripts,
    addScript,
    deleteScript,
    runScript,
    fetchLogs,
    clearLogs,
  } = useScriptStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingClearLogs, setPendingClearLogs] = useState(false);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    path: '',
    scriptType: 'powershell' as 'powershell' | 'python',
    description: '',
  });

  useEffect(() => {
    void fetchScripts();
    void fetchLogs();
  }, [fetchScripts, fetchLogs]);

  const handleAddScript = async () => {
    if (!formData.name || !formData.path) return;

    await addScript(formData.name, formData.path, formData.scriptType, formData.description);

    setFormData({
      name: '',
      path: '',
      scriptType: 'powershell',
      description: '',
    });
    setShowAddForm(false);
  };

  const handleDeleteScript = async (id: string) => {
    if (pendingDeleteId === id) {
      // Second click - confirmed
      await deleteScript(id);
      setPendingDeleteId(null);
      if (deleteTimerRef.current !== null) {
        clearTimeout(deleteTimerRef.current);
      }
    } else {
      // First click - enter confirm state
      setPendingDeleteId(id);
      deleteTimerRef.current = setTimeout(() => {
        setPendingDeleteId(null);
      }, 3000);
    }
  };

  const handleClearLogs = async () => {
    if (pendingClearLogs) {
      // Second click - confirmed
      await clearLogs();
      setPendingClearLogs(false);
      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }
    } else {
      // First click - enter confirm state
      setPendingClearLogs(true);
      clearTimerRef.current = setTimeout(() => {
        setPendingClearLogs(false);
      }, 3000);
    }
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
          ▶ SCRIPT / AUTOMATION
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={showAddForm}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '4px 12px',
            background: 'transparent',
            color: 'var(--color-cyan-500)',
            border: '1px solid var(--color-cyan-500)',
            borderRadius: '3px',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          {showAddForm ? '[-]' : '[+ ADD]'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div
          style={{
            background: 'var(--color-base-800)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <div>
              <label
                htmlFor="scriptName"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                NAME
              </label>
              <input
                id="scriptName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Script name"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--color-base-800)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  borderRadius: '2px',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="scriptPath"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                PATH
              </label>
              <input
                id="scriptPath"
                type="text"
                value={formData.path}
                onChange={(e) => setFormData((prev) => ({ ...prev, path: e.target.value }))}
                placeholder="C:\\path\\to\\script.ps1"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--color-base-800)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <div>
              <label
                htmlFor="scriptType"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                TYPE
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, scriptType: 'powershell' }))}
                  style={{
                    padding: '4px 8px',
                    background:
                      formData.scriptType === 'powershell'
                        ? 'var(--color-cyan-500)'
                        : 'var(--color-base-700)',
                    color:
                      formData.scriptType === 'powershell'
                        ? 'var(--color-base-900)'
                        : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '2px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  PS
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, scriptType: 'python' }))}
                  style={{
                    padding: '4px 8px',
                    background:
                      formData.scriptType === 'python'
                        ? 'var(--color-accent-500)'
                        : 'var(--color-base-700)',
                    color:
                      formData.scriptType === 'python'
                        ? 'var(--color-base-900)'
                        : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '2px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  PY
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="scriptDescription"
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--color-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                DESCRIPTION
              </label>
              <input
                id="scriptDescription"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Script description"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: 'var(--color-base-800)',
                  border: '1px solid var(--color-border-subtle)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  borderRadius: '2px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleAddScript}
              disabled={!formData.name || !formData.path}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '4px 12px',
                background: 'var(--color-accent-500)',
                color: 'var(--color-base-900)',
                border: 'none',
                borderRadius: '3px',
                cursor: formData.name && formData.path ? 'pointer' : 'default',
                letterSpacing: '0.05em',
              }}
            >
              [SAVE]
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setFormData({
                  name: '',
                  path: '',
                  scriptType: 'powershell',
                  description: '',
                });
              }}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                padding: '4px 12px',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '3px',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              [CANCEL]
            </button>
          </div>
        </div>
      )}

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
      <div style={{ flex: 1, display: 'flex', gap: '16px', minHeight: 0 }}>
        {/* Scripts Panel (Left) */}
        <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              paddingBottom: '4px',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            SCRIPTS
          </div>

          {scripts.length === 0 ? (
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
              NO SCRIPTS
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {scripts.map((script) => (
                <div
                  key={script.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {script.name}
                  </div>
                  <div
                    style={{
                      padding: '2px 6px',
                      marginRight: '8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '9px',
                      borderRadius: '2px',
                      background:
                        script.scriptType === 'powershell'
                          ? 'var(--color-cyan-500)'
                          : 'var(--color-accent-500)',
                      color: 'var(--color-base-900)',
                    }}
                  >
                    {script.scriptType.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => void runScript(script.id)}
                      disabled={isRunning}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        padding: '2px 6px',
                        background: isRunning ? 'var(--color-base-600)' : 'var(--color-accent-500)',
                        color: isRunning ? 'var(--color-text-muted)' : 'var(--color-base-900)',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: isRunning ? 'default' : 'pointer',
                        letterSpacing: '0.05em',
                      }}
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteScript(script.id)}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        padding: '2px 6px',
                        background:
                          pendingDeleteId === script.id ? 'var(--color-danger-500)' : 'transparent',
                        color:
                          pendingDeleteId === script.id
                            ? 'var(--color-base-900)'
                            : 'var(--color-danger-500)',
                        border: '1px solid var(--color-danger-500)',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {pendingDeleteId === script.id ? 'CONFIRM?' : '✕'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Logs Panel (Right) */}
        <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '8px',
              paddingBottom: '4px',
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>SCRIPT</span>
              <span>DURATION</span>
              <span>STATUS</span>
            </div>
            <button
              type="button"
              onClick={handleClearLogs}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                padding: '2px 6px',
                background: pendingClearLogs ? 'var(--color-danger-500)' : 'transparent',
                color: pendingClearLogs ? 'var(--color-base-900)' : 'var(--color-danger-500)',
                border: '1px solid var(--color-danger-500)',
                borderRadius: '3px',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              {pendingClearLogs ? 'CONFIRM?' : '[CLEAR LOGS]'}
            </button>
          </div>

          {logs.length === 0 ? (
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
              NO EXECUTION LOGS
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    padding: '6px 0',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <div style={{ flex: 1 }}>{log.scriptName}</div>
                  <div style={{ width: '80px' }}>{formatDuration(log.durationMs)}</div>
                  <div
                    style={{
                      width: '60px',
                      color:
                        log.exitCode === 0 ? 'var(--color-success-500)' : 'var(--color-danger-500)',
                    }}
                  >
                    {log.exitCode === 0 ? '✓ 0' : `✗ ${log.exitCode}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
