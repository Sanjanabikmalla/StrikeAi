import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Bot, 
  Shield, 
  ChevronRight, 
  Send, 
  Volume2, 
  Flame, 
  Award, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RotateCcw,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  VolumeX,
  Radio,
  Users,
  Play,
  Sparkles
} from 'lucide-react';
import { Lead } from '../types';

interface CoPilotProps {
  leadId: string;
  setTab: (tab: string) => void;
  userId: string;
}

export default function CoPilot({ leadId, setTab, userId }: CoPilotProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [phase, setPhase] = useState<1 | 2 | 3>(1); // 1: Briefing, 2: Sparring, 3: Scorecard
  const [showRewrites, setShowRewrites] = useState(false);
  
  // Phase 1: Briefing states
  const [briefingText, setBriefingText] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [loadingBriefing, setLoadingBriefing] = useState(true);

  // Phase 2: Roleplay state variables
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120); // 2 minutes countdown
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Phase 3: Scorecard audit records
  const [evaluation, setEvaluation] = useState<any>(null);
  const [generatingScore, setGeneratingScore] = useState(false);

  // Call simulation states
  const [simMode, setSimMode] = useState<'text' | 'voice_call'>('text');
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [callStatusText, setCallStatusText] = useState('READY');
  const [isPersonSpeaking, setIsPersonSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Fetch lead parameters initially
  useEffect(() => {
    async function loadLeadAndBrief() {
      try {
        const leadRes = await fetch(`/api/leads/${leadId}`);
        const leadData = await leadRes.json();
        setLead(leadData);

        // Fetch typewriter briefing content
        const briefRes = await fetch('/api/ai/copilot/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: leadData.id })
        });
        const briefData = await briefRes.json();
        setBriefingText(briefData.briefing);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingBriefing(false);
      }
    }
    if (leadId) loadLeadAndBrief();
  }, [leadId]);

  // Speech Recognition browser integration setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
        }
      };
      
      rec.onerror = (event: any) => {
        console.warn('Speech recognition interface error:', event.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
      setRecognitionSupported(true);
    }
  }, []);

  // Cleanup timers & voice states on unmount
  useEffect(() => {
    return () => {
      if ((window as any)._ringTimer1) clearTimeout((window as any)._ringTimer1);
      if ((window as any)._connectTimer) clearTimeout((window as any)._connectTimer);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Typewriter streaming effect implementation
  useEffect(() => {
    if (!briefingText) return;
    let i = 0;
    const interval = setInterval(() => {
      setStreamedText(prev => prev + briefingText.charAt(i));
      i++;
      if (i >= briefingText.length) {
        clearInterval(interval);
      }
    }, 12); // Steady pace typewriter effect
    return () => clearInterval(interval);
  }, [briefingText]);

  // Auto scroll sparring dialogue box
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Countdown timer manager for sparring loops
  useEffect(() => {
    if (phase === 2 && isCallConnected) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleEvaluate(); // Automate audit when timer clocks out!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, isCallConnected]);

  // Interactive Web Audio Ringtone oscillators
  const playRingTone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      gainNode.gain.setValueAtTime(0.06, audioCtx.currentTime); // Soft, authentic retro tone
      
      osc1.start();
      osc2.start();
      
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          audioCtx.close();
        } catch(e){}
      }, 1100);
    } catch (e) {
      console.warn("Ringtone synth failed:", e);
    }
  };

  // Browser level Text-to-Speech engine
  const speakText = (text: string, onStart?: () => void, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel();
      // Filter brackets annotations from transcript text to stay natural
      const cleanText = text.replace(/\*[^*]+\*/g, '').trim();
      if (!cleanText) {
        if (onEnd) onEnd();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Capture compatible English accents
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'))) || 
                    voices.find(v => v.lang.startsWith('en')) || 
                    voices[0];
                    
      if (voice) {
        utterance.voice = voice;
      }
      utterance.pitch = 1.0;
      utterance.rate = 0.95; // Slightly slower for crisp business professionalism

      if (onStart) utterance.onstart = onStart;
      
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      
      utterance.onerror = (err) => {
        console.warn("TTS error callback:", err);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak failed:", e);
      if (onEnd) onEnd();
    }
  };

  // Handle sparring kickoff action
  const startSparring = () => {
    if (simMode === 'voice_call') {
      setPhase(2);
      setIsRinging(true);
      setIsCallConnected(false);
      setCallStatusText('DIALING...');
      
      // Authentic rhythmic dial progression
      playRingTone();
      
      const ringTimer1 = setTimeout(() => {
        setCallStatusText('RINGING...');
        playRingTone();
      }, 1800);
      
      const connectTimer = setTimeout(() => {
        setIsRinging(false);
        setIsCallConnected(true);
        setCallStatusText('CONNECTED');
        setSecondsLeft(120);

        const initialReply = `Hello, this is ${lead?.contact_name || lead?.owner_name || 'the owner'} at ${lead?.business_name || 'Prospect'} speaking. Who's calling?`;
        
        setChatMessages([
          {
            role: 'assistant',
            content: `*DRRING... DRRING...* Hello, this is ${lead?.business_name || 'Prospect'} speaking. Who's calling?`
          }
        ]);

        setIsPersonSpeaking(true);
        speakText(initialReply, 
          () => setIsPersonSpeaking(true), 
          () => setIsPersonSpeaking(false)
        );
      }, 3500);

      (window as any)._ringTimer1 = ringTimer1;
      (window as any)._connectTimer = connectTimer;
    } else {
      setPhase(2);
      setIsCallConnected(true);
      setCallStatusText('CONNECTED');
      // Initialize dialogue tree with business owner answering the phone
      setChatMessages([
        {
          role: 'assistant',
          content: `*DRRING... DRRING...* Hello, this is ${lead?.business_name || 'Prospect'} speaking. Who's calling?`
        }
      ]);
    }
  };

  // Reply generator
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || sendingMessage) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    const newHistory = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newHistory);
    setSendingMessage(true);
    setIsPersonSpeaking(false);
    
    // Stop ongoing speech when user begins talk cycle
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await fetch('/api/ai/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead?.id,
          history: newHistory
        })
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      if (simMode === 'voice_call') {
        setIsPersonSpeaking(true);
        speakText(data.reply, 
          () => setIsPersonSpeaking(true), 
          () => setIsPersonSpeaking(false)
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
  };

  // Skip sparring into scorecard generation
  const handleEvaluate = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase(3);
    setGeneratingScore(true);

    try {
      const response = await fetch('/api/ai/copilot/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          leadId: lead?.id,
          transcript: chatMessages
        })
      });
      const data = await response.json();
      setEvaluation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingScore(false);
    }
  };

  const handleRestart = () => {
    setPhase(1);
    setStreamedText('');
    setSecondsLeft(120);
    setChatMessages([]);
    setEvaluation(null);
    setIsCallConnected(false);
    setIsRinging(false);
    setCallStatusText('READY');
    setIsPersonSpeaking(false);
    setIsListening(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleMicDictation = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("SpeechRecognition start fault:", err);
      }
    }
  };

  if (loadingBriefing) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">Syncing Tactical Briefing co-processor...</p>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Return header */}
      <button
        id="copilot_back_btn"
        onClick={() => setTab('lead-detail')}
        className="inline-flex items-center space-x-2 text-xs text-brand-muted hover:text-[#F0F2F5] mb-6 cursor-pointer group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Exit Co-Pilot and return to lead summary</span>
      </button>

      {/* Progress tracking path bar */}
      <div className="flex bg-[#111318] border border-brand-border rounded-xl p-1 mb-6 text-xs font-mono font-bold uppercase tracking-wider text-center select-none">
        <div className={`flex-1 py-3.5 rounded-lg ${phase === 1 ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted'}`}>
          1. Pre-Call Coaching
        </div>
        <div className={`flex-1 py-3.5 rounded-lg ${phase === 2 ? 'bg-[#1E2028] text-brand-amber' : 'text-brand-muted'}`}>
          2. Live Defensive Spar
        </div>
        <div className={`flex-1 py-3.5 rounded-lg ${phase === 3 ? 'bg-[#1E2028] text-green-400' : 'text-brand-muted'}`}>
          3. Performance Audit
        </div>
      </div>

      {/* PHASE 1: PRE-CALL COACHING */}
      {phase === 1 && (
        <div className="bg-[#111318] border border-brand-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-brand-primary/25">
            <Flame className="w-16 h-16 animate-pulse" />
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-5 h-5 text-brand-primary" />
            <h3 className="font-display font-semibold text-sm text-[#F0F2F5] uppercase tracking-wider">
              YOUR SYSTEM INSIGHTS COACH
            </h3>
          </div>

          {/* Typewriter text output screen */}
          <div className="w-full bg-[#0A0C10] border border-brand-border p-6 rounded-xl mb-6 min-h-60 h-[300px] overflow-y-auto pr-3">
            <pre className="font-mono text-xs sm:text-sm text-green-400 leading-relaxed whitespace-pre-wrap select-all">
              {streamedText || '...'}
            </pre>
          </div>

          {/* SIMULATOR SETUP PREFERENCE INTERFACE */}
          <div className="bg-[#0A0C10] border border-brand-border rounded-xl p-4 mb-6">
            <label className="block text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider mb-3">
              CHOOSE CALL SIMULATION METHOD:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                id="select_sim_mode_text"
                type="button"
                onClick={() => setSimMode('text')}
                className={`p-3.5 rounded-lg border text-left flex flex-col justify-between cursor-pointer transition-all ${
                  simMode === 'text' 
                    ? 'bg-brand-primary/10 border-brand-primary text-[#F0F2F5]' 
                    : 'bg-[#111318] border-brand-border text-brand-muted hover:border-brand-muted'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold block">Standard Text Roleplaying</span>
                  <p className="text-[10px] text-brand-muted mt-1 leading-normal">
                    Familiar speech bubble flow. Ideal for quiet review, scripting, and rapid objection drafting.
                  </p>
                </div>
              </button>

              <button
                id="select_sim_mode_voice_call"
                type="button"
                onClick={() => setSimMode('voice_call')}
                className={`p-3.5 rounded-lg border text-left flex flex-col justify-between cursor-pointer transition-all ${
                  simMode === 'voice_call' 
                    ? 'bg-brand-primary/10 border-brand-primary text-[#F0F2F5]' 
                    : 'bg-[#111318] border-brand-border text-brand-muted hover:border-brand-muted'
                }`}
              >
                <div>
                  <span className="text-xs font-semibold flex items-center space-x-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                    <span>Real Simulated Phone Call</span>
                  </span>
                  <p className="text-[10px] text-brand-muted mt-1 leading-normal">
                    Interactive dial tone, simulated dialing sound, system read-aloud TTS, and microphone-dictated speech pitch capture.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-brand-muted font-sans text-left max-w-md">
              Read carefully. The model has mapped their emotional status based on their local web index deficits. Do not offer discount pitches early.
            </p>
            <button
              id="btn_start_sparring"
              onClick={startSparring}
              className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-brand-primary text-white text-xs font-semibold py-3 px-6 rounded-lg hover:bg-opacity-95 cursor-pointer transform hover:-translate-y-0.5 transition-all"
            >
              <span>{simMode === 'voice_call' ? 'Dial Simulated Call' : 'Kickoff Live Sparring'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: LIVE DEFENsIVE ROLEPLAY CHAT */}
      {phase === 2 && (
        <div className="bg-[#111318] border border-brand-border rounded-xl p-6 relative">
          
          {/* Active Sim Mode: TEXT MODE */}
          {simMode === 'text' && (
            <>
              {/* Header metrics */}
              <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-4">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-amber animate-ping" />
                  <span className="font-mono text-xs font-bold text-brand-amber uppercase tracking-wider">
                    ACTIVE SPARRING SESSION
                  </span>
                </div>

                {/* Sparring Countdown timer */}
                <div className="bg-[#0A0C10] border border-brand-border rounded-lg px-3 py-1.5 font-mono text-xs text-brand-red font-bold">
                  TIMER: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </div>
              </div>

              {/* Dialog bubble loop */}
              <div className="w-full bg-[#0A0C10] border border-brand-border p-5 rounded-xl mb-4 h-96 overflow-y-auto space-y-4">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9px] font-mono text-brand-muted uppercase mb-1">
                      {msg.role === 'user' ? 'Rep [YOU]' : `Prospect [${lead?.business_name}]`}
                    </span>
                    <div className={`p-3.5 rounded-xl text-xs max-w-md leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-brand-primary text-white font-medium rounded-tr-none'
                        : 'bg-[#111318] border border-brand-border text-green-400 font-mono rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Send form */}
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  id="copilot_chat_input"
                  type="text"
                  required
                  disabled={sendingMessage}
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder="Type your phone opening pitch line here..."
                  className="flex-1 bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3.5 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                />
                <button
                  id="btn_send_copilot_message"
                  type="submit"
                  disabled={sendingMessage || !inputMessage.trim()}
                  className="bg-brand-primary hover:bg-opacity-95 text-white p-3.5 rounded-lg cursor-pointer flex items-center justify-center transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* Active Sim Mode: ATMOSPHERIC VOICE PHONE SIMULATOR */}
          {simMode === 'voice_call' && (
            <div className="max-w-md mx-auto bg-[#07090C] border border-brand-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              
              {/* Backlight subtle gradient circles */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

              {/* Ringing State UI screen */}
              {isRinging && (
                <div className="text-center py-12 flex flex-col items-center justify-center min-h-[350px]">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-brand-amber/10 w-20 h-20 rounded-full animate-ping" />
                    <div className="bg-[#121620] border border-brand-amber/30 w-20 h-20 rounded-full flex items-center justify-center text-brand-amber animate-[pulse_2s_infinite]">
                      <Phone className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <span className="font-mono text-xs text-brand-amber uppercase tracking-widest font-bold block mb-1">
                    {callStatusText}
                  </span>
                  
                  <h2 className="font-display font-semibold text-lg text-[#F0F2F5]">
                    {lead?.business_name || 'Prospect'}
                  </h2>
                  <p className="text-[11px] text-brand-muted font-mono mt-1">
                    {lead?.contact_name || lead?.owner_name || 'Business Proprietor'}
                  </p>
                  
                  <div className="mt-8 text-xs text-brand-muted font-mono max-w-xs leading-relaxed text-center">
                    Initiating simulated digital patchboard circuit... Make sure your browser speakers are unmuted.
                  </div>

                  {/* Hang Up immediately during dialing */}
                  <button
                    onClick={handleRestart}
                    className="mt-12 bg-red-600 hover:bg-red-700 text-white rounded-full p-4 cursor-pointer transform hover:scale-105 transition-all shadow-lg"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Connected State UI screen */}
              {isCallConnected && (
                <div className="flex flex-col min-h-[420px] justify-between">
                  
                  {/* Top Caller Identification Block */}
                  <div className="text-center pt-2">
                    <div className="flex items-center justify-center space-x-1.5 mb-1 text-[10px] font-mono font-bold text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span>SEC_SECURE_DIAL // {callStatusText}</span>
                    </div>

                    <h2 className="font-display font-bold text-[#F0F2F5] text-base leading-tight">
                      {lead?.contact_name || lead?.owner_name || 'Business Proprietor'}
                    </h2>
                    <span className="text-[11px] font-mono text-brand-muted block mt-0.5">
                      {lead?.business_name}
                    </span>

                    {/* Sim Call runtime elapsed timer */}
                    <div className="text-[11px] font-mono text-brand-muted mt-2 bg-[#121620] border border-brand-border inline-block px-2.5 py-1 rounded-full">
                      Line Limit Countdown: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                    </div>
                  </div>

                  {/* Advanced Sound Waveform frequency visualizer animation */}
                  <div className="my-6 bg-[#0E1116] border border-brand-border rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[140px]">
                    <div className="absolute top-2 left-3 text-[8px] font-mono font-bold text-brand-muted uppercase">
                      Radio Frequency Signal Feed:
                    </div>

                    {isPersonSpeaking ? (
                      <div className="flex flex-col items-center space-y-2 py-4">
                        <div className="flex items-end justify-center space-x-1.5 h-10 w-48">
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_0.7s_infinite] h-8" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_0.9s_infinite] h-4" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_0.5s_infinite] h-9" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_0.8s_infinite] h-5" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_1.1s_infinite] h-8" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_0.6s_infinite] h-10" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_1.0s_infinite] h-3" />
                          <div className="w-1 bg-green-400 rounded-full animate-[pulse_0.8s_infinite] h-6" />
                        </div>
                        <span className="text-[10px] font-mono text-green-400 animate-pulse uppercase select-none">
                          PROSPECT IS SPEAKING...
                        </span>
                      </div>
                    ) : isListening ? (
                      <div className="flex flex-col items-center space-y-2 py-4">
                        <div className="flex items-end justify-center space-x-1.5 h-10 w-48">
                          <div className="w-1 bg-brand-primary rounded-full animate-[pulse_0.5s_infinite] h-7" />
                          <div className="w-1 bg-brand-primary rounded-full animate-[pulse_0.6s_infinite] h-10" />
                          <div className="w-1 bg-brand-primary rounded-full animate-[pulse_0.4s_infinite] h-5" />
                          <div className="w-1 bg-brand-primary rounded-full animate-[pulse_0.7s_infinite] h-8" />
                          <div className="w-1 bg-brand-primary rounded-full animate-[pulse_0.5s_infinite] h-9" />
                        </div>
                        <span className="text-[10px] font-mono text-brand-primary animate-pulse uppercase select-none font-bold">
                          LISTENING to YOUR VOICE...
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1.5 py-4">
                        <div className="flex items-center justify-center space-x-1.5 h-10 w-48">
                          <div className="w-2 h-2 rounded-full bg-brand-muted/40" />
                          <div className="w-2 h-2 rounded-full bg-brand-muted/40" />
                          <div className="w-2 h-2 rounded-full bg-brand-muted/40" />
                        </div>
                        <span className="text-[9px] font-mono text-brand-muted uppercase select-none">
                          SILENT // PREDICTING NEXT RESPONSE
                        </span>
                      </div>
                    )}

                    {/* Subtitle Teleprompter Area - Critical fallback for reading of owner statement */}
                    <div className="w-full mt-3 border-t border-brand-border/40 pt-2.5 text-center px-2">
                      <p className="text-[11px] font-sans text-brand-muted leading-relaxed max-h-16 overflow-y-auto italic">
                        "{chatMessages[chatMessages.length - 1]?.role === 'assistant' 
                          ? chatMessages[chatMessages.length - 1]?.content.replace(/\*[^*]+\*/g, '') 
                          : 'Speak or type your pitch below to trigger next owner response...'}"
                      </p>
                    </div>
                  </div>

                  {/* Vocal & Keyboard Transcriber console */}
                  <div className="space-y-4">
                    
                    {/* Integrated Transcribe field text */}
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative bg-[#0E1116] border border-brand-border rounded-xl p-2.5 flex items-center gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={isListening ? "Listening to your speech..." : "Or type your vocal pitch alternative here..."}
                        className="flex-1 bg-transparent text-xs text-[#F0F2F5] focus:outline-none"
                        disabled={sendingMessage}
                      />
                      
                      {/* Speech to text microphone toggle tool */}
                      {recognitionSupported && (
                        <button
                          type="button"
                          onClick={toggleMicDictation}
                          title={isListening ? "Stop listening voice" : "Start speaking voice through mic"}
                          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                            isListening 
                              ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/30' 
                              : 'bg-brand-primary/25 border border-brand-primary/40 text-brand-primary hover:bg-brand-primary/40'
                          }`}
                        >
                          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={sendingMessage || !inputMessage.trim()}
                        className="bg-brand-primary text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all cursor-pointer disabled:opacity-40"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Voice simulation control dials interface */}
                    <div className="flex items-center justify-center space-x-6 pb-2">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => {
                            if (typeof window !== 'undefined' && window.speechSynthesis) {
                              window.speechSynthesis.cancel();
                            }
                            setIsPersonSpeaking(false);
                          }}
                          className="bg-[#121620] hover:bg-[#1E2432] border border-brand-border text-brand-muted hover:text-[#F0F2F5] rounded-full p-3.5 cursor-pointer transition-all"
                          title="Mute owner spoken TTS playback"
                        >
                          <VolumeX className="w-4 h-4" />
                        </button>
                        <span className="text-[8px] font-mono text-brand-muted mt-1 uppercase">Mute Audio</span>
                      </div>

                      {/* Hang up outbound trigger immediately to review */}
                      <div className="flex flex-col items-center">
                        <button
                          onClick={handleEvaluate}
                          className="bg-brand-red hover:bg-red-700 text-white rounded-full p-5 shadow-xl hover:scale-105 transform transition-all cursor-pointer border border-brand-red/30"
                          title="Terminate simulation call and sync scorecard"
                        >
                          <PhoneOff className="w-6 h-6" />
                        </button>
                        <span className="text-[8px] font-mono text-brand-muted mt-1 uppercase font-bold text-brand-red">Hang Up & Audit</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => {
                            const lastMsg = chatMessages[chatMessages.length - 1];
                            if (lastMsg && lastMsg.role === 'assistant') {
                              setIsPersonSpeaking(true);
                              speakText(lastMsg.content,
                                () => setIsPersonSpeaking(true),
                                () => setIsPersonSpeaking(false)
                              );
                            }
                          }}
                          className="bg-[#121620] hover:bg-[#1E2432] border border-brand-border text-brand-muted hover:text-[#F0F2F5] rounded-full p-3.5 cursor-pointer transition-all"
                          title="Replay owner last statement"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <span className="text-[8px] font-mono text-brand-muted mt-1 uppercase">Replay TTS</span>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* Manual Finish CTA (Shown only in text mode to avoid cluttering dialer card visual form) */}
          {simMode === 'text' && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-brand-border">
              <span className="text-[10px] text-brand-muted font-sans">
                Test your opening pitch. Try objection handling, or pitching a digital asset audit before finishing.
              </span>
              <button
                id="btn_evaluate_copilot"
                onClick={handleEvaluate}
                className="bg-[#1E2028] hover:bg-brand-red hover:text-white border border-brand-border hover:border-transparent text-brand-muted font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all uppercase tracking-wider"
              >
                Finish call & Evaluate
              </button>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3: AUDIT SCORECARD */}
      {phase === 3 && (
        <div className="bg-[#111318] border border-brand-border rounded-xl p-6">
          {generatingScore ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">
                GEMINI 3.5 EVALUATING SPARRING TRANSCRIPT...
              </p>
            </div>
          ) : evaluation ? (
            <div>
              {/* Score header */}
              <div className="text-center pb-6 border-b border-brand-border mb-6">
                <div className="inline-flex items-center space-x-1.5 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full text-[10px] text-green-400 font-bold mb-3 uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>SESSION AUDIT COMPLETE</span>
                </div>
                <h2 className="font-display font-semibold text-sm text-brand-muted uppercase tracking-wider">
                  Call Readiness Scorecard
                </h2>
                <div className="text-4xl font-display font-bold text-[#F0F2F5] tracking-tight mt-1">
                  {evaluation.readiness_score} <span className="text-xs font-normal text-brand-muted">/ 100</span>
                </div>
              </div>

              {/* Critiques bullet lines */}
              <div className="space-y-6 mb-8 font-sans">
                {/* 1. Strong Points */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider mb-2.5 flex items-center">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Strong Opener & Hooks</span>
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-brand-muted leading-relaxed">
                    {(evaluation.feedback?.strong_points || evaluation.strong_points)?.map((val: string, index: number) => (
                      <li key={index} className="text-[#F0F2F5]">{val}</li>
                    ))}
                    {!((evaluation.feedback?.strong_points || evaluation.strong_points)?.length) && (
                      <li className="text-brand-muted italic">No strong hooks registered.</li>
                    )}
                  </ul>
                </div>

                {/* 2. Lost points */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-brand-amber uppercase tracking-wider mb-2.5 flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Unintentional Momentum loss</span>
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-brand-muted leading-relaxed">
                    {(evaluation.feedback?.weak_points || evaluation.weak_points)?.map((val: string, index: number) => (
                      <li key={index} className="text-[#F0F2F5]">{val}</li>
                    ))}
                    {!((evaluation.feedback?.weak_points || evaluation.weak_points)?.length) && (
                      <li className="text-brand-muted italic">No immediate momentum stumbles spotted.</li>
                    )}
                  </ul>
                </div>

                {/* 3. Missed metrics */}
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-brand-red uppercase tracking-wider mb-2.5 flex items-center">
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Missed Signal points</span>
                  </h4>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-brand-muted leading-relaxed">
                    {(evaluation.feedback?.missed_points || evaluation.missed_points)?.map((val: string, index: number) => (
                      <li key={index} className="text-[#F0F2F5]">{val}</li>
                    ))}
                    {!((evaluation.feedback?.missed_points || evaluation.missed_points)?.length) && (
                      <li className="text-brand-muted italic">All target pressure benchmarks successfully mentioned.</li>
                    )}
                  </ul>
                </div>

                {/* 4. Tips recommend */}
                <div className="bg-[#0A0C10]/40 p-4 rounded-xl border border-brand-border/60">
                  <h4 className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-wider mb-2">
                    COACH'S IMMEDIATE DIAL TIP:
                  </h4>
                  <p className="text-xs font-mono text-brand-muted leading-relaxed">
                    {(evaluation.feedback?.tips || evaluation.tips)?.[0] || 'Keep quiet after presenting the walk-in problem to invite participation.'}
                  </p>
                </div>

                {/* Brutally Honest Reality Check */}
                <div className="bg-[#111318]/45 p-5 rounded-xl border border-brand-border/60 space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold text-brand-primary uppercase tracking-wider flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-1.5 text-[#4F8EF7]" />
                    <span>Reality Check</span>
                  </h4>
                  <p className="text-xs text-[#F0F2F5] leading-relaxed font-sans bg-black/40 p-3.5 rounded-lg border border-brand-border/40">
                    {evaluation.reality_check || evaluation.feedback?.reality_check || "Your messaging is confusing, lacks clarity, and holds high competitive friction. Speak directly to map listing ranking pains rather than generic benefits."}
                  </p>
                </div>

                {/* Hard Stop Warning if should_call is false, or score under 60 */}
                {(!(evaluation.should_call ?? evaluation.feedback?.should_call ?? true) || (evaluation.readiness_score < 60)) && (
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
                      
                      {((evaluation.sentence_rewrites || evaluation.feedback?.sentence_rewrites || []).length > 0) ? (
                        (evaluation.sentence_rewrites || evaluation.feedback?.sentence_rewrites).map((item: any, idx: number) => (
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
                              "Hi sir, we have AI and many features and it helps business."
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-[9px] font-mono text-green-400 font-bold uppercase shrink-0 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/15">
                              Better Version:
                            </span>
                            <p className="text-xs text-[#F0F2F5] bg-green-500/5 border border-green-500/20 px-2.5 py-1.5 rounded-lg leading-relaxed w-full">
                              "Hi, I was looking at your Google Maps listing and noticed you have an active backlog of unanswered customer questions, which is hurting your rankings. We can resolve this to recover your local organic traffic."
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Final Verdict Section */}
                <div className="border-t border-brand-border/40 pt-4 flex flex-col items-center justify-center space-y-2 text-center pb-2">
                  <span className="text-[10px] font-mono font-extrabold text-brand-muted tracking-wider uppercase">FINAL AUDIT VERDICT</span>
                  
                  {(() => {
                    const v = (evaluation.verdict || evaluation.feedback?.verdict || (evaluation.readiness_score >= 80 ? 'Ready To Call' : (evaluation.readiness_score >= 60 ? 'Needs More Practice' : 'Do Not Call Yet')));
                    if (v === 'Ready To Call') {
                      return (
                        <span className="inline-flex items-center space-x-1.5 bg-green-500/10 border border-green-500/30 px-4 py-2 rounded-full text-xs text-green-400 font-black tracking-widest uppercase font-mono shadow-[0_0_15px_rgba(34,197,94,0.15)] select-none">
                          <span>✅ Ready To Call</span>
                        </span>
                      );
                    } else if (v === 'Needs More Practice') {
                      return (
                        <span className="inline-flex items-center space-x-1.5 bg-brand-amber/10 border border-brand-amber/35 px-4 py-2 rounded-full text-xs text-brand-amber font-black tracking-widest uppercase font-mono shadow-[0_0_15px_rgba(245,158,11,0.15)] select-none">
                          <span>⚠️ Needs More Practice</span>
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center space-x-1.5 bg-brand-red/10 border border-brand-red/35 px-4 py-2 rounded-full text-xs text-brand-red font-black tracking-widest uppercase font-mono shadow-[0_0_15px_rgba(239,68,68,0.15)] select-none">
                          <span>❌ Do Not Call Yet</span>
                        </span>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Bottom footer triggers */}
              <div className="flex space-x-2">
                <button
                  id="btn_restart_sparring"
                  onClick={handleRestart}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-[#1E2028] hover:bg-brand-border border border-brand-border text-[#F0F2F5] py-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Try Sparring Again</span>
                </button>
                <button
                  id="btn_exit_copilot_success"
                  onClick={() => setTab('lead-detail')}
                  className="flex-1 bg-brand-primary hover:bg-opacity-95 text-white py-3 rounded-lg text-xs font-semibold cursor-pointer text-center"
                >
                  Confirm and Sync Audit
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="text-xs text-brand-muted">Failed to generate performance scorecard. Try another simulation spar room!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
