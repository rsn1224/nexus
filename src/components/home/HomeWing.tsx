import type React from 'react';
import { memo } from 'react';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import ActionRow from './ActionRow';
import HeroSection from './HeroSection';
import TimelineSection from './TimelineSection';

const HomeWing = memo(function HomeWing(): React.ReactElement {
  return (
    <div className="flex flex-col h-full overflow-hidden">
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
