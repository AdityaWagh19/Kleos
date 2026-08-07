import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function WorkspaceLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-[var(--color-linen-canvas)]">
      <main className="flex-1 relative w-full h-full">
        <Outlet />
      </main>
    </div>
  );
}
