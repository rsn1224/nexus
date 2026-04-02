import type React from 'react';
import { memo } from 'react';
import type { QuickPanel } from '../../stores/useUiStore';
import { useUiStore } from '../../stores/useUiStore';

interface ActionButtonProps {
  label: string;
  sub?: string;
  active?: boolean;
  onClick: () => void;
}

function ActionButton({
  label,
  sub,
  active = false,
  onClick,
}: ActionButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded border',
        'text-[10px] font-semibold tracking-widest uppercase transition-colors cursor-pointer',
        active
          ? 'border-(--c-border) bg-(--c-bg2) text-(--c)'
          : 'border-border-subtle text-text-muted hover:border-accent-500 hover:text-accent-500',
      ].join(' ')}
    >
      <span>{label}</span>
      {sub && <span className="text-[9px] normal-case tracking-normal font-normal">{sub}</span>}
    </button>
  );
}

const PANEL_BUTTONS: { panel: QuickPanel; label: string; sub: string }[] = [
  { panel: 'game', label: 'GAME', sub: 'Mode & Profile' },
  { panel: 'display', label: 'DISPLAY', sub: 'Screen & FPS' },
  { panel: 'security', label: 'WINDOWS', sub: 'Visual & FX' },
  { panel: 'modules', label: 'MEMORY', sub: 'Cleanup' },
];

const ActionStrip = memo(function ActionStrip(): React.ReactElement {
  const { activeTab, setActiveTab, activeQuickPanel, setActiveQuickPanel } = useUiStore();

  const handleBoost = () => setActiveTab('boost');

  const handlePanel = (panel: QuickPanel) => {
    setActiveQuickPanel(activeQuickPanel === panel ? null : panel);
  };

  return (
    <section aria-label="Quick Actions" className="flex gap-1.5">
      {/* Boost タブへのショートカット */}
      <ActionButton
        label="⚡ BOOST"
        sub="Presets"
        active={activeTab === 'boost'}
        onClick={handleBoost}
      />

      {/* Quick Panels */}
      {PANEL_BUTTONS.map(({ panel, label, sub }) => (
        <ActionButton
          key={panel}
          label={label}
          sub={sub}
          active={activeQuickPanel === panel}
          onClick={() => handlePanel(panel)}
        />
      ))}
    </section>
  );
});

export default ActionStrip;
