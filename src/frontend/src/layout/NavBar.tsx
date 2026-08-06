import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 h-[60px] flex items-center justify-between px-6 mx-auto w-full transition-colors duration-200 bg-transparent"
         style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(237,237,232,0.85)' }}>
      <div className="max-w-[1200px] mx-auto flex items-center justify-between w-full">
        <Link to="/" className="text-[16px] font-medium text-[#292929] no-underline tracking-tight">Kleos</Link>
        
        <div className="hidden md:flex items-center gap-[24px]">
          <Link to="/" className={`text-[14px] no-underline ${isActive('/') ? 'text-[#141414] font-medium' : 'text-[#353535] hover:text-[#141414]'}`}>Home</Link>
          <Link to="/docs" className={`text-[14px] no-underline ${isActive('/docs') ? 'text-[#141414] font-medium' : 'text-[#353535] hover:text-[#141414]'}`}>Docs</Link>
          <Link to="/research" className={`text-[14px] no-underline ${isActive('/research') ? 'text-[#141414] font-medium' : 'text-[#353535] hover:text-[#141414]'}`}>Research</Link>
          <Link to="/contact" className={`text-[14px] no-underline ${isActive('/contact') ? 'text-[#141414] font-medium' : 'text-[#353535] hover:text-[#141414]'}`}>Contact</Link>
        </div>
        
        <div className="flex items-center gap-[12px]">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-[#dbdbd2] animate-pulse"></div>
          ) : user ? (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-[#141414] text-[#ffffff] flex items-center justify-center text-[12px] font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 focus:ring-offset-[#edede8]"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#ffffff] rounded-[12px] border border-[#0000001f] shadow-sm py-2">
                  <div className="px-4 py-2 border-b border-[#0000001f]">
                    <p className="text-[14px] font-medium text-[#292929] truncate">{user.name}</p>
                    <p className="text-[12px] text-[#6f6f6e] truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-[14px] text-[#353535] hover:bg-[#edede8] no-underline">Dashboard</Link>
                  <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-[14px] text-[#e84040] hover:bg-[#edede8] focus:outline-none">Log out</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="text-[14px] text-[#353535] hover:text-[#141414] bg-transparent border-none cursor-pointer no-underline font-medium">
                Log in
              </Link>
              <Link to="/login" className="bg-[#141414] text-[#ffffff] px-[18px] h-[36px] flex items-center justify-center rounded-[200px] text-[14px] no-underline hover:bg-[#292929] transition-colors focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 focus:ring-offset-[#edede8]">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
