import type React from 'react';
import { memo } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import ActionRow from './ActionRow';
import HeroSection from './HeroSection';
import TimelineSection from './TimelineSection';

const HomeWing = memo(function HomeWing(): React.ReactElement {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-[10px] border-b border-border-subtle shrink-0 flex items-center">
        <span className="font-mono text-[11px] font-bold text-accent-500 tracking-[0.15em]">
          ▶ HOME / OVERVIEW
        </span>
      </div>
      <ErrorBoundary>
        <HeroSection />
      </ErrorBoundary>
      <ErrorBoundary>
        <ActionRow />
      </ErrorBoundary>
      <ErrorBoundary>
        <TimelineSection />
      </ErrorBoundary>
    </div>
  );
});

export default HomeWing;
