import type React from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import type { NexusSettings } from '../../types';
import Button from '../ui/Button';
import ErrorBanner from '../ui/ErrorBanner';

const DNS_OPTIONS = ['system', '8.8.8.8', '1.1.1.1', '9.9.9.9'] as const;

const SettingsView = memo(function SettingsView(): React.ReactElement {
  const { settings, isLoading, isSaving, error, fetchSettings, updateSettings, clearError } =
    useSettingsStore();

  const [form, setForm] = useState<NexusSettings | null>(null);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = useCallback(async () => {
    if (!form) return;
    await updateSettings(form);
  }, [form, updateSettings]);

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto max-w-[600px]">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary leading-none">
        Settings
      </h2>

      {isLoading || !form ? (
        <span className="text-[11px] text-text-muted">読み込み中...</span>
      ) : (
        <div className="flex flex-col gap-6">
          {error && <ErrorBanner message={error} variant="error" onDismiss={clearError} />}

          <SettingGroup label="保護プロセス">
            <textarea
              className="w-full h-24 bg-base-800 border border-border-subtle rounded p-2 text-[11px] text-text-primary resize-none focus:outline-none focus:border-border-active"
              value={form.protected_processes.join('\n')}
              onChange={(e) =>
                setForm({
                  ...form,
                  protected_processes: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="プロセス名（1行に1つ）"
            />
          </SettingGroup>

          <SettingGroup label="DNS">
            <select
              className="w-full bg-base-800 border border-border-subtle rounded p-2 text-[11px] text-text-primary focus:outline-none focus:border-border-active"
              value={form.dns_choice}
              onChange={(e) => setForm({ ...form, dns_choice: e.target.value })}
            >
              {DNS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </SettingGroup>

          <SettingGroup label={`ポーリング間隔: ${form.polling_interval_secs}s`}>
            <input
              type="range"
              min={1}
              max={30}
              value={form.polling_interval_secs}
              onChange={(e) => setForm({ ...form, polling_interval_secs: Number(e.target.value) })}
              className="w-full accent-accent-500"
            />
            <div className="flex justify-between text-[10px] text-text-muted">
              <span>1s</span>
              <span>30s</span>
            </div>
          </SettingGroup>

          <Button variant="primary" loading={isSaving} onClick={() => void handleSave()}>
            保存
          </Button>
        </div>
      )}
    </div>
  );
});

function SettingGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

export default SettingsView;
