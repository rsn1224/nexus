import TitleBar from './components/layout/TitleBar';

export default function App(): React.ReactElement {
  return (
    <div className="min-h-screen bg-base-900 text-text-primary">
      <TitleBar />
      <main className="pt-8 px-4">
        <p className="text-sm text-text-secondary">NEXUS v4 — coming soon</p>
      </main>
    </div>
  );
}
