import type React from 'react';
import type { ChangeEvent } from 'react';
import { Input } from '../ui';

interface LogFiltersProps {
  selectedLevel: string;
  selectedSource: string;
  searchQuery: string;
  uniqueSources: string[];
  onLevelChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onSourceChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function LogFilters({
  selectedLevel,
  selectedSource,
  searchQuery,
  uniqueSources,
  onLevelChange,
  onSourceChange,
  onSearchChange,
}: LogFiltersProps): React.ReactElement {
  return (
    <div className="flex gap-2 mb-4">
      <select
        value={selectedLevel}
        onChange={onLevelChange}
        className="font-[var(--font-mono)] text-xs bg-[var(--color-base-800)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] px-2 py-1 rounded"
      >
        <option value="All">All Levels</option>
        <option value="Error">Error</option>
        <option value="Warn">Warn</option>
        <option value="Info">Info</option>
        <option value="Debug">Debug</option>
      </select>

      <select
        value={selectedSource}
        onChange={onSourceChange}
        className="font-[var(--font-mono)] text-xs bg-[var(--color-base-800)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] px-2 py-1 rounded"
      >
        <option value="">All Sources</option>
        {uniqueSources.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>

      <Input
        type="text"
        placeholder="Search logs..."
        value={searchQuery}
        onChange={(value) => onSearchChange({ target: { value } } as ChangeEvent<HTMLInputElement>)}
        size="sm"
        className="flex-1"
      />
    </div>
  );
}
