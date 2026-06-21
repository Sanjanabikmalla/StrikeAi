import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Navigation, LayoutGrid, Table, Map, Plus, ChevronDown, Check, Info, Library, SlidersHorizontal, AlertTriangle } from 'lucide-react';
import { Lead } from '../types';
import MapView from '../components/MapView';

interface SearchProps {
  setTab: (tab: string) => void;
  setSelectedLeadId: (id: string) => void;
  userId: string;
}

export default function Search({ setTab, setSelectedLeadId, userId }: SearchProps) {
  // Config arrays
  const categories = ['All', 'Restaurant', 'Retail', 'Pharmacy', 'Salon', 'Gym', 'Real Estate', 'IT Services', 'Education', 'Cafe', 'Healthcare', 'Finance', 'Logistics', 'Fashion'];
  const cities = ['All', 'Hyderabad', 'Bangalore', 'Mumbai'];

  // Search parameters state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedStrikeTiming, setSelectedStrikeTiming] = useState('All');
  
  // Sorting parameters
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Leads & view states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'map'>('card');

  // Manual Add Form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    business_name: '',
    category: 'Restaurant',
    city: 'Hyderabad' as 'Hyderabad' | 'Bangalore' | 'Mumbai',
    locality: '',
    phone: '',
    email: '',
    has_website: false,
    has_social_media: false,
    business_age_years: '1.0',
    google_review_count: '0',
    google_review_responses: '0',
    competitor_count_nearby: '0',
    pressure_signal: ''
  });

  // Adding Leads to Saved Lists overlay
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [userLists, setUserLists] = useState<any[]>([]);
  const [activeLeadToSave, setActiveLeadToSave] = useState<string | null>(null);
  const [successSaveMsg, setSuccessSaveMsg] = useState('');

  // Fetch leads with active filters and sorting
  async function fetchLeads() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (selectedCategory !== 'All') q.set('category', selectedCategory);
      if (selectedCity !== 'All') q.set('city', selectedCity);
      if (selectedStrikeTiming !== 'All') q.set('strikeTiming', selectedStrikeTiming);
      q.set('sort', sortBy);
      q.set('order', sortOrder);

      const response = await fetch(`/api/leads/search?${q.toString()}`);
      const data = await response.json();
      setLeads(data);
    } catch (e) {
      console.error('Error fetching leads from API', e);
    } finally {
      setLoading(false);
    }
  }

  // Fetch lists for the save overlay selection
  async function fetchLists() {
    try {
      const response = await fetch('/api/lists', {
        headers: { 'x-user-id': userId }
      });
      const data = await response.json();
      setUserLists(data);
    } catch (e) {
      console.error('Error fetching lists', e);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, [selectedCategory, selectedCity, selectedStrikeTiming, sortBy, sortOrder]);

  useEffect(() => {
    fetchLists();
  }, [userId]);

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.business_name || !newLeadForm.locality) {
      alert('Business name and locality are strictly required.');
      return;
    }

    // Programmatically generate a preliminary signal description if left blank by user
    let finalPressureSignal = newLeadForm.pressure_signal;
    if (!finalPressureSignal) {
      const isYoung = Number(newLeadForm.business_age_years) < 2;
      const compet = Number(newLeadForm.competitor_count_nearby);
      finalPressureSignal = `${newLeadForm.business_name} is facing rapid operational pressure in ${newLeadForm.locality}. ${
        !newLeadForm.has_website ? 'No website makes them invisible to organic search.' : ''
      } ${compet >= 3 ? `There are ${compet} immediate chain rivals nearby capturing walk-in flow.` : ''} Owner responses to reviews are zero. Contact today.`;
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLeadForm,
          pressure_signal: finalPressureSignal
        })
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewLeadForm({
          business_name: '',
          category: 'Restaurant',
          city: 'Hyderabad',
          locality: '',
          phone: '',
          email: '',
          has_website: false,
          has_social_media: false,
          business_age_years: '1.0',
          google_review_count: '0',
          google_review_responses: '0',
          competitor_count_nearby: '0',
          pressure_signal: ''
        });
        fetchLeads(); // reload grid
      }
    } catch (err) {
      console.error('Error manually creating lead', err);
    }
  };

  const handleSaveToCampaignList = async (listId: string) => {
    if (!activeLeadToSave) return;
    try {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: activeLeadToSave })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to save');
        return;
      }

      setSuccessSaveMsg('Lead added successfully to Campaign List!');
      setTimeout(() => {
        setSuccessSaveMsg('');
        setShowSaveModal(false);
        setActiveLeadToSave(null);
      }, 1500);
    } catch (err) {
      console.error('Error adding list item', err);
    }
  };

  // Helper trigger to calculate color coordinates
  const getBadgeColors = (timing: 'NOW' | 'SOON' | 'WAIT') => {
    if (timing === 'NOW') return { dot: 'bg-brand-red animate-ping', text: 'STRIKE NOW', color: 'text-brand-red bg-[#FF3B3B]/10 border-[#FF3B3B]/20' };
    if (timing === 'SOON') return { dot: 'bg-brand-amber', text: 'GOOD TIME', color: 'text-brand-amber bg-[#F5A623]/10 border-[#F5A623]/20' };
    return { dot: 'bg-brand-muted', text: 'WAIT / MONITOR', color: 'text-brand-muted bg-[#1E2028] border-brand-border' };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-brand-border">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight flex items-center space-x-2">
            <SearchIcon className="w-5 h-5 text-brand-primary" />
            <span>Prospecting Terminal</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1 font-sans">
            Scans and analyzes regional business listings to calculate tactical, real-time psychological pressure indicators.
          </p>
        </div>
        
        <button
          id="btn_open_add_lead_modal"
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 flex items-center justify-center space-x-1.5 bg-brand-primary text-white text-xs font-semibold py-2.5 px-4 rounded-lg hover:bg-opacity-95 cursor-pointer transform hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Manual Register Lead</span>
        </button>
      </div>

      {/* Target Search parameters bar */}
      <div className="bg-[#111318] border border-brand-border p-5 rounded-xl mb-6">
        <h3 className="text-[10px] font-mono font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-brand-primary" />
          <span>Prospect Targeting Controls</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Business Vertical</label>
            <div className="relative">
              <select
                id="search_category_select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-2.5 px-3.5 text-[#F0F2F5] appearance-none focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>

          {/* City Dropdown */}
          <div>
            <label className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Metropolitan Scope</label>
            <div className="relative">
              <select
                id="search_city_select"
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-2.5 px-3.5 text-[#F0F2F5] appearance-none focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>

          {/* Trigger State Dropdown */}
          <div>
            <label className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Strike Urgency</label>
            <div className="relative">
              <select
                id="search_urgency_select"
                value={selectedStrikeTiming}
                onChange={e => setSelectedStrikeTiming(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-2.5 px-3.5 text-[#F0F2F5] appearance-none focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
              >
                <option value="All">All Tiers</option>
                <option value="NOW">NOW (STRIKE NOW)</option>
                <option value="SOON">SOON (GOOD TIME)</option>
                <option value="WAIT">WAIT (WAIT / MONITOR)</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>

          {/* Sorting Field */}
          <div>
            <label className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Primary Sort By</label>
            <div className="relative">
              <select
                id="search_sort_select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-2.5 px-3.5 text-[#F0F2F5] appearance-none focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
              >
                <option value="score">Strike Score</option>
                <option value="business_name">Business Name</option>
                <option value="category">Category Type</option>
                <option value="business_age_years">Business Age</option>
                <option value="competitor_count_nearby">Competitor Density</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Sort Sequence</label>
            <div className="relative">
              <select
                id="search_order_select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs py-2.5 px-3.5 text-[#F0F2F5] appearance-none focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
              >
                <option value="desc">Descending [High-to-Low]</option>
                <option value="asc">Ascending [Low-to-High]</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-3 w-3.5 h-3.5 text-brand-muted pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Toolbar & Layout Views Toggle */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-[11px] text-brand-muted font-semibold uppercase">
          Query Results: <span className="text-brand-primary">{leads.length} Target Leads</span> Located
        </span>

        {/* Views toggles */}
        <div className="flex bg-[#111318] border border-brand-border rounded-lg p-1 space-x-1">
          <button
            id="btn_toggle_card_view"
            onClick={() => setViewMode('card')}
            className={`p-2 rounded cursor-pointer transition-colors ${viewMode === 'card' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
            title="Card detail View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn_toggle_table_view"
            onClick={() => setViewMode('table')}
            className={`p-2 rounded cursor-pointer transition-colors ${viewMode === 'table' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
            title="Summary grid View"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn_toggle_map_view"
            onClick={() => setViewMode('map')}
            className={`p-2 rounded cursor-pointer transition-colors ${viewMode === 'map' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
            title="Leaflet Tactical Map"
          >
            <Map className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary views implementations */}
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">Loading regional lead models...</p>
          </div>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-[#111318] text-center border border-brand-border p-12 rounded-xl">
          <AlertTriangle className="w-8 h-8 text-brand-amber mx-auto mb-3" />
          <h3 className="font-display font-semibold text-sm text-[#F0F2F5]">Zero Target Leads Found</h3>
          <p className="text-xs text-brand-muted max-w-md mx-auto mt-1 leading-relaxed font-sans">
            Adjust your business vertical dropdown or change your location scoping coordinates to trace available lead pools.
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[550px]">
          <MapView leads={leads} onSelectLead={(id) => { setSelectedLeadId(id); setTab('lead-detail'); }} />
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-xl border border-brand-border bg-[#111318]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0A0C10] font-mono text-[10px] text-brand-muted uppercase tracking-wider border-b border-brand-border">
              <tr>
                <th className="p-4">Target Name</th>
                <th className="p-4">Locality</th>
                <th className="p-4">Score</th>
                <th className="p-4">Web presence</th>
                <th className="p-4">Rivals nearby</th>
                <th className="p-4">Timing</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {leads.map(lead => {
                const b = getBadgeColors(lead.strike_timing);
                return (
                  <tr key={lead.id} className="hover:bg-[#1E2028]/40 transition-colors">
                    <td className="p-4">
                      <div className="font-display font-medium text-[#F0F2F5]">{lead.business_name}</div>
                      <div className="text-[10px] text-brand-muted font-mono">{lead.category}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[#F0F2F5] text-xs">{lead.locality}</div>
                      <div className="text-[10px] text-brand-muted font-mono">{lead.city}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-center pl-1 shrink-0">
                      <span className="text-[#F0F2F5] bg-[#0A0C10] border border-brand-border px-2 py-0.5 rounded text-xs">
                        {lead.score}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px]">
                      <div className="space-y-0.5">
                        <div className={lead.has_website ? 'text-green-400' : 'text-brand-red font-medium'}>
                          {lead.has_website ? '✓ Portal active' : '✗ No Website'}
                        </div>
                        <div className={lead.has_social_media ? 'text-green-400' : 'text-brand-muted'}>
                          {lead.has_social_media ? '✓ Social active' : '✗ No Social'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-center pl-5 text-brand-primary font-bold">
                      {lead.competitor_count_nearby}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1.5 border px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${b.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                        <span>{b.text}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setActiveLeadToSave(lead.id);
                            setShowSaveModal(true);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold text-brand-primary border border-brand-primary/25 rounded hover:bg-[#4F8EF7]/15 transition-all cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setTab('lead-detail');
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold text-[#F0F2F5] bg-[#1E2028] hover:bg-brand-primary border border-brand-border hover:border-transparent rounded cursor-pointer transition-all"
                        >
                          Strike Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View (with staggered element display effects) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead, idx) => {
            const b = getBadgeColors(lead.strike_timing);
            return (
              <div
                key={lead.id}
                className="bg-[#111318] border border-brand-border rounded-xl p-5 hover:border-[#4F8EF7]/35 shadow-2xl flex flex-col justify-between transition-all"
                style={{ animation: `fadeInUp 0.3s ease-out ${idx * 20}ms both` }}
              >
                <div>
                  {/* Card Header stats */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`inline-flex items-center space-x-1.5 border px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold ${b.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${b.dot}`} />
                      <span>{b.text}</span>
                    </span>

                    <div className="bg-[#0A0C10] border border-brand-border rounded px-2.5 py-1 text-center font-mono text-[10px] font-bold text-[#F0F2F5]">
                      <span className="text-brand-primary">{lead.score}</span>
                      <span className="text-[#6B7280] text-[8px] uppercase tracking-wider leading-none ml-1">Score</span>
                    </div>
                  </div>

                  {/* Business Name */}
                  <div className="mb-4">
                    <h3 className="font-display font-semibold text-sm text-[#F0F2F5] leading-snug truncate">
                      {lead.business_name}
                    </h3>
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider -mt-0.5">
                      {lead.category} • {lead.locality}, {lead.city}
                    </div>
                  </div>

                  {/* Badges parameters */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className={`p-2 rounded bg-[#0A0C10] text-[10px] font-mono leading-none border border-brand-border ${lead.has_website ? 'text-green-400' : 'text-brand-red/90'}`}>
                      {lead.has_website ? '✓ Website active' : '✗ No Website'}
                    </div>
                    <div className={`p-2 rounded bg-[#0A0C10] text-[10px] font-mono leading-none border border-brand-border ${lead.has_social_media ? 'text-green-400' : 'text-brand-muted'}`}>
                      {lead.has_social_media ? '✓ Social media' : '✗ No Social'}
                    </div>
                  </div>

                  {/* One sentence AI-generated predictive pressure indicator teaser */}
                  <div className="border-l border-brand-red bg-[#0A0C10] pr-2.5 pl-3.5 py-2.5 rounded-r-lg border-opacity-70 mb-4 h-20 overflow-y-auto">
                    <p className="font-mono text-[10px] text-brand-muted leading-relaxed italic">
                      "{lead.pressure_signal}"
                    </p>
                  </div>
                </div>

                {/* Card CTA Controls */}
                <div className="flex items-center gap-2 pt-3.5 border-t border-brand-border">
                  <button
                    onClick={() => {
                      setActiveLeadToSave(lead.id);
                      setShowSaveModal(true);
                    }}
                    className="flex-1 bg-[#1E2028] hover:bg-[#2A2D39] text-[#F0F2F5] border border-brand-border rounded-lg py-2.5 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Save Target
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLeadId(lead.id);
                      setTab('lead-detail');
                    }}
                    className="flex-1 bg-brand-primary hover:bg-opacity-95 text-white rounded-lg py-2.5 text-xs font-semibold cursor-pointer text-center transition-opacity"
                  >
                    Strike Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD MANUAL PROSPECT LEAD */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
          <div className="w-full max-w-lg bg-[#111318] border border-brand-border rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-display font-semibold text-base text-[#F0F2F5] mb-4">
              Register New Lead Target Manually
            </h3>

            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Sree Supermarket"
                    value={newLeadForm.business_name}
                    onChange={e => setNewLeadForm({ ...newLeadForm, business_name: e.target.value })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Vertical Category</label>
                  <select
                    value={newLeadForm.category}
                    onChange={e => setNewLeadForm({ ...newLeadForm, category: e.target.value })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Metropolis</label>
                  <select
                    value={newLeadForm.city}
                    onChange={e => setNewLeadForm({ ...newLeadForm, city: e.target.value as any })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  >
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Locality</label>
                  <input
                    type="text"
                    required
                    placeholder="Banjara Hills"
                    value={newLeadForm.locality}
                    onChange={e => setNewLeadForm({ ...newLeadForm, locality: e.target.value })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={newLeadForm.phone}
                    onChange={e => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sree@gmail.com"
                    value={newLeadForm.email}
                    onChange={e => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center space-x-2 bg-[#0A0C10] border border-brand-border p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="add_has_website"
                    checked={newLeadForm.has_website}
                    onChange={e => setNewLeadForm({ ...newLeadForm, has_website: e.target.checked })}
                    className="rounded text-brand-primary focus:ring-0 bg-[#111318] border-brand-border"
                  />
                  <label htmlFor="add_has_website" className="text-[10px] font-mono text-brand-muted leading-none cursor-pointer">Has Website</label>
                </div>

                <div className="flex items-center space-x-2 bg-[#0A0C10] border border-brand-border p-3 rounded-lg">
                  <input
                    type="checkbox"
                    id="add_has_social"
                    checked={newLeadForm.has_social_media}
                    onChange={e => setNewLeadForm({ ...newLeadForm, has_social_media: e.target.checked })}
                    className="rounded text-brand-primary focus:ring-0 bg-[#111318] border-brand-border"
                  />
                  <label htmlFor="add_has_social" className="text-[10px] font-mono text-brand-muted leading-none cursor-pointer">Has Social Profiles</label>
                </div>

                <div>
                  <label className="block text-[8px] font-mono uppercase text-[#6B7280] mb-0.5">Competitor Nearby</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3"
                    value={newLeadForm.competitor_count_nearby}
                    onChange={e => setNewLeadForm({ ...newLeadForm, competitor_count_nearby: e.target.value })}
                    className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-2 text-[#F0F2F5] focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1">Custom AI sentence (Leave blank to generate programmatically)</label>
                <textarea
                  placeholder="Optional pressure commentary..."
                  value={newLeadForm.pressure_signal}
                  onChange={e => setNewLeadForm({ ...newLeadForm, pressure_signal: e.target.value })}
                  className="w-full h-16 bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  id="btn_cancel_add_lead"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-transparent border border-brand-border hover:bg-[#1E2028] text-brand-muted font-semibold text-xs py-3 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn_confirm_add_lead"
                  type="submit"
                  className="flex-1 bg-brand-primary hover:bg-opacity-95 text-white font-semibold text-xs py-3 rounded-lg cursor-pointer"
                >
                  Confirm Register Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SAVE TO CAMPAIGN LIST */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 z-[200]">
          <div className="w-full max-w-sm bg-[#111318] border border-brand-border rounded-2xl p-6 shadow-2xl relative text-center">
            <h3 className="font-display font-semibold text-sm text-[#F0F2F5] mb-4">
              Add Target to Campaign List
            </h3>
            
            {successSaveMsg ? (
              <div className="bg-green-500/15 text-green-400 border border-green-500/25 p-4 rounded-xl text-xs flex items-center justify-center space-x-1 mb-2">
                <Check className="w-4 h-4" />
                <span>{successSaveMsg}</span>
              </div>
            ) : userLists.length === 0 ? (
              <div className="mb-4 text-xs text-brand-muted">
                You have no campaign lists yet. <button onClick={() => setTab('lists')} className="text-brand-primary hover:underline bg-transparent border-none p-0 cursor-pointer font-medium">Create campaign lists here</button>
              </div>
            ) : (
              <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-1">
                {userLists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => handleSaveToCampaignList(list.id)}
                    className="w-full text-left bg-[#0A0C10] hover:bg-[#1E2028] border border-brand-border text-xs text-[#F0F2F5] hover:text-brand-primary font-medium p-3.5 rounded-xl cursor-pointer transition-colors block"
                  >
                    {list.name}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setShowSaveModal(false); setActiveLeadToSave(null); }}
              className="w-full bg-[#1E2028] hover:bg-brand-border text-brand-muted font-semibold text-xs py-3 rounded-lg cursor-pointer text-center block transition-colors border border-brand-border"
            >
              Close Overlay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
