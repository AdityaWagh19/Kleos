import React, { useState } from 'react';
import NavBar from '../../layout/NavBar';
import Footer from '../../layout/Footer';

interface ComingSoonProps {
  title: string;
  description: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#ededed] flex flex-col font-mono selection:bg-[#333] selection:text-white">
      <NavBar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-[#333] bg-[#111] text-xs text-[#a0a0a0]">
            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            In Development
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-normal tracking-tight">
            {title}
          </h1>
          
          <p className="text-[#a0a0a0] text-lg max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
          
          <div className="pt-8 border-t border-[#222] max-w-md mx-auto">
            {submitted ? (
              <div className="bg-[#111] border border-[#333] rounded-lg p-4 text-sm text-green-400">
                Thanks for subscribing! We'll notify you when this is ready.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email for updates..."
                  className="flex-1 bg-[#111] border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#555] transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#ededed] text-[#0a0a0a] px-6 py-3 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  Notify Me
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
