import React, { useState } from 'react';
import { Mail, Lock, LogIn, Sparkles, UserCheck } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  setTab: (tab: string) => void;
}

export default function Login({ onLoginSuccess, setTab }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcut = async (userEmail: string, pass: string) => {
    setEmail(userEmail);
    setPassword(pass);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password: pass })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 bg-[#0A0C10] relative">
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-[#4F8EF7]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#111318] border border-brand-border rounded-xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 px-2.5 py-1 rounded-full text-[11px] text-[#4F8EF7] font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sales Intelligence Platform</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight">
            Log In to StrikeAI
          </h2>
          <p className="text-xs text-brand-muted mt-1.5">
            Enter your credentials to enter the tactical war room.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 text-brand-red text-xs px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-brand-muted uppercase tracking-wider mb-1.5">
              Email Address / ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-muted" />
              <input
                id="login_email_input"
                type="email"
                required
                placeholder="you@strikeai.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-3.5 pl-11 pr-4 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-brand-muted uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-brand-muted" />
              <input
                id="login_password_input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-3.5 pl-11 pr-4 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <button
            id="login_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white py-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Logging in...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-brand-border">
          <p className="text-center text-xs text-brand-muted mb-4">
            No account yet? <button onClick={() => setTab('signup')} className="text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer">Sign up here</button>
          </p>

          {/* Quick-Access Badges for Demo Sandbox Users */}
          <div className="bg-[#0A0C10] p-4 rounded-lg border border-brand-border">
            <h4 className="text-[10px] font-mono font-bold text-center text-brand-muted uppercase tracking-wider mb-3">
              🎯 DEMO WORKSPACE CREDENTIALS
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="login_fast_demo_btn"
                onClick={() => handleShortcut('demo@strikeai.in', 'Demo@123')}
                disabled={loading}
                className="flex flex-col items-center justify-center bg-[#111318] hover:bg-brand-primary/10 border border-brand-border hover:border-brand-primary/40 p-2.5 rounded-lg cursor-pointer text-center group transition-all"
              >
                <UserCheck className="w-4 h-4 text-brand-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-[#F0F2F5]">Demo Rep</span>
                <span className="text-[9px] text-[#6B7280] font-mono">demo@strikeai.in</span>
              </button>

              <button
                id="login_fast_admin_btn"
                onClick={() => handleShortcut('admin@strikeai.in', 'Strike@Admin123')}
                disabled={loading}
                className="flex flex-col items-center justify-center bg-[#111318] hover:bg-brand-red/10 border border-brand-border hover:border-brand-red/40 p-2.5 rounded-lg cursor-pointer text-center group transition-all"
              >
                <UserCheck className="w-4 h-4 text-brand-red mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold text-[#F0F2F5]">Admin Mode</span>
                <span className="text-[9px] text-[#6B7280] font-mono">admin@strikeai.in</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
