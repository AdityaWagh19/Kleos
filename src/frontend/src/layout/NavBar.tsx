import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

const NAV_LINKS = [
  { to: '/docs', label: 'Docs' },
  { to: '/research', label: 'Research' },
  { to: '/contact', label: 'Contact' },
];

export default function NavBar() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav
        className="h-[60px] flex items-center px-6 w-full"
        style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(237,237,232,0.9)' }}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between w-full">
          {/* Logo */}
          <Link
            to="/"
            className="text-[16px] font-medium text-[#292929] no-underline tracking-tight shrink-0"
            style={{ fontFamily: 'var(--font-switzer)', fontWeight: 500 }}
          >
            Kleos
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-[14px] no-underline transition-colors ${
                  isActive(to)
                    ? 'text-[#141414] font-medium'
                    : 'text-[#353535] hover:text-[#141414]'
                }`}
                style={{ fontFamily: 'var(--font-switzer)' }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-[80px] h-[36px] rounded-[200px] bg-[#dbdbd2] animate-pulse" />
            ) : user ? (
              <Link
                to="/dashboard"
                className="hidden md:flex bg-[#141414] text-[#ffffff] px-[18px] h-[44px] items-center justify-center rounded-[200px] text-[14px] font-medium no-underline hover:bg-[#292929] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2"
                style={{ fontFamily: 'var(--font-switzer)' }}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden md:block text-[14px] text-[#353535] hover:text-[#141414] no-underline font-medium transition-colors"
                  style={{ fontFamily: 'var(--font-switzer)' }}
                >
                  Log in
                </Link>
                <Link
                  to="/login"
                  className="bg-[#141414] text-[#ffffff] px-[18px] h-[44px] flex items-center justify-center rounded-[200px] text-[14px] font-medium no-underline hover:bg-[#292929] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2"
                  style={{ fontFamily: 'var(--font-switzer)' }}
                >
                  Get started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] rounded-[6px]"
            >
              <span className={`block w-5 h-[1.5px] bg-[#292929] transition-all ${mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[#292929] transition-all ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-[1.5px] bg-[#292929] transition-all ${mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-[60px] left-0 right-0 z-40 border-b border-[#0000001f] py-4 px-6 flex flex-col gap-3"
          style={{ backgroundColor: 'var(--color-linen-canvas)' }}
        >
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-[16px] py-1.5 no-underline transition-colors ${
                isActive(to) ? 'text-[#141414] font-medium' : 'text-[#353535]'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#0000001f] flex flex-col gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="text-[16px] text-[#141414] font-medium no-underline"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-[16px] text-[#353535] no-underline">Log in</Link>
                <Link
                  to="/login"
                  className="bg-[#141414] text-white h-[44px] flex items-center justify-center rounded-[200px] text-[15px] font-medium no-underline text-center"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
