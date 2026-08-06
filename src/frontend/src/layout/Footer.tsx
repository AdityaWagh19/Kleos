import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#dbdbd2] py-[60px] px-6 mt-[80px]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[48px]">
        <div>
          <h3 className="text-[16px] font-medium text-[#292929] mb-2">Kleos</h3>
          <p className="text-[14px] text-[#6f6f6e]">Post-chat AI for structured thinking.</p>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-[12px] text-[#8f8f8e] uppercase tracking-wider mb-2">Site</h4>
          <Link to="/" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Landing</Link>
          <Link to="/workspace" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Workspace</Link>
          <Link to="/docs" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Docs</Link>
          <Link to="/research" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Research</Link>
          <Link to="/contact" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Contact</Link>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="text-[12px] text-[#8f8f8e] uppercase tracking-wider mb-2">Project</h4>
          <a href="#" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">GitHub</a>
          <a href="#" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">Hackathon brief</a>
          <a href="#" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline">ACM SIGCHI</a>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto mt-[48px] pt-6 border-t border-[#c0c0c0]">
        <p className="text-[12px] text-[#8f8f8e]">Built for IIIT Pune × IIT Bombay ACM SIGCHI · 2026</p>
      </div>
    </footer>
  );
}
