import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Activity,
  ShieldAlert,
  Flame,
  Bot,
  Brain,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  MapPin,
  Compass,
  Sliders,
  Send,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Sparkles,
  RefreshCw,
  Trophy,
  ArrowRight,
  Shield
} from 'lucide-react';

interface StrikeVisionProps {
  setTab: (tab: string) => void;
  userId: string;
}

export default function StrikeVision({ setTab, userId }: StrikeVisionProps) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [report, setReport] = useState<any>(null);

  // Future simulator view state ('a' | 'b')
  const [simulatorScenario, setSimulatorScenario] = useState<'a' | 'b'>('b');
  // Digital Twin active comparison state ('current' | 'future')
  const [twinState, setTwinState] = useState<'current' | 'future'>('current');

  // Negotiation Room Modal states
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [decisionMaker, setDecisionMaker] = useState('Owner');
  const [negotiationPhase, setNegotiationPhase] = useState<1 | 2>(1); // 1: Active Roleplay, 2: Scorecard Report
  const [simMode, setSimMode] = useState<'text' | 'voice'>('text');

  // Negotiation Roleplay Messaging
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Simulated Voice Call Status
  const [callStatus, setCallStatus] = useState<'READY' | 'DIALING' | 'RINGING' | 'CONNECTED' | 'DISCONNECTED'>('READY');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  // Negotiation Audit scorecard
  const [auditScorecard, setAuditScorecard] = useState<any>(null);
  const [auditing, setAuditing] = useState(false);
  const [showRewrites, setShowRewrites] = useState(false);

  // Refs for auto scrolling & recognition
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const loadingSteps = [
    "Analyzing digital footprint...",
    "Assessing market position...",
    "Building business DNA...",
    "Generating opportunity model...",
    "Preparing strategy blueprint..."
  ];

  // Speech Recognition browser setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsVoiceListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
        }
      };

      rec.onerror = () => {
        setIsVoiceListening(false);
      };

      rec.onend = () => {
        setIsVoiceListening(false);
      };

      recognitionRef.current = rec;
      setRecognitionSupported(true);
    }
  }, []);

  // Timer loop for voice calls
  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Handle auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    setLoaderStep(0);
    setReport(null);

    // Loader interval progression
    const interval = setInterval(() => {
      setLoaderStep(prev => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);

    try {
      const res = await fetch('/api/ai/strikevision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });
      const data = await res.json();
      
      // Ensure the loading transition is visible for at least 3 seconds for theatrical value
      await new Promise((resolve) => setTimeout(resolve, 3100));
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  // Sound oscillator feedback for realistic dialpad
  const playPulseSound = (freq: number, duration: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);

      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch (e) {}
      }, duration);
    } catch (e) {}
  };

  // Outbound Dialing Sequence
  const handleStartCall = () => {
    setCallStatus('DIALING');
    playPulseSound(600, 100);

    setTimeout(() => {
      setCallStatus('RINGING');
      playPulseSound(440, 600);
    }, 1200);

    setTimeout(() => {
      setCallStatus('CONNECTED');
      setSecondsElapsed(0);
      setIsMuted(false);
      
      const welcome = `This is the ${decisionMaker} representing ${report?.business_name}. Who is calling and why are you contacting our direct line?`;
      
      setChatMessages([
        {
          role: 'assistant',
          content: `*RINGING... LINE PATCH SECURED* Hello, this is the ${decisionMaker} at ${report?.business_name || 'Prospect'}. State your concern...`
        }
      ]);

      if (!isMuted) {
        setIsSpeaking(true);
        speakText(welcome, () => setIsSpeaking(false));
      }
    }, 3200);
  };

  const handleEndCall = () => {
    setCallStatus('DISCONNECTED');
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Automatically trigger audit score card aggregation
    handleEvaluateNegotiation();
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isVoiceListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Browser level Speech Synthesis TTS
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\*[^*]+\*/g, '').trim();
      if (!clean) {
        if (onEnd) onEnd();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) || 
                    voices.find(v => v.lang.startsWith('en')) || 
                    voices[0];
      if (voice) utterance.voice = voice;
      utterance.pitch = 1.0;
      utterance.rate = 0.95;

      utterance.onend = () => { if (onEnd) onEnd(); };
      utterance.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (onEnd) onEnd();
    }
  };

  const startNegotiationRoleplay = () => {
    setNegotiationPhase(1);
    setAuditScorecard(null);
    setSecondsElapsed(0);
    setChatMessages([]);
    setInputMessage('');
    
    if (simMode === 'text') {
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello, this is the ${decisionMaker} of ${report?.business_name}. I am highly protective of our brand and received three cold solicitations today alone. What exactly makes your proposal alternative worth 4 minutes of my time?`
        }
      ]);
    } else {
      setCallStatus('READY');
    }
    setShowNegotiationModal(true);
  };

  // Send interactive chat roleplay response
  const handleSendChatResponse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    
    const updatedHistory = [...chatMessages, { role: 'user' as const, content: userText }];
    setChatMessages(updatedHistory);
    setSendingMessage(true);
    setIsSpeaking(false);

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const res = await fetch('/api/ai/strikevision/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: report.url,
          businessName: report.business_name,
          category: report.category,
          role: decisionMaker,
          history: updatedHistory
        })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (simMode === 'voice' && callStatus === 'CONNECTED' && !isMuted) {
        setIsSpeaking(true);
        speakText(data.reply, () => setIsSpeaking(false));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Complete analysis & generate scorecard review
  const handleEvaluateNegotiation = async () => {
    setAuditing(true);
    setNegotiationPhase(2);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const res = await fetch('/api/ai/strikevision/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          url: report.url,
          businessName: report.business_name,
          role: decisionMaker,
          transcript: chatMessages
        })
      });
      const scorecard = await res.json();
      setAuditScorecard(scorecard);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditing(false);
    }
  };

  // Formatted timer outputs (seconds -> mm:ss)
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div className="min-h-screen bg-[#07090C] text-[#F0F2F5] pb-24 overflow-x-hidden relative">
      
      {/* Visual cybernetic lattice grid pattern in background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1017_1px,transparent_1px),linear-gradient(to_bottom,#0c1017_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#4F8EF7] to-transparent animate-pulse" />

      <div className="max-w-7xl mx-auto px-6 pt-10">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-[#4F8EF7]/10 text-brand-primary border border-brand-primary/25 px-2 py-0.5 rounded font-mono font-bold tracking-widest uppercase">
              ⚡ STRIKEVISION™ CORE v4.2
            </span>
            <span className="text-xs text-[#4F8EF7]/30 font-mono select-none">// SYSTEM_WORKSPACE_INTEGRATOR</span>
          </div>

          <button
            onClick={() => setTab('dashboard')}
            className="text-xs font-mono text-[#6B7280] hover:text-[#F0F2F5] transition-colors flex items-center space-x-1 border border-brand-border px-3 py-1.5 rounded-lg bg-[#111318]/40 hover:bg-[#111318]"
          >
            <span>Exit Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* INPUT STAGE: BUSINESS INTELLIGENCE ENGINE SEARCH */}
        {!report && (
          <div className="max-w-3xl mx-auto text-center py-20 relative">
            
            {/* Background cybernetic logo flare */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-[#4F8EF7]/5 blur-[80px] pointer-events-none" />

            <div className="inline-flex items-center space-x-2.5 bg-[#4F8EF7]/5 border border-[#4F8EF7]/15 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
              <Zap className="w-4 h-4 text-[#4F8EF7] anim-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#4F8EF7] uppercase font-extrabold">
                Tactical Footprint Recognition
              </span>
            </div>

            <h1 className="font-display font-light text-3xl md:text-5xl tracking-tight text-[#F0F2F5] leading-tight mb-4">
              Business Intelligence Engine
            </h1>
            
            <p className="max-w-xl mx-auto text-sm text-brand-muted font-sans leading-relaxed mb-10">
              Analyze any business and uncover its digital DNA, survival risk, opportunity potential, and optimal sales strategy.
            </p>

            {/* Custom glassmorphic Form container */}
            <form onSubmit={handleAnalyze} className="bg-[#111318]/60 border border-brand-border rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#4F8EF7]/40">
                    <Globe className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    required
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="Paste a Google Maps, Website, Instagram, Facebook, or LinkedIn URL..."
                    className="w-full bg-[#07090C]/90 text-sm pl-12 pr-4 py-4 rounded-xl border border-brand-border text-[#F0F2F5] transition-all focus:outline-none focus:border-[#4F8EF7] focus:ring-1 focus:ring-[#4F8EF7]/30 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#4F8EF7] text-white px-8 py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-wider hover:bg-opacity-95 cursor-pointer hover:shadow-[0_0_20px_rgba(79,142,247,0.35)] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Digesting Trackers...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Business</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Supported types chips for fast visual indexing */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-[#6B7280] font-mono text-[9px] uppercase tracking-wider">
                <span className="flex items-center gap-1.5 bg-[#111318] px-3 py-1.5 rounded-lg border border-brand-border/40"><MapPin className="w-3.5 h-3.5 text-[#4F8EF7]" /> Google Maps</span>
                <span className="flex items-center gap-1.5 bg-[#111318] px-3 py-1.5 rounded-lg border border-brand-border/40"><Globe className="w-3.5 h-3.5 text-blue-400" /> Website URL</span>
                <span className="flex items-center gap-1.5 bg-[#111318] px-3 py-1.5 rounded-lg border border-brand-border/40"><Instagram className="w-3.5 h-3.5 text-pink-400" /> Instagram</span>
                <span className="flex items-center gap-1.5 bg-[#111318] px-3 py-1.5 rounded-lg border border-brand-border/40"><Facebook className="w-3.5 h-3.5 text-blue-500" /> Facebook</span>
                <span className="flex items-center gap-1.5 bg-[#111318] px-3 py-1.5 rounded-lg border border-brand-border/40"><Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn</span>
              </div>
            </form>

            {loading && (
              <div className="mt-12 p-3 bg-[#111318]/50 border border-brand-border max-w-sm mx-auto rounded-xl flex items-center gap-3.5 shadow-inner">
                <div className="w-4 h-4 border-2 border-[#4F8EF7] border-t-transparent animate-spin rounded-full shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] font-mono text-brand-muted uppercase block tracking-widest font-bold">STRIKEVISION CO-PROCESSOR</span>
                  <span className="text-xs font-mono text-green-400 font-bold block mt-0.5 animate-pulse">{loadingSteps[loaderStep]}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OUTPUT STAGE: THE PREMIUM INTELLIGENCE DOSSIER REPORT */}
        {report && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Lead Dossier Header Profile */}
            <div className="bg-[#111318]/70 border border-brand-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-md">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#4F8EF7]/10 text-[#4F8EF7] border border-[#4F8EF7]/25 p-2 rounded-xl">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-display font-medium text-2xl tracking-tight text-[#F0F2F5]">
                      {report.business_name}
                    </h2>
                    <p className="text-xs font-mono text-[#4F8EF7]">{report.category} • {report.url}</p>
                  </div>
                </div>
              </div>

              {/* Status metrics bar */}
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <button
                  onClick={() => { setReport(null); setUrlInput(''); }}
                  className="bg-[#1E2028] hover:bg-[#252835] text-xs font-mono text-brand-muted px-4 py-3 rounded-xl border border-brand-border transition-colors uppercase cursor-pointer text-center"
                >
                  Analyze Another
                </button>
                <div className="bg-[#111318] border border-[#FF3B3B]/30 rounded-xl px-4 py-3 min-w-[140px] text-center select-none shadow-[inset_0_1px_5px_rgba(255,59,59,0.05)]">
                  <span className="text-[9px] font-mono font-bold text-brand-muted block uppercase tracking-wider">EXTINCTION THREAT</span>
                  <span className="text-lg font-display font-black text-brand-red font-mono block mt-0.5">{report.extinction_risk.percentage}%</span>
                </div>
                <div className="bg-[#111318] border border-[#4F8EF7]/30 rounded-xl px-4 py-3 min-w-[140px] text-center select-none shadow-[inset_0_1px_5px_rgba(79,142,247,0.05)]">
                  <span className="text-[9px] font-mono font-bold text-brand-muted block uppercase tracking-wider">WIN PROBABILITY</span>
                  <span className="text-lg font-display font-black text-green-400 font-mono block mt-0.5">{report.opportunity.win_probability}%</span>
                </div>
              </div>
            </div>

            {/* BENTO GRID LEVEL 1: BUSINESS DNA & DIGITAL RISK */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* SECTION 1: BUSINESS DNA (Radar concentric visual) */}
              <div className="lg:col-span-7 bg-[#111318]/55 border border-brand-border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-[#4F8EF7]" />
                      <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 01 // BUSINESS DNA™</h3>
                    </div>
                    <span className="text-[9px] font-mono text-[#6B7280]">GRID_COORD_01_DNA</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    
                    {/* Concentric Cyber-Ring Score Chart Container */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center py-4">
                      <div className="relative w-44 h-44 flex items-center justify-center">
                        {/* Interactive decorative SVG grid */}
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#1d2432" strokeWidth="1.5" strokeDasharray="3, 3" />
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#1d2432" strokeWidth="1.5" />
                          <circle cx="50" cy="50" r="25" fill="none" stroke="#1d2432" strokeWidth="1.5" />
                          
                          {/* Visibility Circle Progress */}
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#4F8EF7" strokeWidth="3" 
                            strokeDasharray={`${2 * Math.PI * 45}`} 
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - report.business_dna.market_visibility / 100)}`}
                            strokeLinecap="round"
                            opacity="0.85" 
                          />
                          {/* Maturity Circle Progress */}
                          <circle cx="50" cy="50" r="35" fill="none" stroke="#10b981" strokeWidth="3.5" 
                            strokeDasharray={`${2 * Math.PI * 35}`} 
                            strokeDashoffset={`${2 * Math.PI * 35 * (1 - report.business_dna.digital_maturity / 100)}`}
                            strokeLinecap="round"
                            opacity="0.9" 
                          />
                          {/* Pressure Circle Progress */}
                          <circle cx="50" cy="50" r="25" fill="none" stroke="#ef4444" strokeWidth="4" 
                            strokeDasharray={`${2 * Math.PI * 25}`} 
                            strokeDashoffset={`${2 * Math.PI * 25 * (1 - report.business_dna.competition_pressure / 100)}`}
                            strokeLinecap="round"
                            opacity="0.95" 
                          />
                        </svg>

                        {/* Central score banner */}
                        <div className="text-center z-10">
                          <span className="text-[10px] font-mono text-brand-muted block uppercase">CLASSIFICATION</span>
                          <span className="text-[11px] font-mono font-bold text-[#4F8EF7] block mt-0.5 tracking-wider font-display uppercase">{report.classification}</span>
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="flex gap-4 mt-4 font-mono text-[9px]">
                        <span className="flex items-center gap-1.5 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Rival Pressure</span>
                        <span className="flex items-center gap-1.5 text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Digital Maturity</span>
                        <span className="flex items-center gap-1.5 text-[#4F8EF7]"><span className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7]" /> Vis Index</span>
                      </div>
                    </div>

                    {/* DNA metrics metrics scores details */}
                    <div className="md:col-span-7 space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#07090C] border border-brand-border/40 p-2.5 rounded-xl">
                          <span className="text-[9px] font-mono text-[#6B7280] block">GROWTH HUNGER</span>
                          <span className="text-sm font-mono font-bold text-white block mt-0.5">{report.business_dna.growth_hunger}/100</span>
                        </div>
                        <div className="bg-[#07090C] border border-brand-border/40 p-2.5 rounded-xl">
                          <span className="text-[9px] font-mono text-[#6B7280] block">DIGITAL MATURITY</span>
                          <span className="text-sm font-mono font-bold text-green-400 block mt-0.5">{report.business_dna.digital_maturity}/100</span>
                        </div>
                        <div className="bg-[#07090C] border border-brand-border/40 p-2.5 rounded-xl">
                          <span className="text-[9px] font-mono text-[#6B7280] block">COMPETITIVE PRESSURE</span>
                          <span className="text-sm font-mono font-bold text-red-400 block mt-0.5">{report.business_dna.competition_pressure}/100</span>
                        </div>
                        <div className="bg-[#07090C] border border-brand-border/40 p-2.5 rounded-xl">
                          <span className="text-[9px] font-mono text-[#6B7280] block">BRAND TRUST</span>
                          <span className="text-sm font-mono font-bold text-yellow-400 block mt-0.5">{report.business_dna.brand_trust}/100</span>
                        </div>
                      </div>
                      
                      <div className="bg-[#07090C] border border-brand-border/40 p-3.5 rounded-xl">
                        <span className="text-[9px] font-mono text-[#6B7280] block uppercase font-bold text-[#4F8EF7]">ADAPTABILITY & COMMENTARY</span>
                        <p className="text-xs text-brand-muted leading-relaxed font-sans mt-1.5">
                          {report.business_dna.ai_explanation}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* SECTION 2: DIGITAL EXTINCTION RISK CARD */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#111318] to-[#1a1114] border border-[#FF3B3B]/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-[0_4px_30px_rgba(255,59,59,0.03)]">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-brand-red" />
                      <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 02 // EXTINCTION THREAT™</h3>
                    </div>
                    <span className="text-[9px] font-mono text-[#6B7280]">GRID_COORD_02_RISK</span>
                  </div>

                  <div className="flex items-baseline space-x-2.5 mb-4">
                    <span className="text-5xl font-mono font-black text-brand-red leading-none">{report.extinction_risk.percentage}%</span>
                    <span className="text-[11px] font-sans font-medium text-brand-muted leading-tight uppercase">High Vulnerability index</span>
                  </div>

                  {/* Primary bullet drivers */}
                  <div className="space-y-2 mb-6">
                    {report.extinction_risk.reasons.map((rec: string, idx: number) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-red shrink-0 mt-1.5" />
                        <span className="text-brand-muted leading-normal">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cybernetic prediction timeline layout */}
                <div className="border-t border-brand-border/30 pt-4 mt-2">
                  <span className="text-[9px] font-mono text-brand-muted uppercase tracking-wider font-bold block mb-3 text-red-300">PREDICTED COLLAPSE TIMELINE</span>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px]">
                    <div className="bg-[#07090C]/80 border border-brand-border/30 p-2 rounded-lg" title={report.extinction_risk.timeline.three_months}>
                      <span className="text-brand-red font-bold block">3 MONTHS</span>
                      <span className="text-[10px] text-brand-muted block mt-0.5 truncate">Organic Drop</span>
                    </div>
                    <div className="bg-[#07090C]/80 border border-brand-border/30 p-2 rounded-lg" title={report.extinction_risk.timeline.six_months}>
                      <span className="text-brand-orange font-bold block">6 MONTHS</span>
                      <span className="text-[10px] text-brand-muted block mt-0.5 truncate">Price Spike</span>
                    </div>
                    <div className="bg-[#07090C]/80 border border-brand-border/30 p-2 rounded-lg" title={report.extinction_risk.timeline.twelve_months}>
                      <span className="text-yellow-400 font-bold block">12 MONTHS</span>
                      <span className="text-[10px] text-brand-muted block mt-0.5 truncate">Cutbacks</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* BENTO GRID LEVEL 2: OPPORTUNITY REPORT & COMPETITOR INTEL */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* SECTION 3: OPPORTUNITY REPORT */}
              <div className="lg:col-span-5 bg-[#111318]/55 border border-brand-border rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
                    <div className="flex items-center space-x-2">
                      <Compass className="w-4 h-4 text-green-400" />
                      <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 03 // OPPORTUNITY REPORT™</h3>
                    </div>
                  </div>

                  <div className="bg-[#07090C]/70 border border-brand-border/40 p-4 rounded-xl text-center mb-6">
                    <span className="text-[10px] font-mono text-brand-muted block uppercase">REVENUE OPPORTUNITY VALUE</span>
                    <span className="text-3xl font-display font-bold text-green-400 block mt-1 tracking-tight">{report.opportunity.revenue_opportunity}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 mb-4">
                    <div className="bg-[#07090C]/50 p-3 rounded-lg border border-brand-border/30">
                      <span className="text-[9px] font-mono text-[#6B7280] block">CLOSE SPEED</span>
                      <span className="text-xs font-mono font-bold text-white block mt-0.5">{report.opportunity.estimated_close_time}</span>
                    </div>
                    <div className="bg-[#07090C]/50 p-3 rounded-lg border border-brand-border/30">
                      <span className="text-[9px] font-mono text-[#6B7280] block">SALES DIFFICULTY</span>
                      <span className="text-xs font-mono font-bold text-yellow-400 block mt-0.5">{report.opportunity.sales_difficulty}</span>
                    </div>
                    <div className="bg-[#07090C]/50 p-3 rounded-lg border border-brand-border/30">
                      <span className="text-[9px] font-mono text-[#6B7280] block">BUDGET SCALE</span>
                      <span className="text-xs font-mono font-bold text-[#4F8EF7] block mt-0.5">{report.opportunity.budget_potential}</span>
                    </div>
                    <div className="bg-[#07090C]/50 p-3 rounded-lg border border-brand-border/30">
                      <span className="text-[9px] font-mono text-[#6B7280] block">TRANSFORMATION</span>
                      <span className="text-xs font-mono font-bold text-green-400 block mt-0.5">{report.opportunity.digital_transformation_potential}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#07090C]/80 border border-brand-border/40 p-3 rounded-xl mt-2">
                  <span className="text-[9px] font-mono text-green-400 font-bold block uppercase">REVENUE OPPORTUNITY RATIONALE</span>
                  <p className="text-[11px] text-brand-muted leading-relaxed font-sans mt-1">
                    {report.opportunity.reasoning}
                  </p>
                </div>
              </div>

              {/* SECTION 4: COMPETITOR INTELLIGENCE */}
              <div className="lg:col-span-7 bg-[#111318]/55 border border-brand-border rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-[#4F8EF7]" />
                      <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 04 // COMPETITOR INTELLIGENCE™</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="bg-[#07090C]/80 p-3 rounded-xl border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">NEIGHBORHOOD RIVAL DENSITY</span>
                        <span className="text-xs font-mono font-bold text-red-400 block mt-0.5 uppercase">{report.competitor_intelligence.competitor_density}</span>
                      </div>
                      <div className="bg-[#07090C]/80 p-3 rounded-xl border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">VISIBILITY GAP DETECTED</span>
                        <p className="text-[11px] text-brand-muted leading-normal mt-1">{report.competitor_intelligence.visibility_gap}</p>
                      </div>
                      <div className="bg-[#07090C]/80 p-3 rounded-xl border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">REVIEW GAP DETECTED</span>
                        <p className="text-[11px] text-brand-muted leading-normal mt-1">{report.competitor_intelligence.review_management_gap}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#07090C]/80 p-3 rounded-xl border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">TECHNICAL SEO GAP DETECTED</span>
                        <p className="text-[11px] text-brand-muted leading-normal mt-1">{report.competitor_intelligence.seo_gap}</p>
                      </div>
                      <div className="bg-[#07090C]/80 p-3 rounded-xl border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">SOCIAL FOOTPRINT GAP</span>
                        <p className="text-[11px] text-brand-muted leading-normal mt-1">{report.competitor_intelligence.social_media_gap}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/5 p-4 rounded-xl border border-green-500/20">
                  <div className="flex items-center space-x-2 mb-1">
                    <Sparkles className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-mono text-green-400 font-extrabold block uppercase tracking-wider">FASTEST ADVANTAGE TO WIN</span>
                  </div>
                  <p className="text-xs text-brand-muted font-sans font-medium leading-relaxed">
                    {report.competitor_intelligence.fastest_advantage_to_win}
                  </p>
                </div>
              </div>

            </div>

            {/* SECTION 5: STRIKE BLUEPRINT & PERSONALITY PROFILE */}
            <div className="bg-[#111318]/55 border border-brand-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-brand-border/40">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-[#4F8EF7]" />
                  <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 05 // STRIKE BLUEPRINT™ (PSYCHOLOGICAL PROFILE)</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Personality characteristics */}
                <div className="md:col-span-4 space-y-4">
                  <div className="bg-[#07090C] border border-brand-border/40 p-4 rounded-xl">
                    <span className="text-[10px] font-mono text-[#4F8EF7] font-bold block uppercase tracking-wider">STAKEHOLDER PROFILE</span>
                    <p className="text-xs text-brand-muted mt-2 leading-relaxed italic">
                      "{report.blueprint.owner_personality_profile}"
                    </p>
                  </div>

                  <div className="bg-[#07090C] border border-brand-border/40 p-4 rounded-xl">
                    <span className="text-[10px] font-mono text-yellow-400 font-bold block uppercase tracking-wider">DECISION MAKING MECHANICS</span>
                    <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                      {report.blueprint.decision_making_style}
                    </p>
                  </div>
                </div>

                {/* Priorities, Objections list */}
                <div className="md:col-span-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-green-400 font-bold block uppercase tracking-wider mb-2">// PRIMARY TARGET TARGETS</span>
                    <ul className="text-xs space-y-2 text-brand-muted list-disc pl-4 font-sans leading-relaxed">
                      {report.blueprint.likely_priorities.map((prior: string, idx: number) => (
                        <li key={idx} className="text-[#F0F2F5]">{prior}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-red-400 font-bold block uppercase tracking-wider mb-2">// PROBABLE OBJECTIONS</span>
                    <ul className="text-xs space-y-2 text-brand-muted list-disc pl-4 font-sans leading-relaxed">
                      {report.blueprint.likely_objections.map((obj: string, idx: number) => (
                        <li key={idx} className="text-[#F0F2F5]">{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Avoid, Mention topics list */}
                <div className="md:col-span-4 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-brand-red font-bold block uppercase tracking-wider mb-2 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-brand-red" /> AVOID COLD TOPICS</span>
                    <ul className="text-xs space-y-2 text-brand-muted list-disc pl-4 font-sans leading-relaxed">
                      {report.blueprint.avoid_talking_about.map((topic: string, idx: number) => (
                        <li key={idx} className="text-[#F0F2F5]">{topic}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-green-400 font-bold block uppercase tracking-wider mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> LEVERAGE THESE HIGH COLD TOPICS</span>
                    <ul className="text-xs space-y-2 text-brand-muted list-disc pl-4 font-sans leading-relaxed">
                      {report.blueprint.mention_these_topics.map((topic: string, idx: number) => (
                        <li key={idx} className="text-[#F0F2F5]">{topic}</li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Bottom direct sales script quotes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-brand-border/40 pt-6 mt-6">
                <div className="bg-[#07090C] border border-brand-border p-4 rounded-xl">
                  <span className="text-[10px] font-mono text-[#4F8EF7] font-bold block uppercase tracking-widest">// COLD CALL OPENER (SAY WORD-FOR-WORD)</span>
                  <p className="text-[13px] font-mono text-[#F0F2F5] leading-relaxed mt-2 italic font-semibold">
                    {report.blueprint.recommended_opening_line}
                  </p>
                </div>
                <div className="bg-[#07090C] border border-brand-border p-4 rounded-xl">
                  <span className="text-[10px] font-mono text-green-400 font-bold block uppercase tracking-widest">// MULTICHANNEL FOLLOW-UP OUTBOX SCRIPT</span>
                  <p className="text-[13px] font-mono text-[#F0F2F5] leading-relaxed mt-2 italic font-semibold">
                    {report.blueprint.recommended_follow_up_line}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 mt-4 font-mono text-[10px] text-brand-muted border-t border-brand-border/10 pt-4">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#4F8EF7]" /> OPTIMAL CONTACT DIAL TIME: {report.blueprint.best_time_to_contact}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#4F8EF7]" /> HIGHEST PROBABILITY DAYS: {report.blueprint.best_day_to_contact}</span>
              </div>
            </div>

            {/* SECTION 6: APPROACH MATRIX COMPARE TABLE */}
            <div className="bg-[#111318]/55 border border-brand-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-brand-border/40">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#4F8EF7]" />
                  <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 06 // APPROACH PROBABILITY MATRIX™</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {report.approach_matrix.channels.map((chan: any, idx: number) => (
                  <div key={idx} className="bg-[#07090C] border border-brand-border/60 p-4 rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-white block uppercase tracking-widest">{chan.channel}</span>
                      <div className="mt-3 space-y-1 text-[10px] font-mono leading-normal text-brand-muted">
                        <div>SPEED: <span className="text-white">{chan.response_speed}</span></div>
                        <div>PERSONALIZATION: <span className="text-white">{chan.personalization_potential}</span></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-brand-border/20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-[#6B7280]">EST_PROB</span>
                        <span className={`text-md font-mono font-bold ${chan.success_probability > 75 ? 'text-green-400' : chan.success_probability > 50 ? 'text-yellow-400' : 'text-brand-muted'}`}>{chan.success_probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#07090C] border border-[#4F8EF7]/20 p-4 rounded-xl mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#4F8EF7] font-bold block uppercase tracking-wider">PRIMARY DIRECT CHANNEL ROUTING</span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="bg-green-500/15 text-green-400 font-bold px-2 py-0.5 rounded border border-green-500/20">PRIMARY: {report.approach_matrix.recommended_primary_channel}</span>
                    <span className="text-brand-muted">/</span>
                    <span className="bg-brand-primary/15 text-[#4F8EF7] font-bold px-2 py-0.5 rounded border border-brand-primary/20">BACKUP: {report.approach_matrix.recommended_backup_channel}</span>
                  </div>
                </div>
                <p className="text-xs text-brand-muted max-w-xl font-sans mt-1 md:mt-0 leading-relaxed">
                  {report.approach_matrix.reasoning}
                </p>
              </div>
            </div>

            {/* CO-SIMULATING TIMELINES SECTION 7 (Scenario A vs B) & DIGITAL TWIN SECTION 8 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* SECTION 7: FUTURE SIMULATOR */}
              <div className="bg-[#111318]/55 border border-brand-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
                  <div className="flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-[#4F8EF7]" />
                    <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 07 // BUSINESS FUTURE PROJECTION SIMULATOR™</h3>
                  </div>
                </div>

                <div className="flex bg-[#07090C] p-1 border border-brand-border rounded-xl mb-6">
                  <button
                    onClick={() => setSimulatorScenario('a')}
                    className={`flex-1 py-2 rounded-lg font-mono text-xs uppercase cursor-pointer ${simulatorScenario === 'a' ? 'bg-red-500/10 text-brand-red border border-red-500/20 font-bold' : 'text-brand-muted hover:text-white'}`}
                  >
                    Scenario A: No Action Taken
                  </button>
                  <button
                    onClick={() => setSimulatorScenario('b')}
                    className={`flex-1 py-2 rounded-lg font-mono text-xs uppercase cursor-pointer ${simulatorScenario === 'b' ? 'bg-green-500/10 text-green-400 border border-green-500/20 font-bold' : 'text-brand-muted hover:text-white'}`}
                  >
                    Scenario B: Strike Proposals
                  </button>
                </div>

                {/* Scenario details */}
                {simulatorScenario === 'a' ? (
                  <div className="space-y-4 animate-fade-in text-brand-red">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-[#07090C] p-3 rounded-lg border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">VISIBILITY INDEX</span>
                        <span className="text-lg font-mono font-bold block mt-1">{report.future_simulator.scenario_a.visibility}%</span>
                      </div>
                      <div className="bg-[#07090C] p-3 rounded-lg border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">CLIENT SHRINKAGE</span>
                        <span className="text-xs font-mono font-bold block mt-1">{report.future_simulator.scenario_a.customer_growth}</span>
                      </div>
                      <div className="bg-[#07090C] p-3 rounded-lg border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">EXTINCTION RISK</span>
                        <span className="text-lg font-mono font-bold block mt-1">{report.future_simulator.scenario_a.risk}%</span>
                      </div>
                    </div>

                    <div className="bg-[#07090C]/50 p-4 rounded-xl border border-[#FF3B3B]/10 space-y-2">
                      <span className="text-[10px] font-mono block font-bold uppercase text-red-400">// DOWNWARD CASCADE DRIVERS</span>
                      {report.future_simulator.scenario_a.bulletpoints.map((pt: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs leading-relaxed text-brand-muted">
                          <span className="text-brand-red select-none">✕</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in text-green-400">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-[#07090C] p-3 rounded-lg border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">VISIBILITY INDEX</span>
                        <span className="text-lg font-mono font-bold block mt-1">{report.future_simulator.scenario_b.visibility}%</span>
                      </div>
                      <div className="bg-[#07090C] p-3 rounded-lg border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">ACQUISITION FLOW</span>
                        <span className="text-xs font-mono font-bold block mt-1">{report.future_simulator.scenario_b.customer_growth}</span>
                      </div>
                      <div className="bg-[#07090C] p-3 rounded-lg border border-brand-border/30">
                        <span className="text-[9px] font-mono text-[#6B7280] block">EXTINCTION RISK</span>
                        <span className="text-lg font-mono font-bold block mt-1">{report.future_simulator.scenario_b.risk}%</span>
                      </div>
                    </div>

                    <div className="bg-[#07090C]/50 p-4 rounded-xl border border-green-500/10 space-y-2">
                      <span className="text-[10px] font-mono block font-bold uppercase text-green-400">// STRATEGIC CATALYST BENEFITS</span>
                      {report.future_simulator.scenario_b.bulletpoints.map((pt: string, i: number) => (
                        <div key={i} className="flex gap-2 text-xs leading-relaxed text-brand-muted">
                          <span className="text-green-400 select-none">✓</span>
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 8: DIGITAL TWIN STATE */}
              <div className="bg-[#111318]/55 border border-brand-border rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border/40">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-[#4F8EF7]" />
                      <h3 className="text-xs font-mono font-bold text-[#F0F2F5] uppercase tracking-wider">SECTION 08 // DIGITAL TWIN COMPARISON™</h3>
                    </div>
                  </div>

                  <p className="text-[11px] text-brand-muted font-sans leading-relaxed mb-4">
                    Track the simulated evolution of this business's digital persona in real-time. Toggle below to witness transition curves.
                  </p>

                  <div className="flex bg-[#07090C] p-1 border border-brand-border rounded-xl mb-4">
                    <button
                      onClick={() => setTwinState('current')}
                      className={`flex-1 py-2 rounded-lg font-mono text-xs uppercase cursor-pointer ${twinState === 'current' ? 'bg-indigo-500/10 text-[#4F8EF7] border border-indigo-500/20 font-bold' : 'text-brand-muted'}`}
                    >
                      Original Persona State
                    </button>
                    <button
                      onClick={() => setTwinState('future')}
                      className={`flex-1 py-2 rounded-lg font-mono text-xs uppercase cursor-pointer ${twinState === 'future' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold' : 'text-brand-muted'}`}
                    >
                      Post-Transformation Twin Persona
                    </button>
                  </div>

                  {/* Transition values progress meters */}
                  <div className="space-y-4">
                    {[
                      { label: "BRAND VISIBILITY", devMetric: "brand_visibility" },
                      { label: "MARKET PLACE TRUST", devMetric: "trust" },
                      { label: "DIGITAL PRESENCE INDEX", devMetric: "digital_presence" },
                      { label: "GROWTH SCALE CAPACITY", devMetric: "growth_potential" },
                      { label: "CUSTOMER LOYALTY RETENTION", devMetric: "customer_loyalty" }
                    ].map((metric: any, i: number) => {
                      const curVal = report.digital_twin.current[metric.devMetric];
                      const futVal = report.digital_twin.future[metric.devMetric];
                      const displayVal = twinState === 'current' ? curVal : futVal;

                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between font-mono text-[9px]">
                            <span className="text-brand-muted">{metric.label}</span>
                            <span className={twinState === 'current' ? 'text-indigo-400 font-bold' : 'text-cyan-400 font-bold'}>{displayVal}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#07090C] rounded-full overflow-hidden border border-brand-border/40">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${twinState === 'current' ? 'bg-indigo-500' : 'bg-cyan-400'}`}
                              style={{ width: `${displayVal}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

            {/* FIXED FLOATING ACTION BUTTON */}
            <div className="fixed bottom-8 right-8 z-[100] animate-[bounce_2s_infinite]">
              <button
                onClick={startNegotiationRoleplay}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/30 text-white font-mono text-xs font-bold px-6 py-4 rounded-full cursor-pointer hover:scale-105 transform transition-all shadow-[0_10px_30px_rgba(79,142,247,0.4)] active:scale-95"
              >
                <span>🎭 Enter Negotiation Room™</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* NEGOTIATION ROOM FULLSCREEN MODAL */}
      {showNegotiationModal && (
        <div className="fixed inset-0 z-[500] bg-[#07090C]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111318] border border-brand-border w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="border-b border-brand-border p-4 bg-[#111318] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-brand-primary" />
                <div>
                  <h3 className="font-display font-semibold text-sm text-[#F0F2F5] uppercase tracking-wider">NEGOTIATION SIMULATOR ROOM™</h3>
                  <span className="text-[10px] text-brand-muted font-mono block">OBJECTION TRAINER // STRIKEAI CORE</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setShowNegotiationModal(false);
                }}
                className="text-xs text-brand-muted hover:text-[#F0F2F5] font-mono border border-brand-border px-3 py-1 rounded-lg cursor-pointer bg-brand-border/10 transition-colors"
              >
                CLOSE SIMULATOR
              </button>
            </div>

            {/* STAGE 1: ACTIVE NEGOTIATION ROLEPLAY */}
            {negotiationPhase === 1 && (
              <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-brand-border overflow-hidden">
                
                {/* Configuration Sidebar */}
                <div className="p-5 md:w-80 bg-[#111318]/50 space-y-6 shrink-0 overflow-y-auto">
                  
                  {/* Select Stakeholder profile */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-brand-muted uppercase block tracking-wider">SELECT TARGET INTERVIEWEE</label>
                    <select
                      value={decisionMaker}
                      onChange={e => setDecisionMaker(e.target.value)}
                      disabled={chatMessages.length > 1}
                      className="w-full bg-[#07090C] border border-brand-border rounded-xl text-xs text-[#F0F2F5] p-3 cursor-pointer focus:outline-none focus:border-[#4F8EF7]"
                    >
                      <option value="Owner">Business Owner</option>
                      <option value="Manager">Operations Manager</option>
                      <option value="Founder">Local Founder</option>
                      <option value="Marketing Head">Head of Marketing</option>
                      <option value="Operations Head">Operations Advisor</option>
                      <option value="Store Manager">Duty Store Manager</option>
                    </select>
                    {chatMessages.length > 1 && (
                      <span className="text-[9px] font-mono text-[#FF3B3B] block">⚠️ Stakeholder locked for this session. Reset simulation to swap.</span>
                    )}
                  </div>

                  {/* Mode preference dial option */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold text-brand-muted uppercase block tracking-wider">ROLEPLAY PREFERENCE ENGINE</label>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button
                        onClick={() => { setSimMode('text'); setCallStatus('READY'); }}
                        className={`py-2 rounded-lg font-mono text-[10px] uppercase font-bold cursor-pointer border ${simMode === 'text' ? 'bg-[#4F8EF7]/10 text-brand-primary border-[#4F8EF7]/40' : 'bg-[#07090C] text-brand-muted border-brand-border hover:text-white'}`}
                      >
                        Text Chat
                      </button>
                      <button
                        onClick={() => { setSimMode('voice'); setCallStatus('READY'); }}
                        className={`py-2 rounded-lg font-mono text-[10px] uppercase font-bold cursor-pointer border ${simMode === 'voice' ? 'bg-[#4F8EF7]/10 text-brand-primary border-[#4F8EF7]/40' : 'bg-[#07090C] text-brand-muted border-brand-border hover:text-white'}`}
                      >
                        Simulated Voice
                      </button>
                    </div>
                  </div>

                  {/* Operational parameters reminders */}
                  <div className="p-3.5 bg-[#07090C] border border-brand-border rounded-xl text-[11px] text-brand-muted leading-relaxed space-y-2">
                    <div className="text-[10px] font-mono text-yellow-400 font-bold uppercase block tracking-wider">// RULE OF ENGAGEMENT</div>
                    <p>The system persona acts defensively. Challenge their budget boundaries, present localized maps backlog facts, and do not let them derail the focus on competitor infiltration.</p>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleEvaluateNegotiation}
                      className="w-full bg-[#1E2028] hover:bg-brand-red border border-brand-border text-brand-muted hover:text-white transition-all text-xs font-mono font-bold py-3 px-4 rounded-xl cursor-pointer text-center uppercase tracking-wider shadow"
                    >
                      FORCE ABORT & AUDIT
                    </button>
                  </div>
                </div>

                {/* Simulated Content Dialogue Screen */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090C]">
                  
                  {/* TEXT CHAT MODE */}
                  {simMode === 'text' && (
                    <div className="flex-1 flex flex-col justify-between overflow-hidden h-[500px]">
                      
                      {/* Chat screen list */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4">
                        {chatMessages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[9px] font-mono text-brand-muted uppercase mb-1">
                              {msg.role === 'user' ? 'Consultant [YOU]' : `${decisionMaker} [PROSPECT]`}
                            </span>
                            <div className={`p-3.5 rounded-xl text-xs max-w-sm leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-[#4F8EF7] text-white rounded-tr-none font-medium'
                                : 'bg-[#111318] border border-brand-border text-green-300 font-mono rounded-tl-none'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Send bar form wrapper */}
                      <form onSubmit={handleSendChatResponse} className="p-4 border-t border-brand-border/60 bg-[#111318]/50 flex gap-2">
                        <input
                          type="text"
                          required
                          disabled={sendingMessage}
                          value={inputMessage}
                          onChange={e => setInputMessage(e.target.value)}
                          placeholder={`Ask ${decisionMaker} what problems competitors are causing in real time...`}
                          className="flex-1 bg-[#07090C] border border-brand-border text-xs px-4 py-3.5 rounded-xl text-[#F0F2F5] focus:outline-none focus:border-[#4F8EF7]"
                        />
                        <button
                          type="submit"
                          disabled={sendingMessage || !inputMessage.trim()}
                          className="bg-[#4F8EF7] text-white px-5 rounded-xl flex items-center justify-center cursor-pointer transition-opacity"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>

                    </div>
                  )}

                  {/* SIMULATED VOICE CALL MODE */}
                  {simMode === 'voice' && (
                    <div className="flex-1 flex flex-col justify-between items-center p-8 h-[500px]">
                      
                      {/* Ready/Dialing/Ringing/Connected container states visually modeled */}
                      <div className="text-center w-full max-w-sm mt-4">
                        <span className="inline-flex items-center space-x-1.5 text-[10px] font-mono font-bold text-green-400 mb-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                          <span>VOICE_SIM_SECURE_CHANNEL // {callStatus}</span>
                        </span>
                        
                        <h4 className="text-[#F0F2F5] font-display font-bold text-xl block mt-1 tracking-tight">{decisionMaker}</h4>
                        <span className="text-xs font-mono text-brand-muted block mt-0.5">{report?.business_name} // {report?.category}</span>

                        {callStatus === 'CONNECTED' && (
                          <div className="mt-4 inline-block font-mono text-xs bg-[#111318] border border-brand-border px-3 py-1 rounded-full text-brand-primary">
                            Timer Duration: {formatTimer(secondsElapsed)}
                          </div>
                        )}
                      </div>

                      {/* Frequency waveform simulation block */}
                      <div className="w-full max-w-md bg-[#111318]/45 border border-brand-border rounded-xl p-5 my-4 flex flex-col items-center justify-center min-h-[160px]">
                        {callStatus === 'READY' && (
                          <div className="text-center py-6">
                            <span className="text-xs text-brand-muted font-mono block">PRE-DIAL SWITCHBOARD READY</span>
                            <p className="text-[11px] text-brand-muted mt-2 max-w-xs mx-auto">Make sure your microphone and headphones are configured. Click "DIAL STAKEHOLDER LINE" below to start.</p>
                          </div>
                        )}

                        {callStatus === 'DIALING' && (
                          <div className="text-center py-6 animate-pulse text-brand-amber">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <span className="text-xs font-mono block font-bold">TUNING DIAL OUTBOUND CIRCUITS...</span>
                          </div>
                        )}

                        {callStatus === 'RINGING' && (
                          <div className="text-center py-6 text-brand-orange">
                            <Phone className="w-6 h-6 animate-bounce mx-auto mb-2 text-brand-orange" />
                            <span className="text-xs font-mono block font-bold">SIGNAL RING PATTERNS... DRRING...</span>
                          </div>
                        )}

                        {callStatus === 'CONNECTED' && (
                          <div className="w-full text-center space-y-4">
                            
                            {/* Animated green audio bars */}
                            <div className="flex items-end justify-center space-x-1.5 h-8">
                              <div className={`w-1 rounded-full bg-green-400 ${isSpeaking ? 'h-7 animate-pulse' : 'h-2'}`} />
                              <div className={`w-1 rounded-full bg-green-400 ${isSpeaking ? 'h-5 animate-pulse' : 'h-3'}`} />
                              <div className={`w-1 rounded-full bg-green-400 ${isSpeaking ? 'h-8 animate-pulse' : 'h-2'}`} />
                              <div className={`w-1 rounded-full bg-green-400 ${isVoiceListening ? 'h-6 text-[#4F8EF7]' : 'h-2'}`} />
                              <div className={`w-1 rounded-full bg-green-400 ${isVoiceListening ? 'h-8 text-[#4F8EF7]' : 'h-1'}`} />
                            </div>

                            <span className="text-[10px] font-mono text-green-300 block uppercase font-bold tracking-widest">
                              {isSpeaking ? 'STAKEHOLDER IS CURRENTLY TALKING...' : isVoiceListening ? 'LISTENING_MIC_DETECTED...' : 'VOICE PATH IDLE'}
                            </span>

                            {/* Dialogue feedback caption transcriptor fallback */}
                            <div className="border-t border-brand-border/30 pt-3 text-center px-4">
                              <p className="text-[11px] font-sans text-brand-muted leading-relaxed max-h-16 overflow-y-auto italic">
                                "{chatMessages[chatMessages.length - 1]?.content.replace(/\*[^*]+\*/g, '') || "Speak clearly or type response transcript in the entry box..."}"
                              </p>
                            </div>

                          </div>
                        )}
                      </div>

                      {/* Live controller audio triggers */}
                      <div className="space-y-4 w-full max-w-sm">
                        
                        {/* Keyboard direct type option in voice mode as input backup */}
                        {callStatus === 'CONNECTED' && (
                          <form onSubmit={(e) => { e.preventDefault(); handleSendChatResponse(); }} className="flex bg-[#07090C] border border-brand-border rounded-xl p-2 items-center gap-2">
                            <input
                              type="text"
                              value={inputMessage}
                              onChange={e => setInputMessage(e.target.value)}
                              placeholder="Or type alternative voice pitch script entry..."
                              disabled={sendingMessage}
                              className="flex-grow bg-transparent text-xs text-[#F0F2F5] focus:outline-none pl-2"
                            />
                            {recognitionSupported && (
                              <button
                                type="button"
                                onClick={toggleMic}
                                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${isVoiceListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-brand-primary/10 text-brand-primary'}`}
                              >
                                <Mic className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button type="submit" className="w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center cursor-pointer">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </form>
                        )}

                        {/* Dialing layout buttons triggers */}
                        <div className="flex items-center justify-center space-x-6 pb-2">
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className={`p-3.5 rounded-full border border-brand-border cursor-pointer transition-colors ${isMuted ? 'bg-red-500/20 text-[#F0F2F5]' : 'bg-[#111318] text-brand-muted hover:text-white'}`}
                            title="Mute synthetic vocal script readback"
                          >
                            <VolumeX className="w-5 h-5" />
                          </button>

                          {callStatus === 'READY' || callStatus === 'DISCONNECTED' ? (
                            <button
                              onClick={handleStartCall}
                              className="bg-green-600 hover:bg-green-700 text-white rounded-full p-5 transform hover:scale-105 transition-all shadow-lg cursor-pointer"
                              title="Start audio outbound patch"
                            >
                              <Phone className="w-6 h-6" />
                            </button>
                          ) : (
                            <button
                              onClick={handleEndCall}
                              className="bg-brand-red hover:bg-red-700 text-white rounded-full p-5 transform hover:scale-105 transition-all shadow-lg cursor-pointer animate-pulse"
                              title="Hangup and sync scorecard review"
                            >
                              <PhoneOff className="w-6 h-6" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const lastMsg = chatMessages[chatMessages.length - 1];
                              if (lastMsg && lastMsg.role === 'assistant') {
                                setIsSpeaking(true);
                                speakText(lastMsg.content, () => setIsSpeaking(false));
                              }
                            }}
                            className="bg-[#111318] hover:bg-[#1E2432] text-brand-muted hover:text-[#F0F2F5] rounded-full p-3.5 cursor-pointer border border-brand-border transition-colors"
                            title="Replay TTS playback statement"
                            disabled={callStatus !== 'CONNECTED'}
                          >
                            <Volume2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

            {/* STAGE 2: SCORECARD EVALUATION REPORT SUMMARY */}
            {negotiationPhase === 2 && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#07090C]">
                {auditing ? (
                  <div className="py-20 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto" />
                    <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">AGGREGATING COLD WORKROOM TRANSACTION FEEDBACKS...</p>
                  </div>
                ) : auditScorecard ? (
                  <div className="space-y-6 animate-fade-in font-sans">
                    
                    {/* Score header */}
                    <div className="text-center pb-6 border-b border-brand-border max-w-md mx-auto">
                      <div className="inline-flex items-center space-x-1 bg-green-500/10 border border-green-500/25 px-3 py-1 rounded-full text-[10px] text-green-400 font-extrabold tracking-widest uppercase mb-3">
                        <Trophy className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                        <span>SESSION AUDIT METRICS SYNCED</span>
                      </div>
                      
                      <h4 className="text-brand-muted text-xs font-mono block uppercase tracking-wider">DEAL READINESS REPORT™</h4>
                      <div className="text-5xl font-display font-black text-white block mt-1 tracking-tight font-mono">
                        {auditScorecard.overall_readiness_score} <span className="text-xs text-brand-muted font-normal">/ 100</span>
                      </div>
                    </div>

                    {/* Dynamic axes scorecards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {[
                        { label: "TRUST BUILDING", val: auditScorecard.trust_building_score, color: "text-[#4F8EF7]" },
                        { label: "OBJECTION HANDLING", val: auditScorecard.objection_handling_score, color: "text-yellow-400" },
                        { label: "VALUE COMMUNICATION", val: auditScorecard.value_communication_score, color: "text-green-400" },
                        { label: "CLOSING ABILITY", val: auditScorecard.closing_ability_score, color: "text-brand-orange" },
                        { label: "CONFIDENCE TONE", val: auditScorecard.confidence_score, color: "text-pink-500" }
                      ].map((axe: any, i: number) => (
                        <div key={i} className="bg-[#111318]/60 p-3.5 rounded-xl border border-brand-border/40 text-center">
                          <span className="text-[8px] font-mono text-[#6B7280] block uppercase tracking-wider">{axe.label}</span>
                          <span className={`text-lg font-mono font-bold block mt-1 ${axe.color}`}>{axe.val}/100</span>
                        </div>
                      ))}
                    </div>

                    {/* Actionable coaching recommendations */}
                    <div className="bg-[#111318]/50 p-5 rounded-xl border border-brand-border space-y-3 font-sans">
                      <span className="text-[10px] font-mono font-bold text-[#4F8EF7] block uppercase tracking-widest">// CRITICAL COACHING ACTIONS</span>
                      <div className="space-y-2">
                        {auditScorecard.critiques?.map((crit: string, idx: number) => (
                          <div key={idx} className="flex items-start space-x-2 text-xs">
                            <span className="text-[#FF3B3B] font-bold select-none shrink-0">⚡</span>
                            <p className="text-brand-muted leading-relaxed">{crit}</p>
                          </div>
                        ))}
                        {(!auditScorecard.critiques || auditScorecard.critiques.length === 0) && (
                          <p className="text-xs text-brand-muted italic">No immediate structural warning spikes flagged.</p>
                        )}
                      </div>
                    </div>

                    {/* Brutally Honest Reality Check */}
                    <div className="bg-[#111318]/45 p-5 rounded-xl border border-brand-border space-y-2.5">
                      <h4 className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-widest flex items-center">
                        <Shield className="w-3.5 h-3.5 mr-1.5 text-[#4F8EF7]" />
                        <span>Reality Check</span>
                      </h4>
                      <p className="text-xs text-[#F0F2F5] leading-relaxed font-sans bg-black/40 p-3.5 rounded-lg border border-brand-border/40 text-left">
                        {auditScorecard.reality_check || "Your messaging is confusing, lacks clarity, and holds high competitive friction. Speak directly to map listing ranking pains rather than generic benefits."}
                      </p>
                    </div>

                    {/* Hard Stop Warning if should_call is false, or score under 60 */}
                    {(!(auditScorecard.should_call ?? true) || (auditScorecard.overall_readiness_score < 60)) && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3 text-left">
                        <AlertTriangle className="w-4.5 h-4.5 text-[#FF3B3B] shrink-0 mt-0.5 animate-pulse" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[#FF3B3B] uppercase tracking-wide">⚠️ Better Not Call Yet</h4>
                          <p className="text-[11px] text-brand-muted leading-relaxed">
                            Based on this pitch, it is recommended that you do not contact prospects yet. Continue practicing and improving your messaging before making real calls.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rewrite My Pitch - "How You Should Have Said It" */}
                    <div className="bg-[#111318]/40 border border-brand-border/50 rounded-xl overflow-hidden text-left">
                      <button
                        type="button"
                        onClick={() => setShowRewrites(!showRewrites)}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111318]/60 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#F0F2F5]">
                            How You Should Have Said It
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-brand-primary bg-[#4F8EF7]/10 px-2 py-0.5 rounded border border-[#4F8EF7]/20 uppercase tracking-wider">
                          {showRewrites ? "HIDE REWRITES" : "ANALYZE COMPILATION"}
                        </span>
                      </button>

                      {showRewrites && (
                        <div className="p-4 border-t border-brand-border/40 space-y-4 bg-black/30 font-sans">
                          <p className="text-[9px] text-brand-muted font-mono leading-relaxed pb-2 uppercase tracking-wider border-b border-brand-border/25">
                            Sentence-by-Sentence Rewrite Breakdown:
                          </p>
                          
                          {((auditScorecard.sentence_rewrites || []).length > 0) ? (
                            auditScorecard.sentence_rewrites.map((item: any, idx: number) => (
                              <div key={idx} className="space-y-2 pb-3 border-b border-brand-border/10 last:border-0 last:pb-0">
                                <div className="flex items-start space-x-2">
                                  <span className="text-[9px] font-mono text-brand-red font-bold uppercase shrink-0 mt-0.5 bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/15">
                                    Original:
                                  </span>
                                  <p className="text-xs text-brand-muted italic leading-relaxed">
                                    "{item.original}"
                                  </p>
                                </div>
                                <div className="flex items-start space-x-2">
                                  <span className="text-[9px] font-mono text-green-400 font-bold uppercase shrink-0 mt-0.5 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/15">
                                    Better Version:
                                  </span>
                                  <p className="text-xs text-[#F0F2F5] bg-green-500/5 border border-green-500/15 px-2.5 py-1.5 rounded-lg leading-relaxed w-full">
                                    {item.improved}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-start space-x-2">
                                <span className="text-[9px] font-mono text-brand-red font-bold uppercase shrink-0 bg-brand-red/10 px-1.5 py-0.5 rounded border border-brand-red/15">
                                  Original:
                                </span>
                                <p className="text-xs text-brand-muted italic leading-relaxed mb-1">
                                  "Hi check our software we can help you get more reviews"
                                </p>
                              </div>
                              <div className="flex items-start space-x-2">
                                <span className="text-[9px] font-mono text-green-400 font-bold uppercase shrink-0 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/15">
                                  Better Version:
                                </span>
                                <p className="text-xs text-[#F0F2F5] bg-green-500/5 border border-green-500/20 px-2.5 py-1.5 rounded-lg leading-relaxed w-full">
                                  "We ran a tactical blueprint for your street and noticed over 40 negative or unanswered reviews on your map listing. That gap is actively funneling customers to your immediate local competitors."
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Final Verdict Section */}
                    <div className="border-t border-brand-border/40 pt-4 flex flex-col items-center justify-center space-y-2 text-center pb-2 font-mono">
                      <span className="text-[10px] font-mono font-extrabold text-brand-muted tracking-wider uppercase">FINAL AUDIT VERDICT</span>
                      
                      {(() => {
                        const v = (auditScorecard.verdict || (auditScorecard.overall_readiness_score >= 80 ? 'Ready To Call' : (auditScorecard.overall_readiness_score >= 60 ? 'Needs More Practice' : 'Do Not Call Yet')));
                        if (v === 'Ready To Call') {
                          return (
                            <span className="inline-flex items-center space-x-1.5 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full text-xs text-green-400 font-black tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.15)] select-none">
                              <span>✅ Ready To Call</span>
                            </span>
                          );
                        } else if (v === 'Needs More Practice') {
                          return (
                            <span className="inline-flex items-center space-x-1.5 bg-brand-amber/10 border border-brand-amber/35 px-4 py-2 rounded-full text-xs text-brand-amber font-black tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.15)] select-none">
                              <span>⚠️ Needs More Practice</span>
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center space-x-1.5 bg-brand-red/10 border border-brand-red/35 px-4 py-2 rounded-full text-xs text-brand-red font-black tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.15)] select-none">
                              <span>❌ Do Not Call Yet</span>
                            </span>
                          );
                        }
                      })()}
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                      <button
                        onClick={startNegotiationRoleplay}
                        className="bg-[#1E2028] border border-brand-border text-xs text-[#F0F2F5] hover:bg-brand-border transition-colors font-mono font-bold py-3 px-6 rounded-xl cursor-pointer uppercase tracking-wider"
                      >
                        Try Sparring Again
                      </button>
                      <button
                        onClick={() => setShowNegotiationModal(false)}
                        className="bg-brand-primary hover:bg-opacity-95 text-white text-xs font-mono font-bold py-3 px-6 rounded-xl cursor-pointer uppercase tracking-wider"
                      >
                        Save Evaluation Profile
                      </button>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-10">
                    <span className="text-xs text-brand-muted">Evaluation compilation aborted. Check backend AI parameters.</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
