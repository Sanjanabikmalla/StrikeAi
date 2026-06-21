import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Target, CheckCircle, ChevronRight, Activity, Award } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area
} from 'recharts';
import { Lead } from '../types';

interface DashboardProps {
  setTab: (tab: string) => void;
  setSelectedLeadId: (id: string) => void;
  userId: string;
}

export default function Dashboard({ setTab, setSelectedLeadId, userId }: DashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [topStrikes, setTopStrikes] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: { 'x-user-id': userId }
        });
        const data = await response.json();
        setMetrics(data.metrics);
        setCharts(data.charts);
        setTopStrikes(data.topStrikes);
      } catch (e) {
        console.error('Error loading dashboard stats', e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">Compiling dashboard analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-brand-border">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#F0F2F5] tracking-tight">
            Strike Center
          </h1>
          <p className="text-xs text-brand-muted mt-1 font-sans">
            Real-time market pressure indexes and dial co-pilot activity.
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-[#111318] border border-brand-border rounded-xl px-4 py-3 flex items-center space-x-3 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-ping" />
          <div className="text-left">
            <span className="text-[10px] font-mono font-bold text-brand-muted uppercase block leading-none">
              LIVE SIGNAL CO-PILOT
            </span>
            <span className="text-xs font-semibold text-[#F0F2F5] font-mono leading-none block mt-1">
              Active Session System Online
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1 */}
        <div className="bg-[#111318] border border-brand-border p-4 rounded-xl relative overflow-hidden group hover:border-[#4F8EF7]/35 transition-all">
          <TrendingUp className="absolute top-4 right-4 w-4 h-4 text-brand-primary opacity-30 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider block">
            Seeded Database Size
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-[#F0F2F5] tracking-tight block mt-2">
            {metrics?.totalLeads || 150}
          </span>
          <span className="text-[9px] font-mono text-[#6B7280] block mt-1">
            Across Hyderabad, BLR, Mumbai
          </span>
        </div>

        {/* Card 2 */}
        <div className="bg-[#111318] border border-brand-border p-4 rounded-xl relative overflow-hidden group hover:border-brand-primary/35 transition-all">
          <Users className="absolute top-4 right-4 w-4 h-4 text-brand-primary opacity-30 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider block">
            Campaign Lists Created
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-brand-primary tracking-tight block mt-2">
            {metrics?.listsSaved || 2}
          </span>
          <span className="text-[9px] font-mono text-[#6B7280] block mt-1">
            Target groups optimized
          </span>
        </div>

        {/* Card 3 */}
        <div className="bg-[#111318] border border-brand-border p-4 rounded-xl relative overflow-hidden group hover:border-brand-primary/35 transition-all">
          <Target className="absolute top-4 right-4 w-4 h-4 text-brand-primary opacity-30 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider block">
            Leads Contacted
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-[#F0F2F5] tracking-tight block mt-2">
            {metrics?.leadsContacted || 1}
          </span>
          <span className="text-[9px] font-mono text-[#6B7280] block mt-1">
            Excluding initial New statuses
          </span>
        </div>

        {/* Card 4 */}
        <div className="bg-[#111318] border border-brand-border p-4 rounded-xl relative overflow-hidden group hover:border-brand-primary/35 transition-all">
          <CheckCircle className="absolute top-4 right-4 w-4 h-4 text-green-400 opacity-30 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider block">
            Conversion Victory
          </span>
          <span className="text-xl sm:text-2xl font-display font-bold text-green-400 tracking-tight block mt-2">
            {metrics?.conversionRate || 0}%
          </span>
          <span className="text-[9px] font-mono text-[#6B7280] block mt-1">
            Status: Converted / Dispatched
          </span>
        </div>
      </div>

      {/* Main Grid: Charts left, Top Strike recommendations right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Charts Container */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Activity Area chart */}
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-semibold text-sm text-[#F0F2F5]">
                  7-Day Call Pitch Volume
                </h3>
                <p className="text-[10px] text-brand-muted mt-0.5">
                  Typewriter simulation dial loops with audio co-pilots
                </p>
              </div>
              <Activity className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDials" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5A623" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2028"/>
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={10} fontFamily="JetBrains Mono"/>
                  <YAxis stroke="#6B7280" fontSize={10} fontFamily="JetBrains Mono"/>
                  <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#1E2028', color: '#F0F2F5', fontSize: 11 }}/>
                  <Area type="monotone" dataKey="dials" stroke="#4F8EF7" strokeWidth={2} fillOpacity={1} fill="url(#colorDials)" name="Pitches Attempted" />
                  <Area type="monotone" dataKey="appointments" stroke="#F5A623" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" name="Deals Moved Forward" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sub-charts side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category distribution */}
            <div className="bg-[#111318] border border-brand-border p-5 rounded-xl">
              <h3 className="font-display font-semibold text-sm text-[#F0F2F5] mb-4">
                Lead Volume by Category
              </h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E2028" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={9} interval={0} angle={-15} textAnchor="end" height={40}/>
                    <YAxis stroke="#6B7280" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#1E2028', color: '#F0F2F5', fontSize: 10 }} />
                    <Bar dataKey="value" fill="#4F8EF7" radius={[4, 4, 0, 0]} name="Leads Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score distribution */}
            <div className="bg-[#111318] border border-brand-border p-5 rounded-xl">
              <h3 className="font-display font-semibold text-sm text-[#F0F2F5] mb-4">
                Strike Score Distribution
              </h3>
              <div className="h-52 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {charts?.distributionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#111318', borderColor: '#1E2028', color: '#F0F2F5', fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute flex flex-col items-center">
                  <span className="font-mono text-xs text-brand-muted leading-none">HIGH THREAT</span>
                  <span className="font-display text-lg font-bold text-brand-red mt-1">STRIKE NOW</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px] font-mono mt-2">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-red" />
                  <span className="text-brand-muted">Strike Now</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-amber" />
                  <span className="text-brand-muted">Good Time</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6B7280]" />
                  <span className="text-brand-muted">Wait</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Recommended Targets: "Today's Top Strikes" */}
        <div className="space-y-6">
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-brand-red" />
                  <h3 className="font-display font-bold text-sm text-[#F0F2F5] uppercase tracking-wide">
                    Today's Top Strikes
                  </h3>
                </div>
                <span className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 text-brand-red font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full animate-pulse">
                  HOT DEALS
                </span>
              </div>
              <p className="text-[11px] text-brand-muted mb-4 leading-relaxed font-sans">
                These are the highest pressure leads across your campaign lists. Start here for rapid response conversion rates.
              </p>

              <div className="space-y-4">
                {topStrikes.length > 0 ? (
                  topStrikes.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setTab('lead-detail');
                      }}
                      className="w-full text-left bg-[#0A0C10] hover:bg-[#1E2028] border border-brand-border hover:border-[#4F8EF7]/30 p-3.5 rounded-xl flex items-start space-x-3 cursor-pointer group transition-all"
                    >
                      <div className="bg-[#111318] border border-brand-border w-10 h-10 rounded-lg flex flex-col items-center justify-center font-display font-bold text-[#F0F2F5] text-xs">
                        <span className="text-brand-red group-hover:scale-115 transition-transform">{lead.score}</span>
                        <span className="text-[6px] text-brand-muted -mt-0.5 tracking-wide uppercase">SCORE</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-display font-medium text-xs text-[#F0F2F5] block truncate group-hover:text-brand-primary transition-colors">
                          {lead.business_name}
                        </span>
                        <span className="text-[10px] text-brand-muted block truncate font-mono -mt-0.5">
                          {lead.category} • {lead.locality}
                        </span>
                        
                        {/* Compact AI-generated psychological preview */}
                        <p className="text-[10px] text-brand-muted font-mono leading-tight mt-1 px-2 border-l border-brand-red line-clamp-2 italic">
                          "{lead.pressure_signal}"
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all self-center" />
                    </button>
                  ))
                ) : (
                  <div className="bg-[#0A0C10] p-6 rounded-lg border border-brand-border text-center text-brand-muted">
                    <span className="text-xs">No active campaign targets yet. Save leads to a named list to enable Top Strike analytics.</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setTab('search')}
              className="w-full mt-6 bg-[#1E2028] hover:bg-brand-primary hover:text-white border border-brand-border hover:border-transparent text-brand-muted text-xs font-semibold py-3 rounded-lg cursor-pointer text-center flex items-center justify-center space-x-1 transition-all"
            >
              <span>Explore Potential Leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
