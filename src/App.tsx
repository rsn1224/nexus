import type React from 'react';
import TitleBar from './components/layout/TitleBar';
import Main from './components/Main';

export default function App(): React.ReactElement {
  return (
    <div className="h-screen bg-base-900 text-text-primary flex flex-col overflow-hidden">
      <TitleBar />
      <Main />
    </div>
  );
}
