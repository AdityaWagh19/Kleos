import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

function AppNavBar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <nav
      className="sticky top-0 z-50 h-[60px] flex items-center px-6 border-b border-[#0000001f]"
      style={{ backgroundColor: 'var(--color-linen-canvas)' }}
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between w-full">
        <Link
          to="/dashboard"
          className="text-[16px] font-medium text-[#292929] no-underline tracking-tight"
          style={{ fontFamily: 'var(--font-switzer)' }}
        >
          Kleos
        </Link>

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Open profile menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium text-[#ffffff] select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2 focus-visible:ring-offset-[#edede8] transition-opacity hover:opacity-80"
              style={{ backgroundColor: '#141414', borderRadius: 'var(--radius-avatars)' }}
            >
              {initials}
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-[220px] rounded-[12px] border border-[#0000001f] overflow-hidden"
                style={{ backgroundColor: 'var(--color-frosted-white)', boxShadow: 'var(--shadow-glass)', zIndex: 60 }}
              >
                {/* User info header */}
                <div className="px-4 py-3 border-b border-[#0000001f]">
                  <p className="text-[14px] font-medium text-[#292929] truncate leading-snug">
                    {user.name ?? user.email}
                  </p>
                  <p className="text-[12px] text-[#6f6f6e] truncate mt-0.5">{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    to="/dashboard"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#353535] hover:bg-[#edede8] no-underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">dashboard</span>
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#353535] hover:bg-[#edede8] no-underline transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">settings</span>
                    Settings
                  </Link>
                </div>

                <div className="border-t border-[#0000001f] py-1">
                  <button
                    role="menuitem"
                    onClick={() => { setMenuOpen(false); logout(); }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-[#e84040] hover:bg-[#edede8] transition-colors text-left focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default function AppShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-linen-canvas)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin" />
          <p className="text-[14px] text-[#6f6f6e]">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-linen-canvas)' }}>
      <AppNavBar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
