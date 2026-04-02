import type React from 'react';

interface SectionLabelProps {
  label: string;
}

export default function SectionLabel({ label }: SectionLabelProps): React.ReactElement {
  return (
    <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-text-muted">
      {label}
    </span>
  );
}
