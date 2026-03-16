import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useVaultStore } from '../../stores/useVaultStore';
import type { VaultEntry } from '../../types';

const DELETE_CONFIRM_TIMEOUT_MS = 3_000;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<VaultEntry['category'], string> = {
  password: 'PWD',
  api_key: 'KEY',
  note: 'NOTE',
  config: 'CFG',
  totp: 'TOTP',
};

const CATEGORY_COLORS: Record<VaultEntry['category'], string> = {
  password: 'var(--color-accent-500)',
  api_key: 'var(--color-cyan-500)',
  note: 'var(--color-text-secondary)',
  config: 'var(--color-text-muted)',
  totp: 'var(--color-success-500)',
};

// ─── LockScreen ───────────────────────────────────────────────────────────────

function LockScreen(): React.ReactElement {
  const { unlock, error } = useVaultStore();
  const [pw, setPw] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsChecking(true);
    await unlock(pw);
    setIsChecking(false);
    setPw('');
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '28px 32px',
          border: '1px solid var(--color-accent-500)',
          background: 'var(--color-base-800)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--color-accent-500)',
            letterSpacing: '0.15em',
          }}
        >
          ▶ VAULT / LOCKED
        </span>
        <form
          onSubmit={submit}
          style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}
        >
          <input
            type="password"
            placeholder="master password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '6px 10px',
              background: 'var(--color-base-700)',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-primary)',
              outline: 'none',
              letterSpacing: '0.1em',
            }}
          />
          {error && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-danger-500)',
              }}
            >
              {error}
            </span>
          )}
          <button
            type="submit"
            disabled={isChecking || pw.length === 0}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '5px',
              background: 'transparent',
              border: '1px solid var(--color-accent-500)',
              color: 'var(--color-accent-500)',
              cursor: isChecking ? 'default' : 'pointer',
              letterSpacing: '0.12em',
            }}
          >
            {isChecking ? 'VERIFYING...' : 'UNLOCK'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ChangePasswordForm ───────────────────────────────────────────────────────────

function ChangePasswordForm({ onClose }: { onClose: () => void }): React.ReactElement {
  const { changePassword } = useVaultStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setIsChanging(true);
    setFormError(null);
    const success = await changePassword(currentPassword, newPassword);
    if (!success) {
      setFormError('現在のパスワードが正しくありません');
    } else {
      onClose();
    }
    setIsChanging(false);
  };

  const fieldStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '5px 8px',
    background: 'var(--color-base-700)',
    border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    flex: 1,
    boxSizing: 'border-box',
  };

  return (
    <form
      onSubmit={submit}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: 'rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            minWidth: '80px',
          }}
        >
          現在のPW:
        </span>
        <input
          type="password"
          style={fieldStyle}
          placeholder="現在のパスワード"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isChanging}
        />
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-text-muted)',
            minWidth: '80px',
          }}
        >
          新しいPW:
        </span>
        <input
          type="password"
          style={fieldStyle}
          placeholder="新しいパスワード"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isChanging}
        />
      </div>

      {formError && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--color-danger-500)',
          }}
        >
          {formError}
        </span>
      )}

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={!currentPassword || !newPassword || isChanging}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '3px 10px',
            background: 'transparent',
            border: '1px solid var(--color-accent-500)',
            color: 'var(--color-accent-500)',
            cursor: !currentPassword || !newPassword || isChanging ? 'default' : 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          {isChanging ? 'CHANGING...' : 'SAVE'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isChanging}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '3px 10px',
            background: 'transparent',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
            cursor: isChanging ? 'default' : 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ─── AddEntryForm ─────────────────────────────────────────────────────────────

