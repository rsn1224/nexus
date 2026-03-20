import type React from 'react';
import { memo } from 'react';
import type { WingId } from '../../types';
import BottomTabBar from './BottomTabBar';
import Sidebar from './Sidebar';
import TitleBar from './TitleBar';

interface ShellProps {
  activeWing: WingId;
  onWingChange: (wing: WingId) => void;
  children: React.ReactNode;
}

const Shell = memo(function Shell({
  activeWing,
  onWingChange,
  children,
}: ShellProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-[#030305]">
      <TitleBar />
      <Sidebar activeWing={activeWing} onWingChange={onWingChange} />
      <main className="md:ml-64 pt-20 pb-24 md:pb-10 px-4 md:px-10 min-h-screen">{children}</main>
      <BottomTabBar activeWing={activeWing} onWingChange={onWingChange} />
    </div>
  );
});

export default Shell;
