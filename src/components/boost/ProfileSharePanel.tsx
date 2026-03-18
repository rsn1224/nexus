import type React from 'react';
import { useState } from 'react';
import { useGameProfileActions } from '../../stores/useGameProfileStore';
import type { GameProfile } from '../../types';
import { Modal } from '../ui';

// ─── Export Modal ─────────────────────────────────────────────────────────────

function ExportModal({ json, onClose }: { json: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Modal isOpen title="EXPORT PROFILE" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="font-(--font-mono) text-[10px] text-text-muted tracking-[0.08em]">
          COPY THE JSON BELOW AND SHARE IT WITH OTHER USERS.
          <br />
          EXE PATH AND PLAY STATISTICS ARE NOT INCLUDED.
        </p>
        <textarea
          aria-label="Export profile JSON"
          readOnly
          value={json}
          rows={12}
          className="w-full px-2 py-1 font-(--font-mono) text-[10px] bg-base-700 border border-border-subtle text-text-secondary resize-none outline-none"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleCopy}
            className={`px-4 py-[5px] font-(--font-mono) text-[10px] border tracking-widest transition-colors ${
              copied
                ? 'border-success-500 text-success-500'
                : 'border-(--color-accent-500) text-(--color-accent-500) hover:bg-(--color-accent-500) hover:text-base-900'
            }`}
          >
            {copied ? 'COPIED!' : 'COPY TO CLIPBOARD'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-[5px] font-(--font-mono) text-[10px] border border-border-subtle text-text-muted hover:bg-base-700 transition-colors tracking-widest"
          >
            CLOSE
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({
  onImport,
  onClose,
}: {
  onImport: (json: string) => Promise<void>;
  onClose: () => void;
}) {
  const [json, setJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleImport = async () => {
    if (!json.trim()) return;
    setIsImporting(true);
    setImportError(null);
    try {
      await onImport(json.trim());
      onClose();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'インポートに失敗しました');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal isOpen title="IMPORT PROFILE" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="font-(--font-mono) text-[10px] text-text-muted tracking-[0.08em]">
          PASTE A SHARED PROFILE JSON BELOW.
          <br />
          THE EXE PATH WILL BE EMPTY — CONFIGURE IT AFTER IMPORT.
        </p>
        <textarea
          aria-label="Import profile JSON"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={12}
          placeholder='{"version":1,"displayName":"..."}'
          className="w-full px-2 py-1 font-(--font-mono) text-[10px] bg-base-700 border border-border-subtle text-text-secondary resize-none outline-none placeholder:text-text-muted"
        />
        {importError && (
          <div className="font-(--font-mono) text-[10px] text-danger-500">ERROR: {importError}</div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={!json.trim() || isImporting}
            className={`px-4 py-[5px] font-(--font-mono) text-[10px] border tracking-widest transition-colors ${
              !json.trim() || isImporting
                ? 'border-border-subtle text-text-muted cursor-not-allowed'
                : 'bg-(--color-accent-500) text-base-900 border-(--color-accent-500) hover:bg-accent-600 cursor-pointer'
            }`}
          >
            {isImporting ? 'IMPORTING...' : 'IMPORT'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-[5px] font-(--font-mono) text-[10px] border border-border-subtle text-text-muted hover:bg-base-700 transition-colors tracking-widest"
          >
            CANCEL
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── ProfileSharePanel ────────────────────────────────────────────────────────

interface ProfileSharePanelProps {
  selectedProfile: GameProfile | null;
}

const ProfileSharePanel: React.FC<ProfileSharePanelProps> = ({ selectedProfile }) => {
  const { exportProfile, importProfile } = useGameProfileActions();
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedProfile) return;
    setIsExporting(true);
    const json = await exportProfile(selectedProfile.id);
    setIsExporting(false);
    if (json) setExportJson(json);
  };

  const handleImport = async (json: string) => {
    await importProfile(json);
  };

  return (
    <>
      <div className="flex items-center gap-2 pt-2 border-t border-border-subtle mt-1">
        <span className="font-(--font-mono) text-[9px] text-text-muted tracking-widest flex-1">
          PROFILE SHARING
        </span>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={!selectedProfile || isExporting}
          className={`px-3 py-[3px] font-(--font-mono) text-[9px] border tracking-[0.08em] transition-colors ${
            !selectedProfile || isExporting
              ? 'border-border-subtle text-text-muted cursor-not-allowed'
              : 'border-border-subtle text-text-secondary hover:border-(--color-accent-500) hover:text-(--color-accent-500) cursor-pointer'
          }`}
        >
          {isExporting ? 'EXPORTING...' : 'EXPORT JSON'}
        </button>
        <button
          type="button"
          onClick={() => setShowImport(true)}
          className="px-3 py-[3px] font-(--font-mono) text-[9px] border border-border-subtle text-text-secondary hover:border-(--color-accent-500) hover:text-(--color-accent-500) transition-colors tracking-[0.08em]"
        >
          IMPORT JSON
        </button>
      </div>

      {exportJson && <ExportModal json={exportJson} onClose={() => setExportJson(null)} />}
      {showImport && <ImportModal onImport={handleImport} onClose={() => setShowImport(false)} />}
    </>
  );
};

export default ProfileSharePanel;
