import { KleosCanvas } from './canvas/KleosCanvas';

export default function App() {
  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#111111' }}
    >
      <main className="flex-1 relative">
        <KleosCanvas />
      </main>
    </div>
  );
}
