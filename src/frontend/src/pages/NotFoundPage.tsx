import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center py-[80px]">
      <p className="text-[12px] text-[#8f8f8e] uppercase tracking-wider mb-4" style={{ fontFamily: 'var(--font-switzer)' }}>
        404
      </p>
      <h1
        className="text-[64px] font-medium leading-[0.8] tracking-[-0.64px] text-[#292929] mb-6"
        style={{ fontFamily: 'var(--font-switzer)' }}
      >
        Page not found.
      </h1>
      <p className="text-[19px] text-[#6f6f6e] mb-10 max-w-[400px] leading-[1.4]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-[#141414] text-[#ffffff] px-[24px] h-[48px] flex items-center justify-center rounded-[200px] text-[16px] font-medium no-underline hover:bg-[#292929] transition-colors"
        style={{ fontFamily: 'var(--font-switzer)' }}
      >
        Go home
      </Link>
    </div>
  );
}
