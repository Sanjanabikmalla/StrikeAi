import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, FolderHeart, ChevronRight, AlertCircle, Library } from 'lucide-react';
import { SavedList } from '../types';

interface MyListsProps {
  setTab: (tab: string) => void;
  setSelectedListId: (id: string) => void;
  userId: string;
}

export default function MyLists({ setTab, setSelectedListId, userId }: MyListsProps) {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [newListName, setNewListName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadLists() {
    try {
      const response = await fetch('/api/lists', {
        headers: { 'x-user-id': userId }
      });
      const data = await response.json();
      setLists(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLists();
  }, [userId]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ name: newListName.trim() })
      });

      if (response.ok) {
        setNewListName('');
        loadLists(); // refresh list directory
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-brand-muted font-mono uppercase tracking-wider">Syncing list database directories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page Heading */}
      <div className="pb-5 border-b border-brand-border mb-8">
        <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight flex items-center space-x-2">
          <FolderHeart className="w-5.5 h-5.5 text-brand-primary" />
          <span>Campaign Call Lists</span>
        </h1>
        <p className="text-xs text-brand-muted mt-1 font-sans">
          Organize your target leads into custom directories for systematic co-pilot call sparring runs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side: list creation form */}
        <div className="bg-[#111318] border border-brand-border p-5 rounded-xl h-fit">
          <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider mb-4 leading-none font-mono">
            Create Campaign Directory
          </h3>

          <form onSubmit={handleCreateList} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-mono text-brand-muted uppercase mb-1.5">Directory Name</label>
              <input
                id="input_new_list_name"
                type="text"
                required
                placeholder="e.g. Hyderabad Dental Clinics"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary font-sans"
              />
            </div>

            <button
              id="btn_create_list"
              type="submit"
              disabled={creating || !newListName.trim()}
              className="w-full bg-brand-primary hover:bg-opacity-95 text-white py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>{creating ? 'Creating...' : 'Create List'}</span>
            </button>
          </form>
        </div>

        {/* Right side: directory list folders */}
        <div className="md:col-span-2 space-y-4">
          {lists.length === 0 ? (
            <div className="bg-[#111318] border border-brand-border text-center p-12 rounded-xl">
              <AlertCircle className="w-8 h-8 text-brand-amber mx-auto mb-3" />
              <h4 className="font-display font-semibold text-sm text-[#F0F2F5]">No Campaign Lists Registered</h4>
              <p className="text-xs text-brand-muted max-w-sm mx-auto mt-1 leading-relaxed">
                Enter a named directory in the side creator panel to save high-pressure prospects.
              </p>
            </div>
          ) : (
            lists.map(list => (
              <button
                key={list.id}
                onClick={() => {
                  setSelectedListId(list.id);
                  setTab('list-detail');
                }}
                className="w-full text-left bg-[#111318] hover:bg-[#1E2028] border border-brand-border hover:border-[#4F8EF7]/35 p-5 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-[#4F8EF7]/10 flex items-center justify-center border border-[#4F8EF7]/20 group-hover:scale-110 transition-transform">
                    <Library className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-[#F0F2F5] block group-hover:text-brand-primary transition-colors">
                      {list.name}
                    </h3>
                    <span className="font-mono text-[10px] text-brand-muted block -mt-0.5 uppercase tracking-wider">
                      ID: {list.id} • Registered {new Date(list.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
