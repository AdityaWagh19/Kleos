import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 h-[60px] flex items-center justify-between px-6 mx-auto max-w-[1200px] w-full transition-colors duration-200 bg-transparent"
         style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(237,237,232,0.85)' }}>
      <Link to="/" className="text-[16px] font-medium text-[#292929] no-underline tracking-tight">Kleos</Link>
      
      <div className="hidden md:flex items-center gap-[24px]">
        <Link to="/docs" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Docs</Link>
        <Link to="/research" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Research</Link>
        <Link to="/contact" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Contact</Link>
      </div>
      
      <div className="flex items-center gap-[12px]">
        <a href="/api/auth/login/google" className="text-[14px] text-[#353535] hover:text-[#141414] bg-transparent border-none cursor-pointer no-underline font-medium">
          Log in
        </a>
        <Link to="/workspace" className="bg-[#141414] text-[#ffffff] px-4 py-2 rounded-full text-[14px] no-underline hover:bg-[#292929] transition-colors">
          Open Workspace
        </Link>
      </div>
    </nav>
  );
}
