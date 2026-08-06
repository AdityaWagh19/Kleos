import { Outlet } from 'react-router-dom';

export default function WorkspaceLayout() {
  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[var(--color-linen-canvas)]">
      <main className="flex-1 relative w-full h-full">
        <Outlet />
      </main>
    </div>
  );
}
