import React, { useState } from 'react';
import { Mail, Lock, UserPlus, Sparkles, User } from 'lucide-react';
import { User as UserType } from '../types';

interface SignupProps {
  onLoginSuccess: (user: UserType) => void;
  setTab: (tab: string) => void;
}

export default function Signup({ onLoginSuccess, setTab }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      // Automatically login the newly registered user
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginResponse.json();
      onLoginSuccess(loginData.user);
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-6 bg-[#0A0C10] relative">
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-[#FF3B3B]/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#111318] border border-brand-border rounded-xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-1.5 bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 px-2.5 py-1 rounded-full text-[11px] text-[#4F8EF7] font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join StrikeAI</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight">
            Create an Account
          </h2>
          <p className="text-xs text-brand-muted mt-1.5">
            Arm your sales arsenal with predictive intelligence.
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
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-brand-muted" />
              <input
                id="signup_name_input"
                type="text"
                required
                placeholder="Ravi Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-3.5 pl-11 pr-4 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-brand-muted uppercase tracking-wider mb-1.5">
              Email Address / ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-brand-muted" />
              <input
                id="signup_email_input"
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
                id="signup_password_input"
                type="password"
                required
                placeholder="Create a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-3.5 pl-11 pr-4 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <button
            id="signup_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/95 text-white py-3.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Creating Account...' : 'Sign Up Free'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-brand-muted">
          Already have an account? <button onClick={() => setTab('login')} className="text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer">Log in here</button>
        </div>
      </div>
    </div>
  );
}
