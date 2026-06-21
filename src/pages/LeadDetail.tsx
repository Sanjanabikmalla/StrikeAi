import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, Award, AlertCircle, Bot, Zap, Copy, Check, ExternalLink, Calendar, Users, HelpCircle, Smile } from 'lucide-react';
import { Lead } from '../types';

interface LeadDetailProps {
  leadId: string;
  setTab: (tab: string) => void;
  userId: string;
}

export default function LeadDetail({ leadId, setTab, userId }: LeadDetailProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Quick AI Generate outreach state
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachResult, setOutreachResult] = useState<{ email: string; whatsapp: string } | null>(null);
  
  // Copied states
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);

  // Live pressure signal regenerate
  const [regeneratingSignal, setRegeneratingSignal] = useState(false);

  useEffect(() => {
    async function loadLead() {
      try {
        const response = await fetch(`/api/leads/${leadId}`);
        const data = await response.json();
        setLead(data);
      } catch (err) {
        console.error('Error fetching lead details', err);
      } finally {
        setLoading(false);
      }
    }
    if (leadId) loadLead();
  }, [leadId]);

  const handleRegenerateSignal = async () => {
    if (!lead) return;
    setRegeneratingSignal(true);
    try {
      const response = await fetch('/api/ai/pressure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });
      const data = await response.json();
      if (data.pressure_signal) {
        setLead(prev => prev ? { ...prev, pressure_signal: data.pressure_signal } : null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingSignal(false);
    }
  };

  const handleGenerateOutreach = async () => {
    if (!lead) return;
    setShowOutreach(true);
    setOutreachLoading(true);
    setOutreachResult(null);

    try {
      const response = await fetch('/api/ai/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });
      const data = await response.json();
      setOutreachResult(data);
    } catch (e) {
      console.error('Error fetching outreach', e);
    } finally {
      setOutreachLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'email' | 'whatsapp') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
    } else {
      setCopiedWhatsapp(true);
      setTimeout(() => setCopiedWhatsapp(false), 1500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">Decoding target signals...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-brand-red mx-auto mb-4" />
        <h3 className="font-display font-semibold text-lg text-[#F0F2F5]">Target Lead Model Missing</h3>
        <p className="text-xs text-brand-muted mt-2">The requested business parameters could not be scanned in the network.</p>
        <button onClick={() => setTab('search')} className="mt-4 bg-[#111318] hover:bg-[#1E2028] border border-brand-border px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer">
          Go Back to Terminal
        </button>
      </div>
    );
  }

  const strikeDotColors = {
    NOW: 'bg-brand-red',
    SOON: 'bg-brand-amber',
    WAIT: 'bg-brand-muted'
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Return link */}
      <button
        id="btn_back_to_search"
        onClick={() => setTab('search')}
        className="inline-flex items-center space-x-2 text-xs text-brand-muted hover:text-[#F0F2F5] mb-6 transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to prospecting terminal</span>
      </button>

      {/* Hero business name block */}
      <div className="bg-[#111318] border border-brand-border rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {lead.category} Vertical
            </span>
            <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight mt-2">
              {lead.business_name}
            </h1>
            <p className="text-xs text-brand-muted font-sans mt-0.5 uppercase tracking-wide">
              {lead.locality}, {lead.city} • Contact ID: {lead.id}
            </p>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="text-right">
              <span className="text-[10px] font-mono text-brand-muted uppercase tracking-wider block leading-none">
                CALCULATED STRIKE INDEX
              </span>
              <span className="text-2xl font-display font-bold text-[#F0F2F5] tracking-tight block mt-1">
                {lead.score} <span className="text-brand-muted text-xs font-normal">/ 100</span>
              </span>
            </div>

            <div className="h-8 w-[1px] bg-brand-border"></div>

            <span className={`w-3.5 h-3.5 rounded-full ${strikeDotColors[lead.strike_timing]} ${lead.strike_timing === 'NOW' ? 'animate-pulse' : ''}`} />
          </div>
        </div>
      </div>

      {/* Signature Element: The Pressure Card with Left Border Glow */}
      <div className="bg-[#0A0C10] border-l-4 border-brand-red rounded-r-xl border border-brand-border p-6 mb-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
          <span className="font-mono text-[9px] font-bold text-brand-red uppercase tracking-wide">
            {lead.strike_timing === 'NOW' ? 'STRIKE NOW SIGNAL' : 'PREDICTIVE SIGNAL'}
          </span>
        </div>

        <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider mb-3 leading-none font-mono">
          [PSYCHOLOGICAL INSTANT BRIEF]
        </h3>

        <p className="text-xs sm:text-sm font-mono text-[#F0F2F5] leading-relaxed italic border-b border-brand-border pb-4 mb-4 select-all">
          "{lead.pressure_signal}"
        </p>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-brand-muted font-sans">
            Engineered using localized competitor density analysis and digital visibility gaps.
          </p>
          <button
            onClick={handleRegenerateSignal}
            disabled={regeneratingSignal}
            className="text-[10px] font-mono font-semibold text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            {regeneratingSignal ? 'Recalculating...' : 'Regenerate Live API'}
          </button>
        </div>
      </div>

      {/* Call to Actions - Phase Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Co-Pilot button */}
        <button
          id="btn_prepare_co_pilot"
          onClick={() => setTab('copilot')}
          className="bg-[#111318] hover:bg-[#1E2028] border border-brand-border p-5 rounded-xl text-left relative overflow-hidden group cursor-pointer transition-colors"
        >
          <div className="bg-brand-primary/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3">
            <Bot className="w-5 h-5 text-brand-primary" />
          </div>
          <h3 className="font-display font-medium text-sm text-[#F0F2F5]">Prepare and Call Co-Pilot</h3>
          <p className="text-[11px] text-brand-muted mt-1 font-sans leading-relaxed">
            Enter the 2-Phase Briefing Room. Listen to typewriter coaching plans, handle defensive simulated roleplays, and receive Call Readiness evaluations instantly.
          </p>
        </button>

        {/* Lead Psychology & Outreach Intelligence Command Center */}
        <button
          id="btn_lead_psychology_center"
          onClick={() => setTab('psychology')}
          className="bg-brand-primary hover:bg-opacity-95 text-white p-5 rounded-xl text-left border border-transparent shadow-xl relative overflow-hidden group cursor-pointer transition-all"
        >
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-white/5 rounded-full blur-lg group-hover:scale-125 transition-transform" />
          <div className="bg-white/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3">
            <Smile className="w-5 h-5 text-white animate-pulse" />
          </div>
          <h3 className="font-display font-semibold text-sm">Lead Psychology Command Center</h3>
          <p className="text-[11px] text-white/70 mt-1 font-sans leading-relaxed">
            Analyze Decision Maker psychology, access the Emotion Simulator, handle objections with real scripts, and participate in realistic sales sparring arenas.
          </p>
        </button>

        {/* Outreach generator button */}
        <button
          id="btn_generate_outreach"
          onClick={handleGenerateOutreach}
          className="bg-[#111318] hover:bg-[#1E2028] border border-brand-border p-5 rounded-xl text-left relative overflow-hidden group cursor-pointer transition-colors"
        >
          <div className="bg-[#4F8EF7]/10 w-9 h-9 rounded-lg flex items-center justify-center mb-3">
            <Mail className="w-5 h-5 text-brand-primary" />
          </div>
          <h3 className="font-display font-medium text-sm text-[#F0F2F5]">AI Written Outreach Generator</h3>
          <p className="text-[11px] text-brand-muted mt-1 font-sans leading-relaxed">
            Generate customized, high-conversion cold business emails and localized instant WhatsApp message scripts utilizing Gemini 2.0 Flash models.
          </p>
        </button>
      </div>

      {/* Transparent Score Breakdown with Criterion table */}
      <div className="bg-[#111318] border border-brand-border rounded-xl p-5 mb-8">
        <h3 className="font-display font-semibold text-sm text-[#F0F2F5] mb-4">
          Transparent Strike Score Breakdown
        </h3>

        <div className="space-y-3.5 font-sans">
          {/* Website criterion */}
          <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
            <div>
              <div className="text-xs font-medium text-[#F0F2F5]">Missing Digital Portal</div>
              <p className="text-[10px] text-brand-[##6B7280] text-brand-muted mt-0.5">High digital sales potential if website is absent (+25)</p>
            </div>
            <div className="text-xs font-mono font-bold text-[#F0F2F5]">
              {!lead.has_website ? <span className="text-brand-red font-semibold">+25 PTS</span> : <span className="text-[#6B7280]">0 PTS</span>}
            </div>
          </div>

          {/* Social criterion */}
          <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
            <div>
              <div className="text-xs font-medium text-[#F0F2F5]">Untapped Social Presence</div>
              <p className="text-[10px] text-brand-[##6B7280] text-brand-muted mt-0.5">Missing social channels represents a local growth gap (+15)</p>
            </div>
            <div className="text-xs font-mono font-bold text-[#F0F2F5]">
              {!lead.has_social_media ? <span className="text-brand-red font-semibold">+15 PTS</span> : <span className="text-[#6B7280]">0 PTS</span>}
            </div>
          </div>

          {/* Business Age */}
          <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
            <div>
              <div className="text-xs font-medium text-[#F0F2F5]">Growth-Hungry Stage (Age: {lead.business_age_years} years)</div>
              <p className="text-[10px] text-brand-[##6B7280] text-brand-muted mt-0.5">Businesses under 2 years old are eager to expand customer channels (+20)</p>
            </div>
            <div className="text-xs font-mono font-bold text-[#F0F2F5]">
              {lead.business_age_years < 2 ? <span className="text-brand-red font-semibold">+20 PTS</span> : <span className="text-[#6B7280]">0 PTS</span>}
            </div>
          </div>

          {/* Review responses */}
          <div className="flex items-center justify-between border-b border-brand-border pb-2.5">
            <div>
              <div className="text-xs font-medium text-[#F0F2F5]">Overwhelmed Review Management ({lead.google_review_count} Reviews)</div>
              <p className="text-[10px] text-brand-[##6B7280] text-brand-muted mt-0.5">Zero replies to Google Reviews indicates an overwhelmed operations desk (+15)</p>
            </div>
            <div className="text-xs font-mono font-bold text-[#F0F2F5]">
              {(lead.google_review_count > 0 && lead.google_review_responses === 0) ? <span className="text-brand-red font-semibold">+15 PTS</span> : <span className="text-[#6B7280]">0 PTS</span>}
            </div>
          </div>

          {/* Competitor density */}
          <div className="flex items-center justify-between pb-1.5">
            <div>
              <div className="text-xs font-medium text-[#F0F2F5]">Rivals Competitor Siege ({lead.competitor_count_nearby} nearby)</div>
              <p className="text-[10px] text-brand-[##6B7280] text-brand-muted mt-0.5">Under structural local pressure by similar businesses (+15)</p>
            </div>
            <div className="text-xs font-mono font-bold text-[#F0F2F5]">
              {lead.competitor_count_nearby >= 3 ? <span className="text-brand-red font-semibold">+15 PTS</span> : <span className="text-[#6B7280]">0 PTS</span>}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: INTEGRATED AI OUTREACH DRAWER / OVERLAY */}
      {showOutreach && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
          <div className="w-full max-w-2xl bg-[#111318] border border-brand-border rounded-2xl p-6 relative max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-brand-border">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-brand-primary" />
                <h3 className="font-display font-semibold text-base text-[#F0F2F5]">
                  AI Outreach Toolkit
                </h3>
              </div>
              <button
                id="btn_close_outreach_modal"
                onClick={() => setShowOutreach(false)}
                className="text-brand-muted hover:text-[#F0F2F5] text-xs font-semibold bg-[#1E2028] px-3 py-1.5 rounded cursor-pointer"
              >
                Close Model
              </button>
            </div>

            {outreachLoading ? (
              <div className="h-60 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">Generating high-conversion copywriting with Gemini...</p>
                </div>
              </div>
            ) : outreachResult ? (
              <div className="space-y-6">
                {/* Cold Email block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider">
                      HIGH-CONVERSION COLD EMAIL
                    </span>
                    <button
                      id="btn_copy_email"
                      onClick={() => copyToClipboard(outreachResult.email, 'email')}
                      className="inline-flex items-center space-x-1 text-[10px] font-mono font-semibold text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'Copied script!' : 'Copy to clipboard'}</span>
                    </button>
                  </div>
                  <pre className="w-full bg-[#0A0C10] border border-brand-border p-4 rounded-xl font-mono text-xs text-[#F0F2F5] leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                    {outreachResult.email}
                  </pre>
                </div>

                {/* WhatsApp block */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider">
                      LOCALIZED WHATSAPP SCRIPT
                    </span>
                    <button
                      id="btn_copy_whatsapp"
                      onClick={() => copyToClipboard(outreachResult.whatsapp, 'whatsapp')}
                      className="inline-flex items-center space-x-1 text-[10px] font-mono font-semibold text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      {copiedWhatsapp ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWhatsapp ? 'Copied script!' : 'Copy to clipboard'}</span>
                    </button>
                  </div>
                  <pre className="w-full bg-[#0A0C10] border border-brand-border p-4 rounded-xl font-mono text-xs text-[#F0F2F5] leading-relaxed overflow-x-auto whitespace-pre-wrap select-all">
                    {outreachResult.whatsapp}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-brand-muted py-8">
                Failed to generate outreach copywriting. Please try again.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
