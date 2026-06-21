import { useState, useEffect } from 'react';
import { Shield, Sparkles, Navigation, ListTodo, Presentation, Play, Zap, Smile } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  setTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({ currentUser, currentTab, setTab, onLogout }: NavbarProps) {
  return (
    <nav className="border-b border-brand-border bg-[#111318] py-3.5 px-6 sticky top-0 z-[100] backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <button 
          onClick={() => setTab('landing')}
          className="flex items-center space-x-2.5 text-left cursor-pointer hover:opacity-90"
          id="nav_brand_logo"
        >
          <div className="bg-[#4F8EF7]/10 p-1.5 rounded-lg border border-[#4F8EF7]/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-brand-primary" />
          </div>
          <div>
            <span className="font-display font-semibold text-lg tracking-tight text-[#F0F2F5] block">
              Strike<span className="text-brand-primary">AI</span>
            </span>
          </div>
        </button>

        {/* User controls & navigation */}
        {currentUser ? (
          <div className="flex items-center space-x-1 md:space-x-2">
            <button
              id="nav-dashboard"
              onClick={() => setTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer ${
                currentTab === 'dashboard' 
                  ? 'bg-[#4F8EF7]/10 text-brand-primary border border-[#4F8EF7]/25' 
                  : 'text-brand-muted hover:text-[#F0F2F5]'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              id="nav-search"
              onClick={() => setTab('search')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer ${
                currentTab === 'search' 
                  ? 'bg-[#4F8EF7]/10 text-brand-primary border border-[#4F8EF7]/25' 
                  : 'text-brand-muted hover:text-[#F0F2F5]'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Find Leads</span>
            </button>

            <button
              id="nav-strikevision"
              onClick={() => setTab('strikevision')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer transition-all duration-300 shadow-[0_0_10px_rgba(79,142,247,0.15)] ${
                currentTab === 'strikevision' 
                  ? 'bg-[#4F8EF7]/20 text-brand-primary border border-[#4F8EF7]/45 shadow-[0_0_15px_rgba(79,142,247,0.4)]' 
                  : 'text-brand-muted hover:text-[#60A5FA] hover:bg-[#4F8EF7]/5 border border-transparent hover:border-[#4F8EF7]/20 hover:shadow-[0_0_10px_rgba(79,142,247,0.3)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
              <span>⚡ StrikeVision™</span>
            </button>

            <button
              id="nav-psychology"
              onClick={() => setTab('psychology')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer transition-all duration-300 shadow-[0_0_10px_rgba(79,142,247,0.15)] ${
                currentTab === 'psychology' 
                  ? 'bg-[#4F8EF7]/20 text-brand-primary border border-[#4F8EF7]/45 shadow-[0_0_15px_rgba(79,142,247,0.4)]' 
                  : 'text-brand-muted hover:text-[#60A5FA] hover:bg-[#4F8EF7]/5 border border-transparent hover:border-[#4F8EF7]/20 hover:shadow-[0_0_10px_rgba(79,142,247,0.3)]'
              }`}
            >
              <Smile className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
              <span>🧠 Psychology</span>
            </button>

            <button
              id="nav-lists"
              onClick={() => setTab('lists')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer ${
                currentTab === 'lists' 
                  ? 'bg-[#4F8EF7]/10 text-brand-primary border border-[#4F8EF7]/25' 
                  : 'text-brand-muted hover:text-[#F0F2F5]'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>Saved Lists</span>
            </button>

            {currentUser.role === 'admin' && (
              <button
                id="nav-admin"
                onClick={() => setTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all cursor-pointer ${
                  currentTab === 'admin' 
                    ? 'bg-[#FF3B3B]/10 text-brand-red border border-[#FF3B3B]/25' 
                    : 'text-brand-muted hover:text-[#F0F2F5]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-brand-border mx-1 md:mx-2"></div>

            <div className="flex items-center space-x-2 pl-1">
              <div className="text-right hidden sm:block">
                <span className="text-[11px] font-medium block text-brand-primary">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-brand-muted font-mono block -mt-0.5 capitalize">
                  {currentUser.role} Account
                </span>
              </div>
              <button
                id="nav-logout"
                onClick={onLogout}
                className="text-xs text-brand-red/90 hover:text-brand-red bg-[#FF3B3B]/5 hover:bg-[#FF3B3B]/10 border border-[#FF3B3B]/10 px-2.5 py-1.5 rounded-lg cursor-pointer font-medium transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setTab('login')}
              className="text-xs text-brand-muted hover:text-[#F0F2F5] font-medium px-3 py-1.5 cursor-pointer"
            >
              Log In
            </button>
            <button
              onClick={() => setTab('signup')}
              className="text-xs bg-brand-primary text-white font-medium px-4 py-1.5 rounded-lg hover:bg-opacity-90 transition-all cursor-pointer"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
