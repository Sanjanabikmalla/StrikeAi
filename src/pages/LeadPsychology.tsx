import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Sparkles, 
  Shield, 
  Zap, 
  Send, 
  Smile, 
  Angry, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Check, 
  Copy, 
  FileText, 
  Layers, 
  Flame, 
  Heart, 
  Volume2, 
  ChevronRight, 
  Compass, 
  ExternalLink,
  Crown,
  Lock,
  Skull,
  Activity,
  Award,
  RefreshCw
} from 'lucide-react';
import { Lead } from '../types';

interface LeadPsychologyProps {
  userId: string;
  setTab: (tab: string) => void;
  initialLeadId?: string | null;
}

export default function LeadPsychology({ userId, setTab, initialLeadId }: LeadPsychologyProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Active section inside Psychology Center
  const [activeTab, setActiveTab] = useState<'profiler' | 'objections' | 'studio' | 'simulator'>('profiler');

  // Trigger reveals
  const [revealedTrigger, setRevealedTrigger] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string>('Skeptical');
  const [selectedObjection, setSelectedObjection] = useState<string>('Too Expensive');
  
  // Studio selections
  const [studioChannel, setStudioChannel] = useState<'subjects' | 'openers' | 'emails' | 'whatsapp' | 'linkedin'>('subjects');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Training Arena Simulation states
  const [roleplayRole, setRoleplayRole] = useState<string>('Owner');
  const [roleplayEmotion, setRoleplayEmotion] = useState<string>('Skeptical');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>>([]);
  const [userMsg, setUserMsg] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [trainingScorecard, setTrainingScorecard] = useState<any>(null);
  const [auditingTraining, setAuditingTraining] = useState(false);
  const [showTrainingRewrites, setShowTrainingRewrites] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load all available leads for selection
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads/search');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (data.length > 0) {
          // If initial lead id is provided, select it, otherwise first lead
          const tId = initialLeadId || data[0].id;
          setSelectedLeadId(tId);
          handleSelectLead(tId, data);
        }
      }
    } catch (err) {
      console.error('Error fetching leads in psychology:', err);
    }
  };

  const handleSelectLead = async (leadId: string, currentLeadsList?: Lead[]) => {
    const list = currentLeadsList || leads;
    const found = list.find(l => l.id === leadId);
    if (!found) return;
    setLead(found);
    setLoading(true);
    setProfile(null);
    setTrainingScorecard(null);
    setIsTrainingActive(false);
    setChatHistory([]);

    try {
      const res = await fetch('/api/ai/psychology/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId })
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Error constructing psychology profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Start Training Arena session
  const startTrainingSession = () => {
    setIsTrainingActive(true);
    setTrainingScorecard(null);
    setShowTrainingRewrites(false);
    
    const opener = getPresetOpenerMessage();
    setChatHistory([
      { role: 'assistant', content: opener }
    ]);
  };

  const getPresetOpenerMessage = () => {
    if (roleplayEmotion === 'Angry') {
      return "What are you calling for? Who is this? I told your people already, stop calling my number.";
    }
    if (roleplayEmotion === 'Busy') {
      return "Look, I am deeply caught up on a shipping queue right now. You have literally 20 seconds. What is this?";
    }
    if (roleplayEmotion === 'Skeptical') {
      return `Yeah, this is ${lead?.business_name || 'Owner'}. I don't buy or setup web optimization tools, so what exactly is your pitch? Make it fast.`;
    }
    return `Hello? Yes, this is ${lead?.business_name || 'Owner'} here. How can I help you?`;
  };

  const sendTrainingMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userMsg.trim() || !lead || sendingChat) return;

    const updatedHistory = [...chatHistory, { role: 'user' as const, content: userMsg }];
    setChatHistory(updatedHistory);
    const storedMsg = userMsg;
    setUserMsg('');
    setSendingChat(true);

    try {
      const res = await fetch('/api/ai/psychology/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          role: roleplayRole,
          initialEmotion: roleplayEmotion,
          history: updatedHistory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory([
          ...updatedHistory,
          { role: 'assistant', content: data.reply }
        ]);
        if (data.updatedEmotion) {
          setRoleplayEmotion(data.updatedEmotion);
        }
      }
    } catch (err) {
      console.error('Training chat stream error:', err);
    } finally {
      setSendingChat(false);
    }
  };

  // End and Audit training session
  const auditTrainingSession = async () => {
    if (!lead || chatHistory.length < 2 || auditingTraining) return;
    setAuditingTraining(true);
    try {
      const res = await fetch('/api/ai/psychology/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          role: roleplayRole,
          history: chatHistory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTrainingScorecard(data);
        setIsTrainingActive(false);
      }
    } catch (err) {
      console.error('Audit compilation failed:', err);
    } finally {
      setAuditingTraining(false);
    }
  };

  // Safe helper to auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sendingChat]);

  // Static Fallback lists for Emotions & Objections
  const emotionsList = [
    { label: 'Curious', icon: '🙂', desc: 'Opens up when custom audit findings are shown.', trigger: 'Specific Local Maps facts', error: 'Too lazy generic copy messages' },
    { label: 'Neutral', icon: '😐', desc: 'No active motivation, expects immediate benefit pitch.', trigger: 'Fast quantified commercial upside', error: 'Long introductory rambling' },
    { label: 'Frustrated', icon: '😤', desc: 'Already spent thousands on useless SEO agencies.', trigger: 'Contract-free visual prototype model', error: 'Buzzwords or false promises' },
    { label: 'Angry', icon: '😠', desc: 'Extremely direct, defensive, reacts hard, ready to disconnect.', trigger: 'Apologetic immediate de-escalation', error: 'Trying to argue back or persist' },
    { label: 'Busy', icon: '⏳', desc: 'Actively serving client queues, very brief attention.', trigger: 'Request brief email for custom document link', error: 'Forcing a live scheduling call right away' },
    { label: 'Skeptical', icon: '🤔', desc: 'Suspects every agency is a remote offshore cold spam.', trigger: 'Showing detailed street level photos/details', error: 'Acting overly excited or friendly' },
    { label: 'Price Sensitive', icon: '💰', desc: 'Fears high monthly digital budget bleed.', trigger: 'Visualizing exact cost vs competitor waste', error: 'Discussing packages and flat pricing' },
    { label: 'Not Interested', icon: '🚫', desc: 'Thinks Google Maps reviews do not impact client volumes.', trigger: 'Highlighting top neighbor competitors active capture', error: 'Trying to push high setup contracts' }
  ];

  const objectionsList = [
    {
      label: 'Too Expensive',
      why: 'They lack upfront budget clarity or see standard digital optimization services purely as cost sinks rather than yield machines.',
      meaning: 'They do not trust that your automation system will actually return more cash than it takes.',
      best: '“It makes absolute sense. Our setup is deliberately built to connect directly to customer bookings. Let me show you how preventing just 4 lost reviews covers the entire annual budget.”',
      worst: '“But we have several advanced optimization modules and it really represents massive discount rates right now.”',
      psychologyType: 'Risk Aversion & ROI Anchor',
      example: 'A business paying 15k INR/mo for tools sees zero leads, so they assume all systems are expensive black boxes.'
    },
    {
      label: 'Not Interested',
      why: 'They face direct cognitive overload. They receive ten generic offshore agency spams a week and screen out all digital offers.',
      meaning: 'Your opener sounded exactly like a robotic automation script. They did not hear a unique localized hook.',
      best: '“Understood. Just so you are aware, your direct rival on High Street added answering reviews last week and is now rank-positioned directly ahead of you. No obligation, but here is exactly where your maps rank dropped.”',
      worst: '“Well, but we can help you increase business by over forty percent using our robust system!”',
      psychologyType: 'Disruptive Curiosity & Competitive Contrast',
      example: 'Closing their doors to emails unless you start by showing them a direct screenshot of their missing maps location.'
    },
    {
      label: 'No Budget',
      why: 'They have allocated seasonal cash reserves into physical hardware, inventory rent, or direct team payroll.',
      meaning: 'They cannot justify cash outlay for a non-guaranteed digital service list right now.',
      best: '“That is perfectly fine. We actually don’t charge upfront service fees until we clear your existing reviews backlog and fetch you the first wave of verified traffic.”',
      worst: '“But our tool is super cheap and you will make the money back eventually, I promise.”',
      psychologyType: 'Value Re-Risking & Trust Building',
      example: 'A restaurant owner prioritizing fresh ingredients over software licenses. They need zero-risk friction.'
    },
    {
      label: 'Busy',
      why: 'They are actively handling customers, managing kitchen, staff, or sorting invoicing on a tight schedule.',
      meaning: 'A phone pitch is an immediate high barrier block of their premium operational focus.',
      best: '“I will be absolutely brief. I’ll text you a 45-second video audit of your listing ranking loss to this number. If you like it, we can chat later. If not, you can utilize the tips for free.”',
      worst: '“Can you just give me three minutes? It won’t take long at all and is extremely highly critical.”',
      psychologyType: 'Permission Play & Extreme Respect of Time',
      example: 'A shop supervisor managing three checkouts at midday. They physically cannot engage.'
    },
    {
      label: 'Call Later',
      why: 'They are polite but seeking a fast defensive exit path to get off the phone call.',
      meaning: 'They want to politely redirect you to voicemail or hope you forget to call.',
      best: '“Will do. Would tomorrow at 9:30 AM before your team gets busy work better, or is Thursday afternoon more optimal?”',
      worst: '“But if we call later, we might miss the active promotional rate. Can I just share one quick feature?”',
      psychologyType: 'Alternative Choice Framing',
      example: 'An official stall meant to postpone interaction. Needs structured follow-up commitment.'
    },
    {
      label: 'Send Email',
      why: 'They want to quickly end the speech while maintaining standard executive courtesy.',
      meaning: 'They plan to immediately archive or ignore any generic corporate marketing brochure you send.',
      best: '“I’ll send it over. To ensure it’s not generic spam, should I send our report regarding the 14 reviews backlog or the maps organic recovery plan?”',
      worst: '“Excellent! I will send our full 35-page product features slide deck and standard pricing tables.”',
      psychologyType: 'Active Qualification & Relevance Anchoring',
      example: 'The "circular filing cabinet" response. Forcing options filter keeps them accountable.'
    },
    {
      label: 'Already Have Agency',
      why: 'They already pay a family member, local freelancer, or low-cost agency to run generic digital operations.',
      meaning: 'They believe their bases are fully covered and want to avoid another supplier contract.',
      best: '“That is amazing to hear. We love agencies. Let me send a 1-page gap checklist you can hand to them for free—like checking if your review responses contain google rank index tags.”',
      worst: '“Which agency? They are likely overcharging you and failing to provide active responses.”',
      psychologyType: 'Complimentary Paradox & Independent Audit',
      example: 'Using a complimentary approach to bypass defensive silos and secure an objective audit.'
    }
  ];

  // Radar metrics renderer helper
  const renderRadarChart = () => {
    if (!profile) return null;
    const metrics = profile.prospect_psychology?.radar_metrics || {
      trust_level: 35,
      interest_level: 55,
      buying_intent: 45,
      pain_intensity: 75,
      urgency: 65,
      openness_to_change: 60
    };

    // Calculate dynamic coordinates for an SVG Hexagon Radar
    const labels = [
      { key: 'trust_level', label: 'Trust' },
      { key: 'interest_level', label: 'Interest' },
      { key: 'buying_intent', label: 'Buying Intent' },
      { key: 'pain_intensity', label: 'Pain Intensity' },
      { key: 'urgency', label: 'Urgency' },
      { key: 'openness_to_change', label: 'Openness' }
    ];
    
    const size = 260;
    const center = size / 2;
    const rMax = 90;

    // Helper: calculate x,y on hexagon r scale
    const getCoordinates = (value: number, angleIndex: number) => {
      const angle = (angleIndex * 2 * Math.PI) / 6 - Math.PI / 2;
      const radius = (value / 100) * rMax;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y };
    };

    // Construct polygon points
    const pointsStr = labels.map((l, i) => {
      const { x, y } = getCoordinates(metrics[l.key as keyof typeof metrics] || 50, i);
      return `${x},${y}`;
    }).join(' ');

    // Outer grid rings
    const rings = [20, 40, 60, 80, 100];

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-black/45 rounded-2xl border border-brand-border/40">
        <span className="text-[10px] font-mono font-extrabold text-[#4F8EF7] tracking-widest uppercase mb-4 text-center block">
          PSYCHOMETRIC ALIGNMENT TARGET RADAR
        </span>

        <div className="relative">
          <svg width={size} height={size} className="overflow-visible">
            {/* Draw concentric grid rings */}
            {rings.map((ring, idx) => {
              const ringPoints = labels.map((_, i) => {
                const { x, y } = getCoordinates(ring, i);
                return `${x},${y}`;
              }).join(' ');
              return (
                <polygon
                  key={idx}
                  points={ringPoints}
                  fill="none"
                  stroke="rgba(79,142,247,0.08)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axis Spokes */}
            {labels.map((_, i) => {
              const outerPoint = getCoordinates(100, i);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={outerPoint.x}
                  y2={outerPoint.y}
                  stroke="rgba(79,142,247,0.12)"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
              );
            })}

            {/* Active filled polygon area */}
            <polygon
              points={pointsStr}
              fill="rgba(79,142,247,0.15)"
              stroke="#4F8EF7"
              strokeWidth="2"
              className="transition-all duration-700"
            />

            {/* Axis Nodes and markers */}
            {labels.map((l, i) => {
              const val = metrics[l.key as keyof typeof metrics] || 50;
              const { x, y } = getCoordinates(val, i);
              const labelPos = getCoordinates(126, i);

              return (
                <g key={i}>
                  {/* Glowing Node hover indicator */}
                  <circle
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill="#111318"
                    stroke="#4F8EF7"
                    strokeWidth="1.5"
                  />
                  {/* Metric Labels */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="text-[9px] font-mono font-bold fill-brand-muted tracking-wide"
                  >
                    {l.label} ({val})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-4 w-full text-left max-w-sm pt-4 border-t border-brand-border/20 font-mono">
          {labels.map((l, i) => {
            const val = metrics[l.key as keyof typeof metrics] || 50;
            return (
              <div key={i} className="flex justify-between items-center text-[10px]">
                <span className="text-brand-muted uppercase tracking-wider">{l.label}:</span>
                <span className="font-extrabold text-[#F0F2F5] text-right">{val}/100</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div id="psychology-command-center" className="min-h-screen bg-[#07090D] text-[#F0F2F5] pb-16 font-sans relative overflow-hidden">
      
      {/* Background radial overlays for a premium sci-fi design */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#4F8EF7]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-[5%] w-[400px] h-[400px] bg-[#FF3B30]/3 rounded-full blur-[140px] pointer-events-none" />

      {/* Header section with brand tags */}
      <header className="border-b border-brand-border bg-black/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div id="command-center-branding" className="flex items-center space-x-3 text-left">
          <div className="bg-[#4F8EF7]/10 p-2.5 rounded-xl border border-[#4F8EF7]/30 shadow-[0_0_15px_rgba(79,142,247,0.2)]">
            <Crown className="w-5.5 h-5.5 text-brand-primary animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-brand-primary tracking-widest bg-[#4F8EF7]/15 px-2 py-0.5 rounded border border-[#4F8EF7]/25">
                Premium Sales Module
              </span>
            </div>
            <h1 className="text-sm md:text-base font-black tracking-wider uppercase text-white mt-1">
              Lead Psychology & Outreach Intelligence Command Center
            </h1>
          </div>
        </div>

        {/* Lead Selector & Switcher dropdown */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <label className="text-[10px] font-mono font-bold text-brand-muted uppercase shrink-0">ACTIVE TARGET:</label>
          <select
            value={selectedLeadId}
            onChange={(e) => {
              setSelectedLeadId(e.target.value);
              handleSelectLead(e.target.value);
            }}
            className="bg-[#111318] text-xs font-mono border border-brand-border p-2 rounded-xl text-white outline-none focus:border-[#4F8EF7] transition-all min-w-[200px] max-w-xs block cursor-pointer"
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.business_name} ({l.category})
              </option>
            ))}
          </select>

          {loading && <RefreshCw className="w-4 h-4 text-[#4F8EF7] animate-spin" />}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6 space-y-6">
        
        {/* Active Target Prospect overview header card */}
        {lead && (
          <div className="bg-gradient-to-r from-[#0E1117] to-[#0A0C10] border border-brand-border/70 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute right-0 top-0 w-32 h-full bg-[#4F8EF7]/3 rounded-l-full blur-[35px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-brand-muted tracking-widest block uppercase">// TARGET BUSINESS RECORD</span>
                <div className="flex items-baseline space-x-3">
                  <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">{lead.business_name}</h2>
                  <span className="text-xs text-[#4F8EF7] font-mono bg-[#4F8EF7]/10 px-2.5 py-0.5 rounded-full border border-[#4F8EF7]/20 uppercase">
                    {lead.category}
                  </span>
                </div>
                <p className="text-xs text-brand-muted flex items-center">
                  <Compass className="w-3.5 h-3.5 mr-1.5" />
                  {lead.locality}, {lead.city} • Operational Footprint: {lead.business_age_years} Years
                </p>
              </div>

              {/* Dynamic stats overview panel */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 font-mono">
                <div className="bg-black/45 p-3 rounded-xl border border-brand-border/40 text-left min-w-[125px]">
                  <span className="text-[8px] text-brand-muted uppercase block tracking-wider">CONVERSION POTENTIAL</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className="text-base font-black text-green-400">
                      {profile?.company_analysis?.conversion_potential || (lead.score > 70 ? '88%' : '54%')}
                    </span>
                    <span className="text-[10px] text-brand-muted">HIGH</span>
                  </div>
                </div>

                <div className="bg-black/45 p-3 rounded-xl border border-brand-border/40 text-left min-w-[125px]">
                  <span className="text-[8px] text-brand-muted uppercase block tracking-wider">OUTREACH DIFFICULTY</span>
                  <div className="flex items-baseline space-x-1.5 mt-1">
                    <span className={`text-xs font-extrabold uppercase ${profile?.company_analysis?.outreach_difficulty === 'High' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {profile?.company_analysis?.outreach_difficulty || 'MEDIUM'}
                    </span>
                  </div>
                </div>

                <div className="bg-black/45 p-3 rounded-xl border border-brand-border/40 text-left min-w-[125px] col-span-2 md:col-span-1">
                  <span className="text-[8px] text-brand-muted uppercase block tracking-wider">STRIKE MOMENTUM</span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                    <span className="text-xs font-bold text-[#F0F2F5] uppercase tracking-wider">{lead.strike_timing === 'NOW' ? '⚡ CRITICAL NOW' : 'SOON'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Navigation selector buttons */}
        <div className="flex sm:inline-flex flex-wrap p-1 gap-1 bg-[#101217]/85 border border-brand-border/80 rounded-xl max-w-full font-mono text-xs">
          <button
            onClick={() => setActiveTab('profiler')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${activeTab === 'profiler' ? 'bg-[#4F8EF7]/15 border border-[#4F8EF7]/35 text-[#4F8EF7] font-extrabold shadow-[0_0_10px_rgba(79,142,247,0.1)]' : 'text-brand-muted hover:text-white hover:bg-black/20 font-medium'}`}
          >
            👁️ PROSPECT PROFILE
          </button>
          <button
            onClick={() => setActiveTab('objections')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${activeTab === 'objections' ? 'bg-[#4F8EF7]/15 border border-[#4F8EF7]/35 text-[#4F8EF7] font-extrabold shadow-[0_0_10px_rgba(79,142,247,0.1)]' : 'text-brand-muted hover:text-white hover:bg-black/20 font-medium'}`}
          >
            🛡️ OBJECTION BATTLE CENTER
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${activeTab === 'studio' ? 'bg-[#4F8EF7]/15 border border-[#4F8EF7]/35 text-[#4F8EF7] font-extrabold shadow-[0_0_10px_rgba(79,142,247,0.1)]' : 'text-brand-muted hover:text-white hover:bg-black/20 font-medium'}`}
          >
            ✍️ OUTREACH MESSAGE STUDIO
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${activeTab === 'simulator' ? 'bg-[#4F8EF7]/15 border border-[#4F8EF7]/35 text-[#4F8EF7] font-extrabold shadow-[0_0_10px_rgba(79,142,247,0.1)]' : 'text-brand-muted hover:text-white hover:bg-black/20 font-medium'}`}
          >
            🥋 SCENARIO TRAINING ARENA
          </button>
        </div>

        {/* MAIN MODULE GRAPHICS AREA */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-black/30 rounded-2xl border border-brand-border/40">
            <RefreshCw className="w-8 h-8 text-[#4F8EF7] animate-spin mb-4" />
            <p className="text-sm text-brand-muted font-mono tracking-wider uppercase">SYNCHRONIZING DYNAMIC PSYCHOLOGY METRICS...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* TAB 1: PROSPECT ANALYSIS PROFILE */}
            {activeTab === 'profiler' && profile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                
                {/* Visual Radar target and decision profile */}
                <div className="space-y-6">
                  {renderRadarChart()}

                  {/* Decision Maker Breakdown */}
                  <div className="bg-[#0E1117] p-5 rounded-2xl border border-brand-border/50 space-y-3">
                    <span className="text-[10px] font-mono font-bold text-[#4F8EF7] uppercase tracking-wider">// PERSUASION TARGET</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-mono font-bold uppercase text-brand-muted">Target Title:</h4>
                      <p className="text-sm font-bold text-white">{profile.company_analysis?.decision_maker || 'General Manager & Director'}</p>
                    </div>
                    <div className="space-y-1 pt-1">
                      <h4 className="text-xs font-mono font-bold uppercase text-brand-muted">Outreach Strategic Friction:</h4>
                      <p className="text-xs text-brand-muted leading-relaxed">
                        {profile.company_analysis?.outreach_difficulty_reason}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company & Opportunity details */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Deep Company Analysis */}
                    <div className="bg-[#0E1117]/80 p-5 rounded-2xl border border-brand-border/50 space-y-3.5">
                      <span className="text-[10px] font-mono font-extrabold text-[#4F8EF7] uppercase tracking-wider block border-b border-brand-border/20 pb-2">
                        Company Analysis
                      </span>
                      <div className="space-y-3 text-xs leading-relaxed">
                        <div>
                          <span className="text-brand-muted font-mono font-bold block text-[10px] uppercase">Online Reputation:</span>
                          <p className="text-white mt-0.5">{profile.company_analysis?.online_reputation}</p>
                        </div>
                        <div>
                          <span className="text-brand-muted font-mono font-bold block text-[10px] uppercase">Market Position:</span>
                          <p className="text-white mt-0.5">{profile.company_analysis?.market_positioning}</p>
                        </div>
                        <div>
                          <span className="text-brand-muted font-mono font-bold block text-[10px] uppercase">Services:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {profile.company_analysis?.services?.map((svc: string, idx: number) => (
                              <span key={idx} className="bg-black/45 border border-brand-border/40 px-2 py-0.5 rounded text-[10px] text-brand-muted">
                                {svc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity Matrix */}
                    <div className="bg-[#0E1117]/80 p-5 rounded-2xl border border-brand-border/50 space-y-3.5">
                      <span className="text-[10px] font-mono font-extrabold text-[#4F8EF7] uppercase tracking-wider block border-b border-brand-border/20 pb-2">
                        Opportunity Analysis
                      </span>
                      <div className="space-y-4 text-xs">
                        {profile.opportunity_analysis?.weak_website_areas && (
                          <div>
                            <span className="text-brand-red font-mono font-bold flex items-center text-[10px] uppercase">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Gaps & Weaknesses:
                            </span>
                            <ul className="list-disc pl-4 space-y-1 text-brand-muted text-[11px] mt-1.5">
                              {profile.opportunity_analysis.weak_website_areas.map((gap: string, i: number) => (
                                <li key={i}>{gap}</li>
                              ))}
                              {profile.opportunity_analysis.acquisition_gaps?.map((gap: string, i: number) => (
                                <li key={i}>{gap}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <span className="text-green-400 font-mono font-bold flex items-center text-[10px] uppercase">
                            <Zap className="w-3.5 h-3.5 mr-1" strokeWidth={3} /> Competitive Opportunities:
                          </span>
                          <ul className="list-disc pl-4 space-y-1 text-brand-muted text-[11px] mt-1.5">
                            {profile.opportunity_analysis?.marketing_opportunities?.map((opp: string, i: number) => (
                              <li key={i}>{opp}</li>
                            ))}
                            {profile.opportunity_analysis?.seo_opportunities?.map((opp: string, i: number) => (
                              <li key={i}>{opp}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Core Prospect Psychology Analysis */}
                  <div className="bg-gradient-to-br from-[#0E1117] to-black p-6 rounded-2xl border border-[#4F8EF7]/15 space-y-5">
                    <span className="text-[10px] font-mono font-extrabold text-[#4F8EF7] uppercase tracking-widest block">// PROSPECT PSYCHOLOGY REPORT</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="space-y-3">
                        <div>
                          <span className="text-brand-muted font-mono font-bold block text-[10px] uppercase">Likely Current goals:</span>
                          <ul className="list-disc pl-4 text-white text-[11px] space-y-1 mt-1">
                            {profile.prospect_psychology?.likely_goals?.map((g: string, i: number) => <li key={i}>{g}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="text-brand-muted font-mono font-bold block text-[10px] uppercase">Core Business Frustrations:</span>
                          <p className="text-white mt-1 italic">
                            "{profile.prospect_psychology?.frustrations?.[0] || 'High cost and complexity of standard SEO programs.'}"
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-brand-red font-mono font-bold block text-[10px] uppercase">Where they are bleeding cash:</span>
                          <ul className="list-disc pl-4 text-brand-muted text-[11px] space-y-1 mt-1">
                            {profile.prospect_psychology?.losing_money_reasons?.map((r: string, i: number) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="text-brand-primary font-mono font-bold block text-[10px] uppercase">Optimal Resonant Pitch Value:</span>
                          <p className="text-white mt-1 bg-black/45 p-3 rounded-lg border border-brand-border/40 font-mono text-[10px]">
                            {profile.prospect_psychology?.value_proposition_resonance}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Trigger factors reveal center */}
                    <div className="border-t border-brand-border/30 pt-5 space-y-3">
                      <span className="text-[10px] font-mono font-extrabold text-brand-muted uppercase tracking-wider block">
                        CHOOSE CORE MOTIVATION EMOTIONAL TRIGGER CARD:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {profile.prospect_psychology?.emotional_triggers?.map((trig: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setRevealedTrigger(revealedTrigger === trig.title ? null : trig.title)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 ${revealedTrigger === trig.title ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/50 shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-black/30 border-brand-border/50 hover:border-brand-border/80'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white shrink-0 uppercase">{trig.title}</span>
                              <span className="text-[8px] font-mono text-[#4F8EF7] bg-[#4F8EF7]/10 px-1.5 py-0.5 rounded uppercase">
                                {trig.tag}
                              </span>
                            </div>
                            <span className="text-[9px] text-brand-muted font-mono block mt-1 uppercase tracking-tight">CLICK TO REVEAL STRATEGY</span>
                          </button>
                        ))}
                      </div>

                      {revealedTrigger && (() => {
                        const activeTrig = profile.prospect_psychology.emotional_triggers.find((t: any) => t.title === revealedTrigger);
                        if (!activeTrig) return null;
                        return (
                          <div className="bg-[#101216] p-4 rounded-xl border border-[#4F8EF7]/20 text-xs text-left animate-fadeIn mt-3 space-y-2">
                            <h5 className="font-bold text-[#F0F2F5] uppercase tracking-wide">
                              🎯 STRATEGIC COLD APPROACH: {activeTrig.title} ({activeTrig.tag})
                            </h5>
                            <p className="text-brand-muted leading-relaxed text-[11px]">
                              {activeTrig.description}
                            </p>
                            <div className="bg-black/40 p-3 rounded-lg border border-brand-border/20 mt-2 font-mono text-[10px] text-brand-primary">
                              <span className="text-brand-muted uppercase block tracking-wider font-extrabold text-[8px] mb-1">// ACTIONABLE DIAL DIALOGUE SCRIPT</span>
                              {activeTrig.strategy}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Reply VS Ignore Rules */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-brand-border/30 pt-4 text-xs font-sans">
                      <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 space-y-1">
                        <span className="text-green-400 font-mono font-bold text-[9px] uppercase tracking-widest block">🚀 WHAT WILL TRIGGER A REPLY:</span>
                        <p className="text-brand-muted text-[11px] leading-relaxed">
                          {profile.prospect_psychology?.what_trigger_reply}
                        </p>
                      </div>
                      <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 space-y-1">
                        <span className="text-brand-red font-mono font-bold text-[9px] uppercase tracking-widest block">🚫 WHAT WILL CAUSE THEM TO IGNORE:</span>
                        <p className="text-brand-muted text-[11px] leading-relaxed">
                          {profile.prospect_psychology?.what_trigger_ignore}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: OBJECTION BATTLE CENTER */}
            {activeTab === 'objections' && (
              <div id="objection-battle-arena" className="space-y-6 text-left">
                
                {/* 1. Lead Emotion Simulator Center */}
                <div className="bg-[#0E1117]/80 p-6 rounded-2xl border border-brand-border space-y-4">
                  <div className="flex items-center space-x-2">
                    <Smile className="w-5 h-5 text-brand-primary" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Lead Emotional State Simulator</h3>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Select an emotional state to instantly reveal real-world best responses, recommended strategies, objection handling patterns, and common mistakes to avoid during live cold-calling.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
                    {emotionsList.map((emo) => (
                      <button
                        key={emo.label}
                        onClick={() => setSelectedEmotion(emo.label)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${selectedEmotion === emo.label ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/45 shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-black/45 border-brand-border/40 hover:border-brand-border/70'}`}
                      >
                        <span className="text-2xl block mb-1">{emo.icon}</span>
                        <span className="text-xs font-bold text-white uppercase block">{emo.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Active Emotion details card */}
                  {selectedEmotion && (() => {
                    const activeEmo = emotionsList.find(e => e.label === selectedEmotion);
                    if (!activeEmo) return null;
                    return (
                      <div className="bg-black/40 p-5 rounded-xl border border-[#4F8EF7]/20 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed mt-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-brand-primary block uppercase">PSYCHOLOGICAL PORTRAIT:</span>
                          <p className="text-white text-[11px] leading-relaxed">{activeEmo.desc}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-green-400 block uppercase">🚀 BEST RESPONSE STRATEGY:</span>
                          <p className="text-white text-[11px] leading-relaxed font-mono">{activeEmo.trigger}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono font-bold text-brand-red block uppercase">⚠️ WORST MISTAKES / RE-ROUTES:</span>
                          <p className="text-white text-[11px] leading-relaxed italic">"{activeEmo.error}"</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Objection Battle Center Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Selector List */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono font-extrabold text-brand-muted uppercase tracking-widest block">SELECT ACTIVE DEFENSIVE OBJECTION:</span>
                    <div className="space-y-2">
                      {objectionsList.map((obj) => (
                        <button
                          key={obj.label}
                          onClick={() => setSelectedObjection(obj.label)}
                          className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${selectedObjection === obj.label ? 'bg-gradient-to-r from-[#4F8EF7]/10 to-[#4F8EF7]/5 border-[#4F8EF7]/50 text-white shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-[#0E1117] border-brand-border hover:border-brand-border/80 text-brand-muted hover:text-white'}`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-extrabold uppercase tracking-wide block">{obj.label}</span>
                            <span className="text-[8px] font-mono uppercase text-brand-muted">TRIGGERS: {obj.psychologyType}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-brand-muted shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detail Panel */}
                  <div className="lg:col-span-2 bg-[#0E1117] border border-brand-border p-6 rounded-2xl space-y-5">
                    {(() => {
                      const obj = objectionsList.find(o => o.label === selectedObjection);
                      if (!obj) return null;
                      return (
                        <div className="space-y-5">
                          <div className="flex justify-between items-baseline border-b border-brand-border/40 pb-3">
                            <h4 className="text-base font-black text-white uppercase tracking-tight">OBJECTION DEEP-DIVE: {obj.label}</h4>
                            <span className="text-[9px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 px-2.5 py-0.5 rounded border border-[#F59E0B]/20 uppercase">
                              {obj.psychologyType}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                            <div className="bg-black/35 p-4 rounded-xl border border-brand-border/40 space-y-1">
                              <span className="text-brand-muted block font-mono font-bold text-[10px] uppercase">Why They Said This:</span>
                              <p className="text-white text-[11px]">{obj.why}</p>
                            </div>
                            <div className="bg-black/35 p-4 rounded-xl border border-brand-border/40 space-y-1">
                              <span className="text-[#4F8EF7] block font-mono font-bold text-[10px] uppercase">Hidden Emotional Meaning:</span>
                              <p className="text-white text-[11px] italic">"{obj.meaning}"</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 space-y-2 text-xs">
                              <span className="text-green-400 font-mono font-bold text-[9px] uppercase tracking-widest block">💚 BEST CONSTRUCTIVE ETHICAL SCRIPT RESPONSE Option:</span>
                              <p className="text-white text-[11px] leading-relaxed font-semibold">
                                {obj.best}
                              </p>
                            </div>

                            <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 space-y-2 text-xs">
                              <span className="text-brand-red font-mono font-bold text-[9px] uppercase tracking-widest block">❌ DISASTROUS TYPICAL RESPONSE (STALLS CONVERSION):</span>
                              <p className="text-brand-muted text-[11px] italic leading-relaxed">
                                {obj.worst}
                              </p>
                            </div>
                          </div>

                          <div className="bg-black/40 p-4 rounded-xl border border-brand-border/40 space-y-1 text-xs">
                            <span className="text-brand-muted font-mono font-bold block text-[10px] uppercase">Real-World Practical Scenario Analysis:</span>
                            <p className="text-brand-muted text-[11px] leading-relaxed">
                              {obj.example}
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>

              </div>
            )}

            {/* TAB 3: OUTREACH MESSAGE STUDIO */}
            {activeTab === 'studio' && profile && (
              <div id="outreach-studio-workspace" className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left items-start animate-fadeIn">
                
                {/* Channels workspace list */}
                <div className="space-y-3.5">
                  <span className="text-[10px] font-mono font-extrabold text-brand-muted uppercase tracking-widest block">CHOOSE COLD OUTREACH FLOW:</span>
                  <div className="space-y-2 font-mono text-xs">
                    <button
                      onClick={() => setStudioChannel('subjects')}
                      className={`w-full p-4 rounded-xl border cursor-pointer text-left transition-all ${studioChannel === 'subjects' ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/55 text-white shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-[#0E1117] border-brand-border hover:border-brand-border/80 text-brand-muted hover:text-white'}`}
                    >
                      📧 EMAIL SUBJECTS
                    </button>
                    <button
                      onClick={() => setStudioChannel('openers')}
                      className={`w-full p-4 rounded-xl border cursor-pointer text-left transition-all ${studioChannel === 'openers' ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/55 text-white shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-[#0E1117] border-brand-border hover:border-brand-border/80 text-brand-muted hover:text-white'}`}
                    >
                      🚪 EMAIL OPENER HOOKS
                    </button>
                    <button
                      onClick={() => setStudioChannel('emails')}
                      className={`w-full p-4 rounded-xl border cursor-pointer text-left transition-all ${studioChannel === 'emails' ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/55 text-white shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-[#0E1117] border-brand-border hover:border-brand-border/80 text-brand-muted hover:text-white'}`}
                    >
                      📝 FULL COLD EMAIL BLOCKS
                    </button>
                    <button
                      onClick={() => setStudioChannel('whatsapp')}
                      className={`w-full p-4 rounded-xl border cursor-pointer text-left transition-all ${studioChannel === 'whatsapp' ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/55 text-white shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-[#0E1117] border-brand-border hover:border-brand-border/80 text-brand-muted hover:text-white'}`}
                    >
                      💬 WHATSAPP DIRECT
                    </button>
                    <button
                      onClick={() => setStudioChannel('linkedin')}
                      className={`w-full p-4 rounded-xl border cursor-pointer text-left transition-all ${studioChannel === 'linkedin' ? 'bg-[#4F8EF7]/10 border-[#4F8EF7]/55 text-white shadow-[0_0_15px_rgba(79,142,247,0.15)]' : 'bg-[#0E1117] border-brand-border hover:border-brand-border/80 text-brand-muted hover:text-white'}`}
                    >
                      🔗 LINKEDIN SCRIPTS
                    </button>
                  </div>
                </div>

                {/* Templates and Insights pane */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Channels templates render loop */}
                  {(() => {
                    let items: any[] = [];
                    if (studioChannel === 'subjects') items = profile.outreach_studio?.subject_lines || [];
                    else if (studioChannel === 'openers') items = profile.outreach_studio?.email_openers || [];
                    else if (studioChannel === 'emails') items = profile.outreach_studio?.cold_emails || [];
                    else if (studioChannel === 'whatsapp') items = profile.outreach_studio?.whatsapp_messages || [];
                    else if (studioChannel === 'linkedin') items = profile.outreach_studio?.linkedin_messages || [];

                    return (
                      <div className="space-y-5">
                        {items.map((item, idx) => {
                          const bodyText = item.body || item.text || '';
                          const textToCopy = item.body ? `Subject: ${item.subject}\n\n${item.body}` : bodyText;

                          return (
                            <div key={idx} className="bg-[#0E1117] border border-brand-border p-5 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                              
                              {/* Left main text workspace */}
                              <div className="md:col-span-2 space-y-3">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-[9px] font-mono font-bold text-brand-primary uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/25">
                                    {item.type || item.subject ? 'EMAIL VARIANT' : 'OUTREACH SCRIPT'}
                                  </span>
                                  
                                  {/* Copy validation */}
                                  <button
                                    onClick={() => copyToClipboard(textToCopy)}
                                    className="text-brand-muted hover:text-[#4F8EF7] text-xs font-mono flex items-center space-x-1 cursor-pointer transition-colors"
                                  >
                                    {copiedText === textToCopy ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-green-400" />
                                        <span className="text-green-400 text-[10px]">COPIED</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span className="text-[10px]">COPY TEXT</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                                <div className="bg-black/35 p-4 rounded-xl border border-brand-border/40 font-mono text-[11px] leading-relaxed select-all">
                                  {item.subject && (
                                    <p className="border-b border-brand-border/20 pb-2 mb-2 font-bold text-[#F0F2F5]">
                                      <span className="text-brand-muted">Subject:</span> {item.subject}
                                    </p>
                                  )}
                                  <p className="whitespace-pre-line text-brand-muted leading-relaxed select-all">
                                    {bodyText}
                                  </p>
                                </div>
                              </div>

                              {/* Right Psychology Explanation Panel */}
                              <div className="bg-black/45 p-4.5 rounded-xl border border-brand-border/40 space-y-2.5 self-stretch flex flex-col justify-between">
                                <div className="space-y-1 text-xs">
                                  <h5 className="font-mono font-extrabold text-[#4F8EF7] text-[10px] tracking-wider uppercase">
                                    WHY IT WORKS: {item.tag || 'SPECIFICITY'}
                                  </h5>
                                  <p className="text-brand-muted text-[11px] leading-relaxed mt-1">
                                    {item.why}
                                  </p>
                                </div>

                                {/* Interactive Visual Trigger Tag */}
                                <div className="flex items-center space-x-1.5 font-mono text-[9px] pt-2 border-t border-brand-border/20">
                                  <span className="text-brand-primary">🔥 TRIGGER:</span>
                                  <span className="bg-[#4F8EF7]/10 text-[#4F8EF7] px-2 py-0.5 rounded border border-[#4F8EF7]/30 uppercase font-bold">
                                    {item.tag || 'CURIOSITY'}
                                  </span>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

            {/* TAB 4: SCENARIO TRAINING ARENA */}
            {activeTab === 'simulator' && (
              <div id="training-simulator-arena" className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left items-start animate-fadeIn">
                
                {/* Configuration Panel */}
                <div className="space-y-6">
                  <div className="bg-[#0E1117] p-5 rounded-2xl border border-brand-border space-y-4">
                    <span className="text-[10px] font-mono font-extrabold text-[#4F8EF7] tracking-wider uppercase block">// ARENA CONTROLLER</span>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-brand-muted uppercase">1. CHOOSE YOUR OPPONENT ROLE:</label>
                        <select
                          value={roleplayRole}
                          onChange={(e) => setRoleplayRole(e.target.value)}
                          className="w-full bg-black/45 border border-brand-border/70 p-2 text-xs rounded-xl outline-none text-white focus:border-[#4F8EF7] cursor-pointer"
                        >
                          <option value="CEO">Chief Executive Officer [CEO]</option>
                          <option value="Founder">Director & Founder</option>
                          <option value="Restaurant Owner">Restaurant General Partner</option>
                          <option value="Marketing Head">Head of Marketing</option>
                          <option value="Agency Owner">Agency Owner</option>
                          <option value="Manager">Stores Supervisor</option>
                          <option value="Startup Founder">Tech Startup Lead</option>
                          <option value="Local Business Owner">Local Street Business Proprietor</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-brand-muted uppercase">2. STARTING EMOTION PRESET:</label>
                        <select
                          value={roleplayEmotion}
                          onChange={(e) => setRoleplayEmotion(e.target.value)}
                          className="w-full bg-black/45 border border-brand-border/70 p-2 text-xs rounded-xl outline-none text-white focus:border-[#4F8EF7] cursor-pointer"
                        >
                          <option value="Curious">🙂 Curious</option>
                          <option value="Neutral">😐 Neutral</option>
                          <option value="Angry">😠 Angry</option>
                          <option value="Busy">⏳ Busy</option>
                          <option value="Skeptical">🤔 Skeptical</option>
                          <option value="Price Sensitive">💰 Price Sensitive</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 pt-2">
                        <p className="text-[10px] text-[#FF9500] leading-relaxed font-mono">
                          ⚠️ WARNING: Simulations are realistic. The prospect uses full contextual defenses based on Hyderabad streets.
                        </p>
                      </div>

                      <button
                        onClick={startTrainingSession}
                        className="w-full bg-gradient-to-r from-brand-primary to-[#4F8EF7] text-white font-mono text-xs font-extrabold py-3 rounded-xl hover:opacity-90 shadow-[0_0_15px_rgba(79,142,247,0.3)] transition-opacity uppercase tracking-wider cursor-pointer"
                      >
                        ⚡ START ROLEPLAY SIMULATION
                      </button>
                    </div>
                  </div>

                  {/* Dynamic training progress metrics if active */}
                  {isTrainingActive && (
                    <div className="bg-black/35 p-5 rounded-2xl border border-brand-border/40 space-y-4 text-xs font-mono">
                      <span className="text-[10px] font-extrabold text-brand-primary block uppercase">// SYSTEM DIAGNOSTIC</span>
                      <div className="flex justify-between items-center">
                        <span className="text-brand-muted">Opponent State:</span>
                        <span className="text-white font-bold uppercase">{roleplayRole}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-brand-muted">Emotional Attitude:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${roleplayEmotion === 'Curious' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : (roleplayEmotion === 'Skeptical' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}`}>
                          {roleplayEmotion}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-brand-muted">Rounds complete:</span>
                        <span className="text-white font-bold">{Math.floor(chatHistory.length / 2)} / 5</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Simulation Chat Arena */}
                <div className="lg:col-span-2 space-y-4">
                  {isTrainingActive || chatHistory.length > 0 ? (
                    <div className="bg-[#0E1117] border border-brand-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
                      
                      {/* Chat header */}
                      <header className="px-5 py-4 border-b border-brand-border/40 bg-black/30 flex justify-between items-center">
                        <div className="flex items-center space-x-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-mono font-extrabold uppercase text-[#F0F2F5]">
                            SIMULATOR: PITCH TARGET ({roleplayEmotion})
                          </span>
                        </div>

                        {chatHistory.length > 2 && (
                          <button
                            onClick={auditTrainingSession}
                            disabled={auditingTraining}
                            className="bg-brand-red/10 border border-brand-red/35 hover:bg-brand-red/20 text-brand-red font-mono text-[10px] font-extrabold tracking-wider px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {auditingTraining ? "AUDITING..." : "🛑 END & AUDIT PERFORMANCE"}
                          </button>
                        )}
                      </header>

                      {/* Chat messages */}
                      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-black/20 font-sans">
                        {chatHistory.map((item, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[85%] ${item.role === 'user' ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'}`}
                          >
                            <span className="text-[8px] font-mono text-brand-muted uppercase tracking-wider mb-1">
                              {item.role === 'user' ? 'SALES REPRESENTATIVE' : `PROSPECT [${roleplayRole}]`}
                            </span>
                            <div className={`p-4 rounded-2xl text-xs leading-relaxed ${item.role === 'user' ? 'bg-[#4F8EF7]/10 text-white rounded-tr-none border border-[#4F8EF7]/20 select-all' : 'bg-[#181D26] text-brand-muted rounded-tl-none border border-brand-border/40 select-all'}`}>
                              {item.content}
                            </div>
                          </div>
                        ))}

                        {sendingChat && (
                          <div className="flex flex-col max-w-[80%] mr-auto text-left items-start">
                            <span className="text-[8px] font-mono text-[#4F8EF7] animate-pulse uppercase tracking-wider mb-1">
                              PROSPECT IS CONFLICT-PROCESSING...
                            </span>
                            <div className="bg-[#181D26]/40 p-3 rounded-xl border border-brand-border/30">
                              <span className="inline-flex space-x-1 items-center py-1">
                                <span className="w-1.5 h-1.5 bg-[#4F8EF7] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-[#4F8EF7] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-[#4F8EF7] rounded-full animate-bounce" />
                              </span>
                            </div>
                          </div>
                        )}

                        <div ref={chatEndRef} />
                      </div>

                      {/* Msg submission bar if active */}
                      {isTrainingActive && (
                        <form onSubmit={sendTrainingMessage} className="p-4 border-t border-brand-border/40 bg-black/40 flex items-center gap-3">
                          <input
                            type="text"
                            value={userMsg}
                            onChange={(e) => setUserMsg(e.target.value)}
                            placeholder="Type your phone pitch response or localized objection solution..."
                            className="flex-1 bg-black/50 border border-brand-border/80 px-4 py-3 rounded-xl text-xs outline-none focus:border-[#4F8EF7] transition-all text-white placeholder-brand-muted"
                          />
                          <button
                            type="submit"
                            disabled={!userMsg.trim() || sendingChat}
                            className="bg-[#4F8EF7]/20 border border-[#4F8EF7]/35 hover:bg-[#4F8EF7]/30 text-[#4F8EF7] p-3 rounded-xl transition-all cursor-pointer flex justify-center items-center disabled:opacity-40"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      )}

                    </div>
                  ) : (
                    <div className="bg-[#0E1117] border border-brand-border p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                      <Skull className="w-12 h-12 text-brand-muted animate-pulse" />
                      <div className="space-y-1 bg-black/20 p-5 rounded-2xl border border-brand-border/50 max-w-md">
                        <h4 className="text-sm font-extrabold uppercase text-[#F0F2F5]">Simulation Suite Standing Offline</h4>
                        <p className="text-xs text-brand-muted leading-relaxed">
                          Setup your custom Opponent Role and click the START button to launch interactive, full-speech testing sessions.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* SCORECARD AUDIT PERFORMANCE VIEW */}
                  {trainingScorecard && (
                    <div className="bg-gradient-to-b from-[#0E1117] to-[#040608] border border-brand-border rounded-2xl p-6 space-y-6 shadow-2xl relative text-left">
                      
                      {/* Section header */}
                      <div className="flex justify-between items-baseline border-b border-brand-border/40 pb-3.5">
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono font-bold text-[#FF3B3B] uppercase tracking-widest bg-brand-red/10 px-2 py-0.5 rounded border border-brand-red/25">
                            Brutally Honest Audit Report
                          </span>
                          <h3 className="text-base font-black text-white uppercase tracking-tight">COACH AUDIT SCORECARD</h3>
                        </div>

                        {/* FINAL VERDICT GRAPHIC TAG */}
                        {(() => {
                          const v = trainingScorecard.verdict || 'Do Not Call Yet';
                          if (v === 'Ready To Call') {
                            return (
                              <span className="inline-flex items-center space-x-1.5 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full text-[10px] text-green-400 font-extrabold tracking-wider uppercase font-mono">
                                <span>🚀 Ready To Call</span>
                              </span>
                            );
                          } else if (v === 'Needs More Practice') {
                            return (
                              <span className="inline-flex items-center space-x-1.5 bg-brand-amber/10 border border-brand-amber/35 px-3 py-1.5 rounded-full text-[10px] text-brand-amber font-extrabold tracking-wider uppercase font-mono">
                                <span>⚠️ Needs Practice</span>
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center space-x-1.5 bg-brand-red/10 border border-brand-red/35 px-3 py-1.5 rounded-full text-[10px] text-brand-red font-extrabold tracking-wider uppercase font-mono">
                                <span>❌ Do Not Call Yet</span>
                              </span>
                            );
                          }
                        })()}
                      </div>

                      {/* Visual score indicators */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/45 p-4 rounded-xl border border-brand-border/40 text-center flex flex-col justify-center items-center">
                          <span className="text-[32px] font-black leading-none text-[#4F8EF7]">{trainingScorecard.overall_score || 45}</span>
                          <span className="text-[9px] font-mono font-bold text-brand-muted uppercase mt-2 tracking-wide">OVERALL RATING</span>
                        </div>

                        <div className="bg-black/45 p-4 rounded-xl border border-brand-border/40 text-center flex flex-col justify-center items-center">
                          <span className="text-[32px] font-black leading-none text-green-400">{trainingScorecard.conversion_prob || 18}%</span>
                          <span className="text-[9px] font-mono font-bold text-brand-muted uppercase mt-2 tracking-wide">MEETING PROBABILITY</span>
                        </div>

                        <div className="bg-black/45 p-4 rounded-xl border border-brand-border/40 text-center flex flex-col justify-center items-center">
                          <span className="text-[32px] font-black leading-none text-yellow-500">{trainingScorecard.objection_handling_score || 50}</span>
                          <span className="text-[9px] font-mono font-bold text-brand-muted uppercase mt-2 tracking-wide">OBJECTION TASKING</span>
                        </div>

                        <div className="bg-black/45 p-4 rounded-xl border border-brand-border/40 text-center flex flex-col justify-center items-center">
                          <span className="text-[32px] font-black leading-none text-pink-500">{trainingScorecard.closing_score || 40}</span>
                          <span className="text-[9px] font-mono font-bold text-brand-muted uppercase mt-2 tracking-wide">CLOSING GRADE</span>
                        </div>
                      </div>

                      {/* Brutally Honest Reality Check */}
                      <div className="bg-black/40 p-5 rounded-xl border border-brand-border/50 space-y-2">
                        <h4 className="text-[9px] font-mono font-bold text-brand-primary uppercase tracking-widest flex items-center">
                          <Shield className="w-3.5 h-3.5 mr-1.5" />
                          <span>Reality Check</span>
                        </h4>
                        <p className="text-xs text-brand-muted leading-relaxed italic bg-black/20 p-3 rounded border border-brand-border/30">
                          "{trainingScorecard.reality_check || "Your pitch holds zero strong relevance hooks."}"
                        </p>
                      </div>

                      {/* Hard Stop Warning */}
                      {(!(trainingScorecard.should_call ?? true) || (trainingScorecard.overall_score < 60)) && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start space-x-3">
                          <AlertTriangle className="w-4.5 h-4.5 text-[#FF3B3B] shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1 font-sans">
                            <h4 className="text-xs font-bold text-[#FF3B3B] uppercase tracking-wide">⚠️ Better Not Call Yet</h4>
                            <p className="text-[11px] text-brand-muted leading-relaxed">
                              Based on this pitch, it is recommended that you do not contact prospects yet. Continue practicing and improving your messaging before making real calls.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Criticisms & Mistake reviews */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="bg-black/25 p-4.5 rounded-xl border border-brand-border/30 space-y-2">
                          <span className="text-brand-red font-mono font-bold text-[9px] uppercase tracking-wider block">⚠️ STRUCTURAL WEAKNESS FLAGGED:</span>
                          <ul className="list-disc pl-3 text-brand-muted text-[11px] space-y-1.5">
                            {trainingScorecard.weak_points?.map((wp: string, i: number) => <li key={i}>{wp}</li>)}
                            {trainingScorecard.psych_mistakes?.map((pm: string, i: number) => <li key={i} className="text-[#FF9500] font-mono">{pm}</li>)}
                          </ul>
                        </div>

                        <div className="bg-black/25 p-4.5 rounded-xl border border-brand-border/30 space-y-2">
                          <span className="text-[#4F8EF7] font-mono font-bold text-[9px] uppercase tracking-wider block">💡 COACHING FEEDBACK ACTIONS:</span>
                          <ul className="list-disc pl-3 text-brand-muted text-[11px] space-y-1.5">
                            {trainingScorecard.strong_points?.map((sp: string, i: number) => <li key={i}>{sp}</li>)}
                            <li className="text-green-400 font-mono">Objection Quality: {trainingScorecard.objection_handling_quality}</li>
                            <li className="text-pink-400 font-mono">CTA Action: {trainingScorecard.closing_effectiveness}</li>
                          </ul>
                        </div>
                      </div>

                      {/* Sentence-by-sentence rewrites button */}
                      <div className="bg-[#111318]/45 border border-brand-border/50 rounded-xl overflow-hidden font-sans">
                        <button
                          type="button"
                          onClick={() => setShowTrainingRewrites(!showTrainingRewrites)}
                          className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111318]/60 transition-colors focus:outline-none"
                        >
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                              How You Should Have Said It (Sentence Audit)
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-brand-primary bg-[#4F8EF7]/10 px-2 py-0.5 rounded border border-[#4F8EF7]/20">
                            {showTrainingRewrites ? "HIDE AUDIT" : "EXPAND AUDIT"}
                          </span>
                        </button>

                        {showTrainingRewrites && (
                          <div className="p-4 border-t border-brand-border/40 space-y-4 bg-black/30 text-left">
                            {trainingScorecard.better_responses?.map((item: any, idx: number) => (
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
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>
            )}

          </div>
        )}

      </main>

    </div>
  );
}
