// ─── Suggestion System types (ADR-006) ───────────────────────────────────────

export type SuggestionPriority = 'critical' | 'recommended' | 'info';

export type SuggestionCategory =
  | 'windows_optimization'
  | 'network_optimization'
  | 'process_optimization'
  | 'memory_optimization'
  | 'timer_optimization'
  | 'thermal_warning';

export type SuggestionAction = {
  label: string;
  invokeCommand: string;
  args: Record<string, unknown>;
  isDestructive: boolean;
};

export type Suggestion = {
  id: string;
  priority: SuggestionPriority;
  title: string;
  reason: string;
  impact: string;
  category: SuggestionCategory;
  actions: SuggestionAction[];
  isApplied: boolean;
  canRollback: boolean;
  rollbackAction: SuggestionAction | null;
};