function AddEntryForm({ onClose }: { onClose: () => void }): React.ReactElement {
  const { saveEntry } = useVaultStore();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<VaultEntry['category']>('password');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!label || !secret) return;
    await saveEntry('', label, category, username, url, secret);
    onClose();
  };

  const fieldStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    padding: '5px 8px',
    background: 'var(--color-base-700)',
    border: '1px solid var(--color-border-subtle)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <form
      onSubmit={submit}
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          style={{ ...fieldStyle, flex: 2 }}
          placeholder="label *"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select
          aria-label="category"
          style={{ ...fieldStyle, flex: 1 }}
          value={category}
          onChange={(e) => setCategory(e.target.value as VaultEntry['category'])}
        >
          <option value="password">password</option>
          <option value="api_key">api_key</option>
          <option value="note">note</option>
          <option value="config">config</option>
        </select>
      </div>
      <input
        style={fieldStyle}
        placeholder="username / email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        style={fieldStyle}
        placeholder="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        type="password"
        style={fieldStyle}
        placeholder="secret *"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          type="submit"
          disabled={!label || !secret}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '3px 10px',
            background: 'transparent',
            border: '1px solid var(--color-accent-500)',
            color: 'var(--color-accent-500)',
            cursor: !label || !secret ? 'default' : 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          SAVE
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            padding: '3px 10px',
            background: 'transparent',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            letterSpacing: '0.1em',
          }}
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

// ─── EntryRow ─────────────────────────────────────────────────────────────────

function EntryRow({
  entry,
  index,
  pendingDeleteId,
  onDeleteRequest,
}: {
  entry: VaultEntry;
  index: number;
  pendingDeleteId: string | null;
  onDeleteRequest: (id: string) => void;
}): React.ReactElement {
  const [showSecret, setShowSecret] = useState(false);
  const isPending = pendingDeleteId === entry.id;

  return (
    <tr
      style={{
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <td style={{ padding: '5px 12px', width: '50px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '1px 5px',
            border: `1px solid ${CATEGORY_COLORS[entry.category as VaultEntry['category']] ?? 'var(--color-text-muted)'}`,
            color:
              CATEGORY_COLORS[entry.category as VaultEntry['category']] ??
              'var(--color-text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          {CATEGORY_LABELS[entry.category as VaultEntry['category']] ?? entry.category}
        </span>
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-primary)',
        }}
      >
        {entry.label}
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-text-muted)',
        }}
      >
        {entry.username || '—'}
      </td>
      <td style={{ padding: '5px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              letterSpacing: showSecret ? 'normal' : '0.15em',
            }}
          >
            {showSecret ? entry.secret : '••••••••'}
          </span>
          <button
            type="button"
            onClick={() => setShowSecret((s) => !s)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              padding: '1px 5px',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {showSecret ? 'HIDE' : 'SHOW'}
          </button>
        </div>
      </td>
      <td style={{ padding: '5px 12px', width: '60px' }}>
        <button
          type="button"
          onClick={() => onDeleteRequest(entry.id)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '1px 5px',
            background: isPending ? 'var(--color-danger-500)' : 'transparent',
            border: '1px solid var(--color-danger-600)',
            color: isPending ? '#000' : 'var(--color-danger-500)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.15s ease',
          }}
        >
          {isPending ? 'DEL?' : 'DEL'}
        </button>
      </td>
    </tr>
  );
}

// ─── TotpEntry ───────────────────────────────────────────────────────────────

function TotpEntry({
  entry,
  index,
  pendingDeleteId,
  onDeleteRequest,
}: {
  entry: VaultEntry;
  index: number;
  pendingDeleteId: string | null;
  onDeleteRequest: (id: string) => void;
}): React.ReactElement {
  const isPending = pendingDeleteId === entry.id;
  const { generateTotp, totpResults } = useVaultStore();
  const [copied, setCopied] = useState(false);
  const totpResult = totpResults[entry.id];

  // Generate TOTP code every second
  useEffect(() => {
    if (entry.category === 'totp' && entry.secret) {
      void generateTotp(entry.id, entry.secret);

      const interval = setInterval(() => {
        void generateTotp(entry.id, entry.secret);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [entry.id, entry.secret, entry.category, generateTotp]);

  const copyCode = async (): Promise<void> => {
    if (totpResult) {
      try {
        await navigator.clipboard.writeText(totpResult.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for clipboard API failure
      }
    }
  };

  const progressPercentage = totpResult ? (totpResult.remaining / 30) * 100 : 0;

  return (
    <tr
      style={{
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <td style={{ padding: '5px 12px', width: '50px' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '1px 5px',
            border: `1px solid ${CATEGORY_COLORS.totp}`,
            color: CATEGORY_COLORS.totp,
            letterSpacing: '0.08em',
          }}
        >
          TOTP
        </span>
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-text-primary)',
        }}
      >
        {entry.label}
      </td>
      <td
        style={{
          padding: '5px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
        }}
      >
        {entry.username || '-'}
      </td>
      <td style={{ padding: '5px 12px' }}>
        {totpResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'var(--color-text-primary)',
                  letterSpacing: '0.1em',
                }}
              >
                {totpResult.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '2px 6px',
                  background: copied ? 'var(--color-success-600)' : 'transparent',
                  border: '1px solid var(--color-accent-500)',
                  color: copied ? 'var(--color-text-primary)' : 'var(--color-accent-500)',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  borderRadius: '3px',
                }}
              >
                {copied ? 'COPIED!' : 'COPY'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '60px',
                  height: '4px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-success-500)',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--color-text-muted)',
                }}
              >
                {totpResult.remaining}s
              </span>
            </div>
          </div>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
            }}
          >
            Loading...
          </span>
        )}
      </td>
      <td style={{ padding: '5px 12px', width: '60px' }}>
        <button
          type="button"
          onClick={() => onDeleteRequest(entry.id)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            padding: '1px 5px',
            background: isPending ? 'var(--color-danger-500)' : 'transparent',
            border: '1px solid var(--color-danger-600)',
            color: isPending ? '#000' : 'var(--color-danger-500)',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'all 0.15s ease',
          }}
        >
          {isPending ? 'DEL?' : 'DEL'}
        </button>
      </td>
    </tr>
  );
}

