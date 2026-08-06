import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#edede8] flex items-center justify-center">
        <p className="text-[14px] text-[#6f6f6e] font-medium tracking-tight">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edede8] flex flex-col items-center justify-center px-6">
      <div className="bg-[#ffffff] rounded-[12px] p-[48px] max-w-[420px] w-full text-center border border-[#0000001f] shadow-sm">
        <h1 className="text-[32px] font-medium text-[#292929] leading-[1.1] mb-2 tracking-[-0.32px]">
          Welcome to Kleos
        </h1>
        <p className="text-[16px] text-[#6f6f6e] mb-8 leading-[1.5]">
          A spatial canvas for complex thinking work. Log in to access your workspaces.
        </p>
        
        <a 
          href="/api/auth/login/google" 
          className="bg-[#141414] text-[#ffffff] h-[48px] rounded-[200px] flex items-center justify-center gap-3 w-full text-[16px] font-medium no-underline hover:bg-[#292929] transition-colors focus:outline-none focus:ring-2 focus:ring-[#000000] focus:ring-offset-2 focus:ring-offset-[#ffffff]"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
          Continue with Google
        </a>
      </div>
    </div>
  );
}
