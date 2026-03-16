import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLauncherStore } from '../../stores/useLauncherStore';
import type { LogLevel } from '../../stores/useLogStore';
import { useLogStore } from '../../stores/useLogStore';
import { usePulseStore } from '../../stores/usePulseStore';
import { POLL_INTERVAL_OPTIONS, useSettingsStore } from '../../stores/useSettingsStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = 'settings' | 'log';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOG_LEVEL_COLOR: Record<LogLevel, string> = {
  debug: 'var(--color-text-muted)',
  info: 'var(--color-text-muted)',
  warn: 'var(--color-accent-500)',
  error: 'var(--color-danger-500)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: SettingsTab;
  onChange: (t: SettingsTab) => void;
}): React.ReactElement {
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'settings', label: '設定' },
    { id: 'log', label: 'ログ' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--color-border-subtle)',
        marginBottom: '16px',
      }}
    >
      {tabs.map(({ id, label }) => (
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
              active === id ? '2px solid var(--color-cyan-500)' : '2px solid transparent',
            color: active === id ? 'var(--color-cyan-500)' : 'var(--color-text-muted)',
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

function SectionTitle({ children }: { children: string }): React.ReactElement {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        fontWeight: 700,
        color: 'var(--color-text-secondary)',
        letterSpacing: '0.1em',
        marginBottom: '8px',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function SettingsTabContent(): React.ReactElement {
  const pollIntervalMs = useSettingsStore((s) => s.pollIntervalMs);
  const perplexityApiKey = useSettingsStore((s) => s.perplexityApiKey);
  const setPollInterval = useSettingsStore((s) => s.setPollInterval);
  const setPerplexityApiKey = useSettingsStore((s) => s.setPerplexityApiKey);
  const isPolling = usePulseStore((s) => s.isPolling);
  const startPolling = usePulseStore((s) => s.startPolling);
  const stopPolling = usePulseStore((s) => s.stopPolling);
  const autoBoostEnabled = useLauncherStore((s) => s.autoBoostEnabled);
  const toggleAutoBoost = useLauncherStore((s) => s.toggleAutoBoost);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const handlePollChange = (ms: number): void => {
    setPollInterval(ms);
    // Zustand の set() は同期的なので、stopPolling → startPolling で新しい値が確実に反映される
    if (isPolling) {
      stopPolling();
      startPolling();
    }
  };

  const handleSaveApiKey = (): void => {
    setPerplexityApiKey(apiKeyInput);
    setApiKeyInput('');
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── ポーリング間隔 ── */}
      <div>
        <SectionTitle>ポーリング間隔</SectionTitle>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          {POLL_INTERVAL_OPTIONS.map((opt) => {
            const active = pollIntervalMs === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePollChange(opt.value)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  padding: '4px 10px',
                  background: active ? 'var(--color-cyan-500)' : 'transparent',
                  color: active ? 'var(--color-base-900)' : 'var(--color-text-muted)',
                  border: `1px solid ${active ? 'var(--color-cyan-500)' : 'var(--color-border-subtle)'}`,
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          ※ 変更後は監視を自動的に再起動します
        </div>
      </div>

      {/* ── Perplexity API キー ── */}
      <div>
        <SectionTitle>Perplexity API キー</SectionTitle>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder={perplexityApiKey ? '\u25cf\u25cf\u25cf\u25cf\u25cf（設定済み）' : '未設定'}
            style={{
              flex: 1,
              padding: '4px 8px',
              background: 'var(--color-base-800)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: '3px',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          />
          <button
            type="button"
            onClick={handleSaveApiKey}
            disabled={!apiKeyInput}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '4px 12px',
              background: apiKeyInput ? 'var(--color-accent-500)' : 'var(--color-base-600)',
              color: apiKeyInput ? 'var(--color-base-900)' : 'var(--color-text-muted)',
              border: 'none',
              borderRadius: '3px',
              cursor: apiKeyInput ? 'pointer' : 'default',
              letterSpacing: '0.05em',
            }}
          >
            {keySaved ? '\u2713 保存済み' : '保存'}
          </button>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-muted)',
          }}
        >
          {perplexityApiKey ? '\u2713 API キー設定済み' : '※ 未設定の場合 AI 提案は表示されません'}
        </div>
      </div>

      {/* ── AUTO BOOST トグル ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-primary)',
              letterSpacing: '0.08em',
            }}
          >
            AUTO BOOST ON LAUNCH
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
            }}
          >
            ゲーム起動時に自動でプロセス最適化を実行します
          </div>
        </div>
        <button
          type="button"
          onClick={toggleAutoBoost}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '2px 10px',
            background: autoBoostEnabled ? 'var(--color-accent-500)' : 'transparent',
            color: autoBoostEnabled ? 'var(--color-base-900)' : 'var(--color-text-secondary)',
            border: `1px solid ${
              autoBoostEnabled ? 'var(--color-accent-500)' : 'var(--color-border-subtle)'
            }`,
            cursor: 'pointer',
            letterSpacing: '0.1em',
            transition: 'all 0.1s ease',
          }}
        >
          {autoBoostEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* ── AUTO BOOST トグル ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-primary)',
              letterSpacing: '0.08em',
            }}
          >
            AUTO BOOST ON LAUNCH
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'var(--color-text-muted)',
              marginTop: '2px',
            }}
          >
            ゲーム起動時に自動でプロセス最適化を実行します
          </div>
        </div>
        <button
          type="button"
          onClick={toggleAutoBoost}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '2px 10px',
            background: autoBoostEnabled ? 'var(--color-accent-500)' : 'transparent',
            color: autoBoostEnabled ? 'var(--color-base-900)' : 'var(--color-text-secondary)',
            border: `1px solid ${
              autoBoostEnabled ? 'var(--color-accent-500)' : 'var(--color-border-subtle)'
            }`,
            cursor: 'pointer',
            letterSpacing: '0.1em',
            transition: 'all 0.1s ease',
          }}
        >
          {autoBoostEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}

function LogTabContent(): React.ReactElement {
  const entries = useLogStore((s) => s.entries);
  const clear = useLogStore((s) => s.clear);
  const logBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button
          type="button"
          onClick={clear}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '3px 10px',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          クリア
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
        {entries.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', padding: '16px 0' }}>ログなし</div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                gap: '8px',
                padding: '2px 0',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {new Date(entry.timestamp).toLocaleTimeString('ja-JP', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span
                style={{
                  flexShrink: 0,
                  textTransform: 'uppercase',
                  width: '36px',
                  color: LOG_LEVEL_COLOR[entry.level],
                }}
              >
                {entry.level}
              </span>
              <span
                style={{
                  color: 'var(--color-text-secondary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {entry.message}
              </span>
            </div>
          ))
        )}
        <div ref={logBottomRef} />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function SettingsWing(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<SettingsTab>('settings');

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        \u25b6 設定
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflowY: activeTab === 'settings' ? 'auto' : 'hidden',
        }}
      >
        {activeTab === 'settings' && <SettingsTabContent />}
        {activeTab === 'log' && <LogTabContent />}
      </div>
    </div>
  );
}
