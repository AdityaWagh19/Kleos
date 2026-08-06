import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      className="py-[60px] px-6 mt-[80px] w-full"
      style={{ backgroundColor: 'var(--color-warm-stone)' }}
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-[48px]">
        {/* Brand */}
        <div>
          <h3 className="text-[16px] font-medium text-[#292929] mb-2" style={{ fontFamily: 'var(--font-switzer)' }}>
            Kleos
          </h3>
          <p className="text-[14px] text-[#6f6f6e] leading-relaxed max-w-[220px]">
            Post-chat AI for structured thinking work.
          </p>
        </div>

        {/* Site links */}
        <div className="flex flex-col gap-2">
          <h4
            className="text-[11px] text-[#8f8f8e] uppercase tracking-wider mb-2 font-medium"
            style={{ fontFamily: 'var(--font-switzer)' }}
          >
            Product
          </h4>
          <Link to="/" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline transition-colors">Home</Link>
          <Link to="/dashboard" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline transition-colors">Dashboard</Link>
          <Link to="/docs" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline transition-colors">Docs</Link>
          <Link to="/research" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline transition-colors">Research</Link>
          <Link to="/contact" className="text-[14px] text-[#353535] hover:text-[#141414] no-underline transition-colors">Contact</Link>
        </div>

        {/* Project links */}
        <div className="flex flex-col gap-2">
          <h4
            className="text-[11px] text-[#8f8f8e] uppercase tracking-wider mb-2 font-medium"
            style={{ fontFamily: 'var(--font-switzer)' }}
          >
            Project
          </h4>
          <a
            href="https://github.com/AdityaWagh19/Kleos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[14px] text-[#353535] hover:text-[#141414] no-underline transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[1200px] mx-auto mt-[48px] pt-6 border-t border-[#c0c0c0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-[12px] text-[#8f8f8e]">© 2026 Kleos</p>
        <p className="text-[12px] text-[#8f8f8e]">Built for serious thinking work.</p>
      </div>
    </footer>
  );
}
