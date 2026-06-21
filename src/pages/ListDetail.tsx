import { useState, useEffect } from 'react';
import { ArrowLeft, Library, FileDown, AlertTriangle, Save, Sparkles, ChevronRight, Check, Trash2, HelpCircle } from 'lucide-react';
import { Lead, ListItem } from '../types';

interface ListDetailProps {
  listId: string;
  setTab: (tab: string) => void;
  setSelectedLeadId: (id: string) => void;
  userId: string;
}

interface JoinedListItem extends ListItem {
  lead?: Lead;
  isDuplicate?: boolean;
}

export default function ListDetail({ listId, setTab, setSelectedLeadId, userId }: ListDetailProps) {
  const [listName, setListName] = useState('');
  const [items, setItems] = useState<JoinedListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Status state cycles list
  const STATUS_CYCLE: Array<'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Discarded'> = [
    'New', 'Contacted', 'Qualified', 'Converted', 'Discarded'
  ];

  async function loadListDetails() {
    try {
      const response = await fetch(`/api/lists/${listId}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setListName(data.name);
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (listId) loadListDetails();
  }, [listId]);

  // Click-to-cycle status badge mechanism (No dropdowns!)
  const handleCycleStatus = async (item: JoinedListItem) => {
    const currentIndex = STATUS_CYCLE.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];

    try {
      const response = await fetch(`/api/list-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });

      if (response.ok) {
        // optimistically adjust state
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: nextStatus } : i));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inline notes update handler
  const handleSaveNotes = async (itemId: string, updatedNotes: string) => {
    try {
      const response = await fetch(`/api/list-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedNotes })
      });
      if (response.ok) {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, notes: updatedNotes } : i));
        // Simple silent success triggers
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    // Navigate directly to the public API endpoint for native browser CSV downloads!
    window.open(`/api/lists/${listId}/export`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">Unfolding campaign contacts details...</p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    if (status === 'New') return 'bg-brand-primary/[0.08] hover:bg-brand-primary/15 text-brand-primary border-[#4F8EF7]/25';
    if (status === 'Contacted') return 'bg-brand-amber/[0.08] hover:bg-brand-amber/15 text-brand-amber border-[#F5A623]/25';
    if (status === 'Qualified') return 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/25';
    if (status === 'Converted') return 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/25';
    return 'bg-[#1E2028] hover:bg-brand-border text-brand-muted border-brand-border';
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back to lists */}
      <button
        id="list_detail_back_btn"
        onClick={() => setTab('lists')}
        className="inline-flex items-center space-x-2 text-xs text-brand-muted hover:text-[#F0F2F5] mb-6 cursor-pointer group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to campaign lists</span>
      </button>

      {/* Directory Main parameters header */}
      <div className="bg-[#111318] border border-brand-border p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-lg bg-[#4F8EF7]/10 border border-[#4F8EF7]/20 flex items-center justify-center">
            <Library className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl text-[#F0F2F5] tracking-tight">
              {listName || 'Campaign Directory'}
            </h1>
            <p className="text-xs text-brand-muted font-sans font-medium mt-0.5">
              Contains <span className="text-brand-primary">{items.length} Prospects</span> assigned. Tracking conversions.
            </p>
          </div>
        </div>

        <button
          id="btn_export_list_csv"
          onClick={handleExportCSV}
          disabled={items.length === 0}
          className="flex items-center justify-center space-x-1.5 bg-[#1E2028] border border-brand-border hover:border-brand-primary hover:text-white text-brand-muted text-xs font-semibold py-3 px-4.5 rounded-lg cursor-pointer transition-colors"
        >
          <FileDown className="w-4 h-4" />
          <span>Export Bulk CSV</span>
        </button>
      </div>

      {/* Grid listing prospects */}
      {items.length === 0 ? (
        <div className="bg-[#111318] border border-brand-border rounded-xl p-16 text-center">
          <AlertTriangle className="w-10 h-10 text-brand-amber mx-auto mb-4" />
          <h3 className="font-display font-semibold text-sm text-[#F0F2F5]">Directory is empty</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1 leading-relaxed">
            Scan and locate target leads inside the <button onClick={() => setTab('search')} className="text-brand-primary underline bg-transparent border-none p-0 cursor-pointer font-medium">Prospecting Terminal</button> then select "Save Target".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const lead = item.lead;
            if (!lead) return null;

            return (
              <div
                key={item.id}
                className="bg-[#111318] border border-brand-border rounded-xl p-5 hover:border-brand-primary/25 shadow-2xl transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-brand-border pb-4 mb-4">
                  {/* Prospect details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3
                        onClick={() => {
                          setSelectedLeadId(lead.id);
                          setTab('lead-detail');
                        }}
                        className="font-display font-bold text-[#F0F2F5] hover:text-brand-primary cursor-pointer text-sm truncate"
                      >
                        {lead.business_name}
                      </h3>

                      {/* Duplicate detection warning badge */}
                      {item.isDuplicate && (
                        <span className="inline-flex items-center space-x-1 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 text-brand-red font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>⚠ DUPLICATE SOURCE</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-brand-muted uppercase tracking-wider mt-0.5">
                      {lead.category} • {lead.locality}, {lead.city}
                    </div>
                  </div>

                  {/* Actions & click-to-cycle status badge */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-left hidden md:block">
                      <span className="text-[9px] font-mono text-brand-muted uppercase block leading-none">
                        PROSPECT STATUS CO-ASSIGN
                      </span>
                      <span className="text-[9px] text-brand-muted font-sans mt-1 block">
                        (Click pill below to cycle workflow)
                      </span>
                    </div>

                    {/* Cycle Status pill */}
                    <button
                      id={`cycle_status_btn_${item.id}`}
                      onClick={() => handleCycleStatus(item)}
                      className={`font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full border cursor-pointer select-none transition-all ${getStatusStyle(item.status)}`}
                    >
                      {item.status}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setTab('lead-detail');
                      }}
                      className="bg-[#1E2028] hover:bg-[#2A2D39] text-[#F0F2F5] border border-brand-border py-2 px-3.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Enter Call Room
                    </button>
                  </div>
                </div>

                {/* Inline Comment notes area */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1.5 flex items-center justify-between">
                    <span>CALL JOURNAL NOTES / FOLLOW-UP REMINDERS</span>
                    <span className="text-[8px] italic lowercase text-[#6B7280]">Updates and saves dynamically on blur</span>
                  </label>
                  
                  <textarea
                    id={`notes_textarea_${item.id}`}
                    placeholder="Enter inline call comments (e.g. Call scheduled for tomorrow 3 PM, wants customized landing templates)..."
                    defaultValue={item.notes}
                    onBlur={(e) => handleSaveNotes(item.id, e.target.value)}
                    className="w-full h-16 bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary placeholder:text-brand-muted/70 resize-none font-sans"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
