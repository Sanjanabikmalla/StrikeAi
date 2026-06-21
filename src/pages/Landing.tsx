import { Sparkles, PhoneCall, Zap, MapPin, Code, ShieldCheck, Mail, Bot, Award, Play } from 'lucide-react';
import { User } from '../types';

interface LandingProps {
  onSelectRole: (role: 'admin' | 'demo') => void;
  setTab: (tab: string) => void;
  currentUser: User | null;
}

export default function Landing({ onSelectRole, setTab, currentUser }: LandingProps) {
  return (
    <div className="bg-[#0A0C10] relative overflow-hidden min-h-screen">
      {/* Visual background ambient details */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#4F8EF7]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#FF3B3B]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero section */}
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-24 text-center relative z-10">

        <h1 className="font-display font-bold text-4xl sm:text-6xl text-[#F0F2F5] tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Know who to call.<br />
          <span className="text-brand-primary">Know what to say.</span><br />
          Win before you dial.
        </h1>

        <p className="text-base sm:text-lg text-brand-muted max-w-2xl mx-auto font-sans font-light leading-relaxed mb-10">
          Every lead tool answers <span className="text-[#F0F2F5] font-medium">"Who should I contact?"</span> StrikeAI answers: 
          {" "}<span className="text-brand-red font-semibold">"If I call this person right now, what are the chances of yes — and exactly what do I say in the first 7 seconds?"</span>
        </p>

        {/* Action Controls / Fast Access Workspace Setup options */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          {currentUser ? (
            <button
              onClick={() => setTab('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-sm font-semibold tracking-wide py-3 px-6 rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Enter Workspace Dashboard</span>
            </button>
          ) : (
            <>
              <button
                id="landing_btn_demo"
                onClick={() => onSelectRole('demo')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-sm font-semibold tracking-wide py-3.5 px-6 rounded-lg shadow-lg cursor-pointer transform hover:-translate-y-0.5 transition-all"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>Enter Demo Workspace</span>
              </button>
              <button
                id="landing_btn_admin"
                onClick={() => onSelectRole('admin')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-[#1E2028] hover:bg-[#2A2D39] text-[#F0F2F5] border border-brand-border text-sm font-semibold py-3.5 px-6 rounded-lg cursor-pointer transform hover:-translate-y-0.5 transition-all"
              >
                <Bot className="w-4 h-4 text-brand-red" />
                <span>Enter Admin Panel</span>
              </button>
            </>
          )}
        </div>

        {/* Feature grid */}
        <h2 className="font-display font-semibold text-2xl sm:text-3xl text-center text-[#F0F2F5] mb-4">
          Why competitors feel defeated
        </h2>
        <p className="text-sm text-brand-muted max-w-md mx-auto mb-12">
          Apollo finds leads. We make you win them. Engineered for elite sales reps.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-24">
          {/* Card 1 */}
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl hover:border-brand-primary/45 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 flex items-center justify-center mb-4">
              <MapPin className="w-5 h-5 text-brand-red" />
            </div>
            <h3 className="font-display font-medium text-base text-[#F0F2F5] mb-2">1. The Pressure Map</h3>
            <p className="text-xs text-brand-muted font-sans leading-relaxed">
              Calculates local competitive density indicators, market lifespan pressure indices, and digital footprints. Displays a living intelligence card with a direct threat sentence.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl hover:border-brand-primary/45 transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center mb-4">
              <PhoneCall className="w-5 h-5 text-brand-primary" />
            </div>
            <h3 className="font-display font-medium text-base text-[#F0F2F5] mb-2">2. Cold Call Co-Pilot</h3>
            <p className="text-xs text-brand-muted font-sans leading-relaxed">
              Provides an AI briefing in your ear in under 30 seconds, lets you conduct live defensive roleplays simulating busy business owners, and evaluates scores.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl hover:border-brand-primary/45 transition-all">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-display font-medium text-base text-[#F0F2F5] mb-2">3. One-Click Outreach</h3>
            <p className="text-xs text-brand-muted font-sans leading-relaxed">
              Generates personalized cold email structures and localized instant WhatsApp message scripts utilizing Gemini models, copyable instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
