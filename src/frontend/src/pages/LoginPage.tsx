import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-linen-canvas)' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#141414] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-linen-canvas)' }}
    >
      {/* Back to home */}
      <a
        href="/"
        className="absolute top-6 left-6 text-[14px] text-[#6f6f6e] hover:text-[#292929] no-underline transition-colors flex items-center gap-1.5"
        style={{ fontFamily: 'var(--font-switzer)' }}
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        Home
      </a>

      {/* Card */}
      <div
        className="w-full max-w-[400px] rounded-[12px] border border-[#0000001f] p-[40px]"
        style={{ backgroundColor: 'var(--color-frosted-white)' }}
      >
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1
            className="text-[22px] font-medium text-[#292929] tracking-tight mb-1"
            style={{ fontFamily: 'var(--font-switzer)', fontWeight: 500 }}
          >
            Kleos
          </h1>
          <p className="text-[14px] text-[#6f6f6e] leading-relaxed">
            Sign in to access your workspaces
          </p>
        </div>

        {/* Google OAuth button */}
        <a
          href="/api/auth/login/google"
          className="flex items-center justify-center gap-3 w-full h-[48px] rounded-[200px] border border-[#0000001f] text-[15px] font-medium text-[#292929] no-underline hover:bg-[#edede8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#141414] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          style={{ fontFamily: 'var(--font-switzer)' }}
        >
          {/* Google icon SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-center text-[12px] text-[#8f8f8e] mt-5 leading-relaxed">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