// ─── VaultWing ────────────────────────────────────────────────────────────────

export default function VaultWing(): React.ReactElement {
  const { entries, isUnlocked, isLoading, error, fetchEntries, lock, deleteEntry } =
    useVaultStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDeleteRequest = (id: string): void => {
    if (pendingDeleteId === id) {
      void deleteEntry(id);
      setPendingDeleteId(null);
      if (deleteTimerRef.current !== null) clearTimeout(deleteTimerRef.current);
    } else {
      setPendingDeleteId(id);
      if (deleteTimerRef.current !== null) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(
        () => setPendingDeleteId(null),
        DELETE_CONFIRM_TIMEOUT_MS,
      );
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      void fetchEntries();
    }
  }, [isUnlocked, fetchEntries]);

  if (!isUnlocked) return <LockScreen />;

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
              color: 'var(--color-accent-500)',
              letterSpacing: '0.15em',
            }}
          >
            ▶ VAULT / UNLOCKED
          </span>
          {isLoading && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-cyan-500)',
              }}
            >
              LOADING...
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowChangePassword((s) => !s)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 10px',
              background: 'transparent',
              border: '1px solid var(--color-cyan-500)',
              color: 'var(--color-cyan-500)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {showChangePassword ? 'CANCEL' : 'CHANGE PWD'}
          </button>
          <button
            type="button"
            onClick={() => setShowAdd((s) => !s)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 10px',
              background: 'transparent',
              border: '1px solid var(--color-accent-500)',
              color: 'var(--color-accent-500)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            {showAdd ? 'CANCEL' : '+ ADD'}
          </button>
          <button
            type="button"
            onClick={lock}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              padding: '2px 10px',
              background: 'transparent',
              border: '1px solid var(--color-border-subtle)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            LOCK
          </button>
        </div>
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

      {showAdd && <AddEntryForm onClose={() => setShowAdd(false)} />}
      {showChangePassword && <ChangePasswordForm onClose={() => setShowChangePassword(false)} />}

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
              {(['TYPE', 'LABEL', 'USERNAME', 'SECRET', ''] as const).map((col) => (
                <th
                  key={col}
                  style={{
                    padding: '6px 12px',
                    textAlign: 'left',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.12em',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) =>
              entry.category === 'totp' ? (
                <TotpEntry
                  key={entry.id}
                  entry={entry}
                  index={i}
                  pendingDeleteId={pendingDeleteId}
                  onDeleteRequest={handleDeleteRequest}
                />
              ) : (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  index={i}
                  pendingDeleteId={pendingDeleteId}
                  onDeleteRequest={handleDeleteRequest}
                />
              ),
            )}
          </tbody>
        </table>

        {!isLoading && entries.length === 0 && (
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
            NO ENTRIES — PRESS + ADD
          </div>
        )}
      </div>
    </div>
  );
}
