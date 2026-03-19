export type SuggestionLevel = 'ok' | 'info' | 'warn' | 'critical';

export interface LocalSuggestion {
  id: string;
  level: SuggestionLevel;
  message: string;
}

export const LEVEL_ORDER: SuggestionLevel[] = ['critical', 'warn', 'info', 'ok'];

export function sortAndSlice(suggestions: LocalSuggestion[], max = 3): LocalSuggestion[] {
  return suggestions
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level))
    .slice(0, max);
}
