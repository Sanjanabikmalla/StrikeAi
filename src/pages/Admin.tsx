import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Sliders, Database, Users, BellRing, Trash2, Edit2, Check, RefreshCw, Send, AlertTriangle, FileUp } from 'lucide-react';
import { User, Lead, ScoringConfig, NotificationLog } from '../types';

interface AdminProps {
  currentUser: User | null;
  setTab: (tab: string) => void;
  setSelectedLeadId: (id: string) => void;
}

export default function Admin({ currentUser, setTab, setSelectedLeadId }: AdminProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'leads' | 'scoring' | 'users' | 'notifications'>('scoring');
  
  // Data layers
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scoringConfigs, setScoringConfigs] = useState<ScoringConfig[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  
  // Recalculating state
  const [recalculating, setRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState('');

  // Notification form
  const [targetUserId, setTargetUserId] = useState('usr_demo');
  const [notifChannel, setNotifChannel] = useState<'email' | 'telegram'>('email');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // Bulk CSV Mock State
  const [csvFileUploaded, setCsvFileUploaded] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      try {
        const uRes = await fetch('/api/admin/users');
        const uData = await uRes.json();
        setUsers(uData);

        const lRes = await fetch('/api/leads/search?All=All');
        const lData = await lRes.json();
        setLeads(lData);

        const sRes = await fetch('/api/admin/scoring');
        const sData = await sRes.json();
        setScoringConfigs(sData);

        const nRes = await fetch('/api/admin/notifications');
        const nData = await nRes.json();
        setNotifications(nData);
      } catch (e) {
        console.error(e);
      }
    }
    if (currentUser?.role === 'admin') {
      loadAdminData();
    }
  }, [currentUser]);

  const handleWeightChange = (criterionName: string, value: number) => {
    setScoringConfigs(prev =>
      prev.map(c => (c.criterion === criterionName ? { ...c, weight: value } : c))
    );
  };

  const handleUpdateScoringWeights = async () => {
    setRecalculating(true);
    setRecalcSuccess('');

    try {
      const response = await fetch('/api/admin/scoring', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoringConfigs)
      });

      if (response.ok) {
        setRecalcSuccess('System weights updated & system-wide Lead ratings dynamically recalculated!');
        setTimeout(() => setRecalcSuccess(''), 4000);
        
        // Reload leads to fetch newly calculated scores
        const lRes = await fetch('/api/leads/search?All=All');
        const lData = await lRes.json();
        setLeads(lData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRecalculating(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this lead?')) return;
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifMessage.trim()) return;

    setSendingNotif(true);
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          channel: notifChannel,
          message: notifMessage.trim()
        })
      });

      if (response.ok) {
        setNotifMessage('');
        // Reload notification history
        const nRes = await fetch('/api/admin/notifications');
        const nData = await nRes.json();
        setNotifications(nData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingNotif(false);
    }
  };

  const handleMockCsvImport = () => {
    setCsvFileUploaded(true);
    setTimeout(() => {
      setCsvFileUploaded(false);
      alert('Mock CSV Importing Complete! 10 newly identified medical clinics have been added to the master Hyderabad dataset with custom calculated strike timings.');
    }, 1500);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-brand-red mx-auto mb-4" />
        <h2 className="font-display font-semibold text-lg text-[#F0F2F5]">Access Revoked: Admin Clearance Required</h2>
        <p className="text-xs text-brand-muted mt-2">Log in with an administrator account to control system scoring weights, monitor notifications logs, and moderate directories.</p>
        <button onClick={() => setTab('login')} className="mt-5 bg-[#1E2028] hover:bg-brand-primary hover:text-white border border-brand-border hover:border-transparent cursor-pointer px-4 py-2.5 rounded-lg text-xs font-semibold select-none transition-colors">
          Log In via Admin Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Title Header */}
      <div className="pb-5 border-b border-brand-border mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-[#F0F2F5] tracking-tight flex items-center space-x-2">
            <Shield className="w-5.5 h-5.5 text-brand-red" />
            <span>Administrator Control Center</span>
          </h1>
          <p className="text-xs text-brand-muted mt-1 font-sans">
            Oversee system weights, moderate seeded datasets, track delivery notifications log registers.
          </p>
        </div>

        <div className="flex bg-[#111318] border border-brand-border rounded-lg p-1 text-xs font-mono font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveAdminTab('scoring')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${activeAdminTab === 'scoring' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
          >
            Scoring Config
          </button>
          <button
            onClick={() => setActiveAdminTab('leads')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${activeAdminTab === 'leads' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
          >
            Leads Set
          </button>
          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${activeAdminTab === 'users' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveAdminTab('notifications')}
            className={`px-3 py-1.5 rounded cursor-pointer transition-colors ${activeAdminTab === 'notifications' ? 'bg-[#1E2028] text-brand-primary' : 'text-brand-muted hover:text-[#F0F2F5]'}`}
          >
            Notifications
          </button>
        </div>
      </div>

      {/* ADMIN TAB 1: SCORING ENGINE WEIGHT SLIDERS */}
      {activeAdminTab === 'scoring' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sliders panel */}
          <div className="md:col-span-2 bg-[#111318] border border-brand-border p-6 rounded-xl space-y-6">
            <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider mb-4 leading-none font-mono">
              Adjust Scoring Criterion Sliders
            </h3>

            {scoringConfigs.map(item => (
              <div key={item.criterion} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#F0F2F5] capitalize">
                    {item.criterion.replace('_', ' ')} Target
                  </span>
                  <span className="font-mono font-bold text-brand-primary">
                    +{item.weight} PTS
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={item.weight}
                  onChange={(e) => handleWeightChange(item.criterion, Number(e.target.value))}
                  className="w-full accent-brand-primary h-1 bg-[#0A0C10] rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-brand-muted font-sans font-light">
                  {item.description}
                </p>
              </div>
            ))}

            {recalcSuccess && (
              <div className="bg-green-500/15 border border-green-500/25 text-green-400 p-4 rounded-xl text-xs flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>{recalcSuccess}</span>
              </div>
            )}

            <button
              id="btn_update_scoring_weights"
              onClick={handleUpdateScoringWeights}
              disabled={recalculating}
              className="w-full bg-brand-primary hover:bg-opacity-95 text-white font-semibold text-xs py-3.5 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
              <span>{recalculating ? 'Dynamic Recalculating Leads...' : 'Save Config & Recalculate System Ratings'}</span>
            </button>
          </div>

          {/* Right sidebar instructions */}
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl h-fit">
            <h4 className="font-mono text-[10px] font-bold text-brand-muted uppercase tracking-wider mb-2.5">
              THE SCORING MATHEMATICS
            </h4>
            <p className="text-xs text-brand-muted leading-relaxed font-sans font-light mb-4 text-left">
              The engine recalculates Strike Indices in real-time. Sliders represent the quantitative credit given to cold dial factors. By tailoring slider proportions, administrators customize target prioritization scopes for specific industries.
            </p>
          </div>
        </div>
      )}

      {/* ADMIN TAB 2: DATASET MANAGEMENT & DELETE ENDPOINTS */}
      {activeAdminTab === 'leads' && (
        <div className="bg-[#111318] border border-brand-border rounded-xl p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-border">
            <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider leading-none font-mono">
              Seeded Master Dataset ({leads.length} Leads)
            </h3>

            {/* CSV Import buttons */}
            <button
              onClick={handleMockCsvImport}
              disabled={csvFileUploaded}
              className="inline-flex items-center space-x-1.5 bg-[#1E2028] hover:bg-[#2A2D39] text-[#F0F2F5] border border-brand-border rounded-lg py-2 px-3.5 text-xs font-semibold cursor-pointer select-none transition-colors"
            >
              <FileUp className="w-4 h-4 text-brand-primary" />
              <span>{csvFileUploaded ? 'Parsing CSV...' : 'Bulk Import CSV'}</span>
            </button>
          </div>

          {/* Table display */}
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#0A0C10] font-mono text-[9px] text-brand-muted uppercase tracking-wider sticky top-0 border-b border-brand-border">
                <tr>
                  <th className="p-3">Business Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Locality</th>
                  <th className="p-3 text-center">Current Score</th>
                  <th className="p-3 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-[#1E2028]/40 transition-colors">
                    <td className="p-3 font-display font-medium text-[#F0F2F5]">{lead.business_name}</td>
                    <td className="p-3 font-mono text-brand-muted uppercase text-[10px]">{lead.category}</td>
                    <td className="p-3 text-center text-brand-muted text-xs">{lead.locality}, {lead.city}</td>
                    <td className="p-3 font-mono font-bold text-center pl-1 text-brand-primary">{lead.score} / 100</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedLeadId(lead.id);
                            setTab('lead-detail');
                          }}
                          className="px-2 py-1 text-[10px] font-semibold text-[#F0F2F5] bg-[#1E2028] hover:bg-[#2A2D39] rounded cursor-pointer"
                        >
                          View Detail
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1 text-brand-red hover:bg-[#FF3B3B]/10 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADMIN TAB 3: USER PROFILES */}
      {activeAdminTab === 'users' && (
        <div className="bg-[#111318] border border-brand-border rounded-xl p-5">
          <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider mb-6 leading-none font-mono">
            User Account Moderation ({users.length} Registered Accounts)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map(u => (
              <div key={u.id} className="bg-[#0A0C10] border border-brand-border p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-display font-semibold text-xs text-[#F0F2F5]">{u.name}</h4>
                  <span className="font-mono text-[9px] text-[#6B7280] uppercase tracking-wider block -mt-0.5">
                    Email ID: {u.email}
                  </span>
                  <span className="text-[10px] text-brand-muted font-sans mt-0.5 block leading-none">
                    Session User: Active Status
                  </span>
                </div>

                <div className="bg-[#111318] border border-brand-border rounded-lg px-3 py-1 text-center font-mono text-[9px] font-bold text-brand-primary uppercase">
                  {u.role} Account
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN TAB 4: DISPATCHED NOTIFICATIONS & NOTIFICATION LOGS */}
      {activeAdminTab === 'notifications' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dispatch Form panel */}
          <div className="bg-[#111318] border border-brand-border p-5 rounded-xl h-fit">
            <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider mb-4 leading-none font-mono flex items-center">
              <BellRing className="w-4 h-4 mr-1.5 text-brand-red" />
              <span>Simulate Lead Signal Alarm Push</span>
            </h3>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1.5">Target Account</label>
                <select
                  value={targetUserId}
                  onChange={e => setTargetUserId(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-2.5 text-[#F0F2F5] focus:outline-none focus:border-brand-primary cursor-pointer font-sans"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1.5">Dispatch Channel</label>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNotifChannel('email')}
                    className={`p-2.5 rounded-lg border text-center font-semibold cursor-pointer transition-colors ${notifChannel === 'email' ? 'border-brand-primary text-brand-primary bg-[#4F8EF7]/5' : 'border-brand-border text-brand-muted bg-[#0A0C10]'}`}
                  >
                    Email SMTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifChannel('telegram')}
                    className={`p-2.5 rounded-lg border text-center font-semibold cursor-pointer transition-colors ${notifChannel === 'telegram' ? 'border-brand-primary text-brand-primary bg-[#4F8EF7]/5' : 'border-brand-border text-brand-muted bg-[#0A0C10]'}`}
                  >
                    Telegram Bot
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-brand-muted mb-1.5">Notification Message</label>
                <textarea
                  placeholder="e.g. System Alert: 3 pharmacies listed as NOW status in Banjara Hills. Review leads catalog."
                  required
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  className="w-full h-20 bg-[#0A0C10] border border-brand-border rounded-lg text-xs p-3 text-[#F0F2F5] focus:outline-none focus:border-brand-primary resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={sendingNotif || !notifMessage.trim()}
                className="w-full bg-brand-primary hover:bg-opacity-95 text-white py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingNotif ? 'Dispatching Push...' : 'Dispatch Alert'}</span>
              </button>
            </form>
          </div>

          {/* History log column */}
          <div className="md:col-span-2 bg-[#111318] border border-brand-border p-5 rounded-xl">
            <h3 className="font-display font-semibold text-xs text-[#F0F2F5] uppercase tracking-wider mb-4 leading-none font-mono">
              System Notification Log Register
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-muted font-mono bg-[#0A0C10] border border-brand-border rounded-xl">
                  Log is empty. Simulate a push alert above.
                </div>
              ) : (
                notifications.map(log => (
                  <div key={log.id} className="bg-[#0A0C10] border border-brand-border p-3.5 rounded-xl flex items-start justify-between font-mono text-[10px] leading-relaxed text-brand-muted">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#F0F2F5]">CHANNEL: {log.channel.toUpperCase()}</span>
                        <span>•</span>
                        <span className={log.status === 'delivered' ? 'text-green-400 font-bold' : 'text-brand-red font-bold'}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-brand-muted font-sans text-xs mt-1 text-left">{log.message}</p>
                      <span className="text-[8px] text-[#6B7280] mt-1.5 block">
                        Dispatched: {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
